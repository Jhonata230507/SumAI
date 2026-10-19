'use client'

import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils/cn'

/**
 * The lazily loaded entry point for everything that draws with Recharts.
 *
 * Recharts is by far the heaviest dependency in a calculator's bundle, and
 * every chart it powers sits below the fold — the form and the result are what
 * the reader needs first. Imported directly, it still has to be downloaded,
 * parsed and executed before the page becomes interactive, so a click from the
 * home page spends that time on a chart nobody has scrolled to yet.
 *
 * Importing the charts from here instead splits them into their own chunk that
 * loads after the page is usable. Import chart components from this module, not
 * from their own files, or the library lands back in the page bundle.
 *
 * `ssr: false` costs nothing: Recharts measures the DOM to size itself, so a
 * chart renders empty on the server regardless.
 */

/**
 * Stands in while a chart's chunk loads, at the height the chart will take, so
 * arriving charts never push the content under them down the page.
 */
function ChartSkeleton({ height, className }: { height: number; className?: string }) {
  return (
    <div
      aria-hidden
      style={{ height }}
      className={cn('w-full animate-pulse rounded-xl bg-white/[0.03]', className)}
    />
  )
}

/** Heights mirror each component's own default, which no caller overrides. */
export const AmortizationChart = dynamic(
  () => import('./AmortizationChart').then((m) => m.AmortizationChart),
  { ssr: false, loading: () => <ChartSkeleton height={280} /> },
)

export const GrowthChart = dynamic(() => import('./GrowthChart').then((m) => m.GrowthChart), {
  ssr: false,
  loading: () => <ChartSkeleton height={300} />,
})

export const ComparisonChart = dynamic(
  () => import('./ComparisonChart').then((m) => m.ComparisonChart),
  { ssr: false, loading: () => <ChartSkeleton height={200} /> },
)

/**
 * Not a chart on its own — a card with a segmented control over a Recharts
 * area — but it pulls in the same library, so it loads the same way.
 */
export const MortgageSystems = dynamic(
  () => import('../calculator/MortgageSystems').then((m) => m.MortgageSystems),
  { ssr: false, loading: () => <ChartSkeleton height={420} /> },
)
