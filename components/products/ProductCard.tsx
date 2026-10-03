'use client'

import { ExternalLink, Star } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RateBadge } from './RateBadge'
import { EligibilityBadge } from './EligibilityBadge'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatMonths } from '@/lib/utils/format-number'
import { useI18n } from '@/lib/i18n/client'
import type { ProductMatch } from '@/types/financial-product'
import type { CountryConfig } from '@/types/country'

export interface ProductCardProps {
  match: ProductMatch
  country: CountryConfig
  /** Position in the list, recorded with the outbound click. */
  position: number
  hasProfile?: boolean
}

export function ProductCard({ match, country, position, hasProfile = false }: ProductCardProps) {
  const { t } = useI18n()
  const { product } = match
  const locale = country.locale

  return (
    <Card className={match.eligible ? undefined : 'opacity-75'}>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium">{product.provider?.name ?? t.products.provider}</p>
              {product.featured && <Badge variant="secondary">{t.products.featured}</Badge>}
            </div>

            <p className="text-sm text-muted-foreground">{product.name}</p>

            {product.provider?.rating != null && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-current" />
                {product.provider.rating.toFixed(1)}
              </p>
            )}
          </div>

          <div className="text-right">
            <RateBadge
              rateMin={product.rateMin}
              rateMax={product.rateMax}
              rateType={product.rateType}
              country={country}
            />
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm sm:grid-cols-3">
          {match.estimatedPayment !== null && (
            <Field
              label={t.products.estimatedPayment}
              value={formatCurrency(match.estimatedPayment, product.currency)}
            />
          )}
          <Field
            label={t.products.amount}
            value={`${formatCurrency(product.amountMin, product.currency, { compact: true })} – ${formatCurrency(product.amountMax, product.currency, { compact: true })}`}
          />
          <Field
            label={t.products.term}
            value={`${formatMonths(product.termMonthsMin, locale)} – ${formatMonths(product.termMonthsMax, locale)}`}
          />
          {product.originationFee > 0 && (
            <Field
              label={t.products.fee}
              value={formatCurrency(product.originationFee, product.currency)}
            />
          )}
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
          <EligibilityBadge
            eligible={match.eligible}
            reasons={match.reasons}
            unknown={!hasProfile}
          />

          <a
            href={product.provider?.websiteUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            data-product-id={product.id}
            data-position={position}
            className={cn(buttonVariants({ size: 'sm' }), 'ml-auto')}
          >
            {t.products.viewOffer}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {match.reasons.length > 0 && match.eligible && (
          <p className="mt-3 text-xs text-muted-foreground">{match.reasons.join(' · ')}</p>
        )}
      </CardContent>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 tabular-nums">{value}</dd>
    </div>
  )
}
