import { toYearlyBuckets } from '@/lib/calculations/amortization'
import { FREQUENCY_PER_YEAR } from '@/types/common'
import { calculateLoan } from './calculation'
import type { LoanInput, LoanResult } from './types'

export interface PayoffComparison {
  /** The loan with no extra toward principal. */
  base: LoanResult
  /** The same loan with `extra` added to every payment. */
  faster: LoanResult
  interestSaved: number
  /** Payments fewer than the base loan takes. */
  periodsSaved: number
  /** The balance after every payment for both plans, from the amount down to zero; `x` is in years. */
  balances: { x: number; base: number; faster: number }[]
  /** Principal and interest paid each year of the faster plan, with the balance left at its end. */
  years: { year: number; principal: number; interest: number; balance: number }[]
}

/**
 * What adding the same extra amount to every payment does to a loan: how much
 * interest it saves, how much sooner it ends, and the balance over time next
 * to the plan without it.
 */
export function comparePayoff(input: LoanInput, extra: number): PayoffComparison {
  const base = calculateLoan({ ...input, extraPayment: 0 })
  const faster = calculateLoan({ ...input, extraPayment: Math.max(0, extra) })
  const perYear = FREQUENCY_PER_YEAR[input.frequency]
  const periods = base.schedule.rows.length

  const balanceAt = (result: LoanResult, period: number) =>
    period === 0 ? input.amount : (result.schedule.rows[period - 1]?.balance ?? 0)
  const balances: PayoffComparison['balances'] = []
  for (let period = 0; period <= periods; period++) {
    balances.push({ x: period / perYear, base: balanceAt(base, period), faster: balanceAt(faster, period) })
  }

  return {
    base,
    faster,
    interestSaved: Math.max(0, base.totalInterest - faster.totalInterest),
    periodsSaved: Math.max(0, base.payoffPeriods - faster.payoffPeriods),
    balances,
    years: toYearlyBuckets(faster.schedule.rows, perYear).map(({ year, principal, interest, balance }) => ({
      year,
      principal,
      interest,
      balance,
    })),
  }
}
