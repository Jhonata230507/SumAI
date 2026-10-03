import { z } from 'zod'
import {
  countryCode,
  nonNegativeAmount,
  paymentFrequency,
  rate,
  termMonths,
} from '@/lib/validation/common'

export const savingsSchema = z
  .object({
    mode: z.enum(['project', 'target']).default('project'),
    initialAmount: nonNegativeAmount.default(0),
    deposit: nonNegativeAmount.default(0),
    depositFrequency: paymentFrequency.default('monthly'),
    annualRate: rate,
    compoundsPerYear: z.number().int().positive().default(12),
    months: termMonths,
    targetAmount: nonNegativeAmount.nullable().default(null),
    countryCode: countryCode.default('us'),
  })
  .refine((v) => v.mode !== 'target' || (v.targetAmount ?? 0) > 0, {
    message: 'targetRequired',
    path: ['targetAmount'],
  })

export type SavingsSchema = z.infer<typeof savingsSchema>

export const savingsDefaults: SavingsSchema = {
  mode: 'project',
  initialAmount: 2_000,
  deposit: 300,
  depositFrequency: 'monthly',
  annualRate: 0.042,
  compoundsPerYear: 12,
  months: 36,
  targetAmount: null,
  countryCode: 'us',
}
