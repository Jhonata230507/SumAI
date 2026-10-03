import type { ReactNode } from 'react'
import { toYearlyBuckets } from '@/lib/calculations/amortization'
import { calculateMortgage } from '@/features/calculators/mortgage/calculation'
import { mortgageDefaults } from '@/features/calculators/mortgage/schema'
import { calculateSavings } from '@/features/calculators/savings/calculation'
import { savingsDefaults } from '@/features/calculators/savings/schema'
import { defaultAmountScale, getBenchmarks } from '@/lib/countries'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatMonths, formatPercent } from '@/lib/utils/format-number'
import { cn } from '@/lib/utils/cn'
import type { Dictionary } from '@/lib/i18n'
import type { CountryConfig } from '@/types/country'

/**
 * The three fanned cards under the home hero.
 *
 * Every figure is computed here by the real calculators, for the visitor's
 * country and currency — the hero shows what the product actually produces,
 * not mock numbers. Charts are hand-built SVG so they render on the server
 * with no client JavaScript.
 *
 * Colours are the dark-surface steps of the validated categorical palette
 * (components/charts/theme.ts): blue for principal / balance, orange for
 * interest / cost, aqua for growth. Every series is also labelled in text.
 */

const BLUE = '#3987e5'
const ORANGE = '#d95926'
const AQUA = '#199e70'

export function HeroShowcase({ country, t }: { country: CountryConfig; t: Dictionary }) {
  const scale = defaultAmountScale(country.code)
  const benchmarks = getBenchmarks(country.code)
  const money = (v: number, compact = false) => formatCurrency(v, country.currency, { compact })

  // Same starting inputs the calculator pages use, so the numbers match.
  const homePrice = mortgageDefaults.homePrice * scale
  const downPayment = Math.round(homePrice * Math.max(country.rules.minDownPaymentRatio, 0.2))
  const mortgage = calculateMortgage({
    ...mortgageDefaults,
    homePrice,
    downPayment,
    propertyTaxAnnual: mortgageDefaults.propertyTaxAnnual * scale,
    homeInsuranceAnnual: mortgageDefaults.homeInsuranceAnnual * scale,
    annualRate: benchmarks.mortgage30Year,
    termMonths: country.rules.commonLoanTermsMonths.at(-1) ?? 360,
    countryCode: country.code,
  })

  const savings = calculateSavings({
    ...savingsDefaults,
    initialAmount: savingsDefaults.initialAmount * scale,
    deposit: savingsDefaults.deposit * scale,
    annualRate: benchmarks.savingsHighYield,
    months: 60,
    countryCode: country.code,
  })

  const c = t.home.cards

  return (
    <div className="relative mx-auto mt-12 h-[380px] max-w-[760px] [perspective:1600px]">
      {/* Left card — benchmark rates. Hidden on small screens. Hover pulls it
          forward and flattens the tilt so it can be read. */}
      <div
        className={cn(
          SIDE_CARD,
          'left-14 origin-right',
          '[transform:rotateY(28deg)_rotateZ(-4deg)_translateZ(-120px)]',
          'hover:[transform:rotateY(28deg)_rotateZ(-4deg)_translateZ(-120px)_translateY(-4px)]',
        )}
      >
        <ShowcaseCard faded className="h-[300px]">
          <RatesCard t={t} country={country} benchmarks={benchmarks} />
        </ShowcaseCard>
      </div>

      {/* Right card — savings plan. */}
      <div
        className={cn(
          SIDE_CARD,
          'right-14 origin-left',
          '[transform:rotateY(-28deg)_rotateZ(4deg)_translateZ(-120px)]',
          'hover:[transform:rotateY(-28deg)_rotateZ(4deg)_translateZ(-120px)_translateY(-4px)]',
        )}
      >
        <ShowcaseCard faded className="h-[300px]">
          <Eyebrow>{c.savings.eyebrow}</Eyebrow>
          <CardTitle lead={c.savings.title} accent={c.savings.titleAccent} />
          <p className="mt-3 text-[10px] text-neutral-400">{c.savings.balance(formatMonths(60, country.locale))}</p>
          <p className="text-xl font-semibold tabular-nums text-white">{money(savings.finalBalance)}</p>
          <p className="text-[10px] text-neutral-500">
            {c.savings.perMonth(money(savingsDefaults.deposit * scale))} · {c.savings.apy}{' '}
            {formatPercent(savings.effectiveAnnualYield, country.locale)}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Kpi label={c.savings.deposited} value={money(savings.totalDeposited, true)} swatch={BLUE} />
            <Kpi label={c.savings.interest} value={money(savings.totalInterest, true)} swatch={AQUA} />
          </div>

          <GrowthSpark
            balances={savings.series.points.map((p) => p.balance)}
            contributions={savings.series.points.map((p) => p.contributions)}
          />
        </ShowcaseCard>
      </div>

      {/* Centre card — mortgage. Sits in front; hover lifts it. */}
      <div
        className={cn(
          'group absolute left-1/2 top-0 z-10 w-[min(320px,calc(100vw-2rem))] transition-transform duration-300 ease-out',
          '[transform:translateX(-50%)] hover:[transform:translateX(-50%)_translateY(-4px)]',
        )}
      >
        <ShowcaseCard className="h-[360px]">
          <Eyebrow>{c.mortgage.eyebrow}</Eyebrow>
          <CardTitle lead={c.mortgage.title} accent={c.mortgage.titleAccent} />
          <p className="mt-0.5 text-[10px] text-neutral-500">
            {c.mortgage.homePrice(money(homePrice, true), money(downPayment, true))} ·{' '}
            {formatPercent(benchmarks.mortgage30Year, country.locale)}{' '}
            {country.rules.quotesEffectiveAnnualRate ? 'E.A.' : 'APR'}
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Kpi label={c.mortgage.monthly} value={money(mortgage.monthly.total, true)} highlight />
            <Kpi label={c.mortgage.interest} value={money(mortgage.totalInterest, true)} />
            <Kpi label={c.mortgage.payoff} value={formatMonths(mortgage.payoffPeriods, country.locale)} />
          </div>

          <p className="mt-3 text-[10px] text-neutral-400">{c.mortgage.breakdown}</p>
          <Breakdown
            locale={country.locale}
            segments={[
              { label: c.mortgage.principalInterest, value: mortgage.monthly.principalAndInterest, color: BLUE },
              { label: c.mortgage.tax, value: mortgage.monthly.propertyTax, color: ORANGE },
              { label: c.mortgage.insurance, value: mortgage.monthly.insurance + mortgage.monthly.mortgageInsurance, color: AQUA },
            ]}
          />

          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-[10px] text-neutral-400">{c.mortgage.byYear}</p>
            <Legend items={[{ label: c.mortgage.principal, color: BLUE }, { label: c.mortgage.interestLabel, color: ORANGE }]} />
          </div>
          <AmortizationBars buckets={toYearlyBuckets(mortgage.schedule.rows)} />
        </ShowcaseCard>
      </div>
    </div>
  )
}

