export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E }

export type Nullable<T> = T | null

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface DateRange {
  from: string
  to: string
}

/** Minor-unit-safe money amount. `amount` is always in major units (dollars, pesos). */
export interface Money {
  amount: number
  currency: CurrencyCode
}

export type CurrencyCode = 'USD' | 'COP' | 'CAD'

/** Interface language. Follows the country: Colombia is Spanish, the rest English. */
export type Language = 'en' | 'es'

export type Frequency = 'monthly' | 'biweekly' | 'weekly' | 'annually'

export const FREQUENCY_PER_YEAR: Record<Frequency, number> = {
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  annually: 1,
}

export const CALCULATOR_IDS = [
  'loan',
  'mortgage',
  'car-loan',
  'investment',
  'savings',
  'debt-payoff',
] as const

export type CalculatorId = (typeof CALCULATOR_IDS)[number]
