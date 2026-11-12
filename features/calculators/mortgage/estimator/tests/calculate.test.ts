import { describe, expect, it } from 'vitest'
import {
  addMonths,
  annuityFactor,
  estimateMortgage,
  mortgageWhatIfs,
  resolveRate,
  type MortgageEstimateInput,
} from '../calculate'
import { getMortgageConfig } from '../config'

const us = getMortgageConfig('us')!

const price: MortgageEstimateInput = {
  mode: 'price',
  homePrice: 400_000,
  monthlyBudget: null,
  downPayment: { unit: 'percent', value: 0.2 },
  program: 'conventional',
  financeUpfrontFee: true,
  termMonths: 360,
  postalCode: '',
  annualIncome: null,
  monthlyDebts: 0,
  creditBand: null,
  rate: 0.065,
  propertyTax: { unit: 'amount', value: null },
  insuranceAnnual: null,
  mortgageInsuranceRate: null,
  hoaMonthly: 0,
  extraMonthly: 0,
  startDate: null,
}

const figuresOf = (input: Partial<MortgageEstimateInput>) => estimateMortgage(us, { ...price, ...input }).figures!
const pAndI = (loan: number, rate: number, months: number) => {
  const r = rate / 12
  return (loan * r) / (1 - (1 + r) ** -months)
}

describe('price mode', () => {
  it('works out principal and interest with the annuity formula', () => {
    const figures = figuresOf({})
    expect(figures.loanAmount).toBeCloseTo(320_000, 8)
    expect(figures.monthly.principalAndInterest).toBeCloseTo(pAndI(320_000, 0.065, 360), 8)
  })

  it('adds estimated tax and insurance, and no mortgage insurance at 20% down', () => {
    const { monthly } = figuresOf({})
    // National property tax 0.9% and insurance 0.5% of the price, a year.
    expect(monthly.propertyTax).toBeCloseTo((400_000 * 0.009) / 12, 8)
    expect(monthly.insurance).toBeCloseTo((400_000 * 0.005) / 12, 8)
    expect(monthly.mortgageInsurance).toBe(0)
    expect(monthly.total).toBeCloseTo(monthly.principalAndInterest + monthly.propertyTax + monthly.insurance, 8)
  })

  it('takes a dollar down payment and shows its share and the loan-to-value', () => {
    const figures = figuresOf({ downPayment: { unit: 'amount', value: 40_000 } })
    expect(figures.downRatio).toBeCloseTo(0.1, 10)
    expect(figures.loanToValue).toBeCloseTo(0.9, 10)
  })

  it('handles a zero rate', () => {
    const figures = figuresOf({ rate: 0 })
    expect(figures.monthly.principalAndInterest).toBeCloseTo(320_000 / 360, 8)
    expect(figures.totalInterest).toBeCloseTo(0, 6)
  })

  it('has no figures until a price is entered', () => {
    expect(estimateMortgage(us, { ...price, homePrice: null }).figures).toBeNull()
  })

  it('reports a down payment of 100% or more, or above the price', () => {
    expect(estimateMortgage(us, { ...price, downPayment: { unit: 'percent', value: 1 } }).issue).toBe('downPercentTooHigh')
    expect(estimateMortgage(us, { ...price, downPayment: { unit: 'amount', value: 500_000 } }).issue).toBe('downOverPrice')
  })
})

describe('property tax, insurance and the ZIP', () => {
  it('uses the state rate when the ZIP places the home', () => {
    const estimate = estimateMortgage(us, { ...price, postalCode: '78701' })
    expect(estimate.region).toEqual({ code: 'TX', name: 'Texas' })
    expect(estimate.figures!.propertyTaxAnnual).toBeCloseTo(400_000 * 0.0147, 6)
  })

  it('falls back to the national rate for an incomplete or unknown ZIP, and never blocks', () => {
    for (const postalCode of ['', '787', '00000']) {
      const estimate = estimateMortgage(us, { ...price, postalCode })
      expect(estimate.figures!.propertyTaxAnnual).toBeCloseTo(400_000 * 0.009, 6)
    }
  })

  it('takes property tax as a yearly amount or as a share of the price', () => {
    expect(figuresOf({ propertyTax: { unit: 'amount', value: 6_000 } }).propertyTaxAnnual).toBe(6_000)
    expect(figuresOf({ propertyTax: { unit: 'percent', value: 0.012 } }).propertyTaxAnnual).toBeCloseTo(4_800, 8)
  })

  it('uses a typed insurance amount instead of the estimate', () => {
    expect(figuresOf({ insuranceAnnual: 3_000 }).monthly.insurance).toBeCloseTo(250, 10)
  })
})

