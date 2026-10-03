'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/lib/utils/format-currency'
import { useI18n } from '@/lib/i18n/client'
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, seriesColors } from './theme'
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
export function GrowthChart({
  points,
  currency,
  periodsPerYear = 12,
  height = 300,
  caption,
}: GrowthChartProps) {
  const { t } = useI18n()
  const colors = seriesColors('dark')

  // One point per year keeps a 30-year projection readable; short horizons
  // stay per-period so a six-month plan still draws a line.
  const yearly = points.length > periodsPerYear * 2
  const unit = yearly ? t.charts.yearShort : t.charts.monthShort

  const data = (yearly ? points.filter((point) => point.period % periodsPerYear === 0) : points).map(
    (point) => ({
      x: yearly ? point.period / periodsPerYear : point.period,
      contributions: point.contributions,
      growth: Math.max(0, point.balance - point.contributions),
      balance: point.balance,
    }),
  )

  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-medium">{caption ?? t.charts.growthCaption}</figcaption>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid {...GRID_PROPS} />

          <XAxis dataKey="x" {...AXIS_PROPS} tickFormatter={(x: number) => `${unit} ${x}`} />
          <YAxis
            {...AXIS_PROPS}
            width={70}
            tickFormatter={(value: number) => formatCurrency(value, currency, { compact: true })}
          />

          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
            labelFormatter={(x) => `${yearly ? t.charts.year : t.charts.month} ${x}`}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />

          <Area
            type="monotone"
            dataKey="contributions"
            name={t.charts.contributed}
            stackId="balance"
            stroke={colors.primary}
            fill={colors.primary}
            fillOpacity={0.85}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="growth"
            name={t.charts.growth}
            stackId="balance"
            stroke={colors.tertiary}
            fill={colors.tertiary}
            fillOpacity={0.85}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </figure>
  )
}
