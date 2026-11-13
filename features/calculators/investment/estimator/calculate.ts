import type { GrowthPoint } from '@/lib/calculations/compound-interest'
import { PERIODS_PER_YEAR, type AccountType, type ContributionFrequency, type InvestmentCountryConfig } from './config'

/**
 * The investment estimator: what a plan grows into ("How much will I have?"),
 * or what it takes to reach a target ("How much do I need to save?"). Pure:
 * numbers in, numbers out, no rounding (that is for display), no UI. Defaults
 * come from the country config. Rates are fractions (0.07 is 7%).
 *
 * Each period the balance earns (return − fees) ÷ periods per year; the
 * contribution goes in at the start or the end of the period, and rises by the
 * annual increase at the start of each new year.
 */

export type InvestmentMode = 'grow' | 'goal'
export type ContributionTiming = 'start' | 'end'

export interface InvestmentEstimateInput {
  mode: InvestmentMode
  /** Optional; empty is nothing to start with. */
  initialAmount: number | null
  /** Grow mode: optional, per period. Goal mode: ignored (it is the answer). */
  contribution: number | null
  frequency: ContributionFrequency
  /** Required. */
  years: number | null
  /** Null: the config's estimate. */
  annualReturn: number | null
  /** Goal mode: required. */
  targetAmount: number | null
  /** Annual fees (expense ratio); null is none. */
  feeRate: number | null
  /** Null: the config's estimate. */
  inflationRate: number | null
  accountType: AccountType
  /** Null: the config's estimate for the account type. */
  taxRate: number | null
  /** Annual increase in the contribution; null is none. */
  contributionIncrease: number | null
  timing: ContributionTiming
}

export interface InvestmentFigures {
  mode: InvestmentMode
  /** The contribution per period in the first year: typed (grow) or worked out (goal). */
  contribution: number
  finalBalance: number
  /** The initial investment plus every contribution. */
  totalContributed: number
  /** What the money earned: the final balance less what went in. */
  growth: number
  /** What fees cost: the balance without fees less the balance with them. */
  feesCost: number
  /** The final balance in today's money. */
  realBalance: number
  /** After the account's tax; null when the account type is not given. */
  afterTax: number | null
  tax: number | null
  /** Goal mode: the initial investment alone already reaches the target. */
  alreadyThere: boolean
  /** The same plan at the expected return less and plus the range band. */
  range: { weaker: number; expected: number; stronger: number }
  /** One point per period, for the growth chart. */
  points: GrowthPoint[]
}

export interface InvestmentEstimate {
  annualReturn: number
  returnEstimated: boolean
  inflationRate: number
  inflationEstimated: boolean
  /** The tax rate used for the account type, or null when the account is not taxed or not given. */
  taxRate: number | null
  taxEstimated: boolean
  /** Null until the required input is entered. */
  figures: InvestmentFigures | null
}

/** The tax rate for the account: the one typed, or the estimate; null when it is not taxed or not given. */
export function resolveTaxRate(config: InvestmentCountryConfig, accountType: AccountType, typed: number | null) {
  if (accountType === 'unspecified' || accountType === 'free') return { rate: null, estimated: false }
  if (isSet(typed)) return { rate: typed, estimated: false }
  return { rate: config.estimates.taxRate[accountType] ?? 0, estimated: true }
}

/** The tax owed and what is left, by account type. */
export function applyTax(accountType: AccountType, rate: number | null, finalBalance: number, totalContributed: number) {
  switch (accountType) {
    case 'taxable': {
      // Only the gains are taxed: the balance less everything put in.
      const tax = (rate ?? 0) * Math.max(0, finalBalance - totalContributed)
      return { tax, afterTax: finalBalance - tax }
    }
    case 'deferred': {
      // Every withdrawal is taxed as income.
      const tax = (rate ?? 0) * finalBalance
      return { tax, afterTax: finalBalance - tax }
    }
    case 'free':
      return { tax: 0, afterTax: finalBalance }
    default:
      return { tax: null, afterTax: null }
  }
}

