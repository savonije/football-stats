import { test, expect } from '@playwright/test'

import { skipWithoutFirebaseConfig } from './helpers/app'

test.describe('Players page', () => {
  test.beforeEach(() => {
    skipWithoutFirebaseConfig()
  })

  test('has correct page title', async ({ page }) => {
    await page.goto('/players')
    await expect(page).toHaveTitle(/Spelers - Apollo '69/)
  })

  test('shows players heading', async ({ page }) => {
    await page.goto('/players')
    await expect(page.getByRole('heading', { name: 'Spelers', exact: true })).toBeVisible()
  })

  test('shows loading state or player list', async ({ page }) => {
    await page.goto('/players')
    const playerList = page.locator('.player-list, [data-testid="player-list"]')
    const spinner = page.locator('[data-testid="progress-spinner"]')
    const noPlayersMsg = page.getByText('Geen spelers gevonden...')

    await expect(playerList.or(spinner).or(noPlayersMsg).first()).toBeVisible({ timeout: 5000 })
  })
})
