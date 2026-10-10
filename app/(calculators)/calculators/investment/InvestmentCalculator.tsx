'use client'

import type { ReactNode } from 'react'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultSummary } from '@/components/calculator/ResultSummary'
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
import { formatNumber } from '@/lib/utils/format-number'
import { useI18n } from '@/lib/i18n/client'
import { FREQUENCY_PER_YEAR } from '@/types/common'
import type { CountryConfig } from '@/types/country'

export interface InvestmentCalculatorProps {
  country: CountryConfig
  initial: InvestmentSchema
  header: ReactNode
  related: ReactNode
}

export function InvestmentCalculator({
  country,
  initial,
  header,
  related,
}: InvestmentCalculatorProps) {
  const { t } = useI18n()
  const { input, committed, errors, result, set, reset } = useCalculator(
    investmentSchema,
    calculateInvestment,
    initial,
  )

  const doubling = yearsToDouble(committed.annualReturn - committed.feeRate)
  const compact = (value: number) => formatCurrency(value, result.currency, { compact: true })

  return (
    <CalculatorLayout
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

          <div className="grid grid-cols-2 gap-3">
            <PercentageInput
              id="fees"
              label={t.investment.fees}
              hint={t.investment.feesHint}
              step={0.01}
              value={input.feeRate}
              onChange={(v) => set('feeRate', v)}
            />
            <PercentageInput
              id="inflation"
              label={t.investment.inflation}
              value={input.inflationRate}
              onChange={(v) => set('inflationRate', v)}
            />
          </div>

          <PercentageInput
            id="raise"
            label={t.investment.raise}
            value={input.contributionGrowth}
            onChange={(v) => set('contributionGrowth', v)}
          />
        </CalculatorForm>
      }
      results={
        <>
          <ResultSummary
            currency={result.currency}
            locale={country.locale}
            figures={[
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
              { key: 'totalContributed', label: t.investment.contributed, value: result.totalContributed, format: 'currency' },
              { key: 'totalFees', label: t.investment.lostToFees, value: result.totalFees, format: 'currency' },
            ]}
          />

          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-medium">{t.investment.rangeTitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.investment.rangeIntro}</p>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
                <RangeCell label={t.investment.weaker} value={compact(result.range.pessimistic)} />
                <RangeCell label={t.investment.expected} value={compact(result.range.expected)} strong />
                <RangeCell label={t.investment.stronger} value={compact(result.range.optimistic)} />
              </dl>
              {Number.isFinite(doubling) && (
                <p className="mt-4 text-xs text-muted-foreground">
                  {t.investment.doubling(formatNumber(doubling, country.locale, 1))}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      }
      assistant={
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
      detail={
        <>
          <GrowthChart
            points={result.series.points}
            currency={result.currency}
            periodsPerYear={FREQUENCY_PER_YEAR[committed.contributionFrequency]}
          />
        </>
      }
    />
  )
}

function RangeCell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? 'rounded-lg bg-primary/5 py-2' : 'py-2'}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={strong ? 'mt-0.5 font-semibold tabular-nums' : 'mt-0.5 tabular-nums'}>{value}</dd>
    </div>
  )
}
