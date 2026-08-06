import { merchantKey, normalize } from './text'

describe('normalize', () => {
  it('remove acentos, caixa e espaços extras', () => {
    expect(normalize('  Transferência   Recebida ')).toBe('transferencia recebida')
  })
})

describe('merchantKey', () => {
  it('extrai o estabelecimento de compras no débito', () => {
    expect(merchantKey('Compra no débito - IFOOD *IFOOD')).toBe('ifood ifood')
  })

  it('ignora parcelas e números', () => {
    expect(merchantKey('Kabum - Parcela 2/3')).toBe('kabum')
    expect(merchantKey('Netflix.Com')).toBe('netflix.com')
  })

  it('usa só o nome em transferências pelo Pix', () => {
    expect(merchantKey('Transferência enviada pelo Pix - MARIA SOUZA - •••.123.456-•• - NU PAGAMENTOS')).toBe('maria souza')
  })
})
