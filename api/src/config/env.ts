export interface Env {
  DATABASE_URL: string
  JWT_SECRET: string
  PORT: number
  WEB_ORIGIN: string
  SMTP_URL?: string
  MAIL_FROM: string
}

export function validateEnv(raw: Record<string, unknown>): Env {
  const missing = ['DATABASE_URL', 'JWT_SECRET'].filter((k) => !raw[k])
  if (missing.length) throw new Error(`Variáveis de ambiente ausentes: ${missing.join(', ')}`)
  if (String(raw.JWT_SECRET).length < 16) throw new Error('JWT_SECRET precisa ter pelo menos 16 caracteres')
  return {
    DATABASE_URL: String(raw.DATABASE_URL),
    JWT_SECRET: String(raw.JWT_SECRET),
    PORT: Number(raw.PORT ?? 3000),
    WEB_ORIGIN: String(raw.WEB_ORIGIN ?? 'http://localhost:5173'),
    SMTP_URL: raw.SMTP_URL ? String(raw.SMTP_URL) : undefined,
    MAIL_FROM: String(raw.MAIL_FROM ?? 'Tostão <avisos@tostao.local>')
  }
}
