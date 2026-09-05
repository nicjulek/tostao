import { prettyDescription } from './describe'

describe('prettyDescription', () => {
  it.each([
    [
      'Transferência enviada pelo Pix - IMOBILIARIA CAMPOS GERAIS - 98.765.432/0001-10 - ITAÚ UNIBANCO',
      'Pix para Imobiliaria Campos Gerais'
    ],
    ['Transferência recebida pelo Pix - JOAO PEREIRA - •••.987.654-•• - CAIXA', 'Pix de Joao Pereira'],
    ['Compra no débito - MERCADO CONDOR', 'Mercado Condor'],
    ['Pagamento de boleto efetuado - COPEL DISTRIBUICAO S.A.', 'Boleto Copel Distribuicao S.A.'],
    ['Netflix.Com', 'Netflix.Com'],
    ['Pagamento de fatura', 'Pagamento de fatura']
  ])('%s', (input, expected) => expect(prettyDescription(input)).toBe(expected))
})
