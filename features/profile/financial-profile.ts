import { roundTo } from '@/lib/calculations/rounding'
import { getCountry } from '@/lib/countries'
import { getDictionary } from '@/lib/i18n'
import { formatPercent } from '@/lib/utils/format-number'
import { createClient } from '@/lib/supabase/server'
import type { FinancialProfile } from '@/types/user'
import type { Language } from '@/types/common'
import type { ProfileHealth, ProfileInput } from './types'

/** Three months of expenses is the usual floor for an emergency fund. */
const EMERGENCY_FUND_FLOOR = 3
const HEALTHY_SAVINGS_RATE = 0.2

export async function getProfile(): Promise<FinancialProfile | null> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (error || !data) return null
  return toProfile(data)
}

export async function saveProfile(input: ProfileInput): Promise<FinancialProfile> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to save your profile')

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: auth.user.id,
        country_code: input.countryCode,
        monthly_income: input.monthlyIncome,
        monthly_expenses: input.monthlyExpenses,
        existing_debt_payments: input.existingDebtPayments,
        credit_score: input.creditScore,
        savings_balance: input.savingsBalance,
        risk_tolerance: input.riskTolerance,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single()

  if (error) throw new Error(`Could not save profile: ${error.message}`)
  return toProfile(data)
}

/**
 * A plain read of the numbers the user gave us. Deliberately conservative: it
 * reports ratios and flags, and never claims to be a credit assessment.
 */
export function assessProfile(profile: ProfileInput, language: Language = 'en'): ProfileHealth {
  const country = getCountry(profile.countryCode)
  const text = getDictionary(language).profile.signals
  const pct = (value: number) => formatPercent(value, country.locale, 0)
  const signals: ProfileHealth['signals'] = []
  const missing: string[] = []

  const { monthlyIncome, monthlyExpenses, existingDebtPayments, savingsBalance } = profile

  if (monthlyIncome === null) missing.push('monthlyIncome')
  if (monthlyExpenses === null) missing.push('monthlyExpenses')
  if (savingsBalance === null) missing.push('savingsBalance')

  let debtToIncome: number | null = null
  if (monthlyIncome && existingDebtPayments !== null) {
    debtToIncome = roundTo(existingDebtPayments / monthlyIncome, 4)
    const ceiling = country.rules.maxDebtToIncome

    signals.push({
      label: text.dtiLabel,
      status: debtToIncome <= ceiling * 0.7 ? 'good' : debtToIncome <= ceiling ? 'watch' : 'attention',
      detail: text.dtiDetail(pct(debtToIncome), pct(ceiling)),
    })
  }

  let savingsRate: number | null = null
  if (monthlyIncome && monthlyExpenses !== null) {
    savingsRate = roundTo((monthlyIncome - monthlyExpenses) / monthlyIncome, 4)

    signals.push({
      label: text.savingsRateLabel,
      status: savingsRate >= HEALTHY_SAVINGS_RATE ? 'good' : savingsRate > 0 ? 'watch' : 'attention',
      detail: savingsRate > 0 ? text.savingsRatePositive(pct(savingsRate)) : text.savingsRateNegative,
    })
  }

  let emergencyFundMonths: number | null = null
  if (savingsBalance !== null && monthlyExpenses) {
    emergencyFundMonths = roundTo(savingsBalance / monthlyExpenses, 1)

    signals.push({
      label: text.emergencyLabel,
      status:
        emergencyFundMonths >= 6
          ? 'good'
          : emergencyFundMonths >= EMERGENCY_FUND_FLOOR
            ? 'watch'
            : 'attention',
      detail: text.emergencyDetail(emergencyFundMonths),
    })
  }

  return {
    score: scoreFrom(signals),
    debtToIncome,
    savingsRate,
    emergencyFundMonths,
    signals,
    missing,
  }
}

function scoreFrom(signals: ProfileHealth['signals']): number {
  if (signals.length === 0) return 0
  const points = { good: 100, watch: 60, attention: 25 }
  return Math.round(signals.reduce((sum, s) => sum + points[s.status], 0) / signals.length)
}

function toProfile(row: Record<string, unknown>): FinancialProfile {
  return {
    userId: row.user_id as string,
    countryCode: row.country_code as FinancialProfile['countryCode'],
    monthlyIncome: (row.monthly_income as number) ?? null,
    monthlyExpenses: (row.monthly_expenses as number) ?? null,
    existingDebtPayments: (row.existing_debt_payments as number) ?? null,
    creditScore: (row.credit_score as number) ?? null,
    savingsBalance: (row.savings_balance as number) ?? null,
    riskTolerance: (row.risk_tolerance as FinancialProfile['riskTolerance']) ?? null,
    updatedAt: row.updated_at as string,
  }
}
