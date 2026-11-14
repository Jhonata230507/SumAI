'use client'

import { useId, useMemo, useState, type ReactNode } from 'react'
import { ChevronRight, TriangleAlert } from 'lucide-react'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultSummary, type SummaryFigure } from '@/components/calculator/ResultSummary'
import { DebtToIncome } from '@/components/calculator/DebtToIncome'
import { BestOffers } from '@/components/calculator/BestOffers'
import { AIAnalysis } from '@/components/ai/AIAnalysis'
import { AmortizationChart } from '@/components/charts/lazy'
import { PaymentBreakdown } from '@/components/charts/PaymentBreakdown'
import { CHART_PANEL } from '@/components/charts/theme'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { PercentageInput } from '@/components/common/PercentageInput'
import { RateInput } from '@/components/common/RateInput'
import { TermInput } from '@/components/common/TermInput'
import { Segmented } from '@/components/common/Segmented'
import { OptionalTag } from '@/components/common/OptionalTag'
import { InfoTip } from '@/components/common/InfoTip'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { estimateLoan, type LoanEstimateInput } from '@/features/calculators/loan/estimator/calculate'
import {
  CREDIT_HISTORIES,
  LOAN_PURPOSES_CO,
  PAYMENT_TYPES,
  type CreditHistory,
  type LoanCountryConfig,
  type LoanPurposeCo,
  type PaymentType,
} from '@/features/calculators/loan/estimator/config'
import type { AmortizationRow } from '@/lib/calculations/amortization'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatPercent } from '@/lib/utils/format-number'
import { useI18n } from '@/lib/i18n/client'
import { cn } from '@/lib/utils/cn'
import type { CountryConfig } from '@/types/country'

export interface LoanEstimatorProps {
  country: CountryConfig
  config: LoanCountryConfig
  header: ReactNode
  related: ReactNode
}

/** What the form holds. Empty number fields are NaN; the module gets null or 0 for them. */
interface FormState {
  amount: number
  termMonths: number
  /** E.A., whatever basis the user types it in. */
  annualRate: number
  paymentType: PaymentType
  monthlyIncome: number
  monthlyDebts: number
  creditHistory: CreditHistory | null
  insuranceRate: number
  fees: number
  purpose: LoanPurposeCo | null
}

function blankForm(): FormState {
  return {
    amount: Number.NaN,
    termMonths: Number.NaN,
    annualRate: Number.NaN,
    paymentType: 'fixed',
    monthlyIncome: Number.NaN,
    monthlyDebts: Number.NaN,
    creditHistory: null,
    insuranceRate: Number.NaN,
    fees: Number.NaN,
    purpose: null,
  }
}

const orNull = (value: number) => (Number.isFinite(value) ? value : null)
const orZero = (value: number) => (Number.isFinite(value) ? value : 0)

function toInput(form: FormState): LoanEstimateInput {
  return {
    amount: orNull(form.amount),
    termMonths: orNull(form.termMonths),
    annualRate: orNull(form.annualRate),
    creditHistory: form.creditHistory,
    paymentType: form.paymentType,
    monthlyIncome: orNull(form.monthlyIncome),
    monthlyDebts: orZero(form.monthlyDebts),
    insuranceRate: orZero(form.insuranceRate),
    fees: orZero(form.fees),
  }
}

/**
 * The standard (consumer) loan for countries with an estimator config (Colombia).
 * Fixed or decreasing payment, debtor life insurance on the balance, fees, the
 * payment against income, and the month-by-month table. Every number comes from
 * `estimateLoan`; this component collects inputs and formats results.
 */
