'use client'

import { ExternalLink, Star } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip } from '@/components/ui/tooltip'
import { EligibilityBadge } from './EligibilityBadge'
import { LenderLogo } from './LenderLogo'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatMonths, formatPercent } from '@/lib/utils/format-number'
import { useI18n } from '@/lib/i18n/client'
import type { ProductMatch } from '@/types/financial-product'
import type { CountryConfig } from '@/types/country'

export interface ProductCardProps {
  match: ProductMatch
  country: CountryConfig
  /** Position in the list, recorded with the outbound click and shown as the rank. */
  position: number
  hasProfile?: boolean
  /** True for the sample catalogue: fictional lenders with no offer to link to. */
  sample?: boolean
}

/**
 * One lender in a product listing: who (image, name, product, rating), the rate
 * (from, up to, and how it is quoted), the figures that matter (payment,
 * amounts, terms, fee), then whether the user qualifies and the way out.
 */
export function ProductCard({ match, country, position, hasProfile = false, sample = false }: ProductCardProps) {
  const { t } = useI18n()
  const { product } = match
  const locale = country.locale
  const lender = product.provider?.name ?? t.products.provider
  const effective = country.rules.quotesEffectiveAnnualRate
  const basis = effective ? t.products.rateBasis.effective : t.products.rateBasis.nominal
  const money = (value: number) => formatCurrency(value, product.currency, { compact: true })
  const best = position === 1
  const r = t.products.reasons
  // The fee already has its own tile, so "no fee" is not repeated as a chip.
  const highlights = match.eligible
    ? match.reasons.filter((reason) => reason !== r.meetsRequirements && reason !== r.noFee)
    : []
  const facts = match.estimatedPayment !== null ? 4 : 3
  const website = sample ? null : product.provider?.websiteUrl

  return (
    <Card
      className={cn(
        'transition-[border-color] duration-300 hover:border-white/25',
        best && 'border-primary/50',
        !match.eligible && 'opacity-80',
      )}
    >
      <CardContent className="p-5 sm:p-6">
        {/* Who, and the rate. */}
        <div className="flex flex-wrap items-start gap-4">
          <span className="mt-1 w-5 shrink-0 text-sm font-medium tabular-nums text-muted-foreground">{position}</span>
          <LenderLogo name={lender} logoUrl={product.provider?.logoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold">{lender}</p>
              {best && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                  {t.offers.best}
                </span>
              )}
              {product.featured && (
                <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] font-medium">
                  {t.products.featured}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{product.name}</p>
            {product.provider?.rating != null && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-amber-300 text-amber-300" aria-hidden />
                {product.provider.rating.toFixed(1)}
              </p>
            )}
          </div>

          <Tooltip content={effective ? t.products.effectiveHint : t.products.nominalHint}>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{t.products.from}</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {formatPercent(product.rateMin, locale)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">{basis}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {product.rateMax > product.rateMin && `${t.products.upTo(formatPercent(product.rateMax, locale))} · `}
                {t.products.rateTypes[product.rateType]}
              </p>
            </div>
          </Tooltip>
        </div>

        {/* The figures that matter, as tiles. */}
        <dl className={cn('mt-5 grid grid-cols-2 gap-2', facts === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3')}>
          {match.estimatedPayment !== null && (
            <Fact
              label={t.products.estimatedPayment}
              value={formatCurrency(match.estimatedPayment, product.currency)}
              strong
            />
          )}
          <Fact label={t.products.amount} value={`${money(product.amountMin)} – ${money(product.amountMax)}`} />
          <Fact
            label={t.products.term}
            value={`${formatMonths(product.termMonthsMin, locale)} – ${formatMonths(product.termMonthsMax, locale)}`}
          />
          <Fact
            label={t.products.fee}
            value={product.originationFee > 0 ? formatCurrency(product.originationFee, product.currency) : t.products.noFee}
          />
        </dl>

        {/* Whether it fits, what stands out, and the way out. */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <EligibilityBadge eligible={match.eligible} reasons={match.reasons} unknown={!hasProfile && match.eligible} />
          {highlights.map((highlight) => (
            <span key={highlight} className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs text-muted-foreground">
              {highlight}
            </span>
          ))}

          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
              data-product-id={product.id}
              data-position={position}
              className={cn(buttonVariants({ size: 'sm' }), 'ml-auto gap-1.5')}
            >
              {t.products.viewOffer}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : (
            // Sample lenders have no real offer to link to.
            <span
              title={t.products.sampleBanner}
              className={cn(
                buttonVariants({ size: 'sm', variant: 'outline' }),
                'ml-auto cursor-not-allowed gap-1.5 opacity-60',
              )}
            >
              {t.products.sampleLender}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Fact({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn('rounded-xl px-3 py-2.5', strong ? 'bg-primary/[0.08]' : 'bg-white/[0.04]')}>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className={cn('mt-0.5 text-sm tabular-nums', strong && 'font-semibold')}>{value}</dd>
    </div>
  )
}
