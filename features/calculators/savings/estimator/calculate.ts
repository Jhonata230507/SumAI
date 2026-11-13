import type { GrowthPoint } from '@/lib/calculations/compound-interest'
import { PERIODS_PER_YEAR, type RateBasis, type SavingsCountryConfig, type SavingsFrequency } from './config'

/**
 * The savings estimator: the contribution a goal takes, the time it takes, or
 * the balance a plan reaches. Pure: numbers in, numbers out, no rounding (that
 * is for display), no UI. Defaults come from the country config.
 *
 *   i  = (1 + y)^(1/m) − 1                from an APY y, m contributions a year
 *   i  = (1 + r/k)^(k/m) − 1              from an APR r compounded k times a year
 *        (the rate is first reduced by the tax on interest: rate × (1 − tax))
 *   FV = P(1 + i)^N + c((1 + i)^N − 1)/i  (P + cN at i = 0), contributions at period end
 *   c  = (G − P(1 + i)^N) i / ((1 + i)^N − 1)
 *   N  = ln((G i + c)/(P i + c)) / ln(1 + i), up to the next full period
 */

export type SavingsMode = 'contribution' | 'time' | 'balance'

export interface YearMonth {
  year: number
  month: number
}

export interface SavingsEstimateInput {
  mode: SavingsMode
  /** Optional; empty is starting from zero. */
  initialBalance: number | null
  /** Required to find the contribution or the time; optional when finding the balance. */
  goal: number | null
  /** Per period. Ignored when finding the contribution (it is the answer). */
  contribution: number | null
  frequency: SavingsFrequency
  /** Required except when finding the time (it is the answer). */
  durationMonths: number | null
  /** Null: the config's estimated APY. */
  rate: number | null
  basis: RateBasis
  /** Times a year an APR compounds; ignored for an APY. */
  compoundsPerYear: number
  /** Null: the config's estimate. */
  inflationRate: number | null
  /** The goal is in today's dollars: raise it by inflation to the end date. */
  goalInTodaysDollars: boolean
  /** Tax on interest, as ordinary income; null is none. */
  taxRate: number | null
  /** Month of the start, for real dates. */
  startDate: YearMonth | null
}

export interface SavingsFigures {
  mode: SavingsMode
  /** Per period: typed, or worked out when finding the contribution. */
  contribution: number
  periods: number
  /** The plan's length in months (rounded up to a whole month). */
  months: number
  finalBalance: number
  /** The initial balance plus every contribution. */
  totalDeposited: number
  /** Interest after the tax on interest. */
  interestEarned: number
  /** The final balance in today's money. */
  realBalance: number
  /** The goal as typed, and the goal the plan aims at (raised by inflation when it is in today's dollars). */
  goal: number | null
  goalTarget: number | null
  /** The goal in today's money, when it was typed in future dollars. */
  goalToday: number | null
  /** With a goal: whether the plan reaches it, and by how much it misses or clears it. */
  onTrack: boolean | null
  gap: number
  /** Finding the balance, short of a goal: how many months the same plan would take. */
  monthsToGoal: number | null
  /** The initial balance alone reaches the goal: with its growth when finding the contribution, as it is when finding the time. */
  alreadyThere: boolean
  /** The month the plan ends (or reaches the goal), with a start date. */
  endDate: YearMonth | null
  points: GrowthPoint[]
}

export interface SavingsEstimate {
  rate: number
  rateEstimated: boolean
  inflationRate: number
  inflationEstimated: boolean
  /** The yield after compounding and tax, per year. */
  netYield: number
  /** The goal cannot be reached: no contribution and no growth, or inflation outpacing it. */
  unreachable: boolean
  figures: SavingsFigures | null
}

/** The rate per contribution period, after the tax on interest. */
export function periodicRate(input: Pick<SavingsEstimateInput, 'basis' | 'compoundsPerYear' | 'taxRate' | 'frequency'>, rate: number) {
  const net = rate * (1 - amount(input.taxRate ?? 0))
  const m = PERIODS_PER_YEAR[input.frequency]
  if (input.basis === 'apy') return (1 + net) ** (1 / m) - 1
  const k = Math.max(1, input.compoundsPerYear)
  return (1 + net / k) ** (k / m) - 1
}

export function futureValue(initial: number, contribution: number, i: number, periods: number) {
  if (i === 0) return initial + contribution * periods
  const growth = (1 + i) ** periods
  return initial * growth + (contribution * (growth - 1)) / i
}

/** The contribution a period that reaches `goal` in `periods`; 0 when the initial balance already does. */
export function requiredContribution(goal: number, initial: number, i: number, periods: number) {
  if (periods <= 0) return Infinity
  if (i === 0) return Math.max(0, (goal - initial) / periods)
  const growth = (1 + i) ** periods
  const gap = goal - initial * growth
  return gap <= 0 ? 0 : (gap * i) / (growth - 1)
}

