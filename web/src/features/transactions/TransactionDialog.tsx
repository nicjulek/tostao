import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Dialog, Field, Input, Select, Textarea } from '@/components/ui'
import { todayISO } from '@/lib/dates'
import { centsToInput, parseMoneyInput } from '@/lib/money'
import type { Account, Category, Transaction } from '@/lib/types'
import { useSaveTransaction } from './hooks'

const schema = z.object({
  accountId: z.string().min(1, 'Escolha a conta'),
  kind: z.enum(['expense', 'income']),
  amount: z.string().refine((v) => (parseMoneyInput(v) ?? 0) > 0, 'Informe um valor maior que zero, como 45,90'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data'),
  description: z.string().trim().min(1, 'Descreva a transação').max(300),
  categoryId: z.string(),
  notes: z.string().max(500)
})

type Values = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction | null
  accounts: Account[]
  categories: Category[]
}

export function TransactionDialog({ open, onOpenChange, transaction, accounts, categories }: Props) {
  const save = useSaveTransaction()
  const form = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    form.reset(
      transaction
        ? {
            accountId: transaction.accountId,
            kind: transaction.amount < 0 ? 'expense' : 'income',
            amount: centsToInput(transaction.amount),
            date: transaction.date,
            description: transaction.description,
            categoryId: transaction.categoryId ?? 'none',
            notes: transaction.notes ?? ''
          }
        : {
            accountId: accounts[0]?.id ?? '',
            kind: 'expense',
            amount: '',
            date: todayISO(),
            description: '',
            categoryId: 'none',
            notes: ''
          }
    )
  }, [open, transaction, accounts, form])

  const submit = form.handleSubmit((v) => {
    const cents = parseMoneyInput(v.amount) ?? 0
    save.mutate(
      {
        id: transaction?.id,
        input: {
          accountId: v.accountId,
          date: v.date,
          description: v.description,
          amount: v.kind === 'expense' ? -cents : cents,
          categoryId: v.categoryId === 'none' ? null : v.categoryId,
          notes: v.notes.trim() || null
        }
      },
      { onSuccess: () => onOpenChange(false) }
    )
  })

  const kind = form.watch('kind')
  const options = [
    { value: 'none', label: 'Sem categoria' },
    ...categories.filter((c) => c.kind === kind || c.kind === 'transfer').map((c) => ({ value: c.id, label: c.name }))
  ]
  const errors = form.formState.errors

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={transaction ? 'Editar transação' : 'Nova transação'}
      description={transaction ? undefined : 'Para gastos em dinheiro ou qualquer coisa que não veio no extrato.'}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            {transaction ? 'Salvar alterações' : 'Adicionar transação'}
          </Button>
        </>
      }
    >
      <form className="grid gap-4" noValidate onSubmit={submit}>
        <div className="grid grid-cols-2 gap-1 rounded-md bg-surface-2 p-1" role="radiogroup" aria-label="Tipo">
          {(['expense', 'income'] as const).map((k) => (
            <label
              key={k}
              className="cursor-pointer rounded-sm py-1.5 text-center text-sm font-medium text-ink-2 has-[:checked]:bg-surface has-[:checked]:text-ink has-[:checked]:shadow-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus"
            >
              <input type="radio" value={k} className="sr-only" {...form.register('kind')} />
              {k === 'expense' ? 'Gasto' : 'Entrada'}
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valor (R$)" error={errors.amount?.message}>
            {(p) => <Input inputMode="decimal" placeholder="0,00" className="tabular" {...p} {...form.register('amount')} />}
          </Field>
          <Field label="Data" error={errors.date?.message}>
            {(p) => <Input type="date" {...p} {...form.register('date')} />}
          </Field>
        </div>
        <Field label="Descrição" error={errors.description?.message}>
          {(p) => <Input placeholder="Ex.: Almoço com a equipe" {...p} {...form.register('description')} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Conta" error={errors.accountId?.message}>
            {(p) => (
              <Controller
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <Select
                    {...p}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!transaction}
                    options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                  />
                )}
              />
            )}
          </Field>
          <Field label="Categoria">
            {(p) => (
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => <Select {...p} value={field.value} onValueChange={field.onChange} options={options} />}
              />
            )}
          </Field>
        </div>
        <Field label="Observações" error={errors.notes?.message}>
          {(p) => <Textarea rows={2} {...p} {...form.register('notes')} />}
        </Field>
        <button type="submit" hidden />
      </form>
    </Dialog>
  )
}
