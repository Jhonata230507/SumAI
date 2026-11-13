'use client'

import { useId, useMemo, useState, type ReactNode } from 'react'
import { ChevronRight, Sparkles } from 'lucide-react'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultCard } from '@/components/calculator/ResultCard'
import { BestOffers } from '@/components/calculator/BestOffers'
import { GrowthChart } from '@/components/charts/lazy'
import { RangeBars } from '@/components/charts/RangeBars'
import { CHART_PANEL } from '@/components/charts/theme'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { InfoTip } from '@/components/common/InfoTip'
import { OptionalTag } from '@/components/common/OptionalTag'
import { PercentageInput } from '@/components/common/PercentageInput'
import { Segmented } from '@/components/common/Segmented'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { yearsToDouble } from '@/features/calculators/investment/calculation'
import {
  estimateInvestment,
  resolveTaxRate,
  type InvestmentEstimateInput,
} from '@/features/calculators/investment/estimator/calculate'
import {
  PERIODS_PER_YEAR,
  type AccountType,
  type ContributionFrequency,
  type InvestmentCountryConfig,
} from '@/features/calculators/investment/estimator/config'
import { useI18n } from '@/lib/i18n/client'
import { formatNumber, formatPercent } from '@/lib/utils/format-number'
import { cn } from '@/lib/utils/cn'
import type { CountryConfig } from '@/types/country'

export interface InvestmentEstimatorProps {
  country: CountryConfig
  config: InvestmentCountryConfig
  header: ReactNode
  related: ReactNode
}

function blankInput(config: InvestmentCountryConfig, mode: InvestmentEstimateInput['mode'] = 'grow'): InvestmentEstimateInput {
  return {
    mode,
    initialAmount: null,
    contribution: null,
    frequency: config.defaultFrequency,
    years: null,
    annualReturn: null,
    targetAmount: null,
    feeRate: null,
    inflationRate: null,
    accountType: 'unspecified',
    taxRate: null,
    contributionIncrease: null,
    timing: 'end',
  }
}

/** Inputs hold NaN for an empty field; the model holds null. */
const toField = (value: number | null) => value ?? Number.NaN
const fromField = (value: number) => (Number.isFinite(value) ? value : null)

/**
 * The investment estimator for countries with a config (see
 * features/calculators/investment/estimator). Two modes: what a plan grows
 * into, or the contribution a target takes. Everything shown comes from
 * `estimateInvestment`; this component collects inputs and formats results.
 * Changing the mode starts from an empty form.
 */
