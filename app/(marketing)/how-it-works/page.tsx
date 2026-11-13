import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { BadgeCheck, Calculator, Check, Globe2, Scale, Sparkles } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { Reveal } from '@/components/common/Reveal'
import { getRequestContext } from '@/lib/i18n/server'
import { defaultAmountScale } from '@/lib/countries'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatPercent } from '@/lib/utils/format-number'
import { cn } from '@/lib/utils/cn'
import type { Dictionary } from '@/lib/i18n'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestContext()
  return { title: t.howItWorks.metaTitle, description: t.howItWorks.metaDescription }
}

/**
 * How it works: five steps, each beside a small picture of the part of the
 * product it describes, then what the numbers can be trusted for, the note on
 * how rates are quoted, and a way in. The pictures are illustrative: amounts
 * are scaled to the visitor's market, and no lender named is real.
 */
export default async function HowItWorksPage() {
  const { t, country } = await getRequestContext()
  const h = t.howItWorks
  const scale = defaultAmountScale(country.code)
  // Whole amounts, scaled to the market (a $400,000 home is about 1.6 billion pesos).
  const money = (value: number) => formatCurrency(value * scale, country.currency, { decimals: 0 })
  const pct = (value: number, decimals = 2) => formatPercent(value, country.locale, decimals)

  const visuals: ReactNode[] = [
    <FormVisual key="form" t={t} money={money} />,
    <ResultVisual key="result" t={t} money={money} />,
    <CompareVisual key="compare" t={t} money={money} />,
    <OffersVisual key="offers" t={t} money={money} pct={pct} />,
    <SaveVisual key="save" t={t} money={money} pct={pct} />,
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal className="max-w-3xl">
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{h.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{h.subtitle}</p>
      </Reveal>

      <ol className="mt-16 space-y-16 lg:space-y-24">
        {h.steps.map((step, index) => (
          <Reveal
            as="li"
            key={step.title}
            className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
          >
            {/* Text and picture swap sides on every other step. */}
            <div className={cn(index % 2 === 1 && 'lg:order-2')}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {h.stepLabel(index + 1)}
                </span>
                <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-muted-foreground">
                  {step.tag}
                </span>
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">{step.title}</h2>
              <p className="mt-3 max-w-lg leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
            <div aria-hidden className={cn(index % 2 === 1 && 'lg:order-1')}>
              {visuals[index]}
            </div>
          </Reveal>
        ))}
      </ol>

      <Reveal className="mt-24">
        <h2 className="text-2xl font-semibold tracking-tight">{h.principlesTitle}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {h.principles.map((principle, index) => {
            const Icon = [BadgeCheck, Calculator, Globe2][index] ?? Check
            return (
              <div key={principle.title} className="rounded-2xl border bg-card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white to-[#d6d6d6] text-[#111]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{principle.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{principle.body}</p>
              </div>
            )
          })}
        </div>
      </Reveal>

      <Reveal className="mt-6 flex gap-4 rounded-2xl border bg-card p-6">
        <Scale className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <div>
          <h2 className="font-semibold">{h.rateNoteTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{h.rateNoteBody}</p>
        </div>
      </Reveal>

      <Reveal className="mt-24 flex flex-col items-start justify-between gap-6 rounded-3xl border bg-gradient-to-br from-white/[0.06] to-transparent p-8 sm:flex-row sm:items-center sm:p-10">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{h.ctaTitle}</h2>
          <p className="mt-2 text-muted-foreground">{h.ctaBody}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink size="lg" href="/calculators">
            {h.start}
          </ButtonLink>
          <ButtonLink size="lg" variant="outline" href="/products">
            {h.compare}
          </ButtonLink>
        </div>
      </Reveal>
    </div>
  )
}

/* ---------- the pictures ---------- */

type Money = (value: number) => string
type Pct = (value: number, decimals?: number) => string

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-white/[0.08] bg-[#2a2a2a] p-2 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]',
        className,
      )}
    >
      <div className="space-y-4 rounded-[1.25rem] bg-card p-5 sm:p-6">{children}</div>
    </div>
  )
}

