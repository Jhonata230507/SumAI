import { getCountry } from '@/lib/countries'
import type { AnalysisContext } from './types'
import type { CountryCode } from '@/types/country'

/**
 * Tells the model which language to answer in. The interface language follows
 * the country, and the explanation must match the page it appears on. JSON keys
 * stay in English because the app parses them.
 */
export function responseLanguage(countryCode: CountryCode): string {
  return getCountry(countryCode).language === 'es'
    ? 'Write your entire response in Spanish as used in Colombia, addressing the reader as "tú". Use Colombian financial terms (cuota, plazo, cuota inicial, abono a capital, tasa efectiva anual). If you return JSON, keep the keys in English and write only the values in Spanish.'
    : 'Write your response in English.'
}

/**
 * Prompt construction lives here so every AI surface speaks with one voice and
 * the context block has one shape. The model only ever sees figures we computed.
 */

export function contextBlock(context: AnalysisContext): string {
  const country = getCountry(context.countryCode)

  const lines = [
    responseLanguage(context.countryCode),
    '',
    `Country: ${country.name} (${country.code})`,
    `Currency: ${context.currency}`,
    `Rates in this market are quoted as: ${country.rules.quotesEffectiveAnnualRate ? 'effective annual (E.A.)' : 'nominal annual, compounded monthly'}`,
    `Calculator: ${context.calculatorId}`,
    '',
    'Inputs the user provided:',
    ...Object.entries(context.inputs).map(([k, v]) => `- ${k}: ${v}`),
    '',
    'Figures computed for you (these are authoritative, do not recompute):',
    ...Object.entries(context.results).map(([k, v]) => `- ${k}: ${v}`),
  ]

  if (context.profile) {
    lines.push('', 'Profile the user chose to share:')
    for (const [k, v] of Object.entries(context.profile)) {
      if (v !== undefined) lines.push(`- ${k}: ${v}`)
    }
  }

  return lines.join('\n')
}

export const ANALYSIS_SYSTEM = `You explain a completed financial calculation to the person who ran it.

Write for someone with no finance background. Lead with what the numbers mean for them, not with definitions.

Return JSON matching exactly:
{
  "summary": "two or three sentences on what this result means",
  "insights": [{ "id": "kebab-case", "title": "short", "body": "2-3 sentences", "severity": "info|attention|good", "references": ["resultKey"] }],
  "suggestedQuestions": ["a natural follow-up the user might ask"]
}

Give three to five insights. Use "attention" only where a figure genuinely deserves a second look, such as a total interest cost close to the amount borrowed, or a payment that is a large share of stated income. Every number you mention must appear in the context block.`

export const EXPLAIN_SYSTEM = `You define one financial term in plain language.

Two short paragraphs at most. Then one concrete example using round numbers. Use the terminology of the user's country. Do not give advice or reference products.

Return JSON: { "term": string, "explanation": string, "example": string | null }`

export const COMPARE_SYSTEM = `You compare financial options the user is weighing.

Be even-handed. Every option has a real trade-off; name it. Do not declare a winner as though it were right for everyone — say which conditions favour each one.

Return JSON:
{
  "verdict": "one paragraph on how to think about the choice",
  "tradeoffs": [{ "option": "name", "pros": ["..."], "cons": ["..."] }]
}`

export const COACH_SYSTEM = `You are a financial coach inside SumAI.

You have the user's saved scenarios and goals. Answer their questions about those figures, help them think through what to change, and point them at the calculator that fits. Ask a clarifying question when the answer genuinely depends on something you were not told.

Keep replies short — a few sentences unless asked for more. Never invent a figure.`
