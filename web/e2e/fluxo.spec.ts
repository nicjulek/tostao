import { expect, test, type Page } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const exemplo = (name: string) => fileURLToPath(new URL(`../../exemplos/${name}`, import.meta.url))

async function criarConta(page: Page) {
  await page.goto('/criar-conta')
  await page.getByLabel('Nome').fill('Pessoa Teste')
  await page.getByLabel('E-mail').fill(`e2e-${Date.now()}-${Math.round(Math.random() * 1e6)}@exemplo.com`)
  await page.getByLabel('Senha').fill('senha-forte-123')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page).toHaveURL(/\/importar$/)
}

async function importar(page: Page, arquivo: string, total: number) {
  await page.goto('/importar')
  await page.locator('input[type=file]').setInputFiles(exemplo(arquivo))
  await page.getByRole('button', { name: `Importar ${total} transações` }).click()
  await expect(page.getByText('Importação concluída')).toBeVisible({ timeout: 15_000 })
}

test('importa o extrato do Nubank e mostra o resumo do mês', async ({ page }) => {
  await criarConta(page)
  await importar(page, 'nubank-conta.csv', 38)
  await expect(page.getByText('Novas', { exact: true })).toBeVisible()

  await page.goto('/?mes=2026-10')
  await expect(page.getByRole('heading', { level: 2, name: /Em outubro entrou/ })).toBeVisible()
  await expect(page.getByText('Para onde foi o dinheiro')).toBeVisible()
})

test('não duplica ao importar o mesmo arquivo de novo', async ({ page }) => {
  await criarConta(page)
  await importar(page, 'nubank-cartao.csv', 43)
  await page.getByRole('button', { name: 'Importar outro' }).click()
  await page.locator('input[type=file]').setInputFiles(exemplo('nubank-cartao.csv'))
  await page.getByRole('combobox', { name: 'Em qual conta?' }).click()
  await page.getByRole('option', { name: 'Cartão de crédito' }).click()
  await expect(page.getByText('Todas essas transações já foram importadas nesta conta.')).toBeVisible()
})

test('filtra transações e cria uma regra a partir de uma linha', async ({ page, isMobile }) => {
  test.skip(isMobile, 'menu de linha testado no desktop')
  await criarConta(page)
  await importar(page, 'nubank-cartao.csv', 43)

  await page.goto('/transacoes?mes=2026-10')
  await page.getByPlaceholder('Buscar por descrição ou observação').fill('steam')
  await expect(page.getByRole('button', { name: 'Steam Purchase' }).first()).toBeVisible()

  await page.getByRole('button', { name: 'Ações de Steam Purchase' }).first().click()
  await page.getByRole('menuitem', { name: 'Criar regra com esta descrição' }).click()
  await expect(page.getByLabel('Texto')).toHaveValue('Steam Purchase')
  await page.getByRole('combobox', { name: 'Colocar em' }).click()
  await page.getByRole('option', { name: 'Lazer' }).click()
  await page.getByRole('button', { name: 'Criar regra' }).click()
  await expect(page.getByText('Regra criada')).toBeVisible()

  await page.goto('/regras')
  await expect(page.getByText('“Steam Purchase”')).toBeVisible()
})

test('protege as páginas para quem não entrou', async ({ page }) => {
  await page.goto('/transacoes')
  await expect(page).toHaveURL(/\/entrar$/)
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
})
