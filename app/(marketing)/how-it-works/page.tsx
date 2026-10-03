import type { Metadata } from 'next'
import { ButtonLink } from '@/components/ui/button'
import { getRequestContext } from '@/lib/i18n/server'
import { Reveal } from '@/components/common/Reveal'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestContext()
  return { title: t.howItWorks.metaTitle, description: t.howItWorks.metaDescription }
}

export default async function HowItWorksPage() {
  const { t } = await getRequestContext()

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{t.howItWorks.title}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{t.howItWorks.subtitle}</p>

      <ol className="mt-12 space-y-10">
        {t.howItWorks.steps.map((item, index) => (
          <Reveal as="li" key={item.title} delay={index * 60} className="flex gap-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <div>
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-1.5 leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>

      <Reveal className="mt-14 rounded-xl border bg-card p-6">
        <h2 className="font-semibold">{t.howItWorks.rateNoteTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t.howItWorks.rateNoteBody}
        </p>
      </Reveal>

      <ButtonLink size="lg" className="mt-10" href="/calculators">
        {t.howItWorks.start}
      </ButtonLink>
    </div>
  )
}
