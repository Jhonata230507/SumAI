import type { CountryBenchmarks } from '@/lib/countries'

/**
 * US-specific mortgage rules: loan types, credit score bands, rate estimates,
 * and a ZIP → state lookup for property tax.
 *
 * Everything here is an estimate for planning, and is labelled as such in the
 * UI. The loan-type rules follow the published program terms (FHA MIP, VA
 * funding fee, USDA guarantee fee, conventional PMI); the rate and PMI
 * adjustments by credit score are typical market spreads, not any lender's
 * pricing; state property tax rates are statewide average effective rates
 * (tax paid as a share of home value) — a county can differ a lot.
 */

export const LOAN_TYPES = ['conventional', 'fha', 'va', 'usda'] as const
export type LoanType = (typeof LOAN_TYPES)[number]

export const CREDIT_BANDS = ['760+', '700-759', '660-699', '620-659', '580-619', '<580'] as const
export type CreditBand = (typeof CREDIT_BANDS)[number]

/* ---------- rate estimate ---------- */

/** Rate spread by credit band for a conventional loan, versus the market average. */
const BAND_SPREAD: Record<CreditBand, number> = {
  '760+': -0.0025,
  '700-759': 0,
  '660-699': 0.00375,
  '620-659': 0.00875,
  '580-619': 0.0125,
  '<580': 0.0175,
}

/** Government-backed loans price lower and depend less on credit score. */
const TYPE_SPREAD: Record<LoanType, number> = { conventional: 0, fha: -0.0025, va: -0.00375, usda: -0.0025 }
const TYPE_CREDIT_SENSITIVITY: Record<LoanType, number> = { conventional: 1, fha: 0.5, va: 0.5, usda: 0.5 }

export function estimateRate(input: {
  benchmarks: CountryBenchmarks
  termMonths: number
  loanType: LoanType
  creditBand: CreditBand | null
}): number {
  const base = input.termMonths <= 180 ? input.benchmarks.mortgage15Year : input.benchmarks.mortgage30Year
  const credit = input.creditBand ? BAND_SPREAD[input.creditBand] * TYPE_CREDIT_SENSITIVITY[input.loanType] : 0
  return Math.round((base + TYPE_SPREAD[input.loanType] + credit) * 100_000) / 100_000
}

/* ---------- loan-type rules ---------- */

export type InsuranceDuration =
  /** Conventional PMI: until the balance reaches 80% of the home's value. */
  | { kind: 'until-equity' }
  | { kind: 'months'; months: number }
  | { kind: 'life' }
  | { kind: 'none' }

export interface LoanRules {
  /** Upfront fee as a share of the base loan, financed into the loan. */
  upfrontFeeRate: number
  /** Annual mortgage insurance as a share of the loan amount. */
  annualInsuranceRate: number
  insuranceDuration: InsuranceDuration
  minDownRatio: number
  /** Debt-to-income guidelines: housing only, and housing plus other debts. Null when the program sets none. */
  frontLimit: number | null
  backLimit: number
}

/** Conventional PMI rate by credit band (annual, share of the loan). */
const PMI_BY_BAND: Record<CreditBand, number> = {
  '760+': 0.003,
  '700-759': 0.005,
  '660-699': 0.008,
  '620-659': 0.011,
  '580-619': 0.0135,
  '<580': 0.015,
}

