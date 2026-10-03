import { buildAmortizationSchedule } from '@/lib/calculations/amortization'
import { toPeriodicRate } from '@/lib/calculations/interest'
import { roundMoney, roundTo } from '@/lib/calculations/rounding'
import { getCountry } from '@/lib/countries'
import type { CarLoanInput, CarLoanResult, DepreciationPoint } from './types'

const PERIODS_PER_YEAR = 12

/** Cars lose roughly a fifth of their value in year one, then ~15% a year. */
const FIRST_YEAR_DEPRECIATION = 0.2
const ANNUAL_DEPRECIATION = 0.15

/**
 * A car loan is an instalment loan with the purchase side attached: tax, fees,
 * and a trade-in that can be worth less than what is still owed on it. That
 * negative equity gets rolled into the new loan, which is how buyers end up
 * underwater on day one.
 */
export function calculateCarLoan(input: CarLoanInput): CarLoanResult {
  const country = getCountry(input.countryCode)

  const salesTax = roundMoney(input.vehiclePrice * input.salesTaxRate)
  const tradeInEquity = roundMoney(input.tradeInValue - input.tradeInOwed)

  const amountFinanced = Math.max(
    0,
    roundMoney(
      input.vehiclePrice + salesTax + input.feesAndRegistration - input.downPayment - tradeInEquity,
    ),
  )

  const periodicRate = toPeriodicRate(
    input.annualRate,
    PERIODS_PER_YEAR,
    country.rules.quotesEffectiveAnnualRate,
  )

  const schedule = buildAmortizationSchedule({
    principal: amountFinanced,
    periodicRate,
    periods: input.termMonths,
  })

  const depreciation = projectDepreciation(input.vehiclePrice, schedule.rows)

  return {
    amountFinanced,
    monthlyPayment: schedule.payment,
    totalPaid: schedule.totalPaid,
    totalInterest: schedule.totalInterest,
    salesTax,
    tradeInEquity,
    initialLoanToValue: roundTo(amountFinanced / input.vehiclePrice, 4),
    breakEvenPeriod: depreciation.find((p) => p.equity >= 0)?.period ?? null,
    currency: country.currency,
    schedule,
  }
}

/** Value of the car against the loan balance, month by month. */
export function projectDepreciation(
  vehiclePrice: number,
  rows: { period: number; balance: number }[],
): DepreciationPoint[] {
  return rows.map((row) => {
    const years = row.period / 12
    const firstYear = Math.min(years, 1)
    const laterYears = Math.max(0, years - 1)

    const vehicleValue = roundMoney(
      vehiclePrice *
        (1 - FIRST_YEAR_DEPRECIATION * firstYear) *
        (1 - ANNUAL_DEPRECIATION) ** laterYears,
    )

    return {
      period: row.period,
      vehicleValue,
      loanBalance: row.balance,
      equity: roundMoney(vehicleValue - row.balance),
    }
  })
}
