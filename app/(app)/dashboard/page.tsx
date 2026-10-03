import type { Metadata } from 'next'
import { Layers, Target } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { GoalCard } from '@/components/goals/GoalCard'
import { ScenarioTimeline } from '@/components/scenarios/ScenarioTimeline'
import { FinancialCoach } from '@/components/ai/FinancialCoach'
import { listScenarios } from '@/features/scenarios/create-scenario'
import { listGoals } from '@/features/goals/goal-store'
import { calculateGoal } from '@/features/goals/calculate-goal'
import { assessProfile, getProfile } from '@/features/profile/financial-profile'
import { getRequestContext } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestContext()
  return { title: t.dashboard.metaTitle }
}

export default async function DashboardPage() {
  const { country, language, t } = await getRequestContext()

  const [scenarios, goals, profile] = await Promise.all([
    listScenarios().catch(() => []),
    listGoals().catch(() => []),
    getProfile().catch(() => null),
  ])

  const health = profile ? assessProfile(profile, language) : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t.dashboard.title}</h1>
        <p className="mt-1 text-muted-foreground">{t.dashboard.intro}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label={t.dashboard.savedScenarios} value={String(scenarios.length)} />
        <Stat label={t.dashboard.activeGoals} value={String(goals.length)} />
        <Stat
          label={t.dashboard.profileHealth}
          value={health && health.signals.length > 0 ? `${health.score}/100` : '—'}
          detail={health?.missing.length ? t.dashboard.addDetails : undefined}
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-8">
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t.dashboard.goals}</h2>
              <ButtonLink size="sm" variant="outline" href="/goals">
                {t.dashboard.allGoals}
              </ButtonLink>
            </div>

            <div className="mt-4">
              {goals.length === 0 ? (
                <EmptyState
                  icon={<Target className="h-8 w-8" />}
                  title={t.dashboard.noGoalsTitle}
                  description={t.dashboard.noGoalsDescription}
                  action={
                    <ButtonLink size="sm" href="/goals">
                      {t.dashboard.createGoal}
                    </ButtonLink>
                  }
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {goals.slice(0, 4).map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      currency={country.currency}
                      projection={calculateGoal({ ...goal, countryCode: country.code })}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <section>
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base">{t.dashboard.recentScenarios}</CardTitle>
                <ButtonLink size="sm" variant="ghost" href="/scenarios">
                  {t.common.viewAll}
                </ButtonLink>
              </CardHeader>
              <CardContent>
                {scenarios.length === 0 ? (
                  <EmptyState
                    icon={<Layers className="h-8 w-8" />}
                    title={t.dashboard.nothingSaved}
                    description={t.dashboard.nothingSavedDescription}
                    action={
                      <ButtonLink size="sm" href="/calculators">
                        {t.dashboard.openCalculator}
                      </ButtonLink>
                    }
                  />
                ) : (
                  <ScenarioTimeline scenarios={scenarios} />
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        <FinancialCoach variant="panel" />
      </div>
    </div>
  )
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
      </CardContent>
    </Card>
  )
}
