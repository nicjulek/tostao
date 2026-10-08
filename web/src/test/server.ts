import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { accounts, categories, summary, transactions } from './fixtures'

export const handlers = [
  http.get('/api/auth/me', () => HttpResponse.json({ id: 'u1', name: 'Nicole', email: 'demo@tostao.app' })),
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    if (body.password !== 'demo12345') return HttpResponse.json({ statusCode: 401, message: 'E-mail ou senha incorretos' }, { status: 401 })
    return HttpResponse.json({ accessToken: 'token-teste', user: { id: 'u1', name: 'Nicole', email: body.email } })
  }),
  http.get('/api/categories', () => HttpResponse.json(categories)),
  http.get('/api/accounts', () => HttpResponse.json(accounts)),
  http.get('/api/transactions', () =>
    HttpResponse.json({
      items: transactions,
      total: transactions.length,
      page: 1,
      pageSize: 1000,
      totals: { income: 320000, expense: -4040 }
    })
  ),
  http.patch('/api/transactions/:id', async ({ params, request }) => {
    const body = (await request.json()) as { categoryId: string | null }
    const t = transactions.find((x) => x.id === params.id)!
    return HttpResponse.json({ ...t, categoryId: body.categoryId, category: categories.find((c) => c.id === body.categoryId) ?? null })
  }),
  http.get('/api/reports/summary', () => HttpResponse.json(summary)),
  http.get('/api/reports/trend', () =>
    HttpResponse.json([
      { month: '2026-09', income: 320000, expense: -250000 },
      { month: '2026-10', income: 320000, expense: -291422 }
    ])
  ),
  http.get('/api/reports/recurring', () =>
    HttpResponse.json({
      charges: [
        { key: 'spotify', description: 'Spotify', averageAmount: -2190, months: 3, lastDate: '2026-10-03', nextDate: '2026-11-03' }
      ],
      monthlyTotal: -2190
    })
  ),
  http.get('/api/notifications', () => HttpResponse.json({ items: [], unread: 0 })),
  http.post('/api/telemetry', () => new HttpResponse(null, { status: 202 }))
]

export const server = setupServer(...handlers)