/** Full periods to reach `goal`; Infinity when it never gets there. */
export function periodsToGoal(goal: number, initial: number, contribution: number, i: number) {
  if (initial >= goal) return 0
  if (i === 0) return contribution > 0 ? Math.ceil((goal - initial) / contribution - 1e-9) : Infinity
  const base = initial * i + contribution
  if (base <= 0) return Infinity
  return Math.max(0, Math.ceil(Math.log((goal * i + contribution) / base) / Math.log(1 + i) - 1e-9))
}

export function addMonths(start: YearMonth, months: number): YearMonth {
  const index = start.year * 12 + (start.month - 1) + months
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

export function estimateSavings(config: SavingsCountryConfig, input: SavingsEstimateInput): SavingsEstimate {
  const rate = isSet(input.rate) ? input.rate : config.estimates.apy
  const inflation = isSet(input.inflationRate) ? input.inflationRate : config.estimates.inflation
  // Without a typed rate the estimate is an APY, whatever the field's basis.
  const rateInput = isSet(input.rate) ? input : { ...input, basis: 'apy' as const }
  const i = periodicRate(rateInput, rate)
  const m = PERIODS_PER_YEAR[input.frequency]
  const base = {
    rate,
    rateEstimated: !isSet(input.rate),
    inflationRate: inflation,
    inflationEstimated: !isSet(input.inflationRate),
    netYield: (1 + i) ** m - 1,
  }
  const none = { ...base, unreachable: false, figures: null }

  const initial = amount(input.initialBalance ?? 0)
  const goal = isSet(input.goal) && input.goal > 0 ? input.goal : null
  const inflate = (value: number, years: number) => (input.goalInTodaysDollars ? value * (1 + inflation) ** years : value)
  const durationPeriods = isSet(input.durationMonths) && input.durationMonths > 0 ? Math.round((input.durationMonths / 12) * m) : null

  let contribution = amount(input.contribution ?? 0)
  let periods: number
  let goalTarget: number | null = null

  if (input.mode === 'contribution') {
    if (goal === null || durationPeriods === null || durationPeriods <= 0) return none
    periods = durationPeriods
    goalTarget = inflate(goal, periods / m)
    contribution = requiredContribution(goalTarget, initial, i, periods)
  } else if (input.mode === 'time') {
    if (goal === null) return none
    // A goal in today's dollars grows with the time it takes, so the time and the
    // inflated goal are solved together, until the two agree.
    const cap = config.maxYearsToGoal * m
    let n = periodsToGoal(goal, initial, contribution, i)
    for (let pass = 0; pass < 200 && input.goalInTodaysDollars && Number.isFinite(n) && n <= cap; pass++) {
      const next = periodsToGoal(inflate(goal, n / m), initial, contribution, i)
      if (next === n) break
      n = next
    }
    if (!Number.isFinite(n) || n > cap) return { ...base, unreachable: true, figures: null }
    periods = n
    goalTarget = inflate(goal, periods / m)
  } else {
    if (durationPeriods === null || durationPeriods <= 0) return none
    if (initial <= 0 && contribution <= 0) return none
    periods = durationPeriods
    goalTarget = goal === null ? null : inflate(goal, periods / m)
  }

  const years = periods / m
  const months = Math.ceil(years * 12 - 1e-9)
  const series = simulate(initial, contribution, i, periods)
  const finalBalance = futureValue(initial, contribution, i, periods)
  const onTrack = goalTarget === null ? null : finalBalance >= goalTarget - 1e-6
  const atPace =
    input.mode === 'balance' && goalTarget !== null && !onTrack ? periodsToGoal(goalTarget, initial, contribution, i) : null

  return {
    ...base,
    unreachable: false,
    figures: {
      mode: input.mode,
      contribution,
      periods,
      months,
      finalBalance,
      totalDeposited: initial + contribution * periods,
      interestEarned: finalBalance - initial - contribution * periods,
      realBalance: finalBalance / (1 + inflation) ** years,
      goal,
      goalTarget,
      goalToday: goal !== null && !input.goalInTodaysDollars ? goal / (1 + inflation) ** years : null,
      onTrack,
      gap: goalTarget === null ? 0 : finalBalance - goalTarget,
      monthsToGoal: atPace !== null && Number.isFinite(atPace) ? Math.ceil((atPace * 12) / m - 1e-9) : null,
      alreadyThere:
        goalTarget !== null && (input.mode === 'contribution' ? contribution === 0 : initial >= goalTarget),
      endDate: input.startDate ? addMonths(input.startDate, months) : null,
      points: series,
    },
  }
}

function simulate(initial: number, contribution: number, i: number, periods: number): GrowthPoint[] {
  const points: GrowthPoint[] = []
  let balance = initial
  let deposited = initial
  for (let period = 1; period <= periods; period++) {
    balance = balance * (1 + i) + contribution
    deposited += contribution
    points.push({ period, contributions: deposited, interest: balance - deposited, balance })
  }
  return points
}

function isSet(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value) && value >= 0
}

function amount(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}
