import { test, expect } from '@playwright/test'

test.describe('Topscorers page', () => {
  test('has correct page title', async ({ page }) => {
    await page.goto('/topscorers')
    await expect(page).toHaveTitle(/Apollo '69 JO9/)
  })

  test('shows topscorers heading', async ({ page }) => {
    await page.goto('/topscorers')
    await expect(page.getByRole('heading', { name: 'Topscoorders' })).toBeVisible()
  })
})
