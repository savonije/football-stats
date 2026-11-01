import { expect, test, type Page } from '@playwright/test';
import dayjs from 'dayjs';

import {
    createMatch,
    deleteMatch,
    login,
    uniqueLabel,
    visitorPage,
} from './helpers/app';

const choose = async (page: Page, select: string, option: string) => {
    await page.getByRole('combobox', { name: select }).click();
    await page.getByRole('option', { name: option, exact: true }).click();
};

test.describe('Washing schedule', () => {
    let matchUrl = '';

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test.afterEach(async ({ page }) => {
        if (matchUrl) await deleteMatch(page, matchUrl);
        matchUrl = '';
    });

    test('assigns a washer that visitors then see', async ({
        page,
        browser,
    }) => {
        const opponent = uniqueLabel('E2E was');

        // Yesterday, under "Afgelopen": the other specs add their matches
        // today or later, so this one can't be pushed off the first page.
        matchUrl = await createMatch(page, opponent, {
            date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        });

        await page.goto('/washing');
        await choose(page, 'Periode', 'Afgelopen');

        const row = page.locator('tbody tr').filter({ hasText: opponent });
        await row.getByRole('combobox').click();
        await page.getByRole('option', { name: 'Cees', exact: true }).click();
        await expect(row.getByRole('combobox')).toHaveText('Cees');

        await choose(page, 'Toewijzing', 'Niet toegewezen');
        await expect(row).toBeHidden();
        await choose(page, 'Toewijzing', 'Toegewezen');
        await expect(row).toBeVisible();

        const visitor = await visitorPage(browser);
        await visitor.goto('/washing');
        await choose(visitor, 'Periode', 'Afgelopen');
        await expect(
            visitor
                .locator('tbody tr')
                .filter({ hasText: opponent })
                .getByRole('link', { name: 'Cees' }),
        ).toBeVisible();
        await visitor.context().close();
    });
});
