import { createHash } from 'node:crypto'
import { toCents } from '../../../common/utils/money'
import { normalize } from '../../../common/utils/text'
import { parseDate } from './dates'
import { ParsedTransaction, StatementError } from './types'

export function isNubankAccountHeader(header: string[]): boolean {
  const h = header.map(normalize)
  return h.includes('data') && h.includes('valor') && h.includes('identificador') && h.some((c) => c.startsWith('descri'))
}

export function isNubankCardHeader(header: string[]): boolean {
  const h = header.map(normalize)
  return h.includes('date') && h.includes('title') && h.includes('amount')
}

export function parseNubankAccount(rows: string[][]): ParsedTransaction[] {
  const header = rows[0].map(normalize)
  const col = {
    date: header.indexOf('data'),
    amount: header.indexOf('valor'),
    id: header.indexOf('identificador'),
    description: header.findIndex((c) => c.startsWith('descri'))
  }
  return rows.slice(1).map((r, i) => {
    const date = parseDate(r[col.date] ?? '')
    if (!date) throw new StatementError(`Data inválida na linha ${i + 2}: "${r[col.date] ?? ''}"`)
    const id = r[col.id]?.trim()
    return {
      date,
      description: (r[col.description] ?? '').trim() || 'Sem descrição',
      amount: toCents(r[col.amount] ?? ''),
      externalId: id ? `nu:${id}` : null
    }
  })
}

export function parseNubankCard(rows: string[][]): ParsedTransaction[] {
  const header = rows[0].map(normalize)
  const col = {
    date: header.indexOf('date'),
    title: header.indexOf('title'),
    amount: header.indexOf('amount')
  }
  const seen = new Map<string, number>()
  return rows.slice(1).map((r, i) => {
    const date = parseDate(r[col.date] ?? '')
    if (!date) throw new StatementError(`Data inválida na linha ${i + 2}: "${r[col.date] ?? ''}"`)
    const description = (r[col.title] ?? '').trim() || 'Sem descrição'
    const amount = -toCents(r[col.amount] ?? '')
    const key = `${date}|${description}|${amount}`
    const n = (seen.get(key) ?? 0) + 1
    seen.set(key, n)
    return {
      date,
      description,
      amount,
      externalId: `nucard:${createHash('sha1').update(`${key}|${n}`).digest('hex').slice(0, 24)}`
    }
  })
}
