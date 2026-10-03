import { describe, expect, it } from 'vitest'
import { calculateDebtPayoff, compareStrategies } from '../calculation'
import { debtPayoffDefaults } from '../schema'
import type { DebtPayoffInput } from '../types'

const base: DebtPayoffInput = { ...debtPayoffDefaults }

describe('calculateDebtPayoff', () => {
  it('clears every debt within the horizon', () => {
    const result = calculateDebtPayoff(base)

    expect(result.monthsToDebtFree).toBeLessThan(600)
    expect(result.timeline.at(-1)?.totalBalance).toBe(0)
    expect(result.perDebt.every((d) => Number.isFinite(d.payoffMonth))).toBe(true)
  })

  it('reports a shortfall instead of looping when the budget misses the minimums', () => {
    const result = calculateDebtPayoff({ ...base, monthlyBudget: 100 })

    expect(result.shortfall).toBeGreaterThan(0)
    expect(result.monthsToDebtFree).toBe(Infinity)
    expect(result.timeline).toHaveLength(0)
  })

  it('attacks the highest rate first under avalanche', () => {
    const result = calculateDebtPayoff({ ...base, strategy: 'avalanche' })
    // The store card carries the highest rate, so it clears first.
    expect(result.payoffOrder[0]).toBe('card-2')
  })

  it('attacks the smallest balance first under snowball', () => {
    const result = calculateDebtPayoff({ ...base, strategy: 'snowball' })
    expect(result.payoffOrder[0]).toBe('card-2')
  })

  it('pays the least interest under avalanche', () => {
    const { avalanche, snowball, interestDifference } = compareStrategies(base)

    expect(avalanche.totalInterest).toBeLessThanOrEqual(snowball.totalInterest)
    expect(interestDifference).toBeGreaterThanOrEqual(0)
  })

  it('finishes sooner with a bigger budget', () => {
    const lean = calculateDebtPayoff(base)
    const generous = calculateDebtPayoff({ ...base, monthlyBudget: 1_200 })

    expect(generous.monthsToDebtFree).toBeLessThan(lean.monthsToDebtFree)
    expect(generous.totalInterest).toBeLessThan(lean.totalInterest)
  })

  it('handles a single debt', () => {
    const result = calculateDebtPayoff({
      ...base,
      debts: [{ id: 'only', name: 'Card', balance: 1_000, annualRate: 0.2, minimumPayment: 50 }],
      monthlyBudget: 200,
    })

    expect(result.monthsToDebtFree).toBeGreaterThan(0)
    expect(result.payoffOrder).toEqual(['only'])
  })

  it('reads Colombian card rates as E.A., which costs less than the same nominal quote', () => {
    const us = calculateDebtPayoff({ ...base, countryCode: 'us' })
    const co = calculateDebtPayoff({ ...base, countryCode: 'co' })
    expect(co.totalInterest).toBeLessThan(us.totalInterest)
  })

  it('treats Canadian card rates as nominal, like the US', () => {
    const us = calculateDebtPayoff({ ...base, countryCode: 'us' })
    const ca = calculateDebtPayoff({ ...base, countryCode: 'ca' })
    expect(ca.totalInterest).toBe(us.totalInterest)
  })
})
