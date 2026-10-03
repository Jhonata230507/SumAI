'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { AIChat } from './AIChat'
import { cn } from '@/lib/utils/cn'
import { useI18n } from '@/lib/i18n/client'

export interface FinancialCoachProps {
  /** Rendered inline in the dashboard, or as a floating panel elsewhere. */
  variant?: 'panel' | 'floating'
  className?: string
}

/** The persistent coach. Has the user's saved scenarios and goals for context. */
export function FinancialCoach({ variant = 'panel', className }: FinancialCoachProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  if (variant === 'panel') {
    return (
      <div className={cn('flex h-[560px] flex-col rounded-xl border', className)}>
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <MessageCircle className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">{t.ai.coachTitle}</p>
        </div>
        <AIChat className="flex-1" />
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.ai.openCoach}
        className={cn(
          'fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full',
          'bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105',
          open && 'hidden',
          className,
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed bottom-6 right-6 z-40 flex h-[520px] w-[min(380px,calc(100vw-3rem))] flex-col rounded-xl border bg-background shadow-2xl">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <MessageCircle className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">{t.ai.coachTitle}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.common.close}
              className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <AIChat className="flex-1" />
        </div>
      )}
    </>
  )
}
