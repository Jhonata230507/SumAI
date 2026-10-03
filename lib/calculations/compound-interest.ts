import { roundMoney } from './rounding'

export interface GrowthPoint {
  period: number
  contributions: number
  interest: number
  balance: number
}

export interface GrowthSeries {
  points: GrowthPoint[]
  finalBalance: number
  totalContributed: number
  totalInterest: number
}

/** Future value of a lump sum. `periodicRate` is a fraction per period. */
export function futureValue(present: number, periodicRate: number, periods: number): number {
  return roundMoney(present * (1 + periodicRate) ** periods)
}

/** Present value of a future lump sum. */
export function presentValue(future: number, periodicRate: number, periods: number): number {
  return roundMoney(future / (1 + periodicRate) ** periods)
}

/**
 * Future value of a level contribution stream.
 * `timing` matters more than people expect: contributing at the start of each
 * period earns one extra period of interest on every deposit.
 */
export function futureValueOfSeries(
  contribution: number,
  periodicRate: number,
  periods: number,
  timing: 'begin' | 'end' = 'end',
): number {
  if (periodicRate === 0) return roundMoney(contribution * periods)
  const base = (contribution * ((1 + periodicRate) ** periods - 1)) / periodicRate
  return roundMoney(timing === 'begin' ? base * (1 + periodicRate) : base)
}

/** Period-by-period growth, used to drive the growth charts. */
export function buildGrowthSeries(options: {
  initial: number
  contribution: number
  periodicRate: number
  periods: number
  timing?: 'begin' | 'end'
  /** Fractional raise applied to the contribution once per `periodsPerYear`. */
  contributionGrowth?: number
  periodsPerYear?: number
}): GrowthSeries {
  const {
    initial,
    contribution,
    periodicRate,
    periods,
    timing = 'end',
    contributionGrowth = 0,
    periodsPerYear = 12,
  } = options

  const points: GrowthPoint[] = []
  let balance = initial
  let contributed = initial
  let interestTotal = 0
  let current = contribution

  for (let period = 1; period <= periods; period += 1) {
    if (contributionGrowth > 0 && period > 1 && (period - 1) % periodsPerYear === 0) {
      current = current * (1 + contributionGrowth)
    }

    if (timing === 'begin') balance += current
    const interest = balance * periodicRate
    balance += interest
    if (timing === 'end') balance += current

    contributed += current
    interestTotal += interest

    points.push({
      period,
      contributions: roundMoney(contributed),
      interest: roundMoney(interestTotal),
      balance: roundMoney(balance),
    })
  }

  return {
    points,
    finalBalance: roundMoney(balance),
    totalContributed: roundMoney(contributed),
    totalInterest: roundMoney(interestTotal),
  }
}

/** Contribution needed to reach `target`. Answers the goal calculators. */
export function requiredContribution(
  target: number,
  initial: number,
  periodicRate: number,
  periods: number,
): number {
  const fromInitial = futureValue(initial, periodicRate, periods)
  const gap = target - fromInitial
  if (gap <= 0) return 0
  if (periodicRate === 0) return roundMoney(gap / periods)
  return roundMoney((gap * periodicRate) / ((1 + periodicRate) ** periods - 1))
}

/** Periods required to grow `initial` to `target` at a level contribution. */
export function periodsToTarget(
  target: number,
  initial: number,
  contribution: number,
  periodicRate: number,
  maxPeriods = 1200,
): number {
  let balance = initial
  for (let period = 1; period <= maxPeriods; period += 1) {
    balance = balance * (1 + periodicRate) + contribution
    if (balance >= target) return period
  }
  return Infinity
}
