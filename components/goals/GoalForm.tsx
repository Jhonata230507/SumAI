'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { PercentageInput } from '@/components/common/PercentageInput'
import { useI18n } from '@/lib/i18n/client'
import type { Goal } from '@/types/user'
import type { CurrencyCode } from '@/types/currency'

export interface GoalFormValues {
  name: string
  type: Goal['type']
  targetAmount: number
  currentAmount: number
  targetDate: string
  monthlyContribution: number
  annualReturn: number
}

export interface GoalFormProps {
  initial?: Partial<GoalFormValues>
  currency: CurrencyCode
  submitLabel?: string
  onSubmit: (values: GoalFormValues) => Promise<void> | void
}

const DEFAULTS: GoalFormValues = {
  name: '',
  type: 'savings',
  targetAmount: 10_000,
  currentAmount: 0,
  targetDate: '',
  monthlyContribution: 300,
  annualReturn: 0.04,
}

const GOAL_TYPES: Goal['type'][] = ['savings', 'purchase', 'debt-free', 'retirement']

export function GoalForm({ initial, currency, submitLabel, onSubmit }: GoalFormProps) {
  const { t } = useI18n()
  const [values, setValues] = useState<GoalFormValues>({ ...DEFAULTS, ...initial })
  const [saving, setSaving] = useState(false)

  function set<K extends keyof GoalFormValues>(key: K, value: GoalFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault()
        setSaving(true)
        try {
          await onSubmit(values)
        } finally {
          setSaving(false)
        }
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="goal-name">{t.goals.nameLabel}</Label>
        <Input
          id="goal-name"
          required
          value={values.name}
          placeholder={t.goals.namePlaceholder}
          onChange={(event) => set('name', event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="goal-type">{t.goals.type}</Label>
        <Select
          id="goal-type"
          value={values.type}
          onChange={(event) => set('type', event.target.value as Goal['type'])}
          options={GOAL_TYPES.map((type) => ({ value: type, label: t.goals.typeOptions[type] }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CurrencyInput
          id="goal-target"
          label={t.goals.target}
          currency={currency}
          value={values.targetAmount}
          onChange={(v) => set('targetAmount', v)}
        />
        <CurrencyInput
          id="goal-current"
          label={t.goals.savedSoFar}
          currency={currency}
          value={values.currentAmount}
          onChange={(v) => set('currentAmount', v)}
        />
        <CurrencyInput
          id="goal-monthly"
          label={t.goals.monthly}
          currency={currency}
          value={values.monthlyContribution}
          onChange={(v) => set('monthlyContribution', v)}
        />
        <PercentageInput
          id="goal-return"
          label={t.goals.expectedReturn}
          hint={t.goals.expectedReturnHint}
          value={values.annualReturn}
          onChange={(v) => set('annualReturn', v)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="goal-date">{t.goals.targetDate}</Label>
        <Input
          id="goal-date"
          type="date"
          value={values.targetDate}
          onChange={(event) => set('targetDate', event.target.value)}
        />
      </div>

      <Button type="submit" disabled={saving || !values.name.trim()} className="w-full">
        {saving ? t.common.saving : (submitLabel ?? t.goals.saveGoal)}
      </Button>
    </form>
  )
}
