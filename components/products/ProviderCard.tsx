'use client'

import Image from 'next/image'
import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatPercent } from '@/lib/utils/format-number'
import { useI18n } from '@/lib/i18n/client'
import type { Provider } from '@/types/financial-product'
import type { CountryConfig } from '@/types/country'

export interface ProviderCardProps {
  provider: Provider
  country: CountryConfig
  productCount: number
  /** Best rate this provider offers in the current category. */
  bestRate: number | null
}

export function ProviderCard({ provider, country, productCount, bestRate }: ProviderCardProps) {
  const { t } = useI18n()

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        {provider.logoUrl ? (
          <Image
            src={provider.logoUrl}
            alt=""
            width={48}
            height={48}
            className="rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-sm font-medium">
            {provider.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="font-medium">{provider.name}</p>
          <p className="text-sm text-muted-foreground">{t.products.productCount(productCount)}</p>
          {provider.rating != null && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-current" />
              {provider.rating.toFixed(1)}
            </p>
          )}
        </div>

        {bestRate !== null && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t.products.from}</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatPercent(bestRate, country.locale)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
