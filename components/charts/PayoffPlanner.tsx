'use client'

import { useId, useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { comparePayoff } from '@/features/calculators/loan/payoff'
import type { LoanInput } from '@/features/calculators/loan/types'
import { Slider } from '@/components/ui/slider'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatMonths } from '@/lib/utils/format-number'
import { useI18n } from '@/lib/i18n/client'
import { cn } from '@/lib/utils/cn'
import { FREQUENCY_PER_YEAR } from '@/types/common'
import type { CurrencyCode } from '@/types/currency'
import { ChartLegend } from './ChartLegend'
import { AXIS_PROPS, CHART_INK, CHART_PANEL, GRID_PROPS, TOOLTIP_STYLE, seriesColors } from './theme'

export interface PayoffPlannerProps {
  input: LoanInput
  /** The payment without extra, which sets the slider's range. */
  payment: number
  currency: CurrencyCode
  locale: string
}

/** A round step for the slider: finer for small payments. */
function sliderStep(payment: number) {
  return payment < 200 ? 5 : payment < 1_000 ? 25 : payment < 5_000 ? 50 : 100
}

/**
 * "Pay it off faster": a slider for an extra amount on every payment, what it
 * saves (interest, time) and what the payment becomes, the balance over time
 * with and without it, and the year-by-year schedule of the faster plan.
 * The numbers come from `comparePayoff`; this only draws them.
 */
export function PayoffPlanner({ input, payment, currency, locale }: PayoffPlannerProps) {
  const { t } = useI18n()
  const p = t.loan.payoff
  const colors = seriesColors('dark')
  const id = useId()
  const step = sliderStep(payment)
  const max = Math.max(step, Math.ceil(payment / step) * step)
  // Opens at about a tenth of the payment, so the two plans already differ.
  const [extra, setExtra] = useState(() => Math.max(step, Math.round((payment * 0.1) / step) * step))
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const comparison = useMemo(() => comparePayoff(input, extra), [input, extra])
  const money = (value: number) => formatCurrency(value, currency)
  const short = (value: number) => formatCurrency(value, currency, { compact: true })
  const perYear = FREQUENCY_PER_YEAR[input.frequency]
  const monthsSaved = Math.round((comparison.periodsSaved * 12) / perYear)
  // x is in years. Ticks on whole years, thinned out for long loans.
  const lastYear = Math.ceil(comparison.balances.at(-1)?.x ?? 1)
  const every = lastYear <= 10 ? 1 : lastYear <= 20 ? 2 : 5
  const ticks = Array.from({ length: Math.floor(lastYear / every) + 1 }, (_, i) => i * every)
  const xLabel = (x: number) => `${t.charts.yearShort} ${x}`
  // The tooltip names the payment: "Yr 2 · Mo 5" on a monthly loan.
  const pointLabel = (x: number) => {
    const period = Math.round(x * perYear)
    const year = Math.floor(period / perYear)
    const within = period - year * perYear
    return perYear === 12 && within > 0 ? `${t.charts.yearShort} ${year} · ${t.charts.monthShort} ${within}` : xLabel(year)
  }

  return (
    <section className={cn(CHART_PANEL, 'space-y-6')} aria-labelledby={`${id}-title`}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id={`${id}-title`} className="text-sm font-medium">
            {p.title}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{p.subtitle}</p>
        </div>
        <ChartLegend
          items={[
            { color: colors.primary, label: p.without },
            { color: colors.tertiary, label: p.withExtra(short(extra)) },
          ]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        {/* The control and what it does. */}
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={`${id}-extra`} className="text-sm text-muted-foreground">
                {p.extra}
              </label>
              <span className="text-xl tabular-nums tracking-tight">{money(extra)}</span>
            </div>
            <Slider
              id={`${id}-extra`}
              min={0}
              max={max}
              step={step}
              value={Math.min(extra, max)}
              onChange={setExtra}
              aria-valuetext={money(extra)}
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{money(0)}</span>
              <span>{money(max)}</span>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-3 rounded-xl bg-muted p-4 lg:grid-cols-1 xl:grid-cols-3" aria-live="polite">
            <Stat label={p.interestSaved} value={money(comparison.interestSaved)} accent />
            <Stat
              label={p.sooner}
              value={monthsSaved > 0 ? formatMonths(monthsSaved, locale) : p.notSooner}
              accent={monthsSaved > 0}
            />
            <Stat label={p.newPayment} value={money(payment + extra)} />
          </dl>
        </div>

        {/* The balance over time, both plans. */}
        <figure className="min-w-0">
          <figcaption className="sr-only">{p.balance}</figcaption>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={comparison.balances} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`${id}-fast`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={colors.tertiary} stopOpacity={0.35} />
                  <stop offset="1" stopColor={colors.tertiary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis
                dataKey="x"
                type="number"
                domain={[0, 'dataMax']}
                ticks={ticks}
                {...AXIS_PROPS}
                tickMargin={8}
                tickFormatter={xLabel}
              />
              <YAxis {...AXIS_PROPS} width={64} tickFormatter={short} />
              <Tooltip
                cursor={{ stroke: CHART_INK.dark.secondary, strokeOpacity: 0.35 }}
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: TOOLTIP_STYLE.color }}
                formatter={(value: number, name: string) => [money(value), name]}
                labelFormatter={(x) => `${p.balance} · ${pointLabel(Number(x))}`}
              />
              <Line
                type="linear"
                dataKey="base"
                name={p.without}
                stroke={colors.primary}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 4, stroke: CHART_INK.dark.surface, strokeWidth: 2 }}
              />
              <Area
                type="linear"
                dataKey="faster"
                name={p.withExtra(short(extra))}
                stroke={colors.tertiary}
                strokeWidth={2}
                fill={`url(#${id}-fast)`}
                activeDot={{ r: 4, stroke: CHART_INK.dark.surface, strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </figure>
      </div>

      {/* The faster plan, year by year. */}
      <div className="border-t pt-4">
        <button
          type="button"
          aria-expanded={scheduleOpen}
          aria-controls={`${id}-schedule`}
          onClick={() => setScheduleOpen((open) => !open)}
          className="flex items-center gap-1.5 rounded-md text-sm font-medium transition-colors hover:text-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className={cn('h-4 w-4 transition-transform', scheduleOpen && 'rotate-90')} aria-hidden />
          {p.showSchedule}
        </button>
        <div id={`${id}-schedule`} hidden={!scheduleOpen} className="mt-3 max-h-80 overflow-auto rounded-xl border">
          <table className="w-full text-right text-sm tabular-nums">
            <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 text-left font-normal">
                  {p.year}
                </th>
                <th scope="col" className="px-4 py-2 font-normal">
                  {p.principal}
                </th>
                <th scope="col" className="px-4 py-2 font-normal">
                  {p.interest}
                </th>
                <th scope="col" className="px-4 py-2 font-normal">
                  {p.yearEndBalance}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.years.map((row) => (
                <tr key={row.year} className="border-t border-white/[0.04]">
                  <th scope="row" className="px-4 py-2 text-left font-normal text-muted-foreground">
                    {row.year}
                  </th>
                  <td className="px-4 py-2">{money(row.principal)}</td>
                  <td className="px-4 py-2">{money(row.interest)}</td>
                  <td className="px-4 py-2">{money(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('mt-1 truncate text-base font-medium tabular-nums', accent && 'text-emerald-400')}>{value}</dd>
    </div>
  )
}
