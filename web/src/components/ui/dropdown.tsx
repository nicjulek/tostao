import * as DM from '@radix-ui/react-dropdown-menu'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export const DropdownMenu = DM.Root
export const DropdownTrigger = DM.Trigger

export function DropdownContent({
  children,
  align = 'end',
  className
}: {
  children: ReactNode
  align?: 'start' | 'end'
  className?: string
}) {
  return (
    <DM.Portal>
      <DM.Content
        align={align}
        sideOffset={6}
        className={cn('z-50 min-w-48 rounded-md border border-line bg-surface p-1 shadow-lg', className)}
      >
        {children}
      </DM.Content>
    </DM.Portal>
  )
}

export function DropdownItem({ children, onSelect, danger }: { children: ReactNode; onSelect: () => void; danger?: boolean }) {
  return (
    <DM.Item
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none data-[highlighted]:bg-surface-2 [&_svg]:size-4',
        danger ? 'text-danger' : 'text-ink'
      )}
    >
      {children}
    </DM.Item>
  )
}

export const DropdownSeparator = () => <DM.Separator className="my-1 h-px bg-line" />
