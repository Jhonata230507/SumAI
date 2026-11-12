'use client'

import { useMemo, type ReactNode, useState } from 'react'
import { formatPercent } from '@/lib/utils/format-number'
import { getBenchmarks } from '@/lib/countries'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultSummary, type SummaryFigure } from '@/components/calculator/ResultSummary'
import { WhatIfPanel } from '@/components/calculator/WhatIfPanel'
import { AmortizationChart, PayoffPlanner } from '@/components/charts/lazy'
import { PaymentBreakdown } from '@/components/charts/PaymentBreakdown'
import { CHART_PANEL } from '@/components/charts/theme'
import { cn } from '@/lib/utils/cn'
import { AIAnalysis } from '@/components/ai/AIAnalysis'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { RateInput } from '@/components/common/RateInput'
import { Label } from '@/components/ui/label'
import { TermInput } from '@/components/common/TermInput'
import { Select } from '@/components/ui/select'
import { calculateLoan } from '@/features/calculators/loan/calculation'
import { loanSchema, type LoanSchema } from '@/features/calculators/loan/schema'
import { buildLoanScenarios, scenarioSavings } from '@/features/calculators/loan/scenarios'
import { useCalculator } from '@/features/calculators/use-calculator'
import { useWhatIf } from '@/features/calculators/use-what-if'
import { useI18n } from '@/lib/i18n/client'
import { FREQUENCY_PER_YEAR, type Frequency } from '@/types/common'
import type { CountryConfig } from '@/types/country'
import { BestOffers } from '@/components/calculator/BestOffers'
import { UsLoanFields } from './UsLoanFields'
import { DebtToIncome } from '@/components/calculator/DebtToIncome'
import { estimatePersonalLoanRate } from '@/features/calculators/loan/us'
import { bandToScore } from '@/features/calculators/mortgage/us'

export interface LoanCalculatorProps {
  country: CountryConfig
  initial: LoanSchema
  header: ReactNode
  related: ReactNode
}

const FREQUENCIES: Frequency[] = ['monthly', 'biweekly', 'weekly']

/** Fields the calculator opens with empty (NaN): the user types their own numbers. */
const START = { amount: Number.NaN, annualRate: Number.NaN, termMonths: Number.NaN }

/** The rate may be left empty: the market's average consumer-loan rate is used then. */
const RATE_FALLBACK = {
  co: { annualRate: getBenchmarks('co').personalLoan },
  us: { annualRate: getBenchmarks('us').personalLoan },
  ca: { annualRate: getBenchmarks('ca').personalLoan },
}

/** US: with the rate empty, the estimate follows the credit score when given. */
const US_FALLBACK = (input: LoanSchema) => ({
  annualRate: estimatePersonalLoanRate(getBenchmarks('us'), input.creditBand),
})