describe('rates', () => {
  it('estimates a 15-year loan below a 30-year one', () => {
    const thirty = resolveRate(us, { ...price, rate: null })
    const fifteen = resolveRate(us, { ...price, rate: null, termMonths: 180 })
    expect(thirty.estimated).toBe(true)
    expect(fifteen.rate).toBeLessThan(thirty.rate)
  })

  it('moves the estimate with the program and the credit band', () => {
    const base = resolveRate(us, { ...price, rate: null }).rate
    expect(resolveRate(us, { ...price, rate: null, creditBand: '620-659' }).rate).toBeGreaterThan(base)
    expect(resolveRate(us, { ...price, rate: null, program: 'va' }).rate).toBeLessThan(base)
  })

  it('takes the nearest term in the table for any typed term, and the example term before one is typed', () => {
    const twentyFive = resolveRate(us, { ...price, rate: null, termMonths: 300 }).rate
    expect([resolveRate(us, { ...price, rate: null, termMonths: 240 }).rate, resolveRate(us, { ...price, rate: null }).rate]).toContain(twentyFive)
    expect(resolveRate(us, { ...price, rate: null, termMonths: Number.NaN }).rate).toBe(resolveRate(us, { ...price, rate: null }).rate)
  })

  it('has no figures until a term is typed', () => {
    expect(estimateMortgage(us, { ...price, termMonths: Number.NaN }).figures).toBeNull()
  })

  it('uses the rate the user typed', () => {
    expect(resolveRate(us, { ...price, rate: 0.059 })).toEqual({ rate: 0.059, estimated: false })
  })
})

describe('mortgage insurance by program', () => {
  it('conventional: PMI under 20% down, dropped once the balance reaches 78% of the price', () => {
    const figures = figuresOf({ downPayment: { unit: 'percent', value: 0.1 } })
    expect(figures.mortgageInsurance).not.toBeNull()
    expect(figures.mortgageInsurance!.forLife).toBe(false)
    const ends = figures.mortgageInsurance!.months
    expect(figures.rows[ends - 1].balance).toBeLessThanOrEqual(0.78 * 400_000)
    expect(figures.rows[ends - 2].balance).toBeGreaterThan(0.78 * 400_000)
  })

  it('conventional: PMI costs more with a weaker credit score', () => {
    const strong = figuresOf({ downPayment: { unit: 'percent', value: 0.05 }, creditBand: '760+' })
    const weak = figuresOf({ downPayment: { unit: 'percent', value: 0.05 }, creditBand: '620-659' })
    expect(weak.monthly.mortgageInsurance).toBeGreaterThan(strong.monthly.mortgageInsurance)
  })

  it('takes a mortgage insurance override', () => {
    const figures = figuresOf({ downPayment: { unit: 'percent', value: 0.1 }, mortgageInsuranceRate: 0.004 })
    expect(figures.monthly.mortgageInsurance).toBeCloseTo((0.004 * figures.loanAmount) / 12, 10)
  })

  it('FHA: finances the upfront premium and keeps the annual premium for life under 10% down', () => {
    const figures = figuresOf({ program: 'fha', downPayment: { unit: 'percent', value: 0.035 } })
    const base = 400_000 * 0.965
    expect(figures.upfrontFee).toBeCloseTo(base * 0.0175, 6)
    expect(figures.loanAmount).toBeCloseTo(base * 1.0175, 6)
    expect(figures.mortgageInsurance!.annualRate).toBe(0.0055)
    expect(figures.mortgageInsurance!.forLife).toBe(true)
  })

  it('FHA: with 10% down the annual premium lasts 11 years', () => {
    const figures = figuresOf({ program: 'fha', downPayment: { unit: 'percent', value: 0.1 } })
    expect(figures.mortgageInsurance).toMatchObject({ months: 132, forLife: false })
  })

  it('pays the upfront fee at closing when it is not financed', () => {
    const figures = figuresOf({ program: 'fha', downPayment: { unit: 'percent', value: 0.035 }, financeUpfrontFee: false })
    expect(figures.loanAmount).toBeCloseTo(400_000 * 0.965, 6)
    expect(figures.cashAtClosing).toBeCloseTo(400_000 * 0.035 + figures.upfrontFee, 6)
  })

  it('VA: no monthly insurance, and a funding fee that falls as the down payment rises', () => {
    const none = figuresOf({ program: 'va', downPayment: { unit: 'percent', value: 0 } })
    const ten = figuresOf({ program: 'va', downPayment: { unit: 'percent', value: 0.1 } })
    expect(none.mortgageInsurance).toBeNull()
    expect(none.upfrontFee / none.baseLoan).toBeCloseTo(0.0215, 10)
    expect(ten.upfrontFee / ten.baseLoan).toBeCloseTo(0.0125, 10)
  })

  it('USDA: a guarantee fee upfront and a small annual fee for life', () => {
    const figures = figuresOf({ program: 'usda', downPayment: { unit: 'percent', value: 0 } })
    expect(figures.upfrontFee).toBeCloseTo(4_000, 6)
    expect(figures.mortgageInsurance).toMatchObject({ annualRate: 0.0035, forLife: true })
  })

  it('flags a down payment below the program minimum without blocking', () => {
    expect(figuresOf({ program: 'fha', downPayment: { unit: 'percent', value: 0.02 } }).belowMinimumDown).toBe(0.035)
    expect(
      figuresOf({ program: 'fha', creditBand: '<580', downPayment: { unit: 'percent', value: 0.05 } }).belowMinimumDown,
    ).toBe(0.1)
    expect(figuresOf({}).belowMinimumDown).toBeNull()
  })
})

