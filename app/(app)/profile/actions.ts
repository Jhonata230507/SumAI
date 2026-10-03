'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { saveProfile } from '@/features/profile/financial-profile'
import { countryCode, nonNegativeAmount } from '@/lib/validation/common'

const profileInput = z.object({
  countryCode,
  monthlyIncome: nonNegativeAmount.nullable(),
  monthlyExpenses: nonNegativeAmount.nullable(),
  existingDebtPayments: nonNegativeAmount.nullable(),
  creditScore: z.number().int().min(150).max(950).nullable(),
  savingsBalance: nonNegativeAmount.nullable(),
  riskTolerance: z.enum(['conservative', 'balanced', 'aggressive']).nullable(),
})

export async function saveProfileAction(raw: unknown) {
  const input = profileInput.parse(raw)
  await saveProfile(input)
  revalidatePath('/profile')
  revalidatePath('/dashboard')
}
