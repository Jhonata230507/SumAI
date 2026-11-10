import type { ReactNode } from 'react'
import { toYearlyBuckets } from '@/lib/calculations/amortization'
import { calculateMortgage } from '@/features/calculators/mortgage/calculation'
import { mortgageDefaults } from '@/features/calculators/mortgage/schema'
import { calculateSavings } from '@/features/calculators/savings/calculation'
import { savingsDefaults } from '@/features/calculators/savings/schema'
import { findSampleProducts } from '@/features/products/sample-catalog'
import { rankProducts } from '@/features/products/rank-products'
import { LenderLogo } from '@/components/products/LenderLogo'
import { defaultAmountScale, getBenchmarks } from '@/lib/countries'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatMonths, formatPercent } from '@/lib/utils/format-number'
import { cn } from '@/lib/utils/cn'
import type { Dictionary } from '@/lib/i18n'
import type { CountryConfig } from '@/types/country'

/**
 * The three fanned cards under the home hero, each a faithful miniature of a
 * real calculator screen — the mortgage results, the recommended lenders beside
 * them, and a savings goal — in the same card style as the calculator carousel:
 * a dark frame with a pastel header (category chip and calculator name).
 *
 * Every figure is computed here by the real calculators and the real lender
 * ranking, for the visitor's country and currency. Charts are hand-built SVG
 * so they render on the server with no client JavaScript.
 */

const BLUE = '#3987e5'
const ORANGE = '#d95926'
const AQUA = '#199e70'

/** The carousel's pastels, so a calculator looks the same everywhere. */
const PASTEL = { mortgage: 'bg-[#dff1fb]', offers: 'bg-[#dcf8e3]', savings: 'bg-[#e9e3fb]' }

