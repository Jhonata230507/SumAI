import { describe, expect, it } from 'vitest'
import { CO_HOUSING, checkHousing, loanFromPayment, visPriceCap } from '../co'
import { calculateMortgage } from '../calculation'

describe('Colombian housing rules', () => {
  it('caps VIS at 150 minimum wages', () => {
    expect(visPriceCap()).toBe(150 * CO_HOUSING.minimumWage)
  })

  it('flags a VIS price above the cap, never a No VIS one', () => {
    expect(checkHousing('vis', visPriceCap() + 1, 100_000_000).overVisCap).toBe(true)
    expect(checkHousing('vis', visPriceCap(), 100_000_000).overVisCap).toBe(false)
    expect(checkHousing('no-vis', visPriceCap() * 2, 200_000_000).overVisCap).toBe(false)
  })

  it('needs 20% down for VIS and 30% for No VIS', () => {
    expect(checkHousing('vis', 200_000_000, 40_000_000).downBelowMinimum).toBe(false)
    expect(checkHousing('no-vis', 200_000_000, 40_000_000).downBelowMinimum).toBe(true)
    expect(checkHousing('no-vis', 200_000_000, 60_000_000).downBelowMinimum).toBe(false)
  })
})

describe('loanFromPayment', () => {
  it('inverts the fixed peso payment', () => {
    const loan = loanFromPayment(2_000_000, 0.12, 240)
    const back = calculateMortgage({
      homePrice: loan + 50_000_000,
      downPayment: 50_000_000,
      annualRate: 0.12,
      termMonths: 240,
      propertyTaxAnnual: 0,
      homeInsuranceAnnual: 0,
      hoaMonthly: 0,
      mortgageInsuranceRate: 0,
      extraPayment: 0,
      countryCode: 'co',
    })
    expect(back.monthly.principalAndInterest).toBeCloseTo(2_000_000, -1)
  })

  it('is payment × months at a zero rate, and 0 without a payment', () => {
    expect(loanFromPayment(1_000_000, 0, 120)).toBe(120_000_000)
    expect(loanFromPayment(Number.NaN, 0.12, 120)).toBe(0)
  })
})
