import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { DataSource } from 'typeorm'
import { AppModule } from '../src/app.module'
import { setupApp } from '../src/setup-app'

export async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = moduleRef.createNestApplication({ logger: false })
  setupApp(app, 'http://localhost:5173')
  await app.init()
  const ds = app.get(DataSource)
  await ds.runMigrations()
  await ds.query('TRUNCATE users CASCADE')
  return app
}

let counter = 0

export async function signUp(app: INestApplication) {
  counter++
  const email = `pessoa${counter}-${Date.now()}@exemplo.com`
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ name: 'Pessoa Teste', email, password: 'senha-segura-1' })
    .expect(201)
  const token: string = res.body.accessToken
  const auth = { Authorization: `Bearer ${token}` }
  const accounts = await request(app.getHttpServer()).get('/api/accounts').set(auth).expect(200)
  return {
    token,
    auth,
    email,
    checking: accounts.body.find((a: { kind: string }) => a.kind === 'checking').id as string,
    credit: accounts.body.find((a: { kind: string }) => a.kind === 'credit').id as string
  }
}

export function example(name: string): Buffer {
  return readFileSync(join(__dirname, '../../exemplos', name))
}

export async function waitForImport(app: INestApplication, auth: Record<string, string>, id: string) {
  for (let i = 0; i < 50; i++) {
    const res = await request(app.getHttpServer()).get(`/api/imports/${id}`).set(auth).expect(200)
    if (res.body.status !== 'processing') return res.body
    await new Promise((r) => setTimeout(r, 50))
  }
  throw new Error('A importação não terminou a tempo')
}
