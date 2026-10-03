'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ComparisonChart } from '@/components/charts/ComparisonChart'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatPercent } from '@/lib/utils/format-number'
import { useI18n } from '@/lib/i18n/client'
import type { ProductCostRow } from '@/features/products/compare-products'
import type { CountryConfig } from '@/types/country'
import type { CurrencyCode } from '@/types/currency'

export interface ProductComparisonProps {
  rows: ProductCostRow[]
  currency: CurrencyCode
  country: CountryConfig
  amount: number
  termMonths: number
}

/**
 * Side-by-side total cost.
 *
 * Ranked by what the loan actually costs over its life, not by headline rate —
 * a lower rate with a heavy origination fee can lose on a short term, and that
 * inversion is the whole point of the view.
 */
export function ProductComparison({
  rows,
  currency,
  country,
  amount,
  termMonths,
}: ProductComparisonProps) {
  const { t } = useI18n()
  if (rows.length === 0) return null

  const best = rows[0]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t.products.comparisonTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t.products.comparisonIntro(
            formatCurrency(amount, currency),
            Math.round(termMonths / 12),
            t.countries[country.code],
          )}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <ComparisonChart
          bars={rows.map((row, index) => ({
            label: row.providerName,
            value: row.totalCost,
            highlight: index === 0,
          }))}
          currency={currency}
          caption={t.products.comparisonCaption}
        />

        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.productId} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{row.providerName}</p>
                  {row.productId === best.productId && (
                    <Badge variant="success">{t.products.lowestCost}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {row.productName} · {formatPercent(row.rate, country.locale)}
                  {row.fees > 0 && t.products.feeSuffix(formatCurrency(row.fees, currency))}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-medium tabular-nums">
                  {formatCurrency(row.monthlyPayment, currency)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    {t.common.perMonthShort}
                  </span>
                </p>
                {row.costVsBest > 0 && (
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {t.products.overTerm(formatCurrency(row.costVsBest, currency))}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
