import { monthRange, relativeDays, shiftMonth } from './dates'

describe('dates', () => {
  it('anda entre meses e anos', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })

  it('calcula o último dia do mês', () => {
    expect(monthRange('2028-02')).toEqual({ from: '2028-02-01', to: '2028-02-29' })
  })

  it('descreve distâncias em dias', () => {
    expect(relativeDays('2026-11-03', '2026-11-01')).toBe('em 2 dias')
    expect(relativeDays('2026-11-02', '2026-11-01')).toBe('amanhã')
    expect(relativeDays('2026-10-30', '2026-11-01')).toBe('há 2 dias')
  })
})
