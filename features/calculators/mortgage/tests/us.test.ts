import { describe, expect, it } from 'vitest'
import { calculateMortgage } from '../calculation'
import { mortgageDefaults } from '../schema'
import { estimatePropertyTax, estimateRate, loanRules, zipToState } from '../us'
import { getBenchmarks } from '@/lib/countries'
import type { MortgageInput } from '../types'

const us: MortgageInput = { ...mortgageDefaults, loanType: 'conventional', creditBand: '700-759' }

describe('zipToState', () => {
  it('maps ZIP prefixes to states, exceptions included', () => {
    expect(zipToState('10001')).toBe('NY')
    expect(zipToState('73301')).toBe('TX') // Austin IRS ZIP, inside the Oklahoma range
    expect(zipToState('90210')).toBe('CA')
    expect(zipToState('05501')).toBe('MA')
    expect(zipToState('20001')).toBe('DC')
    expect(zipToState('99501')).toBe('AK')
  })

  it('rejects anything that is not a 5-digit ZIP', () => {
    expect(zipToState('1234')).toBeNull()
    expect(zipToState('abcde')).toBeNull()
    expect(zipToState('00901')).toBeNull() // Puerto Rico: not a state
  })
})

describe('estimatePropertyTax', () => {
  it('uses the state average once the ZIP is known, the national one before', () => {
    expect(estimatePropertyTax(400_000, '77001')).toMatchObject({ state: 'TX', annual: 5_880 })
    expect(estimatePropertyTax(400_000, '')).toMatchObject({ state: null, annual: 3_600 })
  })
})

describe('estimateRate', () => {
  const benchmarks = getBenchmarks('us')
  it('starts from the market average and moves with credit and loan type', () => {
    const base = estimateRate({ benchmarks, termMonths: 360, loanType: 'conventional', creditBand: null })
    expect(base).toBeCloseTo(benchmarks.mortgage30Year, 5)
    expect(estimateRate({ benchmarks, termMonths: 360, loanType: 'conventional', creditBand: '620-659' })).toBeGreaterThan(base)
    expect(estimateRate({ benchmarks, termMonths: 360, loanType: 'va', creditBand: null })).toBeLessThan(base)
    expect(estimateRate({ benchmarks, termMonths: 180, loanType: 'conventional', creditBand: null })).toBeCloseTo(
      benchmarks.mortgage15Year,
      5,
    )
  })
})

describe('US loan types', () => {
  it('adds conventional PMI only under 20% down, until 80% loan-to-value', () => {
    expect(calculateMortgage(us).requiresMortgageInsurance).toBe(false)
    const low = calculateMortgage({ ...us, downPayment: 21_000 })
    expect(low.requiresMortgageInsurance).toBe(true)
    expect(low.insuranceDuration).toEqual({ kind: 'until-equity' })
    expect(low.mortgageInsuranceEndsPeriod).toBeGreaterThan(0)
  })

  it('finances the FHA upfront MIP and keeps annual MIP for life under 10% down', () => {
    const fha = calculateMortgage({ ...us, loanType: 'fha', downPayment: 14_700 }) // 3.5%
    const base = 420_000 - 14_700
    expect(fha.upfrontFee).toBeCloseTo(base * 0.0175, 2)
    expect(fha.loanAmount).toBeCloseTo(base * 1.0175, 2)
    expect(fha.monthly.mortgageInsurance).toBeCloseTo((fha.loanAmount * 0.0055) / 12, 2)
    expect(fha.insuranceDuration).toEqual({ kind: 'life' })
  })

  it('ends FHA MIP after 11 years with 10% or more down', () => {
    const fha = calculateMortgage({ ...us, loanType: 'fha', downPayment: 42_000 })
    expect(fha.mortgageInsuranceEndsPeriod).toBe(132)
  })

  it('charges VA a funding fee and no monthly insurance', () => {
    const va = calculateMortgage({ ...us, loanType: 'va', downPayment: 0 })
    expect(va.upfrontFee).toBeCloseTo(420_000 * 0.0215, 2)
    expect(va.monthly.mortgageInsurance).toBe(0)
  })

  it('requires 10% down for FHA below a 580 score', () => {
    expect(loanRules({ loanType: 'fha', downRatio: 0.05, termMonths: 360, creditBand: '<580' }).minDownRatio).toBe(0.1)
  })

  it('works out debt-to-income from gross income', () => {
    const r = calculateMortgage({ ...us, annualIncome: 120_000, monthlyDebts: 500 })
    expect(r.debtToIncome!.front).toBeCloseTo(r.monthly.total / 10_000, 4)
    expect(r.debtToIncome!.back).toBeCloseTo((r.monthly.total + 500) / 10_000, 4)
    expect(r.debtToIncome!.backLimit).toBe(0.36)
  })

  it('leaves calculations without a loan type unchanged', () => {
    const r = calculateMortgage(mortgageDefaults)
    expect(r.upfrontFee).toBe(0)
    expect(r.minDownRatio).toBeNull()
    expect(r.debtToIncome).toBeNull()
  })
})
