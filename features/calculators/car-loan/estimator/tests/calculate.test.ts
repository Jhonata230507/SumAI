import { describe, expect, it } from 'vitest'
import { annuityFactor, breakEvenMonth, dtiLevel, estimateAmortization, estimateCarLoan, estimateSchedule, type CarLoanEstimateInput } from '../calculate'
import { getCarLoanConfig } from '../config'

const us = getCarLoanConfig('us')!

const price: CarLoanEstimateInput = {
  mode: 'price',
  condition: 'new',
  vehiclePrice: 30_000,
  monthlyBudget: null,
  downPayment: { unit: 'amount', value: 3_000 },
  tradeInValue: 0,
  tradeInOwed: 0,
  termMonths: 60,
  apr: 0.06,
  creditBand: null,
  salesTax: 0.06,
  fees: 500,
  annualIncome: null,
  monthlyDebts: 0,
}

const budget: CarLoanEstimateInput = { ...price, mode: 'budget', vehiclePrice: null, monthlyBudget: 500 }

describe('annuityFactor', () => {
  it('is the number of payments at a zero rate', () => {
    expect(annuityFactor(0, 60)).toBe(60)
  })

  it('matches the closed form', () => {
    const r = 0.06 / 12
    expect(annuityFactor(r, 60)).toBeCloseTo((1 - (1 + r) ** -60) / r, 10)
  })
})

describe('price mode', () => {
  it('works out the payment from the loan amount', () => {
    const { figures } = estimateCarLoan(us, price)
    // 30,000 × 1.06 + 500 − 3,000 = 29,300
    expect(figures!.loanAmount).toBeCloseTo(29_300, 8)
    expect(figures!.payment).toBeCloseTo(566.45, 2)
    expect(figures!.totalOfPayments).toBeCloseTo(figures!.payment * 60, 8)
    expect(figures!.totalInterest).toBeCloseTo(figures!.totalOfPayments - 29_300, 8)
    expect(figures!.priceWithTax).toBeCloseTo(31_800, 8)
  })

  it('takes a percentage down payment from the vehicle price', () => {
    const { figures } = estimateCarLoan(us, { ...price, downPayment: { unit: 'percent', value: 0.1 } })
    expect(figures!.downPayment).toBeCloseTo(3_000, 8)
    expect(figures!.loanAmount).toBeCloseTo(29_300, 8)
  })

  it('splits the loan evenly at a zero APR', () => {
    const { figures } = estimateCarLoan(us, { ...price, apr: 0 })
    expect(figures!.payment).toBeCloseTo(29_300 / 60, 10)
    expect(figures!.totalInterest).toBeCloseTo(0, 8)
  })

  it('adds negative equity on the trade-in to the loan', () => {
    const { figures } = estimateCarLoan(us, { ...price, tradeInValue: 8_000, tradeInOwed: 10_000 })
    expect(figures!.loanAmount).toBeCloseTo(29_300 + 2_000, 8)
  })

  it('ignores an amount owed when there is no trade-in', () => {
    const { figures } = estimateCarLoan(us, { ...price, tradeInValue: 0, tradeInOwed: 10_000 })
    expect(figures!.loanAmount).toBeCloseTo(29_300, 8)
  })

  it('finances nothing when the down payment and trade-in cover the price', () => {
    const { figures } = estimateCarLoan(us, { ...price, downPayment: { unit: 'amount', value: 20_000 }, tradeInValue: 15_000 })
    expect(figures!.loanAmount).toBe(0)
    expect(figures!.payment).toBe(0)
    expect(figures!.totalInterest).toBe(0)
    expect(figures!.nothingToFinance).toBe(true)
  })

  it('has no figures until a price is entered', () => {
    expect(estimateCarLoan(us, { ...price, vehiclePrice: null }).figures).toBeNull()
    expect(estimateCarLoan(us, { ...price, vehiclePrice: 0 }).figures).toBeNull()
  })

  it('rejects a percentage down payment above 100%', () => {
    const estimate = estimateCarLoan(us, { ...price, downPayment: { unit: 'percent', value: 1.2 } })
    expect(estimate.issue).toBe('downPercentOver100')
    expect(estimate.figures).toBeNull()
  })

  it('stays exact with very large numbers and decimals', () => {
    const { figures } = estimateCarLoan(us, { ...price, vehiclePrice: 987_654_321.99, fees: 0.01 })
    const loan = 987_654_321.99 * 1.06 + 0.01 - 3_000
    expect(figures!.loanAmount).toBeCloseTo(loan, 4)
    expect(figures!.payment * annuityFactor(0.005, 60)).toBeCloseTo(loan, 4)
  })
})

