'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatPercent } from '@/lib/utils/format-number'
import type { AmortizationRow } from '@/lib/calculations/amortization'
import { amortizationInsights, type AmortizationBar } from '@/lib/calculations/amortization-insights'
import { useI18n } from '@/lib/i18n/client'
import { cn } from '@/lib/utils/cn'
import { AXIS_PROPS, CHART_INK, CHART_PANEL, GRID_PROPS, TOOLTIP_STYLE, seriesColors } from './theme'
import { ChartLegend } from './ChartLegend'
import type { CurrencyCode } from '@/types/currency'

export interface AmortizationChartProps {
  rows: AmortizationRow[]
  currency: CurrencyCode
  periodsPerYear?: number
  height?: number
  /** Calendar year of the first payment: yearly bars are labelled 2026, 2027… instead of Yr 1, Yr 2. */
  startYear?: number
}

/**
 * Where each payment goes: principal against interest, one stacked bar per year
 * (or per month for loans of up to three years).
 *
 * Above the plot, the three things the bars are hard to read off on their own:
 * how much goes to interest in total, when principal overtakes interest (also
 * marked on the plot), and when half the debt is gone. The tooltip gives each
 * bar's split and the balance left after it. The numbers come from
 * `amortizationInsights`; this only draws them.
 */
export function AmortizationChart({
  rows,
  currency,
  periodsPerYear = 12,
  height = 260,
  startYear,
}: AmortizationChartProps) {
  const { t, locale } = useI18n()
  const a = t.charts.amort
  const colors = seriesColors('dark')
  const surface = CHART_INK.dark.surface
  const insights = useMemo(() => amortizationInsights(rows, periodsPerYear), [rows, periodsPerYear])
  const { bars, unit } = insights
  const monthly = unit === 'month'
  const calendar = !monthly && startYear !== undefined

  const money = (value: number) => formatCurrency(value, currency)
  const short = (value: number) => formatCurrency(value, currency, { compact: true })
  const pct = (value: number) => formatPercent(value, locale, 0)
  // Axis ticks are bare numbers (the unit is in the tooltip and the stats); calendar years read on their own.
  const tick = (x: number) => (calendar ? String(startYear + x - 1) : String(x))
  const name = (x: number) => (calendar ? String(startYear + x - 1) : a.at(unit, x))
  const when = (x: number | null) =>
    x === null ? a.never : x === 1 ? a.fromStart : calendar ? a.inYear(String(startYear + x - 1)) : a.at(unit, x)
  // Many bars get thinner bars and sparser labels.
  const dense = bars.length > 15
  // Marked only when it happens partway: from the first bar there is nothing to point at.
  const marker = insights.crossover !== null && insights.crossover > 1 ? insights.crossover : null

  return (
    <figure className={cn(CHART_PANEL, 'space-y-5')}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <figcaption className="text-sm font-medium">
          {monthly ? t.charts.amortizationMonthlyCaption : t.charts.amortizationCaption}
        </figcaption>
        <ChartLegend
          items={[
            { color: colors.primary, label: t.charts.principal },
            { color: colors.secondary, label: t.charts.interest },
          ]}
        />
      </div>

      <dl className="grid gap-3 rounded-xl bg-muted p-4 sm:grid-cols-3">
        <Stat label={a.interestTotal} value={money(insights.totalInterest)} detail={a.interestShare(pct(insights.interestShare))} />
        <Stat label={a.crossover} value={when(insights.crossover)} />
        <Stat label={a.halfPaid} value={when(insights.halfPaid)} />
      </dl>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={bars} margin={{ top: 20, right: 8, bottom: 0, left: 0 }} barCategoryGap={dense ? '14%' : '28%'}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis
            dataKey="x"
            {...AXIS_PROPS}
            interval={dense ? 'preserveStartEnd' : 0}
            minTickGap={dense ? 16 : 8}
            tickMargin={8}
            tickFormatter={tick}
          />
          <YAxis {...AXIS_PROPS} width={64} tickFormatter={short} />

          {marker !== null && (
            <ReferenceLine
              x={marker}
              stroke={CHART_INK.dark.secondary}
              strokeOpacity={0.6}
              strokeDasharray="4 4"
              label={{ value: a.marker, position: 'top', fill: '#a7adb6', fontSize: 11 }}
            />
          )}

          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            content={({ active, payload }) => {
              const bar = active ? (payload?.[0]?.payload as AmortizationBar | undefined) : undefined
              if (!bar) return null
              const paid = bar.principal + bar.interest
              return (
                <div style={TOOLTIP_STYLE} className="min-w-48 space-y-1.5">
                  <p className="font-medium">{name(bar.x)}</p>
                  <Row color={colors.primary} label={t.charts.principal} value={money(bar.principal)} />
                  <Row color={colors.secondary} label={t.charts.interest} value={money(bar.interest)} />
                  <div className="space-y-1 border-t border-white/10 pt-1.5 text-[#a7adb6]">
                    <Row label={a.paid} value={money(paid)} />
                    {paid > 0 && <p>{a.interestPart(pct(bar.interest / paid))}</p>}
                    <Row label={a.balanceLeft} value={money(Math.max(0, bar.balance))} />
                  </div>
                </div>
              )
            }}
          />
          <Bar
            dataKey="principal"
            name={t.charts.principal}
            stackId="payment"
            fill={colors.primary}
            stroke={surface}
            strokeWidth={2}
            maxBarSize={56}
          />
          <Bar
            dataKey="interest"
            name={t.charts.interest}
            stackId="payment"
            fill={colors.secondary}
            stroke={surface}
            strokeWidth={2}
            radius={[4, 4, 0, 0]}
            maxBarSize={56}
          />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  )
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-base font-medium tabular-nums">{value}</dd>
      {detail && <dd className="mt-0.5 text-xs text-muted-foreground">{detail}</dd>}
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5">
        {color && <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: color }} />}
        {label}
      </span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