export function HeroShowcase({ country, t }: { country: CountryConfig; t: Dictionary }) {
  const scale = defaultAmountScale(country.code)
  const benchmarks = getBenchmarks(country.code)
  const isUs = country.code === 'us'
  const money = (v: number, compact = false) => formatCurrency(v, country.currency, { compact })
  const basis = country.rules.quotesEffectiveAnnualRate ? t.products.rateBasis.effective : t.products.rateBasis.nominal

  // A typical purchase, calculated the way the mortgage page calculates it.
  const homePrice = mortgageDefaults.homePrice * scale
  const downPayment = Math.round(homePrice * Math.max(country.rules.minDownPaymentRatio, 0.2))
  const termMonths = country.rules.commonLoanTermsMonths.at(-1) ?? 360
  const mortgage = calculateMortgage({
    ...mortgageDefaults,
    homePrice,
    downPayment,
    // Only the US form carries tax and insurance; elsewhere it is principal and interest.
    propertyTaxAnnual: isUs ? mortgageDefaults.propertyTaxAnnual * scale : 0,
    homeInsuranceAnnual: isUs ? mortgageDefaults.homeInsuranceAnnual * scale : 0,
    hoaMonthly: 0,
    annualRate: benchmarks.mortgage30Year,
    termMonths,
    countryCode: country.code,
  })

  // The lenders the calculator would recommend for that loan.
  const query = { category: 'mortgage' as const, countryCode: country.code, amount: mortgage.loanAmount, termMonths }
  const offers = rankProducts(findSampleProducts({ category: 'mortgage', countryCode: country.code }), {
    ...query,
    includeIneligible: true,
  }).matches.slice(0, 3)

  // A savings goal, as the savings page solves it.
  const goal = 20_000 * scale
  const goalMonths = 48
  const target = calculateSavings({
    ...savingsDefaults,
    mode: 'target',
    targetAmount: goal,
    initialAmount: 0,
    annualRate: benchmarks.savingsHighYield,
    months: goalMonths,
    countryCode: country.code,
  })
  const plan = calculateSavings({
    ...savingsDefaults,
    initialAmount: 0,
    deposit: target.requiredDeposit ?? 0,
    annualRate: benchmarks.savingsHighYield,
    months: goalMonths,
    countryCode: country.code,
  })

  return (
    <div className="relative mx-auto mt-12 h-[400px] max-w-[780px] [@media(max-height:860px)]:mt-6 [perspective:1600px]">
      {/* Left — the recommended lenders. Hidden on small screens. */}
      <div
        className={cn(
          SIDE_CARD,
          '-left-2 origin-right',
          '[transform:rotateY(28deg)_rotateZ(-4deg)_translateZ(-120px)]',
          'hover:[transform:rotateY(28deg)_rotateZ(-4deg)_translateZ(-120px)_translateY(-4px)]',
        )}
      >
        <ShowcaseCard faded className="h-[320px]" pastel={PASTEL.offers} chip={t.offers.best} title={t.offers.title.mortgage}>
          <div className="space-y-1.5">
            {offers.map((match, i) => {
              const lender = match.product.provider?.name ?? match.product.name
              return (
                <div
                  key={match.product.id}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-2 py-1.5',
                    i === 0 ? 'border-white/40 bg-white/[0.06]' : 'border-white/[0.06] bg-white/[0.03]',
                  )}
                >
                  <LenderLogo name={lender} size="sm" className="h-6 w-6 rounded-md text-[9px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-white">{lender}</p>
                    <p className="truncate text-[9px] text-neutral-500">{match.product.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold tabular-nums text-white">
                      {formatPercent(match.product.rateMin, country.locale)}
                      <span className="ml-0.5 text-[8px] font-normal text-neutral-500">{basis}</span>
                    </p>
                    {match.estimatedPayment !== null && (
                      <p className="text-[9px] tabular-nums text-neutral-400">
                        {money(match.estimatedPayment, true)} {t.common.perMonthShort}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ShowcaseCard>
      </div>

      {/* Right — a savings goal. */}
      <div
        className={cn(
          SIDE_CARD,
          '-right-2 origin-left',
          '[transform:rotateY(-28deg)_rotateZ(4deg)_translateZ(-120px)]',
          'hover:[transform:rotateY(-28deg)_rotateZ(4deg)_translateZ(-120px)_translateY(-4px)]',
        )}
      >
        <ShowcaseCard
          faded
          className="h-[320px]"
          pastel={PASTEL.savings}
          chip={t.categories.growing.label}
          title={t.calculators.savings.title}
        >
          <Panel>
            <p className="text-[9px] text-neutral-400">{t.savings.depositNeeded}</p>
            <p className="text-lg font-light tabular-nums text-white">{money(target.requiredDeposit ?? 0)}</p>
            <p className="text-[9px] text-neutral-500">
              {t.savings.toReach(money(goal, true), formatMonths(goalMonths, country.locale))}
            </p>
          </Panel>
          <Panel className="mt-1.5 grid grid-cols-2 divide-x divide-white/[0.06]">
            <Figure label={t.savings.youDeposit} value={money(plan.totalDeposited, true)} swatch={BLUE} />
            <Figure label={t.savings.interestEarned} value={money(plan.totalInterest, true)} swatch={AQUA} className="pl-2" />
          </Panel>
          <GrowthSpark
            balances={plan.series.points.map((p) => p.balance)}
            contributions={plan.series.points.map((p) => p.contributions)}
          />
        </ShowcaseCard>
      </div>

      {/* Centre — the mortgage results. Sits in front; hover lifts it. */}
      <div
        className={cn(
          'group absolute left-1/2 top-0 z-10 w-[min(330px,calc(100vw-2rem))] transition-transform duration-300 ease-out',
          '[transform:translateX(-50%)] hover:[transform:translateX(-50%)_translateY(-4px)]',
        )}
      >
        <ShowcaseCard
          className="h-[390px]"
          pastel={PASTEL.mortgage}
          chip={t.categories.borrowing.label}
          title={t.calculators.mortgage.title}
          subtitle={`${t.home.cards.mortgage.homePrice(money(homePrice, true), money(downPayment, true))} · ${formatPercent(benchmarks.mortgage30Year, country.locale)} ${basis}`}
        >
          {/* As on the page: the payment on its own, then the other figures in one card. */}
          <Panel>
            <p className="text-[9px] text-neutral-400">{t.mortgage.totalMonthly}</p>
            <BigMoney value={money(mortgage.monthly.total)} />
          </Panel>
          <Panel className="mt-1.5 grid grid-cols-3 divide-x divide-white/[0.06]">
            <Figure label={t.mortgage.borrowed} value={money(mortgage.loanAmount, true)} />
            <Figure label={t.mortgage.totalInterest} value={money(mortgage.totalInterest, true)} className="pl-2" />
            <Figure
              label={t.mortgage.paidOffIn}
              value={formatMonths(mortgage.payoffPeriods, country.locale)}
              className="pl-2"
            />
          </Panel>

          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-[10px] font-medium text-neutral-300">{t.charts.amortizationCaption}</p>
            <Legend items={[{ label: t.charts.principal, color: BLUE }, { label: t.charts.interest, color: ORANGE }]} />
          </div>
          <AmortizationBars buckets={toYearlyBuckets(mortgage.schedule.rows)} />
        </ShowcaseCard>
      </div>
    </div>
  )
}

/** Shared positioning and hover motion for the two tilted side cards. */
const SIDE_CARD = 'group absolute top-8 hidden w-[255px] transition-transform duration-300 ease-out md:block'

/* ---------- building blocks ---------- */

/**
 * The carousel card in miniature: a dark frame holding a pastel header (chip,
 * calculator name) and the calculator's own content below. Each card fades out
 * at its bottom edge with a mask, since the side cards sit at different depths.
 */
function ShowcaseCard({
  children,
  pastel,
  chip,
  title,
  subtitle,
  faded = false,
  className,
}: {
  children: ReactNode
  pastel: string
  chip: string
  title: string
  subtitle?: string
  faded?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#2a2a2a] p-1.5 text-left transition-colors duration-300',
        '[mask-image:linear-gradient(to_bottom,black_72%,transparent)]',
        'group-hover:border-white/30',
        faded && 'opacity-85',
        className,
      )}
    >
      <div className={cn('rounded-[1.05rem] px-3.5 py-3 text-[#111]', pastel)}>
        <span className="inline-block rounded-full bg-black/[0.07] px-2 py-0.5 text-[9px] font-medium">{chip}</span>
        <p className="mt-1.5 text-[15px] font-semibold leading-tight tracking-tight">{title}</p>
        {subtitle && <p className="mt-0.5 text-[10px] text-black/55">{subtitle}</p>}
      </div>
      <div className="px-2 pb-2 pt-2.5">{children}</div>
    </div>
  )
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-xl border border-white/[0.06] bg-card px-3 py-2', className)}>{children}</div>
}

/** The payment as the results card shows it: large, light, with the cents dimmed. */
function BigMoney({ value }: { value: string }) {
  const match = value.match(/^(.*?)([.,]\d{2})$/)
  return (
    <p className="text-[26px] font-light leading-tight tracking-tight tabular-nums text-white">
      {match ? match[1] : value}
      {match && <span className="text-neutral-500">{match[2]}</span>}
    </p>
  )
}

function Figure({
  label,
  value,
  swatch,
  className,
}: {
  label: string
  value: string
  swatch?: string
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="flex items-center gap-1 truncate text-[9px] text-neutral-400">
        {swatch && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: swatch }} />}
        {label}
      </p>
      <p className="mt-0.5 truncate text-[13px] tabular-nums tracking-tight text-white">{value}</p>
    </div>
  )
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex gap-2.5">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1 text-[9px] text-neutral-400">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

/** Stacked bars per year, like the page's chart: interest on top of principal. */
function AmortizationBars({ buckets }: { buckets: { principal: number; interest: number }[] }) {
  const width = 400
  const height = 64
  const gap = 3
  const max = Math.max(...buckets.map((b) => b.principal + b.interest))
  const barWidth = (width - gap * (buckets.length - 1)) / buckets.length

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-1.5 h-16 w-full" role="img" aria-label="">
      {buckets.map((b, i) => {
        const x = i * (barWidth + gap)
        const interestH = (b.interest / max) * height
        const principalH = (b.principal / max) * height
        return (
          <g key={i}>
            <rect x={x} y={height - principalH} width={barWidth} height={principalH} fill={BLUE} />
            {/* A 1px surface gap between the two stacked fills, rounded top as on the page. */}
            <rect
              x={x}
              y={height - principalH - interestH}
              width={barWidth}
              height={Math.max(0, interestH - 1)}
              rx={2}
              fill={ORANGE}
            />
          </g>
        )
      })}
    </svg>
  )
}

/** Deposits and interest as stacked bands, like the page's growth chart. */
function GrowthSpark({ balances, contributions }: { balances: number[]; contributions: number[] }) {
  const width = 300
  const height = 56
  const max = Math.max(...balances)
  const x = (i: number) => (i / (balances.length - 1)) * width
  const y = (v: number) => height - (v / max) * (height - 4)
  const line = (values: number[]) =>
    values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = (values: number[]) => `${line(values)} L${width},${height} L0,${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2.5 h-14 w-full" role="img" aria-label="">
      <path d={area(balances)} fill={AQUA} fillOpacity={0.55} />
      <path d={area(contributions)} fill={BLUE} fillOpacity={0.75} />
      <path d={line(balances)} fill="none" stroke={AQUA} strokeWidth={1.5} />
      <path d={line(contributions)} fill="none" stroke={BLUE} strokeWidth={1.5} />
    </svg>
  )
}