export function InvestmentEstimator({ country, config, header, related }: InvestmentEstimatorProps) {
  const { t } = useI18n()
  const e = t.investment.estimator
  const u = t.investment.us
  const [input, setInput] = useState<InvestmentEstimateInput>(() => blankInput(config))
  const [estimatesOpen, setEstimatesOpen] = useState(false)
  const panelId = useId()

  const change = (patch: Partial<InvestmentEstimateInput>) => setInput((previous) => ({ ...previous, ...patch }))
  const estimate = useMemo(() => estimateInvestment(config, input), [config, input])
  const { figures } = estimate

  // Display only: rounding happens here, never in the calculation.
  const money = useMemo(() => {
    const format = new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.currency })
    return (value: number) => format.format(value)
  }, [config.locale, config.currency])
  const compact = useMemo(() => {
    const format = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    })
    return (value: number) => format.format(value)
  }, [config.locale, config.currency])
  const pct = (value: number, decimals = 2) => formatPercent(value, config.locale, decimals)
  const example = (value: number) => new Intl.NumberFormat(config.locale).format(value)

  const goalMode = input.mode === 'goal'
  const frequencyLabel = t.savings.us.frequencies[input.frequency]
  const years = input.years ?? config.years.example
  const tax = resolveTaxRate(config, input.accountType, null)
  const taxedAccount = input.accountType === 'taxable' || input.accountType === 'deferred'

  const fillExample = () => {
    const sample = config.example
    setInput({
      ...blankInput(config, input.mode),
      initialAmount: sample.initialAmount,
      years: sample.years,
      ...(goalMode ? { targetAmount: sample.targetAmount } : { contribution: sample.contribution }),
    })
  }

  const frequencySelect = (
    <Select
      id="frequency"
      value={input.frequency}
      options={config.frequencies.map((frequency) => ({ value: frequency, label: t.savings.us.frequencies[frequency] }))}
      onChange={(event) => change({ frequency: event.target.value as ContributionFrequency })}
    />
  )

  return (
    <CalculatorLayout
      ready={figures !== null}
      // The form box keeps the height it opens with: results appearing never resize
      // it, and fields that would make it taller (the estimates) scroll inside it.
      scrollableForm={figures !== null || estimatesOpen}
      emptyAction={
        <Button type="button" variant="outline" className="gap-2" onClick={fillExample}>
          <Sparkles className="h-4 w-4" aria-hidden />
          {e.example}
        </Button>
      }
      header={header}
      related={related}
      form={
        <CalculatorForm
          onReset={() => {
            setInput(blankInput(config))
            setEstimatesOpen(false)
          }}
        >
          <Segmented
            label={e.modeLabel}
            value={input.mode}
            options={(['grow', 'goal'] as const).map((mode) => ({ value: mode, label: e.modes[mode] }))}
            // A new mode starts from an empty form.
            onChange={(mode) => {
              if (mode === input.mode) return
              setInput(blankInput(config, mode))
              setEstimatesOpen(false)
            }}
          />

          <CurrencyInput
            id="initial"
            label={u.initial}
            optional
            currency={config.currency}
            value={toField(input.initialAmount)}
            placeholder={example(config.example.initialAmount)}
            onChange={(v) => change({ initialAmount: fromField(v) })}
          />

          {/* The contribution and how often it goes in. In goal mode the contribution is the answer. */}
          {goalMode ? (
            <div className="space-y-1.5">
              <Label htmlFor="frequency">{u.frequency}</Label>
              {frequencySelect}
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* One label over the amount and its frequency, on a single line. */}
              <div className="flex items-end justify-between gap-2">
                <Label htmlFor="contribution">{u.contribution}</Label>
                <OptionalTag />
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] gap-3">
                <CurrencyInput
                  id="contribution"
                  label={u.contribution}
                  labelHidden
                  currency={config.currency}
                  value={toField(input.contribution)}
                  placeholder={example(config.example.contribution)}
                  onChange={(v) => change({ contribution: fromField(v) })}
                />
                <div>
                  <Label htmlFor="frequency" className="sr-only">
                    {u.frequency}
                  </Label>
                  {frequencySelect}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="years">{u.duration}</Label>
            <div className="relative">
              <Input
                id="years"
                type="number"
                inputMode="numeric"
                min={config.years.min}
                max={config.years.max}
                step={1}
                placeholder={String(config.years.example)}
                value={input.years ?? ''}
                className="pr-14 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                onChange={(event) => {
                  const raw = event.target.value.trim()
                  const typed = Math.round(Number(raw))
                  change({
                    years: raw === '' || !Number.isFinite(typed) ? null : Math.min(Math.max(typed, config.years.min), config.years.max),
                  })
                }}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {u.years}
              </span>
            </div>
          </div>

          <PercentageInput
            id="return"
            label={u.expectedReturn}
            optional
            value={toField(input.annualReturn)}
            placeholder={(config.estimates.annualReturn * 100).toFixed(2)}
            hint={e.returnHint(pct(config.estimates.annualReturn))}
            onChange={(v) => change({ annualReturn: fromField(v) })}
          />

          {goalMode && (
            <CurrencyInput
              id="target"
              label={e.target}
              currency={config.currency}
              value={toField(input.targetAmount)}
              placeholder={example(config.example.targetAmount)}
              hint={e.targetHint}
              onChange={(v) => change({ targetAmount: fromField(v) })}
            />
          )}

          <button
            type="button"
            aria-expanded={estimatesOpen}
            aria-controls={panelId}
            onClick={() => setEstimatesOpen((open) => !open)}
            className="group flex items-center gap-1.5 rounded-md text-sm font-medium text-primary transition-colors hover:text-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight
              className={cn('h-4 w-4 transition-transform duration-200', estimatesOpen && 'rotate-90')}
              aria-hidden
            />
            {t.mortgage.us.improveEstimates}
          </button>

          <div id={panelId} hidden={!estimatesOpen} className="space-y-4">
            <PercentageInput
              id="fees"
              label={u.fees}
              optional
              step={0.01}
              value={toField(input.feeRate)}
              placeholder="0.00"
              hint={`${t.investment.feesHint} ${u.feesNote}`}
              onChange={(v) => change({ feeRate: fromField(v) })}
            />

            <PercentageInput
              id="inflation"
              label={u.inflation}
              optional
              value={toField(input.inflationRate)}
              placeholder={(config.estimates.inflation * 100).toFixed(2)}
              hint={u.inflationNote(pct(config.estimates.inflation))}
              onChange={(v) => change({ inflationRate: fromField(v) })}
            />

            <div className="space-y-1.5">
              <div className="flex items-end justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="account">{e.accountType}</Label>
                  <InfoTip content={e.accountHint} id="account-hint" />
                </div>
                <OptionalTag />
              </div>
              <Select
                id="account"
                aria-describedby="account-hint"
                value={input.accountType}
                options={config.accountTypes.map((type) => ({ value: type, label: e.accountTypes[type] }))}
                onChange={(event) => change({ accountType: event.target.value as AccountType, taxRate: null })}
              />
              {input.accountType === 'free' && <p className="text-xs text-muted-foreground">{e.freeNote}</p>}
            </div>

            {taxedAccount && tax.rate !== null && (
              <PercentageInput
                id="tax"
                label={e.taxRate[input.accountType as 'taxable' | 'deferred']}
                optional
                value={toField(input.taxRate)}
                placeholder={(tax.rate * 100).toFixed(2)}
                hint={e.taxHint[input.accountType as 'taxable' | 'deferred'](pct(tax.rate, 0))}
                onChange={(v) => change({ taxRate: fromField(v) })}
              />
            )}

            <PercentageInput
              id="increase"
              label={e.increase}
              optional
              step={0.5}
              value={toField(input.contributionIncrease)}
              placeholder="0.00"
              hint={e.increaseHint}
              onChange={(v) => change({ contributionIncrease: fromField(v) })}
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium leading-snug">{e.timing}</p>
                  <InfoTip content={e.timingHint} />
                </div>
                <Segmented
                  label={e.timing}
                  size="sm"
                  value={input.timing}
                  options={(['start', 'end'] as const).map((timing) => ({ value: timing, label: e.timings[timing] }))}
                  onChange={(timing) => change({ timing })}
                />
              </div>
            </div>
          </div>
        </CalculatorForm>
      }
      results={
        figures && (
          // One live region: screen readers hear the new figures as inputs change.
          <div aria-live="polite" className="flex flex-1 flex-col gap-6 [&>*:last-child]:flex-1">
            {goalMode ? (
              <ResultCard
                emphasis="primary"
                label={e.needed(frequencyLabel)}
                value={money(figures.contribution)}
                detail={[
                  e.neededDetail(money(input.targetAmount ?? 0), years),
                  (input.contributionIncrease ?? 0) > 0 ? e.neededRising(pct(input.contributionIncrease ?? 0, 1)) : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            ) : (
              <ResultCard
                emphasis="primary"
                label={t.investment.balanceAfter(years)}
                value={money(figures.finalBalance)}
                detail={t.investment.multiple(
                  Math.round((figures.finalBalance / Math.max(figures.totalContributed, 1)) * 100) / 100,
                )}
              />
            )}

            <Card>
              <CardContent className="space-y-4 p-5">
                <dl className="grid gap-5 sm:grid-cols-2">
                  {goalMode ? (
                    <>
                      <Figure label={e.targetLabel} value={money(figures.finalBalance)} />
                      <Figure label={e.putIn} value={money(figures.totalContributed)} />
                      <Figure label={e.growthDoes} value={money(figures.growth)} hint={e.growthHint} />
                      {figures.afterTax !== null ? (
                        <Figure label={e.afterTax} value={money(figures.afterTax)} hint={afterTaxHint()} />
                      ) : (
                        <Figure label={e.targetToday} value={money(figures.realBalance)} hint={t.investment.todaysMoneyHint} />
                      )}
                    </>
                  ) : (
                    <>
                      {figures.afterTax !== null ? (
                        <Figure label={e.afterTax} value={money(figures.afterTax)} hint={afterTaxHint()} />
                      ) : (
                        <Figure label={e.growth} value={money(figures.growth)} hint={e.growthHint} />
                      )}
                      <Figure label={t.investment.todaysMoney} value={money(figures.realBalance)} hint={t.investment.todaysMoneyHint} />
                      <Figure label={t.investment.contributed} value={money(figures.totalContributed)} />
                      <Figure label={t.investment.lostToFees} value={money(figures.feesCost)} />
                    </>
                  )}
                </dl>
                {figures.alreadyThere && (
                  <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{e.alreadyThere}</p>
                )}
              </CardContent>
            </Card>

            {/* Fills the rest of the column: the plan at a weaker and a stronger return. */}
            <Card className="flex flex-col">
              <CardContent className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">{t.investment.rangeTitle}</p>
                  <InfoTip content={t.investment.rangeIntro} />
                </div>
                <RangeBars
                  locale={config.locale}
                  format={compact}
                  items={[
                    { key: 'weaker', label: t.investment.weaker, value: figures.range.weaker },
                    { key: 'expected', label: t.investment.expected, value: figures.range.expected },
                    { key: 'stronger', label: t.investment.stronger, value: figures.range.stronger },
                  ]}
                />
                {Number.isFinite(yearsToDouble(estimate.annualReturn - (input.feeRate ?? 0))) && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    {t.investment.doubling(
                      formatNumber(yearsToDouble(estimate.annualReturn - (input.feeRate ?? 0)), config.locale, 1),
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )
      }
      detail={
        figures && (
          <div className={CHART_PANEL}>
            <GrowthChart
              points={figures.points}
              currency={config.currency}
              periodsPerYear={PERIODS_PER_YEAR[input.frequency]}
            />
          </div>
        )
      }
      // Recommended accounts beside the numbers.
      assistant={
        <BestOffers variant="sidebar" category="savings" country={country} amount={figures?.finalBalance ?? 0} />
      }
    />
  )

  function afterTaxHint() {
    if (!figures) return undefined
    if (input.accountType === 'free') return e.afterTaxHint.free
    if (input.accountType === 'taxable') return e.afterTaxHint.taxable(money(figures.tax ?? 0))
    if (input.accountType === 'deferred') return e.afterTaxHint.deferred(money(figures.tax ?? 0))
    return undefined
  }
}

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {label}
        {hint && <InfoTip content={hint} />}
      </dt>
      <dd className="mt-1 text-xl tabular-nums tracking-tight">{value}</dd>
    </div>
  )
}
