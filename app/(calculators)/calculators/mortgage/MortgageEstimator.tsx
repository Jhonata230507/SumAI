'use client'

import { useId, useMemo, useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultCard } from '@/components/calculator/ResultCard'
import { BestOffers } from '@/components/calculator/BestOffers'
import { DebtToIncome } from '@/components/calculator/DebtToIncome'
import { WhatIfPanel } from '@/components/calculator/WhatIfPanel'
import { AmortizationChart } from '@/components/charts/lazy'
import { PaymentBreakdown } from '@/components/charts/PaymentBreakdown'
import { CHART_PANEL } from '@/components/charts/theme'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { PercentageInput } from '@/components/common/PercentageInput'
import { InfoTip } from '@/components/common/InfoTip'
import { OptionalTag } from '@/components/common/OptionalTag'
import { Segmented } from '@/components/common/Segmented'
import { TermInput } from '@/components/common/TermInput'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  addMonths,
  estimateMortgage,
  minimumDown,
  mortgageWhatIfs,
  resolveRate,
  type MortgageEstimateInput,
  type YearMonth,
} from '@/features/calculators/mortgage/estimator/calculate'
import type { MortgageCountryConfig } from '@/features/calculators/mortgage/estimator/config'
import { useI18n } from '@/lib/i18n/client'
import { formatMonths, formatPercent } from '@/lib/utils/format-number'
import { cn } from '@/lib/utils/cn'
import type { CountryConfig } from '@/types/country'

export interface MortgageEstimatorProps {
  country: CountryConfig
  config: MortgageCountryConfig
  header: ReactNode
  related: ReactNode
}

function blankInput(config: MortgageCountryConfig): MortgageEstimateInput {
  return {
    mode: 'price',
    homePrice: null,
    monthlyBudget: null,
    downPayment: { unit: 'percent', value: Number.NaN },
    program: config.programs[0],
    financeUpfrontFee: true,
    // Typed by the user, like the price: empty until they do.
    termMonths: Number.NaN,
    postalCode: '',
    annualIncome: null,
    monthlyDebts: Number.NaN,
    creditBand: null,
    rate: null,
    propertyTax: { unit: 'amount', value: null },
    insuranceAnnual: null,
    mortgageInsuranceRate: null,
    hoaMonthly: Number.NaN,
    extraMonthly: Number.NaN,
    startDate: null,
  }
}

/** Inputs hold NaN for an empty field; the model holds null. */
const toField = (value: number | null) => value ?? Number.NaN
const fromField = (value: number) => (Number.isFinite(value) ? value : null)

/**
 * The mortgage estimator for countries with a config (see
 * features/calculators/mortgage/estimator). Two modes: from a home price to the
 * monthly cost, or from a monthly budget to the price that fits. Everything
 * shown comes from `estimateMortgage`; this component collects the inputs and
 * formats the results. Fields shared by both modes carry over when it changes.
 */
