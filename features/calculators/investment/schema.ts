import { z } from 'zod'
import {
  countryCode,
  nonNegativeAmount,
  paymentFrequency,
  rate,
} from '@/lib/validation/common'

export const investmentSchema = z.object({
  initialAmount: nonNegativeAmount.default(0),
  contribution: nonNegativeAmount.default(0),
  contributionFrequency: paymentFrequency.default('monthly'),
  annualReturn: rate,
  // In years; Colombia types the duration in months too, so whole months (1/12 of a year) are allowed.
  years: z
    .number()
    .min(1 / 12 - 1e-9, 'termMin')
    .max(60, 'yearsMax')
    .refine((years) => Math.abs(years * 12 - Math.round(years * 12)) < 1e-6, 'termWhole'),
  feeRate: rate.default(0),
  inflationRate: rate.default(0.03),
  contributionGrowth: rate.default(0),
  countryCode: countryCode.default('us'),
  /** US: tax on the gains when the money is withdrawn, for the after-tax balance. */
  taxRate: rate.optional(),
})

export type InvestmentSchema = z.infer<typeof investmentSchema>

export const investmentDefaults: InvestmentSchema = {
  initialAmount: 10_000,
  contribution: 500,
  contributionFrequency: 'monthly',
  annualReturn: 0.07,
  years: 25,
  feeRate: 0.003,
  inflationRate: 0.03,
  contributionGrowth: 0,
  countryCode: 'us',
}
