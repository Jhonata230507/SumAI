import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { findProducts } from '@/features/products/find-products'
import { countryCode } from '@/lib/validation/common'

const productsQuery = z.object({
  category: z.enum(['mortgage', 'car-loan', 'personal-loan', 'savings']),
  country: countryCode,
  amount: z.coerce.number().positive().optional(),
  term: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

/** GET /api/products?category=mortgage&country=us&amount=300000&term=360 */
export async function GET(request: NextRequest) {
  const parsed = productsQuery.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', issues: parsed.error.issues }, { status: 400 })
  }

  const { category, country, amount, term, limit } = parsed.data

  try {
    const products = await findProducts({
      category,
      countryCode: country,
      amount,
      termMonths: term,
      limit,
    })

    return NextResponse.json(
      { products, total: products.length },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
    )
  } catch (error) {
    console.error('[api/products]', error)
    return NextResponse.json({ error: 'Products are unavailable right now' }, { status: 503 })
  }
}
