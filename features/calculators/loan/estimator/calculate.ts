import type { CreditHistory, LoanCountryConfig, PaymentType } from './config'

/**
 * The standard (consumer) loan estimator. Pure: no rounding, rates as fractions,
 * annual rates effective (E.A.).
 *
 * Fixed payment:      cuota = P·i / (1 − (1 + i)^−n)
 * Decreasing payment: cuota_k = P/n + saldo_{k−1}·i
 * Both add debtor life insurance each month: seguro_k = saldo_{k−1}·s
 * where i is the monthly rate, (1 + E.A.)^(1/12) − 1, and s the monthly insurance rate.
 */

export interface LoanEstimateInput {
  amount: number | null
  termMonths: number | null
  /** E.A. as typed; null uses the estimate. */
  annualRate: number | null
  creditHistory: CreditHistory | null
  paymentType: PaymentType
  /** Gross monthly income of everyone on the loan; null when not given. */
  monthlyIncome: number | null
  monthlyDebts: number
  /** Monthly, as a fraction of the balance (0.001 is 0.1%). */
  insuranceRate: number
  /** Commissions and credit study, paid once. */
  fees: number
}

export interface ScheduleRow {
  month: number
  /** Loan payment plus insurance. */
  payment: number
  principal: number
  interest: number
  insurance: number
  /** Balance after this payment. */
  balance: number
}

export interface LoanFigures {
  months: number
  /** E.A. and the monthly rate it gives. */
  annualRate: number
  monthlyRate: number
  /** The first month's payment, insurance included (the highest for a decreasing loan). */
  firstPayment: number
  /** The last month's payment, insurance included. */
  lastPayment: number
  /** Insurance in the first month. */
  firstInsurance: number
  totalInterest: number
  totalInsurance: number
  fees: number
  /** Every payment plus fees. */
  totalCost: number
  /** What the loan costs on top of the amount: interest, insurance and fees. */
  costOfCredit: number
  /** First payment ÷ income, and (first payment + other debts) ÷ income. Null without an income. */
  dti: { payment: number; total: number } | null
}

export interface LoanEstimate {
  rate: RateResolution
  /** Null until the amount and the term are entered. */
  figures: LoanFigures | null
  rows: ScheduleRow[]
}

export interface RateResolution {
  rate: number
  source: 'typed' | 'estimated'
  /** A typed rate above the legal maximum. */
  overUsury: boolean
}

/** E.A. to the monthly rate. */
export function monthlyFromEffective(annual: number): number {
  return Math.pow(1 + annual, 1 / 12) - 1
}

/** Nominal annual compounded monthly (N.M.V.) to E.A. */
export function nmvToEffective(nmv: number): number {
  return Math.pow(1 + nmv / 12, 12) - 1
}

/** E.A. to nominal annual compounded monthly (N.M.V.). */
export function effectiveToNmv(annual: number): number {
  return 12 * monthlyFromEffective(annual)
}

/** The estimated E.A.: the average moved by the credit history, never above the usury cap. */
export function estimatedRate(config: LoanCountryConfig, history: CreditHistory | null): number {
  const spread = history ? config.rates.spreadByHistory[history] : 0
  return Math.min(Math.max(config.rates.average + spread, 0), config.rates.usuryCap)
}

export function resolveRate(
  config: LoanCountryConfig,
  input: Pick<LoanEstimateInput, 'annualRate' | 'creditHistory'>,
): RateResolution {
  if (input.annualRate !== null && Number.isFinite(input.annualRate) && input.annualRate >= 0) {
    return { rate: input.annualRate, source: 'typed', overUsury: input.annualRate > config.rates.usuryCap }
  }
  return { rate: estimatedRate(config, input.creditHistory), source: 'estimated', overUsury: false }
}

/** The fixed loan payment (no insurance). Zero interest pays the amount in equal parts. */
export function fixedPayment(amount: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return amount / months
  return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
}

/** Month by month, with insurance on the balance owed at the start of each month. */
export function buildSchedule(
  amount: number,
  monthlyRate: number,
  months: number,
  type: PaymentType,
  insuranceRate: number,
): ScheduleRow[] {
  const rows: ScheduleRow[] = []
  const fixed = fixedPayment(amount, monthlyRate, months)
  const constantPrincipal = amount / months
  let balance = amount

  for (let month = 1; month <= months; month++) {
    const interest = balance * monthlyRate
    const insurance = balance * insuranceRate
    // The last month clears whatever is left, so the balance ends at exactly zero.
    const principal = month === months ? balance : type === 'fixed' ? fixed - interest : constantPrincipal
    balance -= principal
    rows.push({ month, payment: principal + interest + insurance, principal, interest, insurance, balance })
  }
  return rows
}

export function estimateLoan(config: LoanCountryConfig, input: LoanEstimateInput): LoanEstimate {
  const rate = resolveRate(config, input)
  const months = input.termMonths !== null && Number.isFinite(input.termMonths) ? Math.round(input.termMonths) : 0
  const amount = input.amount ?? 0

  if (!(amount > 0) || months < 1) return { rate, figures: null, rows: [] }

  const monthlyRate = monthlyFromEffective(rate.rate)
  const insuranceRate = Math.max(0, input.insuranceRate)
  const rows = buildSchedule(amount, monthlyRate, months, input.paymentType, insuranceRate)

  const sum = (key: 'interest' | 'insurance' | 'payment') => rows.reduce((total, row) => total + row[key], 0)
  const totalInterest = sum('interest')
  const totalInsurance = sum('insurance')
  const fees = Math.max(0, input.fees)
  const totalCost = sum('payment') + fees
  const firstPayment = rows[0].payment
  const income = input.monthlyIncome

  return {
    rate,
    rows,
    figures: {
      months,
      annualRate: rate.rate,
      monthlyRate,
      firstPayment,
      lastPayment: rows[rows.length - 1].payment,
      firstInsurance: rows[0].insurance,
      totalInterest,
      totalInsurance,
      fees,
      totalCost,
      costOfCredit: totalInterest + totalInsurance + fees,
      dti:
        income !== null && income > 0
          ? { payment: firstPayment / income, total: (firstPayment + Math.max(0, input.monthlyDebts)) / income }
          : null,
    },
  }
}
