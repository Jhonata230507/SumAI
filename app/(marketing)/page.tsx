import { getRequestContext } from '@/lib/i18n/server'
import { HeroShowcase } from '@/components/marketing/HeroShowcase'
import { ScrollCue } from '@/components/marketing/ScrollCue'
import { HeroStage } from '@/components/marketing/HeroStage'
import { HeroSnap } from '@/components/marketing/HeroSnap'
import { CalculatorCarousel } from '@/components/marketing/CalculatorCarousel'
import { Testimonials } from '@/components/marketing/Testimonials'
import { Advantages } from '@/components/marketing/Advantages'
import { Reveal } from '@/components/common/Reveal'


export default async function HomePage() {
  const { country, t } = await getRequestContext()

  return (
    <>
      {/* One scroll from the hero carries the page to the calculators in a single eased motion. */}
      <HeroSnap targetId="calculators" />

      {/* Hero: pinned while the sheet below slides up over it (the "curtain" transition). */}
      <HeroStage
        // Short screens (laptops at 768px tall, phones) get a tighter hero so the
        // cards and the scroll cue still fit on the first screen.
        className="overflow-hidden px-4 pb-28 pt-10 text-center sm:pt-12 [@media(max-height:860px)]:pb-16 [@media(max-height:860px)]:pt-2 [@media(max-height:860px)]:sm:pt-2"
        overlay={<ScrollCue href="#calculators" label={t.home.scrollHint} />}
      >
        <Reveal>
          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-light tracking-tight sm:text-6xl [@media(max-height:860px)]:text-3xl [@media(max-height:860px)]:sm:text-5xl">
            <span className="text-neutral-400">{t.home.titleLead}</span>{' '}
            <span className="font-normal text-white">{t.home.titleEmphasis}</span>
            <span className="text-neutral-400">.</span>
          </h1>
        </Reveal>
        <Reveal delay={100}>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-neutral-400 sm:text-lg">
            {t.home.subtitle}
          </p>
        </Reveal>

        <Reveal delay={200}>
          <HeroShowcase country={country} t={t} />
        </Reveal>

      </HeroStage>

      {/* The sheet: an opaque layer, borderless, that rises over the pinned hero. */}
      <div className="surface-page relative z-10">

      {/* Full screen height (dvh, so mobile browser bars are accounted for), cards centred.
          Top padding clears the floating top bar once the sheet reaches the top. */}
      <section id="calculators" className="flex min-h-[100dvh] flex-col justify-center overflow-hidden pb-16 pt-28">
        <Reveal>
          <CalculatorCarousel />
        </Reveal>
      </section>

      <Advantages country={country} t={t} />

      {/* The principles section (components/marketing/Principles) is hidden for now. */}
      <Testimonials />
      </div>
    </>
  )
}
