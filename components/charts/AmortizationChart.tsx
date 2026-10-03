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
import { toYearlyBuckets, type AmortizationRow } from '@/lib/calculations/amortization'
import { useI18n } from '@/lib/i18n/client'
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, seriesColors } from './theme'
import type { CurrencyCode } from '@/types/currency'

export interface AmortizationChartProps {
  rows: AmortizationRow[]
  currency: CurrencyCode
  periodsPerYear?: number
  height?: number
}

/**
 * Principal against interest over the life of a loan.
 *
 * Bucketed by year rather than plotted per payment: 360 points is noise, and
 * the shape people need to see — interest dominating early, principal taking
 * over later — is clearer at yearly resolution.
 */
export function AmortizationChart({
  rows,
  currency,
  periodsPerYear = 12,
  height = 280,
}: AmortizationChartProps) {
  const { t } = useI18n()
  const colors = seriesColors('dark')
  const data = toYearlyBuckets(rows, periodsPerYear)

  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-medium">{t.charts.amortizationCaption}</figcaption>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid {...GRID_PROPS} />

          <XAxis
            dataKey="year"
            {...AXIS_PROPS}
            tickFormatter={(year: number) => `${t.charts.yearShort} ${year}`}
          />
          <YAxis
            {...AXIS_PROPS}
            width={70}
            tickFormatter={(value: number) => formatCurrency(value, currency, { compact: true })}
          />

          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
            labelFormatter={(year) => `${t.charts.year} ${year}`}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />

          <Area
            type="monotone"
            dataKey="principal"
            name={t.charts.principal}
            stackId="payment"
            stroke={colors.primary}
            fill={colors.primary}
            fillOpacity={0.85}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="interest"
            name={t.charts.interest}
            stackId="payment"
            stroke={colors.secondary}
            fill={colors.secondary}
            fillOpacity={0.85}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </figure>
  )
}
