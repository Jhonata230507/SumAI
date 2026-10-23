import { Skeleton } from '@/components/ui/skeleton'

/**
 * Shown the moment a calculator link is clicked, while its page is fetched: the
 * outline of the calculator (title, form, results, recommendations) in place of
 * a page that seems frozen. Mirrors CalculatorLayout's widths and columns, so the
 * real page replaces it without the layout jumping.
 */
export default function CalculatorLoading() {
  return (
    <div aria-busy className="mx-auto max-w-6xl px-4 pb-8 pt-12 xl:max-w-[88rem]">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-5 h-10 w-full max-w-md" />
      <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      <Skeleton className="mt-2 h-4 w-full max-w-lg" />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)_minmax(0,320px)]">
        {/* Form */}
        <div className="space-y-5 rounded-2xl border p-6">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Results */}
        <div className="space-y-6">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>

        {/* Recommendations */}
        <div className="hidden space-y-3 rounded-2xl border p-5 xl:block">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
