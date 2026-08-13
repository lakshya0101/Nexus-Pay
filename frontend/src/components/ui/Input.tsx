import { cn } from '@/lib/utils'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold tracking-wide text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'flex h-9 w-full rounded-lg border border-border bg-surface-1 px-3.5 py-1.5 text-sm text-text-primary shadow-sm',
            'placeholder:text-text-muted',
            'hover:border-border-hover',
            'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent focus:bg-surface-2 focus:shadow-[0_0_15px_rgba(16,185,129,0.08),inset_0_1px_2px_rgba(255,255,255,0.02)]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'transition-all duration-300 ease-out',
            error && 'border-danger focus:ring-danger/25 focus:shadow-[0_0_15px_rgba(239,68,68,0.08)]',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