export function loanRules(input: {
  loanType: LoanType
  downRatio: number
  termMonths: number
  creditBand: CreditBand | null
}): LoanRules {
  const { downRatio, termMonths, creditBand } = input
  const ltv = 1 - downRatio

  switch (input.loanType) {
    case 'conventional':
      return {
        upfrontFeeRate: 0,
        annualInsuranceRate: ltv > 0.8 ? PMI_BY_BAND[creditBand ?? '700-759'] : 0,
        insuranceDuration: ltv > 0.8 ? { kind: 'until-equity' } : { kind: 'none' },
        minDownRatio: 0.03,
        frontLimit: 0.28,
        backLimit: 0.36,
      }
    case 'fha': {
      // Annual MIP (2023 schedule): lower on 15-year terms and with more than 5% down.
      const short = termMonths <= 180
      const annual = short ? (ltv > 0.9 ? 0.004 : 0.0015) : ltv > 0.95 ? 0.0055 : 0.005
      return {
        upfrontFeeRate: 0.0175,
        annualInsuranceRate: annual,
        // With 10% or more down, MIP ends after 11 years; otherwise it lasts the life of the loan.
        insuranceDuration: downRatio >= 0.1 ? { kind: 'months', months: 132 } : { kind: 'life' },
        minDownRatio: creditBand === '<580' ? 0.1 : 0.035,
        frontLimit: 0.31,
        backLimit: 0.43,
      }
    }
    case 'va':
      return {
        // First-use funding fee, by down payment.
        upfrontFeeRate: downRatio >= 0.1 ? 0.0125 : downRatio >= 0.05 ? 0.015 : 0.0215,
        annualInsuranceRate: 0,
        insuranceDuration: { kind: 'none' },
        minDownRatio: 0,
        frontLimit: null,
        backLimit: 0.41,
      }
    case 'usda':
      return {
        upfrontFeeRate: 0.01,
        annualInsuranceRate: 0.0035,
        insuranceDuration: { kind: 'life' },
        minDownRatio: 0,
        frontLimit: 0.29,
        backLimit: 0.41,
      }
  }
}

/* ---------- property tax and insurance estimates ---------- */

/** Statewide average effective property tax rates (share of home value per year). */
export const STATE_PROPERTY_TAX: Record<string, { name: string; rate: number }> = {
  AL: { name: 'Alabama', rate: 0.0038 }, AK: { name: 'Alaska', rate: 0.0104 }, AZ: { name: 'Arizona', rate: 0.0052 },
  AR: { name: 'Arkansas', rate: 0.0057 }, CA: { name: 'California', rate: 0.0071 }, CO: { name: 'Colorado', rate: 0.0049 },
  CT: { name: 'Connecticut', rate: 0.017 }, DE: { name: 'Delaware', rate: 0.0051 }, DC: { name: 'Washington, D.C.', rate: 0.0057 },
  FL: { name: 'Florida', rate: 0.0079 }, GA: { name: 'Georgia', rate: 0.0083 }, HI: { name: 'Hawaii', rate: 0.0027 },
  ID: { name: 'Idaho', rate: 0.0056 }, IL: { name: 'Illinois', rate: 0.0195 }, IN: { name: 'Indiana', rate: 0.0075 },
  IA: { name: 'Iowa', rate: 0.0143 }, KS: { name: 'Kansas', rate: 0.0134 }, KY: { name: 'Kentucky', rate: 0.0075 },
  LA: { name: 'Louisiana', rate: 0.0056 }, ME: { name: 'Maine', rate: 0.0109 }, MD: { name: 'Maryland', rate: 0.0099 },
  MA: { name: 'Massachusetts', rate: 0.0104 }, MI: { name: 'Michigan', rate: 0.0128 }, MN: { name: 'Minnesota', rate: 0.0102 },
  MS: { name: 'Mississippi', rate: 0.0067 }, MO: { name: 'Missouri', rate: 0.0088 }, MT: { name: 'Montana', rate: 0.0068 },
  NE: { name: 'Nebraska', rate: 0.015 }, NV: { name: 'Nevada', rate: 0.0049 }, NH: { name: 'New Hampshire', rate: 0.0161 },
  NJ: { name: 'New Jersey', rate: 0.0208 }, NM: { name: 'New Mexico', rate: 0.0067 }, NY: { name: 'New York', rate: 0.0136 },
  NC: { name: 'North Carolina', rate: 0.007 }, ND: { name: 'North Dakota', rate: 0.0092 }, OH: { name: 'Ohio', rate: 0.0143 },
  OK: { name: 'Oklahoma', rate: 0.0082 }, OR: { name: 'Oregon', rate: 0.0082 }, PA: { name: 'Pennsylvania', rate: 0.0135 },
  RI: { name: 'Rhode Island', rate: 0.0126 }, SC: { name: 'South Carolina', rate: 0.0051 }, SD: { name: 'South Dakota', rate: 0.0107 },
  TN: { name: 'Tennessee', rate: 0.0056 }, TX: { name: 'Texas', rate: 0.0147 }, UT: { name: 'Utah', rate: 0.0052 },
  VT: { name: 'Vermont', rate: 0.0162 }, VA: { name: 'Virginia', rate: 0.008 }, WA: { name: 'Washington', rate: 0.008 },
  WV: { name: 'West Virginia', rate: 0.0052 }, WI: { name: 'Wisconsin', rate: 0.0151 }, WY: { name: 'Wyoming', rate: 0.0056 },
}

