import { isValidDate } from '../../../common/utils/dates'

export function parseDate(text: string): string | null {
  const value = text.trim()
  let m = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return check(`${m[1]}-${m[2]}-${m[3]}`)
  m = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/)
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3]
    return check(`${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`)
  }
  m = value.match(/^(\d{4})(\d{2})(\d{2})/)
  if (m) return check(`${m[1]}-${m[2]}-${m[3]}`)
  return null
}

function check(iso: string): string | null {
  return isValidDate(iso) ? iso : null
}
