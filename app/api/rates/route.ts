import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getBenchmarks, type CountryBenchmarks } from '@/lib/countries'
import { countryCode } from '@/lib/validation/common'

const ratesQuery = z.object({
  country: countryCode,
  category: z.enum(['mortgage', 'car-loan', 'personal-loan', 'savings']).optional(),
  days: z.coerce.number().int().min(1).max(730).default(90),
})

/** Maps a product category onto the static benchmark used when no live data exists. */
const FALLBACK_KEY: Record<string, keyof CountryBenchmarks> = {
  mortgage: 'mortgage30Year',
  'car-loan': 'carLoanNew',
  'personal-loan': 'personalLoan',
  savings: 'savingsHighYield',
}

/**
 * GET /api/rates?country=us&category=mortgage&days=90
 *
 * Returns the benchmark history from the rates table. With no rows yet — or no
 * database at all in local development — it falls back to the static
 * benchmarks in data/countries, and says so in `source`.
 */
export async function GET(request: NextRequest) {
  const parsed = ratesQuery.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', issues: parsed.error.issues }, { status: 400 })
  }

  const { country, category, days } = parsed.data
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

  try {
    const supabase = await createClient()
    let query = supabase
      .from('rates')
      .select('category, rate, effective_date, benchmark, source')
      .eq('country_code', country)
      .not('benchmark', 'is', null)
      .gte('effective_date', since)
      .order('effective_date', { ascending: true })

    if (category) query = query.eq('category', category)

    const { data, error } = await query
    if (error) throw error

    if (data && data.length > 0) {
      return NextResponse.json(
        { country, source: 'live', rates: data },
        { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
      )
    }
  } catch (error) {
    console.warn('[api/rates] falling back to static benchmarks', error)
  }

  const benchmarks = getBenchmarks(country)
  const categories = category ? [category] : Object.keys(FALLBACK_KEY)

  return NextResponse.json({
    country,
    source: 'static-benchmark',
    rates: categories.map((c) => ({
      category: c,
      rate: benchmarks[FALLBACK_KEY[c]],
      effective_date: null,
      benchmark: FALLBACK_KEY[c],
      source: 'data/countries',
    })),
  })
}
