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
 * How the total paid splits across its parts.
 *
 * One column per part, each rising over a dark track that stands for the
 * whole, over dashed guides at every quarter, so each reads as its share of
 * the total on a shared baseline.
 * The columns take whatever height the card gives them (at least a minimum),
 * and every column is labelled with its name, amount and share, so identity
 * never rests on colour alone.
 */
export function PaymentBreakdown({ segments, currency, className }: PaymentBreakdownProps) {
  const { t } = useI18n()
  const colors = seriesColors('dark')
  const palette = [colors.primary, colors.secondary, colors.tertiary]

  const visible = segments.filter((segment) => segment.value > 0)
  const total = visible.reduce((sum, segment) => sum + segment.value, 0)

  if (total === 0) return null

  const share = (value: number) => value / total
  const columns = `repeat(${visible.length}, minmax(0, 1fr))`
  // Beyond the three palette hues, tint rather than invent a new one.
  const colorAt = (index: number) => ({
    backgroundColor: palette[index] ?? colors.primary,
    opacity: index < palette.length ? 1 : 0.55,
  })

  return (
    <figure className={cn('flex flex-col gap-5', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <figcaption className="text-sm font-medium">{t.charts.breakdownCaption}</figcaption>
        <p className="text-xs text-muted-foreground">
          {t.common.total}{' '}
          <span className="text-sm font-medium tabular-nums text-foreground">{formatCurrency(total, currency)}</span>
        </p>
      </div>

      {/* The plot: dashed guides at every quarter, one column per part rising over its track. */}
      <div className="relative min-h-44 flex-1 pt-6">
        <div aria-hidden className="absolute inset-x-0 bottom-0 top-6">
          {[0, 25, 50, 75, 100].map((line) => (
            <span
              key={line}
              className="absolute inset-x-0 border-t border-dashed border-white/[0.07]"
              style={{ bottom: `${line}%` }}
            />
          ))}
        </div>

        <div className="relative grid h-full" style={{ gridTemplateColumns: columns }}>
          {visible.map((segment, index) => {
            const pct = share(segment.value) * 100
            return (
              <div key={segment.key} className="flex justify-center px-2">
                <div
                  className="relative h-full w-full max-w-24 rounded-lg bg-white/[0.035]"
                  title={`${segment.label}: ${formatCurrency(segment.value, currency)}`}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-lg transition-[height] duration-500"
                    style={{ height: `${Math.max(pct, 2)}%`, ...colorAt(index) }}
                  />
                  <span
                    className="absolute inset-x-0 text-center text-xs font-semibold tabular-nums"
                    style={{ bottom: `calc(${Math.max(pct, 2)}% + 6px)` }}
                  >
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <dl className="grid" style={{ gridTemplateColumns: columns }}>
        {visible.map((segment, index) => (
          <div key={segment.key} className="min-w-0 px-2 text-center">
            <dt className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={colorAt(index)} />
              <span className="truncate">{segment.label}</span>
            </dt>
            <dd className="mt-1 truncate text-sm font-medium tabular-nums">{formatCurrency(segment.value, currency)}</dd>
          </div>
        ))}
      </dl>
    </figure>
  )
}
