import type { AmortizationRow } from '@/lib/calculations/amortization'
import type { FeeRow, MortgageCountryConfig, MortgageProgramId, ProgramConfig } from './config'

/**
 * The mortgage estimator: the monthly cost of a home price, or the home price a
 * monthly budget buys. Pure: numbers in, numbers out, no rounding (that is for
 * display), no UI. Every default, fee and guideline comes from the country
 * config. Rates, tax and fees are fractions throughout (0.0665 is 6.65%).
 *
 *   loan     = price − down payment (+ the upfront fee, when financed)
 *   P&I      = loan × r ÷ (1 − (1 + r)^−n), r = rate ÷ 12, n = term in months
 *   monthly  = P&I + property tax ÷ 12 + insurance ÷ 12 + mortgage insurance ÷ 12 + HOA
 *   housing  = monthly ÷ (income ÷ 12);  total DTI = (monthly + other debts) ÷ (income ÷ 12)
 */

export type MortgageMode = 'price' | 'budget'
export type AmountOrShare = { unit: 'amount' | 'percent'; value: number }

export interface MortgageEstimateInput {
  mode: MortgageMode
  /** Price mode: required. Null or 0 is not entered yet. */
  homePrice: number | null
  /** Budget mode: the most the household wants to pay a month, all in. */
  monthlyBudget: number | null
  /** A fixed amount, or a share of the price (0.2 is 20%). */
  downPayment: AmountOrShare
  program: MortgageProgramId
  /** Roll the program's upfront fee into the loan, rather than pay it at closing. */
  financeUpfrontFee: boolean
  termMonths: number
  /** Optional; places the home in a region (state) for the property tax estimate. */
  postalCode: string
  /** Only for debt-to-income; never changes the payment. */
  annualIncome: number | null
  monthlyDebts: number
  /** One of the config's credit band ids, or null (not given). */
  creditBand: string | null
  /** Null: estimated from the program, term and credit band. */
  rate: number | null
  /** A yearly amount or a share of the price a year; a null value is estimated from the region. */
  propertyTax: { unit: 'amount' | 'percent'; value: number | null }
  /** Null: estimated as a share of the price. */
  insuranceAnnual: number | null
  /** Annual mortgage insurance as a share of the loan; null: worked out from the program, LTV and credit. */
  mortgageInsuranceRate: number | null
  hoaMonthly: number
  extraMonthly: number
  /** Month of the first payment (month 1–12), for real dates; null for "year 1, year 2". */
  startDate: { year: number; month: number } | null
}

export interface MonthlyCosts {
  principalAndInterest: number
  propertyTax: number
  insurance: number
  mortgageInsurance: number
  hoa: number
  total: number
}

export interface YearMonth {
  year: number
  month: number
}

export interface MortgageFigures {
  mode: MortgageMode
  homePrice: number
  downPayment: number
  downRatio: number
  /** Price less the down payment. */
  baseLoan: number
  upfrontFee: number
  upfrontFeeFinanced: boolean
  /** What is borrowed: the base loan, plus the upfront fee when it is financed. */
  loanAmount: number
  /** The base loan against the price. */
  loanToValue: number
  monthly: MonthlyCosts
  propertyTaxAnnual: number
  propertyTaxRate: number
  insuranceAnnual: number
  /** Mortgage insurance: the annual rate and how long it is paid, or null when there is none. */
  mortgageInsurance: { annualRate: number; months: number; forLife: boolean } | null
  totalInterest: number
  /** Payments until the balance is zero (fewer than the term with extra principal). */
  payoffMonths: number
  monthsSaved: number
  interestSaved: number
  /** The month of the last payment, when a start date is set. */
  payoffDate: YearMonth | null
  /** Down payment, plus the upfront fee when it is not financed. Closing costs not included. */
  cashAtClosing: number
  /** The program's usual minimum down payment, when this one is below it. */
  belowMinimumDown: number | null
  dti: { front: number; back: number; frontLimit: number | null; backLimit: number } | null
  /** Month-by-month rows for the charts. */
  rows: AmortizationRow[]
}

