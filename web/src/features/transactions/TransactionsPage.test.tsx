import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { renderWithApp } from '@/test/render'
import TransactionsPage from './TransactionsPage'

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count, estimateSize }: { count: number; estimateSize: () => number }) => ({
    getTotalSize: () => count * estimateSize(),
    getVirtualItems: () => Array.from({ length: count }, (_, index) => ({ index, key: index, start: index * estimateSize() }))
  })
}))

describe('TransactionsPage', () => {
  it('lista as transações do mês com totais', async () => {
    renderWithApp(<TransactionsPage />, { route: '/transacoes?mes=2026-10' })
    expect(await screen.findByText('Spotify')).toBeInTheDocument()
    expect(screen.getByText('Padaria Sao Jose')).toBeInTheDocument()
    expect(screen.getByText(/transações/).textContent).toContain('3')
  })

  it('envia os filtros da URL para a API', async () => {
    let url = ''
    server.use(
      http.get('/api/transactions', ({ request }) => {
        url = request.url
        return HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 1000, totals: { income: 0, expense: 0 } })
      })
    )
    renderWithApp(<TransactionsPage />, { route: '/transacoes?mes=2026-10&categoria=none&tipo=expense' })
    expect(await screen.findByText('Nenhuma transação com esses filtros')).toBeInTheDocument()
    const params = new URL(url).searchParams
    expect(params.get('from')).toBe('2026-10-01')
    expect(params.get('to')).toBe('2026-10-31')
    expect(params.get('categoryId')).toBe('none')
    expect(params.get('type')).toBe('expense')
  })

  it('seleciona linhas e mostra a barra de ações em lote', async () => {
    renderWithApp(<TransactionsPage />, { route: '/transacoes?mes=2026-10' })
    await userEvent.click(await screen.findByLabelText('Selecionar Spotify'))
    await userEvent.click(screen.getByLabelText('Selecionar Padaria Sao Jose'))
    expect(screen.getByText('2 selecionadas')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/ }))
    expect(screen.queryByText('2 selecionadas')).not.toBeInTheDocument()
  })

  it('mostra o erro quando a API falha', async () => {
    server.use(http.get('/api/transactions', () => HttpResponse.json({ message: 'Falha no banco' }, { status: 500 })))
    renderWithApp(<TransactionsPage />, { route: '/transacoes?mes=2026-10' })
    const alert = await screen.findByRole('alert', {}, { timeout: 4000 })
    expect(within(alert).getByText('Falha no banco')).toBeInTheDocument()
  })
})