export function LoanEstimator({ country, config, header, related }: LoanEstimatorProps) {
  const { t } = useI18n()
  const c = t.loan.co
  const [form, setForm] = useState<FormState>(() => blankForm())
  const [estimatesOpen, setEstimatesOpen] = useState(false)
  const panelId = useId()
  const tableId = useId()

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const estimate = useMemo(() => estimateLoan(config, toInput(form)), [config, form])
  const { figures, rate, rows } = estimate

  const money = (value: number) => formatCurrency(value, config.currency)
  const pct = (value: number, decimals = 2) => formatPercent(value, config.locale, decimals)
  const example = (value: number) => new Intl.NumberFormat(config.locale).format(value)
  const ea = (value: number) => `${pct(value)} ${t.rateInput.effectiveAnnual}`

  const estimatedNote = c.estimatedRate(
    ea(rate.source === 'estimated' ? rate.rate : config.rates.average),
    form.creditHistory ? c.credits[form.creditHistory] : null,
  )
  const usury = rate.overUsury ? c.usury(pct(config.rates.usuryCap)) : undefined

  // The chart reads the shared amortization row shape; insurance is not principal or interest.
  const chartRows: AmortizationRow[] = useMemo(() => {
    let interestSoFar = 0
    let principalSoFar = 0
    return rows.map((row) => {
      interestSoFar += row.interest
      principalSoFar += row.principal
      return {
        period: row.month,
        payment: row.payment,
        principal: row.principal,
        interest: row.interest,
        extraPayment: 0,
        balance: row.balance,
        cumulativeInterest: interestSoFar,
        cumulativePrincipal: principalSoFar,
      }
    })
  }, [rows])

  const decreasing = form.paymentType === 'decreasing'
  const summary: SummaryFigure[] = figures
    ? [
        {
          key: 'payment',
          label: decreasing ? c.firstPayment : c.monthlyPayment,
          value: figures.firstPayment,
          format: 'currency',
          emphasis: 'primary',
          detail: [
            decreasing ? c.fallsTo(money(figures.lastPayment)) : c.paymentsTotal(figures.months),
            figures.firstInsurance > 0 ? c.withInsurance(money(figures.firstInsurance)) : null,
            c.atRate(ea(figures.annualRate), rate.source === 'estimated'),
          ]
            .filter(Boolean)
            .join(' · '),
        },
        { key: 'interest', label: c.totalInterest, value: figures.totalInterest, format: 'currency' },
        ...(figures.totalInsurance > 0
          ? [{ key: 'insurance', label: c.totalInsurance, value: figures.totalInsurance, format: 'currency' as const }]
          : []),
        {
          key: 'total',
          label: c.totalCost,
          value: figures.totalCost,
          format: 'currency',
          detail: c.totalCostDetail,
        },
      ]
    : []

  return (
    <CalculatorLayout
      ready={figures !== null}
      // The form box keeps the height it opens with: results appearing never resize
      // it, and the estimates panel scrolls inside it.
      scrollableForm={figures !== null || estimatesOpen}
      header={header}
      related={related}
      form={
        <CalculatorForm
          onReset={() => {
            setForm(blankForm())
            setEstimatesOpen(false)
          }}
        >
          <CurrencyInput
            id="amount"
            label={c.amount}
            currency={config.currency}
            value={form.amount}
            placeholder={example(config.examples.amount)}
            onChange={(v) => set('amount', v)}
          />

          <TermInput
            id="term"
            label={c.term}
            months={form.termMonths}
            defaultUnit="years"
            inlineNote
            min={config.term.minMonths}
            max={config.term.maxMonths}
            placeholder={String(config.term.exampleMonths / 12)}
            onChange={(months) => set('termMonths', months)}
          />

          <RateInput
            id="rate"
            country={country}
            label={c.rate}
            optional
            monthlyBasis="nmv"
            hint={c.rateHint}
            value={form.annualRate}
            error={usury}
            fallback={rate.source === 'estimated' ? rate.rate : undefined}
            fallbackNote={estimatedNote}
            onChange={(v) => set('annualRate', v)}
          />

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium leading-snug">{c.paymentType}</p>
              <InfoTip content={c.paymentTypeHint} />
            </div>
            <Segmented
              label={c.paymentType}
              value={form.paymentType}
              options={PAYMENT_TYPES.map((type) => ({ value: type, label: c.paymentTypes[type] }))}
              onChange={(type) => set('paymentType', type)}
            />
          </div>

          <CurrencyInput
            id="income"
            label={c.income}
            optional
            currency={config.currency}
            value={form.monthlyIncome}
            placeholder={example(config.examples.monthlyIncome)}
            hint={c.incomeHint}
            onChange={(v) => set('monthlyIncome', v)}
          />

          <CurrencyInput
            id="debts"
            label={c.debts}
            optional
            currency={config.currency}
            value={form.monthlyDebts}
            placeholder={example(config.examples.monthlyDebts)}
            hint={c.debtsHint}
            onChange={(v) => set('monthlyDebts', v)}
          />

          <div className="space-y-1.5">
            <div className="flex items-end justify-between gap-2">
              <Label htmlFor="credit">{c.credit}</Label>
              <OptionalTag />
            </div>
            <Select
              id="credit"
              value={form.creditHistory ?? ''}
              options={[
                { value: '', label: c.creditNone },
                ...CREDIT_HISTORIES.map((history) => ({ value: history, label: c.credits[history] })),
              ]}
              onChange={(event) => set('creditHistory', (event.target.value || null) as CreditHistory | null)}
            />
          </div>

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
            {c.improve}
          </button>

          <div id={panelId} hidden={!estimatesOpen} className="space-y-4">
            <PercentageInput
              id="insurance"
              label={c.insurance}
              optional
              step={0.01}
              max={5}
              decimals={2}
              value={form.insuranceRate}
              placeholder={(config.examples.insuranceRate * 100).toFixed(2)}
              hint={c.insuranceHint}
              onChange={(v) => set('insuranceRate', v)}
            />
            <CurrencyInput
              id="fees"
              label={c.fees}
              optional
              currency={config.currency}
              value={form.fees}
              placeholder="0"
              onChange={(v) => set('fees', v)}
            />
            <div className="space-y-1.5">
              <div className="flex items-end justify-between gap-2">
                <Label htmlFor="purpose">{c.purpose}</Label>
                <OptionalTag />
              </div>
              <Select
                id="purpose"
                value={form.purpose ?? ''}
                options={[
                  { value: '', label: c.purposeNone },
                  ...LOAN_PURPOSES_CO.map((purpose) => ({ value: purpose, label: c.purposes[purpose] })),
                ]}
                onChange={(event) => set('purpose', (event.target.value || null) as LoanPurposeCo | null)}
              />
            </div>
          </div>
        </CalculatorForm>
      }
      results={
        figures && (
          <>
            {usury && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
              >
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {usury}
              </p>
            )}
            {/* The payment on its own, the rest of the figures in one card. */}
            <ResultSummary figures={summary.slice(0, 1)} currency={config.currency} locale={config.locale} />
            <ResultSummary combined figures={summary.slice(1)} currency={config.currency} locale={config.locale} />
            {/* The payment against income, and what the loan costs in total, side by side. */}
            <div className="grid gap-6 sm:grid-cols-2">
              <DebtToIncome
                value={
                  figures.dti
                    ? {
                        front: figures.dti.payment,
                        back: figures.dti.total,
                        frontLimit: null,
                        backLimit: config.dtiGuideline,
                      }
                    : null
                }
                locale={config.locale}
                frontLabel={c.dtiPayment}
              />
              <div className={cn(CHART_PANEL, 'flex flex-col')}>
                <PaymentBreakdown
                  className="flex-1"
                  caption={c.costCaption}
                  currency={config.currency}
                  segments={[
                    { key: 'borrowed', label: c.borrowed, value: form.amount },
                    { key: 'interest', label: c.interest, value: figures.totalInterest },
                    // One bar for both extras: four bars leave no room for their labels.
                    ...(figures.totalInsurance + figures.fees > 0
                      ? [{ key: 'extras', label: c.extras, value: figures.totalInsurance + figures.fees }]
                      : []),
                  ]}
                />
              </div>
            </div>
          </>
        )
      }
      detail={
        figures && (
          <>
            <AmortizationChart rows={chartRows} currency={config.currency} periodsPerYear={12} />
            <section className={cn(CHART_PANEL, 'space-y-4')} aria-labelledby={`${tableId}-title`}>
              <div>
                <h2 id={`${tableId}-title`} className="text-sm font-medium">
                  {c.schedule.title}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">{c.schedule.subtitle}</p>
              </div>
              <div className="max-h-96 overflow-auto rounded-xl border">
                <table className="w-full text-right text-sm tabular-nums">
                  <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left font-normal">
                        {c.schedule.month}
                      </th>
                      <th scope="col" className="px-4 py-2 font-normal">
                        {c.schedule.payment}
                      </th>
                      <th scope="col" className="px-4 py-2 font-normal">
                        {c.schedule.interest}
                      </th>
                      <th scope="col" className="px-4 py-2 font-normal">
                        {c.schedule.principal}
                      </th>
                      {figures.totalInsurance > 0 && (
                        <th scope="col" className="px-4 py-2 font-normal">
                          {c.schedule.insurance}
                        </th>
                      )}
                      <th scope="col" className="px-4 py-2 font-normal">
                        {c.schedule.balance}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.month} className="border-t border-white/[0.04]">
                        <th scope="row" className="px-4 py-2 text-left font-normal text-muted-foreground">
                          {row.month}
                        </th>
                        <td className="px-4 py-2">{money(row.payment)}</td>
                        <td className="px-4 py-2">{money(row.interest)}</td>
                        <td className="px-4 py-2">{money(row.principal)}</td>
                        {figures.totalInsurance > 0 && <td className="px-4 py-2">{money(row.insurance)}</td>}
                        <td className="px-4 py-2">{money(Math.max(0, row.balance))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )
      }
      assistant={
        <BestOffers
          variant="sidebar"
          category="personal-loan"
          country={country}
          amount={orZero(form.amount)}
          termMonths={Number.isFinite(form.termMonths) ? form.termMonths : undefined}
          monthlyIncome={orNull(form.monthlyIncome) ?? undefined}
          monthlyDebts={Number.isFinite(form.monthlyIncome) ? orZero(form.monthlyDebts) : undefined}
        />
      }
      explanation={
        figures && (
          <AIAnalysis
            context={{
              calculatorId: 'loan',
              countryCode: country.code,
              currency: config.currency,
              inputs: {
                amount: form.amount,
                termMonths: figures.months,
                annualRateEA: figures.annualRate,
                rateSource: rate.source,
                paymentType: form.paymentType,
                monthlyIncome: orNull(form.monthlyIncome) ?? 'not given',
                monthlyDebts: orZero(form.monthlyDebts),
                creditHistory: form.creditHistory ?? 'not given',
                insuranceMonthlyRate: orZero(form.insuranceRate),
                fees: figures.fees,
                purpose: form.purpose ?? 'not given',
              },
              results: {
                firstPayment: figures.firstPayment,
                lastPayment: figures.lastPayment,
                totalInterest: figures.totalInterest,
                totalInsurance: figures.totalInsurance,
                totalCost: figures.totalCost,
                paymentToIncome: figures.dti?.payment ?? 'not given',
              },
            }}
          />
        )
      }
    />
  )
}
