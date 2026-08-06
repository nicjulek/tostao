export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

export function merchantKey(description: string): string {
  return normalize(description)
    .replace(/\s*-?\s*parcela\s*\d+\s*\/\s*\d+/g, '')
    .replace(
      /^(compra no debito( via nupay)?|pagamento de boleto efetuado|transferencia (enviada|recebida) pelo pix|transferencia (enviada|recebida))\s*-\s*/,
      ''
    )
    .replace(/\s-\s.*$/, '')
    .replace(/[*#]/g, ' ')
    .replace(/\d{3,}/g, '')
    .replace(/[•.]{2,}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
