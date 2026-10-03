import { CURRENCIES, type CurrencyCode } from '@/types/currency'

export interface FormatCurrencyOptions {
  /** Overrides the currency default (COP normally shows none). */
  decimals?: number
  /** Renders 1_250_000 as "$1.25M". Useful in chart axes and tight cards. */
  compact?: boolean
  /** Drops the currency symbol, keeping the grouped number. */
  hideSymbol?: boolean
}

/**
 * Formats an amount for display. Always go through this rather than
 * toFixed — COP, USD and CAD disagree on decimals and separators.
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'USD',
  options: FormatCurrencyOptions = {},
): string {
  const config = CURRENCIES[currency]
  const { decimals = config.decimals, compact = false, hideSymbol = false } = options

  if (!Number.isFinite(amount)) return '—'

  const formatter = new Intl.NumberFormat(config.locale, {
    style: hideSymbol ? 'decimal' : 'currency',
    currency: config.code,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: compact ? 0 : decimals,
    maximumFractionDigits: compact ? 1 : decimals,
    notation: compact ? 'compact' : 'standard',
  })

  return formatter.format(amount)
}

/** Formats a signed delta, e.g. "+$240" / "−$240", for comparison views. */
export function formatDelta(amount: number, currency: CurrencyCode = 'USD'): string {
  if (amount === 0) return formatCurrency(0, currency)
  const sign = amount > 0 ? '+' : '−'
  return `${sign}${formatCurrency(Math.abs(amount), currency)}`
}

/** Parses user input back into a number, tolerating symbols and separators. */
export function parseCurrency(input: string, currency: CurrencyCode = 'USD'): number {
  const config = CURRENCIES[currency]
  const usesCommaDecimal = config.locale.startsWith('es')

  let cleaned = input.replace(/[^\d.,-]/g, '')
  cleaned = usesCommaDecimal
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/,/g, '')

  const parsed = Number.parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}
