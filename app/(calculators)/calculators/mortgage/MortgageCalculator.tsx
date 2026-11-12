'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultSummary, type SummaryFigure } from '@/components/calculator/ResultSummary'
import { getBenchmarks } from '@/lib/countries'
import { calculateMortgageSystems, type MortgageSystemId } from '@/features/calculators/mortgage/systems'
import { WhatIfPanel } from '@/components/calculator/WhatIfPanel'
import { AmortizationChart, MortgageSystems } from '@/components/charts/lazy'
import { AIAnalysis } from '@/components/ai/AIAnalysis'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { RateInput } from '@/components/common/RateInput'
import { TermInput } from '@/components/common/TermInput'
import { getMortgageConfig } from '@/features/calculators/mortgage/estimator/config'
import { MortgageEstimator } from './MortgageEstimator'
import { calculateMortgage } from '@/features/calculators/mortgage/calculation'
import { mortgageSchema, type MortgageSchema } from '@/features/calculators/mortgage/schema'
import { buildMortgageScenarios } from '@/features/calculators/mortgage/scenarios'
import { useCalculator } from '@/features/calculators/use-calculator'
import { useWhatIf } from '@/features/calculators/use-what-if'
import { formatPercent } from '@/lib/utils/format-number'
import { useI18n } from '@/lib/i18n/client'
import type { CountryConfig } from '@/types/country'
import { BestOffers } from '@/components/calculator/BestOffers'

export interface MortgageCalculatorProps {
  country: CountryConfig
  initial: MortgageSchema
  header: ReactNode
  related: ReactNode
}

/** Fields the calculator opens with empty (NaN): the user types their own numbers. */
const START = { homePrice: Number.NaN, downPayment: Number.NaN, annualRate: Number.NaN, termMonths: Number.NaN }

/** Colombia: the rate may be left empty; the average mortgage rate is used then. */
const CO_FALLBACK = { annualRate: getBenchmarks('co').mortgage30Year }

/**
 * Countries with an estimator config (the US for now) get the config-driven
 * estimator; the others keep the classic calculator below.
 */
export function MortgageCalculator(props: MortgageCalculatorProps) {
  const config = getMortgageConfig(props.country.code)
  return config ? (
    <MortgageEstimator country={props.country} config={config} header={props.header} related={props.related} />
  ) : (
    <ClassicMortgageCalculator {...props} />
  )
}

