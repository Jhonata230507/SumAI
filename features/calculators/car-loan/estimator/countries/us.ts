import type { CarLoanCountryConfig } from '../config'

/** United States car loans. */
export const US_CAR_LOAN: CarLoanCountryConfig = {
  country: 'us',
  currency: 'USD',
  locale: 'en-US',

  // --- ESTIMATES: placeholders, to be replaced with sourced data ---------------
  // Shown to users as estimates whenever a field is left empty.
  estimates: {
    apr: {
      new: { unknown: 0.075, excellent: 0.065, good: 0.08, fair: 0.11, poor: 0.14 },
      used: { unknown: 0.1, excellent: 0.085, good: 0.11, fair: 0.15, poor: 0.19 },
    },
    salesTax: 0.06,
  },
  // -----------------------------------------------------------------------------

  rateQuote: 'apr',
  incomePeriod: 'annual',
  fullCoverageInsurance: false,
  extraPayments: false,
  creditBands: [
    { id: 'excellent', min: 720, representativeScore: 750 },
    { id: 'good', min: 690, max: 719, representativeScore: 705 },
    { id: 'fair', min: 630, max: 689, representativeScore: 660 },
    { id: 'poor', max: 629, representativeScore: 600 },
  ],
  term: { minMonths: 12, maxMonths: 96, exampleMonths: 60 },
  examples: { price: 30_000, budget: 500, insurance: 1_500, income: 60_000, debts: 400 },
  dtiThresholds: { comfortable: 0.36, upper: 0.43 },
}
