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
 * Fades and lifts its content in whenever it scrolls into view.
 *
 * The hidden starting state only applies once the root layout's inline script
 * has marked the document with `.js`, so without JavaScript nothing stays
 * hidden. Reduced-motion users get the content immediately (see globals.css).
 * The effect replays: once an element has left the screen completely it resets,
 * so it animates in again the next time it is scrolled to, from either
 * direction. It plays once the element is a fifth of the way up the screen,
 * so the motion happens where the eye is, not at the very bottom edge.
 * Resetting only when fully out of view keeps it from flickering while it sits
 * at the edge of the screen.
 *
 * Content pinned in place (the home hero) never leaves the screen, so its
 * container resets it instead — see HeroStage.
 */
export function Reveal({ children, delay = 0, className, as: Tag = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.12) node.dataset.visible = 'true'
        else if (!entry.isIntersecting) delete node.dataset.visible
      },
      { threshold: [0, 0.12], rootMargin: '0px 0px -20% 0px' },
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
