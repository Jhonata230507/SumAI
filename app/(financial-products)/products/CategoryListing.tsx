import type { Metadata } from 'next'
import { SearchX } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ProductCard } from '@/components/products/ProductCard'
import { ButtonLink } from '@/components/ui/button'
import { matchProducts } from '@/features/products/match-products'
import { getRequestContext } from '@/lib/i18n/server'
import type { ProductCategory } from '@/types/financial-product'
import type { RankedProductList } from '@/features/products/types'

export interface CategoryListingProps {
  category: ProductCategory
  /** Calculator to point people at before they compare. */
  calculatorHref: string
}

/** Page metadata for a category, in the visitor's language. */
export async function categoryMetadata(category: ProductCategory): Promise<Metadata> {
  const { t } = await getRequestContext()
  const text = t.products.categories[category]
  return { title: text.metaTitle, description: text.metaDescription }
}

/**
 * Shared listing for every product category page.
 *
 * Fetch failures render an empty state rather than an error page: a rates table
 * being briefly unavailable should not take the whole route down with it.
 */
export async function CategoryListing({ category, calculatorHref }: CategoryListingProps) {
  const { country, language, t } = await getRequestContext()
  const text = t.products.categories[category]

  let ranked: RankedProductList | null = null
  try {
    ranked = await matchProducts({
      category,
      countryCode: country.code,
      includeIneligible: true,
      language,
    })
  } catch {
    ranked = null
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">{text.title}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{text.intro}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 p-4 text-sm">
        <p className="flex-1 text-muted-foreground">{t.products.knowNumbers}</p>
        <ButtonLink size="sm" variant="outline" href={calculatorHref}>
          {text.calculatorLabel}
        </ButtonLink>
      </div>

      <div className="mt-8 space-y-4">
        {!ranked || ranked.matches.length === 0 ? (
          <EmptyState
            icon={<SearchX className="h-8 w-8" />}
            title={t.products.emptyTitle}
            description={t.products.emptyDescription(text.title, t.countries[country.code])}
          />
        ) : (
          ranked.matches.map((match, index) => (
            <ProductCard key={match.product.id} match={match} country={country} position={index + 1} />
          ))
        )}
      </div>

      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">{t.products.footnote}</p>
    </div>
  )
}
