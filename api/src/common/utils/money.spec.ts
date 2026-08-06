import { toCents } from './money'

describe('toCents', () => {
  it.each([
    ['-45.90', -4590],
    ['45,90', 4590],
    ['1.234,56', 123456],
    ['1,234.56', 123456],
    ['R$ 10,00', 1000],
    ['(12,50)', -1250],
    ['3200.00', 320000],
    ['0.1', 10]
  ])('converte %s em %i centavos', (input, expected) => {
    expect(toCents(input)).toBe(expected)
  })

  it('recusa texto que não é número', () => {
    expect(() => toCents('abc')).toThrow('Valor inválido')
  })
})
