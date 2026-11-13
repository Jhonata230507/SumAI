import { getBenchmarks } from '@/lib/countries'
import type { SavingsCountryConfig } from '../config'

const market = getBenchmarks('us')

/** United States savings. Banks advertise APY, so the rate opens as one. */
export const US_SAVINGS: SavingsCountryConfig = {
  country: 'us',
  currency: 'USD',
  locale: 'en-US',
  frequencies: ['weekly', 'biweekly', 'monthly', 'annually'],
  defaultFrequency: 'monthly',
  defaultBasis: 'apy',
  compounding: [365, 12, 4, 1],
  defaultCompounding: 12,
  duration: { minMonths: 1, maxMonths: 600, exampleMonths: 36 },
  maxYearsToGoal: 100,

  // --- ESTIMATES: placeholders, to be replaced with sourced data ---------------
  estimates: {
    // A typical high-yield savings APY.
    apy: market.savingsHighYield,
    inflation: market.inflation,
  },
  // -----------------------------------------------------------------------------
}
