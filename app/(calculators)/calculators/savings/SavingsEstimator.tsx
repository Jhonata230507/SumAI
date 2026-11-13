'use client'

import { useId, useMemo, useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultCard } from '@/components/calculator/ResultCard'
import { BestOffers } from '@/components/calculator/BestOffers'
import { GrowthChart } from '@/components/charts/lazy'
import { CHART_PANEL } from '@/components/charts/theme'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { InfoTip } from '@/components/common/InfoTip'
import { OptionalTag } from '@/components/common/OptionalTag'
import { PercentageInput } from '@/components/common/PercentageInput'
import { Segmented } from '@/components/common/Segmented'
import { TermInput } from '@/components/common/TermInput'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  estimateSavings,
  type SavingsEstimateInput,
  type SavingsMode,
  type YearMonth,
} from '@/features/calculators/savings/estimator/calculate'
import {
  PERIODS_PER_YEAR,
  type RateBasis,
  type SavingsCountryConfig,
  type SavingsFrequency,
} from '@/features/calculators/savings/estimator/config'
import { useI18n } from '@/lib/i18n/client'
import { formatMonths, formatPercent } from '@/lib/utils/format-number'
import { cn } from '@/lib/utils/cn'
import type { CountryConfig } from '@/types/country'

export interface SavingsEstimatorProps {
  country: CountryConfig
  config: SavingsCountryConfig
  header: ReactNode
  related: ReactNode
}

const MODES: SavingsMode[] = ['contribution', 'time', 'balance']
const COMPOUNDING_KEYS: Record<number, 'daily' | 'monthly' | 'quarterly' | 'annually'> = {
  365: 'daily',
  12: 'monthly',
  4: 'quarterly',
  1: 'annually',
}

function blankInput(config: SavingsCountryConfig, mode: SavingsMode = 'contribution'): SavingsEstimateInput {
  return {
    mode,
    initialBalance: null,
    goal: null,
    contribution: null,
    frequency: config.defaultFrequency,
    durationMonths: null,
    rate: null,
    basis: config.defaultBasis,
    compoundsPerYear: config.defaultCompounding,
    inflationRate: null,
    goalInTodaysDollars: false,
    taxRate: null,
    startDate: null,
  }
}

/** Inputs hold NaN for an empty field; the model holds null. */
const toField = (value: number | null) => value ?? Number.NaN
const fromField = (value: number) => (Number.isFinite(value) ? value : null)

/**
 * The savings estimator for countries with a config (see
 * features/calculators/savings/estimator). Three questions: how much to save
 * for a goal, how long it takes, or what a plan grows into. Everything shown
 * comes from `estimateSavings`; this component collects inputs and formats
 * results. Changing the question starts from an empty form.
 */
