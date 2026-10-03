import { describe, expect, it } from 'vitest'
import { calculateCarLoan } from '../calculation'
import { carLoanDefaults } from '../schema'
import type { CarLoanInput } from '../types'

const base: CarLoanInput = { ...carLoanDefaults }

describe('calculateCarLoan', () => {
  it('finances price plus tax and fees, less cash down', () => {
    const result = calculateCarLoan(base)
    // 32000 + 2240 tax + 600 fees - 4000 down.
    expect(result.amountFinanced).toBe(30_840)
    expect(result.salesTax).toBe(2_240)
  })

  it('treats trade-in equity as extra money down', () => {
    const withTrade = calculateCarLoan({ ...base, tradeInValue: 8_000 })
    const without = calculateCarLoan(base)

    expect(withTrade.tradeInEquity).toBe(8_000)
    expect(withTrade.amountFinanced).toBe(without.amountFinanced - 8_000)
  })

  it('rolls negative trade-in equity into the new loan', () => {
    const upsideDown = calculateCarLoan({ ...base, tradeInValue: 5_000, tradeInOwed: 9_000 })
    const without = calculateCarLoan(base)

    expect(upsideDown.tradeInEquity).toBe(-4_000)
    expect(upsideDown.amountFinanced).toBe(without.amountFinanced + 4_000)
  })

  it('starts underwater once tax and fees are financed', () => {
    const result = calculateCarLoan({ ...base, downPayment: 0 })
    expect(result.initialLoanToValue).toBeGreaterThan(1)
  })

  it('reaches positive equity before the loan ends on a healthy deal', () => {
    const result = calculateCarLoan({ ...base, downPayment: 8_000, termMonths: 48 })
    expect(result.breakEvenPeriod).not.toBeNull()
    expect(result.breakEvenPeriod!).toBeLessThanOrEqual(48)
  })
})
