import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { I18nProvider } from '@/lib/i18n/client'
import { getRequestContext } from '@/lib/i18n/server'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestContext()

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: { default: t.meta.siteTitle, template: '%s · SumAI' },
    description: t.meta.siteDescription,
    openGraph: { type: 'website', siteName: 'SumAI' },
  }
}

/**
 * The country cookie decides currency, lending rules and interface language
 * together: Colombia renders in Spanish, the United States and Canada in English.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { country, language } = await getRequestContext()

  // suppressHydrationWarning on <html> and <body> only: browser extensions such as
  // LanguageTool and Grammarly add attributes to these two tags before React
  // loads. It covers these elements' own attributes, not anything inside them,
  // so a genuine mismatch in the page is still reported.
  return (
    <html lang={language} className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Marks the document before first paint so scroll-reveal content can
            start hidden. Without JavaScript the class is never added and
            nothing is hidden. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans" suppressHydrationWarning>
        <I18nProvider countryCode={country.code}>
          <Header countryCode={country.code} />
          {/* Clearance below the floating top bar, so content never starts tight against it. */}
          <main className="flex-1 pt-8 sm:pt-12">{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  )
}
