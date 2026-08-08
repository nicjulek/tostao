import { parseCsv } from './csv'
import { parseGenericCsv } from './generic-csv'
import { isNubankAccountHeader, isNubankCardHeader, parseNubankAccount, parseNubankCard } from './nubank'
import { looksLikeOfx, ofxAccountKind, parseOfx } from './ofx'
import { ParsedStatement, StatementError } from './types'

export * from './types'

export function decode(buffer: Buffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('latin1').decode(buffer)
  }
}

export function parseStatement(buffer: Buffer): ParsedStatement {
  const text = decode(buffer)
  if (!text.trim()) throw new StatementError('O arquivo está vazio')

  if (looksLikeOfx(text)) {
    return { format: 'ofx', label: 'OFX', suggestedAccountKind: ofxAccountKind(text), transactions: parseOfx(text) }
  }

  const rows = parseCsv(text)
  if (rows.length < 2) throw new StatementError('O arquivo não tem linhas de transação')

  if (isNubankAccountHeader(rows[0])) {
    return {
      format: 'nubank-conta-csv',
      label: 'Extrato da conta Nubank',
      suggestedAccountKind: 'checking',
      transactions: parseNubankAccount(rows)
    }
  }
  if (isNubankCardHeader(rows[0])) {
    return {
      format: 'nubank-cartao-csv',
      label: 'Fatura do cartão Nubank',
      suggestedAccountKind: 'credit',
      transactions: parseNubankCard(rows)
    }
  }
  return { format: 'csv', label: 'CSV', suggestedAccountKind: null, transactions: parseGenericCsv(rows) }
}