describe('budget mode', () => {
  it('works out the most the budget can borrow', () => {
    const { figures } = estimateCarLoan(us, budget)
    expect(figures!.loanAmount).toBeCloseTo(500 * annuityFactor(0.005, 60), 8)
    expect(figures!.totalOfPayments).toBe(30_000)
    expect(figures!.totalInterest).toBeCloseTo(30_000 - figures!.loanAmount, 8)
  })

  it('reverses a fixed down payment into the price that fits', () => {
    const { figures } = estimateCarLoan(us, budget)
    const maxLoan = 500 * annuityFactor(0.005, 60)
    expect(figures!.vehiclePrice).toBeCloseTo((maxLoan - 500 + 3_000) / 1.06, 8)
  })

  it('reverses a percentage down payment into the price that fits', () => {
    const { figures } = estimateCarLoan(us, { ...budget, downPayment: { unit: 'percent', value: 0.1 } })
    const maxLoan = 500 * annuityFactor(0.005, 60)
    expect(figures!.vehiclePrice).toBeCloseTo((maxLoan - 500) / (1 + 0.06 - 0.1), 8)
    expect(figures!.downPayment).toBeCloseTo(figures!.vehiclePrice * 0.1, 8)
  })

  it('handles a zero APR', () => {
    const { figures } = estimateCarLoan(us, { ...budget, apr: 0 })
    expect(figures!.loanAmount).toBe(30_000)
    expect(figures!.totalInterest).toBe(0)
  })

  it('subtracts negative equity on the trade-in from the price that fits', () => {
    const plain = estimateCarLoan(us, budget).figures!
    const upsideDown = estimateCarLoan(us, { ...budget, tradeInValue: 8_000, tradeInOwed: 10_000 }).figures!
    expect(plain.vehiclePrice - upsideDown.vehiclePrice).toBeCloseTo(2_000 / 1.06, 8)
  })

  it('has no figures for an empty or zero budget', () => {
    expect(estimateCarLoan(us, { ...budget, monthlyBudget: null }).figures).toBeNull()
    expect(estimateCarLoan(us, { ...budget, monthlyBudget: 0 }).figures).toBeNull()
  })

  it('never returns a negative price', () => {
    const { figures } = estimateCarLoan(us, { ...budget, monthlyBudget: 10, fees: 50_000 })
    expect(figures!.vehiclePrice).toBe(0)
  })

  it('reports a down payment percentage that leaves no price to work out', () => {
    const estimate = estimateCarLoan(us, { ...budget, salesTax: 0, downPayment: { unit: 'percent', value: 1 } })
    expect(estimate.issue).toBe('budgetDivisor')
    expect(estimate.figures).toBeNull()
  })
})

describe('round trip', () => {
  it.each([
    ['a fixed down payment', { unit: 'amount' as const, value: 3_000 }],
    ['a percentage down payment', { unit: 'percent' as const, value: 0.15 }],
  ])('turns the price-mode payment back into the original price with %s', (_, downPayment) => {
    const input = { ...price, downPayment, tradeInValue: 6_000, tradeInOwed: 7_500 }
    const { payment } = estimateCarLoan(us, input).figures!
    const back = estimateCarLoan(us, { ...input, mode: 'budget', monthlyBudget: payment, vehiclePrice: null }).figures!
    expect(back.vehiclePrice).toBeCloseTo(30_000, 6)
  })
})

describe('defaults from the config', () => {
  it('uses the estimated APR for the condition and credit band when none is entered', () => {
    expect(estimateCarLoan(us, { ...price, apr: null })).toMatchObject({ apr: 0.075, aprEstimated: true })
    expect(estimateCarLoan(us, { ...price, apr: null, condition: 'used', creditBand: 'poor' }).apr).toBe(0.19)
    expect(estimateCarLoan(us, { ...price, apr: 0.05, creditBand: 'poor' })).toMatchObject({ apr: 0.05, aprEstimated: false })
  })

  it('uses the estimated sales tax when none is entered', () => {
    expect(estimateCarLoan(us, { ...price, salesTax: null })).toMatchObject({ salesTax: 0.06, salesTaxEstimated: true })
  })
})

