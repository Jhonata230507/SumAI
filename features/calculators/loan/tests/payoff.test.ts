import { describe, expect, it } from 'vitest'
import { comparePayoff } from '../payoff'
import { loanDefaults } from '../schema'
import type { LoanInput } from '../types'

const input: LoanInput = { ...loanDefaults, amount: 20_000, annualRate: 0.0799, termMonths: 60 }

describe('comparePayoff', () => {
  it('changes nothing with no extra', () => {
    const result = comparePayoff(input, 0)
    expect(result.interestSaved).toBe(0)
    expect(result.periodsSaved).toBe(0)
  })

  it('saves interest and payments with extra toward principal', () => {
    const result = comparePayoff(input, 100)
    expect(result.faster.payoffPeriods).toBeLessThan(60)
    expect(result.periodsSaved).toBe(60 - result.faster.payoffPeriods)
    expect(result.interestSaved).toBeCloseTo(result.base.totalInterest - result.faster.totalInterest, 6)
    expect(result.faster.schedule.rows.at(-1)!.balance).toBe(0)
  })

  it('ignores the extra already in the input for the base plan', () => {
    const result = comparePayoff({ ...input, extraPayment: 250 }, 0)
    expect(result.base.payoffPeriods).toBe(60)
    expect(result.faster.payoffPeriods).toBe(60)
  })

  it('charts every payment, in years, from the amount down to zero', () => {
    const { balances } = comparePayoff({ ...input, termMonths: 24 }, 0)
    expect(balances).toHaveLength(25)
    expect(balances[0]).toEqual({ x: 0, base: 20_000, faster: 20_000 })
    expect(balances.at(-1)).toMatchObject({ x: 2, base: 0, faster: 0 })
  })

  it('keeps the faster plan at or below the base one, reaching zero when it is paid off', () => {
    const { balances, faster, years } = comparePayoff(input, 150)
    for (const point of balances) expect(point.faster).toBeLessThanOrEqual(point.base)
    expect(balances[faster.payoffPeriods].faster).toBe(0)
    expect(balances[faster.payoffPeriods - 1].faster).toBeGreaterThan(0)
    expect(years.at(-1)!.balance).toBe(0)
  })
})
