import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, CategoryDot, EmptyState, ErrorState, PageHeader, Panel, Skeleton } from '@/components/ui'
import { useCategories } from '@/features/transactions/hooks'
import { rulesApi } from '@/lib/endpoints'
import { qk } from '@/lib/queryKeys'
import type { Rule } from '@/lib/types'
import { RuleDialog } from './RuleDialog'

const MATCH_LABEL = { contains: 'contém', starts_with: 'começa com', exact: 'é exatamente' } as const

export default function RulesPage() {
  const queryClient = useQueryClient()
  const categories = useCategories()
  const rules = useQuery({ queryKey: qk.rules, queryFn: rulesApi.list })
  const [editing, setEditing] = useState<Rule | null | undefined>(undefined)

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: qk.rules })
    void queryClient.invalidateQueries({ queryKey: qk.transactionsAll })
    void queryClient.invalidateQueries({ queryKey: qk.reports })
  }
  const remove = useMutation({
    mutationFn: (r: Rule) => rulesApi.remove(r.id),
    onSuccess: () => {
      toast.success('Regra apagada')
      refresh()
    }
  })
  const apply = useMutation({
    mutationFn: rulesApi.apply,
    onSuccess: (r) => {
      toast.success(r.updated ? `${r.updated} transações recategorizadas` : 'Tudo já estava de acordo com as regras')
      refresh()
    }
  })

  return (
    <div>
      <PageHeader
        title="Regras"
        description="As regras rodam a cada importação, antes das categorias automáticas. Use para ensinar o Tostão: “Steam é Jogos”, “o Pix da empresa é Salário”."
        actions={
          <>
            <Button variant="secondary" onClick={() => apply.mutate()} loading={apply.isPending}>
              <RefreshCw /> Reaplicar em tudo
            </Button>
            <Button onClick={() => setEditing(null)}>
              <Plus /> Nova regra
            </Button>
          </>
        }
      />
      {rules.isPending ? (
        <Skeleton className="h-48" />
      ) : rules.isError ? (
        <ErrorState error={rules.error} onRetry={() => rules.refetch()} />
      ) : !rules.data.length ? (
        <EmptyState title="Nenhuma regra ainda" action={<Button onClick={() => setEditing(null)}>Criar a primeira regra</Button>}>
          Dica: nas transações, abra o menu de uma linha e escolha “Criar regra com esta descrição”.
        </EmptyState>
      ) : (
        <Panel className="p-0">
          <ul className="divide-y divide-line">
            {rules.data.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-sm">
                <p className="min-w-0 flex-1 text-ink-2">
                  Se a descrição {MATCH_LABEL[r.matchType]} <strong className="font-semibold text-ink">“{r.pattern}”</strong>, colocar em{' '}
                  <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                    <CategoryDot color={r.category.color} />
                    {r.category.name}
                  </span>
                </p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(r)} aria-label={`Editar regra ${r.pattern}`}>
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate(r)} aria-label={`Apagar regra ${r.pattern}`}>
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <RuleDialog
        open={editing !== undefined}
        onOpenChange={(o) => !o && setEditing(undefined)}
        rule={editing}
        categories={categories.data ?? []}
      />
    </div>
  )
}
