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
  years: z.number().int().min(1, 'yearsMin').max(60, 'yearsMax'),
  feeRate: rate.default(0),
  inflationRate: rate.default(0.03),
  contributionGrowth: rate.default(0),
  countryCode: countryCode.default('us'),
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
