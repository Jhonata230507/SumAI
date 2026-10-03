import { periodicPayment, totalInterest as scheduledInterest } from './payment'
import { roundMoney } from './rounding'

export interface AmortizationRow {
  period: number
  payment: number
  principal: number
  interest: number
  extraPayment: number
  balance: number
  cumulativeInterest: number
  cumulativePrincipal: number
}

export interface AmortizationSchedule {
  rows: AmortizationRow[]
  payment: number
  totalPaid: number
  totalInterest: number
  /** Actual payoff length. Shorter than `periods` when extra payments are made. */
  periodsToPayoff: number
  /** Periods saved versus the same loan with no extra payments. */
  periodsSaved: number
  interestSaved: number
}

export interface AmortizationOptions {
  principal: number
  /** Fraction per period, not annual. */
  periodicRate: number
  periods: number
  /** Extra principal applied every period. */
  extraPerPeriod?: number
  /** One-off extra principal payments keyed by period number. */
  lumpSums?: Record<number, number>
}

/**
 * Builds a full amortization schedule. Extra payments go straight to principal,
 * which is what shortens the loan — the scheduled payment itself never changes.
 */
export function buildAmortizationSchedule(options: AmortizationOptions): AmortizationSchedule {
  const { principal, periodicRate, periods, extraPerPeriod = 0, lumpSums = {} } = options

  const payment = periodicPayment(principal, periodicRate, periods)
  const rows: AmortizationRow[] = []

  let balance = principal
  let cumulativeInterest = 0
  let cumulativePrincipal = 0

  for (let period = 1; period <= periods && balance > 0; period += 1) {
    const interest = roundMoney(balance * periodicRate)
    const extra = roundMoney(extraPerPeriod + (lumpSums[period] ?? 0))

    let principalPart = roundMoney(payment - interest)
    let extraApplied = extra
    let actualPayment = payment

    // Clear the balance on the last scheduled period, or earlier if this payment
    // would overshoot it. The payment is rounded to the cent, so without the
    // final-period adjustment a few cents of drift would be left owing — lenders
    // absorb that drift into the last payment, and so does the schedule.
    const isFinalPeriod = period === periods
    if (isFinalPeriod || principalPart + extraApplied >= balance) {
      principalPart = balance
      extraApplied = 0
      actualPayment = roundMoney(balance + interest)
    }

    balance = roundMoney(balance - principalPart - extraApplied)
    cumulativeInterest = roundMoney(cumulativeInterest + interest)
    cumulativePrincipal = roundMoney(cumulativePrincipal + principalPart + extraApplied)

    rows.push({
      period,
      payment: actualPayment,
      principal: principalPart,
      interest,
      extraPayment: extraApplied,
      balance,
      cumulativeInterest,
      cumulativePrincipal,
    })
  }

  const paidInterest = cumulativeInterest
  const totalPaid = roundMoney(rows.reduce((sum, r) => sum + r.payment + r.extraPayment, 0))

  const hasExtra = extraPerPeriod > 0 || Object.keys(lumpSums).length > 0
  const baseline = hasExtra ? scheduledInterest(principal, periodicRate, periods) : paidInterest

  return {
    rows,
    payment,
    totalPaid,
    totalInterest: paidInterest,
    periodsToPayoff: rows.length,
    periodsSaved: periods - rows.length,
    interestSaved: roundMoney(baseline - paidInterest),
  }
}

/** Collapses a periodic schedule into yearly buckets for charting. */
export function toYearlyBuckets(rows: AmortizationRow[], periodsPerYear = 12) {
  const buckets: { year: number; principal: number; interest: number; balance: number }[] = []

  for (let i = 0; i < rows.length; i += periodsPerYear) {
    const slice = rows.slice(i, i + periodsPerYear)
    const last = slice[slice.length - 1]
    buckets.push({
      year: Math.floor(i / periodsPerYear) + 1,
      principal: roundMoney(slice.reduce((s, r) => s + r.principal + r.extraPayment, 0)),
      interest: roundMoney(slice.reduce((s, r) => s + r.interest, 0)),
      balance: last.balance,
    })
  }

  return buckets
}
