import { z } from 'zod'
import { CALCULATOR_IDS } from '@/types/common'

/**
 * Messages are keys into the `validation` section of the i18n dictionaries
 * (lib/i18n), so the same schema reports errors in the visitor's language.
 *
 * Shared field schemas. Every calculator schema composes these so an invalid
 * rate or term is rejected identically on the client and in the route handler.
 */

export const currencyCode = z.enum(['USD', 'COP', 'CAD'])
export const countryCode = z.enum(['co', 'us', 'ca'])
export const calculatorId = z.enum(CALCULATOR_IDS)

export const positiveAmount = z
  .number({ invalid_type_error: 'enterAmount' })
  .positive('amountPositive')
  .finite()

export const nonNegativeAmount = z
  .number({ invalid_type_error: 'enterAmount' })
  .min(0, 'amountNegative')
  .finite()

/** Rates are fractions: 0.0725 is 7.25%. Capped at 100% to catch unit mistakes. */
export const rate = z
  .number({ invalid_type_error: 'enterRate' })
  .min(0, 'rateNegative')
  .max(1, 'rateAsPercent')

export const termMonths = z
  .number({ invalid_type_error: 'enterTerm' })
  .int('termWhole')
  .min(1, 'termMin')
  .max(600, 'termMax')

export const paymentFrequency = z.enum(['weekly', 'biweekly', 'monthly', 'annually'])

export const creditScore = z.number().int().min(150).max(950).nullable()

export const percentageRatio = z.number().min(0).max(1)

export type CurrencyCodeInput = z.infer<typeof currencyCode>
export type CountryCodeInput = z.infer<typeof countryCode>

/** Turns a ZodError into the flat shape the forms render. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(
    error.issues.map((issue) => [issue.path.join('.') || '_form', issue.message]),
  )
}
