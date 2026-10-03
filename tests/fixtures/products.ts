import type { FinancialProduct } from '@/types/financial-product'

/**
 * Deterministic product fixtures for ranking and comparison tests.
 * Built to exercise the trade-offs that matter: a low rate with a big fee, a
 * product the borrower cannot qualify for, and a plain middle option.
 */

const base: Omit<FinancialProduct, 'id' | 'name' | 'rateMin' | 'rateMax' | 'originationFee'> = {
  providerId: 'provider-1',
  category: 'personal-loan',
  countryCode: 'us',
  currency: 'USD',
  rateType: 'fixed',
  termMonthsMin: 12,
  termMonthsMax: 84,
  amountMin: 1_000,
  amountMax: 50_000,
  eligibility: {
    minCreditScore: 620,
    minIncome: 30_000,
    maxDebtToIncome: 0.45,
    residencyRequired: false,
  },
  featured: false,
  updatedAt: '2026-09-01T00:00:00.000Z',
}

export const lowRateHighFee: FinancialProduct = {
  ...base,
  id: 'low-rate-high-fee',
  name: 'Low rate, heavy fee',
  rateMin: 0.079,
  rateMax: 0.099,
  originationFee: 900,
  provider: {
    id: 'provider-1',
    name: 'Northbank',
    slug: 'northbank',
    logoUrl: null,
    countryCode: 'us',
    rating: 4.4,
    websiteUrl: null,
  },
}

export const middleOption: FinancialProduct = {
  ...base,
  id: 'middle-option',
  name: 'No-fee standard',
  rateMin: 0.089,
  rateMax: 0.119,
  originationFee: 0,
  provider: {
    id: 'provider-2',
    name: 'Harbor Credit',
    slug: 'harbor-credit',
    logoUrl: null,
    countryCode: 'us',
    rating: 4.1,
    websiteUrl: null,
  },
}

export const primeOnly: FinancialProduct = {
  ...base,
  id: 'prime-only',
  name: 'Prime borrowers only',
  rateMin: 0.069,
  rateMax: 0.079,
  originationFee: 0,
  eligibility: { ...base.eligibility, minCreditScore: 760 },
  provider: {
    id: 'provider-3',
    name: 'Summit Lending',
    slug: 'summit-lending',
    logoUrl: null,
    countryCode: 'us',
    rating: 3.8,
    websiteUrl: null,
  },
}

export const PRODUCT_FIXTURES = [lowRateHighFee, middleOption, primeOnly]
