import { test, expect } from '@playwright/test'

test.describe('Players page', () => {
  test('has correct page title', async ({ page }) => {
    await page.goto('/players')
    await expect(page).toHaveTitle(/Apollo '69 JO9/)
  })

  test('shows players heading', async ({ page }) => {
    await page.goto('/players')
    await expect(page.getByRole('heading', { name: 'Spelers' })).toBeVisible()
  })

  test('shows loading state or player list', async ({ page }) => {
    await page.goto('/players')
    const playerList = page.locator('.player-list, [data-testid="player-list"]')
    const spinner = page.locator('.p-progressspinner, [aria-label="Loading"]')
    const noPlayersMsg = page.getByText('Geen spelers gevonden...')

    await expect(playerList.or(spinner).or(noPlayersMsg).first()).toBeVisible({ timeout: 5000 })
  })
})
