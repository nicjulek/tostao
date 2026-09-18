import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { currentMonth, formatMonth, shiftMonth } from '@/lib/dates'

export function MonthSwitcher({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  const isCurrent = month >= currentMonth()
  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-line bg-surface p-1">
      <Button variant="ghost" size="icon" className="size-8" onClick={() => onChange(shiftMonth(month, -1))} aria-label="Mês anterior">
        <ChevronLeft />
      </Button>
      <span className="min-w-36 text-center text-sm font-medium text-ink" aria-live="polite">
        {formatMonth(month)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => onChange(shiftMonth(month, 1))}
        disabled={isCurrent}
        aria-label="Próximo mês"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
