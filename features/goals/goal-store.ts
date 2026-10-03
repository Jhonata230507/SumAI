import { createClient } from '@/lib/supabase/server'
import type { Goal } from '@/types/user'
import type { Database } from '@/database/types'

type GoalUpdate = Database['public']['Tables']['goals']['Update']

export interface SaveGoalInput {
  name: string
  type: Goal['type']
  targetAmount: number
  currentAmount: number
  targetDate: string | null
  monthlyContribution: number | null
  annualReturn: number
}

export async function listGoals(): Promise<Goal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Could not load goals: ${error.message}`)
  return (data ?? []).map(toGoal)
}

export async function getGoal(id: string): Promise<Goal | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('goals').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return toGoal(data)
}

export async function createGoal(input: SaveGoalInput): Promise<Goal> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to create a goal')

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: auth.user.id,
      name: input.name,
      type: input.type,
      target_amount: input.targetAmount,
      current_amount: input.currentAmount,
      target_date: input.targetDate,
      monthly_contribution: input.monthlyContribution,
      annual_return: input.annualReturn,
      linked_scenario_id: null,
    })
    .select()
    .single()

  if (error) throw new Error(`Could not create goal: ${error.message}`)
  return toGoal(data)
}

export async function updateGoal(id: string, input: Partial<SaveGoalInput>): Promise<Goal> {
  const supabase = await createClient()

  const patch: GoalUpdate = { updated_at: new Date().toISOString() }
  if (input.name !== undefined) patch.name = input.name
  if (input.type !== undefined) patch.type = input.type
  if (input.targetAmount !== undefined) patch.target_amount = input.targetAmount
  if (input.currentAmount !== undefined) patch.current_amount = input.currentAmount
  if (input.targetDate !== undefined) patch.target_date = input.targetDate
  if (input.monthlyContribution !== undefined) patch.monthly_contribution = input.monthlyContribution
  if (input.annualReturn !== undefined) patch.annual_return = input.annualReturn

  const { data, error } = await supabase.from('goals').update(patch).eq('id', id).select().single()
  if (error) throw new Error(`Could not update goal: ${error.message}`)
  return toGoal(data)
}

export async function deleteGoal(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) throw new Error(`Could not delete goal: ${error.message}`)
}

function toGoal(row: Record<string, unknown>): Goal {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    type: row.type as Goal['type'],
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    targetDate: (row.target_date as string) ?? null,
    monthlyContribution: row.monthly_contribution === null ? null : Number(row.monthly_contribution),
    annualReturn: Number(row.annual_return ?? 0.04),
    createdAt: row.created_at as string,
  }
}
