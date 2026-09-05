import { expect, test } from '@playwright/test';

import {
    acceptConfirm,
    becomesVisible,
    createMatch,
    deleteMatch,
    login,
    skipWithoutFirebaseConfig,
    skipWithoutCredentials,
    skipWithoutEditableSeason,
    uniqueLabel,
} from './helpers/app';

test.describe('Match players', () => {
    let matchUrl = '';

    test.beforeEach(async ({ page }) => {
        skipWithoutFirebaseConfig();
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

            // Spinner keys, so no locale parsing of typed numbers.
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
            const players = dialog.locator('[data-testid="match-players"]');

            await players.click();
            await page
                .getByRole('option', { name: playerName, exact: true })
                .click();
            await players.click(); // close the overlay off the dialog footer

            await dialog.getByRole('button', { name: 'Toevoegen' }).click();
            await expect(dialog).toBeHidden();

            await expect(squad).toHaveCount(squadSize);
            await expect(card).not.toContainText('⚽');
        });
    });
});
