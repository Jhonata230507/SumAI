import { createClient } from '@/lib/supabase/server'
import type { Scenario } from '@/types/scenario'
import type { CreateScenarioInput, UpdateScenarioInput } from './types'
import type { Database } from '@/database/types'

type ScenarioUpdate = Database['public']['Tables']['scenarios']['Update']

/** Saves a calculation so the user can come back to it and compare against it. */
export async function createScenario(input: CreateScenarioInput): Promise<Scenario> {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to save a scenario')

  const { data, error } = await supabase
    .from('scenarios')
    .insert({
      user_id: auth.user.id,
      calculator_id: input.calculatorId,
      name: input.name,
      inputs: input.inputs,
      results: input.results,
      notes: input.notes ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`Could not save scenario: ${error.message}`)
  return toScenario(data)
}

export async function updateScenario(input: UpdateScenarioInput): Promise<Scenario> {
  const supabase = await createClient()

  const patch: ScenarioUpdate = { updated_at: new Date().toISOString() }
  if (input.name !== undefined) patch.name = input.name
  if (input.notes !== undefined) patch.notes = input.notes
  if (input.inputs !== undefined) patch.inputs = input.inputs
  if (input.results !== undefined) patch.results = input.results

  const { data, error } = await supabase
    .from('scenarios')
    .update(patch)
    .eq('id', input.id)
    .select()
    .single()

  if (error) throw new Error(`Could not update scenario: ${error.message}`)
  return toScenario(data)
}

export async function deleteScenario(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('scenarios').delete().eq('id', id)
  if (error) throw new Error(`Could not delete scenario: ${error.message}`)
}

export async function listScenarios(calculatorId?: string): Promise<Scenario[]> {
  const supabase = await createClient()

  let builder = supabase.from('scenarios').select('*').order('updated_at', { ascending: false })
  if (calculatorId) builder = builder.eq('calculator_id', calculatorId)

  const { data, error } = await builder
  if (error) throw new Error(`Could not load scenarios: ${error.message}`)
  return (data ?? []).map(toScenario)
}

export async function getScenario(id: string): Promise<Scenario | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('scenarios').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return toScenario(data)
}

function toScenario(row: Record<string, unknown>): Scenario {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    calculatorId: row.calculator_id as Scenario['calculatorId'],
    name: row.name as string,
    inputs: row.inputs as Scenario['inputs'],
    results: row.results as Scenario['results'],
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}
