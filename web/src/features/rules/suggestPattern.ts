export function suggestPattern(description: string): string {
  return description
    .replace(/^(Compra no débito( via NuPay)?|Pagamento de boleto efetuado|Transferência (enviada|recebida)( pelo Pix)?)\s*-\s*/i, '')
    .split(' - ')[0]
    .replace(/\*.*$/, '')
    .replace(/\s+parcela.*$/i, '')
    .trim()
    .slice(0, 60)
}
