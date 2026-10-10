'use client'

import { useId } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { MortgageSystemId, MortgageSystemResult } from '@/features/calculators/mortgage/systems'
import { useI18n } from '@/lib/i18n/client'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatPercent } from '@/lib/utils/format-number'
import { cn } from '@/lib/utils/cn'
import { AXIS_PROPS, CHART_INK, GRID_PROPS, TOOLTIP_STYLE, seriesColors } from '@/components/charts/theme'
import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CurrencyCode } from '@/types/currency'

export interface MortgageSystemsProps {
  /** From calculateMortgageSystems; the page owns them so the chart can follow the selection. */
  systems: MortgageSystemResult[]
  selected: MortgageSystemId
  onSelect: (id: MortgageSystemId) => void
  currency: CurrencyCode
  locale: string
  /** Assumptions for the UVR systems: the real rate on top of the UVR, and inflation. */
  uvrRate: number
  inflation: number
}

const ORDER: MortgageSystemId[] = [
  'fixed-payment-cop',
  'fixed-principal-cop',
  'fixed-payment-uvr',
  'fixed-principal-uvr',
]

/**
 * Colombia's four home-loan amortization systems behind one segmented control:
 * pick a system, see its first monthly payment, how the payment moves over the
 * term, and the total paid. One result at a time keeps the card clean.
 *
 * The UVR systems rest on two assumptions (the UVR spread and inflation),
 * stated in a single line under their result. The selection is controlled by
 * the page, so the yearly chart below shows the same system.
 */
export function MortgageSystems({
  systems,
  selected,
  onSelect,
  currency,
  locale,
  uvrRate,
  inflation,
}: MortgageSystemsProps) {
  const { t } = useI18n()
  const s = t.mortgage.systems
  const system = systems.find((candidate) => candidate.id === selected)!
  const money = (value: number) => formatCurrency(value, currency)

  return (
    // Grows to fill its column (data-grow): the extra height goes to the trend line.
    <Card data-grow className="flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-5 p-5">
        <div>
          <h2 className="text-sm font-medium">{s.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{s.subtitle}</p>
        </div>

        {/* Segmented control: four systems, one selected. */}
        <div
          role="radiogroup"
          aria-label={s.title}
          className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-xs font-medium sm:grid-cols-4"
        >
          {ORDER.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected === id}
              title={s.names[id]}
              onClick={() => onSelect(id)}
              className={cn(
                'rounded-lg px-2 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected === id ? 'bg-white text-black' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {s.short[id]}
            </button>
          ))}
        </div>

        <SystemResult
          key={system.id}
          system={system}
          money={money}
          compact={(value) => formatCurrency(value, currency, { compact: true })}
        />

        {system.id.endsWith('uvr') && (
          <p className="text-xs text-muted-foreground">
            {s.assumes(formatPercent(uvrRate, locale, 1), formatPercent(inflation, locale, 1))}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function SystemResult({
  system,
  money,
  compact,
}: {
  system: MortgageSystemResult
  money: (value: number) => string
  compact: (value: number) => string
}) {
  const { t } = useI18n()
  const s = t.mortgage.systems

  const flat = Math.abs(system.lastPayment - system.firstPayment) < 1
  const peaksInside = system.highestPayment > Math.max(system.firstPayment, system.lastPayment) + 1
  const trend = flat
    ? s.flat
    : peaksInside
      ? s.peaksAt(money(system.highestPayment))
      : system.lastPayment < system.firstPayment
        ? s.fallsTo(money(system.lastPayment))
        : s.risesTo(money(system.lastPayment))

  return (
    <div className="advantage-in flex flex-1 flex-col" aria-live="polite">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-xs text-muted-foreground">{s.firstPayment}</p>
          <p className="text-3xl font-medium tabular-nums tracking-tight">{money(system.firstPayment)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{trend}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs text-muted-foreground">{s.totalPaid}</p>
          <p className="text-base font-medium tabular-nums">{money(system.totalPaid)}</p>
        </div>
      </div>

      <Trend payments={system.payments} color={seriesColors('dark').primary} money={money} compact={compact} />
    </div>
  )
}

/**
 * The monthly payment over the term, as a small labelled chart: a money axis
 * from zero (so a rise or fall reads at its true size), year ticks, the first
 * and last payment marked, and a tooltip with the payment of any month.
 */
function Trend({
  payments,
  color,
  money,
  compact,
}: {
  payments: number[]
  color: string
  money: (value: number) => string
  compact: (value: number) => string
}) {
  const { t } = useI18n()
  const fade = useId()
  const n = payments.length
  const data = payments.map((payment, i) => ({ month: i + 1, payment }))
  const years = Math.ceil(n / 12)
  const step = years <= 10 ? 1 : 5
  const ticks = Array.from({ length: years }, (_, k) => k + 1)
    .filter((year) => year === 1 || year % step === 0)
    .map((year) => (year - 1) * 12 + 1)
  const yearOf = (month: number) => Math.ceil(month / 12)
  const label = { fill: CHART_INK.dark.secondary, fontSize: 11 }

  return (
    <figure className="mt-4 flex min-h-48 flex-1 flex-col">
      <figcaption className="text-xs text-muted-foreground">{t.mortgage.systems.chartTitle}</figcaption>
      <div className="relative mt-2 min-h-40 flex-1">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 40, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={fade} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={color} stopOpacity={0.22} />
                  <stop offset="1" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis
                dataKey="month"
                type="number"
                domain={[1, n]}
                ticks={ticks}
                tickFormatter={(month: number) => `${t.charts.yearShort} ${yearOf(month)}`}
                {...AXIS_PROPS}
              />
              <YAxis {...AXIS_PROPS} width={72} domain={[0, 'auto']} tickCount={4} tickFormatter={compact} />
              <Tooltip
                cursor={{ stroke: CHART_INK.dark.secondary, strokeOpacity: 0.4 }}
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: TOOLTIP_STYLE.color }}
                labelFormatter={(month) => `${t.charts.month} ${month} · ${t.charts.year} ${yearOf(Number(month))}`}
                formatter={(value: number) => [money(value), t.mortgage.systems.chartTooltip]}
              />
              <Area
                type="monotone"
                dataKey="payment"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${fade})`}
                isAnimationActive={false}
                activeDot={{ r: 4, stroke: CHART_INK.dark.surface, strokeWidth: 2 }}
              />
              {/* First and last payment, labelled on the line. */}
              <ReferenceDot
                x={1}
                y={payments[0]}
                r={4}
                fill={color}
                stroke={CHART_INK.dark.surface}
                strokeWidth={2}
                label={{ ...label, value: compact(payments[0]), position: 'top', offset: 8 }}
              />
              {n > 1 && (
                <ReferenceDot
                  x={n}
                  y={payments[n - 1]}
                  r={4}
                  fill={color}
                  stroke={CHART_INK.dark.surface}
                  strokeWidth={2}
                  label={{ ...label, value: compact(payments[n - 1]), position: 'top', offset: 8 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </figure>
  )
}
