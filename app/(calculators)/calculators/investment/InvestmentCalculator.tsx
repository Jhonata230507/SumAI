'use client'

import type { ReactNode } from 'react'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultSummary, type SummaryFigure } from '@/components/calculator/ResultSummary'
import { GrowthChart } from '@/components/charts/lazy'
import { CHART_PANEL } from '@/components/charts/theme'
import { RangeBars } from '@/components/charts/RangeBars'
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
import { BestOffers } from '@/components/calculator/BestOffers'
import { getInvestmentConfig } from '@/features/calculators/investment/estimator/config'
import { InvestmentEstimator } from './InvestmentEstimator'

export interface InvestmentCalculatorProps {
  country: CountryConfig
  initial: InvestmentSchema
  header: ReactNode
  related: ReactNode
}

/** Fields the calculator opens with empty (NaN): the user types their own numbers. */
const START = { initialAmount: Number.NaN, contribution: Number.NaN, annualReturn: Number.NaN }

/**
 * Countries with an estimator config (the US for now) get the config-driven
 * estimator; the others keep the classic calculator below.
 */
export function InvestmentCalculator(props: InvestmentCalculatorProps) {
  const config = getInvestmentConfig(props.country.code)
  return config ? (
    <InvestmentEstimator country={props.country} config={config} header={props.header} related={props.related} />
  ) : (
    <ClassicInvestmentCalculator {...props} />
  )
}

function ClassicInvestmentCalculator({ country, initial, header, related }: InvestmentCalculatorProps) {
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
          <>
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
          </>
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
        <div className={CHART_PANEL}>
          <GrowthChart
            points={result.series.points}
            currency={result.currency}
            periodsPerYear={FREQUENCY_PER_YEAR[committed.contributionFrequency]}
          />
        </div>
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
