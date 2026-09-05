import type { HTMLAttributes, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatBRL, formatSigned } from '@/lib/money'
import { Button } from './button'

export function Panel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn('rounded-lg border border-line bg-surface p-5', className)} {...props} />
}

export function PanelTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 className="text-base font-semibold text-ink">{children}</h2>
      {action}
    </div>
  )
}

export function Money({ cents, signed, className }: { cents: number; signed?: boolean; className?: string }) {
  return (
    <span className={cn('tabular whitespace-nowrap', signed && cents > 0 && 'text-income', className)}>
      {signed ? formatSigned(cents) : formatBRL(cents)}
    </span>
  )
}

export function CategoryDot({ color, className }: { color: string; className?: string }) {
  return <span className={cn('inline-block size-2.5 shrink-0 rounded-full', className)} style={{ background: color }} aria-hidden />
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-2', className)} aria-hidden />
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-line px-6 py-10">
      <p className="text-lg font-semibold text-ink">{title}</p>
      {children ? <div className="max-w-prose text-sm text-ink-2">{children}</div> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Não foi possível carregar.'
  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm text-ink">
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
      <div className="grid gap-2">
        <p>{message}</p>
        {onRetry ? (
          <Button size="sm" variant="secondary" onClick={onRetry} className="justify-self-start">
            Tentar de novo
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'warning' | 'danger' }) {
  const tones = {
    neutral: 'bg-surface-2 text-ink-2',
    brand: 'bg-brand-soft text-ink',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger'
  }
  return <span className={cn('inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-prose text-sm text-ink-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  )
}
