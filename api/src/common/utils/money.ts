export function toCents(value: string | number): number {
  if (typeof value === 'number') return Math.round(value * 100)
  let text = value.trim().replace(/\s|R\$/g, '')
  const negative = /^-|^\(.*\)$|-$/.test(text)
  text = text.replace(/[()-]/g, '').replace(/^\+/, '')
  const lastComma = text.lastIndexOf(',')
  const lastDot = text.lastIndexOf('.')
  if (lastComma > lastDot) text = text.replace(/\./g, '').replace(',', '.')
  else text = text.replace(/,/g, '')
  const number = Number(text)
  if (!Number.isFinite(number)) throw new Error(`Valor inválido: ${value}`)
  const cents = Math.round(number * 100)
  return negative ? -cents : cents
}
