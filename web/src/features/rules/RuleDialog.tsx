import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button, Dialog, Field, Input, Select } from '@/components/ui'
import { rulesApi } from '@/lib/endpoints'
import { qk } from '@/lib/queryKeys'
import type { Category, Rule } from '@/lib/types'

const schema = z.object({
  pattern: z.string().trim().min(2, 'Escreva pelo menos 2 letras').max(120),
  matchType: z.enum(['contains', 'starts_with', 'exact']),
  categoryId: z.string().min(1, 'Escolha a categoria'),
  applyToExisting: z.boolean()
})

type Values = z.infer<typeof schema>

const MATCH = [
  { value: 'contains', label: 'Contém' },
  { value: 'starts_with', label: 'Começa com' },
  { value: 'exact', label: 'É exatamente' }
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  rule?: Rule | null
  initial?: { pattern: string; categoryId?: string | null }
}

export function RuleDialog({ open, onOpenChange, categories, rule, initial }: Props) {
  const queryClient = useQueryClient()
  const form = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    form.reset({
      pattern: rule?.pattern ?? initial?.pattern ?? '',
      matchType: rule?.matchType ?? 'contains',
      categoryId: rule?.categoryId ?? initial?.categoryId ?? '',
      applyToExisting: true
    })
  }, [open, rule, initial, form])

  const save = useMutation({
    mutationFn: async (v: Values) => {
      if (rule) {
        await rulesApi.update(rule.id, { pattern: v.pattern, matchType: v.matchType, categoryId: v.categoryId })
        return v.applyToExisting ? (await rulesApi.apply()).updated : 0
      }
      return (await rulesApi.create(v)).applied
    },
    onSuccess: (applied) => {
      toast.success(rule ? 'Regra atualizada' : 'Regra criada', {
        description: applied ? `${applied} transações foram recategorizadas.` : undefined
      })
      void queryClient.invalidateQueries({ queryKey: qk.rules })
      void queryClient.invalidateQueries({ queryKey: qk.transactionsAll })
      void queryClient.invalidateQueries({ queryKey: qk.reports })
      onOpenChange(false)
    }
  })

  const submit = form.handleSubmit((v) => save.mutate(v))
  const errors = form.formState.errors

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={rule ? 'Editar regra' : 'Nova regra'}
      description="Quando a descrição da transação combinar com o texto, ela entra na categoria escolhida. Maiúsculas e acentos não importam."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            {rule ? 'Salvar regra' : 'Criar regra'}
          </Button>
        </>
      }
    >
      <form className="grid gap-4" noValidate onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
          <Field label="Quando a descrição">
            {(p) => (
              <Controller
                control={form.control}
                name="matchType"
                render={({ field }) => <Select {...p} value={field.value} onValueChange={field.onChange} options={MATCH} />}
              />
            )}
          </Field>
          <Field label="Texto" error={errors.pattern?.message}>
            {(p) => <Input placeholder="Ex.: ifood" {...p} {...form.register('pattern')} />}
          </Field>
        </div>
        <Field label="Colocar em" error={errors.categoryId?.message}>
          {(p) => (
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  {...p}
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                  placeholder="Escolha a categoria"
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                />
              )}
            />
          )}
        </Field>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" className="size-4 accent-[var(--brand)]" {...form.register('applyToExisting')} />
          Aplicar também nas transações que já existem
        </label>
        <button type="submit" hidden />
      </form>
    </Dialog>
  )
}
