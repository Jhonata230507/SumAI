import type { ReactNode } from 'react'
import { ResultCard } from './ResultCard'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatMonths, formatPercent } from '@/lib/utils/format-number'
import type { CurrencyCode } from '@/types/currency'
import { cn } from '@/lib/utils/cn'

export interface SummaryFigure {
  key: string
  label: string
  value: number
  format: 'currency' | 'percent' | 'months' | 'number'
  detail?: string
  hint?: string
  emphasis?: 'primary' | 'default' | 'muted'
}

export interface ResultSummaryProps {
  figures: SummaryFigure[]
  currency: CurrencyCode
  locale?: string
  className?: string
  /** One card with the figures side by side, instead of a card per figure. */
  combined?: boolean
  /** Shown under the figures of a combined card, e.g. a notice. */
  footer?: ReactNode
}

/** The grid of headline numbers above every calculator result. */
export function ResultSummary({
  figures,
  currency,
  locale = 'en-US',
  className,
  combined = false,
  footer,
}: ResultSummaryProps) {
  if (combined) {
    return (
      <Card className={className}>
        <CardContent className="p-5">
          {/* Up to three figures sit in one divided row; four make a 2 × 2 grid. */}
          <dl
            className={cn(
              'grid gap-5',
              figures.length === 4
                ? 'sm:grid-cols-2'
                : cn('sm:gap-0 sm:divide-x sm:divide-white/[0.06]', figures.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'),
            )}
          >
            {figures.map((figure) => (
              <div key={figure.key} className={cn(figures.length !== 4 && 'sm:px-5 sm:first:pl-0 sm:last:pr-0')}>
                <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  {figure.label}
                  {figure.hint && (
                    <Tooltip content={figure.hint}>
                      <Info className="h-3.5 w-3.5" />
                    </Tooltip>
                  )}
                </dt>
                <dd className="mt-1 text-xl tabular-nums tracking-tight">{formatFigure(figure, currency, locale)}</dd>
                {figure.detail && <dd className="mt-1 text-xs text-muted-foreground">{figure.detail}</dd>}
              </div>
            ))}
          </dl>
          {footer && <div className="mt-4">{footer}</div>}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
      {figures.map((figure) => (
        <ResultCard
          key={figure.key}
          label={figure.label}
          value={formatFigure(figure, currency, locale)}
          detail={figure.detail}
          hint={figure.hint}
          emphasis={figure.emphasis}
          className={figure.emphasis === 'primary' ? 'sm:col-span-2' : undefined}
        />
      ))}
    </div>
  )
}

function formatFigure(figure: SummaryFigure, currency: CurrencyCode, locale: string): string {
  switch (figure.format) {
    case 'currency':
      return formatCurrency(figure.value, currency)
    case 'percent':
      return formatPercent(figure.value, locale)
    case 'months':
      return formatMonths(figure.value, locale)
    default:
      return new Intl.NumberFormat(locale).format(figure.value)
  }
}
