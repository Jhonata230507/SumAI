'use client'

import { useId, useMemo, useState } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PlanResult, Strategy } from '@/features/calculators/debt-payoff/estimator/calculate'
import { Segmented } from '@/components/common/Segmented'
import { formatCurrency } from '@/lib/utils/format-currency'
import { useI18n } from '@/lib/i18n/client'
import { cn } from '@/lib/utils/cn'
import type { CurrencyCode } from '@/types/currency'
import { ChartLegend } from './ChartLegend'
import { AXIS_PROPS, CHART_INK, CHART_PANEL, GRID_PROPS, TOOLTIP_STYLE, seriesColors } from './theme'

export interface DebtBalanceChartProps {
  avalanche: PlanResult
  snowball: PlanResult
  baseline: PlanResult
  /** The method the per-debt view breaks down. */
  selected: Strategy
  /** Debt names by id, in the order they were entered. */
  debts: { id: string; name: string }[]
  currency: CurrencyCode
}

/** Beyond the three series hues, distinct tints for up to ten debts. */
const DEBT_COLORS = [
  '#6159e6',
  '#ffa31a',
  '#3fcae6',
  '#f2603a',
  '#4fd1a2',
  '#e879f9',
  '#facc15',
  '#60a5fa',
  '#f472b6',
  '#a3e635',
]

/**
 * The total balance over time: avalanche and snowball, with paying only the
 * minimums as a dashed reference. A switch breaks the selected method down per
 * debt, stacked, so you see which debt is cleared when.
 */
export function DebtBalanceChart({ avalanche, snowball, baseline, selected, debts, currency }: DebtBalanceChartProps) {
  const { t } = useI18n()
  const p = t.debtPayoff.planner
  const colors = seriesColors('dark')
  const id = useId()
  const [view, setView] = useState<'total' | 'perDebt'>('total')

  // The window: until both methods are done (the baseline is cut there).
  const end = Math.max(avalanche.timeline.length, snowball.timeline.length) - 1
  const data = useMemo(() => {
    const plan = selected === 'avalanche' ? avalanche : snowball
    return Array.from({ length: end + 1 }, (_, month) => ({
      month,
      avalanche: avalanche.timeline[month]?.total ?? 0,
      snowball: snowball.timeline[month]?.total ?? 0,
      baseline: baseline.timeline[month]?.total,
      ...Object.fromEntries(debts.map((debt) => [debt.id, plan.timeline[month]?.byDebt[debt.id] ?? 0])),
    }))
  }, [avalanche, snowball, baseline, selected, debts, end])

  const yearly = end > 36
  const ticks = yearly
    ? Array.from({ length: Math.floor(end / 12) + 1 }, (_, i) => i * 12).filter(
        (m, _, all) => all.length <= 12 || m % 24 === 0,
      )
    : undefined
  const xLabel = (month: number) => (yearly ? `${t.charts.yearShort} ${month / 12}` : `${t.charts.monthShort} ${month}`)
  const short = (value: number) => formatCurrency(value, currency, { compact: true })
  const money = (value: number) => formatCurrency(value, currency)
  const names = { avalanche: p.strategies.avalanche.name, snowball: p.strategies.snowball.name }

  return (
    <figure className={cn(CHART_PANEL, 'space-y-4')}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <figcaption className="text-sm font-medium">{p.chartTitle}</figcaption>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <ChartLegend
            items={
              view === 'total'
                ? [
                    { color: colors.primary, label: names.avalanche },
                    { color: colors.tertiary, label: names.snowball },
                    { color: CHART_INK.dark.secondary, label: p.minimumsOnly },
                  ]
                : debts.map((debt, index) => ({ color: DEBT_COLORS[index % DEBT_COLORS.length], label: debt.name }))
            }
          />
          <Segmented
            label={p.chartView}
            size="sm"
            value={view}
            options={(['total', 'perDebt'] as const).map((option) => ({
              value: option,
              label: option === 'perDebt' ? `${p.chartViews.perDebt} · ${names[selected]}` : p.chartViews.total,
            }))}
            onChange={setView}
          />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`${id}-a`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={colors.primary} stopOpacity={0.3} />
              <stop offset="1" stopColor={colors.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis
            dataKey="month"
            type="number"
            domain={[0, end]}
            ticks={ticks}
            allowDecimals={false}
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
            labelFormatter={(month) => p.monthN(Number(month))}
          />
          {/* Series as an array, not a fragment: Recharts only finds its direct children. */}
          {view === 'total'
            ? [
                <Line
                  key="baseline"
                  type="linear"
                  dataKey="baseline"
                  name={p.minimumsOnly}
                  stroke={CHART_INK.dark.secondary}
                  strokeOpacity={0.6}
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                />,
                <Area
                  key="avalanche"
                  type="linear"
                  dataKey="avalanche"
                  name={names.avalanche}
                  stroke={colors.primary}
                  strokeWidth={2}
                  fill={`url(#${id}-a)`}
                  activeDot={{ r: 4, stroke: CHART_INK.dark.surface, strokeWidth: 2 }}
                />,
                <Line
                  key="snowball"
                  type="linear"
                  dataKey="snowball"
                  name={names.snowball}
                  stroke={colors.tertiary}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: CHART_INK.dark.surface, strokeWidth: 2 }}
                />,
              ]
            : debts.map((debt, index) => (
                <Area
                  key={debt.id}
                  type="linear"
                  dataKey={debt.id}
                  name={debt.name}
                  stackId="debts"
                  stroke={DEBT_COLORS[index % DEBT_COLORS.length]}
                  fill={DEBT_COLORS[index % DEBT_COLORS.length]}
                  fillOpacity={0.35}
                  strokeWidth={1.5}
                />
              ))}
        </ComposedChart>
      </ResponsiveContainer>
    </figure>
  )
}
