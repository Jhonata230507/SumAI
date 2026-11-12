'use client'

import { CurrencyInput } from '@/components/common/CurrencyInput'
import { OptionalTag } from '@/components/common/OptionalTag'
import { PercentageInput } from '@/components/common/PercentageInput'
import { TermInput } from '@/components/common/TermInput'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { SavingsSchema } from '@/features/calculators/savings/schema'
import { useI18n } from '@/lib/i18n/client'
import { formatPercent } from '@/lib/utils/format-number'
import type { CountryConfig } from '@/types/country'

export const SAVINGS_FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'annually'] as const

const COMPOUNDING = [
  { value: 365, key: 'daily' },
  { value: 12, key: 'monthly' },
  { value: 4, key: 'quarterly' },
  { value: 1, key: 'annually' },
] as const

export interface UsSavingsFieldsProps {
  country: CountryConfig
  input: SavingsSchema
  errors: Record<string, string>
  /** Used while the rate and inflation fields are empty. */
  defaultRate: number
  defaultInflation: number
  onChange: <K extends keyof SavingsSchema>(key: K, value: SavingsSchema[K]) => void
}

/**
 * The US savings form: one goal-based flow, in the order the page asks. On
 * desktop the first six fields show and the last two scroll inside the box.
 * Required: where you start, where you want to get, and how long you have. Optional: a recurring contribution
 * (left empty, the page works out the one you need), how often it goes in, the
 * rate (a typical high-yield rate until typed), compounding, and an inflation
 * assumption for the goal in today's money.
 */
export function UsSavingsFields({
  country,
  input,
  errors,
  defaultRate,
  defaultInflation,
  onChange,
}: UsSavingsFieldsProps) {
  const { t } = useI18n()
  const s = t.savings
  const u = s.us
  const pct = (value: number) => formatPercent(value, country.locale)

  return (
    <>
      <CurrencyInput
        id="initial"
        label={u.initialBalance}
        currency={country.currency}
        value={input.initialAmount}
        error={errors.initialAmount}
        onChange={(v) => onChange('initialAmount', v)}
      />

      <CurrencyInput
        id="target"
        label={u.goal}
        currency={country.currency}
        value={input.targetAmount ?? Number.NaN}
        error={errors.targetAmount}
        onChange={(v) => onChange('targetAmount', v)}
      />

      <div className="space-y-1.5">
        <div className="flex items-end justify-between gap-2">
          <Label htmlFor="frequency">{u.frequency}</Label>
          <OptionalTag />
        </div>
        <Select
          id="frequency"
          value={input.depositFrequency}
          options={SAVINGS_FREQUENCIES.map((value) => ({ value, label: u.frequencies[value] }))}
          onChange={(event) => onChange('depositFrequency', event.target.value as SavingsSchema['depositFrequency'])}
        />
      </div>

      <TermInput
        id="horizon"
        label={u.duration}
        months={input.months}
        onChange={(months) => onChange('months', months)}
      />

      <PercentageInput
        id="rate"
        optional
        label={u.rate}
        value={input.annualRate}
        error={errors.annualRate}
        placeholder={(defaultRate * 100).toFixed(2)}
        hint={Number.isFinite(input.annualRate) ? undefined : u.rateNote(pct(defaultRate))}
        onChange={(v) => onChange('annualRate', v)}
      />

      <CurrencyInput
        id="deposit"
        optional
        label={u.contribution}
        currency={country.currency}
        value={input.deposit}
        hint={u.contributionHint}
        onChange={(v) => onChange('deposit', v)}
      />

      <div className="space-y-1.5">
        <div className="flex items-end justify-between gap-2">
          <Label htmlFor="compounding">{s.compounding}</Label>
          <OptionalTag />
        </div>
        <Select
          id="compounding"
          value={String(input.compoundsPerYear)}
          options={COMPOUNDING.map((option) => ({
            value: String(option.value),
            label: s.compoundingOptions[option.key],
          }))}
          onChange={(event) => onChange('compoundsPerYear', Number(event.target.value))}
        />
      </div>

      <PercentageInput
        id="inflation"
        optional
        label={u.inflation}
        value={input.inflationRate ?? Number.NaN}
        placeholder={(defaultInflation * 100).toFixed(2)}
        hint={Number.isFinite(input.inflationRate ?? Number.NaN) ? undefined : u.inflationNote(pct(defaultInflation))}
        onChange={(v) => onChange('inflationRate', v)}
      />
    </>
  )
}
