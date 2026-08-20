import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { formatBRL } from '../../common/utils/format'
import { merchantKey } from '../../common/utils/text'
import { TRANSACTIONS_IMPORTED, TransactionsImportedEvent } from '../imports/import.events'
import { ReportsService } from '../reports/reports.service'
import { Transaction } from '../transactions/transaction.entity'
import { User } from '../users/user.entity'
import { NotificationsService } from './notifications.service'

export const UPCOMING_DAYS = 2
export const PRICE_TOLERANCE = 0.05

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000)
}

export function todayInBrazil(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now)
}

@Injectable()
export class RecurringAlertsService {
  private readonly logger = new Logger(RecurringAlertsService.name)

  constructor(
    private readonly reports: ReportsService,
    private readonly notifications: NotificationsService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>
  ) {}

  @Cron('0 8 * * *', { name: 'upcoming-charges', timeZone: 'America/Sao_Paulo' })
  async dailyCheck(): Promise<void> {
    const today = todayInBrazil()
    const users = await this.users.find({ select: { id: true } })
    let sent = 0
    for (const user of users) sent += await this.checkUpcoming(user.id, today)
    this.logger.log({ users: users.length, sent }, 'Verificação diária de assinaturas')
  }

  async checkUpcoming(userId: string, today: string): Promise<number> {
    const month = today.slice(0, 7)
    const { charges } = await this.reports.recurring(userId, month)
    const limit = addDays(today, UPCOMING_DAYS)
    let sent = 0
    for (const charge of charges) {
      if (charge.nextDate < today || charge.nextDate > limit) continue
      const days = daysBetween(today, charge.nextDate)
      const when = days === 0 ? 'hoje' : days === 1 ? 'amanhã' : `em ${days} dias`
      const created = await this.notifications.notify(userId, {
        kind: 'upcoming_charge',
        title: `${charge.description} cobra ${formatBRL(-charge.averageAmount)} ${when}`,
        body: `Pelo seu histórico, ${charge.description} cobra cerca de ${formatBRL(-charge.averageAmount)} todo mês. A próxima cobrança deve cair em ${charge.nextDate.split('-').reverse().join('/')}.`,
        dedupeKey: `upcoming:${charge.key}:${charge.nextDate}`,
        data: { key: charge.key, nextDate: charge.nextDate, amount: charge.averageAmount }
      })
      if (created) sent++
    }
    return sent
  }

  @OnEvent(TRANSACTIONS_IMPORTED, { async: true })
  async onImported(event: TransactionsImportedEvent): Promise<void> {
    try {
      await this.checkPriceIncreases(event.userId, event.batchId)
    } catch (error) {
      this.logger.error({ err: error, batchId: event.batchId }, 'Falha ao verificar aumento de assinaturas')
    }
  }

  async checkPriceIncreases(userId: string, batchId: string): Promise<number> {
    const fresh = await this.transactions.find({
      where: { userId, importBatchId: batchId },
      select: { id: true, date: true, description: true, amount: true }
    })
    const spending = fresh.filter((t) => t.amount < 0)
    if (!spending.length) return 0
    const latest = spending.reduce((max, t) => (t.date > max ? t.date : max), spending[0].date)
    const { charges } = await this.reports.recurring(userId, latest.slice(0, 7), batchId)
    const byKey = new Map(charges.map((c) => [c.key, c]))
    let sent = 0
    for (const t of spending) {
      const charge = byKey.get(merchantKey(t.description))
      if (!charge) continue
      const before = Math.abs(charge.averageAmount)
      const now = Math.abs(t.amount)
      if (now <= before * (1 + PRICE_TOLERANCE)) continue
      const pct = Math.round(((now - before) / before) * 100)
      const created = await this.notifications.notify(userId, {
        kind: 'price_increase',
        title: `${charge.description} ficou ${pct}% mais cara`,
        body: `A cobrança de ${t.date.split('-').reverse().join('/')} veio ${formatBRL(now)}. Nos meses anteriores era cerca de ${formatBRL(before)}.`,
        dedupeKey: `price:${charge.key}:${t.date.slice(0, 7)}`,
        data: { key: charge.key, before, now, transactionId: t.id }
      })
      if (created) sent++
    }
    return sent
  }
}
