import { Categorizer, matches } from './categorizer'

const categories = [
  { id: 'food', name: 'Alimentação' },
  { id: 'subs', name: 'Assinaturas' },
  { id: 'internal', name: 'Movimentação interna' },
  { id: 'other', name: 'Outros gastos' },
  { id: 'received', name: 'Recebidos' },
  { id: 'salary', name: 'Salário' },
  { id: 'games', name: 'Jogos' }
]

describe('matches', () => {
  it('compara sem acento e sem caixa', () => {
    expect(matches('Compra no débito - IFOOD', { pattern: 'ifood', matchType: 'contains' })).toBe(true)
    expect(matches('Pagamento de fatura', { pattern: 'PAGAMENTO', matchType: 'starts_with' })).toBe(true)
    expect(matches('Spotify', { pattern: 'spotify', matchType: 'exact' })).toBe(true)
    expect(matches('Spotify Premium', { pattern: 'spotify', matchType: 'exact' })).toBe(false)
  })
})

describe('Categorizer', () => {
  it('usa as palavras-chave padrão', () => {
    const c = new Categorizer([], categories)
    expect(c.categorize('Ifood *Ifood', -4500)).toEqual({ categoryId: 'food', source: 'default' })
    expect(c.categorize('Netflix.Com', -3990).categoryId).toBe('subs')
    expect(c.categorize('Pagamento de fatura', -118045).categoryId).toBe('internal')
    expect(c.categorize('Pagamento recebido', 118045).categoryId).toBe('internal')
  })

  it('cai em "Outros gastos" ou "Recebidos" quando nada combina', () => {
    const c = new Categorizer([], categories)
    expect(c.categorize('Loja desconhecida', -1000)).toEqual({ categoryId: 'other', source: 'fallback' })
    expect(c.categorize('Depósito', 1000)).toEqual({ categoryId: 'received', source: 'fallback' })
  })

  it('dá prioridade às regras do usuário', () => {
    const c = new Categorizer(
      [
        { pattern: 'steam', matchType: 'contains', categoryId: 'games', priority: 0 },
        { pattern: 'empresa exemplo', matchType: 'contains', categoryId: 'salary', priority: 5 }
      ],
      categories
    )
    expect(c.categorize('Steam Purchase', -5000)).toEqual({ categoryId: 'games', source: 'rule' })
    expect(c.categorize('Transferência recebida pelo Pix - EMPRESA EXEMPLO LTDA', 320000).categoryId).toBe('salary')
  })

  it('não usa categoria de gasto para entrada de dinheiro', () => {
    const c = new Categorizer([], categories)
    expect(c.categorize('Estorno Ifood', 4500).categoryId).toBe('received')
  })
})
