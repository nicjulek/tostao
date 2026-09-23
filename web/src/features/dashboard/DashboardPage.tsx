import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, Tags } from 'lucide-react'
import { CumulativeLine } from '@/components/charts/CumulativeLine'
import { GroupedBars } from '@/components/charts/GroupedBars'
import { BudgetBar, Button, CategoryDot, EmptyState, ErrorState, Money, Panel, PanelTitle, Skeleton } from '@/components/ui'
import { MonthSwitcher } from '@/app/MonthSwitcher'
import { useMonth } from '@/app/useMonth'
import { currentMonth, formatDayMonth, formatMonthName, formatMonthShort, monthRange, relativeDays, shiftMonth } from '@/lib/dates'
import { reportsApi } from '@/lib/endpoints'
import { prettyDescription } from '@/lib/describe'
import { formatBRL } from '@/lib/money'
import { qk } from '@/lib/queryKeys'
import type { CategorySpend, MonthSummary } from '@/lib/types'

export default function DashboardPage() {
  const [month, setMonth] = useMonth()
  const summary = useQuery({ queryKey: qk.summary(month), queryFn: () => reportsApi.summary(month) })
  const trend = useQuery({ queryKey: qk.trend(month), queryFn: () => reportsApi.trend(month, 6) })
  const recurring = useQuery({ queryKey: qk.recurring(month), queryFn: () => reportsApi.recurring(month) })

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="sr-only">Resumo de {formatMonthName(month)}</h1>
        <MonthSwitcher month={month} onChange={setMonth} />
        <Button asChild variant="secondary" size="sm">
          <Link to="/importar">Importar extrato</Link>
        </Button>
      </div>

      {summary.isPending ? (
        <HeroSkeleton />
      ) : summary.isError ? (
        <ErrorState error={summary.error} onRetry={() => summary.refetch()} />
      ) : summary.data.income === 0 && summary.data.expense === 0 ? (
        <EmptyState
          title={`Nada registrado em ${formatMonthName(month)}`}
          action={
            <Button asChild>
              <Link to="/importar">Importar extrato</Link>
            </Button>
          }
        >
          Exporte o extrato do Nubank em CSV ou OFX e importe aqui. Em segundos as transações aparecem separadas por categoria.
        </EmptyState>
      ) : (
        <>
          <Hero summary={summary.data} />
          {summary.data.uncategorized > 0 ? (
            <Link
              to={`/transacoes?mes=${month}&categoria=none`}
              className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-ink hover:border-warning/60"
            >
              <Tags className="size-4 text-warning" aria-hidden />
              {summary.data.uncategorized} transações estão sem categoria.
              <span className="ml-auto inline-flex items-center gap-1 font-medium">
                Revisar <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          ) : null}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <CategoryBreakdown items={summary.data.byCategory.filter((c) => c.kind === 'expense')} month={month} />
            <div className="grid content-start gap-6">
              <SpendingPace summary={summary.data} month={month} />
              <TopMerchants summary={summary.data} />
            </div>
          </div>
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Panel>
          <PanelTitle>Entradas e saídas nos últimos 6 meses</PanelTitle>
          {trend.isPending ? (
            <Skeleton className="h-56" />
          ) : trend.isError ? (
            <ErrorState error={trend.error} onRetry={() => trend.refetch()} />
          ) : trend.data.every((t) => t.income === 0 && t.expense === 0) ? (
            <p className="text-sm text-ink-2">O gráfico aparece depois da primeira importação.</p>
          ) : (
            <GroupedBars
              title="Entradas e saídas por mês"
              data={trend.data.map((t) => ({ label: formatMonthShort(t.month), values: { income: t.income, expense: t.expense } }))}
              series={[
                { key: 'income', label: 'Entradas', color: 'var(--income)' },
                { key: 'expense', label: 'Saídas', color: 'var(--expense)' }
              ]}
            />
          )}
        </Panel>
        <Panel>
          <PanelTitle
            action={
              <Link to="/assinaturas" className="text-sm font-medium text-ink-2 hover:text-ink">
                Ver todas
              </Link>
            }
          >
            Assinaturas e contas fixas
          </PanelTitle>
          {recurring.isPending ? (
            <Skeleton className="h-40" />
          ) : recurring.isError ? (
            <ErrorState error={recurring.error} />
          ) : !recurring.data.charges.length ? (
            <p className="text-sm text-ink-2">Quando algo se repetir por 3 meses com valor parecido, aparece aqui.</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-ink-2">
                Cerca de <strong className="tabular text-ink">{formatBRL(Math.abs(recurring.data.monthlyTotal))}</strong> por mês em{' '}
                {recurring.data.charges.length} cobranças.
              </p>
              <ul className="divide-y divide-line">
                {recurring.data.charges.slice(0, 5).map((c) => (
                  <li key={c.key} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink" title={c.description}>
                        {prettyDescription(c.description)}
                      </p>
                      <p className="text-xs text-ink-3">
                        Próxima: {formatDayMonth(c.nextDate)}
                        {month === currentMonth() ? ` (${relativeDays(c.nextDate)})` : ''}
                      </p>
                    </div>
                    <Money cents={Math.abs(c.averageAmount)} className="text-ink" />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>
    </div>
  )
}

function Hero({ summary }: { summary: MonthSummary }) {
  const spent = Math.abs(summary.expense)
  const previousSpent = Math.abs(summary.previous.expense)
  const diff = spent - previousSpent
  const name = formatMonthName(summary.month)
  const prevName = formatMonthName(shiftMonth(summary.month, -1))
  return (
    <section aria-labelledby="hero-title" className="pt-2">
      <h2 id="hero-title" className="max-w-4xl text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-ink sm:text-display">
        Em {name} entrou <span className="tabular whitespace-nowrap text-income">{formatBRL(summary.income)}</span> e saiu{' '}
        <span className="tabular whitespace-nowrap text-expense">{formatBRL(spent)}</span>.
      </h2>
      <p className="mt-4 max-w-3xl text-lg text-ink-2">
        {summary.balance >= 0 ? (
          <>
            Sobraram <strong className="tabular font-semibold text-ink">{formatBRL(summary.balance)}</strong>.
          </>
        ) : (
          <>
            Faltaram <strong className="tabular font-semibold text-danger">{formatBRL(Math.abs(summary.balance))}</strong>.
          </>
        )}{' '}
        {previousSpent > 0 ? (
          diff === 0 ? (
            <>Você gastou o mesmo que em {prevName}.</>
          ) : (
            <>
              Você gastou <span className="tabular font-medium text-ink">{formatBRL(Math.abs(diff))}</span>{' '}
              {diff > 0 ? 'a mais' : 'a menos'} que em {prevName}.
            </>
          )
        ) : null}
        {summary.transfers > 0 ? (
          <span className="block pt-1 text-sm text-ink-3">
            {summary.transfers} movimentações internas, como pagamento de fatura, ficaram de fora para não contar duas vezes.
          </span>
        ) : null}
      </p>
    </section>
  )
}

function HeroSkeleton() {
  return (
    <div className="grid gap-3 pt-2" aria-busy="true" aria-label="Carregando resumo">
      <Skeleton className="h-12 w-full max-w-3xl" />
      <Skeleton className="h-12 w-2/3 max-w-2xl" />
      <Skeleton className="mt-2 h-6 w-1/2 max-w-xl" />
    </div>
  )
}

function CategoryBreakdown({ items, month }: { items: CategorySpend[]; month: string }) {
  const max = Math.max(1, ...items.map((i) => Math.abs(i.total)))
  return (
    <Panel>
      <PanelTitle
        action={
          <Link to="/categorias" className="text-sm font-medium text-ink-2 hover:text-ink">
            Orçamentos
          </Link>
        }
      >
        Para onde foi o dinheiro
      </PanelTitle>
      {!items.length ? (
        <p className="text-sm text-ink-2">Nenhum gasto neste mês.</p>
      ) : (
        <ul className="grid gap-4">
          {items.map((c) => {
            const spent = Math.abs(c.total)
            const href = `/transacoes?mes=${month}&categoria=${c.categoryId ?? 'none'}`
            return (
              <li key={c.categoryId ?? 'none'}>
                <Link to={href} className="group grid gap-1.5 rounded-md">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-ink group-hover:underline group-hover:underline-offset-4">
                      <CategoryDot color={c.color} />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="shrink-0 text-ink-2">
                      <span className="tabular font-medium text-ink">{formatBRL(spent)}</span>
                      {c.budget ? <span className="tabular"> de {formatBRL(c.budget)}</span> : null}
                    </span>
                  </div>
                  {c.budget ? (
                    <BudgetBar spent={spent} budget={c.budget} color={c.color} />
                  ) : (
                    <div className="h-1.5 rounded-full bg-surface-2">
                      <div className="h-full rounded-full" style={{ width: `${(spent / max) * 100}%`, background: c.color }} />
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

function SpendingPace({ summary, month }: { summary: MonthSummary; month: string }) {
  const totalBudget = useMemo(
    () => summary.byCategory.filter((c) => c.kind === 'expense').reduce((s, c) => s + (c.budget ?? 0), 0),
    [summary.byCategory]
  )
  const lastDay = Number(monthRange(month).to.slice(8))
  const today = month === currentMonth() ? new Date().getDate() : null
  return (
    <Panel>
      <PanelTitle>Gasto acumulado no mês</PanelTitle>
      <CumulativeLine
        title="Gasto acumulado por dia"
        points={summary.daily.map((d) => ({ day: d.day, value: Math.abs(d.cumulative) }))}
        budget={totalBudget || null}
        lastDay={lastDay}
        today={today}
        color="var(--expense)"
        height={200}
      />
    </Panel>
  )
}

function TopMerchants({ summary }: { summary: MonthSummary }) {
  if (!summary.topMerchants.length) return null
  return (
    <Panel>
      <PanelTitle>Onde você mais gastou</PanelTitle>
      <ol className="grid gap-2 text-sm">
        {summary.topMerchants.slice(0, 5).map((m) => (
          <li key={m.name} className="flex min-w-0 items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-ink" title={m.name}>
              {prettyDescription(m.name)}
            </span>
            <span className="shrink-0 text-ink-2">
              <span className="tabular font-medium text-ink">{formatBRL(Math.abs(m.total))}</span>
              <span className="text-xs text-ink-3"> · {m.count}×</span>
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
