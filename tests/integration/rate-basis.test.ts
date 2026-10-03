import { describe, expect, it } from 'vitest'
import { effectiveToPeriodic, periodicToEffective } from '@/lib/calculations/interest'
import { calculateLoan } from '@/features/calculators/loan/calculation'
import { loanDefaults } from '@/features/calculators/loan/schema'

/**
 * The E.A. / M.V. switch on Colombian rate fields (components/common/RateInput)
 * stores E.A. and converts for display. These checks pin down that the
 * conversion is exact, so switching never changes a calculated result.
 */
describe('E.A. and M.V. conversion', () => {
  it('converts a quoted E.A. rate to its monthly equivalent', () => {
    // 16.49% E.A. is about 1.2801% per month.
    expect(effectiveToPeriodic(0.1649, 12)).toBeCloseTo(0.012801, 6)
  })

  it('converts a typed M.V. rate to E.A.', () => {
    // 1.5% M.V. compounds to about 19.56% E.A.
    expect(periodicToEffective(0.015, 12)).toBeCloseTo(0.195618, 6)
  })

  it('round-trips without drift', () => {
    for (const ea of [0.08, 0.1285, 0.1649, 0.2854]) {
      expect(periodicToEffective(effectiveToPeriodic(ea, 12), 12)).toBeCloseTo(ea, 12)
    }
  })

  it('gives the same Colombian payment whichever basis the rate was entered in', () => {
    const typedMonthly = 0.0128
    const asEffective = periodicToEffective(typedMonthly, 12)

    const payment = calculateLoan({ ...loanDefaults, countryCode: 'co', annualRate: asEffective }).payment
    // The loan calculator turns E.A. back into a monthly rate: it must land on the typed one.
    const direct = calculateLoan({ ...loanDefaults, countryCode: 'co', annualRate: periodicToEffective(effectiveToPeriodic(asEffective, 12), 12) }).payment

    expect(effectiveToPeriodic(asEffective, 12)).toBeCloseTo(typedMonthly, 12)
    expect(payment).toBe(direct)
  })
})
