import { describe, expect, it } from 'vitest'
import {
  addMonths,
  estimateSavings,
  futureValue,
  periodicRate,
  periodsToGoal,
  requiredContribution,
  type SavingsEstimateInput,
} from '../calculate'
import { getSavingsConfig } from '../config'

const us = getSavingsConfig('us')!

const base: SavingsEstimateInput = {
  mode: 'balance',
  initialBalance: 2_000,
  goal: null,
  contribution: 300,
  frequency: 'monthly',
  durationMonths: 36,
  rate: 0.042,
  basis: 'apy',
  compoundsPerYear: 12,
  inflationRate: 0.03,
  goalInTodaysDollars: false,
  taxRate: null,
  startDate: null,
}

const run = (input: Partial<SavingsEstimateInput>) => estimateSavings(us, { ...base, ...input })
const figuresOf = (input: Partial<SavingsEstimateInput>) => run(input).figures!

describe('the per-period rate', () => {
  it('turns an APY into the contribution period: (1 + y)^(1/m) − 1', () => {
    expect(periodicRate(base, 0.042)).toBeCloseTo(1.042 ** (1 / 12) - 1, 12)
  })

  it('compounds an APR k times a year: (1 + r/k)^(k/m) − 1', () => {
    expect(periodicRate({ ...base, basis: 'apr', compoundsPerYear: 365 }, 0.042)).toBeCloseTo((1 + 0.042 / 365) ** (365 / 12) - 1, 12)
  })

  it('does not count compounding twice for an APY', () => {
    // A 4.2% APY grows 1 to 1.042 in a year, whatever the compounding setting.
    const i = periodicRate({ ...base, compoundsPerYear: 365 }, 0.042)
    expect((1 + i) ** 12).toBeCloseTo(1.042, 12)
  })

  it('reduces the rate by the tax on interest first', () => {
    expect(periodicRate({ ...base, taxRate: 0.22 }, 0.042)).toBeCloseTo((1 + 0.042 * 0.78) ** (1 / 12) - 1, 12)
  })
})

describe('the formulas', () => {
  it('future value, and P + cN at a zero rate', () => {
    const i = 0.0035
    expect(futureValue(2_000, 300, i, 36)).toBeCloseTo(2_000 * (1 + i) ** 36 + (300 * ((1 + i) ** 36 - 1)) / i, 8)
    expect(futureValue(2_000, 300, 0, 36)).toBe(2_000 + 300 * 36)
  })

  it('the required contribution reaches the goal exactly', () => {
    const i = 0.0035
    const c = requiredContribution(20_000, 2_000, i, 36)
    expect(futureValue(2_000, c, i, 36)).toBeCloseTo(20_000, 6)
    expect(requiredContribution(1_000, 2_000, i, 36)).toBe(0)
    expect(requiredContribution(20_000, 2_000, 0, 36)).toBeCloseTo(500, 10)
  })

  it('the time to a goal rounds up to the next full period', () => {
    const i = 0.0035
    const n = periodsToGoal(20_000, 2_000, 300, i)
    expect(futureValue(2_000, 300, i, n)).toBeGreaterThanOrEqual(20_000)
    expect(futureValue(2_000, 300, i, n - 1)).toBeLessThan(20_000)
    expect(periodsToGoal(20_000, 2_000, 300, 0)).toBe(60)
    expect(periodsToGoal(1_000, 2_000, 300, i)).toBe(0)
    expect(periodsToGoal(20_000, 0, 0, i)).toBe(Infinity)
    expect(periodsToGoal(20_000, 2_000, 0, 0)).toBe(Infinity)
  })

  it('adds months to a date', () => {
    expect(addMonths({ year: 2026, month: 11 }, 3)).toEqual({ year: 2027, month: 2 })
  })
})

