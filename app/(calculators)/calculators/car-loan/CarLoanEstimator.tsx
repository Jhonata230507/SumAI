'use client'

import { useId, useMemo, useState, type ReactNode } from 'react'
import { ChevronRight, CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultCard } from '@/components/calculator/ResultCard'
import { BestOffers } from '@/components/calculator/BestOffers'
import { AmortizationChart, CarValueChart } from '@/components/charts/lazy'
import { CHART_PANEL } from '@/components/charts/theme'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { PercentageInput } from '@/components/common/PercentageInput'
import { OptionalTag } from '@/components/common/OptionalTag'
import { Segmented } from '@/components/common/Segmented'
import { TermInput } from '@/components/common/TermInput'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  breakEvenMonth,
  estimateCarLoan,
  estimateSchedule,
  resolveApr,
  type CarLoanEstimateInput,
  type EstimatorMode,
} from '@/features/calculators/car-loan/estimator/calculate'
import {
  CAR_CREDIT_BANDS,
  VEHICLE_CONDITIONS,
  type CarCreditBand,
  type CarLoanCountryConfig,
  type VehicleCondition,
} from '@/features/calculators/car-loan/estimator/config'
import { useI18n } from '@/lib/i18n/client'
import { formatPercent } from '@/lib/utils/format-number'
import { cn } from '@/lib/utils/cn'
import type { CountryConfig } from '@/types/country'

export interface CarLoanEstimatorProps {
  country: CountryConfig
  config: CarLoanCountryConfig
  header: ReactNode
  related: ReactNode
}

type DownUnit = 'amount' | 'percent'

/** What the form holds. Empty number fields are NaN; the module gets null or 0 for them. */
interface FormState {
  mode: EstimatorMode
  condition: VehicleCondition
  vehiclePrice: number
  monthlyBudget: number
  downUnit: DownUnit
  /** Kept apart, so switching the unit never turns dollars into a percentage. */
  downAmount: number
  downPercent: number
  tradeInValue: number
  tradeInOwed: number
  termMonths: number
  apr: number
  creditBand: CarCreditBand | null
  salesTax: number
  fees: number
  annualIncome: number
  monthlyDebts: number
}

function blankForm(): FormState {
  return {
    mode: 'price',
    condition: 'new',
    vehiclePrice: Number.NaN,
    monthlyBudget: Number.NaN,
    downUnit: 'amount',
    downAmount: Number.NaN,
    downPercent: Number.NaN,
    tradeInValue: Number.NaN,
    tradeInOwed: Number.NaN,
    // Typed by the user, like the price: empty until they do.
    termMonths: Number.NaN,
    apr: Number.NaN,
    creditBand: null,
    salesTax: Number.NaN,
    fees: Number.NaN,
    annualIncome: Number.NaN,
    monthlyDebts: Number.NaN,
  }
}

const orNull = (value: number) => (Number.isFinite(value) ? value : null)
const orZero = (value: number) => (Number.isFinite(value) ? value : 0)

function toInput(form: FormState): CarLoanEstimateInput {
  return {
    mode: form.mode,
    condition: form.condition,
    vehiclePrice: orNull(form.vehiclePrice),
    monthlyBudget: orNull(form.monthlyBudget),
    downPayment:
      form.downUnit === 'percent'
        ? { unit: 'percent', value: orZero(form.downPercent) }
        : { unit: 'amount', value: orZero(form.downAmount) },
    tradeInValue: orZero(form.tradeInValue),
    tradeInOwed: orZero(form.tradeInOwed),
    termMonths: orZero(form.termMonths),
    apr: orNull(form.apr),
    creditBand: form.creditBand,
    salesTax: orNull(form.salesTax),
    fees: orZero(form.fees),
    annualIncome: orNull(form.annualIncome),
    monthlyDebts: orZero(form.monthlyDebts),
  }
}

/**
 * The car loan estimator for countries with a config (see
 * features/calculators/car-loan/estimator). Two modes: from a vehicle price to
 * a monthly payment, or from a monthly budget to the most it can borrow and
 * the price that fits. Everything shown comes from `estimateCarLoan`; this
 * component only collects inputs and formats results. Changing the mode starts
 * from an empty form.
 */
