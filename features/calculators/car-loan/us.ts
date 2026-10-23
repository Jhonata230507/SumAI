import type { CountryBenchmarks } from '@/lib/countries'
import { zipToState, STATE_PROPERTY_TAX, type CreditBand } from '@/features/calculators/mortgage/us'

/**
 * US auto-loan specifics: the rate by credit and vehicle condition, and the
 * sales tax and fees by location.
 *
 * All of it is an estimate for planning and the UI labels it so. Rate spreads
 * follow the typical gap between credit tiers in published auto-lending data
 * (used cars price higher and spread wider); sales tax uses each state's average
 * combined state-and-local rate, which a county or a state's own vehicle tax
 * can move; fees are a typical title, registration and dealer documentation
 * total.
 */

export const VEHICLE_CONDITIONS = ['new', 'used'] as const
export type VehicleCondition = (typeof VEHICLE_CONDITIONS)[number]

/** Spread over the market average, by credit band and condition. */
const SPREAD: Record<VehicleCondition, Record<CreditBand, number>> = {
  new: { '760+': -0.021, '700-759': -0.005, '660-699': 0.026, '620-659': 0.045, '580-619': 0.06, '<580': 0.086 },
  used: { '760+': -0.039, '700-759': -0.015, '660-699': 0.029, '620-659': 0.055, '580-619': 0.077, '<580': 0.103 },
}

/** The estimated APR: the market average for the condition, adjusted for credit when known. */
export function estimateAutoRate(
  benchmarks: CountryBenchmarks,
  condition: VehicleCondition | null | undefined,
  creditBand: CreditBand | null | undefined,
): number {
  const kind = condition ?? 'new'
  const base = kind === 'used' ? benchmarks.carLoanUsed : benchmarks.carLoanNew
  const spread = creditBand ? SPREAD[kind][creditBand] : 0
  return Math.round((base + spread) * 100_000) / 100_000
}

/** Average combined (state + local) sales tax rate by state. */
const STATE_SALES_TAX: Record<string, number> = {
  AL: 0.0929,
  AK: 0.0182,
  AZ: 0.0838,
  AR: 0.0945,
  CA: 0.0885,
  CO: 0.0781,
  CT: 0.0635,
  DE: 0,
  DC: 0.06,
  FL: 0.07,
  GA: 0.0738,
  HI: 0.045,
  ID: 0.0603,
  IL: 0.0886,
  IN: 0.07,
  IA: 0.0694,
  KS: 0.0865,
  KY: 0.06,
  LA: 0.0956,
  ME: 0.055,
  MD: 0.06,
  MA: 0.0625,
  MI: 0.06,
  MN: 0.0804,
  MS: 0.0706,
  MO: 0.0839,
  MT: 0,
  NE: 0.0697,
  NV: 0.0824,
  NH: 0,
  NJ: 0.066,
  NM: 0.0762,
  NY: 0.0853,
  NC: 0.07,
  ND: 0.0696,
  OH: 0.0724,
  OK: 0.0899,
  OR: 0,
  PA: 0.0634,
  RI: 0.07,
  SC: 0.075,
  SD: 0.0611,
  TN: 0.0955,
  TX: 0.082,
  UT: 0.0725,
  VT: 0.0636,
  VA: 0.0577,
  WA: 0.0938,
  WV: 0.0655,
  WI: 0.0543,
  WY: 0.0544,
}

/** Used until a ZIP is entered, or when it is not a state ZIP. */
export const NATIONAL_SALES_TAX = 0.07

/** Typical title, registration and documentation fees. */
export const TYPICAL_FEES = 500

export function estimateSalesTax(zip: string | undefined) {
  const state = zipToState(zip ?? '')
  return {
    rate: state ? STATE_SALES_TAX[state] : NATIONAL_SALES_TAX,
    state,
    stateName: state ? STATE_PROPERTY_TAX[state].name : null,
  }
}
