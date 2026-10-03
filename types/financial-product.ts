import type { CountryCode } from './country'
import type { CurrencyCode } from './common'

export type ProductCategory = 'mortgage' | 'car-loan' | 'personal-loan' | 'savings'

export interface Provider {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  countryCode: CountryCode
  rating: number | null
  websiteUrl: string | null
}

export interface FinancialProduct {
  id: string
  providerId: string
  provider?: Provider
  category: ProductCategory
  name: string
  countryCode: CountryCode
  currency: CurrencyCode
  /** Annual rate as a fraction: 0.0725 === 7.25%. */
  rateMin: number
  rateMax: number
  rateType: 'fixed' | 'variable'
  termMonthsMin: number
  termMonthsMax: number
  amountMin: number
  amountMax: number
  originationFee: number
  eligibility: Eligibility
  featured: boolean
  updatedAt: string
}

export interface Eligibility {
  minCreditScore: number | null
  minIncome: number | null
  maxDebtToIncome: number | null
  residencyRequired: boolean
}

export interface ProductMatch {
  product: FinancialProduct
  /** 0-100. */
  score: number
  reasons: string[]
  estimatedPayment: number | null
  eligible: boolean
}
