import { expect, test } from '@playwright/test';

import {
    acceptConfirm,
    createMatch,
    deleteMatch,
    login,
    skipWithoutCredentials,
    skipWithoutEditableSeason,
    uniqueLabel,
} from './helpers/app';

/**
 * The live match clock writes raw timestamps to the match document on every
 * transition, so the only way to cover it is to walk a real match through all
 * four states. The match is created here and deleted again afterwards.
 */
test.describe('Match timer lifecycle', () => {
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

    test('runs a match from kick-off to full time', async ({ page }) => {
        matchUrl = await createMatch(page, uniqueLabel('E2E timer'));

        const clock = page.getByTestId('match-clock');
        await expect(clock).toHaveText('0:00');

        await test.step('kick off the first half', async () => {
            await page
                .getByRole('button', { name: 'Start', exact: true })
                .click();

            await expect(page.getByText('1e helft')).toBeVisible();
            // The clock is derived from the stored startTime, so it must tick.
            await expect(clock).not.toHaveText('0:00', { timeout: 5000 });
        });

        await test.step('end the first half', async () => {
            await page
                .getByRole('button', { name: 'Eerste helft beëindigen' })
                .click();
            await acceptConfirm(page, 'Eerste helft beëindigen');

            await expect(page.getByText('Rust')).toBeVisible();
            await expect(
                page.getByRole('button', { name: 'Tweede helft starten' }),
            ).toBeVisible();
        });

        await test.step('start the second half', async () => {
            await page
                .getByRole('button', { name: 'Tweede helft starten' })
                .click();

            await expect(page.getByText('2e helft')).toBeVisible();
            // The second half is offset by the season's half duration, so the
            // clock resumes there rather than restarting at zero.
            await expect(clock).not.toHaveText('0:00');
        });

        await test.step('end the match', async () => {
            await page
                .getByRole('button', { name: 'Wedstrijd beëindigen' })
                .click();
            await acceptConfirm(page, 'Wedstrijd beëindigen');

            await expect(page.getByText('Wedstrijd beëindigd')).toBeVisible();
            await expect(clock).toBeHidden();
        });

        await test.step('a second viewer sees the ended match', async () => {
            // The timer writes straight to the match document so every viewer
            // stays in sync. A second tab runs its own Firestore client, so
            // what it renders came back from the server rather than out of the
            // acting page's local cache — which a reload cannot tell apart.
            const viewer = await page.context().newPage();
            await viewer.goto(matchUrl);

            await expect(viewer.getByText('Wedstrijd beëindigd')).toBeVisible();
            await viewer.close();
        });
    });
});
