import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createTransport, Transporter } from 'nodemailer'
import { Env } from '../../config/env'
import { renderEmail } from './email-template'

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name)
  private transporter: Transporter | null = null

  constructor(private readonly config: ConfigService<Env, true>) {}

  onModuleInit(): void {
    const url = this.config.get('SMTP_URL', { infer: true })
    if (url) this.transporter = createTransport(url)
    else this.logger.log('SMTP_URL não configurado: avisos ficam só no app')
  }

  get enabled(): boolean {
    return this.transporter !== null
  }

  async send(to: string, subject: string, text: string): Promise<boolean> {
    if (!this.transporter) return false
    const web = this.config.get('WEB_ORIGIN', { infer: true }).split(',')[0]
    try {
      await this.transporter.sendMail({
        from: this.config.get('MAIL_FROM', { infer: true }),
        to,
        subject,
        text,
        html: renderEmail({ title: subject, body: text, cta: { label: 'Abrir o Tostão', url: `${web}/assinaturas` } })
      })
      return true
    } catch (error) {
      this.logger.warn({ err: error, to }, 'Falha ao enviar e-mail')
      return false
    }
  }
}
