import { expect, test, type Page } from '@playwright/test';

import {
    ARCHIVED_SEASON,
    login,
    openMenu,
    pickDate,
    viewArchivedSeason,
} from './helpers/app';

const choosePeriod = async (page: Page, label: string) => {
    await page.getByTestId('period-select').click();
    await page.getByRole('option', { name: label, exact: true }).click();
};

// Edits the archived season, so the active one the write specs share keeps
// its header without a period select.
test('splits a season into periods that filter the stats', async ({ page }) => {
    await login(page);
    await openMenu(page);
    await page.getByRole('button', { name: 'Seizoenen beheren' }).click();

    const dialog = page.getByRole('dialog', { name: 'Seizoenen beheren' });
    await dialog.getByRole('combobox').first().click();
    await page.getByRole('option', { name: ARCHIVED_SEASON }).click();

    // A retry finds the periods the failed attempt saved.
    const remove = dialog.getByRole('button', { name: 'Periode verwijderen' });
    while (await remove.count()) await remove.first().click();

    for (const [start, end] of [
        ['2026-03-01', '2026-03-31'],
        ['2026-04-01', '2026-04-30'],
    ] as const) {
        await dialog.getByRole('button', { name: 'Periode toevoegen' }).click();
        const pickers = dialog
            .getByTestId('period-row')
            .last()
            .getByTestId('date-input');
        await pickDate(page, pickers.first(), start);
        await pickDate(page, pickers.last(), end);
    }

    await dialog.getByRole('button', { name: 'Opslaan' }).click();
    await expect(dialog).toBeHidden();

    const archive = await page.context().newPage();
    await viewArchivedSeason(archive);
    await archive.goto('/topscorers');
    // Name, goals, matches in goal, matches.
    const anna = archive.locator('tbody tr').filter({ hasText: 'Anna' });
    await expect(anna).toHaveText(/Anna\s*2\s*0\s*2/);

    // March holds the 3-1 win, April only the 0-2 loss.
    await choosePeriod(archive, 'Periode 2');
    await expect(anna).toHaveText(/Anna\s*0\s*0\s*1/);
    await choosePeriod(archive, 'Periode 1');
    await expect(anna).toHaveText(/Anna\s*2\s*0\s*1/);
    await archive.close();
});
