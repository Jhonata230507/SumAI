import 'server-only'

import { generate } from '@/lib/ai/client'
import { AI_DISCLAIMER } from '@/lib/ai/safety'
import { ANALYSIS_SYSTEM, contextBlock } from './prompts'
import type { AnalysisContext, AnalysisResult, Insight } from './types'

/**
 * Turns a completed calculation into readable insight.
 * The model returns JSON; a malformed response degrades to a plain summary
 * rather than throwing, because an AI outage should never break the calculator.
 */
export async function analyzeFinancialResult(
  context: AnalysisContext,
): Promise<AnalysisResult> {
  const { text } = await generate({
    task: 'analysis',
    system: ANALYSIS_SYSTEM,
    messages: [{ role: 'user', content: contextBlock(context) }],
  })

  return parseAnalysis(text)
}

export function parseAnalysis(text: string): AnalysisResult {
  try {
    const json = JSON.parse(extractJson(text)) as Partial<AnalysisResult>

    return {
      summary: json.summary ?? '',
      insights: (json.insights ?? []).filter(isInsight),
      suggestedQuestions: json.suggestedQuestions ?? [],
      disclaimer: AI_DISCLAIMER,
    }
  } catch {
    return {
      summary: text.slice(0, 600),
      insights: [],
      suggestedQuestions: [],
      disclaimer: AI_DISCLAIMER,
    }
  }
}

function isInsight(value: unknown): value is Insight {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Insight).title === 'string' &&
    typeof (value as Insight).body === 'string'
  )
}

/** Models sometimes wrap JSON in prose or a code fence. Pull out the object. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  return start !== -1 && end > start ? text.slice(start, end + 1) : text
}
