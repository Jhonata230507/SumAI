import type { CountryCode } from '@/types/country'
import type { CurrencyCode } from '@/types/currency'
import { US_MORTGAGE } from './countries/us'

/** Loan programs a country can offer. A country lists the ones it has, in order. */
export const MORTGAGE_PROGRAMS = ['conventional', 'fha', 'va', 'usda'] as const
export type MortgageProgramId = (typeof MORTGAGE_PROGRAMS)[number]

/** A first-match table row: applies when every condition it sets holds. */
export interface FeeRow {
  /** Applies when the down payment is at least this share of the price. */
  minDown?: number
  /** Applies when the term is at most this many months. */
  maxTermMonths?: number
  /** Applies when the loan-to-value is above this. */
  aboveLtv?: number
  /** Annual or one-time rate, as a share of the base loan. */
  rate: number
}

export type MortgageInsuranceRule =
  | { kind: 'none' }
  /** Private mortgage insurance from the credit and LTV table, until the LTV falls to `removeAtLtv`. */
  | { kind: 'pmi'; requiredAboveLtv: number; removeAtLtv: number }
  /**
   * A program premium: the first matching row's rate, for the life of the loan,
   * or for `years` when the down payment is at least `limitedWithDown`.
   */
  | { kind: 'premium'; rows: FeeRow[]; limitedWithDown?: number; years?: number }

export interface ProgramConfig {
  /** The usual minimum down payment; by credit band where it differs. */
  minDown: number
  minDownByCredit?: Record<string, number>
  /** One-time fee as a share of the base loan, first matching row; empty for none. */
  upfrontFee: FeeRow[]
  insurance: MortgageInsuranceRule
  /** Rate spread versus a conventional loan, and how much the credit score moves it (1 = fully). */
  rateSpread: number
  creditSensitivity: number
  /** Debt-to-income guidelines: housing only (null when the program sets none), and all debts. */
  dti: { front: number | null; back: number }
}

export interface CreditBandConfig {
  /** Shown as is, e.g. '760+'. */
  id: string
  /** A score inside the range, for ranking lenders. */
  representativeScore: number
}

/**
 * Everything one country's mortgage estimator needs. The calculation and the
 * UI read this and nothing else, so a new country is a new config.
 *
 * ESTIMATES: every rate, fee and percentage below is a placeholder for
 * planning, shown to users as an estimate. The program fees change over time
 * and depend on the borrower; verify them against current agency sources
 * before launch.
 */
export interface MortgageCountryConfig {
  country: CountryCode
  currency: CurrencyCode
  locale: string
  programs: MortgageProgramId[]
  program: Partial<Record<MortgageProgramId, ProgramConfig>>
  /** The term the user types, in months: the bounds it is held to, and the example shown while empty. */
  term: { minMonths: number; maxMonths: number; exampleMonths: number }
  /** Credit score ranges, best first. */
  creditBands: CreditBandConfig[]
  estimates: {
    /** Conventional rate with no credit given, by term in years. */
    rateByTermYears: Record<number, number>
    /** Rate spread by credit band, for a fully credit-sensitive program. */
    rateByCredit: Record<string, number>
    /** Annual PMI by credit band at the highest LTV, and the factor applied at lower LTVs (first `maxLtv` it fits). */
    pmiByCredit: Record<string, number>
    pmiUnknownCredit: number
    pmiLtvFactor: { maxLtv: number; factor: number }[]
    /** Property tax, as a share of the price a year: by region when the postal code places it, else national. */
    propertyTaxNational: number
    propertyTaxByRegion: Record<string, { name: string; rate: number }>
    /** Home insurance, as a share of the price a year. */
    insuranceRate: number
  }
  /** The region (state) a postal code is in, or null. */
  regionOf: (postalCode: string) => string | null
  /** Whether a postal code is complete, so a region can be looked up. */
  isPostalCode: (postalCode: string) => boolean
}

const CONFIGS: Partial<Record<CountryCode, MortgageCountryConfig>> = {
  us: US_MORTGAGE,
}

/** The estimator config for a country, or null when the country uses the classic calculator. */
export function getMortgageConfig(country: CountryCode): MortgageCountryConfig | null {
  return CONFIGS[country] ?? null
}
