import {
  buildAmortizationSchedule,
  type AmortizationRow,
  type AmortizationSchedule,
} from '@/lib/calculations/amortization'
import { projectDepreciation } from '../calculation'
import type { CarCreditBand, CarLoanCountryConfig, VehicleCondition } from './config'

/**
 * The car loan estimator: what a price costs a month, or what price a monthly
 * budget buys. Pure: numbers in, numbers out, no rounding (that is for
 * display), no UI. Every default and guideline comes from the country config.
 *
 * Rates and tax are fractions throughout (0.075 is 7.5%).
 */

export type EstimatorMode = 'price' | 'budget'

export interface CarLoanEstimateInput {
  mode: EstimatorMode
  condition: VehicleCondition
  /** Price mode: required. Null or 0 is not entered yet. */
  vehiclePrice: number | null
  /** Budget mode: the monthly payment the user can afford. Null or 0 is not entered yet. */
  monthlyBudget: number | null
  /** A fixed amount, or a fraction of the vehicle price (0.1 is 10%). */
  downPayment: { unit: 'amount' | 'percent'; value: number }
  tradeInValue: number
  /** Still owed on the trade-in; more than its value is negative equity, added to the loan. */
  tradeInOwed: number
  termMonths: number
  /** Null: the estimated APR for the condition and credit band is used. */
  apr: number | null
  creditBand: CarCreditBand | null
  /** Null: the country's estimated sales tax is used (none where prices include taxes). */
  salesTax: number | null
  /** Registration and fees, added to the amount financed. */
  fees: number
  /** Yearly all-risk insurance; one year is added to the loan when `financed`. Optional. */
  insurance?: { annual: number; financed: boolean }
  /** Only for debt-to-income; never changes the payment. */
  annualIncome: number | null
  monthlyDebts: number
}

export type DtiLevel = 'comfortable' | 'upper' | 'high'

export interface CarLoanFigures {
  mode: EstimatorMode
  /** The monthly payment: worked out in price mode, the budget in budget mode. */
  payment: number
  /** Price mode: what is borrowed. Budget mode: the most the budget can borrow. */
  loanAmount: number
  totalOfPayments: number
  totalInterest: number
  /** Price mode: as entered. Budget mode: the price that fits (never below 0). */
  vehiclePrice: number
  priceWithTax: number
  /** The down payment in money (a percentage resolved against the price). */
  downPayment: number
  tradeInValue: number
  tradeInOwed: number
  /** The yearly insurance premium, and the part of it in the loan (0 when paid apart). */
  insuranceAnnual: number
  insuranceFinanced: number
  fees: number
  /** Price mode: down payment and trade-in cover everything, so nothing is borrowed. */
  nothingToFinance: boolean
  dti: { ratio: number; level: DtiLevel } | null
}

export type EstimateIssue = 'downPercentOver100' | 'budgetDivisor'

export interface CarLoanEstimate {
  /** The rate used, as the country quotes it (APR or E.A.), and whether it is the config's estimate. */
  apr: number
  aprEstimated: boolean
  /** The monthly rate that rate gives. */
  monthlyRate: number
  salesTax: number
  salesTaxEstimated: boolean
  /** An input that makes the result impossible; figures are null then. */
  issue: EstimateIssue | null
  /** Null until the required input is entered and valid. */
  figures: CarLoanFigures | null
}

/** Present-value factor of n monthly payments of 1 at monthly rate r: f = (1 − (1 + r)^−n) / r, or n at r = 0. */
export function annuityFactor(monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return months
  return (1 - (1 + monthlyRate) ** -months) / monthlyRate
}

/** The APR used: the one entered, or the config's estimate for the condition and credit band. */
export function resolveApr(config: CarLoanCountryConfig, input: Pick<CarLoanEstimateInput, 'apr' | 'condition' | 'creditBand'>) {
  if (isSet(input.apr)) return { apr: input.apr, estimated: false }
  return { apr: config.estimates.apr[input.condition][input.creditBand ?? 'unknown'], estimated: true }
}

/** The monthly rate for a rate quoted the country's way. */
export function monthlyRateFor(config: CarLoanCountryConfig, rate: number): number {
  return config.rateQuote === 'effectiveAnnual' ? (1 + rate) ** (1 / 12) - 1 : rate / 12
}

export function dtiLevel(config: CarLoanCountryConfig, ratio: number): DtiLevel {
  if (ratio < config.dtiThresholds.comfortable) return 'comfortable'
  if (ratio <= config.dtiThresholds.upper) return 'upper'
  return 'high'
}

