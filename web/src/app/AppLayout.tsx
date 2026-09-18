import { Suspense } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ArrowLeftRight, FolderTree, Landmark, LayoutDashboard, LogOut, Moon, Repeat, Sun, Upload, Wand2 } from 'lucide-react'
import { Button, DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger, Skeleton } from '@/components/ui'
import { useAuth } from '@/features/auth/context'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { cn } from '@/lib/cn'
import { useTheme } from './useTheme'

const NAV = [
  { to: '/', label: 'Resumo', icon: LayoutDashboard, end: true },
  { to: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
  { to: '/importar', label: 'Importar', icon: Upload },
  { to: '/assinaturas', label: 'Assinaturas', icon: Repeat },
  { to: '/regras', label: 'Regras', icon: Wand2 },
  { to: '/categorias', label: 'Categorias', icon: FolderTree },
  { to: '/contas', label: 'Contas', icon: Landmark }
]

const MOBILE = NAV.slice(0, 4)

function Logo() {
  return (
    <span className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <circle cx="16" cy="16" r="15" fill="var(--brand)" />
        <circle cx="16" cy="16" r="11" fill="none" stroke="var(--brand-ink)" strokeWidth="1.2" strokeDasharray="1.6 1.6" />
        <path d="M11.5 12h9M16 12v9.5" stroke="var(--brand-ink)" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      Tostão
    </span>
  )
}

export function AppLayout() {
  const { user, signOut } = useAuth()
  const [dark, toggleTheme] = useTheme()
  const navigate = useNavigate()

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface px-3 py-5 lg:flex">
        <div className="px-3">
          <Logo />
        </div>
        <nav className="mt-8 grid gap-0.5" aria-label="Principal">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-soft text-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur sm:px-6">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={dark ? 'Usar tema claro' : 'Usar tema escuro'}>
              {dark ? <Sun /> : <Moon />}
            </Button>
            <DropdownMenu>
              <DropdownTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 pl-1.5">
                  <span className="grid size-7 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-ink" aria-hidden>
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden max-w-32 truncate sm:inline">{user?.name}</span>
                </Button>
              </DropdownTrigger>
              <DropdownContent>
                <div className="px-2 py-1.5 text-xs text-ink-3">{user?.email}</div>
                <div className="lg:hidden">
                  {NAV.slice(4).map(({ to, label, icon: Icon }) => (
                    <DropdownItem key={to} onSelect={() => navigate(to)}>
                      <Icon />
                      {label}
                    </DropdownItem>
                  ))}
                </div>
                <DropdownItem onSelect={signOut}>
                  <LogOut />
                  Sair
                </DropdownItem>
              </DropdownContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Atalhos"
      >
        {MOBILE.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn('flex flex-col items-center gap-1 py-2.5 text-xs font-medium', isActive ? 'text-ink' : 'text-ink-3')
            }
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function PageFallback() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
