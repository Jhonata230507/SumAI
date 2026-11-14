import type { CountryCode } from '@/types/country'
import type { CurrencyCode } from '@/types/common'
import { colombiaLoan } from './countries/co'

/** How the borrower describes their credit history; it only moves the estimated rate. */
export const CREDIT_HISTORIES = ['excellent', 'good', 'fair', 'low'] as const
export type CreditHistory = (typeof CREDIT_HISTORIES)[number]

/**
 * Fixed: the same loan payment every month (French system).
 * Decreasing: the same principal every month plus interest on the balance, so
 * the payment falls over time (constant amortization).
 */
export const PAYMENT_TYPES = ['fixed', 'decreasing'] as const
export type PaymentType = (typeof PAYMENT_TYPES)[number]

/** What the loan is for. Optional; it never changes a number. */
export const LOAN_PURPOSES_CO = [
  'free-use',
  'debt-purchase',
  'education',
  'home-improvement',
  'vehicle',
  'health',
  'travel',
  'other',
] as const
export type LoanPurposeCo = (typeof LOAN_PURPOSES_CO)[number]

/**
 * Everything country-specific about the standard (consumer) loan estimator.
 * Rates are fractions and effective annual (E.A.): 0.2215 is 22.15% E.A.
 */
export interface LoanCountryConfig {
  currency: CurrencyCode
  locale: string
  term: {
    minMonths: number
    maxMonths: number
    /** Shown in the empty term field, in months. */
    exampleMonths: number
  }
  rates: {
    /** Average consumer-loan rate, E.A. Used when the rate is empty and no history is given. */
    average: number
    /** Added to the average for each credit history (percentage points as a fraction). */
    spreadByHistory: Record<CreditHistory, number>
    /** Legal maximum (tasa de usura), E.A. Estimates never exceed it; typed rates above it are flagged. */
    usuryCap: number
  }
  /** Share of income that all monthly debt payments should stay under. */
  dtiGuideline: number
  /** Values shown in empty fields. */
  examples: {
    amount: number
    monthlyIncome: number
    monthlyDebts: number
    /** Monthly debtor life insurance, as a fraction of the balance. */
    insuranceRate: number
    fees: number
  }
}

const CONFIGS: Partial<Record<CountryCode, LoanCountryConfig>> = {
  co: colombiaLoan,
}

/** The estimator config for a country, or null when the country uses the classic calculator. */
export function getLoanConfig(code: CountryCode): LoanCountryConfig | null {
  return CONFIGS[code] ?? null
}
