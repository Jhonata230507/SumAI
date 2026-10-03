import { expect, test } from '@playwright/test'

/**
 * Smoke tests against a running dev server. They check the paths a visitor
 * takes without an account; the signed-in area needs a seeded test user.
 */

const CALCULATORS = ['loan', 'mortgage', 'car-loan', 'investment', 'savings', 'debt-payoff']

test.describe('public calculators', () => {
  for (const slug of CALCULATORS) {
    test(`${slug} renders a result`, async ({ page }) => {
      await page.goto(`/calculators/${slug}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      // Every calculator opens on defaults, so a figure is on screen before any input.
      await expect(page.locator('.tabular-nums').first()).toBeVisible()
    })
  }

  test('loan payment updates as the amount changes', async ({ page }) => {
    await page.goto('/calculators/loan')

    const headline = page.locator('p.text-3xl').first()
    const before = await headline.textContent()

    const amount = page.getByLabel('Loan amount')
    await amount.click()
    await amount.fill('40000')
    await amount.blur()

    await expect(headline).not.toHaveText(before ?? '')
  })

  test('switching country changes the currency', async ({ page, context }) => {
    await context.addCookies([{ name: 'country', value: 'co', url: 'http://localhost:3000' }])
    await page.goto('/calculators/mortgage')
    await expect(page.getByText(/COP/)).toBeVisible()
  })
})

test('signed-out visitors are sent away from the dashboard', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/signin=1/)
})
