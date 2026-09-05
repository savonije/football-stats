import { expect, test } from '@playwright/test';

import {
    acceptConfirm,
    createMatch,
    deleteMatch,
    login,
    skipWithoutFirebaseConfig,
    skipWithoutCredentials,
    skipWithoutEditableSeason,
    uniqueLabel,
} from './helpers/app';

test.describe('Match timer lifecycle', () => {
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

    test('runs a match from kick-off to full time', async ({ page }) => {
        matchUrl = await createMatch(page, uniqueLabel('E2E timer'));

        const clock = page.getByTestId('match-clock');
        const status = page.getByTestId('match-status');
        await expect(clock).toHaveText('0:00');

        await test.step('kick off the first half', async () => {
            await page
                .getByRole('button', { name: 'Start', exact: true })
                .click();

            await expect(status).toHaveText('1e helft');
            await expect(clock).not.toHaveText('0:00', { timeout: 5000 });
        });

        await test.step('end the first half', async () => {
            await page
                .getByRole('button', { name: 'Eerste helft beëindigen' })
                .click();
            await acceptConfirm(page, 'Eerste helft beëindigen');

            await expect(status).toHaveText('Rust');
            await expect(
                page.getByRole('button', { name: 'Tweede helft starten' }),
            ).toBeVisible();
        });

        await test.step('start the second half', async () => {
            await page
                .getByRole('button', { name: 'Tweede helft starten' })
                .click();

            await expect(status).toHaveText('2e helft');
            // The clock resumes at the half-duration offset, not at zero.
            await expect(clock).not.toHaveText('0:00');
        });

        await test.step('end the match', async () => {
            await page
                .getByRole('button', { name: 'Wedstrijd beëindigen' })
                .click();
            await acceptConfirm(page, 'Wedstrijd beëindigen');

            await expect(page.getByText('Wedstrijd beëindigd')).toBeVisible();

            // The running clock is replaced by the time it finished on, so the
            // live clock is gone rather than frozen in place.
            await expect(clock).toBeHidden();
            await expect(page.getByTestId('match-final-time')).toBeVisible();
        });

        await test.step('a second viewer sees the ended match', async () => {
            // A second tab has its own Firestore client, so what it renders
            // came from the server. A reload cannot tell that apart from the
            // acting page's local cache.
            const viewer = await page.context().newPage();
            await viewer.goto(matchUrl);

            await expect(viewer.getByText('Wedstrijd beëindigd')).toBeVisible();
            await viewer.close();
        });
    });
});
