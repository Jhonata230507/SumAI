import { findProducts } from './find-products'
import { rankProducts } from './rank-products'
import type { ProductQuery, RankedProductList } from './types'

/**
 * The one call the product surfaces use: fetch candidates, then rank them
 * against the user context. Splitting fetch from rank keeps the scoring
 * testable without a database.
 */
export async function matchProducts(query: ProductQuery): Promise<RankedProductList> {
  const products = await findProducts(query)
  return rankProducts(products, query)
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
