import { test, expect } from '@playwright/test';

import { viewArchivedSeason } from './helpers/app';

test.describe('Topscorers page', () => {
    test('has correct page title', async ({ page }) => {
        await page.goto('/topscorers');
        await expect(page).toHaveTitle(/^Topscorers - /);
    });

    test('shows topscorers heading', async ({ page }) => {
        await page.goto('/topscorers');
        await expect(
            page.getByRole('heading', { name: 'Topscoorders' }),
        ).toBeVisible();
    });

    test("ranks the archived season's scorers", async ({ page }) => {
        await viewArchivedSeason(page);
        await page.goto('/topscorers');

        // Name, goals, matches in goal, matches.
        await expect(page.locator('tbody tr')).toHaveText([
            /Anna\s*2\s*0\s*2/,
            /Bram\s*1\s*0\s*2/,
            /Cees\s*0\s*2\s*2/,
        ]);
    });
});