function ClassicMortgageCalculator({ country, initial, header, related }: MortgageCalculatorProps) {
  const { t } = useI18n()
  const { input, committed, errors, result, set, ready, update, reset, formError } = useCalculator(
    mortgageSchema,
    calculateMortgage,
    initial,
    { start: START, fallback: country.code === 'co' ? CO_FALLBACK : undefined },
  )

  // "What if" options: one at a time, compared against the numbers they replace.
  const whatIfState = useWhatIf(committed, buildMortgageScenarios, update)
  const { scenarios } = whatIfState
  const baseResult = useMemo(() => calculateMortgage(whatIfState.base), [whatIfState.base])

  // Colombia: the four local amortization systems. The selected one drives both
  // the systems card and the yearly chart, so the two always show the same loan.
  const benchmarks = getBenchmarks(country.code)
  const uvrRate = benchmarks.mortgageUvr ?? 0.075
  const [system, setSystem] = useState<MortgageSystemId>('fixed-payment-cop')
  const systems = useMemo(
    () =>
      country.code === 'co'
        ? calculateMortgageSystems({
            principal: result.loanAmount,
            termMonths: committed.termMonths,
            pesoRate: committed.annualRate,
            uvrRate,
            inflation: benchmarks.inflation,
            extraPayment: committed.extraPayment,
          })
        : null,
    [
      country.code,
      result.loanAmount,
      committed.termMonths,
      committed.annualRate,
      committed.extraPayment,
      uvrRate,
      benchmarks.inflation,
    ],
  )
  const chartRows = systems?.find((candidate) => candidate.id === system)?.rows ?? result.schedule.rows

  const figures: SummaryFigure[] = [
    {
      key: 'monthlyTotal',
      label: t.mortgage.totalMonthly,
      value: result.monthly.total,
      format: 'currency',
      emphasis: 'primary',
      detail: t.mortgage.totalMonthlyDetail,
    },
    {
      key: 'loanAmount',
      label: t.mortgage.borrowed,
      value: result.loanAmount,
      format: 'currency',
    },
    { key: 'totalInterest', label: t.mortgage.totalInterest, value: result.totalInterest, format: 'currency' },
    {
      key: 'payoffPeriods',
      label: t.mortgage.paidOffIn,
      value: result.payoffPeriods,
      format: 'months',
      detail: result.periodsSaved > 0 ? t.mortgage.monthsEarly(result.periodsSaved) : undefined,
    },
  ]

  const miYears = result.mortgageInsuranceEndsPeriod ? Math.ceil(result.mortgageInsuranceEndsPeriod / 12) : null
  const miNotice = result.requiresMortgageInsurance
    ? t.mortgage.miNotice(formatPercent(country.rules.minDownPaymentRatio, country.locale, 0), miYears)
    : null

  const whatIf = (
    <WhatIfPanel
      wide
      currency={result.currency}
      options={scenarios.map((scenario) => ({
        id: scenario.id,
        label: scenario.label,
        description: scenario.description,
        costDelta: scenario.result.totalInterest - baseResult.totalInterest,
        paymentDelta: scenario.result.monthly.total - baseResult.monthly.total,
        periodsDelta: scenario.result.payoffPeriods - baseResult.payoffPeriods,
      }))}
      selectedId={whatIfState.selectedId}
      onApply={whatIfState.toggle}
    />
  )

  return (
    <CalculatorLayout
      ready={ready}
      header={header}
      related={related}
      form={
        <CalculatorForm onReset={reset} error={formError}>
          <>
            <CurrencyInput
              id="price"
              label={t.mortgage.homePrice}
              currency={country.currency}
              value={input.homePrice}
              error={errors.homePrice}
              onChange={(v) => set('homePrice', v)}
            />

            <CurrencyInput
              id="down"
              label={country.terminology.downPayment}
              currency={country.currency}
              value={input.downPayment}
              error={errors.downPayment}
              note={
                // Only once both numbers are in.
                Number.isFinite(input.downPayment / input.homePrice)
                  ? t.mortgage.ofPrice(
                      formatPercent(input.downPayment / Math.max(input.homePrice, 1), country.locale, 1),
                    )
                  : undefined
              }
              onChange={(v) => set('downPayment', v)}
            />

            <RateInput
              id="rate"
              country={country}
              value={input.annualRate}
              error={errors.annualRate}
              onChange={(v) => set('annualRate', v)}
              {...(country.code === 'co' && {
                optional: true,
                fallback: CO_FALLBACK.annualRate,
                fallbackNote: t.loan.averageRateNote(
                  `${formatPercent(CO_FALLBACK.annualRate, country.locale)} ${t.rateInput.effectiveAnnual}`,
                ),
              })}
            />

            <TermInput
              id="term"
              label={country.terminology.loanTerm}
              months={input.termMonths}
              onChange={(months) => set('termMonths', months)}
            />

            {/* Property tax, home insurance and HOA/administración fields are hidden for
            now; the page starts them at 0 so no cost the user cannot see or edit is
            added to the payment. */}

            <CurrencyInput
              id="extra"
              optional
              label={t.mortgage.extra}
              currency={country.currency}
              value={input.extraPayment}
              onChange={(v) => set('extraPayment', v)}
            />
          </>
        </CalculatorForm>
      }
      results={
        <>
          {/* Colombia: the payment under each of the four local amortization systems takes
              the place of the headline payment (its "cuota fija en pesos" is that same figure).
              Elsewhere: the headline payment. */}
          {country.code !== 'co' && (
            <ResultSummary figures={figures.slice(0, 1)} currency={result.currency} locale={country.locale} />
          )}
          {systems && (
            <MortgageSystems
              systems={systems}
              selected={system}
              onSelect={setSystem}
              currency={result.currency}
              locale={country.locale}
              uvrRate={uvrRate}
              inflation={benchmarks.inflation}
            />
          )}

          {/* Loan amount, total interest and payoff time, in one card. */}
          <ResultSummary
            combined
            figures={figures.slice(1)}
            currency={result.currency}
            locale={country.locale}
            footer={
              miNotice && <p className="rounded-md bg-amber-400/10 px-3 py-2 text-xs text-amber-200">{miNotice}</p>
            }
          />

        </>
      }
      // Recommended credits beside the numbers; the AI explanation is set aside for now.
      assistant={
        <BestOffers
          variant="sidebar"
          category="mortgage"
          country={country}
          amount={result.loanAmount}
          termMonths={committed.termMonths}
        />
      }
      explanation={
        <AIAnalysis
          context={{
            calculatorId: 'mortgage',
            countryCode: country.code,
            currency: result.currency,
            inputs: { ...committed, creditBand: committed.creditBand ?? 'not given' },
            results: {
              monthlyTotal: result.monthly.total,
              principalAndInterest: result.monthly.principalAndInterest,
              loanAmount: result.loanAmount,
              loanToValue: result.loanToValue,
              totalInterest: result.totalInterest,
              requiresMortgageInsurance: String(result.requiresMortgageInsurance),
            },
          }}
        />
      }
      detail={
        <>
          {/* Below the top row, full width, so the columns stay level without empty space. */}
          {whatIf}
          <AmortizationChart rows={chartRows} currency={result.currency} />
        </>
      }
    />
  )
}
