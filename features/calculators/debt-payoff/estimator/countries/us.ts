import type { DebtPayoffCountryConfig } from '../config'

/** United States debt payoff. */
export const US_DEBT_PAYOFF: DebtPayoffCountryConfig = {
  country: 'us',
  currency: 'USD',
  locale: 'en-US',
  maxDebts: 10,
  maxYears: 50,
  // Illustrative debts for "Try an example"; names are translated by the page. The highest
  // rate is not the smallest balance, so avalanche and snowball take different paths.
  example: {
    debts: [
      { name: 'card', balance: 6_400, apr: 0.2699, minimum: 160 },
      { name: 'store', balance: 1_800, apr: 0.1899, minimum: 55 },
      { name: 'student', balance: 14_000, apr: 0.055, minimum: 180 },
    ],
    monthlyAmount: 650,
  },
}
