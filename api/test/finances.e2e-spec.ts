import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createApp, example, signUp, waitForImport } from './helpers'

describe('Importação, transações e relatórios', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createApp()
  })

  afterAll(() => app.close())

  it('mostra uma prévia do extrato antes de importar', async () => {
    const user = await signUp(app)
    const res = await request(app.getHttpServer())
      .post('/api/imports/preview')
      .set(user.auth)
      .field('accountId', user.checking)
      .attach('file', example('nubank-conta.csv'), 'nubank-conta.csv')
      .expect(201)
    expect(res.body).toMatchObject({ format: 'nubank-conta-csv', total: 38, duplicates: 0, periodStart: '2026-08-04' })
    expect(res.body.sample).toHaveLength(6)
  })

  it('importa, categoriza e não duplica ao importar de novo', async () => {
    const user = await signUp(app)
    const server = app.getHttpServer()
    const first = await request(server)
      .post('/api/imports')
      .set(user.auth)
      .field('accountId', user.checking)
      .attach('file', example('nubank-conta.csv'), 'conta.csv')
      .expect(201)
    expect(first.body.status).toBe('processing')
    const done = await waitForImport(app, user.auth, first.body.id)
    expect(done).toMatchObject({ status: 'done', importedCount: 38, duplicateCount: 0 })
    expect(done.categorizedCount).toBeGreaterThan(20)

    const second = await request(server)
      .post('/api/imports')
      .set(user.auth)
      .field('accountId', user.checking)
      .attach('file', example('nubank-conta.csv'), 'conta.csv')
      .expect(201)
    const again = await waitForImport(app, user.auth, second.body.id)
    expect(again).toMatchObject({ importedCount: 0, duplicateCount: 38 })

    const list = await request(server).get('/api/transactions').query({ from: '2026-10-01', to: '2026-10-31' }).set(user.auth).expect(200)
    expect(list.body.total).toBe(12)
    const fatura = list.body.items.find((t: { description: string }) => t.description === 'Pagamento de fatura')
    expect(fatura.category.name).toBe('Movimentação interna')
  })

  it('desfaz uma importação inteira', async () => {
    const user = await signUp(app)
    const server = app.getHttpServer()
    const res = await request(server)
      .post('/api/imports')
      .set(user.auth)
      .field('accountId', user.credit)
      .attach('file', example('nubank-cartao.csv'), 'cartao.csv')
      .expect(201)
    await waitForImport(app, user.auth, res.body.id)
    const undo = await request(server).delete(`/api/imports/${res.body.id}`).set(user.auth).expect(200)
    expect(undo.body.removed).toBe(43)
    const list = await request(server).get('/api/transactions').set(user.auth).expect(200)
    expect(list.body.total).toBe(0)
  })

  it('recusa arquivo inválido com mensagem clara', async () => {
    const user = await signUp(app)
    const res = await request(app.getHttpServer())
      .post('/api/imports')
      .set(user.auth)
      .field('accountId', user.checking)
      .attach('file', Buffer.from('nome,idade\nana,3\n'), 'pessoas.csv')
      .expect(400)
    expect(res.body.message).toContain('colunas de data')
  })

  it('cria regra, aplica nas transações e filtra por categoria', async () => {
    const user = await signUp(app)
    const server = app.getHttpServer()
    const imp = await request(server)
      .post('/api/imports')
      .set(user.auth)
      .field('accountId', user.credit)
      .attach('file', example('nubank-cartao.csv'), 'cartao.csv')
      .expect(201)
    await waitForImport(app, user.auth, imp.body.id)

    const games = await request(server)
      .post('/api/categories')
      .set(user.auth)
      .send({ name: 'Jogos', kind: 'expense', color: '#884499' })
      .expect(201)
    const rule = await request(server)
      .post('/api/rules')
      .set(user.auth)
      .send({ pattern: 'steam', categoryId: games.body.id, applyToExisting: true })
      .expect(201)
    expect(rule.body.applied).toBeGreaterThan(0)

    const filtered = await request(server).get('/api/transactions').query({ categoryId: games.body.id }).set(user.auth).expect(200)
    expect(filtered.body.items.every((t: { description: string }) => t.description.startsWith('Steam'))).toBe(true)
  })

  it('soma o mês sem contar pagamento de fatura e detecta assinaturas', async () => {
    const user = await signUp(app)
    const server = app.getHttpServer()
    for (const [file, account] of [
      ['nubank-conta.csv', user.checking],
      ['nubank-cartao.csv', user.credit]
    ] as const) {
      const r = await request(server)
        .post('/api/imports')
        .set(user.auth)
        .field('accountId', account)
        .attach('file', example(file), file)
        .expect(201)
      await waitForImport(app, user.auth, r.body.id)
    }
    const summary = await request(server).get('/api/reports/summary').query({ month: '2026-10' }).set(user.auth).expect(200)
    expect(summary.body.income).toBeGreaterThan(320000)
    expect(summary.body.transfers).toBeGreaterThanOrEqual(3)
    expect(summary.body.byCategory.some((c: { name: string }) => c.name === 'Movimentação interna')).toBe(false)
    expect(summary.body.daily).toHaveLength(31)

    const recurring = await request(server).get('/api/reports/recurring').query({ month: '2026-10' }).set(user.auth).expect(200)
    const names = recurring.body.charges.map((c: { description: string }) => c.description)
    expect(names).toEqual(expect.arrayContaining(['Spotify', 'Netflix.Com', 'Google One']))

    const trend = await request(server).get('/api/reports/trend').query({ month: '2026-10', months: 3 }).set(user.auth).expect(200)
    expect(trend.body.map((t: { month: string }) => t.month)).toEqual(['2026-08', '2026-09', '2026-10'])
  })

  it('não deixa uma pessoa ver dados de outra', async () => {
    const ana = await signUp(app)
    const bia = await signUp(app)
    const server = app.getHttpServer()
    const t = await request(server)
      .post('/api/transactions')
      .set(ana.auth)
      .send({ accountId: ana.checking, date: '2026-10-10', description: 'Café', amount: -1200 })
      .expect(201)
    await request(server).get(`/api/transactions/${t.body.id}`).set(bia.auth).expect(404)
    await request(server).patch(`/api/transactions/${t.body.id}`).set(bia.auth).send({ notes: 'x' }).expect(404)
    await request(server)
      .post('/api/transactions')
      .set(bia.auth)
      .send({ accountId: ana.checking, date: '2026-10-10', description: 'x', amount: -1 })
      .expect(404)
  })
})
