import * as Popover from '@radix-ui/react-popover'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CalendarClock, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { notificationsApi } from '@/lib/endpoints'
import { qk } from '@/lib/queryKeys'

const timeFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export function NotificationBell() {
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: qk.notifications, queryFn: notificationsApi.list, refetchInterval: 5 * 60_000 })
  const readAll = useMutation({
    mutationFn: notificationsApi.readAll,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.notifications })
  })
  const unread = data?.unread ?? 0

  return (
    <Popover.Root onOpenChange={(open) => !open && unread > 0 && readAll.mutate()}>
      <Popover.Trigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unread ? `Avisos, ${unread} novos` : 'Avisos'}>
          <Bell />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-expense px-1 text-[10px] font-semibold leading-4 text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={8} className="z-50 w-[min(92vw,380px)] rounded-lg border border-line bg-surface shadow-xl">
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">Avisos</p>
          </div>
          {!data?.items.length ? (
            <p className="px-4 py-6 text-sm text-ink-2">
              Nenhum aviso ainda. Quando uma assinatura estiver para ser cobrada ou ficar mais cara, você fica sabendo aqui.
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-line overflow-y-auto">
              {data.items.map((n) => {
                const Icon = n.kind === 'price_increase' ? TrendingUp : CalendarClock
                return (
                  <li key={n.id} className={cn('flex gap-3 px-4 py-3', !n.readAt && 'bg-brand-soft/40')}>
                    <Icon
                      className={cn('mt-0.5 size-4 shrink-0', n.kind === 'price_increase' ? 'text-expense' : 'text-ink-2')}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{n.title}</p>
                      <p className="mt-0.5 text-sm text-ink-2">{n.body}</p>
                      <p className="mt-1 text-xs text-ink-3">{timeFormat.format(new Date(n.createdAt))}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
