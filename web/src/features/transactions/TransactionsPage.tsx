import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MoreHorizontal, Pencil, Plus, Search, Trash2, Wand2, X } from 'lucide-react'
import {
  Button,
  CategoryDot,
  DropdownContent,
  DropdownItem,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
  EmptyState,
  ErrorState,
  Input,
  Money,
  PageHeader,
  Select,
  Skeleton
} from '@/components/ui'
import { MonthSwitcher } from '@/app/MonthSwitcher'
import { useMonth } from '@/app/useMonth'
import { RuleDialog } from '@/features/rules/RuleDialog'
import { suggestPattern } from '@/features/rules/suggestPattern'
import { cn } from '@/lib/cn'
import { formatDayMonth, monthRange } from '@/lib/dates'
import { prettyDescription } from '@/lib/describe'
import type { Category, Transaction, TransactionFilters } from '@/lib/types'
import { useAccounts, useBulkCategorize, useCategories, useDeleteTransaction, useTransactions, useUpdateCategory } from './hooks'
import { TransactionDialog } from './TransactionDialog'
import { useDebounced } from './useDebounced'

const ROW = 60

export default function TransactionsPage() {
  const [month, setMonth] = useMonth()
  const [params, setParams] = useSearchParams()
  const [searchText, setSearchText] = useState(params.get('busca') ?? '')
  const search = useDebounced(searchText.trim(), 300)
  const categoryId = params.get('categoria') ?? undefined
  const accountId = params.get('conta') ?? undefined
  const type = (params.get('tipo') as 'income' | 'expense' | null) ?? undefined

  const filters: TransactionFilters = useMemo(
    () => ({ ...monthRange(month), categoryId, accountId, type, search: search || undefined }),
    [month, categoryId, accountId, type, search]
  )

  const setFilter = (key: string, value: string | undefined) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (value) p.set(key, value)
        else p.delete(key)
        return p
      },
      { replace: true }
    )

  const categories = useCategories()
  const accounts = useAccounts()
  const list = useTransactions(filters)
  const updateCategory = useUpdateCategory(filters, categories.data ?? [])
  const bulk = useBulkCategorize()
  const remove = useDeleteTransaction()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<Transaction | null | undefined>(undefined)
  const [ruleFrom, setRuleFrom] = useState<Transaction | null>(null)

  const items = list.data?.items ?? []
  const anyFilter = !!(categoryId || accountId || type || search)
  const categoryOptions = [
    { value: 'all', label: 'Todas as categorias' },
    { value: 'none', label: 'Sem categoria' },
    ...(categories.data ?? []).map((c) => ({ value: c.id, label: c.name, icon: <CategoryDot color={c.color} /> }))
  ]

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div>
      <PageHeader
        title="Transações"
        actions={
          <>
            <MonthSwitcher month={month} onChange={setMonth} />
            <Button onClick={() => setEditing(null)} disabled={!accounts.data?.length}>
              <Plus /> Nova transação
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_200px_180px_180px]">
        <label className="relative col-span-2 sm:col-span-1">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value)
              setFilter('busca', e.target.value.trim() || undefined)
            }}
            placeholder="Buscar por descrição ou observação"
            className="pl-9"
          />
        </label>
        <Select
          aria-label="Categoria"
          value={categoryId ?? 'all'}
          onValueChange={(v) => setFilter('categoria', v === 'all' ? undefined : v)}
          options={categoryOptions}
        />
        <Select
          aria-label="Conta"
          value={accountId ?? 'all'}
          onValueChange={(v) => setFilter('conta', v === 'all' ? undefined : v)}
          options={[{ value: 'all', label: 'Todas as contas' }, ...(accounts.data ?? []).map((a) => ({ value: a.id, label: a.name }))]}
        />
        <Select
          aria-label="Tipo"
          value={type ?? 'all'}
          onValueChange={(v) => setFilter('tipo', v === 'all' ? undefined : v)}
          options={[
            { value: 'all', label: 'Entradas e saídas' },
            { value: 'expense', label: 'Só saídas' },
            { value: 'income', label: 'Só entradas' }
          ]}
        />
      </div>

      {list.data ? (
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-2" aria-live="polite">
          <span>
            <strong className="text-ink">{list.data.total}</strong> transações
          </span>
          <span>
            Entradas <Money cents={list.data.totals.income} className="font-medium text-ink" />
          </span>
          <span>
            Saídas <Money cents={Math.abs(list.data.totals.expense)} className="font-medium text-ink" />
          </span>
          {anyFilter ? (
            <Button
              variant="link"
              size="sm"
              className="h-auto"
              onClick={() => {
                setSearchText('')
                setParams((prev) => {
                  const p = new URLSearchParams()
                  const m = prev.get('mes')
                  if (m) p.set('mes', m)
                  return p
                })
              }}
            >
              Limpar filtros
            </Button>
          ) : null}
        </div>
      ) : null}

      {selected.size > 0 ? (
        <div className="sticky top-16 z-20 mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2 shadow-md">
          <span className="text-sm font-medium text-ink">{selected.size} selecionadas</span>
          <div className="w-56">
            <Select
              size="sm"
              aria-label="Mover selecionadas para a categoria"
              value={undefined}
              placeholder="Mover para categoria…"
              onValueChange={(v) =>
                bulk.mutate({ ids: [...selected], categoryId: v === 'none' ? null : v }, { onSuccess: () => setSelected(new Set()) })
              }
              options={categoryOptions.slice(1)}
            />
          </div>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelected(new Set())}>
            <X /> Cancelar
          </Button>
        </div>
      ) : null}

      {list.isPending ? (
        <div className="grid gap-2" aria-busy="true" aria-label="Carregando transações">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : !items.length ? (
        anyFilter ? (
          <EmptyState title="Nenhuma transação com esses filtros">Tente outro mês ou limpe os filtros.</EmptyState>
        ) : (
          <EmptyState
            title="Nenhuma transação neste mês"
            action={
              <Button asChild>
                <Link to="/importar">Importar extrato</Link>
              </Button>
            }
          >
            Importe o extrato do banco ou adicione uma transação à mão.
          </EmptyState>
        )
      ) : (
        <VirtualList
          items={items}
          categories={categories.data ?? []}
          selected={selected}
          onToggle={toggle}
          onToggleAll={() => setSelected((prev) => (prev.size === items.length ? new Set() : new Set(items.map((t) => t.id))))}
          onCategory={(t, value) => updateCategory.mutate({ id: t.id, categoryId: value === 'none' ? null : value })}
          onEdit={setEditing}
          onRule={setRuleFrom}
          onDelete={(t) => remove.mutate(t)}
          busy={list.isFetching}
        />
      )}

      <TransactionDialog
        open={editing !== undefined}
        onOpenChange={(o) => !o && setEditing(undefined)}
        transaction={editing}
        accounts={accounts.data ?? []}
        categories={categories.data ?? []}
      />
      <RuleDialog
        open={!!ruleFrom}
        onOpenChange={(o) => !o && setRuleFrom(null)}
        categories={categories.data ?? []}
        initial={ruleFrom ? { pattern: suggestPattern(ruleFrom.description), categoryId: ruleFrom.categoryId } : undefined}
      />
    </div>
  )
}

