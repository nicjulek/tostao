import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithApp } from '@/test/render'
import { LoginPage } from './AuthPages'

describe('LoginPage', () => {
  it('valida os campos antes de enviar', async () => {
    renderWithApp(<LoginPage />, { route: '/entrar', path: '/entrar', token: null })
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Informe um e-mail válido')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha')).toBeInTheDocument()
  })

  it('mostra o erro da API quando a senha está errada', async () => {
    renderWithApp(<LoginPage />, { route: '/entrar', path: '/entrar', token: null })
    await userEvent.type(screen.getByLabelText('E-mail'), 'demo@tostao.app')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos')
  })

  it('entra e guarda a sessão', async () => {
    renderWithApp(<LoginPage />, { route: '/entrar', path: '/entrar', token: null })
    await userEvent.type(screen.getByLabelText('E-mail'), 'demo@tostao.app')
    await userEvent.type(screen.getByLabelText('Senha'), 'demo12345')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(localStorage.getItem('tostao:token')).toBe('token-teste'))
  })
})
