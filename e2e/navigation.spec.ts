import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('header shows club name and team', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: "SV Apollo '69 - JO9" })).toBeVisible()
  })

  test('nav contains all main links', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Wedstrijden' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Toplijst' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Spelers' })).toBeVisible()
  })

  test('navigates to players page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Spelers' }).click()
    await expect(page).toHaveURL('/players')
    await expect(page.getByRole('heading', { name: 'Spelers' })).toBeVisible()
  })

  test('navigates to topscorers page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Toplijst' }).click()
    await expect(page).toHaveURL('/topscorers')
    await expect(page.getByRole('heading', { name: 'Topscoorders' })).toBeVisible()
  })

  test('navigates to home page via header logo link', async ({ page }) => {
    await page.goto('/players')
    await page.getByRole('link', { name: 'Wedstrijden' }).click()
    await expect(page).toHaveURL('/')
  })

  test('navigates to login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL('/login')
  })
})
