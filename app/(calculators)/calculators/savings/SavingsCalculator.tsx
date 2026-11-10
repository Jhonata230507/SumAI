'use client'

import { useMemo, type ReactNode } from 'react'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultSummary, type SummaryFigure } from '@/components/calculator/ResultSummary'
import { GrowthChart } from '@/components/charts/lazy'
import { CHART_PANEL } from '@/components/charts/theme'
import { AIAnalysis } from '@/components/ai/AIAnalysis'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { RateInput } from '@/components/common/RateInput'
import { Label } from '@/components/ui/label'
import { TermInput } from '@/components/common/TermInput'
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
import { BestOffers } from '@/components/calculator/BestOffers'
import { getBenchmarks } from '@/lib/countries'
import { UsSavingsFields } from './UsSavingsFields'

export interface SavingsCalculatorProps {
  country: CountryConfig
  initial: SavingsSchema
  header: ReactNode
  related: ReactNode
}

const COMPOUNDING = [
  { value: 365, key: 'daily' },
  { value: 12, key: 'monthly' },
  { value: 4, key: 'quarterly' },
  { value: 1, key: 'annually' },
] as const

/** Fields the calculator opens with empty (NaN): the user types their own numbers. */
const START = { initialAmount: Number.NaN, deposit: Number.NaN, annualRate: Number.NaN, months: Number.NaN }
/** The starting balance may stay empty: that means starting from zero. */
const FALLBACK = { initialAmount: 0 }
/** The goal, emptied when switching to "reach a goal", must then be filled. */
const REQUIRED: 'targetAmount'[] = ['targetAmount']

/** US: one goal-based flow. Balance, goal and duration are typed; the rest falls back. */
const US = getBenchmarks('us')
const START_US = {
  mode: 'target' as const,
  initialAmount: Number.NaN,
  targetAmount: Number.NaN,
  deposit: Number.NaN,
  months: Number.NaN,
  annualRate: Number.NaN,
  inflationRate: Number.NaN,
}
const FALLBACK_US = { deposit: 0, annualRate: US.savingsHighYield, inflationRate: US.inflation }

