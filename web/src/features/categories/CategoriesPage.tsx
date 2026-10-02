import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { BudgetBar, Button, CategoryDot, Dialog, ErrorState, Field, Input, PageHeader, Panel, Select, Skeleton } from '@/components/ui'
import { useCategories } from '@/features/transactions/hooks'
import { currentMonth } from '@/lib/dates'
import { categoriesApi, reportsApi } from '@/lib/endpoints'
import { centsToInput, formatBRL, parseMoneyInput } from '@/lib/money'
import { qk } from '@/lib/queryKeys'
import type { Category, CategoryKind } from '@/lib/types'

const KIND_LABEL: Record<CategoryKind, string> = { expense: 'Gastos', income: 'Entradas', transfer: 'Movimentação interna' }
const COLORS = [
  '#d9824b',
  '#6c9a3c',
  '#3f7fb5',
  '#8a5cc2',
  '#c45a8c',
  '#c9a227',
  '#3aa39a',
  '#8b6f4e',
  '#4f6bd1',
  '#b4569e',
  '#2f8f5b',
  '#7b8794'
]

export default function CategoriesPage() {
  const month = currentMonth()
  const categories = useCategories()
  const summary = useQuery({ queryKey: qk.summary(month), queryFn: () => reportsApi.summary(month) })
  const [editing, setEditing] = useState<Category | null | undefined>(undefined)
  const spent = new Map((summary.data?.byCategory ?? []).map((c) => [c.categoryId, Math.abs(c.total)]))

  return (
    <div>
      <PageHeader
        title="Categorias e orçamentos"
        description="Defina um limite mensal para as categorias que quer acompanhar. O resumo avisa quando você passa de 80%."
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus /> Nova categoria
          </Button>
        }
      />
      {categories.isPending ? (
        <Skeleton className="h-96" />
      ) : categories.isError ? (
        <ErrorState error={categories.error} onRetry={() => categories.refetch()} />
      ) : (
        <div className="grid gap-6">
          {(['expense', 'income', 'transfer'] as const).map((kind) => {
            const list = categories.data.filter((c) => c.kind === kind)
            if (!list.length) return null
            return (
              <Panel key={kind} className="p-0">
                <h2 className="border-b border-line px-5 py-3 text-sm font-semibold text-ink">{KIND_LABEL[kind]}</h2>
                <ul className="divide-y divide-line">
                  {list.map((c) => {
                    const value = spent.get(c.id) ?? 0
                    return (
                      <li key={c.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <CategoryDot color={c.color} className="size-3" />
                          <span className="truncate font-medium text-ink">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {kind === 'expense' ? (
                            <span className="text-sm text-ink-2">
                              <span className="tabular font-medium text-ink">{formatBRL(value)}</span>
                              {c.monthlyBudget ? <span className="tabular"> de {formatBRL(c.monthlyBudget)}</span> : ' este mês'}
                            </span>
                          ) : null}
                          <Button variant="ghost" size="icon" onClick={() => setEditing(c)} aria-label={`Editar ${c.name}`}>
                            <Pencil />
                          </Button>
                        </div>
                        {c.monthlyBudget ? (
                          <div className="col-span-2">
                            <BudgetBar spent={value} budget={c.monthlyBudget} color={c.color} />
                          </div>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </Panel>
            )
          })}
        </div>
      )}
      <CategoryDialog open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} category={editing} />
    </div>
  )
}

const schema = z.object({
  name: z.string().trim().min(1, 'Dê um nome').max(40),
  kind: z.enum(['expense', 'income', 'transfer']),
  color: z.string(),
  budget: z.string().refine((v) => !v.trim() || parseMoneyInput(v) !== null, 'Use um valor como 450,00')
})

type Values = z.infer<typeof schema>

function CategoryDialog({
  open,
  onOpenChange,
  category
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  category?: Category | null
}) {
  const queryClient = useQueryClient()
  const form = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: category?.name ?? '',
      kind: category?.kind ?? 'expense',
      color: category?.color ?? COLORS[0],
      budget: category?.monthlyBudget ? centsToInput(category.monthlyBudget) : ''
    })
  }, [open, category, form])

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: qk.categories })
    void queryClient.invalidateQueries({ queryKey: qk.reports })
    void queryClient.invalidateQueries({ queryKey: qk.transactionsAll })
  }

  const save = useMutation({
    mutationFn: (v: Values) => {
      const body = { name: v.name, kind: v.kind, color: v.color, monthlyBudget: v.budget.trim() ? parseMoneyInput(v.budget) : null }
      return category ? categoriesApi.update(category.id, body) : categoriesApi.create(body)
    },
    onSuccess: () => {
      toast.success(category ? 'Categoria atualizada' : 'Categoria criada')
      refresh()
      onOpenChange(false)
    }
  })

  const remove = useMutation({
    mutationFn: () => categoriesApi.remove(category!.id),
    onSuccess: () => {
      toast.success('Categoria apagada. As transações dela ficaram sem categoria.')
      refresh()
      onOpenChange(false)
    }
  })

  const submit = form.handleSubmit((v) => save.mutate(v))
  const kind = form.watch('kind')

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={category ? 'Editar categoria' : 'Nova categoria'}
      footer={
        <>
          {category ? (
            <Button variant="ghost" className="text-danger sm:mr-auto" onClick={() => remove.mutate()} loading={remove.isPending}>
              Apagar categoria
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            {category ? 'Salvar' : 'Criar categoria'}
          </Button>
        </>
      }
    >
      <form className="grid gap-4" noValidate onSubmit={submit}>
        <Field label="Nome" error={form.formState.errors.name?.message}>
          {(p) => <Input {...p} {...form.register('name')} />}
        </Field>
        <Field label="Tipo">
          {(p) => (
            <Controller
              control={form.control}
              name="kind"
              render={({ field }) => (
                <Select
                  {...p}
                  value={field.value}
                  onValueChange={field.onChange}
                  options={(Object.keys(KIND_LABEL) as CategoryKind[]).map((k) => ({ value: k, label: KIND_LABEL[k] }))}
                />
              )}
            />
          )}
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">Cor</legend>
          <Controller
            control={form.control}
            name="color"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <label key={c} className="cursor-pointer">
                    <input
                      type="radio"
                      className="peer sr-only"
                      value={c}
                      checked={field.value === c}
                      onChange={() => field.onChange(c)}
                      aria-label={c}
                    />
                    <span
                      className="block size-8 rounded-full ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-focus"
                      style={{ background: c }}
                    />
                  </label>
                ))}
              </div>
            )}
          />
        </fieldset>
        {kind === 'expense' ? (
          <Field label="Orçamento mensal (R$)" hint="Deixe em branco para não acompanhar." error={form.formState.errors.budget?.message}>
            {(p) => <Input inputMode="decimal" placeholder="0,00" className="tabular" {...p} {...form.register('budget')} />}
          </Field>
        ) : null}
        <button type="submit" hidden />
      </form>
    </Dialog>
  )
}
