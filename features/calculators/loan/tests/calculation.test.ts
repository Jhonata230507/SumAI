import { describe, expect, it } from 'vitest'
import { calculateLoan } from '../calculation'
import { loanDefaults } from '../schema'
import type { LoanInput } from '../types'

const base: LoanInput = { ...loanDefaults }

describe('calculateLoan', () => {
  it('matches the textbook annuity payment', () => {
    // $25,000 at 8.9% nominal over 60 months.
    const result = calculateLoan(base)
    expect(result.payment).toBeCloseTo(517.75, 1)
  })

  it('amortizes the balance to exactly zero', () => {
    const { schedule } = calculateLoan(base)
    expect(schedule.rows.at(-1)?.balance).toBe(0)
  })

  it('charges no interest at a zero rate', () => {
    const result = calculateLoan({ ...base, annualRate: 0 })
    expect(result.totalInterest).toBe(0)
    expect(result.payment).toBeCloseTo(base.amount / base.termMonths, 2)
  })

  it('shortens the loan when extra principal is paid', () => {
    const plain = calculateLoan(base)
    const extra = calculateLoan({ ...base, extraPayment: 100 })

    expect(extra.payoffPeriods).toBeLessThan(plain.payoffPeriods)
    expect(extra.totalInterest).toBeLessThan(plain.totalInterest)
    expect(extra.interestSaved).toBeGreaterThan(0)
  })

  it('treats a Colombian rate as effective annual', () => {
    // The same quoted number is a cheaper loan under E.A. than under nominal.
    const us = calculateLoan({ ...base, countryCode: 'us' })
    const co = calculateLoan({ ...base, countryCode: 'co' })

    expect(co.payment).toBeLessThan(us.payment)
  })

  it('folds the origination fee into the total cost, not the payment', () => {
    const withFee = calculateLoan({ ...base, originationFee: 500 })
    const without = calculateLoan(base)

    expect(withFee.payment).toBe(without.payment)
    expect(withFee.totalPaid).toBeCloseTo(without.totalPaid + 500, 2)
  })
})
