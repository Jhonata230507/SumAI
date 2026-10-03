'use client'

import { useState } from 'react'
import { Sparkles, TriangleAlert, CheckCircle2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/common/LoadingState'
import { useI18n } from '@/lib/i18n/client'
import type { AnalysisContext, AnalysisResult, Insight } from '@/features/ai/types'

export interface AIAnalysisProps {
  context: AnalysisContext
  onAsk?: (question: string) => void
}

const SEVERITY_ICON = {
  good: CheckCircle2,
  attention: TriangleAlert,
  info: Info,
} as const

/**
 * On-demand analysis of the current result.
 *
 * Deliberately not automatic: the calculation is the product and it must be
 * useful before any model runs. This also keeps a page view from costing a
 * model call. The model answers in the page language (see features/ai/prompts).
 */
export function AIAnalysis({ context, onAsk }: AIAnalysisProps) {
  const { t } = useI18n()
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runAnalysis() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      })

      if (!response.ok) throw new Error()
      setResult((await response.json()) as AnalysisResult)
    } catch {
      setError(t.ai.unavailable)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          {t.ai.title}
        </CardTitle>

        {!result && !loading && (
          <Button size="sm" variant="outline" onClick={runAnalysis}>
            {t.ai.explainButton}
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {loading && <LoadingState variant="text" rows={4} label={t.ai.analysing} />}

        {error && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button size="sm" variant="outline" onClick={runAnalysis}>
              {t.common.tryAgain}
            </Button>
          </div>
        )}

        {result && (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed">{result.summary}</p>

            {result.insights.length > 0 && (
              <ul className="space-y-3">
                {result.insights.map((insight) => (
                  <InsightRow key={insight.id} insight={insight} />
                ))}
              </ul>
            )}

            {result.suggestedQuestions.length > 0 && onAsk && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t.ai.askFollowUp}
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.suggestedQuestions.map((question) => (
                    <Button key={question} size="sm" variant="outline" onClick={() => onAsk(question)}>
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <p className="border-t pt-3 text-xs text-muted-foreground">{t.ai.disclaimer}</p>
          </div>
        )}

        {!result && !loading && !error && (
          <p className="text-sm text-muted-foreground">
            {t.ai.intro} {t.ai.disclaimer}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function InsightRow({ insight }: { insight: Insight }) {
  const Icon = SEVERITY_ICON[insight.severity] ?? Info
  const tone =
    insight.severity === 'attention'
      ? 'text-amber-400'
      : insight.severity === 'good'
        ? 'text-emerald-400'
        : 'text-muted-foreground'

  return (
    <li className="flex gap-3">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} />
      <div>
        <p className="text-sm font-medium">{insight.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{insight.body}</p>
      </div>
    </li>
  )
}
