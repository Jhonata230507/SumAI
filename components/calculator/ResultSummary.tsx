import { ResultCard } from './ResultCard'
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
}

/** The grid of headline numbers above every calculator result. */
export function ResultSummary({
  figures,
  currency,
  locale = 'en-US',
  className,
}: ResultSummaryProps) {
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
