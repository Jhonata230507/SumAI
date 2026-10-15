'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultSummary, type SummaryFigure } from '@/components/calculator/ResultSummary'
import { GrowthChart } from '@/components/charts/GrowthChart'
import { AIAnalysis } from '@/components/ai/AIAnalysis'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { PercentageInput } from '@/components/common/PercentageInput'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { calculateInvestment, yearsToDouble } from '@/features/calculators/investment/calculation'
import { investmentSchema, type InvestmentSchema } from '@/features/calculators/investment/schema'
import { useCalculator } from '@/features/calculators/use-calculator'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatNumber, formatPercent } from '@/lib/utils/format-number'
import { useI18n } from '@/lib/i18n/client'
import { FREQUENCY_PER_YEAR } from '@/types/common'
import type { CountryConfig } from '@/types/country'
import { BestOffers } from '@/components/calculator/BestOffers'

export interface InvestmentCalculatorProps {
  country: CountryConfig
  initial: InvestmentSchema
  header: ReactNode
  related: ReactNode
}

/** Fields the calculator opens with empty (NaN): the user types their own numbers. */
const START = { initialAmount: Number.NaN, contribution: Number.NaN, annualReturn: Number.NaN }

export function InvestmentCalculator({ country, initial, header, related }: InvestmentCalculatorProps) {
  const { t } = useI18n()
  const { input, committed, errors, result, set, ready, reset } = useCalculator(
    investmentSchema,
    calculateInvestment,
    initial,
    { start: START },
  )

  const doubling = yearsToDouble(committed.annualReturn - committed.feeRate)
  const compact = (value: number) => formatCurrency(value, result.currency, { compact: true })

  const figures: SummaryFigure[] = [
    {
      key: 'finalBalance',
      label: t.investment.balanceAfter(committed.years),
      value: result.finalBalance,
      format: 'currency',
      emphasis: 'primary',
      detail: t.investment.multiple(result.multiple),
    },
    {
      key: 'realBalance',
      label: t.investment.todaysMoney,
      value: result.realBalance,
      format: 'currency',
      hint: t.investment.todaysMoneyHint,
    },
    {
      key: 'totalContributed',
      label: t.investment.contributed,
      value: result.totalContributed,
      format: 'currency',
    },
    { key: 'totalFees', label: t.investment.lostToFees, value: result.totalFees, format: 'currency' },
  ]

  return (
    <CalculatorLayout
      ready={ready}
      header={header}
      related={related}
      form={
        <CalculatorForm onReset={reset}>
          <CurrencyInput
            id="initial"
            label={t.investment.startingAmount}
            currency={country.currency}
            value={input.initialAmount}
            onChange={(v) => set('initialAmount', v)}
          />
          <CurrencyInput
            id="contribution"
            label={t.investment.monthlyContribution}
            currency={country.currency}
            value={input.contribution}
            onChange={(v) => set('contribution', v)}
          />

          <PercentageInput
            id="return"
            label={t.investment.expectedReturn}
            hint={t.investment.expectedReturnHint}
            value={input.annualReturn}
            error={errors.annualReturn}
            onChange={(v) => set('annualReturn', v)}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="years">{t.investment.yearsInvested}</Label>
              <span className="text-sm tabular-nums">{input.years}</span>
            </div>
            <Slider id="years" min={1} max={50} value={input.years} onChange={(v) => set('years', v)} />
          </div>

          <div className="space-y-4">
            <PercentageInput
              id="fees"
              optional
              label={t.investment.fees}
              hint={t.investment.feesHint}
              step={0.01}
              value={input.feeRate}
              onChange={(v) => set('feeRate', v)}
            />
            <PercentageInput
              id="inflation"
              optional
              label={t.investment.inflation}
              value={input.inflationRate}
              onChange={(v) => set('inflationRate', v)}
            />
          </div>

          <PercentageInput
            id="raise"
            optional
            label={t.investment.raise}
            value={input.contributionGrowth}
            onChange={(v) => set('contributionGrowth', v)}
          />
        </CalculatorForm>
      }
      results={
        <>
          {/* The balance on its own, the other figures in one card. */}
          <ResultSummary currency={result.currency} locale={country.locale} figures={figures.slice(0, 1)} />
          <ResultSummary combined currency={result.currency} locale={country.locale} figures={figures.slice(1)} />

          {/* Fills the rest of the column: the three outcomes as columns sized to their value. */}
          <Card className="flex flex-col">
            <CardContent className="flex flex-1 flex-col p-5">
              <p className="text-sm font-medium">{t.investment.rangeTitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.investment.rangeIntro}</p>
              <RangeBars
                locale={country.locale}
                items={[
                  { key: 'weaker', label: t.investment.weaker, value: result.range.pessimistic },
                  { key: 'expected', label: t.investment.expected, value: result.range.expected },
                  { key: 'stronger', label: t.investment.stronger, value: result.range.optimistic },
                ]}
                format={compact}
              />
              {Number.isFinite(doubling) && (
                <p className="mt-4 text-xs text-muted-foreground">
                  {t.investment.doubling(formatNumber(doubling, country.locale, 1))}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      }
      detail={
        <GrowthChart
          points={result.series.points}
          currency={result.currency}
          periodsPerYear={FREQUENCY_PER_YEAR[committed.contributionFrequency]}
        />
      }
      // Recommended credits beside the numbers; the AI explanation is set aside for now.
      assistant={<BestOffers variant="sidebar" category="savings" country={country} amount={result.finalBalance} />}
      explanation={
        <AIAnalysis
          context={{
            calculatorId: 'investment',
            countryCode: country.code,
            currency: result.currency,
            inputs: { ...committed },
            results: {
              finalBalance: result.finalBalance,
              realBalance: result.realBalance,
              totalContributed: result.totalContributed,
              totalGrowth: result.totalGrowth,
              totalFees: result.totalFees,
            },
          }}
        />
      }
    />
  )
}

const BAR_TONE = {
  weaker: 'from-white/[0.05] to-white/[0.16]',
  expected: 'from-[#2a6fd0] to-[#5ea4f2]',
  stronger: 'from-[#147a5b]/70 to-[#4fd1a2]/80',
} as const

/**
 * The three outcomes as bars on a shared baseline, sized to their value, with
 * faint guide lines. The expected outcome leads (blue); the weaker and stronger
 * ones show how far they sit from it.
 */
function RangeBars({
  items,
  format,
  locale,
}: {
  items: { key: keyof typeof BAR_TONE; label: string; value: number }[]
  format: (value: number) => string
  locale: string
}) {
  const peak = Math.max(...items.map((item) => item.value), 1)
  const expected = items.find((item) => item.key === 'expected')?.value ?? peak
  const delta = (value: number) => {
    const change = value / expected - 1
    return `${change > 0 ? '+' : '−'}${formatPercent(Math.abs(change), locale, 0)}`
  }

  return (
    <dl className="mt-5 flex min-h-44 flex-1 flex-col">
      {/* Bars on a shared baseline, with faint guides at a third and two thirds. */}
      <div className="relative flex flex-1 items-end gap-4 border-b border-white/[0.12] px-2">
        <span aria-hidden className="absolute inset-x-0 top-1/3 border-t border-dashed border-white/[0.05]" />
        <span aria-hidden className="absolute inset-x-0 top-2/3 border-t border-dashed border-white/[0.05]" />
        {items.map((item) => {
          const strong = item.key === 'expected'
          return (
            <div key={item.key} className="relative flex h-full flex-1 flex-col items-center justify-end">
              <dd
                className={cn(
                  'mb-2 tabular-nums',
                  strong ? 'text-lg font-semibold text-foreground' : 'text-sm font-medium text-foreground/75',
                )}
              >
                {format(item.value)}
              </dd>
              <div
                aria-hidden
                className={cn(
                  'w-full max-w-28 rounded-t-xl bg-gradient-to-t shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-[height] duration-500',
                  BAR_TONE[item.key],
                )}
                style={{ height: `${Math.max(0.06, Math.min(1, item.value / peak)) * 80}%` }}
              />
            </div>
          )
        })}
      </div>
      {/* Labels, with how far each outcome sits from the expected one. */}
      <div className="mt-2.5 flex gap-4 px-2">
        {items.map((item) => (
          <dt key={item.key} className="flex flex-1 flex-col items-center text-center">
            <span
              className={cn(
                'text-xs',
                item.key === 'expected' ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {item.label}
            </span>
            {item.key !== 'expected' && (
              <span
                className={cn(
                  'mt-0.5 text-[11px] tabular-nums',
                  item.value < expected ? 'text-muted-foreground/70' : 'text-emerald-400/80',
                )}
              >
                {delta(item.value)}
              </span>
            )}
          </dt>
        ))}
      </div>
    </dl>
  )
}
