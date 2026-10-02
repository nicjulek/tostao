import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Landmark, PiggyBank, Plus, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button, Dialog, ErrorState, Field, Input, Money, PageHeader, Panel, Select, Skeleton } from '@/components/ui'
import { useAccounts } from '@/features/transactions/hooks'
import { accountsApi } from '@/lib/endpoints'
import { qk } from '@/lib/queryKeys'
import type { Account, AccountKind } from '@/lib/types'

const KINDS: Record<AccountKind, { label: string; icon: typeof Landmark }> = {
  checking: { label: 'Conta corrente', icon: Landmark },
  credit: { label: 'Cartão de crédito', icon: CreditCard },
  savings: { label: 'Poupança ou investimento', icon: PiggyBank },
  cash: { label: 'Dinheiro', icon: Wallet }
}

export default function AccountsPage() {
  const accounts = useAccounts()
  const [editing, setEditing] = useState<Account | null | undefined>(undefined)
  return (
    <div>
      <PageHeader
        title="Contas"
        description="Cada extrato entra numa conta. O saldo aqui é a soma do que foi importado, não o saldo do banco."
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus /> Nova conta
          </Button>
        }
      />
      {accounts.isPending ? (
        <Skeleton className="h-40" />
      ) : accounts.isError ? (
        <ErrorState error={accounts.error} onRetry={() => accounts.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.data.map((a) => {
            const Icon = KINDS[a.kind].icon
            return (
              <Panel key={a.id} className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-surface-2 text-ink-2">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{a.name}</p>
                  <p className="text-sm text-ink-3">
                    {KINDS[a.kind].label} · {a.transactionCount} transações
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">
                    <Money cents={a.balance} />
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button asChild variant="secondary" size="sm">
                      <Link to={`/transacoes?conta=${a.id}`}>Ver transações</Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(a)}>
                      Editar
                    </Button>
                  </div>
                </div>
              </Panel>
            )
          })}
        </div>
      )}
      <AccountDialog open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} account={editing} />
    </div>
  )
}

const schema = z.object({ name: z.string().trim().min(1, 'Dê um nome').max(60), kind: z.enum(['checking', 'credit', 'savings', 'cash']) })

function AccountDialog({ open, onOpenChange, account }: { open: boolean; onOpenChange: (o: boolean) => void; account?: Account | null }) {
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
  useEffect(() => {
    if (open) form.reset({ name: account?.name ?? '', kind: account?.kind ?? 'checking' })
  }, [open, account, form])

  const done = (message: string) => {
    toast.success(message)
    void queryClient.invalidateQueries({ queryKey: qk.accounts })
    void queryClient.invalidateQueries({ queryKey: qk.transactionsAll })
    void queryClient.invalidateQueries({ queryKey: qk.reports })
    onOpenChange(false)
  }
  const save = useMutation({
    mutationFn: (v: z.infer<typeof schema>) => (account ? accountsApi.update(account.id, v) : accountsApi.create(v)),
    onSuccess: () => done(account ? 'Conta atualizada' : 'Conta criada')
  })
  const remove = useMutation({
    mutationFn: () => accountsApi.remove(account!.id),
    onSuccess: () => done('Conta apagada com suas transações')
  })
  const submit = form.handleSubmit((v) => save.mutate(v))

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={account ? 'Editar conta' : 'Nova conta'}
      footer={
        <>
          {account ? (
            <Button variant="ghost" className="text-danger sm:mr-auto" onClick={() => remove.mutate()} loading={remove.isPending}>
              Apagar conta e transações
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            {account ? 'Salvar' : 'Criar conta'}
          </Button>
        </>
      }
    >
      <form className="grid gap-4" noValidate onSubmit={submit}>
        <Field label="Nome" error={form.formState.errors.name?.message}>
          {(p) => <Input placeholder="Ex.: Nubank conta" {...p} {...form.register('name')} />}
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
                  options={(Object.keys(KINDS) as AccountKind[]).map((k) => ({ value: k, label: KINDS[k].label }))}
                />
              )}
            />
          )}
        </Field>
        <button type="submit" hidden />
      </form>
    </Dialog>
  )
}
