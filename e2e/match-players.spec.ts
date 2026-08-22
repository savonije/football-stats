import { expect, test } from '@playwright/test';

import {
    acceptConfirm,
    becomesVisible,
    createMatch,
    deleteMatch,
    login,
    skipWithoutCredentials,
    skipWithoutEditableSeason,
    uniqueLabel,
} from './helpers/app';

/**
 * Appearances are their own subcollection under a match, edited from three
 * different places in the UI. One match is created here and the same player is
 * edited, removed and added back, so the squad ends where it started.
 */
test.describe('Match players', () => {
    let matchUrl = '';

    test.beforeEach(async ({ page }) => {
        skipWithoutCredentials();
        await login(page);
        await skipWithoutEditableSeason(page);
    });

    test.afterEach(async ({ page }) => {
        if (matchUrl) await deleteMatch(page, matchUrl);
        matchUrl = '';
    });

    test('edits, removes and re-adds a player in a match', async ({ page }) => {
        matchUrl = await createMatch(page, uniqueLabel('E2E squad'));

        // A new match starts with the season's squad already selected, so the
        // appearance list doubles as the check that creation seeded it.
        const squad = page.getByTestId('appearance');
        const hasSquad = await becomesVisible(squad.first(), 15_000);

        test.skip(
            !hasSquad,
            'The active staging season has no players, so a match has no squad.',
        );

        const squadSize = await squad.count();
        const playerName = (
            await squad.first().getByRole('link').innerText()
        ).trim();
        const card = squad.filter({
            has: page.getByRole('link', { name: playerName, exact: true }),
        });

        await test.step('edit goals and keeper', async () => {
            await card
                .getByRole('button', { name: 'Statistieken bewerken' })
                .click();

            const dialog = page.getByRole('dialog', { name: playerName });
            const goals = dialog.getByLabel('Doelpunten');

            // The spinner keys sidestep any locale parsing of typed numbers.
            await goals.click();
            await goals.press('ArrowUp');
            await goals.press('ArrowUp');

            await dialog
                .getByRole('switch', { name: 'Keeper geweest?' })
                .click();
            await dialog.getByRole('button', { name: 'Opslaan' }).click();
            await expect(dialog).toBeHidden();

            await expect(card).toContainText('⚽⚽');
            await expect(card).toContainText('🧤');
        });

        await test.step('remove the player from the match', async () => {
            await card
                .getByRole('button', { name: 'Statistieken bewerken' })
                .click();

            const dialog = page.getByRole('dialog', { name: playerName });
            await dialog
                .getByRole('button', {
                    name: 'Speler uit wedstrijd verwijderen',
                })
                .click();
            await acceptConfirm(page, 'Verwijderen');

            await expect(card).toHaveCount(0);
            await expect(squad).toHaveCount(squadSize - 1);
        });

        await test.step('add the player back to the match', async () => {
            await page.getByRole('button', { name: 'Meer opties' }).click();
            await page
                .getByRole('menuitem', { name: 'Spelers toevoegen' })
                .click();

            const dialog = page.getByRole('dialog', {
                name: 'Spelers toevoegen',
            });
            // role=combobox sits on MultiSelect's hidden input, which the
            // visible label covers, so drive the root the way a user does.
            const players = dialog.locator('.p-multiselect');

            await players.click();
            await page
                .getByRole('option', { name: playerName, exact: true })
                .click();
            // Close the overlay again, it covers the dialog footer.
            await players.click();

            await dialog.getByRole('button', { name: 'Toevoegen' }).click();
            await expect(dialog).toBeHidden();

            await expect(squad).toHaveCount(squadSize);
            // The re-added appearance is a fresh document, back at zero goals.
            await expect(card).not.toContainText('⚽');
        });
    });
});
