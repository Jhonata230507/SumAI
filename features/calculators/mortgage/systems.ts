import { effectiveToPeriodic } from '@/lib/calculations/interest'
import { roundMoney } from '@/lib/calculations/rounding'
import type { AmortizationRow } from '@/lib/calculations/amortization'

/**
 * The four amortization systems Colombian lenders offer for a home loan.
 *
 * - Cuota fija en pesos: the same payment every month (a standard annuity).
 * - Abono fijo a capital en pesos: the same slice of principal every month,
 *   plus interest on what is still owed — the payment starts high and falls.
 * - Cuota fija en UVR: the loan is denominated in UVR, a unit that rises with
 *   inflation. The payment is fixed in UVR, so in pesos it grows every month.
 * - Abono fijo a capital en UVR: a fixed slice of principal in UVR plus
 *   interest, converted to pesos at the UVR of each month.
 *
 * UVR loans are priced as a real rate on top of the UVR (e.g. "UVR + 7.5%"),
 * so they take that rate and a projected inflation rather than the peso rate.
 * Both are assumptions: the UVR follows actual inflation, which nobody knows
 * in advance.
 *
 * Every system is run month by month in its own unit (pesos, or UVR) and
 * converted to pesos at that month's UVR, which yields a full schedule for the
 * yearly chart. In pesos, a UVR loan's principal column includes the inflation
 * adjustment of the balance — that is money the borrower really pays.
 */

export type MortgageSystemId = 'fixed-payment-cop' | 'fixed-principal-cop' | 'fixed-payment-uvr' | 'fixed-principal-uvr'

export interface MortgageSystemsInput {
  principal: number
  termMonths: number
  /** Effective annual rate of a peso loan. */
  pesoRate: number
  /** Effective annual real rate of a UVR loan, charged on top of the UVR. */
  uvrRate: number
  /** Projected effective annual inflation, which drives the UVR. */
  inflation: number
  /** Extra principal paid every month, in pesos. Shortens the loan. */
  extraPayment?: number
}

export interface MortgageSystemResult {
  id: MortgageSystemId
  /** Scheduled payments (without extra principal), in pesos. */
  firstPayment: number
  lastPayment: number
  highestPayment: number
  /** Everything paid, extra principal included. */
  totalPaid: number
  totalInterest: number
  /** Scheduled monthly payment in pesos, for the trend line. */
  payments: number[]
  /** Month-by-month schedule in pesos, for the yearly chart. */
  rows: AmortizationRow[]
}

const SYSTEMS: { id: MortgageSystemId; uvr: boolean; fixedPayment: boolean }[] = [
  { id: 'fixed-payment-cop', uvr: false, fixedPayment: true },
  { id: 'fixed-principal-cop', uvr: false, fixedPayment: false },
  { id: 'fixed-payment-uvr', uvr: true, fixedPayment: true },
  { id: 'fixed-principal-uvr', uvr: true, fixedPayment: false },
]

export function calculateMortgageSystems(input: MortgageSystemsInput): MortgageSystemResult[] {
  const { principal, termMonths: n } = input
  const extra = input.extraPayment ?? 0
  const inflationMonthly = effectiveToPeriodic(input.inflation, 12)

  return SYSTEMS.map(({ id, uvr, fixedPayment }) => {
    const rate = effectiveToPeriodic(uvr ? input.uvrRate : input.pesoRate, 12)
    // Peso value of one unit in month k: 1 for peso loans; the UVR (1 at the start) otherwise.
    const unit = (k: number) => (uvr ? (1 + inflationMonthly) ** k : 1)

    // The loan, in its own unit (the UVR starts at 1, so the amounts match on day one).
    const payment = annuity(principal, rate, n)
    const slice = principal / n
    let balance = principal
    let cumulativeInterest = 0
    let cumulativePrincipal = 0
    const rows: AmortizationRow[] = []

    for (let k = 1; k <= n && balance > 1e-6; k++) {
      const value = unit(k)
      const interest = balance * rate
      const scheduled = Math.min(fixedPayment ? payment - interest : slice, balance)
      balance -= scheduled
      const extraUnits = Math.min(extra / value, balance)
      balance -= extraUnits

      cumulativeInterest += interest * value
      cumulativePrincipal += (scheduled + extraUnits) * value
      rows.push({
        period: k,
        payment: (scheduled + interest) * value,
        principal: scheduled * value,
        interest: interest * value,
        extraPayment: extraUnits * value,
        balance: balance * value,
        cumulativeInterest,
        cumulativePrincipal,
      })
    }

    const payments = rows.map((row) => row.payment)
    const totalPaid = rows.reduce((sum, row) => sum + row.payment + row.extraPayment, 0)
    return {
      id,
      firstPayment: roundMoney(payments[0]),
      lastPayment: roundMoney(payments[payments.length - 1]),
      highestPayment: roundMoney(Math.max(...payments)),
      totalPaid: roundMoney(totalPaid),
      // For UVR loans this includes the inflation adjustment of the balance.
      totalInterest: roundMoney(totalPaid - principal),
      payments,
      rows,
    }
  })
}

function annuity(principal: number, rate: number, periods: number): number {
  if (rate === 0) return principal / periods
  return (principal * rate) / (1 - (1 + rate) ** -periods)
}
