import { CategoryKind } from './category.entity'

export interface DefaultCategory {
  name: string
  kind: CategoryKind
  color: string
  keywords: string[]
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    name: 'Alimentação',
    kind: 'expense',
    color: '#d9824b',
    keywords: [
      'ifood',
      'rappi',
      'restaurante',
      'lanchonete',
      'padaria',
      'burger',
      'pizza',
      'mcdonald',
      'subway',
      'cafe',
      'starbucks',
      'sorvete',
      'acai',
      'bar '
    ]
  },
  {
    name: 'Compras',
    kind: 'expense',
    color: '#c9a227',
    keywords: [
      'amazon',
      'mercadolivre',
      'mercado livre',
      'shopee',
      'aliexpress',
      'magalu',
      'magazine luiza',
      'americanas',
      'shein',
      'kabum',
      'renner',
      'riachuelo',
      'c&a'
    ]
  },
  {
    name: 'Mercado',
    kind: 'expense',
    color: '#6c9a3c',
    keywords: [
      'mercado',
      'supermercado',
      'atacad',
      'assai',
      'carrefour',
      'condor',
      'muffato',
      'sams club',
      'hortifruti',
      'zaffari',
      'pao de acucar',
      'big '
    ]
  },
  {
    name: 'Transporte',
    kind: 'expense',
    color: '#3f7fb5',
    keywords: [
      'uber',
      '99app',
      '99 pop',
      '99pop',
      'cabify',
      'posto',
      'combustivel',
      'shell',
      'ipiranga',
      'estacionamento',
      'onibus',
      'metro',
      'sem parar',
      'veloe',
      'passagem'
    ]
  },
  {
    name: 'Assinaturas',
    kind: 'expense',
    color: '#8a5cc2',
    keywords: [
      'spotify',
      'netflix',
      'disney',
      'hbo',
      'max.com',
      'prime video',
      'amazon prime',
      'youtube',
      'apple.com',
      'google one',
      'deezer',
      'crunchyroll',
      'xbox game pass',
      'playstation plus',
      'chatgpt',
      'icloud'
    ]
  },
  {
    name: 'Lazer',
    kind: 'expense',
    color: '#c45a8c',
    keywords: ['steam', 'nintendo', 'playstation', 'epic games', 'cinema', 'cinemark', 'ingresso', 'sympla', 'eventim', 'show', 'teatro']
  },
  {
    name: 'Saúde',
    kind: 'expense',
    color: '#3aa39a',
    keywords: [
      'farmacia',
      'drogaria',
      'raia',
      'drogasil',
      'pague menos',
      'panvel',
      'hospital',
      'clinica',
      'laboratorio',
      'unimed',
      'dentista',
      'academia',
      'smartfit',
      'smart fit'
    ]
  },
  {
    name: 'Moradia',
    kind: 'expense',
    color: '#8b6f4e',
    keywords: [
      'aluguel',
      'condominio',
      'copel',
      'sanepar',
      'energia',
      'enel',
      'cemig',
      'sabesp',
      'internet',
      'vivo',
      'claro',
      'tim ',
      'oi fibra'
    ]
  },
  {
    name: 'Educação',
    kind: 'expense',
    color: '#4f6bd1',
    keywords: ['uepg', 'faculdade', 'universidade', 'curso', 'udemy', 'alura', 'rocketseat', 'livraria', 'amazon kindle']
  },
  {
    name: 'Pix e transferências enviadas',
    kind: 'expense',
    color: '#7b8794',
    keywords: ['transferencia enviada', 'pix enviado']
  },
  { name: 'Outros gastos', kind: 'expense', color: '#a0a7ae', keywords: [] },
  {
    name: 'Salário',
    kind: 'income',
    color: '#2f8f5b',
    keywords: ['salario', 'folha de pagamento', 'bolsa estagio', 'ciee', 'iel ', 'pagamento de salario']
  },
  {
    name: 'Recebidos',
    kind: 'income',
    color: '#4cae7a',
    keywords: ['transferencia recebida', 'pix recebido', 'reembolso', 'estorno']
  },
  {
    name: 'Movimentação interna',
    kind: 'transfer',
    color: '#9aa5b1',
    keywords: [
      'pagamento de fatura',
      'pagamento recebido',
      'aplicacao rdb',
      'resgate rdb',
      'dinheiro guardado',
      'dinheiro resgatado',
      'caixinha'
    ]
  }
]

export const FALLBACK = { expense: 'Outros gastos', income: 'Recebidos' } as const
