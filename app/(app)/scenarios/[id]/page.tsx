import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScenarioEditor } from '@/components/scenarios/ScenarioEditor'
import { getCalculator } from '@/data/calculators/definitions'
import { getScenario } from '@/features/scenarios/create-scenario'
import { COMPARABLE_FIELDS } from '@/features/scenarios/calculate-difference'
import { getRequestContext } from '@/lib/i18n/server'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatMonths } from '@/lib/utils/format-number'
import { formatDate } from '@/lib/utils/dates'

interface ScenarioPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ScenarioPageProps): Promise<Metadata> {
  const [{ t }, scenario] = await Promise.all([getRequestContext(), getScenario((await params).id)])
  return { title: scenario?.name ?? t.scenarios.metaTitle }
}

export default async function ScenarioPage({ params }: ScenarioPageProps) {
  const { id } = await params
  const scenario = await getScenario(id)
  if (!scenario) notFound()

  const { country, t } = await getRequestContext()
  const locale = country.locale
  const calculator = getCalculator(scenario.calculatorId)
  const fields = COMPARABLE_FIELDS[scenario.calculatorId]
  const fieldLabels = t.fields[scenario.calculatorId] ?? {}

  // Carries the saved inputs as query params. TODO: calculator pages do not read
  // searchParams yet, so this opens the calculator on its defaults for now.
  const reopenHref = `/calculators/${calculator.slug}?${new URLSearchParams(
    Object.entries(scenario.inputs).map(([k, v]) => [k, String(v)]),
  ).toString()}`

  return (
    <div className="space-y-6">
      <Link
        href="/scenarios"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.scenarios.allScenarios}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{scenario.name}</h1>
            <Badge variant="secondary">{t.calculators[scenario.calculatorId].shortTitle}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.scenarios.savedUpdated(
              formatDate(scenario.createdAt, locale),
              formatDate(scenario.updatedAt, locale),
            )}
          </p>
        </div>

        <ButtonLink variant="outline" href={reopenHref}>
          {t.scenarios.openInCalculator}
          <ExternalLink className="h-4 w-4" />
        </ButtonLink>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t.scenarios.results}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                {fields.map((field) => {
                  const value = scenario.results[field.key]
                  if (value === undefined) return null
                  return (
                    <div key={field.key}>
                      <dt className="text-sm text-muted-foreground">
                        {fieldLabels[field.key] ?? field.label}
                      </dt>
                      <dd className="mt-0.5 text-xl font-semibold tabular-nums">
                        {field.format === 'months'
                          ? formatMonths(value, locale)
                          : formatCurrency(value, country.currency)}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t.scenarios.inputs}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {Object.entries(scenario.inputs).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2 border-b py-1.5">
                    <dt className="text-muted-foreground">{t.inputKeys[key] ?? humanize(key)}</dt>
                    <dd className="tabular-nums">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>

        <ScenarioEditor scenario={scenario} />
      </div>
    </div>
  )
}

/** Fallback for input keys with no translation: camelCase to words. */
function humanize(key: string): string {
  const spaced = key.replace(/([A-Z])/g, ' $1').toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
