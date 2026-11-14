import { toYearlyBuckets, type AmortizationRow } from './amortization'

export interface AmortizationBar {
  /** Month or year number, from 1. */
  x: number
  principal: number
  interest: number
  /** Balance left at the end of the bar. */
  balance: number
}

export interface AmortizationInsights {
  /** 'month' for loans of up to three years of monthly payments, otherwise 'year'. */
  unit: 'month' | 'year'
  bars: AmortizationBar[]
  totalPrincipal: number
  totalInterest: number
  /** Interest as a share of everything paid on the loan. */
  interestShare: number
  /** The first bar where principal is at least the interest; null if it never is. */
  crossover: number | null
  /** The first bar after which half the principal is repaid; null without principal. */
  halfPaid: number | null
}

/**
 * What an amortization schedule means, for the chart's headline: where the money
 * goes in total, when principal overtakes interest, and when half the debt is gone.
 * Up to three years of monthly payments stay monthly; longer loans go yearly.
 */
export function amortizationInsights(rows: AmortizationRow[], periodsPerYear = 12): AmortizationInsights {
  const monthly = periodsPerYear === 12 && rows.length <= 36
  const bars: AmortizationBar[] = monthly
    ? rows.map((row) => ({
        x: row.period,
        principal: row.principal + row.extraPayment,
        interest: row.interest,
        balance: row.balance,
      }))
    : toYearlyBuckets(rows, periodsPerYear).map(({ year, principal, interest, balance }) => ({
        x: year,
        principal,
        interest,
        balance,
      }))

  const totalPrincipal = bars.reduce((sum, bar) => sum + bar.principal, 0)
  const totalInterest = bars.reduce((sum, bar) => sum + bar.interest, 0)
  const paid = totalPrincipal + totalInterest

  let repaid = 0
  let halfPaid: number | null = null
  for (const bar of bars) {
    repaid += bar.principal
    if (totalPrincipal > 0 && repaid >= totalPrincipal / 2) {
      halfPaid = bar.x
      break
    }
  }

  return {
    unit: monthly ? 'month' : 'year',
    bars,
    totalPrincipal,
    totalInterest,
    interestShare: paid > 0 ? totalInterest / paid : 0,
    crossover: bars.find((bar) => bar.principal >= bar.interest)?.x ?? null,
    halfPaid,
  }
}
