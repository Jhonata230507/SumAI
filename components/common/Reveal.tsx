'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface RevealProps {
  children: ReactNode
  /** Milliseconds to wait after entering view, for staggering siblings. */
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li'
}

/**
 * Fades and lifts its content in the first time it scrolls into view.
 *
 * The hidden starting state only applies once the root layout's inline script
 * has marked the document with `.js`, so without JavaScript nothing stays
 * hidden. Reduced-motion users get the content immediately (see globals.css).
 * The effect runs once per element: scrolling back up does not replay it.
 */
export function Reveal({ children, delay = 0, className, as: Tag = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        node.dataset.visible = 'true'
        observer.disconnect()
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref as never}
      className={cn('reveal', className)}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  )
}
