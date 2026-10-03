'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  /** Accessible label for the close button, in the page language. */
  closeLabel?: string
  className?: string
  children: React.ReactNode
}

/**
 * Modal built on the native <dialog> element, so focus trapping, Escape and
 * the top layer come from the platform rather than a scroll-lock hack.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  closeLabel = 'Close',
  className,
  children,
}: DialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return

    if (open && !node.open) node.showModal()
    if (!open && node.open) node.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={() => onOpenChange(false)}
      onClick={(event) => {
        // Clicking the backdrop lands on the dialog element itself.
        if (event.target === ref.current) onOpenChange(false)
      }}
      className={cn(
        'w-full max-w-lg rounded-2xl border bg-card p-6 text-foreground shadow-2xl backdrop:bg-black/70',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label={closeLabel}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </dialog>
  )
}
