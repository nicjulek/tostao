import { centsToInput, formatBRL, formatSigned, parseMoneyInput } from './money'

describe('money', () => {
  it('formata em reais', () => {
    expect(formatBRL(123456)).toBe('R$ 1.234,56')
    expect(formatSigned(-2190)).toBe('− R$ 21,90')
    expect(formatSigned(500)).toBe('+ R$ 5,00')
  })

  it.each([
    ['45,90', 4590],
    ['1.234,56', 123456],
    ['10', 1000],
    ['R$ 7,5', 750],
    ['12.5', 1250],
    ['abc', null],
    ['', null]
  ])('lê "%s" como %s centavos', (input, expected) => {
    expect(parseMoneyInput(input)).toBe(expected)
  })

  it('converte centavos para o campo de valor', () => {
    expect(centsToInput(-4590)).toBe('45,90')
  })
})
