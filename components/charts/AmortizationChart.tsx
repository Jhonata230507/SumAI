'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/lib/utils/format-currency'
import { toYearlyBuckets, type AmortizationRow } from '@/lib/calculations/amortization'
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
  // Up to three years of monthly payments, one bar per month: a short loan
  // bucketed by year would collapse into one or two bars that show nothing.
  const monthly = periodsPerYear === 12 && rows.length <= 36
  const data = monthly
    ? rows.map((row) => ({ x: row.period, principal: row.principal + row.extraPayment, interest: row.interest }))
    : toYearlyBuckets(rows, periodsPerYear).map(({ year, principal, interest }) => ({ x: year, principal, interest }))
  const unitShort = monthly ? t.charts.monthShort : t.charts.yearShort
  const unit = monthly ? t.charts.month : t.charts.year
  // Many bars get thinner bars and sparser labels.
  const dense = data.length > 15

  return (
    <figure className={cn(CHART_PANEL, 'space-y-4')}>
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

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barCategoryGap={dense ? '14%' : '28%'}>
          <CartesianGrid {...GRID_PROPS} />

          <XAxis
            dataKey="x"
            {...AXIS_PROPS}
            interval={dense ? 'preserveStartEnd' : 0}
            minTickGap={12}
            tickFormatter={(x: number) => `${unitShort} ${x}`}
          />
          <YAxis
            {...AXIS_PROPS}
            width={70}
            tickFormatter={(value: number) => formatCurrency(value, currency, { compact: true })}
          />

          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={TOOLTIP_STYLE}
            itemStyle={{ color: TOOLTIP_STYLE.color }}
            formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
            labelFormatter={(x) => `${unit} ${x}`}
          />
          <Bar
            dataKey="principal"
            name={t.charts.principal}
            stackId="payment"
            fill={colors.primary}
            stroke={surface}
            strokeWidth={2}
            maxBarSize={80}
          />
          <Bar
            dataKey="interest"
            name={t.charts.interest}
            stackId="payment"
            fill={colors.secondary}
            stroke={surface}
            strokeWidth={2}
            radius={[6, 6, 0, 0]}
            maxBarSize={80}
          />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  )
}
