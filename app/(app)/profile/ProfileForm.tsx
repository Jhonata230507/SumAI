'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { CurrencyInput } from '@/components/common/CurrencyInput'
import { COUNTRY_LIST } from '@/lib/countries'
import { useI18n } from '@/lib/i18n/client'
import { saveProfileAction } from './actions'
import type { ProfileInput } from '@/features/profile/types'
import type { CountryConfig } from '@/types/country'

export interface ProfileFormProps {
  initial: ProfileInput
  country: CountryConfig
}

const RISK_LEVELS = ['conservative', 'balanced', 'aggressive'] as const

/**
 * Every field is optional and stated as such. The profile only sharpens
 * eligibility checks and coaching — nothing in the product requires it.
 */
export function ProfileForm({ initial, country }: ProfileFormProps) {
  const { t } = useI18n()
  const [values, setValues] = useState<ProfileInput>(initial)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) {
    setSaved(false)
    setValues((current) => ({ ...current, [key]: value }))
  }

  const range = country.rules.creditScoreRange

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t.profile.formTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">{t.profile.formIntro}</p>
      </CardHeader>

      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            startTransition(async () => {
              await saveProfileAction(values)
              setSaved(true)
            })
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="country">{t.countries.label}</Label>
            <Select
              id="country"
              value={values.countryCode}
              options={COUNTRY_LIST.map((c) => ({ value: c.code, label: t.countries[c.code] }))}
              onChange={(e) => set('countryCode', e.target.value as ProfileInput['countryCode'])}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CurrencyInput
              id="income"
              label={t.profile.income}
              currency={country.currency}
              value={values.monthlyIncome ?? 0}
              onChange={(v) => set('monthlyIncome', v || null)}
            />
            <CurrencyInput
              id="expenses"
              label={t.profile.expenses}
              currency={country.currency}
              value={values.monthlyExpenses ?? 0}
              onChange={(v) => set('monthlyExpenses', v || null)}
            />
            <CurrencyInput
              id="debts"
              label={t.profile.debts}
              currency={country.currency}
              value={values.existingDebtPayments ?? 0}
              onChange={(v) => set('existingDebtPayments', v || null)}
            />
            <CurrencyInput
              id="savings"
              label={t.profile.savings}
              currency={country.currency}
              value={values.savingsBalance ?? 0}
              onChange={(v) => set('savingsBalance', v || null)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="score">
                {country.terminology.creditScore} ({range.min}–{range.max})
              </Label>
              <Input
                id="score"
                type="number"
                inputMode="numeric"
                min={range.min}
                max={range.max}
                value={values.creditScore ?? ''}
                onChange={(e) =>
                  set('creditScore', e.target.value === '' ? null : Number(e.target.value))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="risk">{t.profile.risk}</Label>
              <Select
                id="risk"
                value={values.riskTolerance ?? ''}
                placeholder={t.profile.preferNot}
                options={RISK_LEVELS.map((level) => ({
                  value: level,
                  label: t.profile.riskOptions[level],
                }))}
                onChange={(e) =>
                  set('riskTolerance', (e.target.value || null) as ProfileInput['riskTolerance'])
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-3 border-t pt-4">
            <Button type="submit" disabled={pending}>
              {pending ? t.common.saving : t.profile.saveProfile}
            </Button>
            {saved && <p className="text-sm text-muted-foreground">{t.profile.saved}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
