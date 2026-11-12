'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'

export interface TooltipProps {
  content: React.ReactNode
  className?: string
  children: React.ReactNode
  /** Id of the description, so a field can point `aria-describedby` at it. */
  id?: string
}

const WIDTH = 240
const GAP = 8

/**
 * A tooltip that opens on hover, on keyboard focus and on tap (phones have no
 * hover), and closes on Escape, on leaving and on scrolling.
 *
 * It is drawn in a portal with fixed positioning, so a scrolling or clipped
 * container (like the form boxes that scroll inside) never cuts it off. It
 * sits above the trigger, below it when there is no room, and stays inside
 * the screen. The text is always in the page for screen readers, in a hidden
 * element `id` names; the visible copy is decorative.
 */
export function Tooltip({ content, className, children, id }: TooltipProps) {
  const autoId = React.useId()
  const descriptionId = id ?? `${autoId}-tip`
  const trigger = React.useRef<HTMLSpanElement>(null)
  const [position, setPosition] = React.useState<{ left: number; top: number; below: boolean } | null>(null)
  // A tap fires focus (which opens it) and then click: that click must not close it again.
  const openedAt = React.useRef(0)

  const show = React.useCallback(() => {
    const rect = trigger.current?.getBoundingClientRect()
    if (!rect) return
    openedAt.current = Date.now()
    const below = rect.top < 140
    const half = WIDTH / 2
    setPosition({
      left: Math.min(Math.max(rect.left + rect.width / 2, half + GAP), window.innerWidth - half - GAP),
      top: below ? rect.bottom + GAP : rect.top - GAP,
      below,
    })
  }, [])
  const hide = React.useCallback(() => setPosition(null), [])

  React.useEffect(() => {
    if (!position) return
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [position, hide])

  return (
    <>
      <span
        ref={trigger}
        tabIndex={0}
        role="button"
        aria-describedby={descriptionId}
        className="inline-flex cursor-help rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(event) => {
          event.preventDefault()
          if (!position) show()
          else if (Date.now() - openedAt.current > 400) hide()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') hide()
        }}
      >
        {children}
      </span>
      <span id={descriptionId} className="sr-only">
        {content}
      </span>
      {position &&
        createPortal(
          <span
            aria-hidden
            style={{
              position: 'fixed',
              left: position.left,
              top: position.top,
              width: WIDTH,
              transform: `translate(-50%, ${position.below ? '0' : '-100%'})`,
            }}
            className={cn(
              'pointer-events-none z-[100] rounded-md border bg-muted px-3 py-2 text-xs font-normal leading-relaxed text-foreground shadow-lg',
              className,
            )}
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  )
}
