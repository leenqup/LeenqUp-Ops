import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm',
        'placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50 focus-visible:border-coral',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-navy-500 dark:bg-navy-600 dark:text-white dark:placeholder:text-slate-500',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }
