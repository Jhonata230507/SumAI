import { buildAmortizationSchedule } from '@/lib/calculations/amortization'
import { toPeriodicRate } from '@/lib/calculations/interest'
import { principalFromPayment } from '@/lib/calculations/payment'
import { roundMoney, roundTo } from '@/lib/calculations/rounding'
import { getCountry } from '@/lib/countries'
import type {
  AffordabilityInput,
  AffordabilityResult,
  MonthlyBreakdown,
  MortgageInput,
  MortgageResult,
} from './types'

const PERIODS_PER_YEAR = 12
/** Mortgage insurance drops once the borrower holds 20% equity. */
const EQUITY_THRESHOLD = 0.8

export function calculateMortgage(input: MortgageInput): MortgageResult {
  const country = getCountry(input.countryCode)
  const loanAmount = roundMoney(input.homePrice - input.downPayment)
  const downPaymentRatio = roundTo(input.downPayment / input.homePrice, 4)

  const periodicRate = toPeriodicRate(
    input.annualRate,
    PERIODS_PER_YEAR,
    country.rules.quotesEffectiveAnnualRate,
  )

  const schedule = buildAmortizationSchedule({
    principal: loanAmount,
    periodicRate,
    periods: input.termMonths,
    extraPerPeriod: input.extraPayment,
  })

  const requiresMortgageInsurance = downPaymentRatio < country.rules.minDownPaymentRatio
  const mortgageInsurance = requiresMortgageInsurance
    ? roundMoney((loanAmount * input.mortgageInsuranceRate) / 12)
    : 0

  const monthly: MonthlyBreakdown = {
    principalAndInterest: schedule.payment,
    propertyTax: roundMoney(input.propertyTaxAnnual / 12),
    insurance: roundMoney(input.homeInsuranceAnnual / 12),
    hoa: roundMoney(input.hoaMonthly),
    mortgageInsurance,
    total: 0,
  }
  monthly.total = roundMoney(
    monthly.principalAndInterest +
      monthly.propertyTax +
      monthly.insurance +
      monthly.hoa +
      monthly.mortgageInsurance,
  )

  return {
    loanAmount,
    downPaymentRatio,
    loanToValue: roundTo(loanAmount / input.homePrice, 4),
    monthly,
    // Escrow and HOA are real costs but not loan costs; totalPaid is the loan.
    totalPaid: schedule.totalPaid,
    totalInterest: schedule.totalInterest,
    payoffPeriods: schedule.periodsToPayoff,
    periodsSaved: schedule.periodsSaved,
    interestSaved: schedule.interestSaved,
    requiresMortgageInsurance,
    mortgageInsuranceEndsPeriod: requiresMortgageInsurance
      ? findEquityCrossover(schedule.rows, input.homePrice)
      : null,
    currency: country.currency,
    schedule,
  }
}

function findEquityCrossover(
  rows: { period: number; balance: number }[],
  homePrice: number,
): number | null {
  const row = rows.find((r) => r.balance / homePrice <= EQUITY_THRESHOLD)
  return row?.period ?? null
}

/**
 * Works backwards from income to the largest home the borrower qualifies for,
 * using the country debt-to-income ceiling.
 */
export function calculateAffordability(input: AffordabilityInput): AffordabilityResult {
  const country = getCountry(input.countryCode)
  const ceiling = country.rules.maxDebtToIncome

  const maxTotalPayment = input.monthlyIncome * ceiling
  const maxMonthlyPayment = Math.max(0, roundMoney(maxTotalPayment - input.monthlyDebts))

  const periodicRate = toPeriodicRate(
    input.annualRate,
    PERIODS_PER_YEAR,
    country.rules.quotesEffectiveAnnualRate,
  )

  const maxLoanAmount = principalFromPayment(maxMonthlyPayment, periodicRate, input.termMonths)

  return {
    maxHomePrice: roundMoney(maxLoanAmount + input.downPayment),
    maxLoanAmount,
    maxMonthlyPayment,
    debtToIncome: roundTo((input.monthlyDebts + maxMonthlyPayment) / input.monthlyIncome, 4),
    currency: country.currency,
  }
}
