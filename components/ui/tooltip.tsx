'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface TooltipProps {
  content: React.ReactNode
  className?: string
  children: React.ReactNode
}

/** CSS-only tooltip. Also opens on focus, so it is reachable by keyboard. */
export function Tooltip({ content, className, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      <span tabIndex={0} className="inline-flex cursor-help outline-none">
        {children}
      </span>
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-md',
          'border bg-muted px-3 py-2 text-xs leading-relaxed text-foreground opacity-0 shadow-lg transition-opacity',
          'group-hover:opacity-100 group-focus-within:opacity-100',
          className,
        )}
      >
        {content}
      </span>
    </span>
  )
}
