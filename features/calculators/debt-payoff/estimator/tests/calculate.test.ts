import { describe, expect, it } from 'vitest'
import { addMonths, planDebts, priorityOrder, type DebtPlanInput, type PlannerDebt } from '../calculate'
import { getDebtPayoffConfig } from '../config'

const us = getDebtPayoffConfig('us')!

const card: PlannerDebt = { id: 'card', name: 'Card', balance: 6_400, apr: 0.2299, minimum: 160 }
const store: PlannerDebt = { id: 'store', name: 'Store', balance: 1_800, apr: 0.2699, minimum: 55 }
const student: PlannerDebt = { id: 'student', name: 'Student', balance: 14_000, apr: 0.055, minimum: 180 }

const base: DebtPlanInput = {
  debts: [card, store, student],
  amount: 650,
  amountMode: 'total',
  oneTimeExtra: null,
  startDate: null,
}
const plan = (input: Partial<DebtPlanInput>) => planDebts(us, { ...base, ...input })

describe('priority order', () => {
  const debts = [card, store, student].map((d) => ({ ...d, balance: d.balance!, apr: d.apr!, minimum: d.minimum! }))

  it('avalanche: highest rate first, ties to the smaller balance', () => {
    expect(priorityOrder(debts, 'avalanche').map((d) => d.id)).toEqual(['store', 'card', 'student'])
    const tie = [
      { ...debts[0], apr: 0.2 },
      { ...debts[1], apr: 0.2 },
    ]
    expect(priorityOrder(tie, 'avalanche').map((d) => d.id)).toEqual(['store', 'card'])
  })

  it('snowball: smallest balance first, ties to the higher rate', () => {
    expect(priorityOrder(debts, 'snowball').map((d) => d.id)).toEqual(['store', 'card', 'student'])
    const tie = [
      { ...debts[0], balance: 1_000 },
      { ...debts[1], balance: 1_000 },
    ]
    expect(priorityOrder(tie, 'snowball').map((d) => d.id)).toEqual(['store', 'card'])
  })
})

describe('the simulation', () => {
  it('pays a single 0% debt in balance ÷ payment months, with no interest', () => {
    const result = plan({ debts: [{ id: 'a', name: 'A', balance: 1_000, apr: 0, minimum: 100 }], amount: 100 })
    expect(result.avalanche!.months).toBe(10)
    expect(result.avalanche!.totalInterest).toBe(0)
    expect(result.avalanche!.totalPaid).toBeCloseTo(1_000, 8)
    expect(result.sameResult).toBe(true)
  })

  it('charges a month of interest before the payment', () => {
    const result = plan({ debts: [{ id: 'a', name: 'A', balance: 1_200, apr: 0.12, minimum: 0 }], amount: 2_000 })
    expect(result.avalanche!.months).toBe(1)
    expect(result.avalanche!.totalInterest).toBeCloseTo(12, 10)
    expect(result.avalanche!.totalPaid).toBeCloseTo(1_212, 10)
  })

  it('handles a small final payment without leaving a remainder', () => {
    const result = plan({ debts: [{ id: 'a', name: 'A', balance: 1_000.01, apr: 0, minimum: 100 }], amount: 100 })
    expect(result.avalanche!.months).toBe(11)
    expect(result.avalanche!.timeline.at(-1)!.total).toBe(0)
  })

  it('rolls a cleared debt’s minimum into the next one', () => {
    const result = plan({})
    const avalanche = result.avalanche!
    // Every month after the first debt is cleared still pays the full monthly amount (until the last month).
    const fullMonths = avalanche.schedule.slice(0, -1)
    for (const row of fullMonths) expect(row.payment).toBeCloseTo(650, 6)
  })

  it('avalanche never costs more interest than snowball', () => {
    const result = plan({ debts: [card, { ...store, balance: 9_000, minimum: 200 }, student], amount: 900 })
    expect(result.avalanche!.totalInterest).toBeLessThanOrEqual(result.snowball!.totalInterest + 1e-6)
    expect(result.snowball!.firstClearedMonth!).toBeLessThanOrEqual(result.avalanche!.firstClearedMonth!)
  })

  it('beats paying only the minimums', () => {
    const result = plan({})
    expect(result.baseline!.months).toBeGreaterThan(result.avalanche!.months!)
    expect(result.baseline!.totalInterest).toBeGreaterThan(result.avalanche!.totalInterest)
  })

  it('applies a one-time extra payment in the first month, and not to the baseline', () => {
    const plain = plan({})
    const boosted = plan({ oneTimeExtra: 2_000 })
    expect(boosted.avalanche!.schedule[0].payment).toBeCloseTo(2_650, 6)
    expect(boosted.avalanche!.totalInterest).toBeLessThan(plain.avalanche!.totalInterest)
    expect(boosted.baseline!.totalInterest).toBeCloseTo(plain.baseline!.totalInterest, 6)
  })

  it('takes the monthly amount as extra on top of the minimums', () => {
    const extra = plan({ amount: 255, amountMode: 'extra' })
    expect(extra.monthlyAmount).toBe(650)
    expect(extra.avalanche!.months).toBe(plan({}).avalanche!.months)
  })

  it('dates the debt-free month from the start date', () => {
    const result = plan({ startDate: { year: 2026, month: 12 } })
    expect(result.avalanche!.debtFreeDate).toEqual(addMonths({ year: 2026, month: 12 }, result.avalanche!.months!))
  })
})

describe('edge cases', () => {
  it('needs the amount to cover the minimums', () => {
    const result = plan({ amount: 300 })
    expect(result.belowMinimums).toBe(true)
    expect(result.minimums).toBe(395)
    expect(result.avalanche).toBeNull()
  })

  it('warns when a minimum does not cover a month of interest', () => {
    const result = plan({ debts: [{ ...card, minimum: 100 }, store] })
    expect(result.warnings.find((w) => w.debtId === 'card')!.minimumBelowInterest).toBe(true)
    expect(result.warnings.find((w) => w.debtId === 'store')!.minimumBelowInterest).toBe(false)
  })

  it('shows the minimums-only baseline as never paid off when a minimum does not cover interest', () => {
    const result = plan({ debts: [{ ...card, minimum: 100 }], amount: 400 })
    expect(result.baseline!.months).toBeNull()
    expect(result.avalanche!.months).not.toBeNull()
  })

  it('stops at the cap when the amount never pays the debts off', () => {
    const result = plan({ debts: [{ ...card, minimum: 100 }], amount: 100 })
    expect(result.avalanche!.months).toBeNull()
    expect(result.avalanche!.timeline).toHaveLength(us.maxYears * 12 + 1)
  })

  it('waits for every debt and the amount', () => {
    expect(plan({ amount: null }).avalanche).toBeNull()
    expect(plan({ debts: [card, { ...store, apr: null }] }).avalanche).toBeNull()
    expect(plan({ debts: [card, { ...store, balance: 0 }] }).avalanche).toBeNull()
  })
})
