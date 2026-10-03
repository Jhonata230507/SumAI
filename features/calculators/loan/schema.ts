import { z } from 'zod'
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
