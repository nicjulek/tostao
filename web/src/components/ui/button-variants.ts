import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-ink hover:bg-brand/90',
        secondary: 'bg-surface text-ink border border-line hover:bg-surface-2',
        ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
        danger: 'bg-danger text-white hover:bg-danger/90 dark:text-surface',
        link: 'text-ink underline decoration-ink-3/50 underline-offset-4 hover:decoration-ink px-0'
      },
      size: {
        sm: 'h-8 rounded-sm px-3 text-sm',
        md: 'h-10 rounded-md px-4 text-sm',
        lg: 'h-12 rounded-md px-5 text-base',
        icon: 'size-9 rounded-md'
      }
    },
    defaultVariants: { variant: 'primary', size: 'md' }
  }
)
