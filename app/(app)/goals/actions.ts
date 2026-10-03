'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createGoal, deleteGoal, updateGoal } from '@/features/goals/goal-store'
import { nonNegativeAmount, positiveAmount, rate } from '@/lib/validation/common'

const goalInput = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(['savings', 'debt-free', 'purchase', 'retirement']),
  targetAmount: positiveAmount,
  currentAmount: nonNegativeAmount,
  targetDate: z
    .string()
    .transform((v) => (v === '' ? null : v))
    .nullable(),
  monthlyContribution: nonNegativeAmount.nullable(),
  annualReturn: rate,
})

export async function createGoalAction(raw: unknown) {
  const input = goalInput.parse(raw)
  const goal = await createGoal(input)
  revalidatePath('/goals')
  revalidatePath('/dashboard')
  redirect(`/goals/${goal.id}`)
}

export async function updateGoalAction(id: string, raw: unknown) {
  const input = goalInput.partial().parse(raw)
  await updateGoal(id, input)
  revalidatePath(`/goals/${id}`)
  revalidatePath('/goals')
}

export async function deleteGoalAction(id: string) {
  await deleteGoal(id)
  revalidatePath('/goals')
  redirect('/goals')
}
