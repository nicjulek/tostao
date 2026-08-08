import { toCents } from '../../../common/utils/money'
import { parseDate } from './dates'
import { ParsedTransaction, StatementError } from './types'

export function looksLikeOfx(text: string): boolean {
  return /<OFX>/i.test(text) || /^OFXHEADER:/m.test(text)
}

function field(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}>([^<\\r\\n]*)`, 'i'))
  return m ? decodeEntities(m[1].trim()) : null
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

export function ofxAccountKind(text: string): 'checking' | 'credit' {
  return /<CREDITCARDMSGSRSV1>/i.test(text) ? 'credit' : 'checking'
}

export function parseOfx(text: string): ParsedTransaction[] {
  const blocks = text
    .split(/<STMTTRN>/i)
    .slice(1)
    .map((b) => b.split(/<\/STMTTRN>/i)[0])
  if (!blocks.length) throw new StatementError('O arquivo OFX não tem nenhuma transação')
  return blocks.map((block, i) => {
    const date = parseDate(field(block, 'DTPOSTED') ?? '')
    const amount = field(block, 'TRNAMT')
    if (!date || amount === null) throw new StatementError(`Transação ${i + 1} do OFX sem data ou valor`)
    const memo = field(block, 'MEMO')
    const name = field(block, 'NAME')
    const description =
      [name, memo]
        .filter(Boolean)
        .filter((v, k, all) => all.indexOf(v) === k)
        .join(' - ') || 'Sem descrição'
    const fitid = field(block, 'FITID')
    return { date, description, amount: toCents(amount), externalId: fitid ? `ofx:${fitid}` : null }
  })
}
