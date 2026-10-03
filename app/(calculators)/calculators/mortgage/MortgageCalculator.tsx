'use client'

import { useMemo, type ReactNode } from 'react'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultSummary, type SummaryFigure } from '@/components/calculator/ResultSummary'
import { WhatIfPanel } from '@/components/calculator/WhatIfPanel'
import { AmortizationChart } from '@/components/charts/AmortizationChart'
import { PaymentBreakdown } from '@/components/charts/PaymentBreakdown'
import { AIAnalysis } from '@/components/ai/AIAnalysis'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { RateInput } from '@/components/common/RateInput'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { calculateMortgage } from '@/features/calculators/mortgage/calculation'
import { mortgageSchema, type MortgageSchema } from '@/features/calculators/mortgage/schema'
import { buildMortgageScenarios } from '@/features/calculators/mortgage/scenarios'
import { useCalculator } from '@/features/calculators/use-calculator'
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

  const scenarios = useMemo(() => buildMortgageScenarios(committed), [committed])

  const termOptions = country.rules.commonLoanTermsMonths.map((months) => ({
    value: String(months),
    label: t.common.years(months / 12),
  }))

  const figures: SummaryFigure[] = [
    {
      key: 'monthlyTotal',
      label: t.mortgage.totalMonthly,
      value: result.monthly.total,
      format: 'currency',
      emphasis: 'primary',
      detail: t.mortgage.totalMonthlyDetail,
    },
    { key: 'loanAmount', label: t.mortgage.borrowed, value: result.loanAmount, format: 'currency' },
    { key: 'totalInterest', label: t.mortgage.totalInterest, value: result.totalInterest, format: 'currency' },
    {
      key: 'payoffPeriods',
      label: t.mortgage.paidOffIn,
      value: result.payoffPeriods,
      format: 'months',
      detail: result.periodsSaved > 0 ? t.mortgage.monthsEarly(result.periodsSaved) : undefined,
    },
  ]

  const miYears = result.mortgageInsuranceEndsPeriod
    ? Math.ceil(result.mortgageInsuranceEndsPeriod / 12)
    : null

  return (
    <CalculatorLayout
      header={header}
      related={related}
      form={
        <CalculatorForm onReset={reset} error={formError}>
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

          <div className="space-y-1.5">
            <Label htmlFor="term">{country.terminology.loanTerm}</Label>
            <Select
              id="term"
              value={String(input.termMonths)}
              options={termOptions}
              onChange={(e) => set('termMonths', Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CurrencyInput
              id="tax"
              label={t.mortgage.propertyTax}
              currency={country.currency}
              value={input.propertyTaxAnnual}
              onChange={(v) => set('propertyTaxAnnual', v)}
            />
            <CurrencyInput
              id="insurance"
              label={t.mortgage.insurance}
              currency={country.currency}
              value={input.homeInsuranceAnnual}
              onChange={(v) => set('homeInsuranceAnnual', v)}
            />
          </div>

          <CurrencyInput
            id="hoa"
            label={t.mortgage.hoa}
            currency={country.currency}
            value={input.hoaMonthly}
            onChange={(v) => set('hoaMonthly', v)}
          />

          <CurrencyInput
            id="extra"
            label={t.mortgage.extra}
            currency={country.currency}
            value={input.extraPayment}
            onChange={(v) => set('extraPayment', v)}
          />
        </CalculatorForm>
      }
      results={
        <>
          <ResultSummary figures={figures} currency={result.currency} locale={country.locale} />

          <Card>
            <CardContent className="p-5">
              <PaymentBreakdown
                currency={result.currency}
                segments={[
                  { key: 'pi', label: t.mortgage.segments.principalAndInterest, value: result.monthly.principalAndInterest },
                  { key: 'tax', label: t.mortgage.segments.propertyTax, value: result.monthly.propertyTax },
                  { key: 'insurance', label: t.mortgage.segments.homeInsurance, value: result.monthly.insurance },
                  { key: 'mi', label: t.mortgage.segments.mortgageInsurance, value: result.monthly.mortgageInsurance },
                  { key: 'hoa', label: t.mortgage.segments.hoa, value: result.monthly.hoa },
                ]}
              />

              {result.requiresMortgageInsurance && (
                <p className="mt-4 rounded-md bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                  {t.mortgage.miNotice(
                    formatPercent(country.rules.minDownPaymentRatio, country.locale, 0),
                    miYears,
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          <WhatIfPanel
            currency={result.currency}
            options={scenarios.map((scenario) => ({
              id: scenario.id,
              label: scenario.label,
              description: scenario.description,
              costDelta: scenario.result.totalInterest - result.totalInterest,
              paymentDelta: scenario.result.monthly.total - result.monthly.total,
              periodsDelta: scenario.result.payoffPeriods - result.payoffPeriods,
            }))}
            onApply={(id) => {
              const scenario = scenarios.find((s) => s.id === id)
              if (scenario) update(scenario.input as MortgageSchema)
            }}
          />
        </>
      }
      detail={
        <>
          <AmortizationChart rows={result.schedule.rows} currency={result.currency} />
          <AIAnalysis
            context={{
              calculatorId: 'mortgage',
              countryCode: country.code,
              currency: result.currency,
              inputs: { ...committed },
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
        </>
      }
    />
  )
}
