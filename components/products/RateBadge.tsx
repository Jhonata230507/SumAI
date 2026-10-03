'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { formatPercent } from '@/lib/utils/format-number'
import { useI18n } from '@/lib/i18n/client'
import type { CountryConfig } from '@/types/country'

export interface RateBadgeProps {
  rateMin: number
  rateMax?: number
  rateType: 'fixed' | 'variable'
  country: CountryConfig
}

/**
 * A rate, labelled with how it is quoted.
 *
 * "7.25%" means different things in different markets, and a comparison table
 * that hides that is misleading. The badge always says which convention applies.
 */
export function RateBadge({ rateMin, rateMax, rateType, country }: RateBadgeProps) {
  const { t } = useI18n()
  const effective = country.rules.quotesEffectiveAnnualRate
  const basis = effective ? t.products.rateBasis.effective : t.products.rateBasis.nominal
  const range =
    rateMax !== undefined && rateMax > rateMin
      ? `${formatPercent(rateMin, country.locale)} – ${formatPercent(rateMax, country.locale)}`
      : formatPercent(rateMin, country.locale)

  return (
    <Tooltip content={effective ? t.products.effectiveHint : t.products.nominalHint}>
      <span className="inline-flex items-baseline gap-1.5">
        <span className="text-lg font-semibold tabular-nums">{range}</span>
        <Badge variant="outline">
          {basis} · {t.products.rateTypes[rateType]}
        </Badge>
      </span>
    </Tooltip>
  )
}