export function SavingsEstimator({ country, config, header, related }: SavingsEstimatorProps) {
  const { t, locale } = useI18n()
  const s = t.savings
  const e = s.estimator
  const u = s.us
  const [input, setInput] = useState<SavingsEstimateInput>(() => blankInput(config))
  const [estimatesOpen, setEstimatesOpen] = useState(false)
  const panelId = useId()

  const change = (patch: Partial<SavingsEstimateInput>) => setInput((previous) => ({ ...previous, ...patch }))
  const estimate = useMemo(() => estimateSavings(config, input), [config, input])
  const { figures } = estimate

  // Display only: rounding happens here, never in the calculation.
  const money = useMemo(() => {
    const format = new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.currency })
    return (value: number) => format.format(value)
  }, [config.locale, config.currency])
  const pct = (value: number, decimals = 2) => formatPercent(value, config.locale, decimals)
  const example = (value: number) => new Intl.NumberFormat(config.locale).format(value)
  const duration = (months: number) => (months < 12 ? t.common.months(months) : formatMonths(months, locale))
  const monthYear = (date: YearMonth) =>
    new Intl.DateTimeFormat(config.locale, { month: 'short', year: 'numeric' }).format(new Date(date.year, date.month - 1))

  const mode = input.mode
  const frequencyLabel = u.frequencies[input.frequency]
  const goalOptional = mode === 'balance'
  const startValue = input.startDate
    ? `${input.startDate.year}-${String(input.startDate.month).padStart(2, '0')}`
    : ''

  // Every question has the same slots, so the form keeps one size: "How long?" has no
  // duration (it is the answer), and the start date, which turns that answer into a date, takes its place.
  const startDateField = (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="start">{e.startDate}</Label>
          <InfoTip content={e.startDateHint} id="start-hint" />
        </div>
        <OptionalTag />
      </div>
      <Input
        id="start"
        type="month"
        aria-describedby="start-hint"
        value={startValue}
        className="tabular-nums [color-scheme:dark]"
        onChange={(event) => {
          const [y, m] = event.target.value.split('-').map(Number)
          change({ startDate: y && m ? { year: y, month: m } : null })
        }}
      />
    </div>
  )

  const frequencySelect = (
    <Select
      id="frequency"
      value={input.frequency}
      options={config.frequencies.map((frequency) => ({ value: frequency, label: u.frequencies[frequency] }))}
      onChange={(event) => change({ frequency: event.target.value as SavingsFrequency })}
    />
  )

  return (
    <CalculatorLayout
      ready={figures !== null || estimate.unreachable}
      // The form box keeps the height it opens with: results appearing never resize
      // it, and fields that would make it taller (the estimates) scroll inside it.
      scrollableForm={figures !== null || estimatesOpen}
      header={header}
      related={related}
      form={
        <CalculatorForm
          onReset={() => {
            setInput(blankInput(config))
            setEstimatesOpen(false)
          }}
        >
          <div className="space-y-1.5">
            <p className="text-sm font-medium leading-snug">{e.findOut}</p>
            <Segmented
              label={e.findOut}
              value={mode}
              options={MODES.map((option) => ({ value: option, label: e.modes[option] }))}
              // A new question starts from an empty form.
              onChange={(next) => {
                if (next === mode) return
                setInput(blankInput(config, next))
                setEstimatesOpen(false)
              }}
            />
          </div>

          <CurrencyInput
            id="initial"
            label={u.initialBalance}
            optional
            currency={config.currency}
            value={toField(input.initialBalance)}
            placeholder={example(2_000)}
            onChange={(v) => change({ initialBalance: fromField(v) })}
          />

          <CurrencyInput
            id="goal"
            label={u.goal}
            optional={goalOptional}
            hint={goalOptional ? e.goalOptionalHint : undefined}
            currency={config.currency}
            value={toField(input.goal)}
            placeholder={example(20_000)}
            onChange={(v) => change({ goal: fromField(v) })}
          />

          {/* The contribution and how often it goes in; when finding the contribution, only how often. */}
          {mode === 'contribution' ? (
            // The same height as the contribution row it stands in for (a label beside a tag is a pixel taller).
            <div className="min-h-[65.25px] space-y-1.5">
              <Label htmlFor="frequency">{u.frequency}</Label>
              {frequencySelect}
            </div>
          ) : (
            <div className="space-y-1.5">
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
                  placeholder={example(300)}
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

          {mode === 'time' ? (
            // The height of the duration field it replaces, whose label row carries the Years/Months switch.
            <div className="min-h-[70.5px]">{startDateField}</div>
          ) : (
            <TermInput
              id="duration"
              label={u.duration}
              months={toField(input.durationMonths)}
              min={config.duration.minMonths}
              max={config.duration.maxMonths}
              placeholder={String(config.duration.exampleMonths / 12)}
              onChange={(months) => change({ durationMonths: fromField(months) })}
            />
          )}

          <PercentageInput
            id="rate"
            label={e.rate}
            optional
            value={toField(input.rate)}
            placeholder={(config.estimates.apy * 100).toFixed(2)}
            hint={e.rateHint[input.basis](pct(config.estimates.apy))}
            adornment={
              <Segmented
                label={e.basis}
                size="sm"
                value={input.basis}
                options={(['apy', 'apr'] as const).map((basis) => ({ value: basis, label: e.bases[basis] }))}
                onChange={(basis: RateBasis) => change({ basis })}
              />
            }
            onChange={(v) => change({ rate: fromField(v) })}
          />

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
            {/* Only an APR compounds on a schedule; an APY already includes it. */}
            {input.basis === 'apr' && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="compounding">{s.compounding}</Label>
                  <InfoTip content={e.compoundingHint} id="compounding-hint" />
                </div>
                <Select
                  id="compounding"
                  aria-describedby="compounding-hint"
                  value={String(input.compoundsPerYear)}
                  options={config.compounding.map((k) => ({
                    value: String(k),
                    label: s.compoundingOptions[COMPOUNDING_KEYS[k] ?? 'monthly'],
                  }))}
                  onChange={(event) => change({ compoundsPerYear: Number(event.target.value) })}
                />
              </div>
            )}

            <div className="space-y-3">
              <PercentageInput
                id="inflation"
                label={u.inflation}
                optional
                value={toField(input.inflationRate)}
                placeholder={(config.estimates.inflation * 100).toFixed(2)}
                hint={u.inflationNote(pct(config.estimates.inflation))}
                onChange={(v) => change({ inflationRate: fromField(v) })}
              />
              <Toggle
                id={`${panelId}-today`}
                label={e.todaysDollars}
                hint={e.todaysDollarsHint}
                checked={input.goalInTodaysDollars}
                onChange={(goalInTodaysDollars) => change({ goalInTodaysDollars })}
              />
            </div>

            <PercentageInput
              id="tax"
              label={e.tax}
              optional
              value={toField(input.taxRate)}
              placeholder="0.00"
              hint={e.taxHint}
              onChange={(v) => change({ taxRate: fromField(v) })}
            />

            {/* "How long?" shows it above, in the duration slot. */}
            {mode !== 'time' && startDateField}
          </div>
        </CalculatorForm>
      }
      results={
        // One live region: screen readers hear the new figures as inputs change.
        <div aria-live="polite" className="flex flex-1 flex-col gap-6 [&>*:last-child]:flex-1">
          {!figures ? (
            <Card>
              <CardContent className="p-5">
                <p className="rounded-md bg-amber-400/10 px-3 py-2 text-xs text-amber-200">{e.unreachable}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {mode === 'contribution' && (
                <ResultCard
                  emphasis="primary"
                  label={u.needed(frequencyLabel)}
                  value={money(figures.contribution)}
                  detail={[
                    s.toReach(money(figures.goal ?? 0), duration(figures.months)),
                    input.goalInTodaysDollars && figures.goalTarget !== null ? e.neededFuture(money(figures.goalTarget)) : null,
                  ]
                    .filter(Boolean)
                    .join('. ')}
                />
              )}
              {mode === 'time' && (
                <ResultCard
                  emphasis="primary"
                  label={e.time}
                  value={figures.periods === 0 ? e.immediate : duration(figures.months)}
                  detail={
                    figures.periods === 0
                      ? e.immediateDetail
                      : [
                          figures.contribution > 0 ? e.timeDetail(money(figures.contribution), frequencyLabel) : e.timeNoContribution,
                          figures.endDate ? e.reachedOn(monthYear(figures.endDate)) : null,
                        ]
                          .filter(Boolean)
                          .join(' ')
                  }
                />
              )}
              {mode === 'balance' && (
                <ResultCard
                  emphasis="primary"
                  label={s.balanceAfter(duration(figures.months))}
                  value={money(figures.finalBalance)}
                  detail={figures.endDate ? e.endsOn(monthYear(figures.endDate)) : undefined}
                />
              )}

              <Card>
                <CardContent className="space-y-4 p-5">
                  <dl className="grid gap-5 sm:grid-cols-2">
                    {mode !== 'balance' && <Figure label={e.endingBalance} value={money(figures.finalBalance)} />}
                    <Figure label={s.youDeposit} value={money(figures.totalDeposited)} />
                    <Figure
                      label={s.interestEarned}
                      value={money(figures.interestEarned)}
                      hint={(input.taxRate ?? 0) > 0 ? e.interestAfterTaxHint : undefined}
                    />
                    {mode === 'balance' && (
                      <Figure label={e.inTodaysMoney} value={money(figures.realBalance)} hint={e.inTodaysMoneyHint} />
                    )}
                    {/* The goal against inflation: raised to future dollars, or brought back to today's. */}
                    {figures.goal !== null && input.goalInTodaysDollars && figures.goalTarget !== null ? (
                      <Figure label={e.goalFuture} value={money(figures.goalTarget)} hint={e.goalFutureHint} />
                    ) : figures.goalToday !== null ? (
                      <Figure label={u.goalToday} value={money(figures.goalToday)} hint={u.goalTodayHint} />
                    ) : (
                      <Figure label={e.netYield} value={pct(estimate.netYield)} hint={e.netYieldHint} />
                    )}
                  </dl>

                  {figures.alreadyThere && mode === 'contribution' && (
                    <Note tone="good">{e.alreadyThere}</Note>
                  )}
                  {mode === 'balance' && figures.onTrack !== null && (
                    <Note tone={figures.onTrack ? 'good' : 'warning'}>
                      {figures.onTrack
                        ? u.onTrack(money(figures.gap))
                        : u.short(money(-figures.gap)) + (figures.monthsToGoal ? u.reachIn(duration(figures.monthsToGoal)) : '')}
                    </Note>
                  )}
                </CardContent>
              </Card>

              {/* Last in the column: it takes the height left beside the form. */}
              {figures.points.length > 0 && (
                <div className={cn(CHART_PANEL, 'flex flex-col')}>
                  <GrowthChart
                    fill
                    className="flex-1"
                    points={figures.points}
                    currency={config.currency}
                    periodsPerYear={PERIODS_PER_YEAR[input.frequency]}
                    caption={s.chartCaption}
                  />
                </div>
              )}
            </>
          )}
        </div>
      }
      assistant={
        <BestOffers variant="sidebar" category="savings" country={country} amount={figures?.finalBalance ?? 0} />
      }
    />
  )
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

function Note({ children, tone }: { children: ReactNode; tone: 'good' | 'warning' }) {
  return (
    <p
      className={cn(
        'rounded-md px-3 py-2 text-xs',
        tone === 'good' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-200',
      )}
    >
      {children}
    </p>
  )
}

/** An on/off switch with its label and tooltip; keyboard operable. */
function Toggle({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string
  label: string
  hint: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium leading-snug" id={id}>
          {label}
        </p>
        <InfoTip content={hint} />
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          checked ? 'bg-white' : 'bg-muted',
        )}
      >
        <span
          className={cn(
            'absolute top-1 h-4 w-4 rounded-full transition-all',
            checked ? 'left-5 bg-black' : 'left-1 bg-muted-foreground',
          )}
        />
      </button>
    </div>
  )
}
