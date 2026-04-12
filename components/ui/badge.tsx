import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-coral/10 text-coral-700',
        secondary: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        success: 'bg-brand-green-light text-brand-green',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-700',
        navy: 'bg-navy/10 text-navy dark:bg-navy-100/10 dark:text-slate-300',
        purple: 'bg-brand-purple-light text-brand-purple',
        outline: 'border border-current bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
