import { describe, expect, it } from 'vitest'
import { buildAmortizationSchedule } from '../amortization'
import { amortizationInsights } from '../amortization-insights'

const schedule = (principal: number, periodicRate: number, periods: number) =>
  buildAmortizationSchedule({ principal, periodicRate, periods }).rows

describe('amortizationInsights', () => {
  it('goes yearly past three years and monthly up to three', () => {
    expect(amortizationInsights(schedule(100_000, 0.01, 240)).unit).toBe('year')
    expect(amortizationInsights(schedule(100_000, 0.01, 240)).bars).toHaveLength(20)
    expect(amortizationInsights(schedule(10_000, 0.01, 36)).unit).toBe('month')
    expect(amortizationInsights(schedule(10_000, 0.01, 36)).bars).toHaveLength(36)
  })

  it('totals principal and interest, and the share of interest', () => {
    const insights = amortizationInsights(schedule(100_000, 0.01, 240))
    expect(insights.totalPrincipal).toBeCloseTo(100_000, 0)
    expect(insights.interestShare).toBeCloseTo(insights.totalInterest / (100_000 + insights.totalInterest), 4)
  })

  it('finds the first year principal reaches the interest', () => {
    const insights = amortizationInsights(schedule(100_000, 0.01, 240))
    const at = insights.bars.find((bar) => bar.x === insights.crossover)!
    expect(at.principal).toBeGreaterThanOrEqual(at.interest)
    const before = insights.bars.find((bar) => bar.x === insights.crossover! - 1)!
    expect(before.principal).toBeLessThan(before.interest)
  })

  it('says principal leads from the start on a short, cheap loan', () => {
    expect(amortizationInsights(schedule(10_000, 0.005, 24)).crossover).toBe(1)
  })

  it('finds when half the principal is repaid, later than half the term on a long loan', () => {
    const insights = amortizationInsights(schedule(100_000, 0.01, 240))
    expect(insights.halfPaid).toBeGreaterThan(10)
    const repaid = insights.bars.filter((bar) => bar.x <= insights.halfPaid!).reduce((s, b) => s + b.principal, 0)
    expect(repaid).toBeGreaterThanOrEqual(50_000)
  })

  it('handles an empty schedule', () => {
    const insights = amortizationInsights([])
    expect(insights.bars).toEqual([])
    expect(insights.crossover).toBeNull()
    expect(insights.halfPaid).toBeNull()
    expect(insights.interestShare).toBe(0)
  })
})
