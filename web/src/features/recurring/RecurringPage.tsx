import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BellRing, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button, EmptyState, ErrorState, Money, PageHeader, Panel, Skeleton } from '@/components/ui'
import { currentMonth, formatDate, relativeDays } from '@/lib/dates'
import { notificationsApi, reportsApi } from '@/lib/endpoints'
import { prettyDescription } from '@/lib/describe'
import { formatBRL } from '@/lib/money'
import { qk } from '@/lib/queryKeys'

export default function RecurringPage() {
  const month = currentMonth()
  const queryClient = useQueryClient()
  const recurring = useQuery({ queryKey: qk.recurring(month), queryFn: () => reportsApi.recurring(month) })
  const check = useMutation({
    mutationFn: () => notificationsApi.check(),
    onSuccess: (r) => {
      toast.success(r.created ? `${r.created} avisos criados` : 'Nenhuma cobrança nos próximos 2 dias')
      void queryClient.invalidateQueries({ queryKey: qk.notifications })
    }
  })

  const email = useQuery({ queryKey: ['notifications', 'email'], queryFn: notificationsApi.email })
  const testEmail = useMutation({
    mutationFn: notificationsApi.testEmail,
    onSuccess: (r) => toast.success(`E-mail de teste enviado para ${r.to}`)
  })

  return (
    <div>
      <PageHeader
        title="Assinaturas e contas fixas"
        description="O que se repete todo mês com valor parecido, detectado a partir dos últimos 6 meses. Você recebe um aviso 2 dias antes de cada cobrança e quando alguma fica mais cara."
        actions={
          <Button variant="secondary" onClick={() => check.mutate()} loading={check.isPending}>
            <BellRing /> Verificar agora
          </Button>
        }
      />
      <Panel className="mb-6 flex flex-wrap items-center gap-4">
        <span className="grid size-10 place-items-center rounded-md bg-surface-2 text-ink-2">
          <Mail className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink">Avisos por e-mail {email.data?.enabled ? 'ligados' : 'desligados'}</p>
          <p className="text-sm text-ink-2">
            {email.data?.enabled
              ? 'Cada aviso também chega no e-mail da sua conta.'
              : 'Para receber no e-mail, preencha SMTP_URL no .env da API. O README explica como usar o Gmail.'}
          </p>
        </div>
        <Button variant="secondary" onClick={() => testEmail.mutate()} loading={testEmail.isPending} disabled={!email.data?.enabled}>
          Enviar e-mail de teste
        </Button>
      </Panel>

      {recurring.isPending ? (
        <Skeleton className="h-64" />
      ) : recurring.isError ? (
        <ErrorState error={recurring.error} onRetry={() => recurring.refetch()} />
      ) : !recurring.data.charges.length ? (
        <EmptyState title="Nenhuma cobrança recorrente encontrada">
          Elas aparecem quando um mesmo gasto se repete por pelo menos 3 meses com valor parecido. Importe extratos de meses anteriores para
          o Tostão encontrar.
        </EmptyState>
      ) : (
        <>
          <p className="mb-6 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Cerca de <span className="tabular">{formatBRL(Math.abs(recurring.data.monthlyTotal))}</span> por mês, ou{' '}
            <span className="tabular">{formatBRL(Math.abs(recurring.data.monthlyTotal) * 12)}</span> por ano.
          </p>
          <Panel className="p-0">
            <ul className="divide-y divide-line">
              {recurring.data.charges.map((c) => (
                <li key={c.key} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink" title={c.description}>
                      {prettyDescription(c.description)}
                    </p>
                    <p className="text-sm text-ink-3">
                      Visto em {c.months} meses · última em {formatDate(c.lastDate)}
                    </p>
                  </div>
                  <div className="text-sm text-ink-2">
                    Próxima em <span className="font-medium text-ink">{formatDate(c.nextDate)}</span> ({relativeDays(c.nextDate)})
                  </div>
                  <Money cents={Math.abs(c.averageAmount)} className="w-28 text-right font-semibold text-ink" />
                </li>
              ))}
            </ul>
          </Panel>
        </>
      )}
    </div>
  )
}
