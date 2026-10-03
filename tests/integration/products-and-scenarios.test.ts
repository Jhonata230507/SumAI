import { describe, expect, it } from 'vitest'
import { rankProducts } from '@/features/products/rank-products'
import { compareProducts } from '@/features/products/compare-products'
import { calculateDifference, isImprovement } from '@/features/scenarios/calculate-difference'
import { calculateLoan } from '@/features/calculators/loan/calculation'
import { loanDefaults } from '@/features/calculators/loan/schema'
import { PRODUCT_FIXTURES, lowRateHighFee, middleOption, primeOnly } from '../fixtures/products'

/**
 * Cross-feature behaviour: calculators feeding scenarios, and the product
 * engine reusing the same payment maths. No database — every function here is
 * pure, which is the point of keeping fetch and rank apart.
 */

describe('product ranking', () => {
  const borrower = {
    category: 'personal-loan' as const,
    countryCode: 'us' as const,
    amount: 10_000,
    termMonths: 36,
    creditScore: 700,
    monthlyIncome: 5_000,
    monthlyDebts: 800,
  }

  it('hides products the borrower does not qualify for by default', () => {
    const { matches } = rankProducts(PRODUCT_FIXTURES, borrower)
    expect(matches.map((m) => m.product.id)).not.toContain(primeOnly.id)
  })

  it('ranks an ineligible product below every eligible one when shown', () => {
    const { matches } = rankProducts(PRODUCT_FIXTURES, { ...borrower, includeIneligible: true })
    const last = matches.at(-1)!

    expect(last.product.id).toBe(primeOnly.id)
    expect(last.eligible).toBe(false)
    expect(last.reasons.some((r) => r.includes('760'))).toBe(true)
  })

  it('estimates a payment with the same maths as the loan calculator', () => {
    const { matches } = rankProducts([middleOption], borrower)
    const calculated = calculateLoan({
      ...loanDefaults,
      amount: borrower.amount,
      annualRate: middleOption.rateMin,
      termMonths: borrower.termMonths,
    })

    expect(matches[0].estimatedPayment).toBe(calculated.payment)
  })
})

describe('total-cost comparison', () => {
  it('lets a no-fee loan beat a lower rate on a short term', () => {
    const rows = compareProducts([lowRateHighFee, middleOption], 5_000, 12, 'us')
    expect(rows[0].productId).toBe(middleOption.id)
    expect(rows[1].costVsBest).toBeGreaterThan(0)
  })

  it('lets the lower rate win once the term is long enough to outweigh the fee', () => {
    const rows = compareProducts([lowRateHighFee, middleOption], 50_000, 84, 'us')
    expect(rows[0].productId).toBe(lowRateHighFee.id)
  })
})

describe('scenario differences', () => {
  it('scores paying extra as an improvement on interest and payoff time', () => {
    const base = calculateLoan(loanDefaults)
    const extra = calculateLoan({ ...loanDefaults, extraPayment: 150 })

    const diffs = calculateDifference(
      'loan',
      { totalInterest: base.totalInterest, payoffPeriods: base.payoffPeriods, payment: base.payment },
      { totalInterest: extra.totalInterest, payoffPeriods: extra.payoffPeriods, payment: extra.payment },
    )

    const byKey = Object.fromEntries(diffs.map((d) => [d.key, d]))
    expect(isImprovement(byKey.totalInterest)).toBe(true)
    expect(isImprovement(byKey.payoffPeriods)).toBe(true)
    // The scheduled payment itself is unchanged by extra principal.
    expect(byKey.payment.delta).toBe(0)
  })

  it('treats a higher balance as better for growth calculators', () => {
    const [diff] = calculateDifference('investment', { finalBalance: 100 }, { finalBalance: 120 })
    expect(isImprovement(diff)).toBe(true)
  })
})
