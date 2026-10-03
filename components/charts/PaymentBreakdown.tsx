'use client'

import { formatCurrency } from '@/lib/utils/format-currency'
import { seriesColors } from './theme'
import { useI18n } from '@/lib/i18n/client'
import { cn } from '@/lib/utils/cn'
import type { CurrencyCode } from '@/types/currency'

export interface BreakdownSegment {
  key: string
  label: string
  value: number
}

export interface PaymentBreakdownProps {
  segments: BreakdownSegment[]
  currency: CurrencyCode
  className?: string
}

/**
 * How one payment splits across its parts.
 *
 * A stacked bar rather than a donut: four or five parts of a whole are easier
 * to compare along a shared baseline than as arcs, and every segment is
 * directly labelled so identity never rests on colour alone.
 */
export function PaymentBreakdown({ segments, currency, className }: PaymentBreakdownProps) {
  const { t } = useI18n()
  const colors = seriesColors('dark')
  const palette = [colors.primary, colors.secondary, colors.tertiary]

  const visible = segments.filter((segment) => segment.value > 0)
  const total = visible.reduce((sum, segment) => sum + segment.value, 0)

  if (total === 0) return null

  return (
    <figure className={cn('space-y-3', className)}>
      <figcaption className="text-sm font-medium">{t.charts.breakdownCaption}</figcaption>

      <div className="flex h-8 w-full gap-0.5 overflow-hidden rounded-md">
        {visible.map((segment, index) => (
          <div
            key={segment.key}
            style={{
              width: `${(segment.value / total) * 100}%`,
              // Beyond the three validated hues, tint rather than invent a new one.
              backgroundColor: palette[index] ?? colors.primary,
              opacity: index < palette.length ? 1 : 0.55,
            }}
            title={`${segment.label}: ${formatCurrency(segment.value, currency)}`}
          />
        ))}
      </div>

      <dl className="space-y-1.5">
        {visible.map((segment, index) => (
          <div key={segment.key} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: palette[index] ?? colors.primary,
                opacity: index < palette.length ? 1 : 0.55,
              }}
            />
            <dt className="text-muted-foreground">{segment.label}</dt>
            <dd className="ml-auto tabular-nums">
              {formatCurrency(segment.value, currency)}
              <span className="ml-2 text-xs text-muted-foreground">
                {((segment.value / total) * 100).toFixed(0)}%
              </span>
            </dd>
          </div>
        ))}

        <div className="flex items-center gap-2 border-t pt-1.5 text-sm font-medium">
          <dt>{t.common.total}</dt>
          <dd className="ml-auto tabular-nums">{formatCurrency(total, currency)}</dd>
        </div>
      </dl>
    </figure>
  )
}
