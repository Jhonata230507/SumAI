import { describe, expect, it } from 'vitest'
import { applyTax, estimateInvestment, resolveTaxRate, type InvestmentEstimateInput } from '../calculate'
import { getInvestmentConfig } from '../config'

const us = getInvestmentConfig('us')!

const grow: InvestmentEstimateInput = {
  mode: 'grow',
  initialAmount: 10_000,
  contribution: 500,
  frequency: 'monthly',
  years: 25,
  annualReturn: 0.07,
  targetAmount: null,
  feeRate: null,
  inflationRate: null,
  accountType: 'unspecified',
  taxRate: null,
  contributionIncrease: null,
  timing: 'end',
}

const figuresOf = (input: Partial<InvestmentEstimateInput>) => estimateInvestment(us, { ...grow, ...input }).figures!

/** The textbook future value: a lump sum plus an ordinary (or due) annuity. */
const futureValue = (initial: number, payment: number, r: number, n: number, due = false) =>
  initial * (1 + r) ** n + payment * (((1 + r) ** n - 1) / r) * (due ? 1 + r : 1)

describe('how much will I have', () => {
  it('matches the future value of the lump sum and the contributions', () => {
    const figures = figuresOf({})
    expect(figures.finalBalance).toBeCloseTo(futureValue(10_000, 500, 0.07 / 12, 300), 6)
    expect(figures.totalContributed).toBe(10_000 + 500 * 300)
    expect(figures.growth).toBeCloseTo(figures.finalBalance - figures.totalContributed, 8)
  })

  it('earns one more period on each contribution made at the start', () => {
    const start = figuresOf({ timing: 'start' })
    expect(start.finalBalance).toBeCloseTo(futureValue(10_000, 500, 0.07 / 12, 300, true), 6)
    expect(start.finalBalance).toBeGreaterThan(figuresOf({}).finalBalance)
  })

  it('nets fees off the return and reports what they cost', () => {
    const figures = figuresOf({ feeRate: 0.01 })
    expect(figures.finalBalance).toBeCloseTo(futureValue(10_000, 500, 0.06 / 12, 300), 6)
    expect(figures.feesCost).toBeCloseTo(figuresOf({}).finalBalance - figures.finalBalance, 6)
  })

  it('raises the contribution each year by the annual increase', () => {
    const figures = figuresOf({ contributionIncrease: 0.03, years: 2, initialAmount: 0, annualReturn: 0 })
    expect(figures.totalContributed).toBeCloseTo(500 * 12 + 515 * 12, 8)
  })

  it('works with weekly, every-two-weeks and yearly contributions', () => {
    expect(figuresOf({ frequency: 'weekly', annualReturn: 0, initialAmount: 0 }).totalContributed).toBe(500 * 52 * 25)
    expect(figuresOf({ frequency: 'annually' }).finalBalance).toBeCloseTo(futureValue(10_000, 500, 0.07, 25), 6)
  })

  it('restates the balance in today’s money with the estimated inflation', () => {
    const figures = figuresOf({})
    expect(figures.realBalance).toBeCloseTo(figures.finalBalance / (1 + us.estimates.inflation) ** 25, 6)
  })

  it('uses the estimated return when none is typed', () => {
    const estimate = estimateInvestment(us, { ...grow, annualReturn: null })
    expect(estimate).toMatchObject({ annualReturn: 0.07, returnEstimated: true })
  })

  it('shows the same plan at a weaker and a stronger return', () => {
    const { range, finalBalance } = figuresOf({})
    expect(range.expected).toBe(finalBalance)
    expect(range.weaker).toBeCloseTo(figuresOf({ annualReturn: 0.04 }).finalBalance, 6)
    expect(range.stronger).toBeCloseTo(figuresOf({ annualReturn: 0.1 }).finalBalance, 6)
  })

  it('needs a duration, and something to invest', () => {
    expect(estimateInvestment(us, { ...grow, years: null }).figures).toBeNull()
    expect(estimateInvestment(us, { ...grow, initialAmount: null, contribution: null }).figures).toBeNull()
    expect(estimateInvestment(us, { ...grow, initialAmount: null }).figures).not.toBeNull()
  })
})

describe('how much do I need to save', () => {
  const goal: InvestmentEstimateInput = { ...grow, mode: 'goal', contribution: null, targetAmount: 1_000_000 }

  it('finds the contribution that reaches the target', () => {
    const figures = estimateInvestment(us, goal).figures!
    expect(figures.finalBalance).toBeCloseTo(1_000_000, 4)
    // The same contribution in grow mode gives back the target.
    expect(figuresOf({ contribution: figures.contribution }).finalBalance).toBeCloseTo(1_000_000, 4)
  })

  it('finds it with timing, fees and a yearly increase too', () => {
    const input = { ...goal, timing: 'start' as const, feeRate: 0.005, contributionIncrease: 0.02 }
    const figures = estimateInvestment(us, input).figures!
    expect(figures.finalBalance).toBeCloseTo(1_000_000, 4)
  })

  it('needs nothing more when the initial investment already gets there', () => {
    const figures = estimateInvestment(us, { ...goal, initialAmount: 500_000 }).figures!
    expect(figures.alreadyThere).toBe(true)
    expect(figures.contribution).toBe(0)
  })

  it('needs a target', () => {
    expect(estimateInvestment(us, { ...goal, targetAmount: null }).figures).toBeNull()
  })
})

describe('tax by account type', () => {
  it('shows no after-tax figure when the account is not given', () => {
    const figures = figuresOf({})
    expect(figures.afterTax).toBeNull()
    expect(figures.tax).toBeNull()
  })

  it('taxable: taxes only the gains, at the estimate unless one is typed', () => {
    const figures = figuresOf({ accountType: 'taxable' })
    const gains = figures.finalBalance - figures.totalContributed
    expect(figures.tax).toBeCloseTo(0.15 * gains, 6)
    expect(figuresOf({ accountType: 'taxable', taxRate: 0.2 }).tax).toBeCloseTo(0.2 * gains, 6)
  })

  it('tax-deferred: taxes the whole balance on withdrawal', () => {
    const figures = figuresOf({ accountType: 'deferred' })
    expect(figures.afterTax).toBeCloseTo(figures.finalBalance * (1 - 0.22), 6)
  })

  it('tax-free: no tax', () => {
    const figures = figuresOf({ accountType: 'free', taxRate: 0.3 })
    expect(figures.tax).toBe(0)
    expect(figures.afterTax).toBe(figures.finalBalance)
  })

  it('resolves the rate by account type', () => {
    expect(resolveTaxRate(us, 'unspecified', 0.2)).toEqual({ rate: null, estimated: false })
    expect(resolveTaxRate(us, 'deferred', null)).toEqual({ rate: 0.22, estimated: true })
    expect(applyTax('taxable', 0.15, 100, 120)).toEqual({ tax: 0, afterTax: 100 })
  })
})
