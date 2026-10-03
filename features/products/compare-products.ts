import { toPeriodicRate } from '@/lib/calculations/interest'
import { periodicPayment, totalInterest } from '@/lib/calculations/payment'
import { roundMoney } from '@/lib/calculations/rounding'
import { getCountry } from '@/lib/countries'
import type { CountryCode } from '@/types/country'
import type { FinancialProduct } from '@/types/financial-product'

export interface ProductCostRow {
  productId: string
  productName: string
  providerName: string
  rate: number
  monthlyPayment: number
  totalInterest: number
  fees: number
  /** Payment plus interest plus fees — the number that actually compares. */
  totalCost: number
  /** Extra cost versus the cheapest option in the set. */
  costVsBest: number
}

/**
 * Compares products on total cost rather than headline rate.
 * A lower rate with a large origination fee often loses on a short term, which
 * is exactly the comparison a rate table hides.
 */
export function compareProducts(
  products: FinancialProduct[],
  amount: number,
  termMonths: number,
  countryCode: CountryCode,
): ProductCostRow[] {
  const country = getCountry(countryCode)

  const rows = products.map((product) => {
    const periodicRate = toPeriodicRate(
      product.rateMin,
      12,
      country.rules.quotesEffectiveAnnualRate,
    )

    const monthlyPayment = periodicPayment(amount, periodicRate, termMonths)
    const interest = totalInterest(amount, periodicRate, termMonths)
    const fees = roundMoney(product.originationFee)

    return {
      productId: product.id,
      productName: product.name,
      providerName: product.provider?.name ?? 'Unknown provider',
      rate: product.rateMin,
      monthlyPayment,
      totalInterest: interest,
      fees,
      totalCost: roundMoney(amount + interest + fees),
      costVsBest: 0,
    }
  })

  if (rows.length === 0) return rows

  const best = Math.min(...rows.map((r) => r.totalCost))
  for (const row of rows) row.costVsBest = roundMoney(row.totalCost - best)

  return rows.sort((a, b) => a.totalCost - b.totalCost)
}
