'use client'

import { useId } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/utils/format-currency'
import { useI18n } from '@/lib/i18n/client'
import { AXIS_PROPS, CHART_INK, GRID_PROPS, TOOLTIP_STYLE, seriesColors } from './theme'
import type { GrowthPoint } from '@/lib/calculations/compound-interest'
import type { CurrencyCode } from '@/types/currency'

export interface GrowthChartProps {
  points: GrowthPoint[]
  currency: CurrencyCode
  periodsPerYear?: number
  height?: number
  caption?: string
}

/**
 * Contributions against growth over time.
 *
 * Stacked deliberately: the gap between the two bands is the compounding, and
 * showing them as separate lines would bury exactly the thing the chart exists
 * to make visible.
 */
export function GrowthChart({ points, currency, periodsPerYear = 12, height = 300, caption }: GrowthChartProps) {
  const { t } = useI18n()
  const colors = seriesColors('dark')

  // One point per year keeps a 30-year projection readable; short horizons
  // stay per-period so a six-month plan still draws a line.
  const yearly = points.length > periodsPerYear * 2
  const unit = yearly ? t.charts.yearShort : t.charts.monthShort

  const data = (yearly ? points.filter((point) => point.period % periodsPerYear === 0) : points).map((point) => ({
    x: yearly ? point.period / periodsPerYear : point.period,
    contributions: point.contributions,
    growth: Math.max(0, point.balance - point.contributions),
    balance: point.balance,
  }))

  const last = data[data.length - 1]
  const money = (value: number) => formatCurrency(value, currency)
  const short = (value: number) => formatCurrency(value, currency, { compact: true })
  const yTicks = niceTicks(last ? last.balance : 0)
  const xTicks = spreadTicks(data.map((d) => d.x))
  const id = useId()

  return (
    <figure className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <figcaption className="text-sm font-medium">{caption ?? t.charts.growthCaption}</figcaption>
        {/* Legend with where each band ends up, instead of a bare key under the chart. */}
        {last && (
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
            <LegendItem color={colors.primary} label={t.charts.contributed} value={short(last.contributions)} />
            <LegendItem color={colors.tertiary} label={t.charts.growth} value={short(last.growth)} />
          </ul>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 28, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`${id}-c`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={colors.primary} stopOpacity={0.9} />
              <stop offset="1" stopColor={colors.primary} stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={colors.tertiary} stopOpacity={0.85} />
              <stop offset="1" stopColor={colors.tertiary} stopOpacity={0.45} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_PROPS} />

          <XAxis
            dataKey="x"
            type="number"
            domain={[data[0]?.x ?? 0, last?.x ?? 1]}
            ticks={xTicks}
            {...AXIS_PROPS}
            // Clear of the $0 tick in the corner.
            tickMargin={10}
            padding={{ left: 10, right: 6 }}
            tickFormatter={(x: number) => `${unit} ${x}`}
          />
          <YAxis
            {...AXIS_PROPS}
            width={72}
            tickMargin={8}
            domain={[0, yTicks.at(-1)!]}
            ticks={yTicks}
            tickFormatter={short}
          />

          <Tooltip
            cursor={{ stroke: CHART_INK.dark.secondary, strokeOpacity: 0.35 }}
            contentStyle={TOOLTIP_STYLE}
            itemStyle={{ color: TOOLTIP_STYLE.color }}
            formatter={(value: number, name: string) => [money(value), name]}
            labelFormatter={(x, payload) => {
              const balance = (payload?.[0]?.payload as { balance?: number } | undefined)?.balance
              const when = `${yearly ? t.charts.year : t.charts.month} ${x}`
              return balance !== undefined ? `${when} · ${t.common.total} ${money(balance)}` : when
            }}
          />

          <Area
            type="monotone"
            dataKey="contributions"
            name={t.charts.contributed}
            stackId="balance"
            stroke={colors.primary}
            fill={`url(#${id}-c)`}
            strokeWidth={2}
            activeDot={{ r: 4, stroke: CHART_INK.dark.surface, strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="growth"
            name={t.charts.growth}
            stackId="balance"
            stroke={colors.tertiary}
            fill={`url(#${id}-g)`}
            strokeWidth={2}
            activeDot={{ r: 4, stroke: CHART_INK.dark.surface, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </figure>
  )
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </li>
  )
}

/** Axis ticks from 0 in round steps (1, 2, 2.5 or 5 × 10ⁿ), topping out ~10% above the peak. */
function niceTicks(peak: number): number[] {
  if (!(peak > 0)) return [0, 1]
  const rough = (peak * 1.1) / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const n = rough / magnitude
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * magnitude
  const top = Math.ceil((peak * 1.1) / step) * step
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
}

/** About six evenly spread x ticks: the first, round steps, and the last. */
function spreadTicks(xs: number[]): number[] {
  if (xs.length <= 7) return xs
  const first = xs[0]
  const lastX = xs[xs.length - 1]
  const raw = (lastX - first) / 5
  const step = [1, 2, 3, 5, 6, 10, 12, 15, 20, 25, 30].find((s) => s >= raw) ?? Math.ceil(raw)
  const ticks = [first]
  for (let x = step; x < lastX; x += step) if (x - first >= step * 0.6 && lastX - x >= step * 0.6) ticks.push(x)
  ticks.push(lastX)
  return ticks
}
