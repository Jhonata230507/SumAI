import { addMonths, differenceInMonths, format, parseISO, type Locale } from 'date-fns'
import { enUS, es } from 'date-fns/locale'

function dateLocale(locale: string): Locale {
  return locale.startsWith('es') ? es : enUS
}

export function monthsBetween(from: Date | string, to: Date | string): number {
  const start = typeof from === 'string' ? parseISO(from) : from
  const end = typeof to === 'string' ? parseISO(to) : to
  return Math.max(0, differenceInMonths(end, start))
}

/** Maps period 1..n onto real calendar dates for schedule tables. */
export function periodToDate(start: Date, period: number, periodsPerYear = 12): Date {
  const monthsPerPeriod = 12 / periodsPerYear
  return addMonths(start, Math.round(period * monthsPerPeriod))
}

/**
 * Formats a date for the given locale. The default `PP` pattern is itself
 * localized: "Sep 29, 2026" in English, "29 sept 2026" in Spanish.
 */
export function formatDate(value: Date | string, locale = 'en-US', pattern = 'PP'): string {
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, pattern, { locale: dateLocale(locale) })
}

export function formatMonthYear(value: Date | string, locale = 'en-US'): string {
  return formatDate(value, locale, 'MMM yyyy')
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
