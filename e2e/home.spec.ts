import { expect, test } from '@playwright/test';

import { viewArchivedSeason } from './helpers/app';

test.describe('Home page', () => {
    test('has correct page title', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/^Home - /);
    });

    test('shows matches section heading', async ({ page }) => {
        await page.goto('/');
        await expect(
            page.getByRole('heading', { name: 'Wedstrijden' }),
        ).toBeVisible();
    });

    test('shows login button when not authenticated', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: 'Menu' }).click();
        await expect(
            page.getByRole('link', { name: 'Inloggen' }),
        ).toBeVisible();
    });

    test("lists the archived season's results", async ({ page }) => {
        await viewArchivedSeason(page);
        await page.goto('/');

        await expect(page.getByText('Recente resultaten')).toBeVisible();
        await expect(
            page.locator('tbody tr').filter({ hasText: 'Oude Rivaal' }),
        ).toContainText('3-1');
        await expect(
            page.locator('tbody tr').filter({ hasText: 'Verre Rivaal' }),
        ).toContainText('0-2');
    });
});
