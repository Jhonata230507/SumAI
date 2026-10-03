import type { Metadata } from 'next'
import { CheckCircle2, CircleAlert, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { assessProfile, getProfile } from '@/features/profile/financial-profile'
import { resolveCountry } from '@/lib/countries'
import { getRequestContext } from '@/lib/i18n/server'
import { ProfileForm } from './ProfileForm'
import type { ProfileInput } from '@/features/profile/types'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestContext()
  return { title: t.profile.metaTitle }
}

const STATUS_ICON = { good: CheckCircle2, watch: Eye, attention: CircleAlert } as const

export default async function ProfilePage() {
  const { country: cookieCountry, language, t } = await getRequestContext()
  const profile = await getProfile().catch(() => null)

  const initial: ProfileInput = profile ?? {
    countryCode: cookieCountry.code,
    monthlyIncome: null,
    monthlyExpenses: null,
    existingDebtPayments: null,
    creditScore: null,
    savingsBalance: null,
    riskTolerance: null,
  }

  const country = resolveCountry(initial.countryCode)
  const health = assessProfile(initial, language)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t.profile.title}</h1>
        <p className="mt-1 text-muted-foreground">{t.profile.intro}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <ProfileForm initial={initial} country={country} />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.profile.quickRead}</CardTitle>
            <p className="text-xs text-muted-foreground">{t.profile.quickReadNote}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {health.signals.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.profile.addIncome}</p>
            ) : (
              health.signals.map((signal) => {
                const Icon = STATUS_ICON[signal.status]
                return (
                  <div key={signal.label} className="flex gap-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {signal.label}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {t.profile.statuses[signal.status]}
                        </span>
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{signal.detail}</p>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
