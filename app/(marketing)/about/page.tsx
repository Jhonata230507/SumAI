import type { Metadata } from 'next'
import { getRequestContext } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestContext()
  return { title: t.about.metaTitle, description: t.about.metaDescription }
}

export default async function AboutPage() {
  const { t } = await getRequestContext()

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{t.about.title}</h1>

      <div className="mt-8 space-y-6 leading-relaxed text-muted-foreground">
        {t.about.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}

        <h2 className="pt-4 text-xl font-semibold text-foreground">{t.about.rulesTitle}</h2>
        <ul className="list-disc space-y-2 pl-5">
          {t.about.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>

        <h2 className="pt-4 text-xl font-semibold text-foreground">{t.about.whereTitle}</h2>
        <p>{t.about.whereBody}</p>
      </div>
    </article>
  )
}
