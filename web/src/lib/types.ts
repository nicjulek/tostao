export type AccountKind = 'checking' | 'credit' | 'savings' | 'cash'
export type CategoryKind = 'expense' | 'income' | 'transfer'
export type MatchType = 'contains' | 'starts_with' | 'exact'

export interface User {
  id: string
  name: string
  email: string
}

export interface AuthResult {
  accessToken: string
  user: User
}

export interface Account {
  id: string
  name: string
  kind: AccountKind
  color: string
  balance: number
  transactionCount: number
}

export interface Category {
  id: string
  name: string
  kind: CategoryKind
  color: string
  monthlyBudget: number | null
}

export interface Transaction {
  id: string
  accountId: string
  categoryId: string | null
  category: Category | null
  account: Pick<Account, 'id' | 'name' | 'kind' | 'color'>
  date: string
  description: string
  amount: number
  notes: string | null
  importBatchId: string | null
}

export interface TransactionPage {
  items: Transaction[]
  total: number
  page: number
  pageSize: number
  totals: { income: number; expense: number }
}

export interface TransactionFilters {
  from?: string
  to?: string
  accountId?: string
  categoryId?: string
  type?: 'income' | 'expense'
  search?: string
}

export interface Rule {
  id: string
  pattern: string
  matchType: MatchType
  categoryId: string
  category: Category
  priority: number
}

export interface ImportPreview {
  format: string
  label: string
  suggestedAccountKind: 'checking' | 'credit' | null
  total: number
  duplicates: number | null
  periodStart: string | null
  periodEnd: string | null
  income: number
  expense: number
  sample: { date: string; description: string; amount: number }[]
}

export type ImportStatus = 'processing' | 'done' | 'failed'

export interface ImportBatch {
  id: string
  accountId: string
  account?: Pick<Account, 'id' | 'name' | 'kind' | 'color'>
  filename: string
  format: string
  status: ImportStatus
  error: string | null
  totalCount: number
  importedCount: number
  duplicateCount: number
  categorizedCount: number
  periodStart: string | null
  periodEnd: string | null
  createdAt: string
}

export type ImportStage = 'received' | 'deduplicating' | 'categorizing' | 'saving' | 'done' | 'failed'

export interface ImportProgress {
  batchId: string
  stage: ImportStage
  percent: number
  message: string
  imported?: number
  duplicates?: number
  categorized?: number
}

export interface CategorySpend {
  categoryId: string | null
  name: string
  color: string
  kind: CategoryKind
  total: number
  count: number
  budget: number | null
}

export interface MonthSummary {
  month: string
  income: number
  expense: number
  balance: number
  previous: { income: number; expense: number }
  byCategory: CategorySpend[]
  daily: { day: number; expense: number; cumulative: number }[]
  topMerchants: { name: string; total: number; count: number }[]
  transfers: number
  uncategorized: number
}

export interface TrendPoint {
  month: string
  income: number
  expense: number
}

export interface RecurringCharge {
  key: string
  description: string
  averageAmount: number
  months: number
  lastDate: string
  nextDate: string
}

export interface Notification {
  id: string
  kind: 'upcoming_charge' | 'price_increase'
  title: string
  body: string
  readAt: string | null
  createdAt: string
}
