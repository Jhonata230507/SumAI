/**
 * Percentages are stored as fractions everywhere in this codebase (0.0725),
 * and only turn into "7.25%" at the edge. These helpers are that edge.
 */

export function formatPercent(fraction: number, locale = 'en-US', decimals = 2): string {
  if (!Number.isFinite(fraction)) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(fraction)
}

export function formatNumber(value: number, locale = 'en-US', decimals = 0): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/** Parses "7.25" or "7.25%" into the fraction 0.0725. */
export function parsePercent(input: string): number {
  const parsed = Number.parseFloat(input.replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed / 100 : 0
}

/**
 * Renders a month count the way people say it: "5 yr 6 mo" in English,
 * "5 años 6 meses" in Spanish. The language comes from the locale.
 */
export function formatMonths(months: number, locale = 'en-US'): string {
  if (!Number.isFinite(months)) return '—'
  const years = Math.floor(months / 12)
  const rest = Math.round(months % 12)
  const spanish = locale.startsWith('es')

  const y = spanish ? `${formatNumber(years, locale)} ${years === 1 ? 'año' : 'años'}` : `${formatNumber(years, locale)} yr`
  const m = spanish ? `${rest} ${rest === 1 ? 'mes' : 'meses'}` : `${rest} mo`

  if (years === 0) return m
  if (rest === 0) return y
  return `${y} ${m}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
