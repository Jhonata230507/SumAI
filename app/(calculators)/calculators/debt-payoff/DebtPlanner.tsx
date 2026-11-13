'use client'

import { useId, useMemo, useState, type ReactNode } from 'react'
import { ChevronRight, Plus, Sparkles, Trash2 } from 'lucide-react'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { BestOffers } from '@/components/calculator/BestOffers'
import { DebtBalanceChart } from '@/components/charts/lazy'
import { CHART_PANEL } from '@/components/charts/theme'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { InfoTip } from '@/components/common/InfoTip'
import { OptionalTag } from '@/components/common/OptionalTag'
import { PercentageInput } from '@/components/common/PercentageInput'
import { Segmented } from '@/components/common/Segmented'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  addMonths,
  planDebts,
  type AmountMode,
  type PlanResult,
  type Strategy,
  type YearMonth,
} from '@/features/calculators/debt-payoff/estimator/calculate'
import type { DebtPayoffCountryConfig } from '@/features/calculators/debt-payoff/estimator/config'
import { useI18n } from '@/lib/i18n/client'
import { formatMonths } from '@/lib/utils/format-number'
import { cn } from '@/lib/utils/cn'
import type { CountryConfig } from '@/types/country'

export interface DebtPlannerProps {
  country: CountryConfig
  config: DebtPayoffCountryConfig
  header: ReactNode
  related: ReactNode
}

/** What the form holds; empty number fields are NaN. */
interface FormDebt {
  id: string
  name: string
  balance: number
  apr: number
  minimum: number
}
interface FormState {
  debts: FormDebt[]
  amount: number
  amountMode: AmountMode
  oneTimeExtra: number
  startDate: YearMonth | null
}

const STRATEGIES: Strategy[] = ['avalanche', 'snowball']
const orNull = (value: number) => (Number.isFinite(value) ? value : null)
let nextId = 0
const newId = () => `debt-${Date.now()}-${nextId++}`

/**
 * The debt payoff planner for countries with a config (see
 * features/calculators/debt-payoff/estimator). It always runs both methods and
 * shows them side by side against paying only the minimums; "Show details for"
 * only picks which one the chart and tables break down. Everything shown comes
 * from `planDebts`; this component collects inputs and formats results.
 */
