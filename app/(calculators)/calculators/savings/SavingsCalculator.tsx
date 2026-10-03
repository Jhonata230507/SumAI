'use client'

import type { ReactNode } from 'react'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultSummary, type SummaryFigure } from '@/components/calculator/ResultSummary'
import { GrowthChart } from '@/components/charts/GrowthChart'
import { AIAnalysis } from '@/components/ai/AIAnalysis'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { RateInput } from '@/components/common/RateInput'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { calculateSavings } from '@/features/calculators/savings/calculation'
import { savingsSchema, type SavingsSchema } from '@/features/calculators/savings/schema'
import { useCalculator } from '@/features/calculators/use-calculator'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatMonths } from '@/lib/utils/format-number'
import { useI18n } from '@/lib/i18n/client'
import { FREQUENCY_PER_YEAR } from '@/types/common'
import type { CountryConfig } from '@/types/country'

export interface SavingsCalculatorProps {
  country: CountryConfig
  initial: SavingsSchema
  header: ReactNode
  related: ReactNode
}

const HORIZONS = [6, 12, 24, 36, 60, 120]
const COMPOUNDING = [
  { value: 365, key: 'daily' },
  { value: 12, key: 'monthly' },
  { value: 4, key: 'quarterly' },
  { value: 1, key: 'annually' },
] as const

export function SavingsCalculator({ country, initial, header, related }: SavingsCalculatorProps) {
  const { t } = useI18n()
  const { input, committed, errors, result, set, update, reset } = useCalculator(
    savingsSchema,
    calculateSavings,
    initial,
  )

  const locale = country.locale
  const duration = (months: number) =>
    months < 12 ? t.common.months(months) : formatMonths(months, locale)
  const targeting = committed.mode === 'target'

  const figures: SummaryFigure[] = targeting
    ? [
        {
          key: 'requiredDeposit',
          label: t.savings.depositNeeded,
          value: result.requiredDeposit ?? 0,
          format: 'currency',
          emphasis: 'primary',
          detail: t.savings.toReach(
            formatCurrency(committed.targetAmount ?? 0, result.currency),
            duration(committed.months),
          ),
        },
        {
          key: 'monthsToTarget',
          label: t.savings.atCurrentDeposit,
          value: result.monthsToTarget ?? Infinity,
          format: 'months',
        },
        { key: 'finalBalance', label: t.savings.projectedBalance, value: result.finalBalance, format: 'currency' },
        {
          key: 'effectiveAnnualYield',
          label: t.savings.apy,
          value: result.effectiveAnnualYield,
          format: 'percent',
        },
      ]
    : [
        {
          key: 'finalBalance',
          label: t.savings.balanceAfter(duration(committed.months)),
          value: result.finalBalance,
          format: 'currency',
          emphasis: 'primary',
        },
        { key: 'totalDeposited', label: t.savings.youDeposit, value: result.totalDeposited, format: 'currency' },
        { key: 'totalInterest', label: t.savings.interestEarned, value: result.totalInterest, format: 'currency' },
        {
          key: 'effectiveAnnualYield',
          label: t.savings.apy,
          value: result.effectiveAnnualYield,
          format: 'percent',
          hint: t.savings.apyHint,
        },
      ]

  return (
    <CalculatorLayout
      header={header}
      related={related}
      form={
        <CalculatorForm onReset={reset} error={errors.targetAmount}>
          <Tabs
            defaultValue={input.mode}
            value={input.mode}
            onValueChange={(mode) =>
              update({
                ...input,
                mode: mode as SavingsSchema['mode'],
                targetAmount:
                  mode === 'target' ? (input.targetAmount ?? input.initialAmount * 10) : null,
              })
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="project">{t.savings.project}</TabsTrigger>
              <TabsTrigger value="target">{t.savings.target}</TabsTrigger>
            </TabsList>
          </Tabs>

          {input.mode === 'target' && (
            <CurrencyInput
              id="target"
              label={t.savings.targetAmount}
              currency={country.currency}
              value={input.targetAmount ?? 0}
              onChange={(v) => set('targetAmount', v)}
            />
          )}

          <CurrencyInput
            id="initial"
            label={t.savings.startingBalance}
            currency={country.currency}
            value={input.initialAmount}
            onChange={(v) => set('initialAmount', v)}
          />
          <CurrencyInput
            id="deposit"
            label={t.savings.monthlyDeposit}
            currency={country.currency}
            value={input.deposit}
            onChange={(v) => set('deposit', v)}
          />

          <RateInput
            id="rate"
            country={country}
            label={t.savings.interestRate}
            value={input.annualRate}
            error={errors.annualRate}
            onChange={(v) => set('annualRate', v)}
          />

          {/* An E.A. quote already includes compounding, so the compounding
              choice only appears where savings rates are quoted nominal. */}
          <div className={country.rules.consumerRatesEffective ? undefined : 'grid grid-cols-2 gap-3'}>
            <div className="space-y-1.5">
              <Label htmlFor="horizon">{t.savings.timeFrame}</Label>
              <Select
                id="horizon"
                value={String(input.months)}
                options={HORIZONS.map((months) => ({ value: String(months), label: duration(months) }))}
                onChange={(e) => set('months', Number(e.target.value))}
              />
            </div>
            {!country.rules.consumerRatesEffective && (
              <div className="space-y-1.5">
                <Label htmlFor="compounding">{t.savings.compounding}</Label>
                <Select
                  id="compounding"
                  value={String(input.compoundsPerYear)}
                  options={COMPOUNDING.map((option) => ({
                    value: String(option.value),
                    label: t.savings.compoundingOptions[option.key],
                  }))}
                  onChange={(e) => set('compoundsPerYear', Number(e.target.value))}
                />
              </div>
            )}
          </div>
        </CalculatorForm>
      }
      results={<ResultSummary figures={figures} currency={result.currency} locale={locale} />}
      detail={
        <>
          <GrowthChart
            points={result.series.points}
            currency={result.currency}
            periodsPerYear={FREQUENCY_PER_YEAR[committed.depositFrequency]}
            caption={t.savings.chartCaption}
          />
          <AIAnalysis
            context={{
              calculatorId: 'savings',
              countryCode: country.code,
              currency: result.currency,
              inputs: { ...committed, targetAmount: committed.targetAmount ?? 'none' },
              results: {
                finalBalance: result.finalBalance,
                totalDeposited: result.totalDeposited,
                totalInterest: result.totalInterest,
                effectiveAnnualYield: result.effectiveAnnualYield,
                requiredDeposit: result.requiredDeposit ?? 'n/a',
                reachesTarget: String(result.reachesTarget),
              },
            }}
          />
        </>
      }
    />
  )
}
