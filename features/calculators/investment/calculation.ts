import { buildGrowthSeries } from '@/lib/calculations/compound-interest'
import { nominalToPeriodic } from '@/lib/calculations/interest'
import { roundMoney, roundTo } from '@/lib/calculations/rounding'
import { getCountry } from '@/lib/countries'
import { FREQUENCY_PER_YEAR } from '@/types/common'
import type { InvestmentInput, InvestmentResult } from './types'

/** How far the optimistic and pessimistic bands sit from the expected return. */
const RETURN_BAND = 0.03

/**
 * Projects a contribution plan forward.
 *
 * Two deliberate choices: fees are netted off the return rather than charged as
 * a separate line, which is how expense ratios actually work; and the result
 * carries a real (inflation-adjusted) figure, because a 25-year nominal number
 * on its own badly overstates what the money will buy.
 */
export function calculateInvestment(input: InvestmentInput): InvestmentResult {
  const country = getCountry(input.countryCode)
  const periodsPerYear = FREQUENCY_PER_YEAR[input.contributionFrequency]
  const periods = input.years * periodsPerYear

  const netAnnualReturn = input.annualReturn - input.feeRate
  const periodicRate = nominalToPeriodic(netAnnualReturn, periodsPerYear)

  const series = buildGrowthSeries({
    initial: input.initialAmount,
    contribution: input.contribution,
    periodicRate,
    periods,
    periodsPerYear,
    contributionGrowth: input.contributionGrowth,
  })

  // Fees are the gap between the gross and net projections.
  const gross = buildGrowthSeries({
    initial: input.initialAmount,
    contribution: input.contribution,
    periodicRate: nominalToPeriodic(input.annualReturn, periodsPerYear),
    periods,
    periodsPerYear,
    contributionGrowth: input.contributionGrowth,
  })

  return {
    finalBalance: series.finalBalance,
    realBalance: roundMoney(series.finalBalance / (1 + input.inflationRate) ** input.years),
    totalContributed: series.totalContributed,
    totalGrowth: series.totalInterest,
    totalFees: roundMoney(gross.finalBalance - series.finalBalance),
    multiple: roundTo(series.finalBalance / Math.max(series.totalContributed, 1), 2),
    currency: country.currency,
    series,
    range: {
      pessimistic: projectAt(input, netAnnualReturn - RETURN_BAND, periodsPerYear, periods),
      expected: series.finalBalance,
      optimistic: projectAt(input, netAnnualReturn + RETURN_BAND, periodsPerYear, periods),
    },
  }
}

function projectAt(
  input: InvestmentInput,
  annualReturn: number,
  periodsPerYear: number,
  periods: number,
): number {
  return buildGrowthSeries({
    initial: input.initialAmount,
    contribution: input.contribution,
    periodicRate: nominalToPeriodic(Math.max(0, annualReturn), periodsPerYear),
    periods,
    periodsPerYear,
    contributionGrowth: input.contributionGrowth,
  }).finalBalance
}

/** Years for the balance to double at a given return. The rule of 72, done properly. */
export function yearsToDouble(annualReturn: number): number {
  if (annualReturn <= 0) return Infinity
  return roundTo(Math.log(2) / Math.log(1 + annualReturn), 1)
}
