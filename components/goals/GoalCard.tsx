'use client'

import Link from 'next/link'
import { CalendarClock, CheckCircle2, TriangleAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GoalProgress } from './GoalProgress'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatMonthYear } from '@/lib/utils/dates'
import { useI18n } from '@/lib/i18n/client'
import type { Goal } from '@/types/user'
import type { GoalProjection } from '@/features/goals/types'
import type { CurrencyCode } from '@/types/currency'

export interface GoalCardProps {
  goal: Goal
  projection: GoalProjection
  currency: CurrencyCode
}

export function GoalCard({ goal, projection, currency }: GoalCardProps) {
  const { t, locale } = useI18n()

  return (
    <Link href={`/goals/${goal.id}`} className="group block">
      <Card className="h-full transition-colors group-hover:border-primary/40">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{goal.name}</p>
              <Badge variant="secondary" className="mt-1">
                {t.goals.types[goal.type]}
              </Badge>
            </div>

            {projection.onTrack ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t.goals.onTrack}
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1">
                <TriangleAlert className="h-3 w-3" />
                {t.goals.behind}
              </Badge>
            )}
          </div>

          <GoalProgress
            current={goal.currentAmount}
            target={goal.targetAmount}
            currency={currency}
            onTrack={projection.onTrack}
          />

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            {projection.projectedDate
              ? t.goals.projected(formatMonthYear(projection.projectedDate, locale))
              : t.goals.addContribution}
          </div>

          {!projection.onTrack &&
            projection.contributionGap !== null &&
            projection.contributionGap > 0 && (
              <p className="text-xs text-muted-foreground">
                {t.goals.gapHint(formatCurrency(projection.contributionGap, currency))}
              </p>
            )}
        </CardContent>
      </Card>
    </Link>
  )
}
