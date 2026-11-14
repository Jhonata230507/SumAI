import { getCountry } from '@/lib/countries'
import type { CarLoanCountryConfig } from '../config'

const rules = getCountry('co').rules

/**
 * Colombian vehicle loans. Rates are effective annual (E.A.) and vehicle prices
 * already include taxes, so there is no sales-tax field. Registration, transfer
 * and a year of all-risk insurance can be financed.
 */
export const CO_CAR_LOAN: CarLoanCountryConfig = {
  country: 'co',
  currency: 'COP',
  locale: 'es-CO',

  // --- ESTIMATES: placeholders, to be replaced with sourced data ---------------
  // E.A. by condition and credit history, around the benchmarks in
  // data/countries/colombia.json (16.49% new, 19.25% used). Shown as estimates.
  estimates: {
    apr: {
      new: { unknown: 0.165, excellent: 0.14, good: 0.16, fair: 0.19, poor: 0.22 },
      used: { unknown: 0.1925, excellent: 0.17, good: 0.19, fair: 0.22, poor: 0.25 },
    },
    salesTax: null,
  },
  // -----------------------------------------------------------------------------

  rateQuote: 'effectiveAnnual',
  incomePeriod: 'monthly',
  fullCoverageInsurance: true,
  extraPayments: true,
  // Asked as a history (no score ranges); the scores, on the Datacrédito scale, only rank lenders.
  creditBands: [
    { id: 'excellent', representativeScore: 850 },
    { id: 'good', representativeScore: 750 },
    { id: 'fair', representativeScore: 650 },
    { id: 'poor', representativeScore: 550 },
  ],
  term: { minMonths: 12, maxMonths: 96, exampleMonths: 60 },
  examples: { price: 90_000_000, budget: 1_800_000, insurance: 3_000_000, income: 5_000_000, debts: 600_000 },
  dtiThresholds: { comfortable: 0.3, upper: rules.maxDebtToIncome },
}
