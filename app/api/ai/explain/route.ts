import { NextResponse } from 'next/server'
import { z } from 'zod'
import { explainTerm } from '@/features/ai/explain-scenario'
import { countryCode } from '@/lib/validation/common'

const explainRequest = z.object({
  term: z.string().trim().min(2).max(80),
  countryCode,
})

export async function POST(request: Request) {
  const parsed = explainRequest.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid explain request' }, { status: 400 })
  }

  try {
    // TODO: definitions do not vary per user — cache by (term, country) to skip repeat model calls.
    const explanation = await explainTerm(parsed.data.term, parsed.data.countryCode)
    return NextResponse.json(explanation)
  } catch (error) {
    console.error('[api/ai/explain]', error)
    return NextResponse.json({ error: 'Explanation is unavailable right now' }, { status: 503 })
  }
}
