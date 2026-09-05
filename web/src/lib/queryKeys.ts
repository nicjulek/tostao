import type { TransactionFilters } from './types'

export const qk = {
  me: ['me'] as const,
  accounts: ['accounts'] as const,
  categories: ['categories'] as const,
  rules: ['rules'] as const,
  imports: ['imports'] as const,
  notifications: ['notifications'] as const,
  transactions: (filters: TransactionFilters = {}) => ['transactions', filters] as const,
  transactionsAll: ['transactions'] as const,
  summary: (month: string) => ['reports', 'summary', month] as const,
  trend: (month: string) => ['reports', 'trend', month] as const,
  recurring: (month: string) => ['reports', 'recurring', month] as const,
  reports: ['reports'] as const
}
