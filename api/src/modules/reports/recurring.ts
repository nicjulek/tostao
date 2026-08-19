import { merchantKey } from '../../common/utils/text'

export interface RecurringInput {
  date: string
  description: string
  amount: number
}

export interface RecurringCharge {
  key: string
  description: string
  averageAmount: number
  months: number
  lastDate: string
  nextDate: string
}

export function detectRecurring(transactions: RecurringInput[], minMonths = 3, tolerance = 0.2): RecurringCharge[] {
  const groups = new Map<string, RecurringInput[]>()
  for (const t of transactions) {
    if (t.amount >= 0) continue
    if (/parcela\s*\d+\s*\/\s*\d+/i.test(t.description)) continue
    const key = merchantKey(t.description)
    if (key.length < 3) continue
    const list = groups.get(key) ?? []
    list.push(t)
    groups.set(key, list)
  }

  const result: RecurringCharge[] = []
  for (const [key, list] of groups) {
    const byMonth = new Map<string, RecurringInput>()
    for (const t of list.sort((a, b) => a.date.localeCompare(b.date))) byMonth.set(t.date.slice(0, 7), t)
    if (byMonth.size < minMonths) continue
    const monthly = [...byMonth.values()]
    const amounts = monthly.map((t) => Math.abs(t.amount))
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length
    if (amounts.some((a) => Math.abs(a - avg) / avg > tolerance)) continue
    const last = monthly[monthly.length - 1]
    const days = monthly.map((t) => Number(t.date.slice(8, 10)))
    const day = Math.round(days.reduce((s, d) => s + d, 0) / days.length)
    const [y, m] = last.date.split('-').map(Number)
    const next = new Date(Date.UTC(y, m, 1))
    const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate()
    next.setUTCDate(Math.min(day, lastDay))
    result.push({
      key,
      description: last.description,
      averageAmount: -Math.round(avg),
      months: byMonth.size,
      lastDate: last.date,
      nextDate: next.toISOString().slice(0, 10)
    })
  }
  return result.sort((a, b) => a.averageAmount - b.averageAmount)
}
