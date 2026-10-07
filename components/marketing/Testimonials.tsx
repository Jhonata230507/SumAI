'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'
import { Reveal } from '@/components/common/Reveal'
import { useI18n } from '@/lib/i18n/client'
import { cn } from '@/lib/utils/cn'
import { CarouselButton } from './CalculatorCarousel'

/** How long each testimonial stays in the centre before the row moves on. */
const INTERVAL = 6000

/** Tilt by distance from the centre: upright, a slight lean, a steep lean. */
const TILT = [0, 5, 13]
/** Drop by distance from the centre, so the row curves down at its ends. */
const DROP = ['0rem', '1.75rem', '4.5rem']

/**
 * Testimonials, after a "fanned portraits" reference: a tall centre card with
 * a name plate and a speech bubble, flanked by smaller, squarer cards that
 * lean away from it, the outer pair running off the edges of the screen. The
 * quote sits underneath. Cards slide into their new places as the centre
 * changes; clicking a side card brings it to the middle.
 *
 * Auto-advances, paused on hover or focus; off for reduced-motion users. The
 * quotes are placeholders, so a "sample" note sits under them until real
 * customer feedback replaces them.
 */
export function Testimonials() {
  const { t } = useI18n()
  const c = t.home.testimonials
  const items = c.items
  const n = items.length
  const [active, setActive] = useState(Math.floor(n / 2))
  const [paused, setPaused] = useState(false)
  const [autoplay, setAutoplay] = useState(false)
  // Each card's previous offset from the centre, to spot a card wrapping around
  // from one end of the row to the other.
  const lastOffsets = useRef<number[]>([])

  useEffect(() => {
    setAutoplay(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (!autoplay || paused) return
    const id = window.setTimeout(() => setActive((a) => (a + 1) % n), INTERVAL)
    return () => window.clearTimeout(id)
  }, [autoplay, paused, active, n])

  // Offset of card i from the centre, in -2..2 for five cards.
  const half = Math.floor(n / 2)
  const offsets = items.map((_, i) => ((((i - active) % n) + n + half) % n) - half)
  const previous = lastOffsets.current
  useEffect(() => {
    lastOffsets.current = offsets
  })

  const go = (delta: number) => setActive((a) => (a + delta + n) % n)
  const current = items[active]

  return (
    <section className="overflow-clip py-24">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <Reveal>
          <span className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground">
            {c.eyebrow}
          </span>
          <h2 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
            {c.title}
          </h2>
        </Reveal>
      </div>

      <Reveal delay={100}>
        {/* The stage spans the full width, so on narrower screens the outer cards
            bleed off the edges. Cards sit a fixed gap apart — each position is
            derived from the card sizes — so the row keeps the same compact
            proportions on any screen width. Sizes are CSS variables, smaller on phones. */}
        <div
          className={cn(
            'relative mt-12 h-[19rem] sm:h-[24.5rem]',
            '[--cy:8rem] [--cw:11rem] [--ch:13.5rem] [--sw:8.5rem] [--sh:9.75rem] [--gap:1rem]',
            'sm:[--cy:10.5rem] sm:[--cw:15rem] sm:[--ch:18.5rem] sm:[--sw:11.5rem] sm:[--sh:13rem] sm:[--gap:2.25rem]',
            // Centre of the inner and outer cards: half the centre card, a gap, half a side card…
            '[--x1:calc(var(--cw)/2+var(--gap)+var(--sw)/2)] [--x2:calc(var(--x1)+var(--sw)+var(--gap)*1.6)]',
          )}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setPaused(false)
          }}
        >
          {items.map((item, i) => {
            const d = offsets[i]
            const center = d === 0
            const far = Math.min(Math.abs(d), 2)
            const side = Math.sign(d)
            // A card jumping from one end to the other moves without a transition,
            // so it does not sweep across the row behind the others.
            const wrapped = previous[i] !== undefined && Math.abs(previous[i] - d) > 1
            const x = far === 0 ? '0px' : far === 1 ? 'var(--x1)' : 'var(--x2)'
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => setActive(i)}
                aria-label={c.show(item.name)}
                aria-current={center || undefined}
                tabIndex={far > 1 ? -1 : 0}
                className={cn(
                  'absolute left-1/2 top-[var(--cy)] rounded-[1.4rem]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  !wrapped &&
                    'transition-[transform,width,height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  center ? 'cursor-default' : 'cursor-pointer',
                )}
                style={{
                  zIndex: 10 - far,
                  width: center ? 'var(--cw)' : 'var(--sw)',
                  height: center ? 'var(--ch)' : 'var(--sh)',
                  transform: `translate(-50%, -50%) translateX(calc(${x} * ${side})) translateY(${DROP[far]}) rotate(${side * TILT[far]}deg)`,
                }}
              >
                <span
                  className={cn(
                    'relative block h-full w-full overflow-hidden rounded-[1.4rem] transition-[box-shadow] duration-500',
                    center
                      ? 'shadow-[0_0_0_4px_var(--primary),0_0_40px_-6px_rgba(255,122,79,0.6)]'
                      : 'shadow-[0_18px_40px_-18px_rgba(0,0,0,0.8)]',
                  )}
                >
                  <Portrait {...PORTRAITS[i % PORTRAITS.length]} />
                  {/* Name plate, on the centre card only. */}
                  <span
                    className={cn(
                      'absolute inset-x-2.5 bottom-7 rounded-xl bg-black/40 px-3 py-2 text-center backdrop-blur-md transition-opacity duration-500',
                      center ? 'opacity-100 delay-200' : 'opacity-0',
                    )}
                  >
                    <span className="block truncate text-sm font-medium text-white">{item.name}</span>
                    <span className="block truncate text-[11px] text-white/75">{item.role}</span>
                  </span>
                </span>
                {/* Speech bubble, half over the centre card's bottom edge — an icon, so it may glow. */}
                <span
                  aria-hidden
                  className={cn(
                    'absolute -bottom-5 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground',
                    'shadow-[0_0_24px_-4px_rgba(255,122,79,0.7)] ring-4 ring-background transition-[opacity,transform] duration-500',
                    center ? 'scale-100 opacity-100 delay-200' : 'scale-50 opacity-0',
                  )}
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
                </span>
              </button>
            )
          })}
        </div>

        <div className="mx-auto max-w-xl px-4 text-center">
          <blockquote key={current.name} aria-live="polite" className="advantage-in">
            <p className="text-balance text-xl leading-relaxed text-foreground/90 sm:text-2xl">“{current.quote}”</p>
            <footer className="sr-only">
              {current.name}, {current.role}
            </footer>
          </blockquote>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">{c.sample}</p>

          <div className="mt-8 flex justify-center gap-3">
            <CarouselButton label={c.previous} disabled={false} onClick={() => go(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </CarouselButton>
            <CarouselButton label={c.next} disabled={false} onClick={() => go(1)}>
              <ChevronRight className="h-5 w-5" />
            </CarouselButton>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ---------- illustrated portraits ---------- */

type Scene = 'city' | 'wall' | 'plaza' | 'lavender' | 'street'
type Hair = 'short' | 'braids' | 'long' | 'wavy' | 'cap'
type Top = 'coat' | 'hoodie' | 'sweater' | 'knit' | 'jacket'

interface PortraitSpec {
  id: string
  scene: Scene
  skin: string
  hair: string
  hairStyle: Hair
  top: string
  topStyle: Top
  glasses?: 'clear' | 'tinted'
  beard?: boolean
}

/**
 * There are no customer photos yet, so each card is an illustrated portrait,
 * styled after the reference's photos: a person on a real-looking backdrop,
 * varied by skin, hair, clothing and accessories so the row reads as five
 * different people. Swap in photos once there are real testimonials.
 */
const PORTRAITS: PortraitSpec[] = [
  { id: 'a', scene: 'city', skin: '#b07a55', hair: '#1e1714', hairStyle: 'short', top: '#6b5a4a', topStyle: 'coat', beard: true },
  { id: 'b', scene: 'wall', skin: '#a8734f', hair: '#16100d', hairStyle: 'braids', top: '#f2b52c', topStyle: 'hoodie', glasses: 'clear' },
  { id: 'c', scene: 'plaza', skin: '#e2b08a', hair: '#1a1210', hairStyle: 'long', top: '#e9c6d6', topStyle: 'sweater', glasses: 'tinted' },
  { id: 'd', scene: 'lavender', skin: '#f1c6a6', hair: '#c4471d', hairStyle: 'wavy', top: '#f0743a', topStyle: 'knit', glasses: 'clear' },
  { id: 'e', scene: 'street', skin: '#e8bc98', hair: '#6b4428', hairStyle: 'cap', top: '#25252c', topStyle: 'jacket' },
]

function Portrait({ id, scene, skin, hair, hairStyle, top, topStyle, glasses, beard }: PortraitSpec) {
  const p = `portrait-${id}`
  const line = '#2a1c16'
  return (
    <svg viewBox="32 36 136 170" preserveAspectRatio="xMidYMid slice" className="block h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`${p}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>
        <radialGradient id={`${p}-face`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <Backdrop scene={scene} id={p} />

      {/* Hair that falls behind the shoulders. */}
      {hairStyle === 'long' && <path d="M62 98C58 58 80 46 100 46s44 12 38 52l8 106c-30 14-62 14-92 0z" fill={hair} />}
      {hairStyle === 'wavy' && (
        <path
          d="M60 98C56 56 80 46 100 46s46 10 40 52c10 22 2 40 10 60s-6 40-6 40c-28 12-60 12-88 0 0 0-14-18-4-40s-2-38 8-60z"
          fill={hair}
        />
      )}

      {/* Body. */}
      <Clothes style={topStyle} color={top} />

      {/* Neck, ears and head. */}
      <path d="M88 126h24v34c-6 6-18 6-24 0z" fill={skin} />
      <path d="M88 132c8 6 16 6 24 0v8c-8 5-16 5-24 0z" fill="#000" opacity="0.14" />
      <ellipse cx="70" cy="100" rx="6" ry="9" fill={skin} />
      <ellipse cx="130" cy="100" rx="6" ry="9" fill={skin} />
      <ellipse cx="100" cy="96" rx="30" ry="36" fill={skin} />
      <ellipse cx="100" cy="96" rx="30" ry="36" fill={`url(#${p}-face)`} />

      {beard && <path d="M72 102c2 22 14 30 28 30s26-8 28-30c-6 10-14 14-28 14s-22-4-28-14z" fill={hair} opacity="0.85" />}

      {/* Face. */}
      <g fill={line}>
        <ellipse cx="88" cy="95" rx="2.6" ry="3" />
        <ellipse cx="112" cy="95" rx="2.6" ry="3" />
      </g>
      <g stroke={line} strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M81 86q7-4 13-1" />
        <path d="M106 85q6-3 13 1" />
        <path d="M100 98q-3 8 0 11" opacity="0.5" />
      </g>
      {/* An open smile. */}
      <path d="M88 114q12 10 24 0q-12 4-24 0z" fill="#fff" stroke={line} strokeWidth="1.6" strokeLinejoin="round" />
      <g fill="#e2725b" opacity="0.18">
        <circle cx="80" cy="108" r="6" />
        <circle cx="120" cy="108" r="6" />
      </g>

      {glasses && (
        <g stroke={glasses === 'tinted' ? '#c75b86' : '#2a2a2a'} strokeWidth="2" fill={glasses === 'tinted' ? '#f0a6c4' : 'none'} fillOpacity="0.55">
          <rect x="77" y="87" width="20" height="15" rx="6" />
          <rect x="103" y="87" width="20" height="15" rx="6" />
          <path d="M97 93q3-2 6 0M77 92l-7-2M123 92l7-2" fill="none" />
        </g>
      )}

      {/* Hair on top. */}
      {hairStyle === 'short' && <path d="M69 92C66 62 84 54 100 54s36 8 32 38c-6-16-16-22-32-22s-25 6-31 22z" fill={hair} />}
      {hairStyle === 'braids' && (
        <g>
          <path d="M70 90C68 60 86 52 100 52s34 8 32 38c-8-14-18-20-32-20s-24 6-30 20z" fill={hair} />
          <g stroke="#3a2a22" strokeWidth="1.6" fill="none" opacity="0.9">
            <path d="M84 70q-2-10 6-16M96 68q0-10 6-15M108 69q2-9 8-12M119 74q4-7 9-8" />
          </g>
          <ellipse cx="128" cy="62" rx="10" ry="8" fill={hair} />
        </g>
      )}
      {hairStyle === 'long' && <path d="M68 104C64 64 82 54 100 54s36 10 32 50c-6-22-16-32-30-34-4 14-18 26-34 34z" fill={hair} />}
      {hairStyle === 'wavy' && <path d="M66 104C62 62 82 52 100 52s38 10 34 52c-8-20-18-30-34-32-6 14-20 24-34 32z" fill={hair} />}
      {hairStyle === 'cap' && (
        <g>
          <path d="M70 100c-4 16-2 30 2 38M130 100c4 16 2 30-2 38" stroke={hair} strokeWidth="9" strokeLinecap="round" />
          <path d="M66 84C66 58 84 48 100 48s34 10 34 36z" fill="#e8e6e1" />
          <path d="M66 84h68c4 0 4 6 0 6H66c-4 0-4-6 0-6z" fill="#cfccc6" />
          <path d="M60 86c10-6 26-8 40-8s30 2 40 8c-10 4-26 6-40 6s-30-2-40-6z" fill="#d9d6d0" />
        </g>
      )}

      {/* Soft vignette at the bottom, so the name plate reads on any portrait. */}
      <rect width="200" height="240" fill={`url(#${p}-shade)`} />
    </svg>
  )
}

function Backdrop({ scene, id }: { scene: Scene; id: string }) {
  switch (scene) {
    case 'city':
      return (
        <g>
          <defs>
            <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9fb4c7" />
              <stop offset="1" stopColor="#d9c3a6" />
            </linearGradient>
          </defs>
          <rect width="200" height="240" fill={`url(#${id}-sky)`} />
          <g fill="#6f6a66">
            <rect x="0" y="40" width="46" height="200" />
            <rect x="150" y="24" width="50" height="216" />
          </g>
          <g fill="#8a847d">
            <rect x="40" y="70" width="36" height="170" />
            <rect x="126" y="60" width="34" height="180" />
          </g>
          <g fill="#c9d4dc" opacity="0.6">
            {[52, 72, 92, 112, 132].map((y) => (
              <g key={y}>
                <rect x="8" y={y} width="10" height="12" />
                <rect x="26" y={y} width="10" height="12" />
                <rect x="160" y={y - 12} width="10" height="12" />
                <rect x="180" y={y - 12} width="10" height="12" />
              </g>
            ))}
          </g>
          {/* Steps. */}
          <g fill="#5d5853">
            <rect x="0" y="196" width="200" height="8" opacity="0.6" />
            <rect x="0" y="214" width="200" height="8" opacity="0.6" />
          </g>
        </g>
      )
    case 'wall':
      return (
        <g>
          <rect width="200" height="240" fill="#d8d6d2" />
          <g stroke="#bfbcb6" strokeWidth="1.2" opacity="0.8">
            <path d="M0 60h200M0 120h200M0 180h200M60 0v60M140 60v60M40 120v60M120 180v60" />
          </g>
          <rect width="200" height="240" fill="#fff" opacity="0.08" />
        </g>
      )
    case 'plaza':
      return (
        <g>
          <defs>
            <linearGradient id={`${id}-plaza`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a9a497" />
              <stop offset="0.55" stopColor="#7e8a70" />
              <stop offset="1" stopColor="#5c6652" />
            </linearGradient>
          </defs>
          <rect width="200" height="240" fill={`url(#${id}-plaza)`} />
          {/* Blurred building and lamps behind. */}
          <rect x="18" y="10" width="164" height="70" rx="4" fill="#c9c1b0" opacity="0.55" />
          <g fill="#ece4d3" opacity="0.5">
            {[30, 62, 94, 126, 158].map((x) => (
              <rect key={x} x={x} y="22" width="14" height="22" rx="7" />
            ))}
          </g>
          <g fill="#fff" opacity="0.35">
            <circle cx="26" cy="120" r="10" />
            <circle cx="176" cy="104" r="14" />
            <circle cx="160" cy="150" r="7" />
            <circle cx="40" cy="160" r="6" />
          </g>
        </g>
      )
    case 'lavender':
      return (
        <g>
          <rect width="200" height="240" fill="#a99bd8" />
          <circle cx="60" cy="40" r="120" fill="#fff" opacity="0.12" />
        </g>
      )
    case 'street':
      return (
        <g>
          <defs>
            <linearGradient id={`${id}-street`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f2f1ee" />
              <stop offset="1" stopColor="#c9cdd2" />
            </linearGradient>
          </defs>
          <rect width="200" height="240" fill={`url(#${id}-street)`} />
          <g fill="#aab1b9" opacity="0.6">
            <rect x="0" y="90" width="30" height="150" />
            <rect x="24" y="120" width="22" height="120" />
            <rect x="168" y="100" width="32" height="140" />
          </g>
          <rect x="0" y="210" width="200" height="30" fill="#9aa1a8" opacity="0.5" />
        </g>
      )
  }
}

function Clothes({ style, color }: { style: Top; color: string }) {
  const body = 'M18 240c4-46 34-76 82-76s78 30 82 76z'
  return (
    <g>
      <path d={body} fill={color} />
      <path d={body} fill="#000" opacity="0.06" />
      {style === 'coat' && (
        <g>
          <path d="M76 168l24 38 24-38" fill="none" stroke="#000" strokeOpacity="0.25" strokeWidth="3" />
          <path d="M88 166l12 22 12-22z" fill="#e9e4dc" />
        </g>
      )}
      {style === 'hoodie' && (
        <g>
          <path d="M62 176c10-14 24-18 38-18s28 4 38 18c-10 18-24 26-38 26s-28-8-38-26z" fill="#000" opacity="0.12" />
          <path d="M92 196v22M108 196v22" stroke="#fff" strokeOpacity="0.8" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M20 240c2-20 8-36 18-48 4 18 4 34 2 48zM180 240c-2-20-8-36-18-48-4 18-4 34-2 48z" fill="#1d1d22" opacity="0.85" />
        </g>
      )}
      {style === 'sweater' && <path d="M80 166q20 14 40 0" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="5" strokeLinecap="round" />}
      {style === 'knit' && (
        <g stroke="#000" strokeOpacity="0.12" strokeWidth="2">
          <path d="M40 200h120M32 216h136M26 232h148" />
          <path d="M80 166q20 12 40 0" fill="none" strokeWidth="5" />
        </g>
      )}
      {style === 'jacket' && (
        <g>
          <path d="M84 166l16 74 16-74" fill="#c9c7c2" />
          <path d="M70 170l30 70M130 170l-30 70" stroke="#000" strokeOpacity="0.4" strokeWidth="3" />
        </g>
      )}
    </g>
  )
}
