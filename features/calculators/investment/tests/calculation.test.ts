import { describe, expect, it } from 'vitest'
import { calculateInvestment, yearsToDouble } from '../calculation'
import { investmentDefaults } from '../schema'
import type { InvestmentInput } from '../types'

const base: InvestmentInput = { ...investmentDefaults }

describe('calculateInvestment', () => {
  it('grows a contribution plan past what was put in', () => {
    const result = calculateInvestment(base)
    expect(result.finalBalance).toBeGreaterThan(result.totalContributed)
    expect(result.totalGrowth).toBeGreaterThan(0)
  })

  it('reports a real balance below the nominal one when inflation is positive', () => {
    const result = calculateInvestment(base)
    expect(result.realBalance).toBeLessThan(result.finalBalance)
  })

  it('charges nothing when the fee rate is zero', () => {
    const result = calculateInvestment({ ...base, feeRate: 0 })
    expect(result.totalFees).toBe(0)
  })

  it('costs real money at a higher expense ratio', () => {
    const cheap = calculateInvestment({ ...base, feeRate: 0.0003 })
    const expensive = calculateInvestment({ ...base, feeRate: 0.01 })

    expect(expensive.totalFees).toBeGreaterThan(cheap.totalFees)
    expect(expensive.finalBalance).toBeLessThan(cheap.finalBalance)
  })

  it('orders the projection band correctly', () => {
    const { range } = calculateInvestment(base)
    expect(range.pessimistic).toBeLessThan(range.expected)
    expect(range.expected).toBeLessThan(range.optimistic)
  })

  it('just accumulates contributions at a zero return', () => {
    const result = calculateInvestment({
      ...base,
      annualReturn: 0,
      feeRate: 0,
      initialAmount: 0,
      contribution: 100,
      years: 10,
    })
    expect(result.finalBalance).toBeCloseTo(12_000, 2)
  })
})

describe('yearsToDouble', () => {
  it('approximates the rule of 72', () => {
    expect(yearsToDouble(0.07)).toBeCloseTo(10.2, 1)
  })

  it('never doubles at a zero return', () => {
    expect(yearsToDouble(0)).toBe(Infinity)
  })
})
