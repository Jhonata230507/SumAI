import { getBenchmarks, getCountry } from '@/lib/countries'
import type { LoanCountryConfig } from '../config'

/**
 * Colombia: consumer loans (libre inversión), quoted E.A.
 *
 * ESTIMATES — review before launch:
 * - `average` is the illustrative benchmark in data/countries/colombia.json.
 * - The credit-history spreads are typical market ranges, not any lender's pricing.
 * - `usuryCap` is the tasa de usura in the country rules. The Superintendencia
 *   Financiera certifies it every month: keep lib/countries/colombia/financial-rules.ts current.
 */
export const colombiaLoan: LoanCountryConfig = {
  currency: 'COP',
  locale: 'es-CO',
  term: { minMonths: 6, maxMonths: 120, exampleMonths: 36 },
  rates: {
    average: getBenchmarks('co').personalLoan,
    spreadByHistory: { excellent: -0.05, good: 0, fair: 0.03, low: 0.05 },
    usuryCap: getCountry('co').rules.rateCeiling ?? 1,
  },
  dtiGuideline: getCountry('co').rules.maxDebtToIncome,
  examples: {
    amount: 20_000_000,
    monthlyIncome: 4_500_000,
    monthlyDebts: 600_000,
    insuranceRate: 0.001,
    fees: 0,
  },
}