export function SavingsCalculator({ country, initial, header, related }: SavingsCalculatorProps) {
  const { t } = useI18n()
  const isUs = country.code === 'us'
  const { input, committed, errors, result, set, ready, update, reset } = useCalculator(
    savingsSchema,
    calculateSavings,
    initial,
    isUs
      ? { start: START_US, fallback: FALLBACK_US, required: REQUIRED }
      : { start: START, fallback: FALLBACK, required: REQUIRED },
  )

  const locale = country.locale
  const duration = (months: number) => (months < 12 ? t.common.months(months) : formatMonths(months, locale))
  const targeting = committed.mode === 'target'
  // Reaching a goal: the plan is saving the required amount — the chart, totals
  // and recommendations follow that, not a deposit the user never typed.
  // US: with a contribution typed, the plan is that contribution; without one, the one needed.
  const usesOwnDeposit = isUs && committed.deposit > 0
  const plan = useMemo(
    () =>
      targeting && !usesOwnDeposit
        ? calculateSavings({ ...committed, mode: 'project', deposit: result.requiredDeposit ?? 0 })
        : result,
    [targeting, usesOwnDeposit, committed, result],
  )

  // US: whether the typed contribution reaches the goal, and the goal after inflation.
  const goal = committed.targetAmount ?? 0
  const years = committed.months / 12
  const goalToday = goal / (1 + (committed.inflationRate ?? 0)) ** years
  const usStatus = !usesOwnDeposit
    ? t.savings.us.addContribution
    : result.reachesTarget
      ? t.savings.us.onTrack(formatCurrency(result.finalBalance - goal, result.currency))
      : t.savings.us.short(formatCurrency(goal - result.finalBalance, result.currency)) +
        (result.monthsToTarget ? t.savings.us.reachIn(duration(result.monthsToTarget)) : '')
  const usFigures: SummaryFigure[] = [
    {
      key: 'requiredDeposit',
      label: t.savings.us.needed(t.savings.us.frequencies[committed.depositFrequency as 'monthly']),
      value: result.requiredDeposit ?? 0,
      format: 'currency',
      emphasis: 'primary',
      detail: t.savings.toReach(formatCurrency(goal, result.currency), duration(committed.months)),
    },
    { key: 'projected', label: t.savings.us.projected, value: plan.finalBalance, format: 'currency' },
    { key: 'totalInterest', label: t.savings.interestEarned, value: plan.totalInterest, format: 'currency' },
    {
      key: 'goalToday',
      label: t.savings.us.goalToday,
      value: goalToday,
      format: 'currency',
      hint: t.savings.us.goalTodayHint,
    },
  ]

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
        { key: 'totalDeposited', label: t.savings.youDeposit, value: plan.totalDeposited, format: 'currency' },
        { key: 'totalInterest', label: t.savings.interestEarned, value: plan.totalInterest, format: 'currency' },
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
      ready={ready}
      // US: the first six fields show; compounding and inflation scroll inside the form box.
      scrollableForm={isUs}
      formPeek={isUs ? 6 : undefined}
      header={header}
      related={related}
      form={
        <CalculatorForm onReset={reset} error={isUs ? undefined : errors.targetAmount}>
          {isUs ? (
            <UsSavingsFields
              country={country}
              input={input}
              errors={errors}
              defaultRate={US.savingsHighYield}
              defaultInflation={US.inflation}
              onChange={set}
            />
          ) : (
            <>
              <Tabs
                defaultValue={input.mode}
                value={input.mode}
                onValueChange={(mode) =>
                  update({
                    ...input,
                    mode: mode as SavingsSchema['mode'],
                    // Reaching a goal asks for the goal and solves for the deposit; projecting
                    // asks for the deposit. Each mode starts its own field empty.
                    targetAmount: mode === 'target' ? Number.NaN : null,
                    deposit: mode === 'target' ? 0 : Number.NaN,
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
                  value={input.targetAmount ?? Number.NaN}
                  onChange={(v) => set('targetAmount', v)}
                />
              )}

              <CurrencyInput
                id="initial"
                label={t.savings.startingBalance}
                currency={country.currency}
                value={input.initialAmount}
                optional
                hint={t.savings.startingBalanceHint}
                onChange={(v) => set('initialAmount', v)}
              />
              {/* Reaching a goal solves for the deposit, so it is not asked for. */}
              {input.mode !== 'target' && (
                <CurrencyInput
                  id="deposit"
                  label={t.savings.monthlyDeposit}
                  currency={country.currency}
                  value={input.deposit}
                  onChange={(v) => set('deposit', v)}
                />
              )}

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
                <TermInput
                  id="horizon"
                  label={t.savings.timeFrame}
                  months={input.months}
                  onChange={(months) => set('months', months)}
                />
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
            </>
          )}
        </CalculatorForm>
      }
      results={
        <>
          {/* The headline figure on its own, the rest in one card. */}
          <ResultSummary
            figures={(isUs ? usFigures : figures).slice(0, 1)}
            currency={result.currency}
            locale={locale}
          />
          <ResultSummary
            combined
            figures={(isUs ? usFigures : figures).slice(1)}
            currency={result.currency}
            locale={locale}
            footer={
              isUs && (
                <p
                  className={
                    usesOwnDeposit && result.reachesTarget
                      ? 'rounded-md bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300'
                      : usesOwnDeposit
                        ? 'rounded-md bg-amber-400/10 px-3 py-2 text-xs text-amber-200'
                        : 'rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground'
                  }
                >
                  {usStatus}
                </p>
              )
            }
          />
          {/* The growth chart sits with the figures, filling the column beside the form. */}
          <div className={CHART_PANEL}>
            <GrowthChart
              points={plan.series.points}
              currency={result.currency}
              periodsPerYear={FREQUENCY_PER_YEAR[committed.depositFrequency]}
              caption={t.savings.chartCaption}
            />
          </div>
        </>
      }
      // Recommended credits beside the numbers; the AI explanation is set aside for now.
      assistant={<BestOffers variant="sidebar" category="savings" country={country} amount={plan.finalBalance} />}
      explanation={
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
      }
      detail={<></>}
    />
  )
}
