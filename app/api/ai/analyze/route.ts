import { NextResponse } from 'next/server'
import { z } from 'zod'
import { analyzeFinancialResult } from '@/features/ai/analyze-financial-result'
import { UnsafeOutputError } from '@/lib/ai/safety'
import { calculatorId, countryCode } from '@/lib/validation/common'

const scalar = z.union([z.number(), z.string()])

const analyzeRequest = z.object({
  calculatorId,
  countryCode,
  currency: z.string().length(3),
  inputs: z.record(scalar),
  results: z.record(scalar),
  profile: z
    .object({
      monthlyIncome: z.number().optional(),
      monthlyExpenses: z.number().optional(),
      creditScore: z.number().optional(),
    })
    .optional(),
})

export async function POST(request: Request) {
  const parsed = analyzeRequest.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid analysis request' }, { status: 400 })
  }

  // TODO: rate-limit per user / IP before launch — each call is a paid model request.

  try {
    const analysis = await analyzeFinancialResult(parsed.data)
    return NextResponse.json(analysis)
  } catch (error) {
    if (error instanceof UnsafeOutputError) {
      return NextResponse.json(
        { error: 'We could not produce a reliable explanation for this result.' },
        { status: 422 },
      )
    }
    console.error('[api/ai/analyze]', error)
    return NextResponse.json({ error: 'Analysis is unavailable right now' }, { status: 503 })
  }
}
