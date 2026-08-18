import { ParsedStatement } from './parsers'

export const IMPORT_REQUESTED = 'import.requested'
export const TRANSACTIONS_IMPORTED = 'transactions.imported'

export interface ImportRequestedEvent {
  batchId: string
  userId: string
  accountId: string
  statement: ParsedStatement
}

export interface TransactionsImportedEvent {
  batchId: string
  userId: string
  imported: number
  duplicates: number
  durationMs: number
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
