import { expect, test } from '@playwright/test';

import {
    becomesVisible,
    createMatch,
    deleteMatch,
    login,
    skipWithoutCredentials,
    skipWithoutEditableSeason,
    skipWithoutFirebaseConfig,
    uniqueLabel,
} from './helpers/app';

test.describe('Goal banner', () => {
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

    test('celebrates our goals, not the opponent', async ({ page }) => {
        // The banner runs on real timers: 10s of "Goal!", 20s until it closes.
        test.slow();

        matchUrl = await createMatch(page, uniqueLabel('E2E banner'));
        await page.getByRole('button', { name: 'Start', exact: true }).click();

        test.skip(
            !(await becomesVisible(page.getByTestId('appearance').first())),
            'No players in this match, so there is no scorer to pick.',
        );

        // The strip is collapsed but still in the DOM, so open/closed is read
        // from the screen reader announcement, which is only set while open.
        const banner = page.getByTestId('goal-banner');
        const word = (text: string) => banner.getByText(text, { exact: true });
        const scorerDialog = page.getByRole('dialog', {
            name: 'Doelpuntenmaker',
        });

        await test.step('a goal against shows a toast, no banner', async () => {
            await page
                .getByRole('button', { name: 'Doelpunt tegen toevoegen' })
                .click();

            await expect(page.getByTestId('score-against')).toHaveText('1');
            await expect(
                page.getByText('Doelpunt gemaakt door de tegenstander'),
            ).toBeVisible();
            await expect(banner).not.toContainText('Doelpunt');
        });

        await test.step('an own goal opens the banner', async () => {
            await page
                .getByRole('button', { name: 'Doelpunt voor toevoegen' })
                .click();
            await scorerDialog
                .getByRole('button', { name: 'Eigen doelpunt tegenstander' })
                .click();

            await expect(banner).toContainText(
                'Eigen doelpunt door de tegenstander',
            );
            await expect(word('Goal!').first()).toBeAttached();
        });

        let scorer = '';

        await test.step('a goal by one of ours restarts it', async () => {
            await page
                .getByRole('button', { name: 'Doelpunt voor toevoegen' })
                .click();
            await scorerDialog.locator('[data-testid="goal-scorer"]').click();

            const choice = page.getByRole('option').first();
            scorer = (await choice.innerText()).trim();
            await choice.click();
            await scorerDialog.getByRole('button', { name: 'Opslaan' }).click();

            await expect(banner).toContainText(`door ${scorer}`);
            await expect(word('Goal!').first()).toBeAttached();
        });

        await test.step('"Goal!" makes way for the scorer', async () => {
            await expect(word(scorer).first()).toBeAttached({
                timeout: 15_000,
            });
            await expect(word('Goal!')).toHaveCount(0);
        });

        await test.step('the banner closes again', async () => {
            await expect(banner).not.toContainText('Doelpunt', {
                timeout: 15_000,
            });
        });
    });
});
