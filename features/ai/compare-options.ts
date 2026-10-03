import 'server-only'

import { generate } from '@/lib/ai/client'
import { AI_DISCLAIMER } from '@/lib/ai/safety'
import { COMPARE_SYSTEM, responseLanguage } from './prompts'
import type { ComparisonResult } from './types'
import type { CountryCode } from '@/types/country'

export interface ComparisonOption {
  name: string
  figures: Record<string, number | string>
}

/** Weighs options the user is choosing between, without declaring a winner. */
export async function compareOptions(
  options: ComparisonOption[],
  context: { countryCode: CountryCode; currency: string },
): Promise<ComparisonResult> {
  const body = options
    .map((option) =>
      [
        `Option: ${option.name}`,
        ...Object.entries(option.figures).map(([k, v]) => `  ${k}: ${v}`),
      ].join('\n'),
    )
    .join('\n\n')

  const { text } = await generate({
    task: 'analysis',
    system: `${COMPARE_SYSTEM}\n\n${responseLanguage(context.countryCode)}`,
    messages: [
      {
        role: 'user',
        content: `Country: ${context.countryCode}\nCurrency: ${context.currency}\n\n${body}`,
      },
    ],
  })

  try {
    const json = JSON.parse(text) as Omit<ComparisonResult, 'disclaimer'>
    return { ...json, disclaimer: AI_DISCLAIMER }
  } catch {
    return { verdict: text, tradeoffs: [], disclaimer: AI_DISCLAIMER }
  }
}
