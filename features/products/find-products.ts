import { createClient } from '@/lib/supabase/server'
import type { FinancialProduct } from '@/types/financial-product'
import type { ProductQuery } from './types'

/**
 * Loads candidate products for a query. Filtering that a database can do well
 * happens here; scoring and ranking happen in memory, in `rank-products`.
 */
export async function findProducts(query: ProductQuery): Promise<FinancialProduct[]> {
  const supabase = await createClient()

  let builder = supabase
    .from('products')
    .select('*, provider:providers(*)')
    .eq('category', query.category)
    .eq('country_code', query.countryCode)
    .eq('active', true)

  if (query.amount !== undefined) {
    builder = builder.lte('amount_min', query.amount).gte('amount_max', query.amount)
  }

  if (query.termMonths !== undefined) {
    builder = builder
      .lte('term_months_min', query.termMonths)
      .gte('term_months_max', query.termMonths)
  }

  const { data, error } = await builder
    .order('rate_min', { ascending: true })
    .limit(query.limit ?? 50)

  if (error) throw new Error(`Failed to load products: ${error.message}`)

  return (data ?? []).map(toFinancialProduct)
}

export async function findProductById(id: string): Promise<FinancialProduct | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, provider:providers(*)')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return toFinancialProduct(data)
}

/** Maps the snake_case database row onto the camelCase domain type. */
function toFinancialProduct(row: Record<string, unknown>): FinancialProduct {
  const provider = row.provider as Record<string, unknown> | null

  return {
    id: row.id as string,
    providerId: row.provider_id as string,
    provider: provider
      ? {
          id: provider.id as string,
          name: provider.name as string,
          slug: provider.slug as string,
          logoUrl: (provider.logo_url as string) ?? null,
          countryCode: provider.country_code as FinancialProduct['countryCode'],
          rating: (provider.rating as number) ?? null,
          websiteUrl: (provider.website_url as string) ?? null,
        }
      : undefined,
    category: row.category as FinancialProduct['category'],
    name: row.name as string,
    countryCode: row.country_code as FinancialProduct['countryCode'],
    currency: row.currency as FinancialProduct['currency'],
    rateMin: row.rate_min as number,
    rateMax: row.rate_max as number,
    rateType: row.rate_type as FinancialProduct['rateType'],
    termMonthsMin: row.term_months_min as number,
    termMonthsMax: row.term_months_max as number,
    amountMin: row.amount_min as number,
    amountMax: row.amount_max as number,
    originationFee: (row.origination_fee as number) ?? 0,
    eligibility: {
      minCreditScore: (row.min_credit_score as number) ?? null,
      minIncome: (row.min_income as number) ?? null,
      maxDebtToIncome: (row.max_debt_to_income as number) ?? null,
      residencyRequired: Boolean(row.residency_required),
    },
    featured: Boolean(row.featured),
    updatedAt: row.updated_at as string,
  }
}
