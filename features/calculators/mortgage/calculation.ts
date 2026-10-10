import { buildAmortizationSchedule } from '@/lib/calculations/amortization'
import { toPeriodicRate } from '@/lib/calculations/interest'
import { principalFromPayment } from '@/lib/calculations/payment'
import { roundMoney, roundTo } from '@/lib/calculations/rounding'
import { getCountry } from '@/lib/countries'
import { loanRules } from './us'
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
  const baseLoan = roundMoney(input.homePrice - input.downPayment)
  const downPaymentRatio = roundTo(input.downPayment / input.homePrice, 4)
  // US loan types bring their own program rules; elsewhere the country rule applies.
  const rules = input.loanType
    ? loanRules({
        loanType: input.loanType,
        downRatio: downPaymentRatio,
        termMonths: input.termMonths,
        creditBand: input.creditBand ?? null,
      })
    : null
  const upfrontFee = rules ? roundMoney(baseLoan * rules.upfrontFeeRate) : 0
  const loanAmount = roundMoney(baseLoan + upfrontFee)

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

  const requiresMortgageInsurance = rules
    ? rules.annualInsuranceRate > 0
    : downPaymentRatio < country.rules.minDownPaymentRatio
  const insuranceRate = rules ? rules.annualInsuranceRate : input.mortgageInsuranceRate
  const mortgageInsurance = requiresMortgageInsurance ? roundMoney((loanAmount * insuranceRate) / 12) : 0

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
    mortgageInsuranceEndsPeriod: !requiresMortgageInsurance
      ? null
      : rules?.insuranceDuration.kind === 'months'
        ? rules.insuranceDuration.months
        : rules?.insuranceDuration.kind === 'life'
          ? null
          : findEquityCrossover(schedule.rows, input.homePrice),
    currency: country.currency,
    schedule,
    upfrontFee,
    insuranceDuration: rules && requiresMortgageInsurance ? rules.insuranceDuration : null,
    minDownRatio: rules ? rules.minDownRatio : null,
    debtToIncome:
      input.annualIncome && input.annualIncome > 0
        ? {
            front: roundTo(monthly.total / (input.annualIncome / 12), 4),
            back: roundTo((monthly.total + (input.monthlyDebts ?? 0)) / (input.annualIncome / 12), 4),
            frontLimit: rules?.frontLimit ?? null,
            backLimit: rules?.backLimit ?? country.rules.maxDebtToIncome,
          }
        : null,
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
