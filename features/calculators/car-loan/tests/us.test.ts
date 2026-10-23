import { describe, expect, it } from 'vitest'
import { getBenchmarks } from '@/lib/countries'
import { NATIONAL_SALES_TAX, estimateAutoRate, estimateSalesTax } from '../us'

const benchmarks = getBenchmarks('us')

describe('estimateAutoRate', () => {
  it('starts from the new-car average when nothing is known', () => {
    expect(estimateAutoRate(benchmarks, null, null)).toBeCloseTo(benchmarks.carLoanNew, 5)
  })

  it('prices used cars higher, and lower credit higher still', () => {
    const newPrime = estimateAutoRate(benchmarks, 'new', '700-759')
    const usedPrime = estimateAutoRate(benchmarks, 'used', '700-759')
    const usedSubprime = estimateAutoRate(benchmarks, 'used', '580-619')
    expect(usedPrime).toBeGreaterThan(newPrime)
    expect(usedSubprime).toBeGreaterThan(usedPrime)
    expect(estimateAutoRate(benchmarks, 'new', '760+')).toBeLessThan(newPrime)
  })
})

describe('estimateSalesTax', () => {
  it('uses the state average once the ZIP is known, the national one before', () => {
    expect(estimateSalesTax('77001')).toMatchObject({ state: 'TX', rate: 0.082 })
    expect(estimateSalesTax('97201')).toMatchObject({ state: 'OR', rate: 0 }) // no sales tax
    expect(estimateSalesTax('')).toMatchObject({ state: null, rate: NATIONAL_SALES_TAX })
  })
})
