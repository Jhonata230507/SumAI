import 'server-only'

import { stream } from '@/lib/ai/client'
import { getCountry } from '@/lib/countries'
import { COACH_SYSTEM, responseLanguage } from './prompts'
import type { CoachMessage } from './types'
import type { CountryCode } from '@/types/country'
import type { Goal } from '@/types/user'
import type { Scenario } from '@/types/scenario'

export interface CoachContext {
  countryCode: CountryCode
  scenarios: Pick<Scenario, 'name' | 'calculatorId' | 'results'>[]
  goals: Pick<Goal, 'name' | 'targetAmount' | 'currentAmount' | 'targetDate'>[]
}

/**
 * Streams a coaching reply. The user's saved work is folded into the system
 * prompt rather than the message history so it cannot be argued away by
 * anything typed into the chat box.
 */
export function coachReply(messages: CoachMessage[], context: CoachContext) {
  const country = getCountry(context.countryCode)

  const summary = [
    `Country: ${country.name}. Currency: ${country.currency}.`,
    '',
    context.scenarios.length ? 'Saved scenarios:' : 'The user has no saved scenarios yet.',
    ...context.scenarios.map(
      (s) => `- ${s.name} (${s.calculatorId}): ${JSON.stringify(s.results)}`,
    ),
    '',
    context.goals.length ? 'Goals:' : 'The user has no goals yet.',
    ...context.goals.map(
      (g) => `- ${g.name}: ${g.currentAmount} of ${g.targetAmount} by ${g.targetDate ?? 'no date'}`,
    ),
  ].join('\n')

  return stream({
    task: 'chat',
    system: `${COACH_SYSTEM}\n\n${responseLanguage(context.countryCode)}\n\nWhat you know about this user:\n${summary}`,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })
}
