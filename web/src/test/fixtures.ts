import type { Account, Category, MonthSummary, Transaction } from '@/lib/types'

export const categories: Category[] = [
  { id: 'c-food', name: 'Alimentação', kind: 'expense', color: '#d9824b', monthlyBudget: 45000 },
  { id: 'c-subs', name: 'Assinaturas', kind: 'expense', color: '#8a5cc2', monthlyBudget: null },
  { id: 'c-salary', name: 'Salário', kind: 'income', color: '#2f8f5b', monthlyBudget: null },
  { id: 'c-internal', name: 'Movimentação interna', kind: 'transfer', color: '#9aa5b1', monthlyBudget: null }
]

export const accounts: Account[] = [
  { id: 'a-conta', name: 'Nubank conta', kind: 'checking', color: '#3d6b5c', balance: 120000, transactionCount: 2 },
  { id: 'a-cartao', name: 'Nubank cartão', kind: 'credit', color: '#7a4fb3', balance: -6180, transactionCount: 1 }
]

export const transactions: Transaction[] = [
  {
    id: 't1',
    accountId: 'a-cartao',
    account: accounts[1],
    categoryId: 'c-subs',
    category: categories[1],
    date: '2026-10-03',
    description: 'Spotify',
    amount: -2190,
    notes: null,
    importBatchId: 'b1'
  },
  {
    id: 't2',
    accountId: 'a-conta',
    account: accounts[0],
    categoryId: null,
    category: null,
    date: '2026-10-02',
    description: 'Compra no débito - PADARIA SAO JOSE',
    amount: -1850,
    notes: null,
    importBatchId: 'b1'
  },
  {
    id: 't3',
    accountId: 'a-conta',
    account: accounts[0],
    categoryId: 'c-salary',
    category: categories[2],
    date: '2026-10-05',
    description: 'Transferência recebida pelo Pix - EMPRESA EXEMPLO',
    amount: 320000,
    notes: null,
    importBatchId: 'b1'
  }
]

export const summary: MonthSummary = {
  month: '2026-10',
  income: 320000,
  expense: -291422,
  balance: 28578,
  previous: { income: 320000, expense: -250000 },
  byCategory: [
    { categoryId: 'c-food', name: 'Alimentação', color: '#d9824b', kind: 'expense', total: -38000, count: 9, budget: 45000 },
    { categoryId: 'c-subs', name: 'Assinaturas', color: '#8a5cc2', kind: 'expense', total: -7170, count: 3, budget: null },
    { categoryId: 'c-salary', name: 'Salário', color: '#2f8f5b', kind: 'income', total: 320000, count: 1, budget: null }
  ],
  daily: Array.from({ length: 31 }, (_, i) => ({ day: i + 1, expense: -5000, cumulative: -5000 * (i + 1) })),
  topMerchants: [{ name: 'Ifood *Ifood', total: -21000, count: 4 }],
  transfers: 2,
  uncategorized: 3
}