export function CarLoanEstimator({ country, config, header, related }: CarLoanEstimatorProps) {
  const { t } = useI18n()
  const e = t.carLoan.estimator
  const [form, setForm] = useState<FormState>(() => blankForm())
  const [estimatesOpen, setEstimatesOpen] = useState(false)
  const panelId = useId()

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const estimate = useMemo(() => estimateCarLoan(config, toInput(form)), [config, form])
  const { figures } = estimate
  const rows = useMemo(() => estimateSchedule(estimate, form.termMonths), [estimate, form.termMonths])

  // Display only: rounding happens here, never in the calculation.
  const moneyFormat = useMemo(
    () => new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.currency }),
    [config.locale, config.currency],
  )
  const money = (value: number) => moneyFormat.format(value)
  const pct = (value: number, decimals = 2) => formatPercent(value, config.locale, decimals)
  const dash = '—'
  const example = (value: number) => new Intl.NumberFormat(config.locale).format(value)
  const show = (value: number | undefined) => (value === undefined ? dash : money(value))

  const bandLabel = (id: CarCreditBand) => {
    const range = config.creditBands.find((band) => band.id === id)
    const span = !range
      ? ''
      : range.min !== undefined && range.max !== undefined
        ? e.rangeBetween(range.min, range.max)
        : range.min !== undefined
          ? e.rangeFrom(range.min)
          : e.rangeUnder((range.max ?? 0) + 1)
    return span ? `${e.creditBands[id]} (${span})` : e.creditBands[id]
  }

  // The estimate the APR field falls back to, for its placeholder and hint.
  const estimatedApr = resolveApr(config, { apr: null, condition: form.condition, creditBand: form.creditBand }).apr
  const aprNote = Number.isFinite(form.apr)
    ? undefined
    : form.creditBand
      ? e.aprEstimateFromScore(pct(estimatedApr), bandLabel(form.creditBand))
      : e.aprEstimate(pct(estimatedApr))

  const priceMode = form.mode === 'price'
  const negativeEquity = figures && figures.tradeInOwed > figures.tradeInValue ? figures.tradeInOwed - figures.tradeInValue : 0
  const hasFigures = figures !== null
  const financed = figures !== null && figures.loanAmount > 0

  const unitSwitch = (
    <Segmented
      label={e.downUnit}
      size="sm"
      value={form.downUnit}
      options={(['amount', 'percent'] as const).map((unit) => ({ value: unit, label: e.downUnits[unit] }))}
      onChange={(unit) => set('downUnit', unit)}
    />
  )

  return (
    <CalculatorLayout
      // Until there is a result, the shared "enter your numbers" state; a budget the
      // down payment makes impossible still shows its note in the results.
      ready={hasFigures || estimate.issue === 'budgetDivisor'}
      // The form box keeps the height it opens with: results appearing never resize
      // it, and fields that would make it taller (the estimates) scroll inside it.
      scrollableForm={hasFigures || estimatesOpen}
      header={header}
      related={related}
      form={
        <CalculatorForm
          onReset={() => {
            setForm(blankForm())
            setEstimatesOpen(false)
          }}
        >
          <Segmented
            label={e.modeLabel}
            value={form.mode}
            options={(['price', 'budget'] as const).map((mode) => ({ value: mode, label: e.modes[mode] }))}
            // A new mode starts from an empty form.
            onChange={(mode) => {
              if (mode === form.mode) return
              setForm({ ...blankForm(), mode })
              setEstimatesOpen(false)
            }}
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium leading-snug">{e.condition}</p>
              <Segmented
                label={e.condition}
                size="sm"
                value={form.condition}
                options={VEHICLE_CONDITIONS.map((condition) => ({ value: condition, label: e.conditions[condition] }))}
                onChange={(condition) => set('condition', condition)}
              />
            </div>
          </div>

          {priceMode ? (
            <CurrencyInput
              id="price"
              label={e.vehiclePrice}
              currency={config.currency}
              value={form.vehiclePrice}
              placeholder={example(30_000)}
              onChange={(v) => set('vehiclePrice', v)}
            />
          ) : (
            <CurrencyInput
              id="budget"
              label={e.budget}
              currency={config.currency}
              value={form.monthlyBudget}
              placeholder={example(500)}
              onChange={(v) => set('monthlyBudget', v)}
            />
          )}

          {form.downUnit === 'amount' ? (
            <CurrencyInput
              id="down"
              label={e.downPayment}
              optional
              adornment={unitSwitch}
              currency={config.currency}
              value={form.downAmount}
              placeholder="0"
              onChange={(v) => set('downAmount', v)}
            />
          ) : (
            <PercentageInput
              id="down"
              label={e.downPayment}
              optional
              adornment={unitSwitch}
              step={1}
              max={1000}
              decimals={1}
              value={form.downPercent}
              placeholder="0"
              error={estimate.issue === 'downPercentOver100' ? e.downOver100 : undefined}
              hint={e.downPercentNote}
              onChange={(v) => set('downPercent', v)}
            />
          )}

          <CurrencyInput
            id="trade-in"
            label={e.tradeIn}
            optional
            currency={config.currency}
            value={form.tradeInValue}
            placeholder="0"
            onChange={(v) => set('tradeInValue', v)}
          />

          {form.tradeInValue > 0 && (
            <CurrencyInput
              id="trade-in-owed"
              label={e.tradeInOwed}
              optional
              currency={config.currency}
              value={form.tradeInOwed}
              placeholder="0"
              onChange={(v) => set('tradeInOwed', v)}
            />
          )}

          <TermInput
            id="term"
            label={e.term}
            months={form.termMonths}
            min={config.term.minMonths}
            max={config.term.maxMonths}
            placeholder={String(config.term.exampleMonths / 12)}
            onChange={(months) => set('termMonths', months)}
          />

          <PercentageInput
            id="apr"
            label={e.apr}
            optional
            step={0.1}
            max={40}
            value={form.apr}
            placeholder={(estimatedApr * 100).toFixed(2)}
            hint={aprNote}
            onChange={(v) => set('apr', v)}
          />

          <div className="space-y-1.5">
            <div className="flex items-end justify-between gap-2">
              <Label htmlFor="credit">{e.credit}</Label>
              <OptionalTag />
            </div>
            <Select
              id="credit"
              value={form.creditBand ?? ''}
              options={[
                { value: '', label: e.creditNone },
                ...CAR_CREDIT_BANDS.filter((id) => config.creditBands.some((band) => band.id === id)).map((id) => ({
                  value: id,
                  label: bandLabel(id),
                })),
              ]}
              onChange={(event) => set('creditBand', (event.target.value || null) as CarCreditBand | null)}
            />
          </div>

          {priceMode && (
            <div className="flex items-baseline justify-between gap-3 rounded-lg bg-muted px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">{e.loanAmount}</span>
              <output htmlFor="price down trade-in" className="font-medium tabular-nums">
                {show(figures?.loanAmount)}
              </output>
            </div>
          )}

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
            <PercentageInput
              id="sales-tax"
              label={e.salesTax}
              optional
              step={0.1}
              max={20}
              value={form.salesTax}
              placeholder={(config.estimates.salesTax * 100).toFixed(2)}
              hint={Number.isFinite(form.salesTax) ? undefined : e.salesTaxNote(pct(config.estimates.salesTax))}
              onChange={(v) => set('salesTax', v)}
            />
            <CurrencyInput
              id="fees"
              label={e.fees}
              optional
              currency={config.currency}
              value={form.fees}
              placeholder="0"
              hint={e.feesHint}
              onChange={(v) => set('fees', v)}
            />
            <CurrencyInput
              id="income"
              label={e.income}
              optional
              currency={config.currency}
              value={form.annualIncome}
              placeholder={example(60_000)}
              hint={e.incomeHint}
              onChange={(v) => set('annualIncome', v)}
            />
            <CurrencyInput
              id="debts"
              label={e.debts}
              optional
              currency={config.currency}
              value={form.monthlyDebts}
              placeholder={example(400)}
              hint={e.debtsHint}
              onChange={(v) => set('monthlyDebts', v)}
            />
          </div>
        </CalculatorForm>
      }
      results={
        // One live region: screen readers hear the new figures as inputs change.
        <div aria-live="polite" className="flex flex-1 flex-col gap-6 [&>*:last-child]:flex-1">
          {priceMode ? (
            <ResultCard
              emphasis="primary"
              label={e.payment}
              value={show(figures?.payment)}
              detail={e.paymentDetail(pct(estimate.apr), estimate.aprEstimated, form.termMonths)}
            />
          ) : (
            <ResultCard
              emphasis="primary"
              label={e.maxLoan}
              value={show(figures?.loanAmount)}
              detail={e.maxLoanDetail(
                pct(estimate.apr),
                estimate.aprEstimated,
                form.termMonths,
                Number.isFinite(form.monthlyBudget) ? money(form.monthlyBudget) : dash,
              )}
            />
          )}

          <Card>
            <CardContent className="space-y-4 p-5">
              <dl className="grid gap-5 sm:grid-cols-2">
                {priceMode ? (
                  <>
                    <Figure label={e.loanAmount} value={show(figures?.loanAmount)} />
                    <Figure label={e.totalInterest} value={show(figures?.totalInterest)} />
                    <Figure label={e.totalOfPayments} value={show(figures?.totalOfPayments)} />
                    <Figure label={e.priceWithTax} value={show(figures?.priceWithTax)} />
                  </>
                ) : (
                  <>
                    <Figure label={e.priceThatFits} value={show(figures?.vehiclePrice)} />
                    <Figure label={e.totalInterest} value={show(figures?.totalInterest)} />
                    <Figure label={e.totalOfPayments} value={show(figures?.totalOfPayments)} />
                    <Figure
                      label={e.downAndTradeIn}
                      value={figures ? money(figures.downPayment + figures.tradeInValue) : dash}
                      detail={figures && figures.tradeInOwed > 0 ? e.lessOwed(money(figures.tradeInOwed)) : undefined}
                    />
                  </>
                )}
              </dl>

              {figures?.nothingToFinance && <Note>{e.nothingToFinance}</Note>}
              {estimate.issue === 'budgetDivisor' && <Note tone="warning">{e.budgetDivisor}</Note>}
              {negativeEquity > 0 && <Note tone="warning">{e.negativeEquity(money(negativeEquity))}</Note>}
              {!priceMode && <p className="text-xs leading-relaxed text-muted-foreground">{e.budgetNote}</p>}
            </CardContent>
          </Card>

          {figures?.dti && (
            <Card>
              <CardContent className="space-y-2 p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{e.dti}</p>
                  <p className="text-2xl tabular-nums tracking-tight">{pct(figures.dti.ratio, 1)}</p>
                </div>
                <DtiMessage
                  level={figures.dti.level}
                  text={
                    figures.dti.level === 'comfortable'
                      ? e.dtiLevels.comfortable(pct(config.dtiThresholds.comfortable, 0))
                      : figures.dti.level === 'upper'
                        ? e.dtiLevels.upper(pct(config.dtiThresholds.comfortable, 0), pct(config.dtiThresholds.upper, 0))
                        : e.dtiLevels.high(pct(config.dtiThresholds.upper, 0))
                  }
                />
                <p className="text-xs text-muted-foreground">{e.dtiDetail}</p>
              </CardContent>
            </Card>
          )}

          {/* Last in the column: it takes the height left beside the form, and the plot grows into it. */}
          {financed && rows.length > 0 && (
            <div className={cn(CHART_PANEL, 'flex flex-col')}>
              <CarValueChart
                className="flex-1"
                vehiclePrice={figures.vehiclePrice}
                amountFinanced={figures.loanAmount}
                rows={rows}
                breakEvenPeriod={breakEvenMonth(figures.vehiclePrice, rows)}
                currency={config.currency}
                locale={config.locale}
              />
            </div>
          )}
        </div>
      }
      assistant={
        financed ? (
          <BestOffers
            variant="sidebar"
            category="car-loan"
            country={country}
            amount={figures.loanAmount}
            termMonths={form.termMonths}
            creditScore={config.creditBands.find((band) => band.id === form.creditBand)?.representativeScore}
            monthlyIncome={Number.isFinite(form.annualIncome) ? form.annualIncome / 12 : undefined}
          />
        ) : (
          <Card>
            <CardContent className="space-y-1 p-5">
              <h2 className="text-base font-semibold tracking-tight">{t.offers.title['car-loan']}</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">{e.offersPending}</p>
            </CardContent>
          </Card>
        )
      }
      detail={financed && rows.length > 0 ? <AmortizationChart rows={rows} currency={config.currency} /> : undefined}
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

/** The DTI reading: an icon and words, never colour alone. */
function DtiMessage({ level, text }: { level: 'comfortable' | 'upper' | 'high'; text: string }) {
  const Icon = level === 'comfortable' ? CircleCheck : level === 'upper' ? CircleAlert : TriangleAlert
  return (
    <p
      className={cn(
        'flex items-start gap-1.5 text-xs',
        level === 'comfortable' ? 'text-emerald-400' : level === 'upper' ? 'text-amber-300' : 'text-rose-300',
      )}
    >
      <Icon className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
      {text}
    </p>
  )
}
