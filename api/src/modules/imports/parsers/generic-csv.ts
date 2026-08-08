import { createHash } from 'node:crypto'
import { toCents } from '../../../common/utils/money'
import { normalize } from '../../../common/utils/text'
import { parseDate } from './dates'
import { ParsedTransaction, StatementError } from './types'

const DATE = /^(data|date|dt)( (lancamento|movimento|transacao))?$/
const DESCRIPTION = /descri|histor|title|titulo|estabelecimento|lancamento|memo/
const AMOUNT = /^(valor|amount|value|quantia)( \(r\$\))?$|^valor (r\$|em reais)$/
const DEBIT = /debito|saida/
const CREDIT = /credito|entrada/

export function findColumns(header: string[]) {
  const h = header.map(normalize)
  const date = h.findIndex((c) => DATE.test(c))
  const description = h.findIndex((c, i) => i !== date && DESCRIPTION.test(c))
  const amount = h.findIndex((c) => AMOUNT.test(c))
  const debit = h.findIndex((c) => DEBIT.test(c))
  const credit = h.findIndex((c) => CREDIT.test(c))
  return { date, description, amount, debit, credit }
}

export function parseGenericCsv(rows: string[][]): ParsedTransaction[] {
  const headerIndex = rows.findIndex((r) => {
    const c = findColumns(r)
    return c.date >= 0 && c.description >= 0 && (c.amount >= 0 || (c.debit >= 0 && c.credit >= 0))
  })
  if (headerIndex < 0) {
    throw new StatementError('Não encontrei as colunas de data, descrição e valor neste CSV')
  }
  const col = findColumns(rows[headerIndex])
  const seen = new Map<string, number>()
  const out: ParsedTransaction[] = []
  rows.slice(headerIndex + 1).forEach((r, i) => {
    const date = parseDate(r[col.date] ?? '')
    if (!date) return
    let amount: number
    try {
      if (col.amount >= 0) amount = toCents(r[col.amount] ?? '')
      else {
        const debit = r[col.debit]?.trim() ? Math.abs(toCents(r[col.debit])) : 0
        const credit = r[col.credit]?.trim() ? Math.abs(toCents(r[col.credit])) : 0
        amount = credit - debit
      }
    } catch {
      throw new StatementError(`Valor inválido na linha ${headerIndex + i + 2}`)
    }
    const description = (r[col.description] ?? '').trim() || 'Sem descrição'
    const key = `${date}|${description}|${amount}`
    const n = (seen.get(key) ?? 0) + 1
    seen.set(key, n)
    out.push({ date, description, amount, externalId: `csv:${createHash('sha1').update(`${key}|${n}`).digest('hex').slice(0, 24)}` })
  })
  if (!out.length) throw new StatementError('Nenhuma linha com data válida neste CSV')
  return out
}