interface ListProps {
  items: Transaction[]
  categories: Category[]
  selected: Set<string>
  busy: boolean
  onToggle: (id: string) => void
  onToggleAll: () => void
  onCategory: (t: Transaction, value: string) => void
  onEdit: (t: Transaction) => void
  onRule: (t: Transaction) => void
  onDelete: (t: Transaction) => void
}

function VirtualList({ items, categories, selected, busy, onToggle, onToggleAll, onCategory, onEdit, onRule, onDelete }: ListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW,
    overscan: 8,
    initialRect: { width: 900, height: 600 }
  })
  const allChecked = selected.size === items.length

  return (
    <div className={cn('overflow-hidden rounded-lg border border-line bg-surface transition-opacity', busy && 'opacity-70')}>
      <div className="flex items-center gap-3 border-b border-line px-3 py-2 text-xs font-medium text-ink-3" role="row">
        <input
          type="checkbox"
          className="size-4 accent-[var(--brand)]"
          checked={allChecked}
          ref={(el) => {
            if (el) el.indeterminate = selected.size > 0 && !allChecked
          }}
          onChange={onToggleAll}
          aria-label="Selecionar todas"
        />
        <span className="hidden w-16 sm:block">Data</span>
        <span className="flex-1">Descrição</span>
        <span className="hidden w-52 md:block">Categoria</span>
        <span className="w-28 text-right">Valor</span>
        <span className="w-8" />
      </div>
      <div
        ref={parentRef}
        className="max-h-[70dvh] min-h-72 overflow-y-auto sm:max-h-[calc(100dvh-330px)]"
        role="table"
        aria-rowcount={items.length}
      >
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((row) => {
            const t = items[row.index]
            const options = [
              { value: 'none', label: 'Sem categoria' },
              ...categories
                .filter(
                  (c) => c.kind === 'transfer' || (t.amount < 0 ? c.kind === 'expense' : c.kind === 'income') || c.id === t.categoryId
                )
                .map((c) => ({ value: c.id, label: c.name, icon: <CategoryDot color={c.color} /> }))
            ]
            return (
              <div
                key={t.id}
                role="row"
                className={cn(
                  'absolute inset-x-0 flex items-center gap-3 border-b border-line px-3',
                  selected.has(t.id) && 'bg-brand-soft/50'
                )}
                style={{ height: ROW, transform: `translateY(${row.start}px)` }}
              >
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--brand)]"
                  checked={selected.has(t.id)}
                  onChange={() => onToggle(t.id)}
                  aria-label={`Selecionar ${prettyDescription(t.description)}`}
                />
                <span className="tabular hidden w-16 shrink-0 whitespace-nowrap text-sm text-ink-2 sm:block">{formatDayMonth(t.date)}</span>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onEdit(t)}
                    title={t.description}
                    className="block max-w-full truncate text-left text-sm font-medium text-ink hover:underline"
                  >
                    {prettyDescription(t.description)}
                  </button>
                  <p className="truncate text-xs text-ink-3">
                    <span className="sm:hidden">{formatDayMonth(t.date)} · </span>
                    {t.account.name}
                    <span className="md:hidden">
                      {' · '}
                      {t.category?.name ?? 'Sem categoria'}
                    </span>
                    {t.notes ? ` · ${t.notes}` : ''}
                  </p>
                </div>
                <div className="hidden w-52 md:block">
                  <Select
                    size="sm"
                    aria-label={`Categoria de ${t.description}`}
                    value={t.categoryId ?? 'none'}
                    onValueChange={(v) => onCategory(t, v)}
                    options={options}
                  />
                </div>
                <Money
                  cents={t.amount}
                  signed
                  className={cn(
                    'w-24 shrink-0 text-right text-sm font-medium sm:w-28',
                    t.amount < 0 ? 'text-ink' : 'text-income',
                    t.category?.kind === 'transfer' && 'text-ink-3'
                  )}
                />
                <DropdownMenu>
                  <DropdownTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8" aria-label={`Ações de ${prettyDescription(t.description)}`}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownTrigger>
                  <DropdownContent>
                    <DropdownItem onSelect={() => onEdit(t)}>
                      <Pencil /> Editar
                    </DropdownItem>
                    <DropdownItem onSelect={() => onRule(t)}>
                      <Wand2 /> Criar regra com esta descrição
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem danger onSelect={() => onDelete(t)}>
                      <Trash2 /> Apagar
                    </DropdownItem>
                  </DropdownContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
