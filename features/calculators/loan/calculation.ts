import { buildAmortizationSchedule } from '@/lib/calculations/amortization'
import { periodicToEffective, toPeriodicRate } from '@/lib/calculations/interest'
import { roundMoney, roundTo } from '@/lib/calculations/rounding'
import { getCountry } from '@/lib/countries'
import { FREQUENCY_PER_YEAR } from '@/types/common'
import type { LoanInput, LoanResult } from './types'

/**
 * The generic instalment-loan calculation every other loan calculator builds on.
 *
 * Two things drive correctness here: the payment frequency sets how many
 * periods exist in a year, and the country decides whether the quoted annual
 * rate is nominal or effective. Get either wrong and the payment is off.
 */
export function calculateLoan(input: LoanInput): LoanResult {
  const country = getCountry(input.countryCode)
  const periodsPerYear = FREQUENCY_PER_YEAR[input.frequency]
  const periods = Math.round((input.termMonths / 12) * periodsPerYear)

  const periodicRate = toPeriodicRate(
    input.annualRate,
    periodsPerYear,
    country.rules.quotesEffectiveAnnualRate,
  )

  const schedule = buildAmortizationSchedule({
    principal: input.amount,
    periodicRate,
    periods,
    extraPerPeriod: input.extraPayment,
  })

  const totalFees = roundMoney(input.originationFee)
  const totalPaid = roundMoney(schedule.totalPaid + totalFees)

  return {
    payment: schedule.payment,
    frequency: input.frequency,
    totalPaid,
    totalInterest: schedule.totalInterest,
    totalFees,
    costRatio: roundTo(totalPaid / input.amount, 4),
    payoffPeriods: schedule.periodsToPayoff,
    periodsSaved: schedule.periodsSaved,
    interestSaved: schedule.interestSaved,
    effectiveAnnualRate: periodicToEffective(periodicRate, periodsPerYear),
    currency: country.currency,
    schedule,
  }
}
