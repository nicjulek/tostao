function titleCase(text: string): string {
  if (text !== text.toUpperCase()) return text
  return text
    .toLowerCase()
    .replace(/(^|[\s/(-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase())
    .replace(/\b(De|Da|Do|Das|Dos|E)\b/g, (w) => w.toLowerCase())
    .replace(/\bS\.a\.(?=\s|$)/g, 'S.A.')
    .replace(/\bLtda\b/g, 'LTDA')
}

export function prettyDescription(description: string): string {
  const parts = description.split(' - ').map((p) => p.trim())
  const head = parts[0].toLowerCase()
  const name = parts[1] ? titleCase(parts[1].replace(/\s+/g, ' ')) : ''
  if (head.startsWith('transferência enviada') || head.startsWith('transferencia enviada')) return name ? `Pix para ${name}` : 'Pix enviado'
  if (head.startsWith('transferência recebida') || head.startsWith('transferencia recebida'))
    return name ? `Pix de ${name}` : 'Pix recebido'
  if (head.startsWith('compra no débito') || head.startsWith('compra no debito'))
    return name ? titleCase(parts.slice(1).join(' - ')) : description
  if (head.startsWith('pagamento de boleto')) return name ? `Boleto ${name}` : 'Boleto'
  return titleCase(description)
}
