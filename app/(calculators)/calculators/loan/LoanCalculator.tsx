'use client'

import { useMemo, type ReactNode } from 'react'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultSummary, type SummaryFigure } from '@/components/calculator/ResultSummary'
import { WhatIfPanel } from '@/components/calculator/WhatIfPanel'
import { AmortizationChart } from '@/components/charts/AmortizationChart'
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

export interface LoanCalculatorProps {
  country: CountryConfig
  initial: LoanSchema
  header: ReactNode
  related: ReactNode
}

const FREQUENCIES: Frequency[] = ['monthly', 'biweekly', 'weekly']

export function LoanCalculator({ country, initial, header, related }: LoanCalculatorProps) {
  const { t } = useI18n()
  const { input, committed, errors, result, set, update, reset } = useCalculator(loanSchema, calculateLoan, initial)

  // "What if" options: one at a time, compared against the numbers they replace.
  const whatIfState = useWhatIf(committed, buildLoanScenarios, update)
  const { scenarios } = whatIfState
  const baseResult = useMemo(() => calculateLoan(whatIfState.base), [whatIfState.base])

  const whatIfs = scenarios.map((scenario) => {
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
      header={header}
      related={related}
      form={
        <CalculatorForm onReset={reset}>
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
            label={t.loan.extra}
            hint={t.loan.extraHint}
            currency={country.currency}
            value={input.extraPayment}
            onChange={(v) => set('extraPayment', v)}
          />

          <CurrencyInput
            id="fee"
            label={t.loan.fee}
            currency={country.currency}
            value={input.originationFee}
            onChange={(v) => set('originationFee', v)}
          />
        </CalculatorForm>
      }
      results={
        <>
          {country.code === 'co' ? (
            <>
              {/* Colombia: the payment on its own, the rest of the figures in one card. */}
              <ResultSummary figures={figures.slice(0, 1)} currency={result.currency} locale={country.locale} />
              <ResultSummary combined figures={figures.slice(1)} currency={result.currency} locale={country.locale} />
            </>
          ) : (
            <ResultSummary figures={figures} currency={result.currency} locale={country.locale} />
          )}
          <WhatIfPanel
            options={whatIfs}
            currency={result.currency}
            selectedId={whatIfState.selectedId}
            onApply={whatIfState.toggle}
          />
        </>
      }
      assistant={
        <AIAnalysis
          context={{
            calculatorId: 'loan',
            countryCode: country.code,
            currency: result.currency,
            inputs: { ...committed },
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
          <AmortizationChart
            rows={result.schedule.rows}
            currency={result.currency}
            periodsPerYear={FREQUENCY_PER_YEAR[committed.frequency]}
          />
        </>
      }
    />
  )
}
