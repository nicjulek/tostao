import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createApp, example, signUp, waitForImport } from './helpers'

async function importFile(app: INestApplication, auth: Record<string, string>, accountId: string, file: Buffer, name: string) {
  const res = await request(app.getHttpServer())
    .post('/api/imports')
    .set(auth)
    .field('accountId', accountId)
    .attach('file', file, name)
    .expect(201)
  return waitForImport(app, auth, res.body.id)
}

const waitFor = async (check: () => Promise<boolean>) => {
  for (let i = 0; i < 40; i++) {
    if (await check()) return
    await new Promise((r) => setTimeout(r, 50))
  }
  throw new Error('Condição não atingida')
}

describe('Avisos de assinatura', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createApp()
  })

  afterAll(() => app.close())

  it('avisa cobranças dos próximos dois dias uma única vez', async () => {
    const user = await signUp(app)
    const server = app.getHttpServer()
    await importFile(app, user.auth, user.credit, example('nubank-cartao.csv'), 'cartao.csv')

    const first = await request(server).post('/api/notifications/check').set(user.auth).send({ today: '2026-11-01' }).expect(200)
    expect(first.body.created).toBe(1)
    const again = await request(server).post('/api/notifications/check').set(user.auth).send({ today: '2026-11-01' }).expect(200)
    expect(again.body.created).toBe(0)

    const list = await request(server).get('/api/notifications').set(user.auth).expect(200)
    expect(list.body.unread).toBe(1)
    expect(list.body.items[0]).toMatchObject({ kind: 'upcoming_charge', title: 'Spotify cobra R$ 21,90 em 2 dias' })

    await request(server).patch(`/api/notifications/${list.body.items[0].id}/read`).set(user.auth).expect(204)
    const after = await request(server).get('/api/notifications').set(user.auth).expect(200)
    expect(after.body.unread).toBe(0)
  })

  it('avisa quando uma assinatura vem mais cara num extrato novo', async () => {
    const user = await signUp(app)
    const server = app.getHttpServer()
    await importFile(app, user.auth, user.credit, example('nubank-cartao.csv'), 'cartao.csv')
    const november = Buffer.from('date,title,amount\n2026-11-03,Spotify,26.90\n2026-11-09,Netflix.Com,39.90\n')
    await importFile(app, user.auth, user.credit, november, 'novembro.csv')

    await waitFor(async () => {
      const res = await request(server).get('/api/notifications').set(user.auth)
      return res.body.items.some((n: { kind: string }) => n.kind === 'price_increase')
    })
    const list = await request(server).get('/api/notifications').set(user.auth).expect(200)
    const increases = list.body.items.filter((n: { kind: string }) => n.kind === 'price_increase')
    expect(increases).toHaveLength(1)
    expect(increases[0].title).toBe('Spotify ficou 23% mais cara')
  })

  it('marca todos como lidos', async () => {
    const user = await signUp(app)
    const server = app.getHttpServer()
    await importFile(app, user.auth, user.credit, example('nubank-cartao.csv'), 'cartao.csv')
    await request(server).post('/api/notifications/check').set(user.auth).send({ today: '2026-11-08' }).expect(200)
    const res = await request(server).patch('/api/notifications/read-all').set(user.auth).expect(200)
    expect(res.body.updated).toBeGreaterThan(0)
  })

  it('explica quando o e-mail não está configurado', async () => {
    const user = await signUp(app)
    const status = await request(app.getHttpServer()).get('/api/notifications/email').set(user.auth).expect(200)
    expect(status.body.enabled).toBe(false)
    const res = await request(app.getHttpServer()).post('/api/notifications/test-email').set(user.auth).expect(400)
    expect(res.body.message).toContain('SMTP_URL')
  })
})
