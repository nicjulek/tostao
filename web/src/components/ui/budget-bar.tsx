import { cn } from '@/lib/cn'

export function BudgetBar({ spent, budget, color }: { spent: number; budget: number | null; color: string }) {
  if (!budget) return null
  const ratio = spent / budget
  const over = ratio > 1
  const near = !over && ratio >= 0.8
  return (
    <div
      className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={budget}
      aria-valuenow={spent}
      aria-label="Uso do orçamento"
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500 ease-out-soft')}
        style={{ width: `${Math.min(ratio, 1) * 100}%`, background: over ? 'var(--danger)' : near ? 'var(--warning)' : color }}
      />
    </div>
  )
}
