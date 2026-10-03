import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResultSummary } from '@/components/calculator/ResultSummary'
import { GoalProgress } from '@/components/goals/GoalProgress'
import { GrowthChart } from '@/components/charts/GrowthChart'
import { getGoal } from '@/features/goals/goal-store'
import { calculateGoal } from '@/features/goals/calculate-goal'
import { projectGoalVariants } from '@/features/goals/project-goal'
import { getRequestContext } from '@/lib/i18n/server'
import { formatMonthYear } from '@/lib/utils/dates'
import { formatMonths } from '@/lib/utils/format-number'
import { deleteGoalAction } from '../actions'

interface GoalPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: GoalPageProps): Promise<Metadata> {
  const [{ t }, goal] = await Promise.all([getRequestContext(), getGoal((await params).id)])
  return { title: goal?.name ?? t.goals.metaTitle }
}

export default async function GoalPage({ params }: GoalPageProps) {
  const { id } = await params
  const goal = await getGoal(id)
  if (!goal) notFound()

  const { country, t } = await getRequestContext()
  const locale = country.locale
  const input = { ...goal, countryCode: country.code }
  const projection = calculateGoal(input)
  const variants = projectGoalVariants(input)

  const describeChange = (monthsSaved: number | null) => {
    if (monthsSaved === null) return '—'
    if (monthsSaved > 0) return t.goals.sooner(formatMonths(monthsSaved, locale))
    if (monthsSaved < 0) return t.goals.later(formatMonths(-monthsSaved, locale))
    return t.goals.noChange
  }

  return (
    <div className="space-y-6">
      <Link
        href="/goals"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.goals.allGoals}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{goal.name}</h1>
        <form action={deleteGoalAction.bind(null, goal.id)}>
          <Button type="submit" variant="ghost" className="text-destructive">
            <Trash2 className="h-4 w-4" />
            {t.common.delete}
          </Button>
        </form>
      </div>

      <Card>
        <CardContent className="p-6">
          <GoalProgress
            current={goal.currentAmount}
            target={goal.targetAmount}
            currency={country.currency}
            onTrack={projection.onTrack}
          />
        </CardContent>
      </Card>

      <ResultSummary
        currency={country.currency}
        locale={locale}
        figures={[
          {
            key: 'projected',
            label: projection.onTrack ? t.goals.onTrackToReach : t.goals.atCurrentPace,
            value: projection.monthsRemaining ?? Infinity,
            format: 'months',
            emphasis: 'primary',
            detail: projection.projectedDate
              ? t.goals.around(formatMonthYear(projection.projectedDate, locale))
              : t.goals.addContribution,
          },
          ...(projection.requiredMonthly !== null
            ? [
                {
                  key: 'required',
                  label: t.goals.neededMonthly,
                  value: projection.requiredMonthly,
                  format: 'currency' as const,
                },
              ]
            : []),
          {
            key: 'contribution',
            label: t.goals.contributingNow,
            value: goal.monthlyContribution ?? 0,
            format: 'currency',
          },
        ]}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t.goals.whatWouldChange}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {variants.map((variant) => {
            const text = t.goals.variants[variant.id] ?? variant
            return (
              <div key={variant.id} className="flex items-center gap-4 rounded-lg border p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{text.label}</p>
                  <p className="text-xs text-muted-foreground">{text.description}</p>
                </div>
                <p className="text-sm tabular-nums">{describeChange(variant.monthsSaved)}</p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <GrowthChart
            points={projection.series.points}
            currency={country.currency}
            caption={t.goals.chartCaption}
          />
        </CardContent>
      </Card>
    </div>
  )
}