describe('debt-to-income', () => {
  it('is only worked out with an income', () => {
    expect(estimateCarLoan(us, price).figures!.dti).toBeNull()
  })

  it('adds the new payment to the other debts, against gross monthly income', () => {
    const { figures } = estimateCarLoan(us, { ...price, annualIncome: 60_000, monthlyDebts: 400 })
    expect(figures!.dti!.ratio).toBeCloseTo((400 + figures!.payment) / 5_000, 10)
  })

  it('uses the budget as the payment in budget mode', () => {
    const { figures } = estimateCarLoan(us, { ...budget, annualIncome: 60_000, monthlyDebts: 400 })
    expect(figures!.dti!.ratio).toBeCloseTo(900 / 5_000, 10)
  })

  it('reads the ratio against the config thresholds', () => {
    expect(dtiLevel(us, 0.3599)).toBe('comfortable')
    expect(dtiLevel(us, 0.36)).toBe('upper')
    expect(dtiLevel(us, 0.43)).toBe('upper')
    expect(dtiLevel(us, 0.4301)).toBe('high')
  })
})

describe('charts', () => {
  it('pays the loan down to zero over the term', () => {
    const estimate = estimateCarLoan(us, price)
    const rows = estimateSchedule(estimate, 60)
    expect(rows).toHaveLength(60)
    expect(rows.at(-1)!.balance).toBe(0)
    expect(breakEvenMonth(30_000, rows)).toBeGreaterThan(0)
  })

  it('has no schedule when nothing is financed', () => {
    const estimate = estimateCarLoan(us, { ...price, downPayment: { unit: 'amount', value: 40_000 } })
    expect(estimateSchedule(estimate, 60)).toEqual([])
  })

  it('an extra monthly payment ends the loan sooner and saves interest', () => {
    const estimate = estimateCarLoan(us, price)
    const base = estimateAmortization(estimate, 60)!
    const extra = estimateAmortization(estimate, 60, 200)!
    expect(base.periodsSaved).toBe(0)
    expect(extra.rows.length).toBeLessThan(60)
    expect(extra.rows.at(-1)!.balance).toBe(0)
    expect(extra.periodsSaved).toBe(60 - extra.rows.length)
    expect(extra.interestSaved).toBeGreaterThan(0)
    expect(extra.totalInterest).toBeCloseTo(base.totalInterest - extra.interestSaved, 0)
    // The scheduled payment does not change.
    expect(extra.payment).toBeCloseTo(base.payment, 6)
  })
})

describe('Colombia', () => {
  const co = getCarLoanConfig('co')!
  const coPrice: CarLoanEstimateInput = {
    ...price,
    vehiclePrice: 80_000_000,
    downPayment: { unit: 'amount', value: 20_000_000 },
    tradeInValue: 15_000_000,
    tradeInOwed: 5_000_000,
    termMonths: 60,
    apr: 0.18,
    salesTax: null,
    fees: 2_000_000,
    insurance: { annual: 3_000_000, financed: true },
  }

  it('turns the E.A. rate into a monthly rate', () => {
    const { monthlyRate } = estimateCarLoan(co, coPrice)
    expect(monthlyRate).toBeCloseTo(1.18 ** (1 / 12) - 1, 12)
  })

  it('borrows price + costs + financed insurance − down − trade-in + still owed, with no sales tax', () => {
    const { figures, monthlyRate } = estimateCarLoan(co, coPrice)
    // 80M + 2M + 3M − 20M − 15M + 5M = 55M
    expect(figures?.loanAmount).toBe(55_000_000)
    expect(figures?.priceWithTax).toBe(80_000_000)
    expect(figures?.payment).toBeCloseTo(55_000_000 / annuityFactor(monthlyRate, 60), 6)
  })

  it('leaves insurance paid apart out of the loan', () => {
    const { figures } = estimateCarLoan(co, { ...coPrice, insurance: { annual: 3_000_000, financed: false } })
    expect(figures?.loanAmount).toBe(52_000_000)
    expect(figures?.insuranceAnnual).toBe(3_000_000)
    expect(figures?.insuranceFinanced).toBe(0)
  })

  it('ignores a sales tax even if one is passed', () => {
    const { figures } = estimateCarLoan(co, { ...coPrice, salesTax: 0.19 })
    expect(figures?.loanAmount).toBe(55_000_000)
  })

  it('budget mode inverts price mode, insurance included', () => {
    const forward = estimateCarLoan(co, coPrice).figures!
    const back = estimateCarLoan(co, {
      ...coPrice,
      mode: 'budget',
      vehiclePrice: null,
      monthlyBudget: forward.payment,
    }).figures!
    expect(back.vehiclePrice).toBeCloseTo(80_000_000, 2)
  })

  it('schedules with the monthly rate from E.A.', () => {
    const estimate = estimateCarLoan(co, coPrice)
    const rows = estimateSchedule(estimate, 60)
    expect(rows[0].interest).toBeCloseTo(55_000_000 * estimate.monthlyRate, 0)
  })
})