function Field({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium">{label}</p>
      <div className="flex h-10 items-center justify-between rounded-lg border border-input bg-muted px-3 text-sm tabular-nums">
        <span>{value}</span>
        {suffix && <span className="text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  )
}

function FormVisual({ t, money }: { t: Dictionary; money: Money }) {
  const v = t.howItWorks.visuals
  return (
    <Frame>
      <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1 text-xs font-medium">
        <span className="rounded-full bg-white px-3 py-2 text-center text-black">{v.modes.price}</span>
        <span className="px-3 py-2 text-center text-muted-foreground">{v.modes.budget}</span>
      </div>
      <Field label={v.price} value={money(400_000)} />
      <Field label={v.down} value="20" suffix="%" />
      <span className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium">
        <Sparkles className="h-4 w-4" />
        {v.example}
      </span>
    </Frame>
  )
}

function ResultVisual({ t, money }: { t: Dictionary; money: Money }) {
  const v = t.howItWorks.visuals
  // Principal, interest, tax and insurance shares of an illustrative payment.
  const parts = [
    { share: 0.72, color: 'bg-[#6159e6]' },
    { share: 0.12, color: 'bg-[#ffa31a]' },
    { share: 0.1, color: 'bg-[#3fcae6]' },
    { share: 0.06, color: 'bg-[#f2603a]' },
  ]
  return (
    <Frame>
      <div>
        <p className="text-xs text-muted-foreground">{v.payment}</p>
        <p className="mt-1 text-4xl font-light tabular-nums tracking-tight">{money(2_875)}</p>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full">
        {parts.map((part) => (
          <span key={part.color} className={part.color} style={{ width: `${part.share * 100}%` }} />
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-4 border-t pt-4">
        <div>
          <dt className="text-xs text-muted-foreground">{v.interest}</dt>
          <dd className="mt-1 text-lg tabular-nums">{money(471_986)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{v.paidOff}</dt>
          <dd className="mt-1 text-lg tabular-nums">2056</dd>
        </div>
      </dl>
    </Frame>
  )
}

function CompareVisual({ t, money }: { t: Dictionary; money: Money }) {
  const v = t.howItWorks.visuals
  const rows = [
    { label: v.avalanche, value: 3_831, width: 0.27, color: 'bg-[#6159e6]', strong: true },
    { label: v.snowball, value: 4_062, width: 0.29, color: 'bg-[#3fcae6]', strong: false },
    { label: v.minimums, value: 14_247, width: 1, color: 'bg-white/20', strong: false },
  ]
  return (
    <Frame>
      <p className="text-xs text-muted-foreground">{v.interest}</p>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="space-y-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className={row.strong ? 'font-medium' : 'text-muted-foreground'}>{row.label}</span>
              <span className="tabular-nums">{money(row.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.05]">
              <div className={cn('h-2 rounded-full', row.color)} style={{ width: `${row.width * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Frame>
  )
}

function OffersVisual({ t, money, pct }: { t: Dictionary; money: Money; pct: Pct }) {
  const v = t.howItWorks.visuals
  const offers = [
    { initials: 'BC', tile: 'from-[#4fd1a2] to-[#14906a]', rate: 0.0589, payment: 2_133, best: true },
    { initials: 'PC', tile: 'from-[#8b8af0] to-[#4a49c2]', rate: 0.0599, payment: 2_156, best: false },
    { initials: 'CB', tile: 'from-[#ffa07f] to-[#f2603a]', rate: 0.0615, payment: 2_193, best: false },
  ]
  return (
    <Frame>
      <div className="space-y-2">
        {offers.map((offer) => (
          <div
            key={offer.initials}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-3',
              offer.best ? 'border-white/40 bg-white/[0.04]' : 'border-white/[0.06]',
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white',
                offer.tile,
              )}
            >
              {offer.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="h-2.5 w-28 rounded-full bg-white/15" />
              <p className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400">
                <Check className="h-3 w-3" strokeWidth={3} />
                {v.qualify}
              </p>
            </div>
            <div className="text-right">
              {offer.best && (
                <span className="mb-1 inline-block rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-black">
                  {v.bestRate}
                </span>
              )}
              <p className="text-sm font-semibold tabular-nums">{pct(offer.rate)}</p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {money(offer.payment)}
                {v.perMonth}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Frame>
  )
}

function SaveVisual({ t, money, pct }: { t: Dictionary; money: Money; pct: Pct }) {
  const v = t.howItWorks.visuals
  return (
    <Frame>
      <p className="text-xs text-muted-foreground">{v.saved}</p>
      <ul className="space-y-2">
        {[
          { name: t.calculators.mortgage.shortTitle, value: money(2_875) },
          { name: t.calculators['car-loan'].shortTitle, value: money(577) },
        ].map((item) => (
          <li key={item.name} className="flex items-center justify-between rounded-xl border border-white/[0.06] px-3 py-2.5 text-sm">
            <span className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-muted-foreground" />
              {item.name}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {item.value}
              {v.perMonth}
            </span>
          </li>
        ))}
      </ul>
      <div className="space-y-2 border-t pt-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">{v.goal}</span>
          <span className="text-xs text-muted-foreground">{v.ofGoal(pct(0.64, 0))}</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.05]">
          <div className="h-2 w-[64%] rounded-full bg-gradient-to-r from-[#6159e6] to-[#3fcae6]" />
        </div>
      </div>
    </Frame>
  )
}
