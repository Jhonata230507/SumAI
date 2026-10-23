import { z } from 'zod'
import { CREDIT_BANDS } from '@/features/calculators/mortgage/us'
import { VEHICLE_CONDITIONS } from './us'
import {
  countryCode,
  nonNegativeAmount,
  positiveAmount,
  rate,
  termMonths,
} from '@/lib/validation/common'

export const carLoanSchema = z.object({
  vehiclePrice: positiveAmount,
  downPayment: nonNegativeAmount.default(0),
  tradeInValue: nonNegativeAmount.default(0),
  tradeInOwed: nonNegativeAmount.default(0),
  salesTaxRate: rate.default(0.07),
  feesAndRegistration: nonNegativeAmount.default(0),
  annualRate: rate,
  termMonths: termMonths.max(96, 'carTermMax'),
  countryCode: countryCode.default('us'),
  // US only, all optional: they sharpen the rate, tax and fee estimates and eligibility.
  zip: z.string().optional(),
  condition: z.enum(VEHICLE_CONDITIONS).nullable().optional(),
  creditBand: z.enum(CREDIT_BANDS).nullable().optional(),
  annualIncome: nonNegativeAmount.optional(),
  monthlyDebts: nonNegativeAmount.optional(),
})

export type CarLoanSchema = z.infer<typeof carLoanSchema>

export const carLoanDefaults: CarLoanSchema = {
  vehiclePrice: 32_000,
  downPayment: 4_000,
  tradeInValue: 0,
  tradeInOwed: 0,
  salesTaxRate: 0.07,
  feesAndRegistration: 600,
  annualRate: 0.072,
  termMonths: 60,
  countryCode: 'us',
}
