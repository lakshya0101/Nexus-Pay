import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center animate-fade-in-up', className)}>
      <div className="mb-4 rounded-2xl bg-surface-2 border border-border/40 p-4 text-text-secondary shadow-inner">{icon}</div>
      <h3 className="text-sm font-bold text-text-primary tracking-wide">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-text-secondary">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
