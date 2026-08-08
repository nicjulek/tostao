import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseCsv } from './csv'
import { parseDate } from './dates'
import { parseStatement } from './index'

const example = (name: string) => readFileSync(join(__dirname, '../../../../../exemplos', name))

describe('parseCsv', () => {
  it('lida com aspas, vírgulas no texto e ponto e vírgula', () => {
    expect(parseCsv('a,b\n1,"x, y"\n')).toEqual([
      ['a', 'b'],
      ['1', 'x, y']
    ])
    expect(parseCsv('a;b\r\n1;"diz ""oi"""\r\n')).toEqual([
      ['a', 'b'],
      ['1', 'diz "oi"']
    ])
  })

  it('ignora o BOM e linhas vazias', () => {
    expect(parseCsv('﻿a,b\n\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2']
    ])
  })
})

describe('parseDate', () => {
  it.each([
    ['05/10/2026', '2026-10-05'],
    ['2026-10-05', '2026-10-05'],
    ['5/1/26', '2026-01-05'],
    ['20261005000000[-3:BRT]', '2026-10-05']
  ])('entende %s', (input, expected) => expect(parseDate(input)).toBe(expected))

  it('recusa datas que não existem', () => {
    expect(parseDate('31/02/2026')).toBeNull()
  })
})

describe('parseStatement', () => {
  it('reconhece o extrato da conta Nubank', () => {
    const s = parseStatement(example('nubank-conta.csv'))
    expect(s.format).toBe('nubank-conta-csv')
    expect(s.suggestedAccountKind).toBe('checking')
    expect(s.transactions).toHaveLength(38)
    const salary = s.transactions.find((t) => t.description.startsWith('Transferência recebida pelo Pix - EMPRESA'))
    expect(salary?.amount).toBe(320000)
    expect(salary?.externalId).toMatch(/^nu:/)
    expect(s.transactions.every((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.date))).toBe(true)
  })

  it('reconhece a fatura do cartão e inverte o sinal', () => {
    const s = parseStatement(example('nubank-cartao.csv'))
    expect(s.format).toBe('nubank-cartao-csv')
    const spotify = s.transactions.find((t) => t.description === 'Spotify')
    expect(spotify?.amount).toBe(-2190)
    const payment = s.transactions.find((t) => t.description === 'Pagamento recebido')
    expect(payment?.amount).toBe(118045)
  })

  it('gera ids estáveis para a fatura, mesmo com compras repetidas no dia', () => {
    const text = Buffer.from('date,title,amount\n2026-10-01,Uber *Trip,15.00\n2026-10-01,Uber *Trip,15.00\n')
    const a = parseStatement(text).transactions
    const b = parseStatement(text).transactions
    expect(a[0].externalId).not.toBe(a[1].externalId)
    expect(a.map((t) => t.externalId)).toEqual(b.map((t) => t.externalId))
  })

  it('lê OFX em windows-1252', () => {
    const s = parseStatement(example('extrato.ofx'))
    expect(s.format).toBe('ofx')
    expect(s.transactions).toHaveLength(12)
    expect(s.transactions.some((t) => t.description.includes('Agência'))).toBe(true)
    expect(s.transactions.every((t) => t.externalId?.startsWith('ofx:'))).toBe(true)
  })

  it('aceita CSV de outros bancos com colunas em português', () => {
    const csv = 'Extrato de conta\nData Lançamento;Histórico;Valor (R$)\n02/10/2026;PIX RECEBIDO;1.500,00\n03/10/2026;SUPERMERCADO;-89,90\n'
    const s = parseStatement(Buffer.from(csv))
    expect(s.format).toBe('csv')
    expect(s.transactions.map((t) => t.amount)).toEqual([150000, -8990])
  })

  it('aceita colunas separadas de débito e crédito', () => {
    const s = parseStatement(Buffer.from('Data;Descrição;Débito;Crédito\n02/10/2026;Salário;;2000,00\n03/10/2026;Farmácia;35,50;\n'))
    expect(s.transactions.map((t) => t.amount)).toEqual([200000, -3550])
  })

  it('explica quando o arquivo não serve', () => {
    expect(() => parseStatement(Buffer.from(''))).toThrow('vazio')
    expect(() => parseStatement(Buffer.from('nome,idade\nana,3\n'))).toThrow('colunas de data')
  })
})
