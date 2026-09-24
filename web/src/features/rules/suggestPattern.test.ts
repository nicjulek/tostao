import { suggestPattern } from './suggestPattern'

describe('suggestPattern', () => {
  it.each([
    ['Compra no débito - IFOOD *IFOOD', 'IFOOD'],
    ['Transferência enviada pelo Pix - MARIA SOUZA - •••.123.456-•• - NU PAGAMENTOS', 'MARIA SOUZA'],
    ['Pagamento de boleto efetuado - COPEL DISTRIBUICAO S.A.', 'COPEL DISTRIBUICAO S.A.'],
    ['Kabum - Parcela 2/3', 'Kabum'],
    ['Steam Purchase', 'Steam Purchase']
  ])('sugere um texto curto para "%s"', (description, expected) => {
    expect(suggestPattern(description)).toBe(expected)
  })
})
