'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/lib/utils/format-currency'
import { useI18n } from '@/lib/i18n/client'
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, seriesColors } from './theme'
import type { CurrencyCode } from '@/types/currency'

export interface ComparisonBar {
  label: string
  value: number
  /** Marks the option currently selected, so it reads as the reference point. */
  highlight?: boolean
}

export interface ComparisonChartProps {
  bars: ComparisonBar[]
  currency: CurrencyCode
  caption?: string
  height?: number
}

/**
 * Compares one measure across a handful of options.
 *
 * Horizontal, because option labels are words and reading them rotated is
 * needless work. One measure per chart — comparing cost and payment on two
 * scales in one frame is the dual-axis mistake.
 */
export function ComparisonChart({
  bars,
  currency,
  caption,
  height,
}: ComparisonChartProps) {
  const { t } = useI18n()
  const colors = seriesColors('dark')
  const computedHeight = height ?? Math.max(160, bars.length * 48 + 40)

  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-medium">{caption ?? t.charts.comparisonCaption}</figcaption>

      <ResponsiveContainer width="100%" height={computedHeight}>
        <BarChart
          data={bars}
          layout="vertical"
          margin={{ top: 4, right: 72, bottom: 4, left: 8 }}
          barCategoryGap={8}
        >
          <CartesianGrid {...GRID_PROPS} horizontal={false} vertical />

          <XAxis
            type="number"
            {...AXIS_PROPS}
            tickFormatter={(value: number) => formatCurrency(value, currency, { compact: true })}
          />
          <YAxis type="category" dataKey="label" {...AXIS_PROPS} width={140} />

          <Tooltip
            cursor={{ fill: 'transparent' }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number) => formatCurrency(value, currency)}
          />

          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {bars.map((bar, index) => (
              <Cell
                key={index}
                fill={bar.highlight ? colors.primary : colors.secondary}
                fillOpacity={bar.highlight ? 1 : 0.75}
              />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              className="fill-foreground"
              style={{ fontSize: 12 }}
              formatter={(value: number) => formatCurrency(value, currency, { compact: true })}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  )
}
