import { formatCurrency, formatDelta } from '@/lib/utils/format-currency'
import { cn } from '@/lib/utils/cn'
import type { CurrencyCode } from '@/types/currency'

export interface CurrencyDisplayProps {
  value: number
  currency?: CurrencyCode
  /** Renders a signed value and colours it by direction. */
  delta?: boolean
  /** Which direction counts as good, for colouring a delta. */
  betterDirection?: 'lower' | 'higher'
  compact?: boolean
  className?: string
}

export function CurrencyDisplay({
  value,
  currency = 'USD',
  delta = false,
  betterDirection = 'lower',
  compact = false,
  className,
}: CurrencyDisplayProps) {
  const text = delta ? formatDelta(value, currency) : formatCurrency(value, currency, { compact })

  const good = betterDirection === 'lower' ? value < 0 : value > 0
  const tone = !delta || value === 0 ? '' : good ? 'text-emerald-400' : 'text-red-400'

  return <span className={cn('tabular-nums', tone, className)}>{text}</span>
}
