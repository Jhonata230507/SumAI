import type { FinancialRules } from '@/types/country'

/**
 * US lending conventions.
 * Rates are quoted nominal annual, compounded monthly, so a 6% quote is 0.5%/month.
 */
export const usaRules: FinancialRules = {
  // Conventional loans go lower, but 20% is the threshold that avoids PMI.
  minDownPaymentRatio: 0.2,
  // The qualified-mortgage back-end DTI ceiling.
  maxDebtToIncome: 0.43,
  quotesEffectiveAnnualRate: false,
  // FICO scale.
  creditScoreRange: { min: 300, max: 850 },
  commonLoanTermsMonths: [180, 240, 360],
  rateCeiling: null,
  consumerRatesEffective: false,
}
