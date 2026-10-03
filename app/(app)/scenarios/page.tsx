import type { Metadata } from 'next'
import { Layers } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { listScenarios } from '@/features/scenarios/create-scenario'
import { getRequestContext } from '@/lib/i18n/server'
import { ScenarioList } from './ScenarioList'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestContext()
  return { title: t.scenarios.metaTitle }
}

export default async function ScenariosPage() {
  const { country, t } = await getRequestContext()
  const scenarios = await listScenarios().catch(() => [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t.scenarios.title}</h1>
        <p className="mt-1 text-muted-foreground">{t.scenarios.intro}</p>
      </div>

      {scenarios.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-8 w-8" />}
          title={t.scenarios.emptyTitle}
          description={t.scenarios.emptyDescription}
          action={<ButtonLink href="/calculators">{t.scenarios.openCalculator}</ButtonLink>}
        />
      ) : (
        <ScenarioList scenarios={scenarios} currency={country.currency} />
      )}
    </div>
  )
}
