'use client'

import Link from 'next/link'
import { formatDate } from '@/lib/utils/dates'
import { useI18n } from '@/lib/i18n/client'
import type { Scenario } from '@/types/scenario'

export interface ScenarioTimelineProps {
  scenarios: Scenario[]
  limit?: number
}

/** Recent activity across all calculators, newest first. */
export function ScenarioTimeline({ scenarios, limit = 8 }: ScenarioTimelineProps) {
  const { t, locale } = useI18n()
  const recent = [...scenarios]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit)

  if (recent.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.scenarios.timelineEmpty}</p>
  }

  return (
    <ol className="relative space-y-5 border-l pl-5">
      {recent.map((scenario) => (
        <li key={scenario.id} className="relative">
          <span
            aria-hidden
            className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary"
          />
          <Link href={`/scenarios/${scenario.id}`} className="text-sm font-medium hover:underline">
            {scenario.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {t.calculators[scenario.calculatorId].shortTitle} ·{' '}
            {formatDate(scenario.updatedAt, locale)}
          </p>
        </li>
      ))}
    </ol>
  )
}
