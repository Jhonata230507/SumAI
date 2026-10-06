'use client'

import { useEffect } from 'react'

const DURATION = 1000
/**
 * Wheel events closer together than this belong to the same gesture. Trackpads
 * keep emitting decaying "inertia" events for up to a second after the fingers
 * lift; treating them as one gesture is what stops them overshooting the stop.
 */
const GESTURE_GAP = 180
/** Swipes shorter than this (px) are taps or jitter, not a scroll intent. */
const SWIPE_THRESHOLD = 12
/** Keyboard has no inertia, only auto-repeat; a short pause is enough. */
const KEY_COOLDOWN = 250

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * Turns the home page's hero → calculators transition into a single gesture.
 *
 * From the hero, one scroll down (wheel, trackpad, swipe or keyboard) carries
 * the page all the way to the calculators section with an eased animation.
 * From the top of that section, one scroll up returns to the hero. Anywhere
 * further down, scrolling is left completely native.
 *
 * Precision rules:
 * - A gesture that triggered a snap is swallowed until it ends (wheel events
 *   stop arriving, or the finger lifts), so inertia cannot drift past the stop.
 * - Every frame re-reads the destination, so a layout change mid-animation
 *   (a mobile address bar showing or hiding) cannot leave it off target.
 * - The last frame lands on the exact pixel.
 *
 * Reduced-motion users get the same two stops, reached instantly.
 */
export function HeroSnap({ targetId }: { targetId: string }) {
  useEffect(() => {
    const target = document.getElementById(targetId)
    if (!target) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let animating = false
    let lastWheelAt = 0
    let wheelGestureConsumed = false
    let touchStartY: number | null = null
    let touchGestureConsumed = false
    let keyLockedUntil = 0

    const targetTop = () => Math.round(target.getBoundingClientRect().top + window.scrollY)
    const inHero = () => window.scrollY < targetTop() - 2
    const atTarget = () => Math.abs(window.scrollY - targetTop()) <= 2
    const inZone = () => animating || inHero() || atTarget()

    function animateTo(destination: () => number) {
      if (reduced) {
        window.scrollTo({ top: destination(), behavior: 'instant' })
        return
      }
      const start = window.scrollY
      const startedAt = performance.now()
      animating = true

      const step = (now: number) => {
        const t = Math.min(1, (now - startedAt) / DURATION)
        // Re-aim every frame: the destination can move if the viewport resizes.
        const top = t < 1 ? start + (destination() - start) * ease(t) : destination()
        window.scrollTo({ top: Math.round(top), behavior: 'instant' })
        if (t < 1) requestAnimationFrame(step)
        else animating = false
      }
      requestAnimationFrame(step)
    }

    /** Starts a snap for a gesture in `direction`, if one applies. Returns true when it did. */
    function snap(direction: 1 | -1): boolean {
      if (direction > 0 && inHero()) {
        animateTo(targetTop)
        return true
      }
      if (direction < 0 && (inHero() || atTarget()) && window.scrollY > 0) {
        animateTo(() => 0)
        return true
      }
      return false
    }

    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || Math.abs(event.deltaY) < 1) return // pinch-zoom or horizontal scroll

      const now = performance.now()
      const continuesGesture = now - lastWheelAt < GESTURE_GAP
      lastWheelAt = now

      if (animating) {
        event.preventDefault()
        return
      }
      // The tail of a gesture that already snapped (trackpad inertia): swallow it.
      if (continuesGesture && wheelGestureConsumed) {
        if (inZone()) event.preventDefault()
        return
      }

      wheelGestureConsumed = false
      if (!inZone()) return
      if (snap(event.deltaY > 0 ? 1 : -1)) {
        wheelGestureConsumed = true
        event.preventDefault()
      }
    }

    function onTouchStart(event: TouchEvent) {
      touchStartY = event.touches[0]?.clientY ?? null
      touchGestureConsumed = false
    }

    function onTouchMove(event: TouchEvent) {
      // Once a swipe has snapped, the animation owns the rest of that swipe.
      if (animating || touchGestureConsumed) {
        if (event.cancelable) event.preventDefault()
        return
      }
      if (touchStartY === null || !inZone()) return
      const delta = touchStartY - (event.touches[0]?.clientY ?? touchStartY)
      if (Math.abs(delta) < SWIPE_THRESHOLD) return
      if (snap(delta > 0 ? 1 : -1)) {
        touchGestureConsumed = true
        if (event.cancelable) event.preventDefault()
      }
    }

    function onTouchEnd() {
      touchStartY = null
    }

    function onKeyDown(event: KeyboardEvent) {
      const field = (event.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable]')
      if (field) return
      const down = ['ArrowDown', 'PageDown', ' '].includes(event.key) && !event.shiftKey
      const up = ['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey)
      if ((!down && !up) || !inZone()) return
      if (animating || performance.now() < keyLockedUntil) {
        event.preventDefault()
        return
      }
      if (snap(down ? 1 : -1)) {
        event.preventDefault()
        keyLockedUntil = performance.now() + DURATION + KEY_COOLDOWN
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [targetId])

  return null
}