/** Shared positioning and hover motion for the two tilted side cards. */
const SIDE_CARD =
  'group absolute top-8 hidden w-[250px] transition-transform duration-300 ease-out md:block'

/* ---------- building blocks ---------- */

/**
 * Each card fades out at its own bottom edge with a mask. An overlay box across
 * the whole fan does not work: the side cards sit at different 3D depths, so
 * the box ends up partly in front of them and partly behind, and its edges show.
 */
function ShowcaseCard({
  children,
  faded = false,
  className,
}: {
  children: ReactNode
  faded?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-white/10 bg-card p-4 text-left transition-colors duration-300',
        '[mask-image:linear-gradient(to_bottom,black_70%,transparent)]',
        'group-hover:border-white/35',
        faded && 'opacity-80',
        className,
      )}
    >
      {children}
    </div>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">{children}</p>
  )
}

function CardTitle({ lead, accent }: { lead: string; accent: string }) {
  return (
    <p className="mt-1.5 text-base font-medium leading-snug text-neutral-200">
      {lead} <span className="text-primary">{accent}</span>
    </p>
  )
}

function Kpi({
  label,
  value,
  highlight = false,
  swatch,
}: {
  label: string
  value: string
  highlight?: boolean
  swatch?: string
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-white/10 px-2.5 py-1.5',
        highlight ? 'border-transparent bg-indigo [&_p]:text-white/75 [&_p:last-child]:text-white' : 'bg-muted',
      )}
    >
      <p className="flex items-center gap-1.5 text-[10px] leading-tight text-neutral-400">
        {swatch && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: swatch }} />}
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-white">{value}</p>
    </div>
  )
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex gap-3">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1 text-[10px] text-neutral-400">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

