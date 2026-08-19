import { detectRecurring } from './recurring'

describe('detectRecurring', () => {
  const base = [
    { date: '2026-08-03', description: 'Spotify', amount: -2190 },
    { date: '2026-09-03', description: 'Spotify', amount: -2190 },
    { date: '2026-10-03', description: 'Spotify', amount: -2190 },
    { date: '2026-08-10', description: 'Ifood *Ifood', amount: -4500 },
    { date: '2026-09-11', description: 'Ifood *Ifood', amount: -9800 },
    { date: '2026-10-12', description: 'Ifood *Ifood', amount: -2100 },
    { date: '2026-09-14', description: 'Kabum - Parcela 1/3', amount: -14990 },
    { date: '2026-10-14', description: 'Kabum - Parcela 2/3', amount: -14990 },
    { date: '2026-11-14', description: 'Kabum - Parcela 3/3', amount: -14990 }
  ]

  it('encontra cobranças mensais com valor estável', () => {
    const result = detectRecurring(base)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ description: 'Spotify', averageAmount: -2190, months: 3, nextDate: '2026-11-03' })
  })

  it('ignora gastos com valor muito variável e parcelas', () => {
    const keys = detectRecurring(base).map((r) => r.key)
    expect(keys).not.toContain('ifood ifood')
    expect(keys).not.toContain('kabum')
  })

  it('exige pelo menos três meses', () => {
    expect(detectRecurring(base.slice(0, 2))).toHaveLength(0)
  })

  it('ajusta o próximo vencimento para meses curtos', () => {
    const r = detectRecurring([
      { date: '2026-11-30', description: 'Academia', amount: -9900 },
      { date: '2026-12-30', description: 'Academia', amount: -9900 },
      { date: '2027-01-30', description: 'Academia', amount: -9900 }
    ])
    expect(r[0].nextDate).toBe('2027-02-28')
  })
})
