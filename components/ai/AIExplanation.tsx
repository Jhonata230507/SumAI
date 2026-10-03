'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { LoadingState } from '@/components/common/LoadingState'
import { useI18n } from '@/lib/i18n/client'
import type { ExplanationResult } from '@/features/ai/types'

export interface AIExplanationProps {
  term: string
  children?: React.ReactNode
}

/**
 * Inline "what does this mean?" for a single term. Fetches on open, so a page
 * full of these costs nothing until one is actually used. The country, and so
 * the answer language, comes from the page context.
 */
export function AIExplanation({ term, children }: AIExplanationProps) {
  const { t, countryCode } = useI18n()
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<ExplanationResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setOpen(true)
    if (result || loading) return

    setLoading(true)
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, countryCode }),
      })
      if (!response.ok) throw new Error()
      setResult((await response.json()) as ExplanationResult)
    } catch {
      setResult({ term, explanation: t.ai.explanationUnavailable, example: null })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={load}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {children ?? term}
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={result?.term ?? term}
        closeLabel={t.common.close}
      >
        {loading ? (
          <LoadingState variant="text" rows={4} label={t.ai.explaining(term)} />
        ) : (
          result && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed">{result.explanation}</p>

              {result.example && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t.ai.forExample}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed">{result.example}</p>
                </div>
              )}
            </div>
          )
        )}
      </Dialog>
    </>
  )
}
