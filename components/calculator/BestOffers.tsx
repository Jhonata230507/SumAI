'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, ChevronRight, Star, TriangleAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useI18n } from '@/lib/i18n/client'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatMonths, formatPercent } from '@/lib/utils/format-number'
import { cn } from '@/lib/utils/cn'
import type { RankedProductList } from '@/features/products/types'
import type { CountryConfig } from '@/types/country'
import type { ProductCategory, ProductMatch } from '@/types/financial-product'

export interface BestOffersProps {
  category: ProductCategory
  country: CountryConfig
  /** The amount the user is borrowing (or, for savings, the balance). */
  amount: number
  termMonths?: number
  /** Optional profile, when the calculator collects it; sharpens eligibility. */
  creditScore?: number
  monthlyIncome?: number
  monthlyDebts?: number
}

/** Listing page for each category, for "see all options". */
const LISTING: Partial<Record<ProductCategory, string>> = {
  mortgage: '/products/mortgages',
  'car-loan': '/products/car-loans',
  'personal-loan': '/products/personal-loans',
}

/** Tile colours for lender initials, picked by name so a lender keeps its colour. */
const TILES = ['from-[#ffa07f] to-[#f2603a]', 'from-[#8b8af0] to-[#4a49c2]', 'from-[#4fd1a2] to-[#14906a]']

const SHOWN = 3

/**
 * "The best options for you", under every calculator: the top lenders for the
 * credit (or savings account) being calculated, ranked by the product matcher
 * with the user's own numbers — rate first, then fees, term fit and whether
 * they qualify — with the payment each would mean.
 *
 * Re-ranks as the inputs change (debounced). When the results come from the
 * sample catalogue, the section says so: those lenders are not real.
 */
