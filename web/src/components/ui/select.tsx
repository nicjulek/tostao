import * as RS from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface SelectOption {
  value: string
  label: string
  icon?: ReactNode
}

interface SelectProps {
  value: string | undefined
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  id?: string
  className?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  'aria-label'?: string
  'aria-invalid'?: boolean
}

export function Select({ value, onValueChange, options, placeholder, id, className, disabled, size = 'md', ...aria }: SelectProps) {
  const current = options.find((o) => o.value === value)
  return (
    <RS.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RS.Trigger
        id={id}
        className={cn(
          'inline-flex w-full items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 text-left text-sm text-ink transition-colors hover:bg-surface-2 focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/20 aria-[invalid=true]:border-danger data-[placeholder]:text-ink-3',
          size === 'sm' ? 'h-8' : 'h-10',
          className
        )}
        {...aria}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {current?.icon}
          <RS.Value placeholder={placeholder}>{current?.label}</RS.Value>
        </span>
        <RS.Icon>
          <ChevronDown className="size-4 text-ink-3" aria-hidden />
        </RS.Icon>
      </RS.Trigger>
      <RS.Portal>
        <RS.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-line bg-surface shadow-lg"
        >
          <RS.Viewport className="p-1">
            {options.map((o) => (
              <RS.Item
                key={o.value}
                value={o.value}
                className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm py-2 pl-2 pr-8 text-sm text-ink outline-none data-[highlighted]:bg-surface-2"
              >
                {o.icon}
                <RS.ItemText>{o.label}</RS.ItemText>
                <RS.ItemIndicator className="absolute right-2">
                  <Check className="size-4" aria-hidden />
                </RS.ItemIndicator>
              </RS.Item>
            ))}
          </RS.Viewport>
        </RS.Content>
      </RS.Portal>
    </RS.Root>
  )
}
