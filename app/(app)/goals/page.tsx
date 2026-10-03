import type { Metadata } from 'next'
import { Target } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { GoalCard } from '@/components/goals/GoalCard'
import { listGoals } from '@/features/goals/goal-store'
import { calculateGoal } from '@/features/goals/calculate-goal'
import { getRequestContext } from '@/lib/i18n/server'
import { NewGoalButton } from './NewGoalButton'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestContext()
  return { title: t.goals.metaTitle }
}

export default async function GoalsPage() {
  const { country, t } = await getRequestContext()
  const goals = await listGoals().catch(() => [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t.goals.title}</h1>
          <p className="mt-1 text-muted-foreground">{t.goals.intro}</p>
        </div>
        <NewGoalButton currency={country.currency} />
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target className="h-8 w-8" />}
          title={t.goals.emptyTitle}
          description={t.goals.emptyDescription}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
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
  )
}
