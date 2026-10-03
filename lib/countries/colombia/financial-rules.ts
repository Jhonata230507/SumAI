import type { FinancialRules } from '@/types/country'

/**
 * Colombian lending conventions.
 * Rates are quoted effective annual (E.A.), which is why every calculation for
 * this country must convert before deriving a monthly payment.
 */
export const colombiaRules: FinancialRules = {
  minDownPaymentRatio: 0.3,
  maxDebtToIncome: 0.4,
  quotesEffectiveAnnualRate: true,
  // Datacrédito scale.
  creditScoreRange: { min: 150, max: 950 },
  commonLoanTermsMonths: [60, 120, 180, 240],
  // Tasa de usura, reviewed quarterly by the Superintendencia Financiera.
  rateCeiling: 0.2854,
  // Savings accounts and credit cards are quoted E.A. too.
  consumerRatesEffective: true,
}