export function MortgageEstimator({ country, config, header, related }: MortgageEstimatorProps) {
  const { t } = useI18n()
  const e = t.mortgage.estimator
  const u = t.mortgage.us
  const [input, setInput] = useState<MortgageEstimateInput>(() => blankInput(config))
  const [estimatesOpen, setEstimatesOpen] = useState(false)
  // The applied "what if", and the input it replaced, so a second click undoes it.
  const [whatIf, setWhatIf] = useState<{ id: string; before: MortgageEstimateInput } | null>(null)
  const panelId = useId()

  const change = (patch: Partial<MortgageEstimateInput>) => {
    setWhatIf(null)
    setInput((previous) => ({ ...previous, ...patch }))
  }

  const estimate = useMemo(() => estimateMortgage(config, input), [config, input])
  const { figures } = estimate
  const whatIfs = useMemo(
    () => mortgageWhatIfs(config, whatIf ? whatIf.before : input),
    [config, input, whatIf],
  )

  // Display only: rounding happens here, never in the calculation.
  const moneyFormat = useMemo(
    () => new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.currency }),
    [config.locale, config.currency],
  )
  const wholeMoney = useMemo(
    () => new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.currency, maximumFractionDigits: 0 }),
    [config.locale, config.currency],
  )
  const money = (value: number) => moneyFormat.format(value)
  const pct = (value: number, decimals = 2) => formatPercent(value, config.locale, decimals)
  const example = (value: number) => new Intl.NumberFormat(config.locale).format(value)
  const monthYear = (date: YearMonth) =>
    new Intl.DateTimeFormat(config.locale, { month: 'short', year: 'numeric' }).format(new Date(date.year, date.month - 1))

  const programName = u.loanTypes[input.program]
  const programRules = config.program[input.program]!
  const hasUpfrontFee = programRules.upfrontFee.length > 0
  const priceMode = input.mode === 'price'
  // The price the down payment and tax shares are measured against: typed, or found from the budget.
  const price = priceMode ? (input.homePrice ?? 0) : (figures?.homePrice ?? 0)
  // The term in years for the copy (one decimal for terms like 18 months); the example term until one is typed.
  const years = Math.round(((input.termMonths > 0 ? input.termMonths : config.term.exampleMonths) / 12) * 10) / 10

  const estimatedRate = resolveRate(config, { ...input, rate: null }).rate
  const regionTax = estimate.region ? config.estimates.propertyTaxByRegion[estimate.region.code].rate : null
  const taxEstimateRate = regionTax ?? config.estimates.propertyTaxNational

  /* ---------- the synced $ / % fields ---------- */

  const down = input.downPayment
  const downField = toField(down.value)
  const switchDown = (unit: 'amount' | 'percent') => {
    if (unit === down.unit) return
    const value = Number.isFinite(down.value) && price > 0
      ? unit === 'percent' ? down.value / price : down.value * price
      : Number.NaN
    change({ downPayment: { unit, value } })
  }
  const downSynced =
    Number.isFinite(down.value) && price > 0
      ? down.unit === 'percent'
        ? e.equals(wholeMoney.format(down.value * price))
        : e.ofPrice(pct(down.value / price, 1))
      : undefined
  const downError =
    estimate.issue === 'downPercentTooHigh' ? e.downTooHigh : estimate.issue === 'downOverPrice' ? e.downOverPrice : undefined

  const tax = input.propertyTax
  const switchTax = (unit: 'amount' | 'percent') => {
    if (unit === tax.unit) return
    const value =
      tax.value !== null && price > 0 ? (unit === 'percent' ? tax.value / price : tax.value * price) : null
    change({ propertyTax: { unit, value } })
  }
  const taxHint = tax.value === null ? e.taxEstimated(pct(taxEstimateRate), estimate.region?.name ?? null) : undefined
  const taxValue =
    tax.value !== null && price > 0
      ? tax.unit === 'percent'
        ? e.perYear(wholeMoney.format(tax.value * price))
        : e.ofPrice(pct(tax.value / price))
      : undefined

  const unitSwitch = (label: string, value: 'amount' | 'percent', onChange: (unit: 'amount' | 'percent') => void) => (
    <Segmented
      label={label}
      size="sm"
      value={value}
      options={(['amount', 'percent'] as const).map((unit) => ({ value: unit, label: e.units[unit] }))}
      onChange={onChange}
    />
  )

  /* ---------- notes ---------- */

  const zip = input.postalCode
  const zipResult = config.isPostalCode(zip)
    ? estimate.region && regionTax !== null
      ? e.zipState(estimate.region.name, pct(regionTax))
      : e.zipUnknown
    : null

  const miNote = (() => {
    const mi = figures?.mortgageInsurance
    if (!figures || !mi) return null
    if (mi.forLife) return input.program === 'usda' ? u.usdaLife : u.fhaLife
    if (programRules.insurance.kind === 'premium') return u.fhaYears
    if (programRules.insurance.kind !== 'pmi') return null
    const when = input.startDate
      ? e.pmiEndsOn(monthYear(addMonths(input.startDate, mi.months)))
      : e.pmiEndsInYears(Math.max(1, Math.round(mi.months / 12)))
    return e.pmiEnds(when)
  })()

  const ready = figures !== null || estimate.issue === 'budgetTooLow'
  const startValue = input.startDate
    ? `${input.startDate.year}-${String(input.startDate.month).padStart(2, '0')}`
    : ''

  return (
    <CalculatorLayout
      ready={ready}
      // Desktop: the box ends after the ZIP code; income, debts and the estimates scroll inside it.
      // The fields up to it: mode, price, down payment, loan type, the fee switch (programs with a fee), term, ZIP.
      scrollableForm
      formPeek={hasUpfrontFee ? 7 : 6}
      // It keeps that height beside taller results, and stays in view as they scroll.
      formSticky
      header={header}
      related={related}
      form={
        <CalculatorForm
          onReset={() => {
            setInput(blankInput(config))
            setWhatIf(null)
            setEstimatesOpen(false)
          }}
        >
          <Segmented
            label={e.modeLabel}
            value={input.mode}
            options={(['price', 'budget'] as const).map((mode) => ({ value: mode, label: e.modes[mode] }))}
            onChange={(mode) => change({ mode })}
          />

          {priceMode ? (
            <CurrencyInput
              id="price"
              label={t.mortgage.homePrice}
              currency={config.currency}
              value={toField(input.homePrice)}
              placeholder={example(400_000)}
              onChange={(v) => change({ homePrice: fromField(v) })}
            />
          ) : (
            <CurrencyInput
              id="budget"
              label={e.budget}
              currency={config.currency}
              value={toField(input.monthlyBudget)}
              placeholder={example(3_000)}
              hint={e.budgetHint}
              onChange={(v) => change({ monthlyBudget: fromField(v) })}
            />
          )}

          <div className="space-y-2">
            {down.unit === 'amount' ? (
              <CurrencyInput
                id="down"
                label={e.downPayment}
                adornment={unitSwitch(e.downUnit, 'amount', switchDown)}
                currency={config.currency}
                value={downField}
                placeholder="0"
                error={downError}
                note={downSynced}
                onChange={(v) => change({ downPayment: { unit: 'amount', value: v } })}
              />
            ) : (
              <PercentageInput
                id="down"
                label={e.downPayment}
                adornment={unitSwitch(e.downUnit, 'percent', switchDown)}
                step={1}
                max={1000}
                decimals={1}
                value={downField}
                placeholder="20"
                error={downError}
                note={downSynced}
                onChange={(v) => change({ downPayment: { unit: 'percent', value: v } })}
              />
            )}
            {/* The loan this down payment leaves, and its loan-to-value. */}
            <div className="flex items-baseline justify-between gap-3 rounded-lg bg-muted px-3 py-2.5 text-sm">
              <span className="whitespace-nowrap text-muted-foreground">{e.loanAmount}</span>
              <output htmlFor="price budget down" className="tabular-nums">
                <span className="font-medium">{figures ? money(figures.loanAmount) : '—'}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {e.ltv} {figures ? pct(figures.loanToValue, 1) : '—'}
                </span>
              </output>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label id={`${panelId}-program`}>{u.loanType}</Label>
              <InfoTip content={u.loanTypeNotes[input.program]} />
            </div>
            <Segmented
              label={u.loanType}
              value={input.program}
              // The first program name is the longest ("Conventional"): it gets more room.
              columns={`1.8fr repeat(${config.programs.length - 1}, minmax(0, 1fr))`}
              options={config.programs.map((program) => ({ value: program, label: u.loanTypes[program] }))}
              onChange={(program) => change({ program })}
            />
          </div>

          {hasUpfrontFee && (
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium leading-snug" id={`${panelId}-finance`}>
                  {e.financeFee}
                </p>
                <InfoTip
                  content={
                    figures && figures.upfrontFee > 0
                      ? e.financeFeeHint(u.fees[input.program], money(figures.upfrontFee))
                      : e.financeFeeHintPending(u.fees[input.program])
                  }
                />
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={input.financeUpfrontFee}
                aria-labelledby={`${panelId}-finance`}
                onClick={() => change({ financeUpfrontFee: !input.financeUpfrontFee })}
                className={cn(
                  'relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  input.financeUpfrontFee ? 'bg-white' : 'bg-muted',
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 h-4 w-4 rounded-full transition-all',
                    input.financeUpfrontFee ? 'left-5 bg-black' : 'left-1 bg-muted-foreground',
                  )}
                />
              </button>
            </div>
          )}

          <TermInput
            id="term"
            label={e.term}
            months={input.termMonths}
            min={config.term.minMonths}
            max={config.term.maxMonths}
            placeholder={String(config.term.exampleMonths / 12)}
            onChange={(termMonths) => change({ termMonths })}
          />

          <div className="space-y-1.5">
            <div className="flex items-end justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="zip">{u.zip}</Label>
                <InfoTip content={e.zipHint} id="zip-hint" />
              </div>
              <OptionalTag />
            </div>
            <Input
              id="zip"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              placeholder={u.zipPlaceholder}
              value={zip}
              aria-describedby="zip-hint"
              className="tabular-nums"
              onChange={(event) => change({ postalCode: event.target.value.replace(/\D/g, '').slice(0, 5) })}
            />
            {/* Neutral: it only refines the tax estimate and never blocks the result. */}
            {zipResult && <p className="text-xs text-muted-foreground">{zipResult}</p>}
          </div>

          <CurrencyInput
            id="income"
            label={u.income}
            optional
            currency={config.currency}
            value={toField(input.annualIncome)}
            placeholder={example(120_000)}
            hint={e.incomeHint}
            onChange={(v) => change({ annualIncome: fromField(v) })}
          />

          <CurrencyInput
            id="debts"
            label={u.debts}
            optional
            currency={config.currency}
            value={input.monthlyDebts}
            placeholder={example(500)}
            hint={u.debtsHint}
            onChange={(v) => change({ monthlyDebts: v })}
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
            {u.improveEstimates}
          </button>

          <div id={panelId} hidden={!estimatesOpen} className="space-y-4">
            {/* Right above the rate: it sets the estimated rate and mortgage insurance. */}
            <div className="space-y-1.5">
              <div className="flex items-end justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="credit">{u.creditScore}</Label>
                  <InfoTip content={e.creditHint} id="credit-hint" />
                </div>
                <OptionalTag />
              </div>
              <Select
                id="credit"
                value={input.creditBand ?? ''}
                options={[
                  { value: '', label: u.creditNone },
                  ...config.creditBands.map((band) => ({ value: band.id, label: band.id })),
                ]}
                aria-describedby="credit-hint"
                onChange={(event) => change({ creditBand: event.target.value || null })}
              />
            </div>

            <PercentageInput
              id="rate"
              label={e.rate}
              optional
              decimals={2}
              step={0.125}
              max={20}
              value={toField(input.rate)}
              placeholder={(estimatedRate * 100).toFixed(2)}
              hint={input.rate === null ? e.rateEstimated(programName, years, input.creditBand) : undefined}
              onChange={(v) => change({ rate: fromField(v) })}
            />

            {tax.unit === 'amount' ? (
              <CurrencyInput
                id="tax"
                label={t.mortgage.propertyTax}
                optional
                adornment={unitSwitch(e.taxUnit, 'amount', switchTax)}
                currency={config.currency}
                value={toField(tax.value)}
                placeholder={price > 0 ? example(Math.round(price * taxEstimateRate)) : '0'}
                hint={taxHint}
                note={taxValue}
                onChange={(v) => change({ propertyTax: { unit: 'amount', value: fromField(v) } })}
              />
            ) : (
              <PercentageInput
                id="tax"
                label={t.mortgage.propertyTax}
                optional
                adornment={unitSwitch(e.taxUnit, 'percent', switchTax)}
                step={0.05}
                max={10}
                value={toField(tax.value)}
                placeholder={(taxEstimateRate * 100).toFixed(2)}
                hint={taxHint}
                note={taxValue}
                onChange={(v) => change({ propertyTax: { unit: 'percent', value: fromField(v) } })}
              />
            )}

            <CurrencyInput
              id="insurance"
              label={t.mortgage.insurance}
              optional
              currency={config.currency}
              value={toField(input.insuranceAnnual)}
              placeholder={price > 0 ? example(Math.round(price * config.estimates.insuranceRate)) : '0'}
              hint={input.insuranceAnnual === null ? e.insuranceEstimated(pct(config.estimates.insuranceRate, 1)) : undefined}
              onChange={(v) => change({ insuranceAnnual: fromField(v) })}
            />

            <PercentageInput
              id="mortgage-insurance"
              label={e.mortgageInsurance}
              optional
              decimals={2}
              step={0.05}
              max={5}
              value={toField(input.mortgageInsuranceRate)}
              placeholder={((figures?.mortgageInsurance?.annualRate ?? 0) * 100).toFixed(2)}
              hint={
                input.mortgageInsuranceRate !== null
                  ? undefined
                  : figures?.mortgageInsurance
                    ? e.miEstimated(pct(figures.mortgageInsurance.annualRate))
                    : figures
                      ? e.miNone
                      : undefined
              }
              onChange={(v) => change({ mortgageInsuranceRate: fromField(v) })}
            />

            <CurrencyInput
              id="hoa"
              label={t.mortgage.hoa}
              optional
              currency={config.currency}
              value={input.hoaMonthly}
              placeholder="0"
              onChange={(v) => change({ hoaMonthly: v })}
            />

            <CurrencyInput
              id="extra"
              label={t.mortgage.extra}
              optional
              currency={config.currency}
              value={input.extraMonthly}
              placeholder="0"
              onChange={(v) => change({ extraMonthly: v })}
            />

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
                value={startValue}
                aria-describedby="start-hint"
                className="tabular-nums [color-scheme:dark]"
                onChange={(event) => {
                  const [y, m] = event.target.value.split('-').map(Number)
                  change({ startDate: y && m ? { year: y, month: m } : null })
                }}
              />
            </div>
          </div>
        </CalculatorForm>
      }
      results={
        // One live region: screen readers hear the new figures as inputs change.
        <div aria-live="polite" className="flex flex-1 flex-col gap-6 [&>*:last-child]:flex-1">
          {!figures ? (
            estimate.issue === 'budgetTooLow' && (
              <Card>
                <CardContent className="p-5">
                  <Note tone="warning">{e.budgetTooLow}</Note>
                </CardContent>
              </Card>
            )
          ) : (
            <>
              {priceMode ? (
                <ResultCard
                  emphasis="primary"
                  label={e.payment}
                  value={money(figures.monthly.total)}
                  detail={e.paymentDetail(pct(estimate.rate), estimate.rateEstimated, years)}
                />
              ) : (
                <ResultCard
                  emphasis="primary"
                  label={e.priceFits}
                  value={money(figures.homePrice)}
                  detail={e.priceFitsDetail(wholeMoney.format(figures.downPayment), money(figures.monthly.total))}
                />
              )}

              <Card>
                <CardContent className="space-y-4 p-5">
                  <dl className="grid gap-5 sm:grid-cols-2">
                    <Figure
                      label={e.loanAmount}
                      value={money(figures.loanAmount)}
                      detail={
                        figures.upfrontFee > 0 && figures.upfrontFeeFinanced
                          ? e.loanDetailFee(money(figures.upfrontFee), u.fees[input.program])
                          : undefined
                      }
                    />
                    <Figure
                      label={e.totalInterest}
                      value={money(figures.totalInterest)}
                      detail={figures.interestSaved > 0 ? e.interestSaved(wholeMoney.format(figures.interestSaved)) : undefined}
                    />
                    <Figure
                      label={e.paidOff}
                      value={
                        figures.payoffDate ? monthYear(figures.payoffDate) : formatMonths(figures.payoffMonths, config.locale)
                      }
                      detail={figures.monthsSaved > 0 ? t.mortgage.monthsEarly(figures.monthsSaved) : undefined}
                    />
                    <Figure label={e.cashAtClosing} value={money(figures.cashAtClosing)} detail={e.cashAtClosingDetail} />
                  </dl>

                  {figures.belowMinimumDown !== null && (
                    <Note tone="warning">{u.minDown(pct(minimumDown(config, input.program, input.creditBand), 1), programName)}</Note>
                  )}
                  {miNote && <Note>{miNote}</Note>}
                  {!priceMode && <p className="text-xs leading-relaxed text-muted-foreground">{e.budgetNote}</p>}
                </CardContent>
              </Card>

              <DebtToIncome value={figures.dti} locale={config.locale} />

              {/* Last in the column: it takes the height left beside the form. */}
              <div className={cn(CHART_PANEL, 'flex flex-col')}>
                <PaymentBreakdown
                  className="flex-1"
                  currency={config.currency}
                  segments={[
                    { key: 'pi', label: t.mortgage.segments.principalAndInterest, value: figures.monthly.principalAndInterest },
                    { key: 'tax', label: t.mortgage.segments.propertyTax, value: figures.monthly.propertyTax },
                    { key: 'insurance', label: t.mortgage.segments.homeInsurance, value: figures.monthly.insurance },
                    { key: 'mi', label: t.mortgage.segments.mortgageInsurance, value: figures.monthly.mortgageInsurance },
                    { key: 'hoa', label: t.mortgage.segments.hoa, value: figures.monthly.hoa },
                  ]}
                />
              </div>
            </>
          )}
        </div>
      }
      assistant={
        <BestOffers
          variant="sidebar"
          category="mortgage"
          country={country}
          amount={figures?.loanAmount ?? 0}
          termMonths={input.termMonths}
          creditScore={config.creditBands.find((band) => band.id === input.creditBand)?.representativeScore}
          monthlyIncome={input.annualIncome ? input.annualIncome / 12 : undefined}
          monthlyDebts={input.annualIncome && Number.isFinite(input.monthlyDebts) ? input.monthlyDebts : undefined}
        />
      }
      detail={
        figures && figures.rows.length > 0 ? (
          <>
            {priceMode && whatIfs.length > 0 && (
              <WhatIfPanel
                wide
                currency={config.currency}
                options={whatIfs.map(({ id, costDelta, paymentDelta, periodsDelta }) => ({
                  id,
                  label: id,
                  description: '',
                  costDelta,
                  paymentDelta,
                  periodsDelta,
                }))}
                selectedId={whatIf?.id ?? null}
                onApply={(id) => {
                  if (whatIf?.id === id) {
                    setInput(whatIf.before)
                    setWhatIf(null)
                    return
                  }
                  const variant = whatIfs.find((option) => option.id === id)
                  if (!variant) return
                  setInput(variant.input)
                  setWhatIf({ id, before: whatIf ? whatIf.before : input })
                }}
              />
            )}
            <AmortizationChart rows={figures.rows} currency={config.currency} startYear={input.startDate?.year} />
          </>
        ) : undefined
      }
    />
  )
}

function Figure({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl tabular-nums tracking-tight">{value}</dd>
      {detail && <dd className="mt-1 text-xs text-muted-foreground">{detail}</dd>}
    </div>
  )
}

function Note({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'warning' }) {
  return (
    <p
      className={cn(
        'rounded-md px-3 py-2 text-xs',
        tone === 'warning' ? 'bg-amber-400/10 text-amber-200' : 'bg-muted text-muted-foreground',
      )}
    >
      {children}
    </p>
  )
}
