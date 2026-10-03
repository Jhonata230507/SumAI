import {
  buildGrowthSeries,
  periodsToTarget,
  requiredContribution,
} from '@/lib/calculations/compound-interest'
import { nominalToEffective } from '@/lib/calculations/interest'
import { getCountry } from '@/lib/countries'
import { FREQUENCY_PER_YEAR } from '@/types/common'
import type { SavingsInput, SavingsResult } from './types'

/**
 * Savings differs from investing in one structural way: the bank compounds on
 * its own schedule, which need not match how often the saver deposits. The
 * quoted rate is converted to the deposit period so both line up.
 */
export function calculateSavings(input: SavingsInput): SavingsResult {
  const country = getCountry(input.countryCode)
  const periodsPerYear = FREQUENCY_PER_YEAR[input.depositFrequency]
  const periods = Math.round((input.months / 12) * periodsPerYear)

  // Turn the quote into an effective annual yield. An E.A. quote (Colombia)
  // already is one; a nominal quote compounds on the bank's schedule.
  const effectiveAnnual = country.rules.consumerRatesEffective
    ? input.annualRate
    : nominalToEffective(input.annualRate, input.compoundsPerYear)
  const periodicRate = (1 + effectiveAnnual) ** (1 / periodsPerYear) - 1

  const series = buildGrowthSeries({
    initial: input.initialAmount,
    contribution: input.deposit,
    periodicRate,
    periods,
    periodsPerYear,
  })

  const target = input.targetAmount
  const solving = input.mode === 'target' && target !== null

  const requiredDeposit = solving
    ? requiredContribution(target, input.initialAmount, periodicRate, periods)
    : null

  const periodsNeeded = solving
    ? periodsToTarget(target, input.initialAmount, input.deposit, periodicRate)
    : null

  return {
    finalBalance: series.finalBalance,
    totalDeposited: series.totalContributed,
    totalInterest: series.totalInterest,
    effectiveAnnualYield: effectiveAnnual,
    requiredDeposit,
    monthsToTarget:
      periodsNeeded === null || !Number.isFinite(periodsNeeded)
        ? null
        : Math.ceil((periodsNeeded / periodsPerYear) * 12),
    reachesTarget: target !== null ? series.finalBalance >= target : true,
    currency: country.currency,
    series,
  }
}
