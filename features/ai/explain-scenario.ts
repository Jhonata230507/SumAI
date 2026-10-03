import 'server-only'

import { generate } from '@/lib/ai/client'
import { getCountry } from '@/lib/countries'
import { EXPLAIN_SYSTEM, responseLanguage } from './prompts'
import type { ExplanationResult } from './types'
import type { CountryCode } from '@/types/country'

/** Explains a single term, in the wording that country uses for it. */
export async function explainTerm(
  term: string,
  countryCode: CountryCode,
): Promise<ExplanationResult> {
  const country = getCountry(countryCode)

  const { text } = await generate({
    task: 'explain',
    system: `${EXPLAIN_SYSTEM}\n\n${responseLanguage(countryCode)}`,
    messages: [
      {
        role: 'user',
        content: `Term: ${term}\nCountry: ${country.name}\nLocal wording to prefer: ${JSON.stringify(country.terminology)}`,
      },
    ],
    temperature: 0.2,
  })

  try {
    const json = JSON.parse(text) as ExplanationResult
    return { term: json.term ?? term, explanation: json.explanation, example: json.example ?? null }
  } catch {
    return { term, explanation: text, example: null }
  }
}

/** Narrates why one saved scenario differs from another. */
export async function explainScenarioDifference(
  baseLabel: string,
  comparedLabel: string,
  diffs: { label: string; delta: number }[],
  countryCode: CountryCode,
): Promise<string> {
  const country = getCountry(countryCode)

  const { text } = await generate({
    task: 'explain',
    system: `You explain the difference between two saved financial scenarios in two or three sentences. Reference only the deltas given. Currency is ${country.currency}. ${responseLanguage(countryCode)}`,
    messages: [
      {
        role: 'user',
        content: [
          `Base: ${baseLabel}`,
          `Compared: ${comparedLabel}`,
          'Differences:',
          ...diffs.map((d) => `- ${d.label}: ${d.delta}`),
        ].join('\n'),
      },
    ],
  })

  return text
}
