import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
  icon?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-sm hover:shadow-[0_0_14px_rgba(16,185,129,0.15)] border border-transparent btn-sweep',
  secondary: 'bg-surface-2 text-text-primary hover:bg-surface-3 border border-border hover:border-border-hover btn-sweep',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-2',
  danger: 'bg-danger-muted text-danger hover:bg-danger/15 border border-transparent btn-sweep',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-10 px-5 text-sm gap-2 rounded-lg',
}

export function Button({ variant = 'primary', size = 'md', children, icon, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-bold tracking-wide transition-all duration-250 ease-out',
        'hover:scale-[1.01] hover:-translate-y-[1px] active:scale-[0.985] active:translate-y-[0px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-1 focus-visible:ring-offset-surface-0',
        'disabled:opacity-30 disabled:bg-surface-2/10 disabled:border-border/20 disabled:text-text-muted disabled:pointer-events-none disabled:scale-100 disabled:shadow-none disabled:translate-y-0',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
