import 'reflect-metadata'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { AppModule } from '../app.module'
import { AccountsService } from '../modules/accounts/accounts.service'
import { AuthService } from '../modules/auth/auth.service'
import { CategoriesService } from '../modules/categories/categories.service'
import { ImportProcessor } from '../modules/imports/import.processor'
import { ImportsService } from '../modules/imports/imports.service'
import { RecurringAlertsService } from '../modules/notifications/recurring-alerts.service'
import { RulesService } from '../modules/rules/rules.service'
import { User } from '../modules/users/user.entity'

const DEMO = { name: 'Nicole', email: 'demo@tostao.app', password: 'demo12345' }

const BUDGETS: Record<string, number> = {
  Alimentação: 45000,
  Mercado: 60000,
  Transporte: 25000,
  Lazer: 20000,
  Assinaturas: 9000,
  Compras: 30000
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] })
  const ds = app.get(DataSource)
  await ds.runMigrations()
  await ds.getRepository(User).delete({ email: DEMO.email })

  const { user } = await app.get(AuthService).register(DEMO)
  const accounts = await app.get(AccountsService).list(user.id)
  const checking = accounts.find((a) => a.kind === 'checking')!
  const credit = accounts.find((a) => a.kind === 'credit')!
  await app.get(AccountsService).update(user.id, checking.id, { name: 'Nubank conta' })
  await app.get(AccountsService).update(user.id, credit.id, { name: 'Nubank cartão' })

  const categories = app.get(CategoriesService)
  for (const c of await categories.list(user.id)) {
    if (BUDGETS[c.name]) await categories.update(user.id, c.id, { monthlyBudget: BUDGETS[c.name] })
  }
  const games = await categories.create(user.id, { name: 'Jogos', kind: 'expense', color: '#b4569e', monthlyBudget: 15000 })
  const all = await categories.list(user.id)
  const salary = all.find((c) => c.name === 'Salário')!
  const housing = all.find((c) => c.name === 'Moradia')!

  const rules = app.get(RulesService)
  await rules.create(user.id, { pattern: 'steam', categoryId: games.id })
  await rules.create(user.id, { pattern: 'empresa exemplo', categoryId: salary.id, priority: 5 })
  await rules.create(user.id, { pattern: 'imobiliaria', categoryId: housing.id })

  const imports = app.get(ImportsService)
  const processor = app.get(ImportProcessor)
  const files: [string, string][] = [
    ['nubank-conta.csv', checking.id],
    ['nubank-cartao.csv', credit.id]
  ]
  for (const [name, accountId] of files) {
    const buffer = readFileSync(join(__dirname, '../../../exemplos', name))
    const file = { originalname: name, buffer, size: buffer.length }
    const statement = imports.parse(file)
    const batch = await imports.start(user.id, accountId, file, false)
    await processor.handle({ batchId: batch.id, userId: user.id, accountId, statement })
  }
  await app.get(RecurringAlertsService).checkUpcoming(user.id, '2026-11-01')

  console.log(`Pronto. Entre com ${DEMO.email} / ${DEMO.password}`)
  await app.close()
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
