import type { CountryCode } from '@/types/country'
import type { ProductCategory } from '@/types/financial-product'
import type { Language } from '@/types/common'

export interface ProductQuery {
  category: ProductCategory
  countryCode: CountryCode
  amount?: number
  termMonths?: number
  creditScore?: number
  monthlyIncome?: number
  monthlyDebts?: number
  /** Include products the user does not currently qualify for. */
  includeIneligible?: boolean
  limit?: number
  /** Language for the human-readable match reasons. Defaults to English. */
  language?: Language
}

export interface MatchWeights {
  rate: number
  eligibility: number
  fees: number
  termFit: number
  providerRating: number
}

export interface RankedProductList {
  matches: import('@/types/financial-product').ProductMatch[]
  total: number
  /** Best rate present in the result set, for the "from x%" label. */
  bestRate: number | null
}
