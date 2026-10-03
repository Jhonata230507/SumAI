import type { FinancialRules } from '@/types/country'

/**
 * Canadian lending conventions.
 * Fixed-rate mortgages are compounded semi-annually by law, which makes the
 * effective rate slightly lower than the same nominal quote in the US. Treating
 * the quote as effective-annual is the closer approximation of the two.
 */
export const canadaRules: FinancialRules = {
  minDownPaymentRatio: 0.05,
  // CMHC gross/total debt service ceiling.
  maxDebtToIncome: 0.44,
  quotesEffectiveAnnualRate: true,
  creditScoreRange: { min: 300, max: 900 },
  commonLoanTermsMonths: [180, 240, 300, 360],
  rateCeiling: 0.35,
  // Savings and cards are quoted nominal, unlike the mortgage approximation above.
  consumerRatesEffective: false,
}
