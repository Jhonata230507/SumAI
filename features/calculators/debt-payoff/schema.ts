import { z } from 'zod'
import { countryCode, nonNegativeAmount, positiveAmount, rate } from '@/lib/validation/common'

export const debtSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'debtName').max(60),
  balance: positiveAmount,
  annualRate: rate,
  minimumPayment: nonNegativeAmount,
})

export const debtPayoffSchema = z
  .object({
    debts: z.array(debtSchema).min(1, 'debtsMin').max(20),
    monthlyBudget: positiveAmount,
    strategy: z.enum(['avalanche', 'snowball', 'as-listed']).default('avalanche'),
    countryCode: countryCode.default('us'),
  })
  .refine(
    (v) => v.monthlyBudget >= v.debts.reduce((sum, d) => sum + d.minimumPayment, 0),
    {
      message: 'budgetCoversMinimums',
      path: ['monthlyBudget'],
    },
  )

export type DebtSchema = z.infer<typeof debtSchema>
export type DebtPayoffSchema = z.infer<typeof debtPayoffSchema>

export const debtPayoffDefaults: DebtPayoffSchema = {
  debts: [
    { id: 'card-1', name: 'Credit card', balance: 6_400, annualRate: 0.2299, minimumPayment: 160 },
    { id: 'card-2', name: 'Store card', balance: 1_800, annualRate: 0.2699, minimumPayment: 55 },
    { id: 'student', name: 'Student loan', balance: 14_000, annualRate: 0.055, minimumPayment: 180 },
  ],
  monthlyBudget: 650,
  strategy: 'avalanche',
  countryCode: 'us',
}
