'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/** How far the page can scroll before the cue gets out of the way. */
const HIDE_AFTER = 80

/**
 * Floating "scroll down" cue for the home hero: a mouse outline with a dot
 * travelling down, over a gently bobbing chevron.
 *
 * Sits at the bottom of the hero, which fills the first screen, so the cue is
 * at the bottom of the screen at any window height. It fades out once the
 * reader starts scrolling. It is a real link to
 * the next section, so it works by click and keyboard, and the page's smooth
 * scrolling carries the reader there. Animations stop for reduced motion.
 */
export function ScrollCue({ href, label }: { href: string; label: string }) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const onScroll = () => setHidden(window.scrollY > HIDE_AFTER)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <a
      href={href}
      aria-label={label}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden}
      className={cn(
        // Below ~740px of height the cards fill the screen and there is no room left: hide rather than overlap them.
        'group absolute bottom-5 left-1/2 z-10 [@media(max-height:740px)]:hidden flex -translate-x-1/2 flex-col items-center gap-1.5 rounded-2xl px-5 py-2.5',
        'text-muted-foreground transition-[opacity,color] duration-500 hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      <span className="scroll-cue-float flex flex-col items-center gap-1.5">
        <span className="flex h-9 w-6 justify-center rounded-full border-2 border-current pt-1.5 opacity-80 transition-opacity group-hover:opacity-100">
          <span className="scroll-cue-dot h-1.5 w-1 rounded-full bg-primary" />
        </span>
        <ChevronDown className="h-4 w-4" aria-hidden />
      </span>
      {/* The label is dropped on short screens to save height; the link keeps its aria-label. */}
      <span className="whitespace-nowrap text-[11px] tracking-wide [@media(max-height:860px)]:hidden">{label}</span>
    </a>
  )
}
