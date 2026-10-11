import { z } from 'zod'
import { CREDIT_BANDS } from '@/features/calculators/mortgage/us'
import { LOAN_PURPOSES } from './us'
import {
  countryCode,
  nonNegativeAmount,
  paymentFrequency,
  positiveAmount,
  rate,
  termMonths,
} from '@/lib/validation/common'

export const loanSchema = z.object({
  amount: positiveAmount,
  annualRate: rate,
  termMonths,
  frequency: paymentFrequency.default('monthly'),
  extraPayment: nonNegativeAmount.default(0),
  originationFee: nonNegativeAmount.default(0),
  countryCode: countryCode.default('us'),
  // US only, all optional: they sharpen the rate estimate, eligibility and the explanation.
  annualIncome: nonNegativeAmount.optional(),
  monthlyDebts: nonNegativeAmount.optional(),
  creditBand: z.enum(CREDIT_BANDS).nullable().optional(),
  purpose: z.enum(LOAN_PURPOSES).nullable().optional(),
})

export type LoanSchema = z.infer<typeof loanSchema>

export const loanDefaults: LoanSchema = {
  amount: 25_000,
  annualRate: 0.089,
  termMonths: 60,
  frequency: 'monthly',
  extraPayment: 0,
  originationFee: 0,
  countryCode: 'us',
}
