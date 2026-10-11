import { describe, expect, it } from 'vitest'
import { SAMPLE_PRODUCTS, findSampleProducts } from '../sample-catalog'
import { rankProducts } from '../rank-products'

describe('sample catalogue', () => {
  it('has at least three lenders for every credit category in Colombia and the US', () => {
    for (const countryCode of ['co', 'us'] as const) {
      for (const category of ['mortgage', 'car-loan', 'personal-loan', 'savings'] as const) {
        const lenders = new Set(
          SAMPLE_PRODUCTS.filter((p) => p.countryCode === countryCode && p.category === category).map((p) => p.providerId),
        )
        expect(lenders.size, `${countryCode} ${category}`).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('applies the same amount and term filters as the database query', () => {
    const found = findSampleProducts({ category: 'mortgage', countryCode: 'co', amount: 1_176_000_000, termMonths: 240 })
    expect(found.length).toBeGreaterThan(0)
    for (const p of found) {
      expect(p.amountMin).toBeLessThanOrEqual(1_176_000_000)
      expect(p.amountMax).toBeGreaterThanOrEqual(1_176_000_000)
      expect(p.termMonthsMax).toBeGreaterThanOrEqual(240)
    }
    expect(findSampleProducts({ category: 'car-loan', countryCode: 'co', amount: 9e12 })).toHaveLength(0)
  })

  it('ranks the cheapest eligible lender first and estimates its payment', () => {
    const products = findSampleProducts({ category: 'personal-loan', countryCode: 'co', amount: 100e6, termMonths: 60 })
    const ranked = rankProducts(products, { category: 'personal-loan', countryCode: 'co', amount: 100e6, termMonths: 60 })
    expect(ranked.matches[0].product.rateMin).toBe(ranked.bestRate)
    expect(ranked.matches[0].estimatedPayment).toBeGreaterThan(0)
  })

  it('pushes lenders the user does not qualify for below the ones they do', () => {
    const products = findSampleProducts({ category: 'mortgage', countryCode: 'us', amount: 300e3, termMonths: 360 })
    const ranked = rankProducts(products, {
      category: 'mortgage',
      countryCode: 'us',
      amount: 300e3,
      termMonths: 360,
      creditScore: 650,
      includeIneligible: true,
    })
    const firstIneligible = ranked.matches.findIndex((m) => !m.eligible)
    const lastEligible = ranked.matches.map((m) => m.eligible).lastIndexOf(true)
    expect(firstIneligible).toBeGreaterThan(lastEligible)
  })
})

describe('savings ranking', () => {
  it('puts the highest-yielding account first', () => {
    const products = findSampleProducts({ category: 'savings', countryCode: 'us', amount: 20_000 })
    const ranked = rankProducts(products, { category: 'savings', countryCode: 'us', amount: 20_000 })
    expect(ranked.bestRate).toBe(Math.max(...products.map((p) => p.rateMin)))
    expect(ranked.matches[0].product.rateMin).toBe(ranked.bestRate)
  })
})

describe('cost ranking', () => {
  it('ranks by total cost — interest plus fees — when the amount and term are known', () => {
    const query = { category: 'mortgage' as const, countryCode: 'us' as const, amount: 336_000, termMonths: 360 }
    const ranked = rankProducts(findSampleProducts(query), query)
    const cost = (m: (typeof ranked.matches)[number]) => m.estimatedPayment! * 360 + m.product.originationFee
    const costs = ranked.matches.map(cost)
    expect(costs).toEqual([...costs].sort((a, b) => a - b))
  })
})

describe('near misses', () => {
  it('keeps lenders that do not cover the amount, below the ones that do, with the reason', () => {
    const query = { category: 'personal-loan' as const, countryCode: 'us' as const, amount: 80_000, termMonths: 60, includeIneligible: true }
    const ranked = rankProducts(findSampleProducts({ category: 'personal-loan', countryCode: 'us' }), query)
    expect(ranked.matches.length).toBeGreaterThanOrEqual(3)
    expect(ranked.matches[0].eligible).toBe(true) // the $100K lender
    const miss = ranked.matches.find((m) => !m.eligible)!
    expect(miss.reasons.some((r) => r.startsWith('Lends up to'))).toBe(true)
  })
})
