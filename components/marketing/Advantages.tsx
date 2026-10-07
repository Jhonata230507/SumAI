import { BadgePercent, Check, Scale, ShieldCheck, X, type LucideIcon } from 'lucide-react'
import { Reveal } from '@/components/common/Reveal'
import { getBenchmarks } from '@/lib/countries'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatPercent } from '@/lib/utils/format-number'
import { cn } from '@/lib/utils/cn'
import { AdvantageTabs, type AdvantageItem } from './AdvantageTabs'
import type { Dictionary } from '@/lib/i18n'
import type { CountryConfig } from '@/types/country'

/**
 * "Why SumAI" — a tabbed showcase of the three things the product does for
 * the user: finds the lowest rate, compares every credit for the best fit,
 * and checks where they qualify before they apply.
 *
 * Visuals are built here on the server; the tab behaviour lives in
 * AdvantageTabs. The rate visual is anchored to the country's real benchmark
 * and quoting convention, but the lenders and the profile are illustrative and
 * labelled as such — no real lender or applicant is implied. The only glow is
 * on the icons.
 */
export function Advantages({ country, t }: { country: CountryConfig; t: Dictionary }) {
  const a = t.home.advantages
  const base = getBenchmarks(country.code).personalLoan
  const basis = country.rules.quotesEffectiveAnnualRate ? t.products.rateBasis.effective : t.products.rateBasis.nominal

  const items: AdvantageItem[] = [
    {
      key: 'rate',
      tab: a.rate.tab,
      icon: <IconTile icon={BadgePercent} tile="from-[#ffa07f] to-[#f2603a]" glow="255,122,79" />,
      title: a.rate.title,
      body: a.rate.body,
      cta: a.rate.cta,
      href: '/products',
      visual: <RateVisual country={country} base={base} basis={basis} t={t} />,
    },
    {
      key: 'fit',
      tab: a.fit.tab,
      icon: <IconTile icon={Scale} tile="from-[#8b8af0] to-[#4a49c2]" glow="91,91,214" />,
      title: a.fit.title,
      body: a.fit.body,
      cta: a.fit.cta,
      href: '/compare',
      visual: <FitVisual t={t} />,
    },
    {
      key: 'eligibility',
      tab: a.eligibility.tab,
      icon: <IconTile icon={ShieldCheck} tile="from-[#4fd1a2] to-[#14906a]" glow="63,176,103" />,
      title: a.eligibility.title,
      body: a.eligibility.body,
      cta: a.eligibility.cta,
      href: '/products/personal-loans',
      visual: <EligibilityVisual country={country} t={t} />,
    },
  ]

  return (
    <section className="pt-24">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-balance text-center text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
            <span className="text-foreground">{a.titleLead}</span>{' '}
            <span className="text-muted-foreground">{a.titleEmphasis}</span>
          </h2>
        </Reveal>

        <Reveal delay={100} className="mt-12">
          <AdvantageTabs
            items={items}
            label={a.tablist}
            labels={{
              previous: a.previous,
              next: a.next,
              positions: items.map((_, i) => a.position(i + 1, items.length)),
            }}
          />
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- pieces ---------- */

function IconTile({ icon: Icon, tile, glow }: { icon: LucideIcon; tile: string; glow: string }) {
  return (
    <span
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white',
        tile,
        '[box-shadow:inset_0_1px_0_rgba(255,255,255,0.35),0_10px_30px_-6px_rgba(var(--glow),0.6),0_0_40px_-6px_rgba(var(--glow),0.45)]',
      )}
      style={{ '--glow': glow } as React.CSSProperties}
    >
      <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
    </span>
  )
}

