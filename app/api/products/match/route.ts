import { NextResponse } from 'next/server'
import { z } from 'zod'
import { matchProducts } from '@/features/products/match-products'
import { countryCode } from '@/lib/validation/common'

const matchRequest = z.object({
  category: z.enum(['mortgage', 'car-loan', 'personal-loan', 'savings']),
  countryCode,
  amount: z.number().positive().optional(),
  termMonths: z.number().int().positive().optional(),
  creditScore: z.number().int().min(150).max(950).optional(),
  monthlyIncome: z.number().nonnegative().optional(),
  monthlyDebts: z.number().nonnegative().optional(),
  includeIneligible: z.boolean().optional(),
  limit: z.number().int().min(1).max(50).optional(),
})

/**
 * POST, not GET: the body can carry income and credit score, and those should
 * not end up in URLs, server logs or a CDN cache key.
 */
export async function POST(request: Request) {
  const parsed = matchRequest.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid match request' }, { status: 400 })
  }

  try {
    const ranked = await matchProducts(parsed.data)
    return NextResponse.json(ranked, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('[api/products/match]', error)
    return NextResponse.json({ error: 'Matching is unavailable right now' }, { status: 503 })
  }
}
