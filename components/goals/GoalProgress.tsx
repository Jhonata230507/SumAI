'use client'

import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'
import { useI18n } from '@/lib/i18n/client'
import type { CurrencyCode } from '@/types/currency'

export interface GoalProgressProps {
  current: number
  target: number
  currency: CurrencyCode
  onTrack?: boolean
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Progress toward a goal. A meter, not a chart: one value against one target
 * reads fastest as a filled bar with the figures printed beside it.
 */
export function GoalProgress({
  current,
  target,
  currency,
  onTrack = true,
  size = 'md',
  className,
}: GoalProgressProps) {
  const { t } = useI18n()
  const fraction = target > 0 ? Math.min(1, current / target) : 0
  const percent = Math.round(fraction * 100)

  return (
    <div className={cn('space-y-1.5', className)}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={t.goals.percentOfGoal(percent)}
        className={cn('w-full overflow-hidden rounded-full bg-muted', size === 'sm' ? 'h-1.5' : 'h-2.5')}
      >
        <div
          className={cn('h-full rounded-full transition-all', onTrack ? 'bg-primary' : 'bg-amber-500')}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-baseline justify-between text-xs text-muted-foreground">
        <span className="tabular-nums">
          <span className="font-medium text-foreground">{formatCurrency(current, currency)}</span>{' '}
          {t.goals.of} {formatCurrency(target, currency)}
        </span>
        <span className="tabular-nums">{percent}%</span>
      </div>
    </div>
  )
}
