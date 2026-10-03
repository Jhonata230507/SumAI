'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { GoalForm } from '@/components/goals/GoalForm'
import { useI18n } from '@/lib/i18n/client'
import { createGoalAction } from './actions'
import type { CurrencyCode } from '@/types/currency'

export function NewGoalButton({ currency }: { currency: CurrencyCode }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {t.goals.newGoal}
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={t.goals.newGoal}
        description={t.goals.dialogDescription}
        closeLabel={t.common.close}
      >
        <GoalForm
          currency={currency}
          submitLabel={t.goals.createGoal}
          onSubmit={async (values) => {
            await createGoalAction(values)
          }}
        />
      </Dialog>
    </>
  )
}