describe('what will I have', () => {
  it('projects the balance, deposits and interest', () => {
    const figures = figuresOf({})
    const i = periodicRate(base, 0.042)
    expect(figures.finalBalance).toBeCloseTo(futureValue(2_000, 300, i, 36), 8)
    expect(figures.totalDeposited).toBe(2_000 + 300 * 36)
    expect(figures.interestEarned).toBeCloseTo(figures.finalBalance - figures.totalDeposited, 8)
    expect(figures.realBalance).toBeCloseTo(figures.finalBalance / 1.03 ** 3, 8)
  })

  it('uses the estimated APY when no rate is typed, even with APR picked', () => {
    const estimate = run({ rate: null, basis: 'apr', compoundsPerYear: 1 })
    expect(estimate.rateEstimated).toBe(true)
    expect(estimate.netYield).toBeCloseTo(us.estimates.apy, 12)
  })

  it('with a goal, says whether the plan is on track and how long the same plan takes', () => {
    const short = figuresOf({ goal: 20_000 })
    expect(short.onTrack).toBe(false)
    expect(short.gap).toBeLessThan(0)
    expect(short.monthsToGoal).toBeGreaterThan(36)
    expect(figuresOf({ goal: 5_000 }).onTrack).toBe(true)
  })

  it('needs a duration and something to save', () => {
    expect(run({ durationMonths: null }).figures).toBeNull()
    expect(run({ initialBalance: null, contribution: null }).figures).toBeNull()
  })

  it('ends on a date from the start date', () => {
    expect(figuresOf({ startDate: { year: 2026, month: 1 } }).endDate).toEqual({ year: 2029, month: 1 })
  })
})

describe('how much do I need to save', () => {
  it('finds the contribution that reaches the goal', () => {
    const figures = figuresOf({ mode: 'contribution', goal: 20_000 })
    expect(figures.finalBalance).toBeCloseTo(20_000, 6)
    expect(figures.onTrack).toBe(true)
  })

  it('returns 0 when the initial balance already reaches it', () => {
    const figures = figuresOf({ mode: 'contribution', goal: 2_100, initialBalance: 2_000 })
    expect(figures.contribution).toBe(0)
    expect(figures.alreadyThere).toBe(true)
  })

  it('raises a goal in today’s dollars by inflation over the duration', () => {
    const figures = figuresOf({ mode: 'contribution', goal: 20_000, goalInTodaysDollars: true })
    expect(figures.goalTarget).toBeCloseTo(20_000 * 1.03 ** 3, 8)
    expect(figures.finalBalance).toBeCloseTo(20_000 * 1.03 ** 3, 6)
  })

  it('reports the goal in today’s money when it is typed in future dollars', () => {
    expect(figuresOf({ mode: 'contribution', goal: 20_000 }).goalToday).toBeCloseTo(20_000 / 1.03 ** 3, 8)
  })

  it('needs a goal and a duration', () => {
    expect(run({ mode: 'contribution', goal: null }).figures).toBeNull()
    expect(run({ mode: 'contribution', goal: 20_000, durationMonths: null }).figures).toBeNull()
  })
})

describe('how long will it take', () => {
  it('finds the time, in full periods, ignoring the duration field', () => {
    const figures = figuresOf({ mode: 'time', goal: 20_000, durationMonths: null })
    expect(figures.finalBalance).toBeGreaterThanOrEqual(20_000)
    expect(futureValue(2_000, 300, periodicRate(base, 0.042), figures.periods - 1)).toBeLessThan(20_000)
    expect(figures.months).toBe(figures.periods)
  })

  it('solves the time and a goal in today’s dollars together', () => {
    const plain = figuresOf({ mode: 'time', goal: 20_000 })
    const today = figuresOf({ mode: 'time', goal: 20_000, goalInTodaysDollars: true })
    expect(today.periods).toBeGreaterThan(plain.periods)
    expect(today.goalTarget).toBeCloseTo(20_000 * 1.03 ** (today.periods / 12), 6)
    expect(today.finalBalance).toBeGreaterThanOrEqual(today.goalTarget!)
  })

  it('says the goal is out of reach with no contribution and no growth', () => {
    expect(run({ mode: 'time', goal: 20_000, contribution: null, rate: 0 }).unreachable).toBe(true)
    expect(run({ mode: 'time', goal: 20_000, contribution: null, initialBalance: null }).unreachable).toBe(true)
  })

  it('says so when inflation outpaces the savings', () => {
    expect(
      run({ mode: 'time', goal: 20_000, contribution: null, rate: 0.01, inflationRate: 0.05, goalInTodaysDollars: true }).unreachable,
    ).toBe(true)
  })

  it('is immediate when the initial balance already reaches the goal', () => {
    expect(figuresOf({ mode: 'time', goal: 1_000 }).periods).toBe(0)
  })
})