export function estimateCarLoan(config: CarLoanCountryConfig, input: CarLoanEstimateInput): CarLoanEstimate {
  const { apr, estimated: aprEstimated } = resolveApr(config, input)
  const salesTaxEstimated = !isSet(input.salesTax)
  const tax = config.estimates.salesTax === null ? 0 : isSet(input.salesTax) ? input.salesTax : config.estimates.salesTax
  const r = monthlyRateFor(config, apr)
  const base = { apr, aprEstimated, monthlyRate: r, salesTax: tax, salesTaxEstimated }

  const n = input.termMonths
  const f = annuityFactor(r, n)
  // Registration, transfer and other costs, plus a financed insurance year: all borrowed.
  const fees = amount(input.fees)
  const insuranceAnnual = config.fullCoverageInsurance ? amount(input.insurance?.annual ?? 0) : 0
  const insuranceFinanced = input.insurance?.financed ? insuranceAnnual : 0
  const extras = fees + insuranceFinanced
  const costs = { insuranceAnnual, insuranceFinanced, fees }
  const tradeIn = amount(input.tradeInValue)
  // What is owed on a trade-in only counts when there is one.
  const owed = tradeIn > 0 ? amount(input.tradeInOwed) : 0
  const percentDown = input.downPayment.unit === 'percent'
  const down = amount(input.downPayment.value)

  if (percentDown && down > 1) return { ...base, issue: 'downPercentOver100', figures: null }

  const dti = (payment: number) => {
    const income = amount(input.annualIncome ?? 0)
    if (income <= 0) return null
    const ratio = (amount(input.monthlyDebts) + payment) / (income / 12)
    return { ratio, level: dtiLevel(config, ratio) }
  }

  if (input.mode === 'price') {
    const price = amount(input.vehiclePrice ?? 0)
    if (price <= 0 || !(n > 0)) return { ...base, issue: null, figures: null }

    const downPayment = percentDown ? down * price : down
    const loan = Math.max(0, price * (1 + tax) + extras - downPayment - tradeIn + owed)
    const payment = loan / f
    const totalOfPayments = payment * n

    return {
      ...base,
      issue: null,
      figures: {
        mode: 'price',
        payment,
        loanAmount: loan,
        totalOfPayments,
        totalInterest: totalOfPayments - loan,
        vehiclePrice: price,
        priceWithTax: price * (1 + tax),
        downPayment,
        tradeInValue: tradeIn,
        tradeInOwed: owed,
        ...costs,
        nothingToFinance: loan <= 0,
        dti: dti(payment),
      },
    }
  }

  const budget = amount(input.monthlyBudget ?? 0)
  if (budget <= 0 || !(n > 0)) return { ...base, issue: null, figures: null }

  const maxLoan = budget * f
  let price: number
  if (percentDown) {
    const divisor = 1 + tax - down
    if (divisor <= 0) return { ...base, issue: 'budgetDivisor', figures: null }
    price = (maxLoan - extras + tradeIn - owed) / divisor
  } else {
    price = (maxLoan - extras + down + tradeIn - owed) / (1 + tax)
  }
  price = Math.max(0, price)
  const totalOfPayments = budget * n

  return {
    ...base,
    issue: null,
    figures: {
      mode: 'budget',
      payment: budget,
      loanAmount: maxLoan,
      totalOfPayments,
      totalInterest: totalOfPayments - maxLoan,
      vehiclePrice: price,
      priceWithTax: price * (1 + tax),
      downPayment: percentDown ? down * price : down,
      tradeInValue: tradeIn,
      tradeInOwed: owed,
      ...costs,
      nothingToFinance: false,
      dti: dti(budget),
    },
  }
}

/**
 * Month-by-month rows for the charts: the balance, and how each payment splits
 * between principal and interest. Rounded to cents, as charts show money.
 */
export function estimateSchedule(estimate: CarLoanEstimate, termMonths: number): AmortizationRow[] {
  return estimateAmortization(estimate, termMonths)?.rows ?? []
}

/**
 * The full schedule, with an optional extra payment to principal every month: the
 * scheduled payment stays the same, the loan ends sooner and costs less interest
 * (`periodsSaved`, `interestSaved`). Null when nothing is financed.
 */
export function estimateAmortization(
  estimate: CarLoanEstimate,
  termMonths: number,
  extraPerMonth = 0,
): AmortizationSchedule | null {
  if (!estimate.figures || estimate.figures.loanAmount <= 0) return null
  return buildAmortizationSchedule({
    principal: estimate.figures.loanAmount,
    periodicRate: estimate.monthlyRate,
    periods: termMonths,
    extraPerPeriod: amount(extraPerMonth),
  })
}

/** The first month the car is worth more than what is still owed, or null if not within the loan. */
export function breakEvenMonth(vehiclePrice: number, rows: AmortizationRow[]): number | null {
  return projectDepreciation(vehiclePrice, rows).find((point) => point.equity >= 0)?.period ?? null
}

function isSet(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value) && value >= 0
}

/** A money input as a usable amount: anything missing, negative or not a number is 0. */
function amount(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}
