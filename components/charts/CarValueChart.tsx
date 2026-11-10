'use client'

import { useId } from 'react'
import { Area, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { projectDepreciation } from '@/features/calculators/car-loan/calculation'
import type { AmortizationRow } from '@/lib/calculations/amortization'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatPercent } from '@/lib/utils/format-number'
import { useI18n } from '@/lib/i18n/client'
import { cn } from '@/lib/utils/cn'
import { AXIS_PROPS, CHART_INK, GRID_PROPS, TOOLTIP_STYLE, seriesColors } from './theme'
import { ChartLegend } from './ChartLegend'
import type { CurrencyCode } from '@/types/currency'

export interface CarValueChartProps {
  vehiclePrice: number
  amountFinanced: number
  rows: AmortizationRow[]
  /** First month the car is worth more than what is owed; null if never within the loan. */
  breakEvenPeriod: number | null
  currency: CurrencyCode
  locale: string
  className?: string
}

/**
 * What the car is worth against what is still owed on it, month by month.
 *
 * Two lines on one money scale: the car's value falling, the balance falling
 * faster or slower. Where they cross is when the buyer stops being underwater,
 * and the two figures above say where the car ends up and since when it is
 * worth more than the debt. The plot takes whatever height its card gives it.
 */
export function CarValueChart({
  vehiclePrice,
  amountFinanced,
  rows,
  breakEvenPeriod,
  currency,
  locale,
  className,
}: CarValueChartProps) {
  const { t } = useI18n()
  const v = t.carLoan.valueChart
  const colors = seriesColors('dark')
  const id = useId()

  const data = [
    { period: 0, vehicleValue: vehiclePrice, loanBalance: amountFinanced },
    ...projectDepreciation(vehiclePrice, rows),
  ]
  const last = data[data.length - 1]
  const months = last.period
  // Long loans are labelled by year, short ones by month.
  const byYear = months > 24
  const ticks = byYear
    ? Array.from({ length: Math.floor(months / 12) + 1 }, (_, i) => i * 12)
    : data.filter((_, i) => i % Math.max(1, Math.ceil(months / 6)) === 0).map((d) => d.period)
  const short = (value: number) => formatCurrency(value, currency, { compact: true })
  const lost = 1 - last.vehicleValue / vehiclePrice

  return (
    <figure className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <figcaption className="text-sm font-medium">{v.caption}</figcaption>
        <ChartLegend
          items={[
            { color: colors.tertiary, label: v.value },
            { color: colors.primary, label: v.owed },
          ]}
        />
      </div>

      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-xs text-muted-foreground">{v.endValue}</dt>
          <dd className="mt-1 text-lg font-medium sm:text-xl tabular-nums tracking-tight">
            {formatCurrency(last.vehicleValue, currency)}
          </dd>
          <dd className="mt-0.5 text-xs text-muted-foreground">{v.lost(formatPercent(lost, locale, 0))}</dd>
        </div>
        <div className="border-l pl-4">
          <dt className="text-xs text-muted-foreground">{v.ahead}</dt>
          <dd className="mt-1 text-lg font-medium sm:text-xl tracking-tight">
            {amountFinanced <= vehiclePrice ? v.aheadAlways : breakEvenPeriod ? v.aheadFrom(breakEvenPeriod) : '—'}
          </dd>
        </div>
      </dl>

      {/* The plot fills the card's remaining height; absolute so the chart never grows its parent. */}
      <div className="relative min-h-44 flex-1">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 20, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`${id}-v`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={colors.tertiary} stopOpacity={0.3} />
                  <stop offset="1" stopColor={colors.tertiary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis
                dataKey="period"
                type="number"
                domain={[0, months]}
                ticks={ticks}
                {...AXIS_PROPS}
                tickMargin={8}
                tickFormatter={(m: number) =>
                  byYear ? `${t.charts.yearShort} ${m / 12}` : `${t.charts.monthShort} ${m}`
                }
              />
              <YAxis {...AXIS_PROPS} width={64} domain={[0, 'auto']} tickFormatter={short} />
              <Tooltip
                cursor={{ stroke: CHART_INK.dark.secondary, strokeOpacity: 0.35 }}
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: TOOLTIP_STYLE.color }}
                formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
                labelFormatter={(m) => `${t.charts.month} ${m}`}
              />
              <Area
                type="monotone"
                dataKey="vehicleValue"
                name={v.value}
                stroke={colors.tertiary}
                strokeWidth={2}
                fill={`url(#${id}-v)`}
                activeDot={{ r: 4, stroke: CHART_INK.dark.surface, strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="loanBalance"
                name={v.owed}
                stroke={colors.primary}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: CHART_INK.dark.surface, strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{v.note}</p>
    </figure>
  )
}