export function LoanCalculator({ country, initial, header, related }: LoanCalculatorProps) {
  const { t } = useI18n()
  const isCo = country.code === 'co'
  const isUs = country.code === 'us'
  const [estimatesOpen, setEstimatesOpen] = useState(false)
  // Used when the rate is left empty, quoted the way this market quotes rates.
  const averageRate = RATE_FALLBACK[country.code].annualRate
  const rateBasis = country.rules.quotesEffectiveAnnualRate ? t.rateInput.effectiveAnnual : t.products.rateBasis.nominal
  const { input, committed, errors, result, set, ready, update, reset } = useCalculator(
    loanSchema,
    calculateLoan,
    initial,
    { start: START, fallback: isUs ? US_FALLBACK : RATE_FALLBACK[country.code] },
  )

  // "What if" options: one at a time, compared against the numbers they replace.
  const whatIfState = useWhatIf(committed, buildLoanScenarios, update)
  const { scenarios } = whatIfState
  const baseResult = useMemo(() => calculateLoan(whatIfState.base), [whatIfState.base])

  // US: the payoff planner below covers paying extra, with a slider; the option would repeat it.
  const whatIfs = scenarios.filter((scenario) => !(isUs && scenario.id === 'extra-payment')).map((scenario) => {
    const delta = scenarioSavings(baseResult, scenario.result)
    return {
      id: scenario.id,
      label: scenario.label,
      description: scenario.description,
      costDelta: delta.interestDelta,
      paymentDelta: delta.paymentDelta,
      periodsDelta: delta.periodsDelta,
    }
  })

  const whatIfPanel = (
    <WhatIfPanel
      wide={isUs}
      options={whatIfs}
      currency={result.currency}
      selectedId={whatIfState.selectedId}
      onApply={whatIfState.toggle}
    />
  )

  // US: the rate used while the field is empty, and how lenders would see the loan.
  const estimatedRate = isUs ? estimatePersonalLoanRate(getBenchmarks('us'), input.creditBand) : averageRate
  const monthlyIncome = committed.annualIncome ? committed.annualIncome / 12 : undefined
  const debtToIncome =
    isUs && monthlyIncome
      ? {
          front: result.payment / monthlyIncome,
          back: (result.payment + (committed.monthlyDebts ?? 0)) / monthlyIncome,
          frontLimit: null,
          // A common ceiling lenders apply to all monthly debts.
          backLimit: 0.36,
        }
      : null

  const figures: SummaryFigure[] = [
    {
      key: 'payment',
      label: t.loan.paymentLabels[committed.frequency],
      value: result.payment,
      format: 'currency',
      emphasis: 'primary',
      detail: t.loan.paymentsTotal(result.payoffPeriods),
    },
    { key: 'totalInterest', label: t.loan.totalInterest, value: result.totalInterest, format: 'currency' },
    {
      key: 'totalPaid',
      label: t.loan.totalPaid,
      value: result.totalPaid,
      format: 'currency',
      detail: t.loan.includingFees,
    },
    {
      key: 'effectiveAnnualRate',
      label: t.loan.effectiveRate,
      value: result.effectiveAnnualRate,
      format: 'percent',
      hint: t.loan.effectiveRateHint,
    },
  ]

  if (result.interestSaved > 0) {
    figures.push({
      key: 'interestSaved',
      label: t.loan.interestSaved,
      value: result.interestSaved,
      format: 'currency',
    })
  }

  return (
    <CalculatorLayout
      ready={ready}
      // US: the form box keeps the height it opens with. Results appearing never resize
      // it, and fields that would make it taller (the estimates) scroll inside it.
      scrollableForm={isUs && (estimatesOpen || ready)}
      header={header}
      related={related}
      form={
        <CalculatorForm onReset={reset}>
          {isUs ? (
            <UsLoanFields
              country={country}
              input={input}
              errors={errors}
              estimatedRate={estimatedRate}
              open={estimatesOpen}
              onToggle={setEstimatesOpen}
              onChange={set}
              onPatch={(patch) => update({ ...input, ...patch })}
            />
          ) : (
            <>
              <CurrencyInput
                id="amount"
                label={t.loan.amount}
                currency={country.currency}
                value={input.amount}
                error={errors.amount}
                onChange={(v) => set('amount', v)}
              />

              <RateInput
                id="rate"
                country={country}
                value={input.annualRate}
                error={errors.annualRate}
                onChange={(v) => set('annualRate', v)}
                optional
                fallback={averageRate}
                fallbackNote={t.loan.averageRateNote(`${formatPercent(averageRate, country.locale)} ${rateBasis}`)}
              />

              <TermInput
                id="term"
                label={country.terminology.loanTerm}
                months={input.termMonths}
                onChange={(months) => set('termMonths', months)}
              />

              <div className="space-y-1.5">
                <Label htmlFor="frequency">{t.loan.frequency}</Label>
                <Select
                  id="frequency"
                  value={input.frequency}
                  options={FREQUENCIES.map((value) => ({
                    value,
                    label: t.loan.frequencies[value as keyof typeof t.loan.frequencies],
                  }))}
                  onChange={(e) => set('frequency', e.target.value as Frequency)}
                />
              </div>

              <CurrencyInput
                id="extra"
                optional
                label={t.loan.extra}
                hint={t.loan.extraHint}
                currency={country.currency}
                value={input.extraPayment}
                onChange={(v) => set('extraPayment', v)}
              />

              <CurrencyInput
                id="fee"
                optional
                label={t.loan.fee}
                currency={country.currency}
                value={input.originationFee}
                onChange={(v) => set('originationFee', v)}
              />
            </>
          )}
        </CalculatorForm>
      }
      results={
        <>
          {isCo || isUs ? (
            <>
              {/* The payment on its own, the rest of the figures in one card. */}
              <ResultSummary figures={figures.slice(0, 1)} currency={result.currency} locale={country.locale} />
              <ResultSummary combined figures={figures.slice(1)} currency={result.currency} locale={country.locale} />
            </>
          ) : (
            <ResultSummary figures={figures} currency={result.currency} locale={country.locale} />
          )}
          {/* US: always on view; without an income it asks for one. */}
          {/* US: debt-to-income and what the loan costs in total, side by side; last in the
              column, the pair takes the height left beside the form. */}
          {isUs && (
            <div className="grid gap-6 sm:grid-cols-2">
              <DebtToIncome value={debtToIncome} locale={country.locale} frontLabel={t.loan.dtiLoan} />
              <div className={cn(CHART_PANEL, 'flex flex-col')}>
                <PaymentBreakdown
                  className="flex-1"
                  caption={t.loan.costCaption}
                  currency={result.currency}
                  segments={[
                    { key: 'borrowed', label: t.loan.costBorrowed, value: committed.amount },
                    { key: 'interest', label: t.charts.interest, value: result.totalInterest },
                    { key: 'fee', label: t.loan.fee, value: result.totalFees },
                  ]}
                />
              </div>
            </div>
          )}
          {!isUs && whatIfPanel}
        </>
      }
      // Recommended credits beside the numbers; the AI explanation is set aside for now.
      assistant={
        <BestOffers
          variant="sidebar"
          category="personal-loan"
          country={country}
          amount={committed.amount}
          termMonths={committed.termMonths}
          creditScore={committed.creditBand ? bandToScore(committed.creditBand) : undefined}
          monthlyIncome={monthlyIncome}
          monthlyDebts={monthlyIncome ? (committed.monthlyDebts ?? 0) : undefined}
        />
      }
      explanation={
        <AIAnalysis
          context={{
            calculatorId: 'loan',
            countryCode: country.code,
            currency: result.currency,
            inputs: {
              ...committed,
              creditBand: committed.creditBand ?? 'not given',
              purpose: committed.purpose ?? 'not given',
            },
            results: {
              payment: result.payment,
              totalInterest: result.totalInterest,
              totalPaid: result.totalPaid,
              effectiveAnnualRate: result.effectiveAnnualRate,
              payoffPeriods: result.payoffPeriods,
              costRatio: result.costRatio,
            },
          }}
        />
      }
      detail={
        <>
          {/* US: full width under the three columns, so the form, results and offers end level. */}
          {isUs && whatIfPanel}
          {/* US: what paying a little extra does, with the schedule underneath. */}
          {isUs ? (
            <PayoffPlanner input={committed} payment={result.payment} currency={result.currency} locale={country.locale} />
          ) : (
            <AmortizationChart
              rows={result.schedule.rows}
              currency={result.currency}
              periodsPerYear={FREQUENCY_PER_YEAR[committed.frequency]}
            />
          )}
        </>
      }
    />
  )
}
