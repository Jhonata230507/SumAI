'use client'

import type { ReactNode } from 'react'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultSummary } from '@/components/calculator/ResultSummary'
import { AmortizationChart } from '@/components/charts/AmortizationChart'
import { PaymentBreakdown } from '@/components/charts/PaymentBreakdown'
import { AIAnalysis } from '@/components/ai/AIAnalysis'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { PercentageInput } from '@/components/common/PercentageInput'
import { RateInput } from '@/components/common/RateInput'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { calculateCarLoan } from '@/features/calculators/car-loan/calculation'
import { carLoanSchema, type CarLoanSchema } from '@/features/calculators/car-loan/schema'
import { useCalculator } from '@/features/calculators/use-calculator'
import { formatCurrency } from '@/lib/utils/format-currency'
import { useI18n } from '@/lib/i18n/client'
import type { CountryConfig } from '@/types/country'

export interface CarLoanCalculatorProps {
  country: CountryConfig
  initial: CarLoanSchema
  header: ReactNode
  related: ReactNode
}

const TERMS = [24, 36, 48, 60, 72, 84]

export function CarLoanCalculator({ country, initial, header, related }: CarLoanCalculatorProps) {
  const { t } = useI18n()
  const { input, committed, errors, result, set, reset } = useCalculator(
    carLoanSchema,
    calculateCarLoan,
    initial,
  )

  const underwater = result.initialLoanToValue > 1

  return (
    <CalculatorLayout
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

          <div className="grid grid-cols-2 gap-3">
            <CurrencyInput
              id="trade-value"
              label={t.carLoan.tradeInValue}
              currency={country.currency}
              value={input.tradeInValue}
              onChange={(v) => set('tradeInValue', v)}
            />
            <CurrencyInput
              id="trade-owed"
              label={t.carLoan.tradeInOwed}
              currency={country.currency}
              value={input.tradeInOwed}
              onChange={(v) => set('tradeInOwed', v)}
            />
          </div>

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
              options={TERMS.map((months) => ({ value: String(months), label: t.carLoan.termOption(months) }))}
              onChange={(e) => set('termMonths', Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <PercentageInput
              id="tax"
              label={t.carLoan.salesTax}
              value={input.salesTaxRate}
              onChange={(v) => set('salesTaxRate', v)}
            />
            <CurrencyInput
              id="fees"
              label={t.carLoan.fees}
              currency={country.currency}
              value={input.feesAndRegistration}
              onChange={(v) => set('feesAndRegistration', v)}
            />
          </div>
        </CalculatorForm>
      }
      results={
        <>
          <ResultSummary
            currency={result.currency}
            locale={country.locale}
            figures={[
              {
                key: 'monthlyPayment',
                label: country.terminology.monthlyPayment,
                value: result.monthlyPayment,
                format: 'currency',
                emphasis: 'primary',
              },
              { key: 'amountFinanced', label: t.carLoan.amountFinanced, value: result.amountFinanced, format: 'currency' },
              { key: 'totalInterest', label: t.carLoan.totalInterest, value: result.totalInterest, format: 'currency' },
              { key: 'salesTax', label: t.carLoan.salesTax, value: result.salesTax, format: 'currency' },
            ]}
          />

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
                  {result.breakEvenPeriod
                    ? t.carLoan.catchUp(result.breakEvenPeriod)
                    : t.carLoan.noCatchUp}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      }
      detail={
        <>
          <AmortizationChart rows={result.schedule.rows} currency={result.currency} />
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
        </>
      }
    />
  )
}
