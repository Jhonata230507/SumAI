'use client'

import posthog from 'posthog-js'
import type { CalculatorId } from '@/types/common'

let initialized = false

export function initAnalytics() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (initialized || !key || typeof window === 'undefined') return

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
  })
  initialized = true
}

/**
 * Typed event map. Analytics events are a product surface — keeping them in one
 * union stops the same idea being logged under three different names.
 */
export type AnalyticsEvent =
  | { name: 'calculator_viewed'; props: { calculator: CalculatorId; country: string } }
  | { name: 'calculation_run'; props: { calculator: CalculatorId; country: string } }
  | { name: 'scenario_saved'; props: { calculator: CalculatorId } }
  | { name: 'scenarios_compared'; props: { count: number } }
  | { name: 'ai_analysis_requested'; props: { calculator: CalculatorId } }
  | { name: 'product_clicked'; props: { productId: string; category: string; position: number } }
  | { name: 'goal_created'; props: { type: string } }

export function track<E extends AnalyticsEvent>(event: E['name'], props: Extract<AnalyticsEvent, { name: E['name'] }>['props']) {
  if (!initialized) return
  posthog.capture(event, props)
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  if (!initialized) return
  posthog.identify(userId, traits)
}

export function pageview(path: string) {
  if (!initialized) return
  posthog.capture('$pageview', { $current_url: path })
}