export function estimateInvestment(config: InvestmentCountryConfig, input: InvestmentEstimateInput): InvestmentEstimate {
  const annualReturn = isSet(input.annualReturn) ? input.annualReturn : config.estimates.annualReturn
  const inflationRate = isSet(input.inflationRate) ? input.inflationRate : config.estimates.inflation
  const tax = resolveTaxRate(config, input.accountType, input.taxRate)
  const base = {
    annualReturn,
    returnEstimated: !isSet(input.annualReturn),
    inflationRate,
    inflationEstimated: !isSet(input.inflationRate),
    taxRate: tax.rate,
    taxEstimated: tax.estimated,
  }

  const years = input.years ?? 0
  if (!(years > 0)) return { ...base, figures: null }

  const plan = {
    initial: amount(input.initialAmount ?? 0),
    perYear: PERIODS_PER_YEAR[input.frequency],
    years,
    fee: amount(input.feeRate ?? 0),
    increase: amount(input.contributionIncrease ?? 0),
    timing: input.timing,
  }
  const grow = (contribution: number, rate = annualReturn) => simulate({ ...plan, contribution, rate })

  let contribution: number
  let alreadyThere = false
  if (input.mode === 'grow') {
    contribution = amount(input.contribution ?? 0)
    // Nothing to grow until there is a starting amount or a contribution.
    if (plan.initial <= 0 && contribution <= 0) return { ...base, figures: null }
  } else {
    const target = amount(input.targetAmount ?? 0)
    if (target <= 0) return { ...base, figures: null }
    // The final balance is linear in the contribution: what the initial amount
    // grows into, plus the contribution times what 1 a period grows into.
    const fromInitial = grow(0).finalBalance
    const perUnit = grow(1).finalBalance - fromInitial
    alreadyThere = fromInitial >= target
    contribution = alreadyThere || perUnit <= 0 ? 0 : (target - fromInitial) / perUnit
  }

  const result = grow(contribution)
  const withoutFees = simulate({ ...plan, fee: 0, contribution, rate: annualReturn })
  const taxed = applyTax(input.accountType, tax.rate, result.finalBalance, result.totalContributed)

  return {
    ...base,
    figures: {
      mode: input.mode,
      contribution,
      finalBalance: result.finalBalance,
      totalContributed: result.totalContributed,
      growth: result.finalBalance - result.totalContributed,
      feesCost: Math.max(0, withoutFees.finalBalance - result.finalBalance),
      realBalance: result.finalBalance / (1 + inflationRate) ** years,
      afterTax: taxed.afterTax,
      tax: taxed.tax,
      alreadyThere,
      range: {
        weaker: grow(contribution, Math.max(0, annualReturn - config.rangeBand)).finalBalance,
        expected: result.finalBalance,
        stronger: grow(contribution, annualReturn + config.rangeBand).finalBalance,
      },
      points: result.points,
    },
  }
}

/** Period by period: interest at (rate − fee) ÷ periods a year, the contribution at the start or end. */
function simulate(plan: {
  initial: number
  contribution: number
  rate: number
  fee: number
  perYear: number
  years: number
  increase: number
  timing: ContributionTiming
}) {
  const periodic = (plan.rate - plan.fee) / plan.perYear
  const periods = Math.round(plan.years * plan.perYear)
  const points: GrowthPoint[] = []
  let balance = plan.initial
  let contributed = plan.initial
  let current = plan.contribution
  for (let period = 1; period <= periods; period++) {
    if (period > 1 && (period - 1) % plan.perYear === 0) current *= 1 + plan.increase
    if (plan.timing === 'start') balance += current
    balance += balance * periodic
    if (plan.timing === 'end') balance += current
    contributed += current
    points.push({ period, contributions: contributed, interest: balance - contributed, balance })
  }
  return { finalBalance: balance, totalContributed: contributed, points }
}

function isSet(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value) && value >= 0
}

function amount(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}
