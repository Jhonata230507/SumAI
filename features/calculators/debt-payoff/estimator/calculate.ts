import type { DebtPayoffCountryConfig } from './config'

/**
 * The debt payoff planner: avalanche and snowball, always both, next to paying
 * only the minimums. Pure: numbers in, numbers out, no rounding (that is for
 * display), no UI.
 *
 * A month-by-month simulation, not a closed formula:
 *   1. every open balance accrues balance × APR ÷ 12;
 *   2. every open debt gets its minimum (or what is left of it, if smaller);
 *   3. what is left of the monthly amount goes to the priority debt, and on to
 *      the next when that one is cleared;
 *   4. a cleared debt's minimum stays in the monthly amount, so it rolls into
 *      the others; this is what makes both methods work.
 * Priority, fixed from the starting balances: avalanche takes the highest rate
 * first (ties: the smaller balance); snowball the smallest balance first (ties:
 * the higher rate). The baseline pays the minimums only, with nothing rolled.
 */

export type Strategy = 'avalanche' | 'snowball'
export type AmountMode = 'total' | 'extra'

export interface YearMonth {
  year: number
  month: number
}

export interface PlannerDebt {
  id: string
  name: string
  /** All three required; null or not a number is not entered yet. */
  balance: number | null
  /** APR as a fraction (0.2299 is 22.99%). */
  apr: number | null
  minimum: number | null
}

export interface DebtPlanInput {
  debts: PlannerDebt[]
  /** The monthly amount: everything for the debts, or the extra on top of the minimums. */
  amount: number | null
  amountMode: AmountMode
  /** A one-time extra payment (a tax refund, a bonus), made in the first month. */
  oneTimeExtra: number | null
  startDate: YearMonth | null
}

export interface DebtOutcome {
  debtId: string
  name: string
  /** The month it is cleared, or null if it never is within the cap. */
  payoffMonth: number | null
  interest: number
}

export interface PlanResult {
  /** Months to clear every debt, or null if the plan never does (within the cap). */
  months: number | null
  totalInterest: number
  totalPaid: number
  debtFreeDate: YearMonth | null
  /** The month the first debt is cleared. */
  firstClearedMonth: number | null
  /** In payoff order. */
  outcomes: DebtOutcome[]
  /** The balance of each debt (by id) and in total, at the end of each month; month 0 is the start. */
  timeline: { month: number; total: number; byDebt: Record<string, number> }[]
  /** What was paid and charged each month. */
  schedule: { month: number; payment: number; interest: number; balance: number }[]
}

export interface DebtWarning {
  debtId: string
  /** The minimum does not cover a month of interest: the balance grows. */
  minimumBelowInterest: boolean
}

export interface DebtPlan {
  /** The sum of every debt's minimum. */
  minimums: number
  /** The monthly amount the plans use: the total, or the minimums plus the extra. */
  monthlyAmount: number | null
  /** The total is below the minimums: no plan until it covers them. */
  belowMinimums: boolean
  warnings: DebtWarning[]
  /** Null until every debt and the amount are entered (and the amount covers the minimums). */
  avalanche: PlanResult | null
  snowball: PlanResult | null
  baseline: PlanResult | null
  /** Both strategies come out the same (one debt, or the same order). */
  sameResult: boolean
}

interface Debt {
  id: string
  name: string
  balance: number
  apr: number
  minimum: number
}

export function priorityOrder(debts: Debt[], strategy: Strategy): Debt[] {
  return [...debts].sort((a, b) =>
    strategy === 'avalanche' ? b.apr - a.apr || a.balance - b.balance : a.balance - b.balance || b.apr - a.apr,
  )
}

