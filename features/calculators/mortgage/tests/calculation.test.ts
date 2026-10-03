import { describe, expect, it } from 'vitest'
import { calculateAffordability, calculateMortgage } from '../calculation'
import { mortgageDefaults } from '../schema'
import type { MortgageInput } from '../types'

const base: MortgageInput = { ...mortgageDefaults }

describe('calculateMortgage', () => {
  it('borrows the price less the down payment', () => {
    const result = calculateMortgage(base)
    expect(result.loanAmount).toBe(336_000)
    expect(result.downPaymentRatio).toBeCloseTo(0.2, 4)
  })

  it('adds escrow and HOA on top of principal and interest', () => {
    const { monthly } = calculateMortgage(base)
    const parts =
      monthly.principalAndInterest +
      monthly.propertyTax +
      monthly.insurance +
      monthly.hoa +
      monthly.mortgageInsurance

    expect(monthly.total).toBeCloseTo(parts, 2)
    expect(monthly.total).toBeGreaterThan(monthly.principalAndInterest)
  })

  it('skips mortgage insurance at or above the country threshold', () => {
    const result = calculateMortgage(base)
    expect(result.requiresMortgageInsurance).toBe(false)
    expect(result.monthly.mortgageInsurance).toBe(0)
  })

  it('charges mortgage insurance on a small down payment and ends it at 80% LTV', () => {
    const result = calculateMortgage({ ...base, downPayment: 21_000 })

    expect(result.requiresMortgageInsurance).toBe(true)
    expect(result.monthly.mortgageInsurance).toBeGreaterThan(0)
    expect(result.mortgageInsuranceEndsPeriod).toBeGreaterThan(0)
    expect(result.mortgageInsuranceEndsPeriod).toBeLessThan(base.termMonths)
  })

  it('saves interest on a 15-year term', () => {
    const thirty = calculateMortgage(base)
    const fifteen = calculateMortgage({ ...base, termMonths: 180 })

    expect(fifteen.monthly.principalAndInterest).toBeGreaterThan(
      thirty.monthly.principalAndInterest,
    )
    expect(fifteen.totalInterest).toBeLessThan(thirty.totalInterest)
  })
})

describe('calculateAffordability', () => {
  it('respects the debt-to-income ceiling', () => {
    const result = calculateAffordability({
      monthlyIncome: 9_000,
      monthlyDebts: 700,
      downPayment: 60_000,
      annualRate: 0.0665,
      termMonths: 360,
      countryCode: 'us',
    })

    // US ceiling is 43%: 9000 * 0.43 - 700.
    expect(result.maxMonthlyPayment).toBeCloseTo(3_170, 0)
    expect(result.maxHomePrice).toBeGreaterThan(result.maxLoanAmount)
    expect(result.debtToIncome).toBeLessThanOrEqual(0.43)
  })

  it('never returns a negative budget when debts exceed the ceiling', () => {
    const result = calculateAffordability({
      monthlyIncome: 3_000,
      monthlyDebts: 2_500,
      downPayment: 0,
      annualRate: 0.07,
      termMonths: 360,
      countryCode: 'us',
    })

    expect(result.maxMonthlyPayment).toBe(0)
    expect(result.maxLoanAmount).toBe(0)
  })
})
