'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * The pinned layer of the home page's "curtain" transition.
 *
 * The hero fills the rest of the first screen and stays pinned where it rests
 * while the next section — a solid sheet — scrolls up over it. As it is
 * covered, the hero recedes: it scales down slightly and dims, so the sheet
 * reads as coming forward rather than the page simply scrolling.
 *
 * Filling the screen matters twice over: the sheet's top edge starts just
 * below the fold instead of peeking into the first view, and `overlay` (the
 * scroll cue) sits at the true bottom of the screen.
 *
 * `overlay` renders outside the scaled layer on purpose. A transformed element
 * becomes the containing block for its descendants, so anything positioned
 * inside it would follow the scaling — and land in the wrong place.
 *
 * Reduced-motion users keep the overlap but not the scaling and fading.
 */
export function HeroStage({
  children,
  overlay,
  className,
}: {
  children: ReactNode
  overlay?: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Pin the hero exactly where it starts, so it never slides under the top bar,
    // and make it reach the bottom of the first screen from there.
    const fit = () => {
      node.style.top = '0px'
      const offset = Math.round(node.getBoundingClientRect().top + window.scrollY)
      node.style.top = `${offset}px`
      node.style.minHeight = `calc(100dvh - ${offset}px)`
    }
    fit()
    window.addEventListener('resize', fit)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => window.removeEventListener('resize', fit)
    }

    let frame = 0
    const update = () => {
      frame = 0
      // 0 at the top of the page, 1 once a full hero height has scrolled past.
      const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(node.offsetHeight, 1)))
      node.style.setProperty('--recede', progress.toFixed(4))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('resize', fit)
    }
  }, [])

  return (
    <section ref={ref} className={cn('sticky top-0 z-0', className)}>
      <div
        className="origin-top will-change-transform"
        style={{
          transform: 'scale(calc(1 - var(--recede, 0) * 0.08))',
          opacity: 'calc(1 - var(--recede, 0) * 0.75)',
        }}
      >
        {children}
      </div>
      {overlay}
    </section>
  )
}
