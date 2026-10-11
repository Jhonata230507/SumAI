'use client'

import { useI18n } from '@/lib/i18n/client'
import { cn } from '@/lib/utils/cn'

/** "Optional", quietly, at the right end of a field's label row. */
export function OptionalTag({ className }: { className?: string }) {
  const { t } = useI18n()
  return <span className={cn('text-xs font-normal text-muted-foreground/70', className)}>{t.common.optional}</span>
}
