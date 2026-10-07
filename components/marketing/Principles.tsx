import { Globe2, MessageSquareText, Sigma, type LucideIcon } from 'lucide-react'
import { Reveal } from '@/components/common/Reveal'
import { cn } from '@/lib/utils/cn'

/**
 * The three product principles under the home page carousel, as clean bento
 * cards: a visual stage on top — the icon at its centre, on faint concentric
 * rings between two ghosted cards — then the title and text.
 *
 * The only glow is on the icon tile itself. Cards stay flat and matte; the
 * hover is the shared one (lit border, small lift), plus the icon's glow
 * strengthening.
 */

interface Accent {
  icon: LucideIcon
  /** Icon tile fill. */
  tile: string
  /** The icon's glow colour. */
  glow: string
}

const ACCENTS: Accent[] = [
  { icon: Sigma, tile: 'from-[#ffa07f] to-[#f2603a]', glow: '255,122,79' },
  { icon: MessageSquareText, tile: 'from-[#8b8af0] to-[#4a49c2]', glow: '91,91,214' },
  { icon: Globe2, tile: 'from-[#4fd1a2] to-[#14906a]', glow: '63,176,103' },
]

export function Principles({ items }: { items: { title: string; body: string }[] }) {
  return (
    <section className="py-24">
      <div className="mx-auto grid max-w-6xl gap-5 px-4 md:grid-cols-3">
        {items.map((item, index) => {
          const accent = ACCENTS[index % ACCENTS.length]
          const Icon = accent.icon
          return (
            <Reveal key={item.title} delay={index * 90} className="h-full">
              <article
                className={cn(
                  'group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.06] bg-card',
                  'transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-white/25',
                )}
              >
                {/* Visual stage. */}
                <div aria-hidden className="relative flex h-48 items-center justify-center overflow-hidden">
                  {/* Concentric rings. */}
                  <span className="absolute h-64 w-64 rounded-full border border-white/[0.05]" />
                  <span className="absolute h-44 w-44 rounded-full border border-white/[0.06]" />
                  <span className="absolute h-28 w-28 rounded-full border border-white/[0.07]" />

                  {/* Ghosted cards either side, like UI behind the icon. */}
                  <span className="absolute left-6 top-1/2 h-24 w-28 -translate-y-1/2 -rotate-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                    <span className="absolute left-4 top-5 h-2 w-12 rounded-full bg-white/[0.08]" />
                    <span className="absolute left-4 top-10 h-2 w-16 rounded-full bg-white/[0.05]" />
                    <span className="absolute left-4 top-15 h-2 w-10 rounded-full bg-white/[0.05]" />
                  </span>
                  <span className="absolute right-6 top-1/2 h-24 w-28 -translate-y-1/2 rotate-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                    <span className="absolute right-4 top-5 h-2 w-12 rounded-full bg-white/[0.08]" />
                    <span className="absolute right-4 top-10 h-2 w-16 rounded-full bg-white/[0.05]" />
                    <span className="absolute right-4 top-15 h-2 w-10 rounded-full bg-white/[0.05]" />
                  </span>

                  {/* The icon: the only element that glows. */}
                  <span
                    className={cn(
                      'relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white',
                      'transition-[box-shadow,transform] duration-500 group-hover:scale-105',
                      accent.tile,
                      '[box-shadow:inset_0_1px_0_rgba(255,255,255,0.35),0_10px_30px_-6px_rgba(var(--glow),0.6),0_0_48px_-4px_rgba(var(--glow),0.45)]',
                      'group-hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.35),0_12px_36px_-4px_rgba(var(--glow),0.75),0_0_72px_0_rgba(var(--glow),0.6)]',
                    )}
                    style={{ '--glow': accent.glow } as React.CSSProperties}
                  >
                    <Icon className="h-7 w-7" strokeWidth={2} />
                  </span>

                  {/* Fade the stage into the card body. */}
                  <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
                </div>

                <div className="flex flex-1 flex-col px-8 pb-8">
                  <h2 className="text-xl font-semibold tracking-tight">{item.title}</h2>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </article>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
