/**
 * Money math helpers. Floating point is fine for display-scale figures, but every
 * value that reaches a user or a database row goes through one of these first so
 * 1234.5699999 never leaks out as a payment.
 */

export function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function roundMoney(value: number, decimals = 2): number {
  return roundTo(value, decimals)
}

/** Rounds a rate held as a fraction to basis-point precision. */
export function roundRate(rate: number): number {
  return roundTo(rate, 6)
}

/**
 * Spreads a total across n periods so the parts sum exactly to the total.
 * The remainder lands on the final period, which is how lenders handle it.
 */
export function distribute(total: number, periods: number, decimals = 2): number[] {
  if (periods <= 0) return []
  const even = roundTo(total / periods, decimals)
  const parts = Array.from({ length: periods }, () => even)
  const drift = roundTo(total - even * periods, decimals)
  parts[periods - 1] = roundTo(parts[periods - 1] + drift, decimals)
  return parts
}