export function planDebts(config: DebtPayoffCountryConfig, input: DebtPlanInput): DebtPlan {
  const complete = input.debts.every(
    (debt) => isSet(debt.balance) && debt.balance > 0 && isSet(debt.apr) && isSet(debt.minimum),
  )
  const debts: Debt[] = input.debts.map((debt) => ({
    id: debt.id,
    name: debt.name,
    balance: amount(debt.balance),
    apr: amount(debt.apr),
    minimum: amount(debt.minimum),
  }))
  const minimums = debts.reduce((sum, debt) => sum + debt.minimum, 0)
  const warnings = input.debts.map((debt) => ({
    debtId: debt.id,
    minimumBelowInterest:
      isSet(debt.balance) && isSet(debt.apr) && isSet(debt.minimum) && debt.minimum < (debt.balance * debt.apr) / 12,
  }))

  const typed = isSet(input.amount) ? input.amount : null
  const monthlyAmount = typed === null ? null : input.amountMode === 'extra' ? minimums + typed : typed
  const belowMinimums = monthlyAmount !== null && input.amountMode === 'total' && monthlyAmount < minimums - 1e-9
  const none = {
    minimums,
    monthlyAmount,
    belowMinimums,
    warnings,
    avalanche: null,
    snowball: null,
    baseline: null,
    sameResult: false,
  }
  if (!complete || debts.length === 0 || monthlyAmount === null || monthlyAmount <= 0 || belowMinimums) return none

  const cap = config.maxYears * 12
  const extra = amount(input.oneTimeExtra ?? 0)
  const avalanche = simulate(debts, priorityOrder(debts, 'avalanche'), monthlyAmount, extra, cap, input.startDate)
  const snowball = simulate(debts, priorityOrder(debts, 'snowball'), monthlyAmount, extra, cap, input.startDate)
  // Minimums only: no extra, no rolling.
  const baseline = simulate(debts, null, minimums, 0, cap, input.startDate)

  return {
    ...none,
    avalanche,
    snowball,
    baseline,
    sameResult:
      avalanche.months === snowball.months && Math.abs(avalanche.totalInterest - snowball.totalInterest) < 0.005,
  }
}

/**
 * One plan, month by month. With an `order`, the whole monthly amount is used
 * and what the minimums leave goes down the order; without one (the baseline)
 * each debt gets only its own minimum.
 */
function simulate(
  debts: Debt[],
  order: Debt[] | null,
  monthlyAmount: number,
  oneTimeExtra: number,
  cap: number,
  start: YearMonth | null,
): PlanResult {
  const balance = new Map(debts.map((debt) => [debt.id, debt.balance]))
  const interest = new Map(debts.map((debt) => [debt.id, 0]))
  const cleared = new Map<string, number>()
  const total = () => [...balance.values()].reduce((sum, value) => sum + value, 0)
  const snapshot = (month: number) => ({ month, total: total(), byDebt: Object.fromEntries(balance) })

  const timeline = [snapshot(0)]
  const schedule: PlanResult['schedule'] = []
  let totalPaid = 0
  let totalInterest = 0
  let month = 0

  while (total() > 1e-6 && month < cap) {
    month += 1
    let monthInterest = 0
    let monthPaid = 0

    // 1. Interest on every open balance.
    for (const debt of debts) {
      const open = balance.get(debt.id)!
      if (open <= 0) continue
      const charge = (open * debt.apr) / 12
      balance.set(debt.id, open + charge)
      interest.set(debt.id, interest.get(debt.id)! + charge)
      monthInterest += charge
    }

    // 2. The minimum on every open debt (or the balance, if smaller).
    let available = order ? monthlyAmount + (month === 1 ? oneTimeExtra : 0) : Infinity
    for (const debt of debts) {
      const open = balance.get(debt.id)!
      if (open <= 0) continue
      const payment = Math.min(debt.minimum, open, available)
      balance.set(debt.id, open - payment)
      available -= payment
      monthPaid += payment
    }

    // 3. What is left goes down the priority order: cleared debts' minimums roll on.
    for (const debt of order ?? []) {
      if (available <= 1e-9) break
      const open = balance.get(debt.id)!
      if (open <= 0) continue
      const payment = Math.min(available, open)
      balance.set(debt.id, open - payment)
      available -= payment
      monthPaid += payment
    }

    for (const debt of debts) {
      // Tiny floating-point remainders count as paid off.
      if (balance.get(debt.id)! < 1e-6) balance.set(debt.id, 0)
      if (balance.get(debt.id) === 0 && !cleared.has(debt.id)) cleared.set(debt.id, month)
    }

    totalPaid += monthPaid
    totalInterest += monthInterest
    timeline.push(snapshot(month))
    schedule.push({ month, payment: monthPaid, interest: monthInterest, balance: total() })
  }

  const paidOff = total() <= 1e-6
  const outcomes = debts
    .map((debt) => ({
      debtId: debt.id,
      name: debt.name,
      payoffMonth: cleared.get(debt.id) ?? null,
      interest: interest.get(debt.id)!,
    }))
    .sort((a, b) => (a.payoffMonth ?? Infinity) - (b.payoffMonth ?? Infinity))

  return {
    months: paidOff ? month : null,
    totalInterest,
    totalPaid,
    debtFreeDate: paidOff && start ? addMonths(start, month) : null,
    firstClearedMonth: outcomes[0]?.payoffMonth ?? null,
    outcomes,
    timeline,
    schedule,
  }
}

export function addMonths(start: YearMonth, months: number): YearMonth {
  const index = start.year * 12 + (start.month - 1) + months
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

function isSet(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value) && value >= 0
}

function amount(value: number | null): number {
  return value !== null && Number.isFinite(value) && value > 0 ? value : 0
}
