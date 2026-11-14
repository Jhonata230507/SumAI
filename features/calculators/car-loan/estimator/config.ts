import type { CountryCode } from '@/types/country'
import type { CurrencyCode } from '@/types/currency'
import { US_CAR_LOAN } from './countries/us'
import { CO_CAR_LOAN } from './countries/co'

export const VEHICLE_CONDITIONS = ['new', 'used'] as const
export type VehicleCondition = (typeof VEHICLE_CONDITIONS)[number]

export const CAR_CREDIT_BANDS = ['excellent', 'good', 'fair', 'poor'] as const
export type CarCreditBand = (typeof CAR_CREDIT_BANDS)[number]

/** A credit range as the market quotes it; open-ended at either side. */
export interface CreditBandRange {
  id: CarCreditBand
  min?: number
  max?: number
  /** A score inside the range, for ranking lenders. */
  representativeScore: number
}

/**
 * Everything one country's car loan estimator needs: what is shown, what is
 * assumed when a field is left empty, and the guidelines results are read
 * against. The calculation and the UI read this and nothing else, so a new
 * country is a new config, not new code.
 */
export interface CarLoanCountryConfig {
  country: CountryCode
  currency: CurrencyCode
  /** For formatting money and percentages, e.g. 'en-US'. */
  locale: string
  /**
   * ESTIMATES. Used when the user leaves a field empty, and labelled as
   * estimates wherever they show. Rates and tax are fractions (0.075 is 7.5%).
   */
  estimates: {
    /** Default APR by vehicle condition and credit band ('unknown' = prefer not to say). */
    apr: Record<VehicleCondition, Record<CarCreditBand | 'unknown', number>>
    /** Null where quoted prices already include taxes: no sales-tax field, nothing added. */
    salesTax: number | null
  }
  /**
   * How rates are quoted and typed: 'apr' is nominal annual (monthly rate = APR / 12),
   * 'effectiveAnnual' is E.A. (monthly rate = (1 + E.A.)^(1/12) − 1).
   */
  rateQuote: 'apr' | 'effectiveAnnual'
  /** Whether the income field asks for a yearly or a monthly figure. */
  incomePeriod: 'annual' | 'monthly'
  /** Offer a yearly all-risk insurance premium, optionally added to the loan. */
  fullCoverageInsurance: boolean
  /**
   * Colombia asks for an extra monthly payment to principal (less interest, a shorter loan)
   * where the US asks for a credit score range to estimate the rate.
   */
  extraPayments: boolean
  /** The credit ranges offered, best first. */
  creditBands: CreditBandRange[]
  /**
   * The term in months: the bounds a typed term is held to and the example shown while empty.
   * With `options`, the term is picked from these instead of typed.
   */
  term: { minMonths: number; maxMonths: number; exampleMonths: number; options?: number[] }
  /** Example amounts shown in empty fields, in the local currency and at local scale. */
  examples: { price: number; budget: number; insurance: number; income: number; debts: number }
  /**
   * Debt-to-income guidelines: below `comfortable` is generally comfortable,
   * up to `upper` is often the most lenders accept, above it approval gets harder.
   */
  dtiThresholds: { comfortable: number; upper: number }
}

const CONFIGS: Partial<Record<CountryCode, CarLoanCountryConfig>> = {
  us: US_CAR_LOAN,
  co: CO_CAR_LOAN,
}

/** The estimator config for a country, or null when the country uses the classic calculator. */
export function getCarLoanConfig(country: CountryCode): CarLoanCountryConfig | null {
  return CONFIGS[country] ?? null
}
