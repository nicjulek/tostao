import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createApp, signUp } from './helpers'

describe('Autenticação', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createApp()
  })

  afterAll(() => app.close())

  it('cria conta com categorias e contas padrão', async () => {
    const user = await signUp(app)
    const categories = await request(app.getHttpServer()).get('/api/categories').set(user.auth).expect(200)
    expect(categories.body.map((c: { name: string }) => c.name)).toEqual(
      expect.arrayContaining(['Alimentação', 'Movimentação interna', 'Salário'])
    )
    expect(user.checking).toBeDefined()
    expect(user.credit).toBeDefined()
  })

  it('faz login e devolve o usuário em /me', async () => {
    const user = await signUp(app)
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email.toUpperCase(), password: 'senha-segura-1' })
      .expect(200)
    const me = await request(app.getHttpServer()).get('/api/auth/me').set('Authorization', `Bearer ${login.body.accessToken}`).expect(200)
    expect(me.body).toMatchObject({ email: user.email, name: 'Pessoa Teste' })
    expect(me.body.passwordHash).toBeUndefined()
  })

  it('recusa senha errada, e-mail repetido e dados inválidos', async () => {
    const user = await signUp(app)
    await request(app.getHttpServer()).post('/api/auth/login').send({ email: user.email, password: 'errada-123' }).expect(401)
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'Outra', email: user.email, password: 'senha-segura-1' })
      .expect(409)
    const bad = await request(app.getHttpServer()).post('/api/auth/register').send({ name: 'A', email: 'x', password: '1' }).expect(400)
    expect(bad.body.message).toEqual(expect.arrayContaining(['Informe um e-mail válido']))
  })

  it('bloqueia rotas sem token', async () => {
    await request(app.getHttpServer()).get('/api/transactions').expect(401)
    await request(app.getHttpServer()).get('/api/health').expect(200)
  })
})
