'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultSummary, type SummaryFigure } from '@/components/calculator/ResultSummary'
import { getBenchmarks } from '@/lib/countries'
import { MortgageSystems } from '@/components/calculator/MortgageSystems'
import { calculateMortgageSystems, type MortgageSystemId } from '@/features/calculators/mortgage/systems'
import { WhatIfPanel } from '@/components/calculator/WhatIfPanel'
import { AmortizationChart } from '@/components/charts/AmortizationChart'
import { AIAnalysis } from '@/components/ai/AIAnalysis'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { RateInput } from '@/components/common/RateInput'
import { TermInput } from '@/components/common/TermInput'
import { DebtToIncome } from '@/components/calculator/DebtToIncome'
import { PaymentBreakdown } from '@/components/charts/PaymentBreakdown'
import { Card, CardContent } from '@/components/ui/card'
import { estimateHomeInsurance, estimatePropertyTax, estimateRate } from '@/features/calculators/mortgage/us'
import { UsMortgageFields, type Touched } from './UsMortgageFields'
import { formatCurrency } from '@/lib/utils/format-currency'
import { calculateMortgage } from '@/features/calculators/mortgage/calculation'
import { mortgageSchema, type MortgageSchema } from '@/features/calculators/mortgage/schema'
import { buildMortgageScenarios } from '@/features/calculators/mortgage/scenarios'
import { useCalculator } from '@/features/calculators/use-calculator'
import { useWhatIf } from '@/features/calculators/use-what-if'
import { formatPercent } from '@/lib/utils/format-number'
import { useI18n } from '@/lib/i18n/client'
import type { CountryConfig } from '@/types/country'

export interface MortgageCalculatorProps {
  country: CountryConfig
  initial: MortgageSchema
  header: ReactNode
  related: ReactNode
}

export function MortgageCalculator({ country, initial, header, related }: MortgageCalculatorProps) {
  const { t } = useI18n()
  const { input, committed, errors, result, set, update, reset, formError } = useCalculator(
    mortgageSchema,
    calculateMortgage,
    initial,
  )

  // "What if" options: one at a time, compared against the numbers they replace.
  const whatIfState = useWhatIf(committed, buildMortgageScenarios, update)
  const { scenarios } = whatIfState
  const baseResult = useMemo(() => calculateMortgage(whatIfState.base), [whatIfState.base])

  // US: the rate, property tax and insurance follow their estimates (market
  // average by loan type and credit; the ZIP's state; the price) until the user
  // types over them.
  const isUs = country.code === 'us'
  const untouched: Touched = { rate: false, tax: false, insurance: false }
  const [touched, setTouched] = useState<Touched>(untouched)
  const [estimatesOpen, setEstimatesOpen] = useState(false)
  const withEstimates = (next: MortgageSchema, marks: Touched): MortgageSchema => {
    if (!isUs) return next
    return {
      ...next,
      annualRate: marks.rate
        ? next.annualRate
        : estimateRate({
            benchmarks: getBenchmarks(country.code),
            termMonths: next.termMonths,
            loanType: next.loanType ?? 'conventional',
            creditBand: next.creditBand ?? null,
          }),
      propertyTaxAnnual: marks.tax
        ? next.propertyTaxAnnual
        : estimatePropertyTax(next.homePrice, next.zip ?? '').annual,
      homeInsuranceAnnual: marks.insurance ? next.homeInsuranceAnnual : estimateHomeInsurance(next.homePrice),
    }
  }
  const change = <K extends keyof MortgageSchema>(key: K, value: MortgageSchema[K]) => {
    const marks = {
      rate: touched.rate || key === 'annualRate',
      tax: touched.tax || key === 'propertyTaxAnnual',
      insurance: touched.insurance || key === 'homeInsuranceAnnual',
    }
    setTouched(marks)
    update(withEstimates({ ...input, [key]: value }, marks))
  }
  const restart = () => {
    setTouched(untouched)
    reset()
  }

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
      detail: isUs ? t.mortgage.us.totalDetail : t.mortgage.totalMonthlyDetail,
    },
    {
      key: 'loanAmount',
      label: t.mortgage.borrowed,
      value: result.loanAmount,
      format: 'currency',
      detail:
        result.upfrontFee > 0 && committed.loanType
          ? t.mortgage.us.upfrontIncluded(
              formatCurrency(result.upfrontFee, result.currency),
              t.mortgage.us.fees[committed.loanType],
            )
          : undefined,
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
  // How long mortgage insurance lasts depends on the US loan type.
  const miNotice = !result.requiresMortgageInsurance
    ? null
    : result.insuranceDuration?.kind === 'life'
      ? committed.loanType === 'usda'
        ? t.mortgage.us.usdaLife
        : t.mortgage.us.fhaLife
      : result.insuranceDuration?.kind === 'months'
        ? t.mortgage.us.fhaYears
        : t.mortgage.miNotice(formatPercent(isUs ? 0.2 : country.rules.minDownPaymentRatio, country.locale, 0), miYears)

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
      onApply={(id) => {
        const scenario = scenarios.find((s) => s.id === id)
        // A scenario that sets the rate makes it the user's, so estimates stop moving it.
        if (scenario && id !== whatIfState.selectedId && scenario.input.annualRate !== whatIfState.base.annualRate)
          setTouched({ ...touched, rate: true })
        whatIfState.toggle(id)
      }}
    />
  )

  return (
    <CalculatorLayout
      // US: with the optional fields open the form is long; it scrolls instead of stretching the results.
      scrollableForm={isUs && estimatesOpen}
      header={header}
      related={related}
      form={
        <CalculatorForm onReset={restart} error={formError}>
          {isUs ? (
            <>
              <UsMortgageFields
                country={country}
                input={input}
                errors={errors}
                touched={touched}
                minDownRatio={result.minDownRatio}
                onChange={change}
                open={estimatesOpen}
                onToggle={setEstimatesOpen}
              />
            </>
          ) : (
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
                hint={t.mortgage.ofPrice(
                  formatPercent(input.downPayment / Math.max(input.homePrice, 1), country.locale, 1),
                )}
                onChange={(v) => set('downPayment', v)}
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

              {/* Property tax, home insurance and HOA/administración fields are hidden for
              now; the page starts them at 0 so no cost the user cannot see or edit is
              added to the payment. */}

              <CurrencyInput
                id="extra"
                label={t.mortgage.extra}
                currency={country.currency}
                value={input.extraPayment}
                onChange={(v) => set('extraPayment', v)}
              />
            </>
          )}
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

          {/* US: how lenders would size the loan, and what the monthly bill is made of. */}
          {isUs && <DebtToIncome value={result.debtToIncome} locale={country.locale} />}
          {isUs && (
            <Card>
              <CardContent className="p-5">
                <PaymentBreakdown
                  currency={result.currency}
                  segments={[
                    {
                      key: 'pi',
                      label: t.mortgage.segments.principalAndInterest,
                      value: result.monthly.principalAndInterest,
                    },
                    { key: 'tax', label: t.mortgage.segments.propertyTax, value: result.monthly.propertyTax },
                    { key: 'insurance', label: t.mortgage.segments.homeInsurance, value: result.monthly.insurance },
                    {
                      key: 'mi',
                      label: t.mortgage.segments.mortgageInsurance,
                      value: result.monthly.mortgageInsurance,
                    },
                    { key: 'hoa', label: t.mortgage.segments.hoa, value: result.monthly.hoa },
                  ]}
                />
              </CardContent>
            </Card>
          )}

        </>
      }
      assistant={
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
