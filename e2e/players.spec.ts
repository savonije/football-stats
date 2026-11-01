import { expect, test } from '@playwright/test';

import {
    login,
    openMenu,
    uniqueLabel,
    viewArchivedSeason,
    visitorPage,
} from './helpers/app';

test.describe('Players page', () => {
    test('has correct page title', async ({ page }) => {
        await page.goto('/players');
        await expect(page).toHaveTitle(/^Spelers - /);
    });

    test('shows players heading', async ({ page }) => {
        await page.goto('/players');
        await expect(
            page.getByRole('heading', { name: 'Spelers', exact: true }),
        ).toBeVisible();
    });
});

test.describe('Players, archived season', () => {
    test.beforeEach(async ({ page }) => {
        await viewArchivedSeason(page);
    });

    test("lists the season's squad with their totals", async ({ page }) => {
        await page.goto('/players');

        const cards = page.getByTestId('player-list').getByRole('listitem');
        await expect(cards).toHaveText([/Anna/, /Bram/, /Cees/]);
        await expect(cards.first()).toContainText(
            /Totaal wedstrijden\s*2\s*Totaal doelpunten\s*2\s*Totaal keeper\s*0/,
        );
        await expect(cards.nth(2)).toContainText(/Totaal keeper\s*2/);
    });

    test("opens a player's statistics", async ({ page }) => {
        await page.goto('/players');
        await page.getByRole('link', { name: /Anna/ }).click();

        await expect(page).toHaveURL('/player/anna');
        await expect(
            page
                .getByTestId('stat-tile')
                .filter({ hasText: 'Totaal doelpunten' }),
        ).toContainText('2');
    });
});

test.describe('Players, signed in', () => {
    test('adds a guest player and edits their details', async ({
        page,
        browser,
    }) => {
        // A guest, so the squads the other specs count stay the same.
        const name = uniqueLabel('E2E gast');

        await login(page);
        await openMenu(page);
        await page.getByRole('button', { name: 'Speler toevoegen' }).click();

        const add = page.getByRole('dialog', { name: 'Speler toevoegen' });
        await add.getByRole('tab', { name: 'Nieuwe speler' }).click();
        await add.getByLabel('Naam').fill(name);
        await add.getByLabel('Gastspeler').check();
        await add.getByRole('button', { name: 'Opslaan' }).click();
        await expect(add).toBeHidden();

        const visitor = await visitorPage(browser);
        await visitor.goto('/players');
        await expect(
            visitor.getByRole('listitem').filter({ hasText: name }),
        ).toContainText('Gastspeler');
        await visitor.context().close();

        await page.goto('/players');
        await page.getByRole('link', { name }).click();
        await expect(page).toHaveURL(/\/player\/.+/);
        await page.getByRole('button', { name: 'Bewerken' }).click();

        const edit = page.getByRole('dialog', { name: 'Speler bewerken' });
        await edit.getByLabel('Kledingmaat').click();
        await page.getByRole('option', { name: '140', exact: true }).click();
        await edit.getByLabel('Heeft jas').check();
        await edit.getByRole('button', { name: 'Opslaan' }).click();
        await expect(edit).toBeHidden();

        // Player info is for coaches only, so the second tab stays signed in.
        const other = await page.context().newPage();
        await other.goto(page.url());
        const info = other.getByRole('listitem');
        await expect(info.filter({ hasText: 'Kledingmaat' })).toContainText(
            '140',
        );
        await expect(info.filter({ hasText: 'Heeft jas' })).toContainText('Ja');
        await other.close();
    });
});
