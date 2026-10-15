'use client'

import { useMemo, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { Plus, Trash2 } from 'lucide-react'
import { CalculatorLayout } from '@/components/calculator/CalculatorLayout'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultSummary } from '@/components/calculator/ResultSummary'
import { ComparisonChart } from '@/components/charts/ComparisonChart'
import { AIAnalysis } from '@/components/ai/AIAnalysis'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { RateInput } from '@/components/common/RateInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { calculateDebtPayoff, compareStrategies } from '@/features/calculators/debt-payoff/calculation'
import { debtPayoffSchema, type DebtPayoffSchema, type DebtSchema } from '@/features/calculators/debt-payoff/schema'
import { useCalculator } from '@/features/calculators/use-calculator'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatMonths } from '@/lib/utils/format-number'
import { useI18n } from '@/lib/i18n/client'
import type { CountryConfig } from '@/types/country'
import { BestOffers } from '@/components/calculator/BestOffers'

export interface DebtPayoffCalculatorProps {
  country: CountryConfig
  initial: DebtPayoffSchema
  header: ReactNode
  related: ReactNode
}

export function DebtPayoffCalculator({ country, initial, header, related }: DebtPayoffCalculatorProps) {
  const { t } = useI18n()
  // Opens with one empty debt and no budget: the user types their own.
  const start = useMemo(
    () => ({
      start: {
        debts: initial.debts
          .slice(0, 1)
          .map((debt) => ({ ...debt, balance: Number.NaN, annualRate: Number.NaN, minimumPayment: Number.NaN })),
        monthlyBudget: Number.NaN,
      },
    }),
    [initial],
  )
  const { input, committed, errors, result, set, ready, update, reset } = useCalculator(
    debtPayoffSchema,
    calculateDebtPayoff,
    initial,
    start,
  )

  const comparison = useMemo(() => compareStrategies(committed), [committed])
  const minimums = input.debts.reduce(
    (sum, debt) => sum + (Number.isFinite(debt.minimumPayment) ? debt.minimumPayment : 0),
    0,
  )

  function updateDebt(id: string, patch: Partial<DebtSchema>) {
    set(
      'debts',
      input.debts.map((debt) => (debt.id === id ? { ...debt, ...patch } : debt)),
    )
  }

  function addDebt() {
    set('debts', [
      ...input.debts,
      {
        id: `debt-${Date.now()}`,
        name: t.debtPayoff.newDebtName(input.debts.length + 1),
        balance: 1_000,
        annualRate: 0.18,
        minimumPayment: 35,
      },
    ])
  }

  function removeDebt(id: string) {
    if (input.debts.length === 1) return
    set(
      'debts',
      input.debts.filter((debt) => debt.id !== id),
    )
  }

  const debtName = (id: string) => committed.debts.find((d) => d.id === id)?.name ?? id

  return (
    <CalculatorLayout
      ready={ready}
      header={header}
      related={related}
      form={
        <CalculatorForm title={t.debtPayoff.formTitle} onReset={reset} error={errors.monthlyBudget}>
          <div className="space-y-3">
            {input.debts.map((debt, index) => (
              <div key={debt.id} className="space-y-4 rounded-xl border border-white/[0.06] bg-muted/30 p-4">
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={t.debtPayoff.debtNameLabel(index + 1)}
                    value={debt.name}
                    onChange={(e) => updateDebt(debt.id, { name: e.target.value })}
                    className="h-8 font-medium"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    aria-label={t.debtPayoff.remove(debt.name)}
                    disabled={input.debts.length === 1}
                    onClick={() => removeDebt(debt.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <CurrencyInput
                  id={`${debt.id}-balance`}
                  label={t.debtPayoff.balance}
                  currency={country.currency}
                  value={debt.balance}
                  onChange={(v) => updateDebt(debt.id, { balance: v })}
                />
                {/* One field per row: the rate keeps room for its E.A./M.V. switch and note. */}
                <RateInput
                  id={`${debt.id}-rate`}
                  country={country}
                  label={t.debtPayoff.rate}
                  value={debt.annualRate}
                  onChange={(v) => updateDebt(debt.id, { annualRate: v })}
                />
                <CurrencyInput
                  id={`${debt.id}-minimum`}
                  label={t.debtPayoff.minimum}
                  currency={country.currency}
                  value={debt.minimumPayment}
                  onChange={(v) => updateDebt(debt.id, { minimumPayment: v })}
                />
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" className="w-full" onClick={addDebt}>
              <Plus className="h-4 w-4" />
              {t.debtPayoff.addDebt}
            </Button>
          </div>

          <CurrencyInput
            id="budget"
            label={t.debtPayoff.budget}
            hint={minimums > 0 ? t.debtPayoff.budgetHint(formatCurrency(minimums, country.currency)) : undefined}
            currency={country.currency}
            value={input.monthlyBudget}
            onChange={(v) => set('monthlyBudget', v)}
          />

          {/* Strategy as two option cards: each says what it is good for. */}
          <div className="space-y-1.5">
            <p id="strategy-label" className="text-sm font-medium">
              {t.debtPayoff.strategyLabel}
            </p>
            <div role="radiogroup" aria-labelledby="strategy-label" className="grid grid-cols-2 gap-2">
              {(
                [
                  ['avalanche', t.debtPayoff.avalanche, t.debtPayoff.avalancheHint],
                  ['snowball', t.debtPayoff.snowball, t.debtPayoff.snowballHint],
                ] as const
              ).map(([value, title, hint]) => {
                const selected = input.strategy === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => update({ ...input, strategy: value })}
                    className={cn(
                      'rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected
                        ? 'border-primary/60 bg-primary/[0.07]'
                        : 'border-white/[0.06] bg-muted/30 hover:border-white/25',
                    )}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium leading-snug">{title}</span>
                      <span
                        aria-hidden
                        className={cn(
                          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                          selected ? 'border-primary bg-primary' : 'border-white/30',
                        )}
                      >
                        {selected && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-muted-foreground">{hint}</span>
                  </button>
                )
              })}
            </div>
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
                key: 'monthsToDebtFree',
                label: t.debtPayoff.debtFreeIn,
                value: result.monthsToDebtFree,
                format: 'months',
                emphasis: 'primary',
              },
              {
                key: 'totalInterest',
                label: t.debtPayoff.totalInterest,
                value: result.totalInterest,
                format: 'currency',
              },
              { key: 'totalPaid', label: t.debtPayoff.totalPaid, value: result.totalPaid, format: 'currency' },
            ]}
          />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t.debtPayoff.compareTitle}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {comparison.interestDifference > 0
                  ? t.debtPayoff.compareSaves(formatCurrency(comparison.interestDifference, result.currency))
                  : t.debtPayoff.compareSame}
              </p>
            </CardHeader>
            <CardContent>
              <ComparisonChart
                currency={result.currency}
                caption={t.debtPayoff.compareCaption}
                bars={[
                  {
                    label: t.debtPayoff.avalanche,
                    value: comparison.avalanche.totalInterest,
                    highlight: committed.strategy === 'avalanche',
                  },
                  {
                    label: t.debtPayoff.snowball,
                    value: comparison.snowball.totalInterest,
                    highlight: committed.strategy === 'snowball',
                  },
                ]}
              />
            </CardContent>
          </Card>
        </>
      }
      // Recommended credits beside the numbers; the AI explanation is set aside for now.
      assistant={
        <BestOffers
          variant="sidebar"
          category="personal-loan"
          country={country}
          amount={committed.debts.reduce((sum, debt) => sum + debt.balance, 0)}
          termMonths={Math.min(60, Math.max(12, result.monthsToDebtFree))}
        />
      }
      explanation={
        <AIAnalysis
          context={{
            calculatorId: 'debt-payoff',
            countryCode: country.code,
            currency: result.currency,
            inputs: {
              strategy: committed.strategy,
              monthlyBudget: committed.monthlyBudget,
              debtCount: committed.debts.length,
              totalBalance: committed.debts.reduce((s, d) => s + d.balance, 0),
            },
            results: {
              monthsToDebtFree: result.monthsToDebtFree,
              totalInterest: result.totalInterest,
              avalancheInterest: comparison.avalanche.totalInterest,
              snowballInterest: comparison.snowball.totalInterest,
            },
          }}
        />
      }
      detail={
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t.debtPayoff.payoffOrder}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{t.debtPayoff.colDebt}</TableHead>
                    <TableHead>{t.debtPayoff.colPaidOffAfter}</TableHead>
                    <TableHead>{t.debtPayoff.colInterest}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.payoffOrder.map((id, index) => {
                    const detail = result.perDebt.find((d) => d.debtId === id)!
                    return (
                      <TableRow key={id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{debtName(id)}</TableCell>
                        <TableCell>{formatMonths(detail.payoffMonth, country.locale)}</TableCell>
                        <TableCell>{formatCurrency(detail.totalInterest, result.currency)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      }
    />
  )
}
