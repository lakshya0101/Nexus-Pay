import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  emptyState?: ReactNode
  className?: string
}

export function DataTable<T>({ columns, data, keyExtractor, onRowClick, emptyState, className }: DataTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div className={cn('overflow-x-auto w-full', className)}>
      <table className="w-full text-sm border-collapse" role="table">
        <thead>
          <tr className="border-b border-border/80 bg-surface-1">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted',
                  col.className,
                )}
                scope="col"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40 bg-surface-1/50">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className={cn(
                'transition-all duration-300 ease-out border-b border-border/10',
                onRowClick && 'cursor-pointer hover:bg-surface-2/50',
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-5 py-3.5 text-text-primary text-xs font-medium', col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