export function BestOffers({
  category,
  country,
  amount,
  termMonths,
  creditScore,
  monthlyIncome,
  monthlyDebts,
}: BestOffersProps) {
  const { t, language } = useI18n()
  const o = t.offers
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; data: RankedProductList | null }>({
    status: 'loading',
    data: null,
  })

  const query = JSON.stringify({
    category,
    countryCode: country.code,
    amount: amount > 0 ? Math.round(amount) : undefined,
    termMonths: category === 'savings' ? undefined : termMonths,
    creditScore,
    monthlyIncome,
    monthlyDebts,
    includeIneligible: true,
    limit: 12,
    language,
  })

  useEffect(() => {
    const controller = new AbortController()
    // Debounced, so typing an amount does not fire a request per keystroke.
    const timer = window.setTimeout(async () => {
      setState((previous) => ({ ...previous, status: previous.data ? previous.status : 'loading' }))
      try {
        const response = await fetch('/api/products/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: query,
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(String(response.status))
        setState({ status: 'ready', data: (await response.json()) as RankedProductList })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setState({ status: 'error', data: null })
      }
    }, 350)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query])

  const money = (value: number) => formatCurrency(value, country.currency)
  const savings = category === 'savings'
  const subtitle = savings
    ? o.savingsSubtitle(money(amount))
    : o.subtitle(money(amount), formatMonths(termMonths ?? 0, country.locale))
  const listing = LISTING[category]
  const matches = state.data?.matches.slice(0, SHOWN) ?? []
  const bestRate = state.data?.bestRate ?? null
  const hasProfile = creditScore !== undefined || monthlyIncome !== undefined

  return (
    <section aria-labelledby={`offers-${category}`} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={`offers-${category}`} className="text-xl font-semibold tracking-tight">
              {o.title[category]}
            </h2>
            {state.data?.sample && (
              <span
                title={o.sampleNote}
                className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-200"
              >
                {o.sample}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {listing && (
          <Link
            href={listing}
            className="group inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-[#ff8a63]"
          >
            {o.viewAll}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        )}
      </div>

      {state.status === 'loading' && !state.data ? (
        <div className="grid gap-4 md:grid-cols-3" aria-label={o.loading} aria-busy>
          {Array.from({ length: SHOWN }, (_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : state.status === 'error' ? (
        <p className="rounded-xl border p-5 text-sm text-muted-foreground">{o.unavailable}</p>
      ) : matches.length === 0 ? (
        <p className="rounded-xl border p-5 text-sm text-muted-foreground">{o.empty}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {matches.map((match) => (
            <OfferCard
              key={match.product.id}
              match={match}
              country={country}
              amount={amount}
              termMonths={termMonths}
              isBest={match.product.rateMin === bestRate}
              sample={Boolean(state.data?.sample)}
              hasProfile={hasProfile}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {o.disclaimer}
        {state.data?.sample && ` ${o.sampleNote}`}
      </p>
    </section>
  )
}

function OfferCard({
  match,
  country,
  amount,
  termMonths,
  isBest,
  sample,
  hasProfile,
}: {
  match: ProductMatch
  country: CountryConfig
  amount: number
  termMonths?: number
  isBest: boolean
  sample: boolean
  hasProfile: boolean
}) {
  const { t } = useI18n()
  const o = t.offers
  const { product } = match
  const lender = product.provider?.name ?? product.name
  const savings = product.category === 'savings'
  const money = (value: number) => formatCurrency(value, country.currency)
  const basis = country.rules.quotesEffectiveAnnualRate ? t.products.rateBasis.effective : t.products.rateBasis.nominal
  const tile = TILES[[...lender].reduce((sum, c) => sum + c.charCodeAt(0), 0) % TILES.length]
  const totalCost =
    match.estimatedPayment !== null && termMonths ? match.estimatedPayment * termMonths + product.originationFee : null
  // Why it may not fit: the first reason that is not one of the plus points.
  const r = t.products.reasons
  const positives = new Set<string>([r.lowestRate, r.highestRate, r.noFee, r.meetsRequirements])
  const blocker = !match.eligible ? match.reasons.find((reason) => !positives.has(reason)) : null
  const website = !sample ? product.provider?.websiteUrl : null

  return (
    <Card
      className={cn(
        'flex flex-col transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-white/25',
        isBest && 'border-primary/50',
      )}
    >
      <CardContent className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-semibold text-white',
              tile,
            )}
          >
            {lender
              .split(' ')
              .slice(0, 2)
              .map((word) => word[0])
              .join('')}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{lender}</p>
            <p className="truncate text-xs text-muted-foreground">{product.name}</p>
          </div>
          {isBest && (
            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              {o.best}
            </span>
          )}
        </div>

        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="text-xs text-muted-foreground">{o.from}</span>
          <span className="text-3xl font-medium tabular-nums tracking-tight">
            {formatPercent(product.rateMin, country.locale)}
          </span>
          <span className="text-xs text-muted-foreground">{basis}</span>
        </div>

        <dl className="mt-4 space-y-2 border-t border-white/[0.06] pt-4 text-sm">
          {savings ? (
            <Metric label={o.yearly} value={money(amount * product.rateMin)} />
          ) : (
            <>
              {match.estimatedPayment !== null && <Metric label={o.monthly} value={money(match.estimatedPayment)} />}
              {totalCost !== null && <Metric label={o.totalCost} value={money(totalCost)} />}
            </>
          )}
        </dl>

        <div className="mt-4 flex items-center gap-3 text-xs">
          {blocker ? (
            <span className="flex items-center gap-1.5 text-amber-300">
              <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {blocker}
            </span>
          ) : hasProfile ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {o.likely}
            </span>
          ) : null}
          {product.provider?.rating != null && (
            <span className="ml-auto flex items-center gap-1 text-muted-foreground">
              <Star className="h-3 w-3 fill-current" aria-hidden />
              {product.provider.rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="mt-auto pt-5">
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="group inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border text-sm font-medium transition-colors hover:border-white/25 hover:bg-accent"
            >
              {o.viewOffer}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </a>
          ) : (
            // Sample lenders have no real offer to link to.
            <span
              title={o.sampleNote}
              className="inline-flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full border text-sm font-medium text-muted-foreground opacity-60"
            >
              {o.viewOffer}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}
