'use client'

import { CurrencyInput } from '@/components/common/CurrencyInput'
import { OptionalTag } from '@/components/common/OptionalTag'
import { PercentageInput } from '@/components/common/PercentageInput'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { InvestmentSchema } from '@/features/calculators/investment/schema'
import { useI18n } from '@/lib/i18n/client'
import { formatPercent } from '@/lib/utils/format-number'
import type { CountryConfig } from '@/types/country'

const FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'annually'] as const

export interface UsInvestmentFieldsProps {
  country: CountryConfig
  input: InvestmentSchema
  errors: Record<string, string>
  /** Used while the matching fields are empty. */
  defaults: { annualReturn: number; inflationRate: number; taxRate: number }
  onChange: <K extends keyof InvestmentSchema>(key: K, value: InvestmentSchema[K]) => void
}

/**
 * The US investing form. Required: what you start with and for how long. The
 * expected return is pre-set to a long-run average the user can override; the
 * contribution, its frequency, fees, inflation and taxes are optional, each
 * saying what is used when it is left empty.
 */
export function UsInvestmentFields({ country, input, errors, defaults, onChange }: UsInvestmentFieldsProps) {
  const { t } = useI18n()
  const u = t.investment.us
  const pct = (value: number) => formatPercent(value, country.locale)
  const empty = (value: number | undefined) => !Number.isFinite(value ?? Number.NaN)

  return (
    <>
      <CurrencyInput
        id="initial"
        label={u.initial}
        currency={country.currency}
        value={input.initialAmount}
        error={errors.initialAmount}
        onChange={(v) => onChange('initialAmount', v)}
      />

      <CurrencyInput
        id="contribution"
        optional
        label={u.contribution}
        currency={country.currency}
        value={input.contribution}
        onChange={(v) => onChange('contribution', v)}
      />

      <div className="space-y-1.5">
        <div className="flex items-end justify-between gap-2">
          <Label htmlFor="frequency">{u.frequency}</Label>
          <OptionalTag />
        </div>
        <Select
          id="frequency"
          value={input.contributionFrequency}
          options={FREQUENCIES.map((value) => ({ value, label: t.savings.us.frequencies[value] }))}
          onChange={(event) =>
            onChange('contributionFrequency', event.target.value as InvestmentSchema['contributionFrequency'])
          }
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="years">{u.duration}</Label>
        <div className="relative">
          <Input
            id="years"
            type="number"
            inputMode="numeric"
            min={1}
            max={60}
            step={1}
            value={Number.isFinite(input.years) ? String(input.years) : ''}
            aria-invalid={Boolean(errors.years)}
            className="pr-14 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            onChange={(event) => {
              const raw = event.target.value.trim()
              onChange('years', raw === '' ? Number.NaN : Math.round(Number(raw)))
            }}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {u.years}
          </span>
        </div>
        {errors.years && <p className="text-xs text-destructive">{errors.years}</p>}
      </div>

      <PercentageInput
        id="return"
        label={u.expectedReturn}
        hint={t.investment.expectedReturnHint}
        value={input.annualReturn}
        error={errors.annualReturn}
        placeholder={(defaults.annualReturn * 100).toFixed(2)}
        note={empty(input.annualReturn) ? u.returnNote(pct(defaults.annualReturn)) : undefined}
        onChange={(v) => onChange('annualReturn', v)}
      />

      <PercentageInput
        id="fees"
        optional
        label={u.fees}
        hint={t.investment.feesHint}
        step={0.01}
        value={input.feeRate}
        note={empty(input.feeRate) ? u.feesNote : undefined}
        onChange={(v) => onChange('feeRate', v)}
      />

      <PercentageInput
        id="inflation"
        optional
        label={u.inflation}
        value={input.inflationRate}
        placeholder={(defaults.inflationRate * 100).toFixed(2)}
        note={empty(input.inflationRate) ? u.inflationNote(pct(defaults.inflationRate)) : undefined}
        onChange={(v) => onChange('inflationRate', v)}
      />

      <PercentageInput
        id="tax"
        optional
        label={u.tax}
        value={input.taxRate ?? Number.NaN}
        placeholder={(defaults.taxRate * 100).toFixed(2)}
        note={empty(input.taxRate) ? u.taxNote(pct(defaults.taxRate)) : undefined}
        onChange={(v) => onChange('taxRate', v)}
      />
    </>
  )
}
