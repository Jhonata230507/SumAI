import { effectiveToPeriodic } from '@/lib/calculations/interest'

/**
 * Colombian housing rules the mortgage page reads. Pure: no rounding.
 *
 * ESTIMATES — review before launch:
 * - `minimumWage` is the 2026 SMMLV; update it every January.
 * - VIS is capped at 150 SMMLV (some municipalities allow up to 135/150 under
 *   different decrees; the national general cap is used here).
 */
export const CO_HOUSING = {
  /** Salario mínimo mensual legal vigente, COP. */
  minimumWage: 1_750_905,
  /** VIS price cap, in minimum wages. */
  visCapWages: 150,
  /**
   * Most a bank may lend as a share of the home's value (Ley 546 de 1999):
   * 80% for VIS, 70% for No VIS. Expressed here as the minimum down payment.
   */
  minDownRatio: { vis: 0.2, 'no-vis': 0.3 },
  /** The housing payment may not exceed this share of household income (Ley 546 de 1999). */
  maxPaymentToIncome: 0.3,
  /** All monthly debts, housing included, as a share of income: a common bank guideline. */
  maxDebtToIncome: 0.4,
} as const

export const HOUSING_TYPES = ['vis', 'no-vis'] as const
export type HousingType = (typeof HOUSING_TYPES)[number]

export const HOME_CONDITIONS = ['new', 'used'] as const
export type HomeCondition = (typeof HOME_CONDITIONS)[number]

/** The highest price a VIS home may have, COP. */
export function visPriceCap(): number {
  return CO_HOUSING.visCapWages * CO_HOUSING.minimumWage
}

/**
 * Budget mode: the largest loan a fixed monthly payment repays over the term,
 * at an E.A. rate. L = C · (1 − (1 + i)^−n) / i, or C · n at a zero rate.
 */
export function loanFromPayment(payment: number, annualRateEA: number, termMonths: number): number {
  if (!(payment > 0) || !(termMonths > 0)) return 0
  const i = effectiveToPeriodic(annualRateEA, 12)
  if (i === 0) return payment * termMonths
  return (payment * (1 - (1 + i) ** -termMonths)) / i
}

export interface HousingChecks {
  /** The price is above the VIS cap while VIS is chosen. */
  overVisCap: boolean
  /** The down payment is below what the bank requires for this type of home. */
  downBelowMinimum: boolean
  minDownRatio: number
}

export function checkHousing(type: HousingType, homePrice: number, downPayment: number): HousingChecks {
  const minDownRatio = CO_HOUSING.minDownRatio[type]
  const priced = Number.isFinite(homePrice) && homePrice > 0
  return {
    overVisCap: type === 'vis' && priced && homePrice > visPriceCap(),
    downBelowMinimum: priced && Number.isFinite(downPayment) && downPayment / homePrice < minDownRatio - 1e-9,
    minDownRatio,
  }
}
