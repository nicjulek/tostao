import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Skeleton } from '@/components/ui'
import { useAuth } from '@/features/auth/context'

export function RequireAuth() {
  const { token, loading } = useAuth()
  const location = useLocation()
  if (!token) return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6" aria-busy="true" aria-label="Carregando">
        <Skeleton className="h-10 w-64" />
      </div>
    )
  }
  return <Outlet />
}

export function GuestOnly() {
  const { token, redirectTo } = useAuth()
  return token ? <Navigate to={redirectTo} replace /> : <Outlet />
}

export function NotFound() {
  return (
    <div className="py-16">
      <h1 className="text-2xl font-semibold text-ink">Página não encontrada</h1>
      <p className="mt-2 text-sm text-ink-2">O endereço pode ter mudado. Volte para o resumo.</p>
    </div>
  )
}
