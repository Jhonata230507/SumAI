import { describe, expect, it } from 'vitest'
import { calculateMortgageSystems, type MortgageSystemId } from '../systems'

const input = { principal: 120_000_000, termMonths: 240, pesoRate: 0.1285, uvrRate: 0.075, inflation: 0.05 }
const byId = (id: MortgageSystemId, overrides = {}) =>
  calculateMortgageSystems({ ...input, ...overrides }).find((s) => s.id === id)!

describe('calculateMortgageSystems', () => {
  it('keeps the peso fixed payment flat and repays exactly the principal plus interest', () => {
    const s = byId('fixed-payment-cop')
    expect(s.firstPayment).toBe(s.lastPayment)
    expect(s.totalPaid).toBeCloseTo(s.firstPayment * 240, -2)
    expect(s.totalPaid).toBeGreaterThan(input.principal)
  })

  it('starts the peso fixed-principal payment higher and ends it lower', () => {
    const fixed = byId('fixed-payment-cop')
    const s = byId('fixed-principal-cop')
    expect(s.firstPayment).toBeGreaterThan(fixed.firstPayment)
    expect(s.lastPayment).toBeLessThan(fixed.lastPayment)
    // Principal goes down faster, so less interest overall.
    expect(s.totalPaid).toBeLessThan(fixed.totalPaid)
    // Last payment: one slice of principal plus a month of interest on it.
    expect(s.lastPayment).toBeCloseTo((input.principal / 240) * (1 + (1.1285 ** (1 / 12) - 1)), 0)
  })

  it('grows the UVR fixed payment in pesos at the projected inflation', () => {
    const s = byId('fixed-payment-uvr')
    expect(s.lastPayment).toBeGreaterThan(s.firstPayment)
    // 239 months of 5% a year between the first and last payment.
    expect(s.lastPayment / s.firstPayment).toBeCloseTo(1.05 ** (239 / 12), 6)
  })

  it('matches the peso systems when there is no inflation and the rates agree', () => {
    const flat = { uvrRate: input.pesoRate, inflation: 0 }
    expect(byId('fixed-payment-uvr', flat).firstPayment).toBeCloseTo(byId('fixed-payment-cop').firstPayment, 2)
    expect(byId('fixed-principal-uvr', flat).totalPaid).toBeCloseTo(byId('fixed-principal-cop').totalPaid, 2)
  })

  it('returns one payment per month for every system', () => {
    for (const s of calculateMortgageSystems(input)) expect(s.payments).toHaveLength(240)
  })
})

describe('calculateMortgageSystems schedules', () => {
  it('matches the main mortgage schedule for the peso fixed payment, extra payments included', async () => {
    const { buildAmortizationSchedule } = await import('@/lib/calculations/amortization')
    const extra = 500_000
    const main = buildAmortizationSchedule({
      principal: input.principal,
      periodicRate: 1.1285 ** (1 / 12) - 1,
      periods: 240,
      extraPerPeriod: extra,
    })
    const s = byId('fixed-payment-cop', { extraPayment: extra })
    expect(s.rows).toHaveLength(main.rows.length)
    expect(s.totalPaid).toBeCloseTo(main.totalPaid, -3)
  })

  it('pays off the whole balance in every system', () => {
    for (const s of calculateMortgageSystems(input)) {
      expect(s.rows.at(-1)!.balance).toBeLessThan(1)
    }
  })

  it('shortens every system when paying extra principal', () => {
    for (const s of calculateMortgageSystems({ ...input, extraPayment: 1_000_000 })) {
      expect(s.rows.length).toBeLessThan(240)
    }
  })
})