export function DebtPlanner({ country, config, header, related }: DebtPlannerProps) {
  const { t, locale } = useI18n()
  const d = t.debtPayoff
  const p = d.planner
  // The first debt has a fixed id, so the server and the browser render the same page.
  const blank = (): FormState => ({
    debts: [{ id: 'debt-1', name: d.newDebtName(1), balance: Number.NaN, apr: Number.NaN, minimum: Number.NaN }],
    amount: Number.NaN,
    amountMode: 'total',
    oneTimeExtra: Number.NaN,
    startDate: null,
  })
  const [form, setForm] = useState<FormState>(blank)
  const [selected, setSelected] = useState<Strategy>('avalanche')
  const [estimatesOpen, setEstimatesOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const panelId = useId()

  const change = (patch: Partial<FormState>) => setForm((previous) => ({ ...previous, ...patch }))
  const updateDebt = (id: string, patch: Partial<FormDebt>) =>
    setForm((previous) => ({
      ...previous,
      debts: previous.debts.map((debt) => (debt.id === id ? { ...debt, ...patch } : debt)),
    }))

  const plan = useMemo(
    () =>
      planDebts(config, {
        debts: form.debts.map((debt) => ({
          id: debt.id,
          name: debt.name,
          balance: orNull(debt.balance),
          apr: orNull(debt.apr),
          minimum: orNull(debt.minimum),
        })),
        amount: orNull(form.amount),
        amountMode: form.amountMode,
        oneTimeExtra: orNull(form.oneTimeExtra),
        startDate: form.startDate,
      }),
    [config, form],
  )

  // Display only: rounding happens here, never in the calculation.
  const money = useMemo(() => {
    const format = new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.currency })
    return (value: number) => format.format(value)
  }, [config.locale, config.currency])
  const whole = useMemo(() => {
    const format = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      maximumFractionDigits: 0,
    })
    return (value: number) => format.format(value)
  }, [config.locale, config.currency])
  const duration = (months: number) => (months < 12 ? t.common.months(months) : formatMonths(months, locale))
  const monthYear = (date: YearMonth) =>
    new Intl.DateTimeFormat(config.locale, { month: 'short', year: 'numeric' }).format(
      new Date(date.year, date.month - 1),
    )
  const when = (month: number | null) =>
    month === null ? p.never : form.startDate ? monthYear(addMonths(form.startDate, month)) : p.monthN(month)

  const fillExample = () => {
    const sample = config.example
    setForm({
      debts: sample.debts.map((debt) => ({
        id: newId(),
        name: p.exampleNames[debt.name] ?? debt.name,
        balance: debt.balance,
        apr: debt.apr,
        minimum: debt.minimum,
      })),
      amount: sample.monthlyAmount,
      amountMode: 'total',
      oneTimeExtra: Number.NaN,
      startDate: null,
    })
  }

  const { avalanche, snowball, baseline } = plan
  const ready = avalanche !== null && snowball !== null && baseline !== null
  const shown = selected === 'avalanche' ? avalanche : snowball
  const startValue = form.startDate ? `${form.startDate.year}-${String(form.startDate.month).padStart(2, '0')}` : ''

  return (
    <CalculatorLayout
      ready={ready}
      // The form box keeps the height it opens with (one debt): more debts, the estimates
      // and results appearing never resize it; what does not fit scrolls inside. It stays
      // scrollable while there is more than one debt, so it never re-measures to a long list.
      scrollableForm={ready || estimatesOpen || form.debts.length > 1}
      emptyAction={
        <Button type="button" variant="outline" className="gap-2" onClick={fillExample}>
          <Sparkles className="h-4 w-4" aria-hidden />
          {p.example}
        </Button>
      }
      header={header}
      related={related}
      form={
        <CalculatorForm
          title={d.formTitle}
          onReset={() => {
            setForm(blank())
            setEstimatesOpen(false)
          }}
        >
          <div className="space-y-3">
            {form.debts.map((debt, index) => {
              const warning = plan.warnings.find((w) => w.debtId === debt.id)?.minimumBelowInterest
              return (
                <div key={debt.id} className="space-y-4 rounded-xl border border-white/[0.06] bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label={d.debtNameLabel(index + 1)}
                      value={debt.name}
                      onChange={(event) => updateDebt(debt.id, { name: event.target.value })}
                      className="h-8 font-medium"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label={d.remove(debt.name)}
                      disabled={form.debts.length === 1}
                      onClick={() => change({ debts: form.debts.filter((other) => other.id !== debt.id) })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CurrencyInput
                    id={`${debt.id}-balance`}
                    label={d.balance}
                    currency={config.currency}
                    value={debt.balance}
                    placeholder="0"
                    onChange={(v) => updateDebt(debt.id, { balance: v })}
                  />
                  <PercentageInput
                    id={`${debt.id}-rate`}
                    label={p.rate}
                    hint={p.rateHint}
                    step={0.01}
                    value={debt.apr}
                    placeholder="0.00"
                    onChange={(v) => updateDebt(debt.id, { apr: v })}
                  />
                  <div className="space-y-1.5">
                    <CurrencyInput
                      id={`${debt.id}-minimum`}
                      label={d.minimum}
                      currency={config.currency}
                      value={debt.minimum}
                      placeholder="0"
                      onChange={(v) => updateDebt(debt.id, { minimum: v })}
                    />
                    {warning && <p className="text-xs text-amber-300">{p.minimumBelowInterest}</p>}
                  </div>
                </div>
              )
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              disabled={form.debts.length >= config.maxDebts}
              onClick={() =>
                change({
                  debts: [
                    ...form.debts,
                    {
                      id: newId(),
                      name: d.newDebtName(form.debts.length + 1),
                      balance: Number.NaN,
                      apr: Number.NaN,
                      minimum: Number.NaN,
                    },
                  ],
                })
              }
            >
              <Plus className="h-4 w-4" />
              {d.addDebt}
            </Button>
            {form.debts.length >= config.maxDebts && (
              <p className="text-center text-xs text-muted-foreground">{p.maxDebts(config.maxDebts)}</p>
            )}
          </div>

          <CurrencyInput
            id="amount"
            label={p.amount}
            hint={p.amountHint[form.amountMode]}
            adornment={
              <Segmented
                label={p.amountUnit}
                size="sm"
                value={form.amountMode}
                options={(['total', 'extra'] as const).map((mode) => ({ value: mode, label: p.amountUnits[mode] }))}
                onChange={(amountMode) => change({ amountMode })}
              />
            }
            currency={config.currency}
            value={form.amount}
            placeholder="0"
            error={plan.belowMinimums ? p.belowMinimums(money(plan.minimums)) : undefined}
            note={
              plan.minimums > 0
                ? [
                    p.minimumsTotal(money(plan.minimums)),
                    form.amountMode === 'extra' && plan.monthlyAmount !== null
                      ? p.totalIs(money(plan.monthlyAmount))
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' ')
                : undefined
            }
            onChange={(v) => change({ amount: v })}
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
            {t.mortgage.us.improveEstimates}
          </button>

          <div id={panelId} hidden={!estimatesOpen} className="space-y-4">
            <CurrencyInput
              id="one-time"
              label={p.oneTime}
              optional
              hint={p.oneTimeHint}
              currency={config.currency}
              value={form.oneTimeExtra}
              placeholder="0"
              onChange={(v) => change({ oneTimeExtra: v })}
            />
            <div className="space-y-1.5">
              <div className="flex items-end justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="start">{p.startDate}</Label>
                  <InfoTip content={p.startDateHint} id="start-hint" />
                </div>
                <OptionalTag />
              </div>
              <Input
                id="start"
                type="month"
                aria-describedby="start-hint"
                value={startValue}
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
        ready && (
          // One live region: screen readers hear the new figures as inputs change.
          <div aria-live="polite" className="flex flex-1 flex-col gap-6 [&>*:last-child]:flex-1">
            {/* Which method the chart and tables below break down; both are always compared. */}
            <div className="space-y-2">
              <p id={`${panelId}-show`} className="text-sm font-medium">
                {p.showFor}
              </p>
              <div role="radiogroup" aria-labelledby={`${panelId}-show`} className="grid grid-cols-2 gap-3">
                {STRATEGIES.map((strategy) => {
                  const on = selected === strategy
                  const text = p.strategies[strategy]
                  return (
                    <button
                      key={strategy}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setSelected(strategy)}
                      className={cn(
                        'rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        on
                          ? 'border-primary/60 bg-primary/[0.07]'
                          : 'border-white/[0.06] bg-card hover:border-white/25',
                      )}
                    >
                      <span className="block text-sm font-medium">{text.benefit}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {text.name} · {text.rule.toLowerCase()}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <Card>
              <CardContent className="space-y-4 p-5">
                {/* Both methods, figure by figure. */}
                <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
                  <span />
                  {STRATEGIES.map((strategy) => (
                    <span
                      key={strategy}
                      className={cn(
                        'text-xs font-medium',
                        selected === strategy ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {p.strategies[strategy].name}
                    </span>
                  ))}
                  <Row
                    label={p.debtFree}
                    values={[avalanche, snowball].map((r) =>
                      r.debtFreeDate ? monthYear(r.debtFreeDate) : r.months === null ? p.never : duration(r.months),
                    )}
                    selected={selected}
                    strong
                  />
                  {form.startDate && (
                    <Row
                      label={p.timeToPayOff}
                      values={[avalanche, snowball].map((r) => (r.months === null ? p.never : duration(r.months)))}
                      selected={selected}
                    />
                  )}
                  <Row
                    label={p.totalInterest}
                    values={[avalanche, snowball].map((r) => money(r.totalInterest))}
                    selected={selected}
                  />
                  <Row
                    label={p.totalPaid}
                    values={[avalanche, snowball].map((r) => money(r.totalPaid))}
                    selected={selected}
                  />
                  <Row
                    label={p.savedVsMinimums}
                    values={[avalanche, snowball].map((r) => saved(r, baseline))}
                    selected={selected}
                    accent
                  />
                </dl>
                <Note>{verdict()}</Note>
                <p className="text-xs text-muted-foreground">
                  {baseline.months === null
                    ? p.baselineNever
                    : p.baseline(duration(baseline.months), whole(baseline.totalInterest))}
                </p>
                {(avalanche.months === null || snowball.months === null) && <Note tone="warning">{p.neverPays}</Note>}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm font-medium">{p.payoffOrder}</p>
                <ol className="mt-3 space-y-2">
                  {shown!.outcomes.map((outcome, index) => (
                    <li key={outcome.debtId} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">
                        <span className="mr-2 text-xs tabular-nums text-muted-foreground">{index + 1}</span>
                        {outcome.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{when(outcome.payoffMonth)}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        )
      }
      detail={
        ready && (
          <>
            <DebtBalanceChart
              avalanche={avalanche}
              snowball={snowball}
              baseline={baseline}
              selected={selected}
              debts={form.debts.map(({ id, name }) => ({ id, name }))}
              currency={config.currency}
            />

            <section className={cn(CHART_PANEL, 'space-y-4')}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-sm font-medium">
                  {p.payoffOrder} · {p.strategies[selected].name}
                </h2>
              </div>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm tabular-nums">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left font-normal">
                        #
                      </th>
                      <th scope="col" className="px-4 py-2 text-left font-normal">
                        {p.colDebt}
                      </th>
                      <th scope="col" className="px-4 py-2 text-right font-normal">
                        {p.colPaidOff}
                      </th>
                      <th scope="col" className="px-4 py-2 text-right font-normal">
                        {p.colInterest}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown!.outcomes.map((outcome, index) => (
                      <tr key={outcome.debtId} className="border-t border-white/[0.04]">
                        <td className="px-4 py-2 text-muted-foreground">{index + 1}</td>
                        <th scope="row" className="px-4 py-2 text-left font-medium">
                          {outcome.name}
                        </th>
                        <td className="px-4 py-2 text-right">
                          {outcome.payoffMonth === null
                            ? p.never
                            : `${when(outcome.payoffMonth)} · ${duration(outcome.payoffMonth)}`}
                        </td>
                        <td className="px-4 py-2 text-right">{money(outcome.interest)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* What the figures assume, with the detail they qualify. */}
              <p className="text-[11px] leading-relaxed text-muted-foreground/80">{p.notes}</p>

              <div className="border-t pt-4">
                <button
                  type="button"
                  aria-expanded={scheduleOpen}
                  aria-controls={`${panelId}-schedule`}
                  onClick={() => setScheduleOpen((open) => !open)}
                  className="flex items-center gap-1.5 rounded-md text-sm font-medium transition-colors hover:text-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronRight
                    className={cn('h-4 w-4 transition-transform', scheduleOpen && 'rotate-90')}
                    aria-hidden
                  />
                  {p.schedule}
                </button>
                <div
                  id={`${panelId}-schedule`}
                  hidden={!scheduleOpen}
                  className="mt-3 max-h-80 overflow-auto rounded-xl border"
                >
                  <table className="w-full text-right text-sm tabular-nums">
                    <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left font-normal">
                          {p.colMonth}
                        </th>
                        <th scope="col" className="px-4 py-2 font-normal">
                          {p.colPayment}
                        </th>
                        <th scope="col" className="px-4 py-2 font-normal">
                          {p.colScheduleInterest}
                        </th>
                        <th scope="col" className="px-4 py-2 font-normal">
                          {p.colBalance}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown!.schedule.map((row) => (
                        <tr key={row.month} className="border-t border-white/[0.04]">
                          <th scope="row" className="px-4 py-2 text-left font-normal text-muted-foreground">
                            {form.startDate ? monthYear(addMonths(form.startDate, row.month)) : row.month}
                          </th>
                          <td className="px-4 py-2">{money(row.payment)}</td>
                          <td className="px-4 py-2">{money(row.interest)}</td>
                          <td className="px-4 py-2">{money(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )
      }
      // A consolidation loan is the usual alternative to paying debts down one by one.
      assistant={
        <BestOffers
          variant="sidebar"
          category="personal-loan"
          country={country}
          amount={form.debts.reduce((sum, debt) => sum + (Number.isFinite(debt.balance) ? debt.balance : 0), 0)}
          termMonths={Math.min(60, Math.max(12, avalanche?.months ?? 36))}
        />
      }
    />
  )

  /** Interest and time saved against paying only the minimums. */
  function saved(result: PlanResult, base: PlanResult) {
    const interest = whole(Math.max(0, base.totalInterest - result.totalInterest))
    if (result.months === null) return p.never
    if (base.months === null) return p.savedNoTime(interest)
    const months = base.months - result.months
    return months > 0 ? p.saved(interest, duration(months)) : p.savedNoTime(interest)
  }

  /** Descriptive, not prescriptive: what each method does better. */
  function verdict() {
    if (!avalanche || !snowball) return ''
    if (form.debts.length === 1) return p.verdictSingle
    if (plan.sameResult) return p.verdictSame
    const cheaper = whole(Math.max(0, snowball.totalInterest - avalanche.totalInterest))
    const earlier =
      avalanche.months !== null && snowball.months !== null && snowball.months > avalanche.months
        ? p.verdictEarlier(duration(snowball.months - avalanche.months))
        : p.verdictSameFinish
    const first =
      avalanche.firstClearedMonth !== null &&
      snowball.firstClearedMonth !== null &&
      avalanche.firstClearedMonth > snowball.firstClearedMonth
        ? p.verdictFirst(duration(avalanche.firstClearedMonth - snowball.firstClearedMonth))
        : ''
    return p.verdictInterest(cheaper) + earlier + first
  }
}

function Row({
  label,
  values,
  selected,
  strong = false,
  accent = false,
}: {
  label: string
  values: string[]
  selected: Strategy
  strong?: boolean
  accent?: boolean
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      {values.map((value, index) => (
        <dd
          key={index}
          className={cn(
            'tabular-nums',
            strong ? 'text-lg font-medium tracking-tight' : 'font-medium',
            accent && 'text-emerald-400',
            STRATEGIES[index] !== selected && !accent && 'text-foreground/70',
          )}
        >
          {value}
        </dd>
      ))}
    </>
  )
}

function Note({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'warning' }) {
  return (
    <p
      className={cn(
        'rounded-md px-3 py-2 text-xs leading-relaxed',
        tone === 'warning' ? 'bg-amber-400/10 text-amber-200' : 'bg-muted text-muted-foreground',
      )}
    >
      {children}
    </p>
  )
}