describe('extra principal and dates', () => {
  it('pays the loan off early and saves interest, simulated month by month', () => {
    const plain = figuresOf({})
    const extra = figuresOf({ extraMonthly: 500 })
    expect(plain.payoffMonths).toBe(360)
    expect(extra.payoffMonths).toBeLessThan(360)
    expect(extra.rows.at(-1)!.balance).toBe(0)
    expect(extra.monthsSaved).toBe(360 - extra.payoffMonths)
    expect(extra.interestSaved).toBeCloseTo(plain.totalInterest - extra.totalInterest, 4)
  })

  it('dates the last payment from the start date', () => {
    expect(figuresOf({ startDate: { year: 2026, month: 1 } }).payoffDate).toEqual({ year: 2055, month: 12 })
    expect(figuresOf({}).payoffDate).toBeNull()
    expect(addMonths({ year: 2026, month: 11 }, 2)).toEqual({ year: 2027, month: 1 })
  })
})

describe('debt-to-income', () => {
  it('is only worked out with an income', () => {
    expect(figuresOf({}).dti).toBeNull()
  })

  it('divides the housing payment, then all debts, by gross monthly income, with the program guidelines', () => {
    const figures = figuresOf({ annualIncome: 120_000, monthlyDebts: 600 })
    expect(figures.dti!.front).toBeCloseTo(figures.monthly.total / 10_000, 10)
    expect(figures.dti!.back).toBeCloseTo((figures.monthly.total + 600) / 10_000, 10)
    expect(figures.dti).toMatchObject({ frontLimit: 0.28, backLimit: 0.36 })
  })
})

describe('budget mode', () => {
  const budgetOf = (input: Partial<MortgageEstimateInput>) => {
    const { monthly } = figuresOf(input)
    return estimateMortgage(us, { ...price, ...input, mode: 'budget', homePrice: null, monthlyBudget: monthly.total })
  }

  it.each([
    ['20% down, no PMI', {}],
    ['10% down, with PMI', { downPayment: { unit: 'percent' as const, value: 0.1 } }],
    ['a dollar down payment', { downPayment: { unit: 'amount' as const, value: 25_000 } }],
    ['FHA with a financed fee', { program: 'fha' as const, downPayment: { unit: 'percent' as const, value: 0.035 } }],
    ['VA with no down payment', { program: 'va' as const, downPayment: { unit: 'percent' as const, value: 0 } }],
    ['a state tax rate and HOA', { postalCode: '07030', hoaMonthly: 250 }],
  ])('returns the price that produces the budget, with %s', (_, input) => {
    expect(budgetOf(input).figures!.homePrice).toBeCloseTo(400_000, 2)
  })

  it('keeps the monthly total within the budget', () => {
    const estimate = estimateMortgage(us, { ...price, mode: 'budget', homePrice: null, monthlyBudget: 3_000 })
    expect(estimate.figures!.monthly.total).toBeLessThanOrEqual(3_000 + 1e-6)
  })

  it('reports a budget that does not cover the costs before any loan', () => {
    const estimate = estimateMortgage(us, { ...price, mode: 'budget', homePrice: null, monthlyBudget: 300, hoaMonthly: 400 })
    expect(estimate.issue).toBe('budgetTooLow')
  })

  it('has no figures for an empty budget', () => {
    expect(estimateMortgage(us, { ...price, mode: 'budget', monthlyBudget: null }).figures).toBeNull()
  })
})

describe('what if', () => {
  it('offers the variants that apply, each with its effect', () => {
    const variants = mortgageWhatIfs(us, { ...price, downPayment: { unit: 'percent', value: 0.1 } })
    expect(variants.map((v) => v.id)).toEqual(['fifteen-year', 'twenty-percent-down', 'extra-200', 'rate-drop'])
    const fifteen = variants.find((v) => v.id === 'fifteen-year')!
    expect(fifteen.costDelta).toBeLessThan(0)
    expect(fifteen.paymentDelta).toBeGreaterThan(0)
  })

  it('leaves out 20% down when it is already there', () => {
    expect(mortgageWhatIfs(us, price).map((v) => v.id)).not.toContain('twenty-percent-down')
  })

  it('agrees with the annuity factor', () => {
    expect(annuityFactor(0, 12)).toBe(12)
  })
})
