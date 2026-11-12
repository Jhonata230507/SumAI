'use client'

import { Info } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'

/**
 * A field's description behind an info icon, beside its label. Pass `id` and
 * point the field's `aria-describedby` at it, so screen readers still read it.
 */
export function InfoTip({ content, id }: { content: string; id?: string }) {
  return (
    <Tooltip content={content} id={id}>
      <Info className="h-3.5 w-3.5 text-muted-foreground transition-colors hover:text-foreground" aria-hidden />
    </Tooltip>
  )
}
