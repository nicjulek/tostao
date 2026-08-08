export function detectDelimiter(sample: string): string {
  const lines = sample
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .slice(1, 8)
  let best = ','
  let bestScore = 0
  for (const d of [',', ';', '\t']) {
    const counts = lines.map((l) => l.split(d).length - 1).filter((n) => n > 0)
    const score = counts.length * 1000 + (counts.length ? Math.min(...counts) : 0)
    if (score > bestScore) {
      bestScore = score
      best = d
    }
  }
  return best
}

export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '')
  const delimiter = detectDelimiter(clean.slice(0, 4000))
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (quoted) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += ch
      continue
    }
    if (ch === '"' && field === '') quoted = true
    else if (ch === delimiter) {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++
      row.push(field)
      if (row.some((c) => c.trim() !== '')) rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  row.push(field)
  if (row.some((c) => c.trim() !== '')) rows.push(row)
  return rows.map((r) => r.map((c) => c.trim()))
}
