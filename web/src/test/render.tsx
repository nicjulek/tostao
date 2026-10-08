import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthProvider'

export function renderWithApp(
  ui: ReactElement,
  { route = '/', path = '*', token = 'token-teste' }: { route?: string; path?: string; token?: string | null } = {}
) {
  if (token) localStorage.setItem('tostao:token', token)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <AuthProvider>
          <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path={path} element={ui} />
              {path !== '*' ? <Route path="/" element={<p>Página inicial</p>} /> : null}
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    )
  }
}
