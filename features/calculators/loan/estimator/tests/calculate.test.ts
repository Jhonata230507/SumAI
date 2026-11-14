import { describe, expect, it } from 'vitest'
import {
  buildSchedule,
  effectiveToNmv,
  estimateLoan,
  estimatedRate,
  fixedPayment,
  monthlyFromEffective,
  nmvToEffective,
  resolveRate,
  type LoanEstimateInput,
} from '../calculate'
import type { LoanCountryConfig } from '../config'

const config: LoanCountryConfig = {
  currency: 'COP',
  locale: 'es-CO',
  term: { minMonths: 6, maxMonths: 120, exampleMonths: 36 },
  rates: {
    average: 0.22,
    spreadByHistory: { excellent: -0.05, good: 0, fair: 0.03, low: 0.08 },
    usuryCap: 0.28,
  },
  dtiGuideline: 0.4,
  examples: { amount: 20_000_000, monthlyIncome: 4_500_000, monthlyDebts: 600_000, insuranceRate: 0.001, fees: 0 },
}

const base: LoanEstimateInput = {
  amount: 10_000_000,
  termMonths: 12,
  annualRate: 0.24,
  creditHistory: null,
  paymentType: 'fixed',
  monthlyIncome: null,
  monthlyDebts: 0,
  insuranceRate: 0,
  fees: 0,
}

describe('rates', () => {
  it('converts E.A. to monthly and N.M.V. both ways', () => {
    expect(monthlyFromEffective(0.12682503)).toBeCloseTo(0.01, 8)
    expect(nmvToEffective(0.12)).toBeCloseTo(0.12682503, 8)
    expect(effectiveToNmv(nmvToEffective(0.24))).toBeCloseTo(0.24, 10)
  })

  it('estimates from the average and the credit history', () => {
    expect(estimatedRate(config, null)).toBeCloseTo(0.22)
    expect(estimatedRate(config, 'excellent')).toBeCloseTo(0.17)
    expect(estimatedRate(config, 'fair')).toBeCloseTo(0.25)
  })

  it('never estimates above the usury cap', () => {
    expect(estimatedRate(config, 'low')).toBe(0.28)
  })

  it('uses a typed rate and flags it above the usury cap', () => {
    expect(resolveRate(config, { annualRate: 0.2, creditHistory: 'low' })).toEqual({
      rate: 0.2,
      source: 'typed',
      overUsury: false,
    })
    expect(resolveRate(config, { annualRate: 0.3, creditHistory: null }).overUsury).toBe(true)
    expect(resolveRate(config, { annualRate: null, creditHistory: null }).source).toBe('estimated')
  })
})

describe('fixed payment', () => {
  it('matches the annuity formula', () => {
    const i = 0.01
    expect(fixedPayment(1_000_000, i, 12)).toBeCloseTo((1_000_000 * i) / (1 - Math.pow(1 + i, -12)), 6)
  })

  it('splits the amount evenly at zero interest', () => {
    expect(fixedPayment(1_200_000, 0, 12)).toBe(100_000)
  })

  it('pays the same every month and ends at zero', () => {
    const rows = buildSchedule(10_000_000, 0.015, 24, 'fixed', 0)
    const payment = fixedPayment(10_000_000, 0.015, 24)
    for (const row of rows) expect(row.payment).toBeCloseTo(payment, 6)
    expect(rows.at(-1)?.balance).toBeCloseTo(0, 6)
    expect(rows.reduce((total, row) => total + row.principal, 0)).toBeCloseTo(10_000_000, 6)
  })
})

describe('decreasing payment', () => {
  it('pays capital/n plus interest on the previous balance', () => {
    const amount = 12_000_000
    const i = 0.02
    const rows = buildSchedule(amount, i, 12, 'decreasing', 0)
    let balance = amount
    for (const row of rows) {
      expect(row.payment).toBeCloseTo(amount / 12 + balance * i, 6)
      balance -= amount / 12
    }
    expect(rows[0].payment).toBeGreaterThan(rows[11].payment)
    expect(rows.at(-1)?.balance).toBeCloseTo(0, 6)
  })

  it('costs less interest than a fixed payment', () => {
    const fixed = estimateLoan(config, base).figures!
    const decreasing = estimateLoan(config, { ...base, paymentType: 'decreasing' }).figures!
    expect(decreasing.totalInterest).toBeLessThan(fixed.totalInterest)
    expect(decreasing.firstPayment).toBeGreaterThan(fixed.firstPayment)
  })
})

describe('insurance and fees', () => {
  it('adds insurance on the balance at the start of each month', () => {
    const rows = buildSchedule(10_000_000, 0.015, 12, 'fixed', 0.001)
    expect(rows[0].insurance).toBeCloseTo(10_000, 6)
    expect(rows[1].insurance).toBeCloseTo(rows[0].balance * 0.001, 6)
    expect(rows[0].payment).toBeCloseTo(fixedPayment(10_000_000, 0.015, 12) + 10_000, 6)
  })

  it('totals every payment and the fees', () => {
    const { figures } = estimateLoan(config, { ...base, insuranceRate: 0.001, fees: 250_000 })
    expect(figures).not.toBeNull()
    const f = figures!
    expect(f.totalCost).toBeCloseTo(10_000_000 + f.totalInterest + f.totalInsurance + 250_000, 4)
    expect(f.costOfCredit).toBeCloseTo(f.totalInterest + f.totalInsurance + 250_000, 4)
    expect(f.firstInsurance).toBeCloseTo(10_000, 6)
  })
})

describe('estimateLoan', () => {
  it('waits for the amount and the term', () => {
    expect(estimateLoan(config, { ...base, amount: null }).figures).toBeNull()
    expect(estimateLoan(config, { ...base, termMonths: null }).figures).toBeNull()
    expect(estimateLoan(config, { ...base, termMonths: 0 }).figures).toBeNull()
  })

  it('uses the estimated rate when none is typed', () => {
    const { figures, rate } = estimateLoan(config, { ...base, annualRate: null, creditHistory: 'excellent' })
    expect(rate.source).toBe('estimated')
    expect(figures?.annualRate).toBeCloseTo(0.17)
  })

  it('measures the payment and all debts against income', () => {
    const { figures } = estimateLoan(config, { ...base, monthlyIncome: 5_000_000, monthlyDebts: 500_000 })
    expect(figures?.dti?.payment).toBeCloseTo(figures!.firstPayment / 5_000_000, 10)
    expect(figures?.dti?.total).toBeCloseTo((figures!.firstPayment + 500_000) / 5_000_000, 10)
    expect(estimateLoan(config, base).figures?.dti).toBeNull()
  })

  it('reports the first and last payment', () => {
    const { figures } = estimateLoan(config, { ...base, paymentType: 'decreasing' })
    expect(figures!.firstPayment).toBeGreaterThan(figures!.lastPayment)
    expect(figures!.months).toBe(12)
  })
})