function Breakdown({
  segments,
  locale,
}: {
  segments: { label: string; value: number; color: string }[]
  locale: string
}) {
  const visible = segments.filter((s) => s.value > 0)
  const total = visible.reduce((sum, s) => sum + s.value, 0)

  return (
    <div className="mt-1.5">
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        {visible.map((s) => (
          <div key={s.label} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {visible.map((s) => (
          <span key={s.label} className="flex items-center gap-1 text-[10px] text-neutral-400">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: s.color }} />
            {s.label}
            <span className="tabular-nums text-neutral-200">{formatPercent(s.value / total, locale, 0)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/** Stacked bars per year: interest share shrinks as principal takes over. */
function AmortizationBars({ buckets }: { buckets: { principal: number; interest: number }[] }) {
  const width = 400
  const height = 44
  const gap = 2
  const max = Math.max(...buckets.map((b) => b.principal + b.interest))
  const barWidth = (width - gap * (buckets.length - 1)) / buckets.length

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-1.5 h-11 w-full" role="img" aria-label="">
      {buckets.map((b, i) => {
        const x = i * (barWidth + gap)
        const interestH = (b.interest / max) * height
        const principalH = (b.principal / max) * height
        return (
          <g key={i}>
            <rect x={x} y={height - principalH} width={barWidth} height={principalH} rx={1} fill={BLUE} />
            {/* 1px surface gap between the two stacked fills */}
            <rect
              x={x}
              y={height - principalH - interestH}
              width={barWidth}
              height={Math.max(0, interestH - 1)}
              rx={1}
              fill={ORANGE}
            />
          </g>
        )
      })}
    </svg>
  )
}

/** Balance area with the contribution line beneath: the gap is the interest. */
function GrowthSpark({ balances, contributions }: { balances: number[]; contributions: number[] }) {
  const width = 300
  const height = 50
  const max = Math.max(...balances)
  const x = (i: number) => (i / (balances.length - 1)) * width
  const y = (v: number) => height - (v / max) * (height - 4)

  const line = (values: number[]) => values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${line(balances)} L${width},${height} L0,${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-[50px] w-full" role="img" aria-label="">
      <defs>
        <linearGradient id="hero-growth" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={AQUA} stopOpacity="0.45" />
          <stop offset="100%" stopColor={AQUA} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#hero-growth)" />
      <path d={line(balances)} fill="none" stroke={AQUA} strokeWidth={2} />
      <path d={line(contributions)} fill="none" stroke={BLUE} strokeWidth={2} strokeDasharray="4 3" />
    </svg>
  )
}

function RatesCard({
  t,
  country,
  benchmarks,
}: {
  t: Dictionary
  country: CountryConfig
  benchmarks: ReturnType<typeof getBenchmarks>
}) {
  const c = t.home.cards.rates
  const rows = [
    { label: c.mortgage, value: benchmarks.mortgage30Year, color: BLUE },
    { label: c.carLoan, value: benchmarks.carLoanNew, color: BLUE },
    { label: c.personalLoan, value: benchmarks.personalLoan, color: ORANGE },
    { label: c.savings, value: benchmarks.savingsHighYield, color: AQUA },
    { label: c.inflation, value: benchmarks.inflation, color: '#8a8a85' },
  ]
  const max = Math.max(...rows.map((r) => r.value))

  return (
    <>
      <Eyebrow>{c.eyebrow}</Eyebrow>
      <CardTitle lead={c.title} accent={c.titleAccent} />
      <p className="mt-1 text-[11px] text-neutral-500">
        {t.countries[country.code]} ·{' '}
        {country.rules.quotesEffectiveAnnualRate ? t.products.rateBasis.effective : t.products.rateBasis.nominal}
      </p>

      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex justify-between text-[11px]">
              <span className="text-neutral-400">{row.label}</span>
              <span className="tabular-nums text-neutral-200">{formatPercent(row.value, country.locale)}</span>
            </div>
            <div className="mt-0.5 h-1 rounded-full bg-white/5">
              <div
                className="h-full rounded-full"
                style={{ width: `${(row.value / max) * 100}%`, background: row.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 font-mono text-[9px] text-neutral-600">{c.note}</p>
    </>
  )
}