export type EstimateIssue = 'downPercentTooHigh' | 'downOverPrice' | 'budgetTooLow'

export interface MortgageEstimate {
  rate: number
  rateEstimated: boolean
  /** The region the postal code places the home in, when it does. */
  region: { code: string; name: string } | null
  /** Each estimated value as used (null when the user typed it). */
  estimated: { propertyTaxRate: number | null; insuranceRate: number | null; mortgageInsuranceRate: boolean }
  issue: EstimateIssue | null
  /** Null until the required input is entered and valid. */
  figures: MortgageFigures | null
}

/** Present value of n monthly payments of 1 at monthly rate r; n when r = 0. */
export function annuityFactor(monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return months
  return (1 - (1 + monthlyRate) ** -months) / monthlyRate
}

/** The rate used: the one entered, or the estimate for the program, term and credit band. */
export function resolveRate(
  config: MortgageCountryConfig,
  input: Pick<MortgageEstimateInput, 'rate' | 'program' | 'termMonths' | 'creditBand'>,
) {
  if (isSet(input.rate)) return { rate: input.rate, estimated: false }
  const program = programOf(config, input.program)
  // Any typed term takes the rate of the nearest term in the table; none typed yet, the example term's.
  const termMonths = input.termMonths > 0 ? input.termMonths : config.term.exampleMonths
  const years = nearest(Object.keys(config.estimates.rateByTermYears).map(Number), termMonths / 12)
  const credit = input.creditBand ? (config.estimates.rateByCredit[input.creditBand] ?? 0) : 0
  return {
    rate: config.estimates.rateByTermYears[years] + program.rateSpread + credit * program.creditSensitivity,
    estimated: true,
  }
}

/** The program's usual minimum down payment for a credit band. */
export function minimumDown(config: MortgageCountryConfig, program: MortgageProgramId, creditBand: string | null) {
  const rules = programOf(config, program)
  return (creditBand ? rules.minDownByCredit?.[creditBand] : undefined) ?? rules.minDown
}

export function estimateMortgage(config: MortgageCountryConfig, input: MortgageEstimateInput): MortgageEstimate {
  const { rate, estimated: rateEstimated } = resolveRate(config, input)
  const regionCode = config.isPostalCode(input.postalCode) ? config.regionOf(input.postalCode) : null
  const region = regionCode ? { code: regionCode, name: config.estimates.propertyTaxByRegion[regionCode].name } : null
  const taxEstimateRate = region ? config.estimates.propertyTaxByRegion[region.code].rate : config.estimates.propertyTaxNational
  const base = {
    rate,
    rateEstimated,
    region,
    estimated: {
      propertyTaxRate: isSet(input.propertyTax.value) ? null : taxEstimateRate,
      insuranceRate: isSet(input.insuranceAnnual) ? null : config.estimates.insuranceRate,
      mortgageInsuranceRate: !isSet(input.mortgageInsuranceRate),
    },
  }

  if (!(input.termMonths > 0)) return { ...base, issue: null, figures: null }
  const percentDown = input.downPayment.unit === 'percent'
  if (percentDown && amount(input.downPayment.value) >= 1) return { ...base, issue: 'downPercentTooHigh', figures: null }

  const model = new Model(config, input, rate, taxEstimateRate)

  if (input.mode === 'price') {
    const price = amount(input.homePrice ?? 0)
    if (price <= 0) return { ...base, issue: null, figures: null }
    if (model.costsAt(price).baseLoan <= 0) return { ...base, issue: 'downOverPrice', figures: null }
    return { ...base, issue: null, figures: model.figuresAt(price, 'price') }
  }

  const budget = amount(input.monthlyBudget ?? 0)
  if (budget <= 0) return { ...base, issue: null, figures: null }
  const price = model.solvePrice(budget)
  if (price === null) return { ...base, issue: 'budgetTooLow', figures: null }
  return { ...base, issue: null, figures: model.figuresAt(price, 'budget') }
}

