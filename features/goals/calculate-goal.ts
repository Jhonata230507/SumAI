import {
  buildGrowthSeries,
  periodsToTarget,
  requiredContribution,
} from '@/lib/calculations/compound-interest'
import { nominalToPeriodic } from '@/lib/calculations/interest'
import { roundMoney, roundTo } from '@/lib/calculations/rounding'
import { monthsBetween, periodToDate, todayISO } from '@/lib/utils/dates'
import type { GoalInput, GoalProjection } from './types'

const MONTHS_PER_YEAR = 12

/**
 * Projects a goal forward from where the user is today.
 *
 * With a target date set, the useful answer is the contribution needed to hit
 * it. Without one, the useful answer is when the current contribution gets
 * there. Both paths are computed so the UI can show whichever applies.
 */
export function calculateGoal(input: GoalInput): GoalProjection {
  const periodicRate = nominalToPeriodic(input.annualReturn, MONTHS_PER_YEAR)
  const contribution = input.monthlyContribution ?? 0
  const progress = roundTo(Math.min(1, input.currentAmount / Math.max(input.targetAmount, 1)), 4)

  const monthsToDate = input.targetDate ? monthsBetween(todayISO(), input.targetDate) : null

  const requiredMonthly =
    monthsToDate && monthsToDate > 0
      ? requiredContribution(input.targetAmount, input.currentAmount, periodicRate, monthsToDate)
      : null

  const monthsAtCurrent = periodsToTarget(
    input.targetAmount,
    input.currentAmount,
    contribution,
    periodicRate,
  )

  const horizon = monthsToDate ?? (Number.isFinite(monthsAtCurrent) ? monthsAtCurrent : 360)

  const series = buildGrowthSeries({
    initial: input.currentAmount,
    contribution,
    periodicRate,
    periods: Math.max(1, horizon),
    periodsPerYear: MONTHS_PER_YEAR,
  })

  const projectedDate = Number.isFinite(monthsAtCurrent)
    ? periodToDate(new Date(), monthsAtCurrent).toISOString().slice(0, 10)
    : null

  return {
    progress,
    monthsRemaining: Number.isFinite(monthsAtCurrent) ? monthsAtCurrent : null,
    projectedDate,
    requiredMonthly,
    contributionGap: requiredMonthly === null ? null : roundMoney(requiredMonthly - contribution),
    onTrack:
      monthsToDate === null
        ? Number.isFinite(monthsAtCurrent)
        : Number.isFinite(monthsAtCurrent) && monthsAtCurrent <= monthsToDate,
    projectedBalance: series.finalBalance,
    points: series.points.map((p) => ({
      month: p.period,
      balance: p.balance,
      target: input.targetAmount,
    })),
    series,
  }
}
