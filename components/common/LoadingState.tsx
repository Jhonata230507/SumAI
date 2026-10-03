import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'

export interface LoadingStateProps {
  variant?: 'card' | 'table' | 'chart' | 'text'
  rows?: number
  className?: string
  label?: string
}

/** Skeletons shaped like the content they stand in for, to avoid layout shift. */
export function LoadingState({
  variant = 'card',
  rows = 3,
  className,
  label = 'Loading',
}: LoadingStateProps) {
  return (
    <div role="status" aria-busy aria-label={label} className={cn('space-y-3', className)}>
      {variant === 'chart' && <Skeleton className="h-64 w-full" />}

      {variant === 'card' &&
        Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-xl border p-6">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}

      {variant === 'table' &&
        Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}

      {variant === 'text' &&
        Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className={cn('h-4', i === rows - 1 ? 'w-2/3' : 'w-full')} />
        ))}

      <span className="sr-only">{label}</span>
    </div>
  )
}
