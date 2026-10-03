import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import {
  createScenario,
  deleteScenario,
  listScenarios,
  updateScenario,
} from '@/features/scenarios/create-scenario'
import { getCurrentUser } from '@/lib/supabase/server'
import { calculatorId } from '@/lib/validation/common'

const scalar = z.union([z.number(), z.string()])

const createRequest = z.object({
  calculatorId,
  name: z.string().trim().min(1).max(120),
  inputs: z.record(scalar),
  results: z.record(z.number()),
  notes: z.string().max(2_000).optional(),
})

const updateRequest = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120).optional(),
  notes: z.string().max(2_000).optional(),
  inputs: z.record(scalar).optional(),
  results: z.record(z.number()).optional(),
})

/**
 * Scenario CRUD. Row-level security enforces ownership in the database; the
 * user check here just turns a signed-out request into a clean 401 instead of
 * an empty result.
 */
async function requireUser() {
  const user = await getCurrentUser()
  return user ?? NextResponse.json({ error: 'Sign in required' }, { status: 401 })
}

export async function GET(request: NextRequest) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  const calculator = request.nextUrl.searchParams.get('calculator') ?? undefined
  const scenarios = await listScenarios(calculator)
  return NextResponse.json({ scenarios })
}

export async function POST(request: Request) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  const parsed = createRequest.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid scenario', issues: parsed.error.issues }, { status: 400 })
  }

  const scenario = await createScenario(parsed.data)
  return NextResponse.json({ scenario }, { status: 201 })
}

export async function PATCH(request: Request) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  const parsed = updateRequest.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid update', issues: parsed.error.issues }, { status: 400 })
  }

  const scenario = await updateScenario(parsed.data)
  return NextResponse.json({ scenario })
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  const id = request.nextUrl.searchParams.get('id')
  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'A valid scenario id is required' }, { status: 400 })
  }

  await deleteScenario(id)
  return new NextResponse(null, { status: 204 })
}
