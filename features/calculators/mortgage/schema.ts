import { z } from 'zod'
import { CREDIT_BANDS, LOAN_TYPES } from './us'
import {
  countryCode,
  nonNegativeAmount,
  positiveAmount,
  rate,
  termMonths,
} from '@/lib/validation/common'

export const mortgageSchema = z
  .object({
    homePrice: positiveAmount,
    downPayment: nonNegativeAmount,
    annualRate: rate,
    termMonths,
    propertyTaxAnnual: nonNegativeAmount.default(0),
    homeInsuranceAnnual: nonNegativeAmount.default(0),
    hoaMonthly: nonNegativeAmount.default(0),
    mortgageInsuranceRate: rate.default(0.0055),
    extraPayment: nonNegativeAmount.default(0),
    countryCode: countryCode.default('us'),
    loanType: z.enum(LOAN_TYPES).optional(),
    creditBand: z.enum(CREDIT_BANDS).nullable().optional(),
    zip: z.string().optional(),
    annualIncome: nonNegativeAmount.optional(),
    monthlyDebts: nonNegativeAmount.optional(),
  })
  .refine((v) => v.downPayment < v.homePrice, {
    message: 'downPaymentBelowPrice',
    path: ['downPayment'],
  })

export type MortgageSchema = z.infer<typeof mortgageSchema>

export const mortgageDefaults: MortgageSchema = {
  homePrice: 420_000,
  downPayment: 84_000,
  annualRate: 0.0665,
  termMonths: 360,
  propertyTaxAnnual: 4_800,
  homeInsuranceAnnual: 1_600,
  hoaMonthly: 0,
  mortgageInsuranceRate: 0.0055,
  extraPayment: 0,
  countryCode: 'us',
}

export const affordabilitySchema = z.object({
  monthlyIncome: positiveAmount,
  monthlyDebts: nonNegativeAmount.default(0),
  downPayment: nonNegativeAmount.default(0),
  annualRate: rate,
  termMonths,
  countryCode: countryCode.default('us'),
})

export type AffordabilitySchema = z.infer<typeof affordabilitySchema>
