import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
  children?: ReactNode
  className?: string
  hover?: boolean
  title?: ReactNode
  description?: ReactNode
}

export function Card({ children, className, hover = true, title, description }: CardProps) {
  return (
    <div className={cn(
      'rounded-xl border border-border bg-gradient-to-br from-surface-1 to-surface-2 p-5 shadow-sm',
      'transition-all duration-400 ease-out',
      hover && 'hover:border-border-hover hover:from-surface-2 hover:to-surface-3 hover:shadow-xl hover:shadow-accent/4 hover:-translate-y-0.5',
      className,
    )}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-semibold text-text-primary tracking-wide">{title}</h3>}
          {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-4 flex items-center justify-between', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('text-sm font-bold text-text-primary tracking-wide font-sans', className)}>{children}</h3>
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-xs text-text-muted mt-1 leading-relaxed', className)}>{children}</p>
}