/**
 * "What if" variants of a price-mode estimate: a 15-year term, 20% down, $200
 * more toward principal each month, and a rate half a point lower. Each comes
 * with the input that produces it, so the page can apply it.
 */
export function mortgageWhatIfs(config: MortgageCountryConfig, input: MortgageEstimateInput) {
  const current = estimateMortgage(config, input)
  if (input.mode !== 'price' || !current.figures) return []
  const figures = current.figures
  const variants: { id: string; input: MortgageEstimateInput }[] = []
  if (input.termMonths > 180) variants.push({ id: 'fifteen-year', input: { ...input, termMonths: 180 } })
  if (figures.downRatio < 0.2 - 1e-9)
    variants.push({ id: 'twenty-percent-down', input: { ...input, downPayment: { unit: 'percent', value: 0.2 } } })
  variants.push({ id: 'extra-200', input: { ...input, extraMonthly: amount(input.extraMonthly) + 200 } })
  if (current.rate >= 0.005) variants.push({ id: 'rate-drop', input: { ...input, rate: current.rate - 0.005 } })

  return variants.flatMap(({ id, input: next }) => {
    const variant = estimateMortgage(config, next).figures
    if (!variant) return []
    return [
      {
        id,
        input: next,
        costDelta: variant.totalInterest - figures.totalInterest,
        paymentDelta: variant.monthly.total - figures.monthly.total,
        periodsDelta: variant.payoffMonths - figures.payoffMonths,
      },
    ]
  })
}

