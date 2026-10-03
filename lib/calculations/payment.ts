import { roundMoney } from './rounding'

/**
 * Annuity formulas — the core of every loan calculator in the app.
 * All rates here are PERIODIC fractions, not annual percentages. Convert with
 * `lib/calculations/interest` before calling in.
 */

/** Level payment that amortizes `principal` over `periods` at `periodicRate`. */
export function periodicPayment(principal: number, periodicRate: number, periods: number): number {
  if (periods <= 0) throw new Error('periods must be positive')
  if (principal <= 0) return 0
  if (periodicRate === 0) return roundMoney(principal / periods)

  const growth = (1 + periodicRate) ** periods
  return roundMoney((principal * periodicRate * growth) / (growth - 1))
}

/** Largest principal affordable at a given payment. Drives the affordability views. */
export function principalFromPayment(
  payment: number,
  periodicRate: number,
  periods: number,
): number {
  if (periods <= 0) throw new Error('periods must be positive')
  if (periodicRate === 0) return roundMoney(payment * periods)

  const growth = (1 + periodicRate) ** periods
  return roundMoney((payment * (growth - 1)) / (periodicRate * growth))
}

/**
 * Periods needed to clear `principal` at a fixed `payment`.
 * Returns Infinity when the payment never covers the periodic interest.
 */
export function periodsFromPayment(
  principal: number,
  periodicRate: number,
  payment: number,
): number {
  if (payment <= 0) return Infinity
  if (periodicRate === 0) return Math.ceil(principal / payment)
  if (payment <= principal * periodicRate) return Infinity

  return Math.ceil(
    Math.log(payment / (payment - principal * periodicRate)) / Math.log(1 + periodicRate),
  )
}

/** Outstanding balance after `elapsed` periods of level payments. */
export function remainingBalance(
  principal: number,
  periodicRate: number,
  periods: number,
  elapsed: number,
): number {
  if (elapsed >= periods) return 0
  if (periodicRate === 0) return roundMoney(principal * (1 - elapsed / periods))

  const growth = (1 + periodicRate) ** periods
  const elapsedGrowth = (1 + periodicRate) ** elapsed
  return roundMoney((principal * (growth - elapsedGrowth)) / (growth - 1))
}

/** Total interest paid over the full scheduled term, with no extra payments. */
export function totalInterest(principal: number, periodicRate: number, periods: number): number {
  return roundMoney(periodicPayment(principal, periodicRate, periods) * periods - principal)
}
