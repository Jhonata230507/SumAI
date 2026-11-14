'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Segmented } from '@/components/common/Segmented'
import { InfoTip } from '@/components/common/InfoTip'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { DebtToIncome } from '@/components/calculator/DebtToIncome'
import { formatCurrency } from '@/lib/utils/format-currency'
import {
  CO_HOUSING,
  HOME_CONDITIONS,
  HOUSING_TYPES,
  checkHousing,
  loanFromPayment,
  visPriceCap,
  type HomeCondition,
  type HousingType,
} from '@/features/calculators/mortgage/co'
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
import { PercentageInput } from '@/components/common/PercentageInput'
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

  // Colombia: from the home value or from the payment, VIS or not, new or used, and
  // household income for the payment-to-income check. Nothing here changes the other countries.
  const isCo = country.code === 'co'
  const c = t.mortgage.co
  const [mode, setMode] = useState<'price' | 'budget'>('price')
  const [housingType, setHousingType] = useState<HousingType>('no-vis')
  const [condition, setCondition] = useState<HomeCondition>('new')
  const [budget, setBudget] = useState(Number.NaN)
  const [monthlyIncome, setMonthlyIncome] = useState(Number.NaN)
  const [monthlyDebts, setMonthlyDebts] = useState(Number.NaN)
  const budgetMode = isCo && mode === 'budget'
  const money = (value: number) => formatCurrency(value, country.currency)

  // Budget mode: the payment buys a loan; the loan plus the down payment is the home value,
  // which drives everything below exactly as a typed value would.
  // The down payment can be typed in money or as a share of the value; the calculation
  // always gets money, worked out from the percentage when that is how it was typed.
  const [downUnit, setDownUnit] = useState<'amount' | 'percent'>('amount')
  const [downPercent, setDownPercent] = useState(Number.NaN)
  const percentDown = downUnit === 'percent'

  const rateUsed = Number.isFinite(input.annualRate) ? input.annualRate : CO_FALLBACK.annualRate
  const budgetLoan = budgetMode ? loanFromPayment(budget, rateUsed, input.termMonths) : 0
  // With a percentage down, the loan is the rest of the value: value = loan / (1 − share).
  const budgetPrice =
    !budgetMode || !(budgetLoan > 0)
      ? Number.NaN
      : percentDown
        ? Number.isFinite(downPercent) && downPercent < 1
          ? budgetLoan / (1 - downPercent)
          : Number.NaN
        : Number.isFinite(input.downPayment)
          ? budgetLoan + input.downPayment
          : Number.NaN
  useEffect(() => {
    if (!budgetMode) return
    const next = Number.isFinite(budgetPrice) ? Math.round(budgetPrice) : Number.NaN
    if (!Object.is(next, input.homePrice)) set('homePrice', next)
  }, [budgetMode, budgetPrice, input.homePrice, set])

  const valueForDown = budgetMode ? budgetPrice : input.homePrice
  const downFromPercent =
    Number.isFinite(downPercent) && Number.isFinite(valueForDown) ? Math.round(downPercent * valueForDown) : Number.NaN
  useEffect(() => {
    if (!percentDown) return
    if (!Object.is(downFromPercent, input.downPayment)) set('downPayment', downFromPercent)
  }, [percentDown, downFromPercent, input.downPayment, set])

  // Switching the unit keeps the same down payment, expressed the other way.
  function switchDownUnit(next: 'amount' | 'percent') {
    if (next === downUnit) return
    if (next === 'percent') {
      const share = input.downPayment / input.homePrice
      setDownPercent(Number.isFinite(share) ? Math.round(share * 1000) / 1000 : Number.NaN)
    }
    setDownUnit(next)
  }

  const downSwitch = (
    <Segmented
      label={t.carLoan.estimator.downUnit}
      size="sm"
      value={downUnit}
      options={(['amount', 'percent'] as const).map((unit) => ({
        value: unit,
        label: t.carLoan.estimator.downUnits[unit],
      }))}
      onChange={switchDownUnit}
    />
  )

  const housing = checkHousing(housingType, committed.homePrice, committed.downPayment)
  const coDti = isCo && monthlyIncome > 0
    ? {
        front: result.monthly.total / monthlyIncome,
        back: (result.monthly.total + (Number.isFinite(monthlyDebts) ? monthlyDebts : 0)) / monthlyIncome,
        frontLimit: CO_HOUSING.maxPaymentToIncome,
        backLimit: CO_HOUSING.maxDebtToIncome,
      }
    : null

  // A new mode, like a reset, starts from an empty form.
  function clearAll() {
    reset()
    setBudget(Number.NaN)
    setDownPercent(Number.NaN)
    setMonthlyIncome(Number.NaN)
    setMonthlyDebts(Number.NaN)
  }

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
      // Colombia: the box ends after "Abono a capital" (the 8th field); income and debts scroll inside it.
      scrollableForm={isCo}
      formPeek={isCo ? 8 : undefined}
      header={header}
      related={related}
      form={
        <CalculatorForm onReset={clearAll} error={formError}>
          <>
            {isCo && (
              <>
                <Segmented
                  label={c.modeLabel}
                  value={mode}
                  options={(['price', 'budget'] as const).map((value) => ({ value, label: c.modes[value] }))}
                  onChange={(next) => {
                    if (next === mode) return
                    clearAll()
                    setMode(next)
                  }}
                />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="housing-type">{c.housingType}</Label>
                    <InfoTip content={c.housingTypeHint} />
                  </div>
                  <Select
                    id="housing-type"
                    value={housingType}
                    options={HOUSING_TYPES.map((value) => ({ value, label: c.housingTypes[value] }))}
                    onChange={(event) => setHousingType(event.target.value as HousingType)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="home-condition">{c.condition}</Label>
                  <Select
                    id="home-condition"
                    value={condition}
                    options={HOME_CONDITIONS.map((value) => ({ value, label: c.conditions[value] }))}
                    onChange={(event) => setCondition(event.target.value as HomeCondition)}
                  />
                </div>
              </>
            )}

            {budgetMode ? (
              <CurrencyInput
                id="budget"
                label={c.budget}
                currency={country.currency}
                value={budget}
                placeholder={new Intl.NumberFormat(country.locale).format(2_500_000)}
                onChange={setBudget}
              />
            ) : (
              <CurrencyInput
                id="price"
                label={t.mortgage.homePrice}
                currency={country.currency}
                value={input.homePrice}
                error={errors.homePrice}
                onChange={(v) => set('homePrice', v)}
              />
            )}

            {percentDown ? (
              <PercentageInput
                id="down"
                label={country.terminology.downPayment}
                adornment={downSwitch}
                step={1}
                max={99}
                decimals={1}
                value={downPercent}
                error={errors.downPayment}
                // The amount it comes to, once the value is known.
                note={Number.isFinite(input.downPayment) ? `= ${money(input.downPayment)}` : undefined}
                onChange={setDownPercent}
              />
            ) : (
              <CurrencyInput
                id="down"
                label={country.terminology.downPayment}
                adornment={downSwitch}
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
            )}

            <TermInput
              id="term"
              label={country.terminology.loanTerm}
              months={input.termMonths}
              onChange={(months) => set('termMonths', months)}
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

            {isCo && (
              <>
                <CurrencyInput
                  id="income"
                  label={c.income}
                  optional
                  hint={c.incomeHint}
                  currency={country.currency}
                  value={monthlyIncome}
                  placeholder={new Intl.NumberFormat(country.locale).format(8_000_000)}
                  onChange={setMonthlyIncome}
                />
                <CurrencyInput
                  id="debts"
                  label={c.debts}
                  optional
                  hint={c.debtsHint}
                  currency={country.currency}
                  value={monthlyDebts}
                  placeholder="0"
                  onChange={setMonthlyDebts}
                />
              </>
            )}
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
          {/* Colombia, budget mode: what the payment buys comes first. */}
          {budgetMode && (
            <ResultSummary
              currency={result.currency}
              locale={country.locale}
              figures={[
                {
                  key: 'priceThatFits',
                  label: c.priceThatFits,
                  value: committed.homePrice,
                  format: 'currency',
                  emphasis: 'primary',
                  detail: c.priceThatFitsDetail(money(result.loanAmount), money(committed.downPayment)),
                },
              ]}
            />
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
              (miNotice || (isCo && (housing.overVisCap || housing.downBelowMinimum))) && (
                <div className="space-y-2">
                  {isCo && housing.overVisCap && (
                    <p className="rounded-md bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                      {c.overVisCap(money(visPriceCap()))}
                    </p>
                  )}
                  {isCo && housing.downBelowMinimum && (
                    <p className="rounded-md bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                      {c.downBelowMinimum(
                        formatPercent(housing.minDownRatio, country.locale, 0),
                        c.housingTypes[housingType],
                      )}
                    </p>
                  )}
                  {miNotice && (
                    <p className="rounded-md bg-amber-400/10 px-3 py-2 text-xs text-amber-200">{miNotice}</p>
                  )}
                </div>
              )
            }
          />

          {/* Colombia: the housing payment against household income (at most 30% by law). */}
          {isCo && <DebtToIncome value={coDti} locale={country.locale} frontLabel={c.dtiHousing} />}

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
            inputs: {
              ...committed,
              creditBand: committed.creditBand ?? 'not given',
              ...(isCo && {
                mode,
                housingType,
                homeCondition: condition,
                monthlyIncome: Number.isFinite(monthlyIncome) ? monthlyIncome : 'not given',
                monthlyDebts: Number.isFinite(monthlyDebts) ? monthlyDebts : 0,
              }),
            },
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