/** Adds months to a year and month: month 0 is the start itself. */
export function addMonths(start: YearMonth, months: number): YearMonth {
  const index = start.year * 12 + (start.month - 1) + months
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

/* ---------- the model behind both modes ---------- */

interface CostsAt {
  downPayment: number
  downRatio: number
  baseLoan: number
  upfrontFee: number
  loanAmount: number
  ltv: number
  taxAnnual: number
  taxRate: number
  insuranceAnnual: number
  /** Annual mortgage insurance rate on the loan amount; 0 when none. */
  miRate: number
}

class Model {
  private readonly program: ProgramConfig
  private readonly r: number
  private readonly n: number
  private readonly f: number

  constructor(
    private readonly config: MortgageCountryConfig,
    private readonly input: MortgageEstimateInput,
    private readonly rate: number,
    private readonly taxEstimateRate: number,
  ) {
    this.program = programOf(config, input.program)
    this.r = rate / 12
    this.n = input.termMonths
    this.f = annuityFactor(this.r, this.n)
  }

  /** Everything that depends on the price: down payment, loan, fee, tax, insurance and the mortgage insurance rate. */
  costsAt(price: number): CostsAt {
    const { input, config, program } = this
    const down = amount(input.downPayment.value)
    const downPayment = input.downPayment.unit === 'percent' ? down * price : down
    const downRatio = price > 0 ? downPayment / price : 0
    const baseLoan = price - downPayment
    const ltv = price > 0 ? baseLoan / price : 0
    const context = { down: downRatio, termMonths: this.n, ltv }

    const feeRate = firstMatch(program.upfrontFee, context)?.rate ?? 0
    const upfrontFee = Math.max(0, baseLoan) * feeRate
    const loanAmount = baseLoan + (input.financeUpfrontFee ? upfrontFee : 0)

    const taxRate =
      input.propertyTax.unit === 'percent' && isSet(input.propertyTax.value)
        ? input.propertyTax.value
        : this.taxEstimateRate
    const taxAnnual =
      input.propertyTax.unit === 'amount' && isSet(input.propertyTax.value) ? input.propertyTax.value : price * taxRate
    const insuranceAnnual = isSet(input.insuranceAnnual) ? input.insuranceAnnual : price * config.estimates.insuranceRate

    let miRate: number
    if (isSet(input.mortgageInsuranceRate)) miRate = input.mortgageInsuranceRate
    else if (program.insurance.kind === 'pmi')
      miRate = ltv > program.insurance.requiredAboveLtv ? this.pmiRate(ltv) : 0
    else if (program.insurance.kind === 'premium') miRate = firstMatch(program.insurance.rows, context)?.rate ?? 0
    else miRate = 0

    return {
      downPayment,
      downRatio,
      baseLoan,
      upfrontFee,
      loanAmount,
      ltv,
      taxAnnual,
      taxRate: price > 0 ? taxAnnual / price : taxRate,
      insuranceAnnual,
      miRate,
    }
  }

  private pmiRate(ltv: number) {
    const { estimates } = this.config
    const band = this.input.creditBand
    const byCredit = band ? (estimates.pmiByCredit[band] ?? estimates.pmiUnknownCredit) : estimates.pmiUnknownCredit
    const factor = estimates.pmiLtvFactor.find((tier) => ltv <= tier.maxLtv)?.factor ?? 1
    return byCredit * factor
  }

  /**
   * Budget mode: the price whose monthly total fits the budget. The costs other
   * than P&I (tax, insurance, mortgage insurance, HOA) and the down payment
   * can all depend on the price, so it is found by fixed-point iteration: take
   * a price, subtract the non-P&I costs at that price from the budget, turn
   * the rest into a loan by reversing the annuity, add the down payment, and
   * repeat until the price stops moving. Null when the budget does not cover
   * the costs that come before any loan.
   */
  solvePrice(budget: number): number | null {
    const { input } = this
    const percent = input.downPayment.unit === 'percent'
    const down = amount(input.downPayment.value)
    let price = budget * this.f + (percent ? 0 : down)
    let previous = Number.NaN

    for (let pass = 0; pass < 200; pass++) {
      const c = this.costsAt(price)
      const others = (c.taxAnnual + c.insuranceAnnual + c.miRate * c.loanAmount) / 12 + amount(input.hoaMonthly)
      const available = budget - others
      if (available <= 0) return null
      const loan = available * this.f
      const feeRate = c.baseLoan > 0 ? c.upfrontFee / c.baseLoan : 0
      const baseLoan = input.financeUpfrontFee ? loan / (1 + feeRate) : loan
      const next = Math.max(0, percent ? baseLoan / (1 - down) : baseLoan + down)
      if (Math.abs(next - price) < 1e-6) return next
      // A step in the mortgage insurance tiers can make it alternate between two
      // prices; take the lower, which stays within the budget.
      if (Math.abs(next - previous) < 1e-6) return Math.min(next, price)
      previous = price
      price = next
    }
    return price
  }

  figuresAt(price: number, mode: MortgageMode): MortgageFigures {
    const { input, program, config, r, n, f } = this
    const c = this.costsAt(price)
    const payment = c.loanAmount / f
    const extra = amount(input.extraMonthly)

    // Month by month until the balance is zero: extra principal ends the loan early.
    const rows: AmortizationRow[] = []
    let balance = c.loanAmount
    let cumulativeInterest = 0
    let cumulativePrincipal = 0
    let miEnds: number | null = null
    const insurance = program.insurance
    const removeAt = insurance.kind === 'pmi' ? insurance.removeAtLtv * price : null
    for (let period = 1; period <= n && balance > 1e-6; period++) {
      const interest = balance * r
      const scheduled = Math.min(balance, payment - interest)
      const extraPaid = Math.min(balance - scheduled, extra)
      balance = balance - scheduled - extraPaid
      if (Math.abs(balance) < 1e-6) balance = 0
      cumulativeInterest += interest
      cumulativePrincipal += scheduled + extraPaid
      rows.push({
        period,
        payment: interest + scheduled + extraPaid,
        principal: scheduled,
        interest,
        extraPayment: extraPaid,
        balance,
        cumulativeInterest,
        cumulativePrincipal,
      })
      if (removeAt !== null && miEnds === null && balance <= removeAt) miEnds = period
    }
    const payoffMonths = rows.length
    const scheduledInterest = payment * n - c.loanAmount

    const monthly: MonthlyCosts = {
      principalAndInterest: payment,
      propertyTax: c.taxAnnual / 12,
      insurance: c.insuranceAnnual / 12,
      mortgageInsurance: (c.miRate * c.loanAmount) / 12,
      hoa: amount(input.hoaMonthly),
      total: 0,
    }
    monthly.total =
      monthly.principalAndInterest + monthly.propertyTax + monthly.insurance + monthly.mortgageInsurance + monthly.hoa

    let mortgageInsurance: MortgageFigures['mortgageInsurance'] = null
    if (c.miRate > 0) {
      const limited =
        insurance.kind === 'premium' &&
        insurance.limitedWithDown !== undefined &&
        insurance.years !== undefined &&
        c.downRatio >= insurance.limitedWithDown - 1e-9
      const months =
        insurance.kind === 'pmi'
          ? (miEnds ?? payoffMonths)
          : limited && insurance.kind === 'premium'
            ? Math.min(insurance.years! * 12, payoffMonths)
            : payoffMonths
      mortgageInsurance = { annualRate: c.miRate, months, forLife: insurance.kind !== 'pmi' && !limited }
    }

    const income = amount(input.annualIncome ?? 0)
    const minDown = minimumDown(config, input.program, input.creditBand)

    return {
      mode,
      homePrice: price,
      downPayment: c.downPayment,
      downRatio: c.downRatio,
      baseLoan: c.baseLoan,
      upfrontFee: c.upfrontFee,
      upfrontFeeFinanced: input.financeUpfrontFee,
      loanAmount: c.loanAmount,
      loanToValue: c.ltv,
      monthly,
      propertyTaxAnnual: c.taxAnnual,
      propertyTaxRate: c.taxRate,
      insuranceAnnual: c.insuranceAnnual,
      mortgageInsurance,
      totalInterest: cumulativeInterest,
      payoffMonths,
      monthsSaved: n - payoffMonths,
      interestSaved: Math.max(0, scheduledInterest - cumulativeInterest),
      payoffDate: input.startDate ? addMonths(input.startDate, payoffMonths - 1) : null,
      cashAtClosing: c.downPayment + (input.financeUpfrontFee ? 0 : c.upfrontFee),
      belowMinimumDown: c.downRatio < minDown - 1e-9 ? minDown : null,
      dti:
        income > 0
          ? {
              front: monthly.total / (income / 12),
              back: (monthly.total + amount(input.monthlyDebts)) / (income / 12),
              frontLimit: program.dti.front,
              backLimit: program.dti.back,
            }
          : null,
      rows,
    }
  }
}

/* ---------- helpers ---------- */

function programOf(config: MortgageCountryConfig, id: MortgageProgramId): ProgramConfig {
  const program = config.program[id]
  if (!program) throw new Error(`No ${id} program in the ${config.country} mortgage config`)
  return program
}

function firstMatch(rows: FeeRow[], context: { down: number; termMonths: number; ltv: number }) {
  return rows.find(
    (row) =>
      (row.minDown === undefined || context.down >= row.minDown - 1e-9) &&
      (row.maxTermMonths === undefined || context.termMonths <= row.maxTermMonths) &&
      (row.aboveLtv === undefined || context.ltv > row.aboveLtv),
  )
}

function nearest(values: number[], target: number) {
  return values.reduce((best, value) => (Math.abs(value - target) < Math.abs(best - target) ? value : best))
}

function isSet(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value) && value >= 0
}

/** A money input as a usable amount: anything missing, negative or not a number is 0. */
function amount(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}
