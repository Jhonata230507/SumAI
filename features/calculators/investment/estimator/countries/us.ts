import { getBenchmarks } from '@/lib/countries'
import type { InvestmentCountryConfig } from '../config'

/** United States investing. */
export const US_INVESTMENT: InvestmentCountryConfig = {
  country: 'us',
  currency: 'USD',
  locale: 'en-US',
  frequencies: ['weekly', 'biweekly', 'monthly', 'annually'],
  defaultFrequency: 'monthly',
  accountTypes: ['unspecified', 'taxable', 'deferred', 'free'],
  years: { min: 1, max: 60, example: 25 },

  // --- ESTIMATES: placeholders, to be replaced with sourced data ---------------
  estimates: {
    // A long-run average for a diversified stock and bond mix.
    annualReturn: 0.07,
    inflation: getBenchmarks('us').inflation,
    taxRate: {
      // The most common long-term capital-gains rate.
      taxable: 0.15,
      // A common federal bracket in retirement, on withdrawals.
      deferred: 0.22,
    },
  },
  // -----------------------------------------------------------------------------

  rangeBand: 0.03,
  example: { initialAmount: 10_000, contribution: 500, years: 25, targetAmount: 1_000_000 },
}
