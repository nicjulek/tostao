import { http } from './api'
import type {
  Account,
  AccountKind,
  AuthResult,
  Category,
  CategoryKind,
  ImportBatch,
  ImportPreview,
  MatchType,
  MonthSummary,
  Notification,
  RecurringCharge,
  Rule,
  Transaction,
  TransactionFilters,
  TransactionPage,
  TrendPoint,
  User
} from './types'

export const authApi = {
  login: (body: { email: string; password: string }) => http.post<AuthResult>('/auth/login', body),
  register: (body: { name: string; email: string; password: string }) => http.post<AuthResult>('/auth/register', body),
  me: () => http.get<User>('/auth/me')
}

export const accountsApi = {
  list: () => http.get<Account[]>('/accounts'),
  create: (body: { name: string; kind: AccountKind; color?: string }) => http.post<Account>('/accounts', body),
  update: (id: string, body: Partial<{ name: string; kind: AccountKind; color: string }>) => http.patch<Account>(`/accounts/${id}`, body),
  remove: (id: string) => http.delete<void>(`/accounts/${id}`)
}

export interface CategoryInput {
  name: string
  kind: CategoryKind
  color: string
  monthlyBudget?: number | null
}

export const categoriesApi = {
  list: () => http.get<Category[]>('/categories'),
  create: (body: CategoryInput) => http.post<Category>('/categories', body),
  update: (id: string, body: Partial<CategoryInput>) => http.patch<Category>(`/categories/${id}`, body),
  remove: (id: string) => http.delete<void>(`/categories/${id}`)
}

export interface TransactionInput {
  accountId: string
  categoryId?: string | null
  date: string
  description: string
  amount: number
  notes?: string | null
}

export const transactionsApi = {
  list: (filters: TransactionFilters & { page?: number; pageSize?: number }, signal?: AbortSignal) =>
    http.get<TransactionPage>('/transactions', { ...filters }, signal),
  create: (body: TransactionInput) => http.post<Transaction>('/transactions', body),
  update: (id: string, body: Partial<Omit<TransactionInput, 'accountId'>>) => http.patch<Transaction>(`/transactions/${id}`, body),
  remove: (id: string) => http.delete<void>(`/transactions/${id}`),
  bulkCategorize: (ids: string[], categoryId: string | null) =>
    http.patch<{ updated: number }>('/transactions/bulk/category', { ids, categoryId })
}

export interface RuleInput {
  pattern: string
  matchType: MatchType
  categoryId: string
  priority?: number
  applyToExisting?: boolean
}

export const rulesApi = {
  list: () => http.get<Rule[]>('/rules'),
  create: (body: RuleInput) => http.post<{ rule: Rule; applied: number }>('/rules', body),
  update: (id: string, body: Partial<RuleInput>) => http.patch<Rule>(`/rules/${id}`, body),
  remove: (id: string) => http.delete<void>(`/rules/${id}`),
  apply: () => http.post<{ updated: number }>('/rules/apply', { overwrite: true })
}

function upload(file: File, accountId?: string): FormData {
  const form = new FormData()
  form.append('file', file)
  if (accountId) form.append('accountId', accountId)
  return form
}

export const importsApi = {
  list: () => http.get<ImportBatch[]>('/imports'),
  get: (id: string) => http.get<ImportBatch>(`/imports/${id}`),
  preview: (file: File, accountId?: string) => http.post<ImportPreview>('/imports/preview', upload(file, accountId)),
  start: (file: File, accountId: string) => http.post<ImportBatch>('/imports', upload(file, accountId)),
  undo: (id: string) => http.delete<{ removed: number }>(`/imports/${id}`)
}

export const reportsApi = {
  summary: (month: string) => http.get<MonthSummary>('/reports/summary', { month }),
  trend: (month: string, months = 6) => http.get<TrendPoint[]>('/reports/trend', { month, months }),
  recurring: (month: string) => http.get<{ charges: RecurringCharge[]; monthlyTotal: number }>('/reports/recurring', { month })
}

export const notificationsApi = {
  list: () => http.get<{ items: Notification[]; unread: number }>('/notifications'),
  read: (id: string) => http.patch<void>(`/notifications/${id}/read`),
  readAll: () => http.patch<{ updated: number }>('/notifications/read-all'),
  check: (today?: string) => http.post<{ created: number }>('/notifications/check', today ? { today } : {}),
  email: () => http.get<{ enabled: boolean }>('/notifications/email'),
  testEmail: () => http.post<{ to: string }>('/notifications/test-email')
}
