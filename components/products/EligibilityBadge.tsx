'use client'

import { Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { useI18n } from '@/lib/i18n/client'

export interface EligibilityBadgeProps {
  eligible: boolean
  /** Why not, when the user does not qualify. */
  reasons?: string[]
  /** True when there is nothing to check against yet. */
  unknown?: boolean
}

/**
 * States whether the user qualifies, and why not when they do not.
 *
 * Carries an icon and a word, never colour alone. With no profile to check
 * against, it says so rather than implying approval.
 */
export function EligibilityBadge({ eligible, reasons = [], unknown }: EligibilityBadgeProps) {
  const { t } = useI18n()

  if (unknown) {
    return (
      <Tooltip content={t.products.eligibilityNotCheckedHint}>
        <Badge variant="secondary">{t.products.eligibilityNotChecked}</Badge>
      </Tooltip>
    )
  }

  if (eligible) {
    return (
      <Badge variant="success" className="gap-1">
        <Check className="h-3 w-3" />
        {t.products.likelyEligible}
      </Badge>
    )
  }

  return (
    <Tooltip content={reasons.join(' · ') || t.products.requirementsNotMet}>
      <Badge variant="warning" className="gap-1">
        <X className="h-3 w-3" />
        {t.products.mayNotQualify}
      </Badge>
    </Tooltip>
  )
}
