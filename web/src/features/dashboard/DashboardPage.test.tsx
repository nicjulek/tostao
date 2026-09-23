import { screen } from '@testing-library/react'
import { renderWithApp } from '@/test/render'
import DashboardPage from './DashboardPage'

describe('DashboardPage', () => {
  it('conta o mês em uma frase e lista as categorias', async () => {
    renderWithApp(<DashboardPage />, { route: '/?mes=2026-10' })
    const hero = await screen.findByRole('heading', { level: 2, name: /Em outubro entrou/ })
    expect(hero).toHaveTextContent('R$ 3.200,00')
    expect(hero).toHaveTextContent('R$ 2.914,22')
    expect(screen.getByText(/Sobraram/)).toHaveTextContent('R$ 285,78')
    expect(screen.getByText('3 transações estão sem categoria.')).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'Uso do orçamento' })).toHaveAttribute('aria-valuenow', '38000')
    expect(await screen.findByText('Spotify')).toBeInTheDocument()
  })
})
