import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
    test('has correct page title', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Home - Apollo '69/);
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

    test('shows recent results card or empty matches state', async ({
        page,
    }) => {
        await page.goto('/');
        const card = page.getByText('Recente resultaten');
        const emptyMatches = page.getByText('Geen wedstrijden');

        await expect(card.or(emptyMatches).first()).toBeVisible({
            timeout: 5000,
        });
    });
});
