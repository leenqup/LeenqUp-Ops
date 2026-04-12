import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-coral text-white hover:bg-coral-600 active:bg-coral-700',
        secondary: 'bg-white text-navy border border-gray-200 hover:bg-gray-50 dark:bg-navy-600 dark:text-white dark:border-navy-500',
        ghost: 'text-slate hover:bg-gray-100 dark:hover:bg-navy-600',
        link: 'text-coral underline-offset-4 hover:underline',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        navy: 'bg-navy text-white hover:bg-navy-600',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 px-3 text-xs',
        lg: 'h-11 px-6',
        icon: 'h-9 w-9',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
