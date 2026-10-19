'use client'

import type { ReactNode } from 'react'
import { formatPercent } from '@/lib/utils/format-number'
import { getBenchmarks } from '@/lib/countries'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultSummary, type SummaryFigure } from '@/components/calculator/ResultSummary'
import { AmortizationChart } from '@/components/charts/lazy'
import { PaymentBreakdown } from '@/components/charts/PaymentBreakdown'
import { AIAnalysis } from '@/components/ai/AIAnalysis'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { PercentageInput } from '@/components/common/PercentageInput'
import { RateInput } from '@/components/common/RateInput'
import { Card, CardContent } from '@/components/ui/card'
import { TermInput } from '@/components/common/TermInput'
import { calculateCarLoan } from '@/features/calculators/car-loan/calculation'
import { carLoanSchema, type CarLoanSchema } from '@/features/calculators/car-loan/schema'
import { useCalculator } from '@/features/calculators/use-calculator'
import { formatCurrency } from '@/lib/utils/format-currency'
import { useI18n } from '@/lib/i18n/client'
import type { CountryConfig } from '@/types/country'
import { BestOffers } from '@/components/calculator/BestOffers'

export interface CarLoanCalculatorProps {
  country: CountryConfig
  initial: CarLoanSchema
  header: ReactNode
  related: ReactNode
}

/** Fields the calculator opens with empty (NaN): the user types their own numbers. */
const START = { vehiclePrice: Number.NaN, downPayment: Number.NaN, annualRate: Number.NaN, termMonths: Number.NaN }

/** The rate may be left empty: the market's average new-car loan rate is used then. */
const RATE_FALLBACK = {
  co: { annualRate: getBenchmarks('co').carLoanNew },
  us: { annualRate: getBenchmarks('us').carLoanNew },
  ca: { annualRate: getBenchmarks('ca').carLoanNew },
}

export function CarLoanCalculator({ country, initial, header, related }: CarLoanCalculatorProps) {
  const { t } = useI18n()
  const { input, committed, errors, result, set, ready, reset } = useCalculator(
    carLoanSchema,
    calculateCarLoan,
    initial,
    { start: START, fallback: RATE_FALLBACK[country.code] },
  )

  const underwater = result.initialLoanToValue > 1

  const isCo = country.code === 'co'
  // Used when the rate is left empty, quoted the way this market quotes rates.
  const averageRate = RATE_FALLBACK[country.code].annualRate
  const rateBasis = country.rules.quotesEffectiveAnnualRate ? t.rateInput.effectiveAnnual : t.products.rateBasis.nominal

  const figures: SummaryFigure[] = [
    {
      key: 'monthlyPayment',
      label: country.terminology.monthlyPayment,
      value: result.monthlyPayment,
      format: 'currency',
      emphasis: 'primary',
    },
    { key: 'amountFinanced', label: t.carLoan.amountFinanced, value: result.amountFinanced, format: 'currency' },
    { key: 'totalInterest', label: t.carLoan.totalInterest, value: result.totalInterest, format: 'currency' },
    ...(isCo
      ? []
      : [{ key: 'salesTax', label: t.carLoan.salesTax, value: result.salesTax, format: 'currency' as const }]),
  ]

  return (
    <CalculatorLayout
      ready={ready}
      header={header}
      related={related}
      form={
        <CalculatorForm onReset={reset}>
          <CurrencyInput
            id="price"
            label={t.carLoan.vehiclePrice}
            currency={country.currency}
            value={input.vehiclePrice}
            error={errors.vehiclePrice}
            onChange={(v) => set('vehiclePrice', v)}
          />
          <CurrencyInput
            id="down"
            label={t.carLoan.cashDown}
            currency={country.currency}
            value={input.downPayment}
            onChange={(v) => set('downPayment', v)}
          />

          {/* Colombia: no trade-in, tax or fee fields; the page starts them at 0 so no
              cost the user cannot see or edit is added to the payment. */}
          {!isCo && (
            <div className="space-y-4">
              <CurrencyInput
                id="trade-value"
                optional
                label={t.carLoan.tradeInValue}
                currency={country.currency}
                value={input.tradeInValue}
                onChange={(v) => set('tradeInValue', v)}
              />
              <CurrencyInput
                id="trade-owed"
                optional
                label={t.carLoan.tradeInOwed}
                currency={country.currency}
                value={input.tradeInOwed}
                onChange={(v) => set('tradeInOwed', v)}
              />
            </div>
          )}

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

          {/* Car loans are usually quoted in months, so the field opens in months. */}
          <TermInput
            id="term"
            label={country.terminology.loanTerm}
            months={input.termMonths}
            defaultUnit="months"
            max={120}
            onChange={(months) => set('termMonths', months)}
          />

          {!isCo && (
            <div className="space-y-4">
              <PercentageInput
                id="tax"
                optional
                label={t.carLoan.salesTax}
                value={input.salesTaxRate}
                onChange={(v) => set('salesTaxRate', v)}
              />
              <CurrencyInput
                id="fees"
                optional
                label={t.carLoan.fees}
                currency={country.currency}
                value={input.feesAndRegistration}
                onChange={(v) => set('feesAndRegistration', v)}
              />
            </div>
          )}
        </CalculatorForm>
      }
      results={
        <>
          {isCo ? (
            <>
              {/* Colombia: the payment on its own, the other figures in one card. */}
              <ResultSummary currency={result.currency} locale={country.locale} figures={figures.slice(0, 1)} />
              <ResultSummary combined currency={result.currency} locale={country.locale} figures={figures.slice(1)} />
            </>
          ) : (
            <ResultSummary currency={result.currency} locale={country.locale} figures={figures} />
          )}

          <Card>
            <CardContent className="space-y-4 p-5">
              <PaymentBreakdown
                currency={result.currency}
                segments={[
                  { key: 'price', label: t.carLoan.segments.vehicle, value: committed.vehiclePrice },
                  { key: 'tax', label: t.carLoan.segments.salesTax, value: result.salesTax },
                  { key: 'fees', label: t.carLoan.segments.fees, value: committed.feesAndRegistration },
                  { key: 'interest', label: t.carLoan.segments.interest, value: result.totalInterest },
                ]}
              />

              {result.tradeInEquity < 0 && (
                <p className="rounded-md bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                  {t.carLoan.negativeEquity(formatCurrency(-result.tradeInEquity, result.currency))}
                </p>
              )}

              {underwater && (
                <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  {t.carLoan.underwater}
                  {result.breakEvenPeriod ? t.carLoan.catchUp(result.breakEvenPeriod) : t.carLoan.noCatchUp}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      }
      // Recommended credits beside the numbers; the AI explanation is set aside for now.
      assistant={
        <BestOffers
          variant="sidebar"
          category="car-loan"
          country={country}
          amount={result.amountFinanced}
          termMonths={committed.termMonths}
        />
      }
      explanation={
        <AIAnalysis
          context={{
            calculatorId: 'car-loan',
            countryCode: country.code,
            currency: result.currency,
            inputs: { ...committed },
            results: {
              monthlyPayment: result.monthlyPayment,
              amountFinanced: result.amountFinanced,
              totalInterest: result.totalInterest,
              tradeInEquity: result.tradeInEquity,
              initialLoanToValue: result.initialLoanToValue,
              breakEvenPeriod: result.breakEvenPeriod ?? 'never',
            },
          }}
        />
      }
      detail={
        <>
          <AmortizationChart rows={result.schedule.rows} currency={result.currency} />
        </>
      }
    />
  )
}
