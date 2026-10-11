import type { CountryBenchmarks } from '@/lib/countries'
import type { CreditBand } from '@/features/calculators/mortgage/us'

/**
 * US personal-loan specifics: what the loan is for, and how much the rate moves
 * with credit. Personal loans are unsecured, so credit matters far more than on
 * a mortgage — typical APRs run from about 10% for excellent credit to around
 * 30% for poor credit. The spreads below are typical market ranges around the
 * average rate, not any lender's pricing; the UI labels the result an estimate.
 */

export const LOAN_PURPOSES = [
  'debt-consolidation',
  'home-improvement',
  'major-purchase',
  'medical',
  'car-repair',
  'other',
] as const
export type LoanPurpose = (typeof LOAN_PURPOSES)[number]

const BAND_SPREAD: Record<CreditBand, number> = {
  '760+': -0.02,
  '700-759': 0,
  '660-699': 0.04,
  '620-659': 0.08,
  '580-619': 0.13,
  '<580': 0.18,
}

/** The estimated APR for a personal loan: the market average, adjusted for credit when known. */
export function estimatePersonalLoanRate(benchmarks: CountryBenchmarks, creditBand: CreditBand | null | undefined): number {
  const spread = creditBand ? BAND_SPREAD[creditBand] : 0
  return Math.round((benchmarks.personalLoan + spread) * 100_000) / 100_000
}
