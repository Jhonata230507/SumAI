import { toPeriodicRate } from '@/lib/calculations/interest'
import { periodicPayment } from '@/lib/calculations/payment'
import { roundTo } from '@/lib/calculations/rounding'
import { getCountry } from '@/lib/countries'
import { getDictionary } from '@/lib/i18n'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatMonths } from '@/lib/utils/format-number'
import type { FinancialProduct, ProductMatch } from '@/types/financial-product'
import type { MatchWeights, ProductQuery, RankedProductList } from './types'

export const DEFAULT_WEIGHTS: MatchWeights = {
  rate: 0.45,
  eligibility: 0.25,
  fees: 0.12,
  termFit: 0.1,
  providerRating: 0.08,
}

/**
 * Scores products against what the user actually asked for.
 *
 * Rate dominates, because over a full term it dominates cost. Eligibility is
 * weighted heavily too: a great rate the user cannot get is worth nothing, so
 * ineligible products are scored but pushed below every eligible one.
 */
export function rankProducts(
  products: FinancialProduct[],
  query: ProductQuery,
  weights: MatchWeights = DEFAULT_WEIGHTS,
): RankedProductList {
  const text = getDictionary(query.language ?? 'en').products.reasons
  // A loan is better with a lower rate; a savings account with a higher one.
  const higherIsBetter = query.category === 'savings'
  const rates = products.map((p) => p.rateMin)
  const low = rates.length ? Math.min(...rates) : null
  const high = rates.length ? Math.max(...rates) : null
  const bestRate = higherIsBetter ? high : low
  const worstRate = higherIsBetter ? low : high

  // With an amount and a term, the honest comparison is what each loan costs in
  // full — interest plus fees — so that replaces the separate rate and fee scores.
  const costs = higherIsBetter ? [] : products.map((p) => totalCost(p, query))
  const knownCosts = costs.filter((c): c is number => c !== null)
  const useCost = knownCosts.length === products.length && knownCosts.length > 0
  const cheapest = useCost ? Math.min(...knownCosts) : 0
  const dearest = useCost ? Math.max(...knownCosts) : 0

  const matches: ProductMatch[] = products.map((product, index) => {
    const eligibility = scoreEligibility(product, query, text)
    const reasons: string[] = []

    const rateScore =
      bestRate === null || worstRate === null || worstRate === bestRate
        ? 1
        : 1 - Math.abs(product.rateMin - bestRate) / Math.abs(worstRate - bestRate)

    if (product.rateMin === bestRate) reasons.push(higherIsBetter ? text.highestRate : text.lowestRate)

    const feeScore = product.originationFee === 0 ? 1 : Math.max(0, 1 - product.originationFee / 1000)
    if (product.originationFee === 0) reasons.push(text.noFee)

    const termScore = scoreTermFit(product, query.termMonths)
    const ratingScore = (product.provider?.rating ?? 3) / 5

    if (eligibility.eligible && query.creditScore) {
      reasons.push(text.meetsRequirements)
    }
    if (!eligibility.eligible) {
      reasons.push(...eligibility.blockers)
    }

    const costScore = useCost && dearest > cheapest ? 1 - (costs[index]! - cheapest) / (dearest - cheapest) : 1
    const priceScore = useCost
      ? costScore * (weights.rate + weights.fees)
      : rateScore * weights.rate + feeScore * weights.fees

    const raw =
      priceScore +
      eligibility.score * weights.eligibility +
      termScore * weights.termFit +
      ratingScore * weights.providerRating

    // Ineligible products stay visible but never outrank an eligible one.
    const score = eligibility.eligible ? raw * 100 : raw * 40

    return {
      product,
      score: roundTo(score, 1),
      reasons,
      estimatedPayment: estimatePayment(product, query),
      eligible: eligibility.eligible,
    }
  })

  const visible = query.includeIneligible ? matches : matches.filter((m) => m.eligible)

  return {
    matches: visible.sort((a, b) => b.score - a.score),
    total: visible.length,
    bestRate,
  }
}

type ReasonText = ReturnType<typeof getDictionary>['products']['reasons']

function scoreEligibility(product: FinancialProduct, query: ProductQuery, text: ReasonText) {
  const blockers: string[] = []
  let met = 0
  let checked = 0

  const { minCreditScore, minIncome, maxDebtToIncome } = product.eligibility

  // A product that does not lend this amount or term stays listed, with the reason.
  const money = (v: number) => formatCurrency(v, product.currency, { compact: true })
  if (query.amount !== undefined) {
    if (query.amount > product.amountMax) blockers.push(text.amountAbove(money(product.amountMax)))
    else if (query.amount < product.amountMin) blockers.push(text.amountBelow(money(product.amountMin)))
  }
  if (
    query.termMonths !== undefined &&
    (query.termMonths < product.termMonthsMin || query.termMonths > product.termMonthsMax)
  ) {
    const locale = getCountry(query.countryCode).locale
    blockers.push(
      text.termOutside(`${formatMonths(product.termMonthsMin, locale)}–${formatMonths(product.termMonthsMax, locale)}`),
    )
  }

  if (minCreditScore !== null && query.creditScore !== undefined) {
    checked += 1
    if (query.creditScore >= minCreditScore) met += 1
    else blockers.push(text.needsScore(minCreditScore))
  }

  if (minIncome !== null && query.monthlyIncome !== undefined) {
    checked += 1
    if (query.monthlyIncome * 12 >= minIncome) met += 1
    else blockers.push(text.incomeBelow)
  }

  if (maxDebtToIncome !== null && query.monthlyIncome !== undefined && query.monthlyDebts !== undefined) {
    checked += 1
    const dti = query.monthlyDebts / query.monthlyIncome
    if (dti <= maxDebtToIncome) met += 1
    else blockers.push(text.debtAbove)
  }

  // With nothing to check against, treat the product as open rather than blocked.
  const score = checked === 0 ? 0.75 : met / checked
  return { score, eligible: blockers.length === 0, blockers }
}

function scoreTermFit(product: FinancialProduct, termMonths?: number): number {
  if (termMonths === undefined) return 0.75
  if (termMonths >= product.termMonthsMin && termMonths <= product.termMonthsMax) return 1

  const distance =
    termMonths < product.termMonthsMin ? product.termMonthsMin - termMonths : termMonths - product.termMonthsMax

  return Math.max(0, 1 - distance / 120)
}

function estimatePayment(product: FinancialProduct, query: ProductQuery): number | null {
  if (query.amount === undefined || query.termMonths === undefined) return null

  const country = getCountry(query.countryCode)
  const periodicRate = toPeriodicRate(product.rateMin, 12, country.rules.quotesEffectiveAnnualRate)

  return periodicPayment(query.amount, periodicRate, query.termMonths)
}

/** Full cost over the term: every payment plus the upfront fee. Null without an amount and term. */
function totalCost(product: FinancialProduct, query: ProductQuery): number | null {
  const payment = estimatePayment(product, query)
  return payment === null || query.termMonths === undefined ? null : payment * query.termMonths + product.originationFee
}
