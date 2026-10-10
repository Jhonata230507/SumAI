'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/lib/utils/format-currency'
import { toYearlyBuckets, type AmortizationRow } from '@/lib/calculations/amortization'
import { useI18n } from '@/lib/i18n/client'
import { AXIS_PROPS, CHART_INK, GRID_PROPS, TOOLTIP_STYLE, seriesColors } from './theme'
import type { CurrencyCode } from '@/types/currency'

export interface AmortizationChartProps {
  rows: AmortizationRow[]
  currency: CurrencyCode
  periodsPerYear?: number
  height?: number
}

/**
 * Principal against interest, one stacked bar per year of the loan.
 *
 * Bucketed by year rather than plotted per payment: 360 points is noise, and
 * the shape people need to see — interest dominating early, principal taking
 * over later — is clearer at yearly resolution. Bars rather than areas, so
 * each year reads as its own split: principal on the baseline, interest on
 * top, a 2px surface-coloured gap between the two segments and a rounded free
 * end. The gap is drawn as a stroke in the surface colour, not a border.
 */
export function AmortizationChart({
  rows,
  currency,
  periodsPerYear = 12,
  height = 280,
}: AmortizationChartProps) {
  const { t } = useI18n()
  const colors = seriesColors('dark')
  const surface = CHART_INK.dark.surface
  const data = toYearlyBuckets(rows, periodsPerYear)
  // Long loans get thinner bars and sparser year labels.
  const dense = data.length > 15

  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-medium">{t.charts.amortizationCaption}</figcaption>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barCategoryGap={dense ? '12%' : '22%'}>
          <CartesianGrid {...GRID_PROPS} />

          <XAxis
            dataKey="year"
            {...AXIS_PROPS}
            interval={dense ? 'preserveStartEnd' : 0}
            minTickGap={12}
            tickFormatter={(year: number) => `${t.charts.yearShort} ${year}`}
          />
          <YAxis
            {...AXIS_PROPS}
            width={70}
            tickFormatter={(value: number) => formatCurrency(value, currency, { compact: true })}
          />

          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={TOOLTIP_STYLE}
            itemStyle={{ color: TOOLTIP_STYLE.color }}
            formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
            labelFormatter={(year) => `${t.charts.year} ${year}`}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />

          <Bar
            dataKey="principal"
            name={t.charts.principal}
            stackId="payment"
            fill={colors.primary}
            stroke={surface}
            strokeWidth={2}
          />
          <Bar
            dataKey="interest"
            name={t.charts.interest}
            stackId="payment"
            fill={colors.secondary}
            stroke={surface}
            strokeWidth={2}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  )
}
