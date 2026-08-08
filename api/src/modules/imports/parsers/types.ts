export type StatementFormat = 'nubank-conta-csv' | 'nubank-cartao-csv' | 'ofx' | 'csv'

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  externalId: string | null
}

export interface ParsedStatement {
  format: StatementFormat
  label: string
  suggestedAccountKind: 'checking' | 'credit' | null
  transactions: ParsedTransaction[]
}

export class StatementError extends Error {}
