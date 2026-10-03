'use client'

import { useState } from 'react'
import { ArrowUpDown, ExternalLink } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EligibilityBadge } from './EligibilityBadge'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatPercent } from '@/lib/utils/format-number'
import { useI18n } from '@/lib/i18n/client'
import type { ProductMatch } from '@/types/financial-product'
import type { CountryConfig } from '@/types/country'

export interface ProductTableProps {
  matches: ProductMatch[]
  country: CountryConfig
  hasProfile?: boolean
}

type SortKey = 'score' | 'rate' | 'payment' | 'fee'

/** Dense comparison view. Also the accessible table alternative to the charts. */
export function ProductTable({ matches, country, hasProfile = false }: ProductTableProps) {
  const { t } = useI18n()
  const [sortKey, setSortKey] = useState<SortKey>('score')

  const sorted = [...matches].sort((a, b) => {
    switch (sortKey) {
      case 'rate':
        return a.product.rateMin - b.product.rateMin
      case 'payment':
        return (a.estimatedPayment ?? Infinity) - (b.estimatedPayment ?? Infinity)
      case 'fee':
        return a.product.originationFee - b.product.originationFee
      default:
        return b.score - a.score
    }
  })

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t.products.provider}</TableHead>
          <SortableHead label={t.products.rate} sortKey="rate" active={sortKey} onSort={setSortKey} />
          <SortableHead label={t.products.payment} sortKey="payment" active={sortKey} onSort={setSortKey} />
          <SortableHead label={t.products.fee} sortKey="fee" active={sortKey} onSort={setSortKey} />
          <TableHead>{t.products.eligibility}</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>

      <TableBody>
        {sorted.map((match) => (
          <TableRow key={match.product.id}>
            <TableCell>
              <p className="font-medium">{match.product.provider?.name}</p>
              <p className="text-xs text-muted-foreground">{match.product.name}</p>
            </TableCell>

            <TableCell>{formatPercent(match.product.rateMin, country.locale)}</TableCell>

            <TableCell>
              {match.estimatedPayment === null
                ? '—'
                : formatCurrency(match.estimatedPayment, match.product.currency)}
            </TableCell>

            <TableCell>
              {match.product.originationFee === 0
                ? t.common.none
                : formatCurrency(match.product.originationFee, match.product.currency)}
            </TableCell>

            <TableCell>
              <EligibilityBadge
                eligible={match.eligible}
                reasons={match.reasons}
                unknown={!hasProfile}
              />
            </TableCell>

            <TableCell>
              <a
                href={match.product.provider?.websiteUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {t.products.view}
                <ExternalLink className="h-3 w-3" />
              </a>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function SortableHead({
  label,
  sortKey,
  active,
  onSort,
}: {
  label: string
  sortKey: SortKey
  active: SortKey
  onSort: (key: SortKey) => void
}) {
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-pressed={active === sortKey}
        className="inline-flex items-center gap-1 uppercase hover:text-foreground"
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </TableHead>
  )
}
