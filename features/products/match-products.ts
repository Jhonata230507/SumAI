import { findProducts } from './find-products'
import { findSampleProducts, usingSampleCatalog } from './sample-catalog'
import { rankProducts } from './rank-products'
import type { ProductQuery, RankedProductList } from './types'

/**
 * The one call the product surfaces use: fetch candidates, then rank them
 * against the user context. Splitting fetch from rank keeps the scoring
 * testable without a database.
 */
export async function matchProducts(query: ProductQuery): Promise<RankedProductList> {
  // Without a products database (local development, previews), rank the labelled
  // sample catalogue instead, so the product surfaces still work end to end.
  if (usingSampleCatalog()) {
    const products = findSampleProducts({ category: query.category, countryCode: query.countryCode })
    return trim({ ...rankProducts(products, query), sample: true }, query)
  }
  // Exact matches first; if too few, widen to every product in the category so the
  // user still sees the closest options (marked with why they may not fit).
  let products = await findProducts(query)
  if (products.length < 3 && (query.amount !== undefined || query.termMonths !== undefined)) {
    products = await findProducts({ ...query, amount: undefined, termMonths: undefined })
  }
  return trim(rankProducts(products, query), query)
}

function trim(list: RankedProductList, query: ProductQuery): RankedProductList {
  const visible = query.includeIneligible ? list.matches : list.matches.filter((m) => m.eligible)
  return { ...list, matches: visible.slice(0, query.limit ?? 50), total: visible.length }
}

/** Matches against a calculator result the user just produced. */
export async function matchFromCalculation(options: {
  category: ProductQuery['category']
  countryCode: ProductQuery['countryCode']
  amount: number
  termMonths: number
  creditScore?: number
  monthlyIncome?: number
  monthlyDebts?: number
}): Promise<RankedProductList> {
  return matchProducts({ ...options, limit: 12 })
}
