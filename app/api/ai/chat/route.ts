import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { coachReply } from '@/features/ai/financial-coach'
import { listScenarios } from '@/features/scenarios/create-scenario'
import { listGoals } from '@/features/goals/goal-store'
import { getCurrentUser } from '@/lib/supabase/server'
import { resolveCountry } from '@/lib/countries'

const chatRequest = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4_000),
      }),
    )
    .min(1)
    .max(40),
})

/**
 * Streams a coaching reply as plain text.
 * The user's saved work is loaded server-side — the client never supplies it,
 * so the coach only ever sees figures this user actually owns.
 */
export async function POST(request: Request) {
  const parsed = chatRequest.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid chat request' }, { status: 400 })
  }

  const user = await getCurrentUser()
  const country = resolveCountry((await cookies()).get('country')?.value)

  const [scenarios, goals] = user
    ? await Promise.all([listScenarios().catch(() => []), listGoals().catch(() => [])])
    : [[], []]

  const result = coachReply(parsed.data.messages, {
    countryCode: country.code,
    scenarios: scenarios.slice(0, 10),
    goals: goals.slice(0, 10),
  })

  return result.toTextStreamResponse()
}