/** Used until a ZIP is entered, or when it is not a state ZIP. */
export const NATIONAL_PROPERTY_TAX_RATE = 0.009

/** First three ZIP digits → state, as inclusive ranges. Exceptions come first. */
const ZIP3_RANGES: [number, number, string][] = [
  [55, 55, 'MA'], [201, 201, 'VA'], [569, 569, 'DC'], [733, 733, 'TX'], [885, 885, 'TX'], [398, 399, 'GA'],
  [5, 5, 'NY'], [10, 27, 'MA'], [28, 29, 'RI'], [30, 38, 'NH'], [39, 49, 'ME'], [50, 59, 'VT'],
  [60, 69, 'CT'], [70, 89, 'NJ'], [100, 149, 'NY'], [150, 196, 'PA'], [197, 199, 'DE'], [200, 205, 'DC'],
  [206, 219, 'MD'], [220, 246, 'VA'], [247, 268, 'WV'], [270, 289, 'NC'], [290, 299, 'SC'], [300, 319, 'GA'],
  [320, 349, 'FL'], [350, 369, 'AL'], [370, 385, 'TN'], [386, 397, 'MS'], [400, 427, 'KY'], [430, 459, 'OH'],
  [460, 479, 'IN'], [480, 499, 'MI'], [500, 528, 'IA'], [530, 549, 'WI'], [550, 567, 'MN'], [570, 577, 'SD'],
  [580, 588, 'ND'], [590, 599, 'MT'], [600, 629, 'IL'], [630, 658, 'MO'], [660, 679, 'KS'], [680, 693, 'NE'],
  [700, 714, 'LA'], [716, 729, 'AR'], [730, 749, 'OK'], [750, 799, 'TX'], [800, 816, 'CO'], [820, 831, 'WY'],
  [832, 838, 'ID'], [840, 847, 'UT'], [850, 865, 'AZ'], [870, 884, 'NM'], [889, 898, 'NV'], [900, 961, 'CA'],
  [967, 968, 'HI'], [970, 979, 'OR'], [980, 994, 'WA'], [995, 999, 'AK'],
]

export const isZip = (zip: string) => /^\d{5}$/.test(zip)

export function zipToState(zip: string): string | null {
  if (!isZip(zip)) return null
  const prefix = Number(zip.slice(0, 3))
  return ZIP3_RANGES.find(([from, to]) => prefix >= from && prefix <= to)?.[2] ?? null
}

export function estimatePropertyTax(homePrice: number, zip: string) {
  const state = zipToState(zip)
  const rate = state ? STATE_PROPERTY_TAX[state].rate : NATIONAL_PROPERTY_TAX_RATE
  return { annual: Math.round(homePrice * rate), rate, state, stateName: state ? STATE_PROPERTY_TAX[state].name : null }
}

/** Typical homeowners insurance runs about half a percent of the home's value a year. */
export function estimateHomeInsurance(homePrice: number): number {
  return Math.round((homePrice * 0.005) / 10) * 10
}
