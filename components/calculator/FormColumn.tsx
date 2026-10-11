'use client'

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * The form's column in the calculator grid.
 *
 * Normally the form sits in the flow and sets its own height. When it becomes
 * `scrollable` (e.g. optional fields expanded), it scrolls inside instead of
 * stretching the row — but it keeps the height it had just before, so opening
 * the extra fields never makes the box shrink. The pinned actions (Restart)
 * stay at the bottom while the fields scroll.
 */
export function FormColumn({ scrollable, children }: { scrollable: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [keepHeight, setKeepHeight] = useState<number | null>(null)

  // Remember the in-flow height, so the scrollable box can keep it.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || scrollable) return
    const measure = () => setKeepHeight(el.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [scrollable])

  if (!scrollable) {
    return (
      <div ref={ref} className="h-full [&>*]:h-full">
        {children}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="relative h-full"
      // Desktop only: on phones the form simply grows in the page.
      style={keepHeight ? ({ '--keep-height': `${keepHeight}px` } as React.CSSProperties) : undefined}
    >
      <div className="lg:min-h-[var(--keep-height)]" aria-hidden />
      <div
        className={cn(
          'lg:absolute lg:inset-0 lg:overflow-y-auto lg:rounded-2xl [&>*]:min-h-full',
          'lg:[scrollbar-width:thin] lg:[scrollbar-color:rgba(255,255,255,0.15)_transparent]',
          'lg:[&_[data-form-actions]]:sticky lg:[&_[data-form-actions]]:bottom-0 lg:[&_[data-form-actions]]:z-10',
          'lg:[&_[data-form-actions]]:-mx-6 lg:[&_[data-form-actions]]:-mb-6 lg:[&_[data-form-actions]]:px-6 lg:[&_[data-form-actions]]:pb-6',
          'lg:[&_[data-form-actions]]:bg-card lg:[&_[data-form-actions]]:shadow-[0_-12px_20px_-12px_rgba(0,0,0,0.6)]',
        )}
      >
        {children}
      </div>
    </div>
  )
}
