import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Repository } from 'typeorm'
import { UserStreamService } from '../realtime/user-stream.service'
import { UsersService } from '../users/users.service'
import { MailService } from './mail.service'
import { Notification, NotificationKind } from './notification.entity'

export interface NewNotification {
  kind: NotificationKind
  title: string
  body: string
  dedupeKey: string
  data?: Record<string, unknown>
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
    private readonly stream: UserStreamService,
    private readonly mail: MailService,
    private readonly users: UsersService
  ) {}

  async notify(userId: string, input: NewNotification): Promise<Notification | null> {
    const result = await this.notifications
      .createQueryBuilder()
      .insert()
      .values({
        userId,
        kind: input.kind,
        title: input.title,
        body: input.body,
        dedupeKey: input.dedupeKey,
        data: (input.data ?? {}) as never
      })
      .orIgnore()
      .returning('*')
      .execute()
    const row = result.raw?.[0]
    if (!row) return null
    const created = await this.notifications.findOneByOrFail({ id: row.id })
    this.stream.publish(userId, 'notification', created)
    if (this.mail.enabled) {
      const user = await this.users.findById(userId)
      if (user) await this.mail.send(user.email, created.title, created.body)
    }
    return created
  }

  async sendTestEmail(userId: string): Promise<{ to: string }> {
    if (!this.mail.enabled) throw new BadRequestException('O envio de e-mail está desligado. Preencha SMTP_URL no .env da API e reinicie.')
    const user = await this.users.findById(userId)
    if (!user) throw new NotFoundException('Usuário não encontrado')
    const ok = await this.mail.send(
      user.email,
      'Os avisos do Tostão estão funcionando',
      'Quando uma assinatura estiver para ser cobrada ou ficar mais cara, você recebe um e-mail como este.'
    )
    if (!ok) throw new BadRequestException('O servidor de e-mail recusou o envio. Confira usuário e senha no SMTP_URL.')
    return { to: user.email }
  }

  emailEnabled(): boolean {
    return this.mail.enabled
  }

  async list(userId: string): Promise<{ items: Notification[]; unread: number }> {
    const [items, unread] = await Promise.all([
      this.notifications.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 30 }),
      this.notifications.count({ where: { userId, readAt: IsNull() } })
    ])
    return { items, unread }
  }

  async markRead(userId: string, id: string): Promise<void> {
    const result = await this.notifications.update({ id, userId }, { readAt: new Date() })
    if (!result.affected) throw new NotFoundException('Aviso não encontrado')
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notifications.update({ userId, readAt: IsNull() }, { readAt: new Date() })
    return { updated: result.affected ?? 0 }
  }
}
