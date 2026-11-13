import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import { getRequestContext } from '@/lib/i18n/server'
import { getPrivacyPolicy, PRIVACY_UPDATED } from '@/lib/legal/privacy'

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getRequestContext()
  const policy = getPrivacyPolicy(language)
  return { title: policy.title, description: policy.metaDescription }
}

/**
 * The privacy policy: a short summary first, then the full text with a table of
 * contents. The words live in lib/legal/privacy.ts, one version per language.
 */
export default async function PrivacyPage() {
  const { language, country } = await getRequestContext()
  const policy = getPrivacyPolicy(language)
  const updated = new Intl.DateTimeFormat(country.locale, { dateStyle: 'long' }).format(
    new Date(PRIVACY_UPDATED.year, PRIVACY_UPDATED.month - 1, PRIVACY_UPDATED.day),
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm text-muted-foreground">{policy.updated(updated)}</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">{policy.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{policy.intro}</p>

      <section aria-labelledby="summary" className="mt-10 rounded-2xl border bg-card p-6">
        <h2 id="summary" className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" aria-hidden />
          {policy.summaryTitle}
        </h2>
        <ul className="mt-4 space-y-2.5">
          {policy.summary.map((point) => (
            <li key={point} className="flex gap-3 text-sm leading-relaxed">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/60" />
              {point}
            </li>
          ))}
        </ul>
      </section>

      <nav aria-labelledby="contents" className="mt-10">
        <h2 id="contents" className="text-sm font-medium text-muted-foreground">
          {policy.contentsTitle}
        </h2>
        <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {policy.sections.map((section, index) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="transition-colors hover:text-foreground/75">
                <span className="mr-2 tabular-nums text-muted-foreground">{index + 1}.</span>
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-12">
        {policy.sections.map((section, index) => (
          <section key={section.id} id={section.id} className="scroll-mt-28">
            <h2 className="text-xl font-semibold tracking-tight">
              <span className="mr-2 tabular-nums text-muted-foreground">{index + 1}.</span>
              {section.title}
            </h2>
            <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
              {section.body.map((block, blockIndex) =>
                Array.isArray(block) ? (
                  <ul key={blockIndex} className="space-y-2 pl-1">
                    {block.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p key={blockIndex}>{block}</p>
                ),
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
