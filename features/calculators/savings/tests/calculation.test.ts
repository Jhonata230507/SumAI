import { describe, expect, it } from 'vitest'
import { calculateSavings } from '../calculation'
import { savingsDefaults } from '../schema'
import type { SavingsInput } from '../types'

const base: SavingsInput = { ...savingsDefaults }

describe('calculateSavings', () => {
  it('accumulates deposits plus interest', () => {
    const result = calculateSavings(base)
    expect(result.totalDeposited).toBeCloseTo(2_000 + 300 * 36, 0)
    expect(result.finalBalance).toBeGreaterThan(result.totalDeposited)
  })

  it('reports an effective yield above the nominal rate when compounding monthly', () => {
    const result = calculateSavings(base)
    expect(result.effectiveAnnualYield).toBeGreaterThan(base.annualRate)
  })

  it('matches nominal and effective when compounded once a year', () => {
    const result = calculateSavings({ ...base, compoundsPerYear: 1 })
    expect(result.effectiveAnnualYield).toBeCloseTo(base.annualRate, 6)
  })

  it('solves for the deposit needed to hit a target', () => {
    const result = calculateSavings({ ...base, mode: 'target', targetAmount: 20_000 })

    expect(result.requiredDeposit).not.toBeNull()
    expect(result.requiredDeposit!).toBeGreaterThan(0)

    const check = calculateSavings({ ...base, deposit: result.requiredDeposit! })
    expect(check.finalBalance).toBeGreaterThanOrEqual(20_000 - 1)
  })

  it('asks for nothing when the opening balance already clears the target', () => {
    const result = calculateSavings({
      ...base,
      mode: 'target',
      initialAmount: 50_000,
      targetAmount: 20_000,
    })
    expect(result.requiredDeposit).toBe(0)
  })

  it('flags a target that the current plan misses', () => {
    const result = calculateSavings({ ...base, mode: 'target', targetAmount: 500_000 })
    expect(result.reachesTarget).toBe(false)
  })

  it('takes a Colombian rate as the effective yield, whatever the compounding', () => {
    // Colombian savings rates are quoted E.A.: the quote already is the yield.
    for (const compoundsPerYear of [1, 12, 365]) {
      const result = calculateSavings({ ...base, countryCode: 'co', compoundsPerYear })
      expect(result.effectiveAnnualYield).toBeCloseTo(base.annualRate, 12)
    }
  })

  it('still compounds a nominal quote in Canada', () => {
    const result = calculateSavings({ ...base, countryCode: 'ca' })
    expect(result.effectiveAnnualYield).toBeGreaterThan(base.annualRate)
  })
})
