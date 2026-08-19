import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, Repository } from 'typeorm'
import { monthRange, shiftMonth } from '../../common/utils/dates'
import { merchantKey } from '../../common/utils/text'
import { Category } from '../categories/category.entity'
import { Transaction } from '../transactions/transaction.entity'
import { detectRecurring, RecurringCharge } from './recurring'

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

export interface CategorySpend {
  categoryId: string | null
  name: string
  color: string
  kind: string
  total: number
  count: number
  budget: number | null
}

export interface MonthSummary {
  month: string
  income: number
  expense: number
  balance: number
  previous: { income: number; expense: number }
  byCategory: CategorySpend[]
  daily: { day: number; expense: number; cumulative: number }[]
  topMerchants: { name: string; total: number; count: number }[]
  transfers: number
  uncategorized: number
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>,
    @InjectRepository(Category) private readonly categories: Repository<Category>
  ) {}

  private check(month: string): void {
    if (!MONTH.test(month)) throw new BadRequestException('Use o mês no formato AAAA-MM')
  }

  private totals(userId: string, start: string, end: string) {
    return this.transactions
      .createQueryBuilder('t')
      .leftJoin('t.category', 'c')
      .select("COALESCE(SUM(CASE WHEN t.amount > 0 AND (c.kind IS NULL OR c.kind <> 'transfer') THEN t.amount END), 0)::int", 'income')
      .addSelect("COALESCE(SUM(CASE WHEN t.amount < 0 AND (c.kind IS NULL OR c.kind <> 'transfer') THEN t.amount END), 0)::int", 'expense')
      .where('t.user_id = :userId AND t.date BETWEEN :start AND :end', { userId, start, end })
      .getRawOne<{ income: number; expense: number }>()
      .then((r) => ({ income: r?.income ?? 0, expense: r?.expense ?? 0 }))
  }

  async summary(userId: string, month: string): Promise<MonthSummary> {
    this.check(month)
    const { start, end } = monthRange(month)
    const prev = monthRange(shiftMonth(month, -1))

    const [current, previous, categories, rows] = await Promise.all([
      this.totals(userId, start, end),
      this.totals(userId, prev.start, prev.end),
      this.categories.find({ where: { userId } }),
      this.transactions.find({
        where: { userId, date: Between(start, end) },
        select: { id: true, date: true, amount: true, description: true, categoryId: true },
        order: { date: 'ASC' }
      })
    ])

    const byId = new Map(categories.map((c) => [c.id, c]))
    const spend = new Map<string, CategorySpend>()
    let transfers = 0
    let uncategorized = 0
    for (const t of rows) {
      const c = t.categoryId ? byId.get(t.categoryId) : undefined
      if (c?.kind === 'transfer') {
        transfers++
        continue
      }
      if (!c) uncategorized++
      const key = c?.id ?? 'none'
      const entry = spend.get(key) ?? {
        categoryId: c?.id ?? null,
        name: c?.name ?? 'Sem categoria',
        color: c?.color ?? '#a0a7ae',
        kind: c?.kind ?? (t.amount < 0 ? 'expense' : 'income'),
        total: 0,
        count: 0,
        budget: c?.monthlyBudget ?? null
      }
      entry.total += t.amount
      entry.count++
      spend.set(key, entry)
    }
    for (const c of categories) {
      if (c.kind === 'expense' && c.monthlyBudget && !spend.has(c.id)) {
        spend.set(c.id, { categoryId: c.id, name: c.name, color: c.color, kind: c.kind, total: 0, count: 0, budget: c.monthlyBudget })
      }
    }

    const lastDay = Number(end.slice(8, 10))
    const perDay = new Array(lastDay).fill(0)
    const merchants = new Map<string, { name: string; total: number; count: number }>()
    for (const t of rows) {
      const c = t.categoryId ? byId.get(t.categoryId) : undefined
      if (t.amount >= 0 || c?.kind === 'transfer') continue
      perDay[Number(t.date.slice(8, 10)) - 1] += t.amount
      const key = merchantKey(t.description) || t.description
      const m = merchants.get(key) ?? { name: t.description, total: 0, count: 0 }
      m.total += t.amount
      m.count++
      merchants.set(key, m)
    }
    let running = 0
    const daily = perDay.map((expense, i) => {
      running += expense
      return { day: i + 1, expense, cumulative: running }
    })

    return {
      month,
      income: current.income,
      expense: current.expense,
      balance: current.income + current.expense,
      previous,
      byCategory: [...spend.values()].sort((a, b) => a.total - b.total),
      daily,
      topMerchants: [...merchants.values()].sort((a, b) => a.total - b.total).slice(0, 8),
      transfers,
      uncategorized
    }
  }

  async trend(userId: string, month: string, months: number): Promise<{ month: string; income: number; expense: number }[]> {
    this.check(month)
    const count = Math.min(Math.max(months, 1), 24)
    const first = monthRange(shiftMonth(month, -(count - 1))).start
    const last = monthRange(month).end
    const rows = await this.transactions
      .createQueryBuilder('t')
      .leftJoin('t.category', 'c')
      .select("to_char(t.date, 'YYYY-MM')", 'month')
      .addSelect("COALESCE(SUM(CASE WHEN t.amount > 0 AND (c.kind IS NULL OR c.kind <> 'transfer') THEN t.amount END), 0)::int", 'income')
      .addSelect("COALESCE(SUM(CASE WHEN t.amount < 0 AND (c.kind IS NULL OR c.kind <> 'transfer') THEN t.amount END), 0)::int", 'expense')
      .where('t.user_id = :userId AND t.date BETWEEN :first AND :last', { userId, first, last })
      .groupBy("to_char(t.date, 'YYYY-MM')")
      .getRawMany<{ month: string; income: number; expense: number }>()
    const byMonth = new Map(rows.map((r) => [r.month, r]))
    return Array.from({ length: count }, (_, i) => {
      const m = shiftMonth(month, i - (count - 1))
      const r = byMonth.get(m)
      return { month: m, income: r?.income ?? 0, expense: r?.expense ?? 0 }
    })
  }

  async recurring(userId: string, month: string, excludeBatchId?: string): Promise<{ charges: RecurringCharge[]; monthlyTotal: number }> {
    this.check(month)
    const from = monthRange(shiftMonth(month, -5)).start
    const to = monthRange(month).end
    const rows = await this.transactions
      .createQueryBuilder('t')
      .leftJoin('t.category', 'c')
      .select("to_char(t.date, 'YYYY-MM-DD')", 'date')
      .addSelect('t.description', 'description')
      .addSelect('t.amount', 'amount')
      .where('t.user_id = :userId AND t.date BETWEEN :from AND :to AND t.amount < 0', { userId, from, to })
      .andWhere("(c.kind IS NULL OR c.kind <> 'transfer')")
      .andWhere(excludeBatchId ? '(t.import_batch_id IS NULL OR t.import_batch_id <> :excludeBatchId)' : 'TRUE', { excludeBatchId })
      .getRawMany<{ date: string; description: string; amount: number }>()
    const charges = detectRecurring(rows.map((r) => ({ ...r, date: String(r.date).slice(0, 10) })))
    return { charges, monthlyTotal: charges.reduce((s, c) => s + c.averageAmount, 0) }
  }
}
