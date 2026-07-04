import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('has correct page title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Home - Apollo '69/)
  })

  test('shows matches section heading', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Wedstrijden' })).toBeVisible()
  })

  test('shows login button when not authenticated', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.getByRole('link', { name: 'Inloggen' })).toBeVisible()
  })

  test('shows recent results card', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Recente resultaten')).toBeVisible()
  })
})