function RateVisual({ country, base, basis, t }: { country: CountryConfig; base: number; basis: string; t: Dictionary }) {
  const a = t.home.advantages.rate
  // Three illustrative offers around the market benchmark; the lowest wins.
  const offers = [
    { label: a.lender('A'), rate: base + 0.024 },
    { label: a.lender('B'), rate: base + 0.011 },
    { label: a.lender('C'), rate: base - 0.006 },
  ]
  const best = Math.min(...offers.map((o) => o.rate))
  const highest = Math.max(...offers.map((o) => o.rate))
  // Bars measure from a little below the best rate, so the gap between offers is visible.
  const floor = best - (highest - best) * 0.6
  const width = (rate: number) => `${Math.round(((rate - floor) / (highest - floor)) * 100)}%`

  return (
    <div className="space-y-3.5">
      {offers.map((offer) => {
        const isBest = offer.rate === best
        return (
          <div
            key={offer.label}
            className={cn(
              'relative flex items-center gap-3 rounded-xl border px-4 py-3',
              isBest ? 'border-primary/50 bg-primary/[0.08]' : 'border-white/[0.06] bg-card/60',
            )}
          >
            <span className={cn('w-16 shrink-0 text-xs sm:w-20', isBest ? 'text-foreground' : 'text-muted-foreground')}>
              {offer.label}
            </span>
            <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <span
                className={cn('absolute inset-y-0 left-0 rounded-full', isBest ? 'bg-primary' : 'bg-white/20')}
                style={{ width: width(offer.rate) }}
              />
            </span>
            <span className={cn('w-16 shrink-0 text-right text-sm tabular-nums', isBest ? 'font-semibold' : 'text-muted-foreground')}>
              {formatPercent(offer.rate, country.locale)}
            </span>
            {isBest && (
              <span className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                {a.best}
              </span>
            )}
          </div>
        )
      })}
      <p className="pt-1 text-right font-mono text-[10px] text-muted-foreground/70">
        {basis} · {a.note}
      </p>
    </div>
  )
}

function FitVisual({ t }: { t: Dictionary }) {
  const a = t.home.advantages.fit
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card/60 p-5">
      <p className="text-xs font-medium text-muted-foreground">{a.heading}</p>
      <ul className="mt-3 space-y-2.5">
        {a.criteria.map((criterion) => (
          <li key={criterion} className="flex items-center gap-2.5 text-sm">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3fb067]/15 text-[#4fd1a2]">
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
            </span>
            {criterion}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-indigo/15 px-3.5 py-2.5">
        <span className="text-sm font-semibold">{a.verdict}</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo text-white">
          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
        </span>
      </div>
    </div>
  )
}

function EligibilityVisual({ country, t }: { country: CountryConfig; t: Dictionary }) {
  const a = t.home.advantages.eligibility
  const r = t.home.advantages.rate
  const scale = country.code === 'co' ? 4_000 : 1
  const range = country.rules.creditScoreRange
  // An illustrative applicant, placed sensibly on the country's own score scale.
  const score = Math.round(range.min + (range.max - range.min) * 0.72)

  const lenders = [
    { label: r.lender('A'), ok: true },
    { label: r.lender('B'), ok: true },
    { label: r.lender('C'), ok: false },
  ]

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/[0.06] bg-card/60 p-5">
        <p className="text-xs font-medium text-muted-foreground">{a.profile}</p>
        <dl className="mt-3 grid grid-cols-3 gap-3">
          <Stat label={a.income} value={formatCurrency(4_200 * scale, country.currency, { compact: true })} />
          <Stat label={a.score} value={String(score)} />
          <Stat label={a.debt} value={formatPercent(0.22, country.locale, 0)} />
        </dl>
      </div>
      {lenders.map((lender) => (
        <div
          key={lender.label}
          className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-card/60 px-4 py-3 text-sm"
        >
          <span className={lender.ok ? 'text-foreground' : 'text-muted-foreground'}>{lender.label}</span>
          <span
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium',
              lender.ok ? 'text-[#4fd1a2]' : 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full',
                lender.ok ? 'bg-[#3fb067]/15' : 'bg-white/[0.06]',
              )}
            >
              {lender.ok ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : <X className="h-3 w-3" strokeWidth={3} aria-hidden />}
            </span>
            {lender.ok ? a.likely : a.unlikely}
          </span>
        </div>
      ))}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] leading-tight text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
