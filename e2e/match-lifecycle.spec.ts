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

const CLUB_NAME = process.env.VITE_CLUBNAME ?? '';

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

        await test.step('record goals and revert them', async () => {
            const squad = page.getByTestId('appearance');
            if (!(await becomesVisible(squad.first(), 15_000))) return;

            const timeline = page.getByTestId('goal-timeline-item');
            const scoreFor = page.getByTestId('score-for');
            const scoreAgainst = page.getByTestId('score-against');

            /** Score for us, returning the label of the option picked. */
            const scoreForUs = async (option?: string) => {
                const logged = await timeline.count();

                await page
                    .getByRole('button', { name: 'Doelpunt voor toevoegen' })
                    .click();

                const dialog = page.getByRole('dialog', {
                    name: 'Doelpuntenmaker',
                });

                // The board goes up straight away, the timeline waits for a
                // scorer.
                await expect(timeline).toHaveCount(logged);

                await dialog.locator('[data-testid="goal-scorer"]').click();

                const choice = option
                    ? page.getByRole('option', { name: option })
                    : page.getByRole('option').first();
                const label = (await choice.innerText()).trim();
                await choice.click();

                await dialog.getByRole('button', { name: 'Opslaan' }).click();
                await expect(dialog).toBeHidden();

                return label;
            };

            const revert = async (side: 'voor' | 'tegen') => {
                await page
                    .getByRole('button', {
                        name: `Doelpunt ${side} verwijderen`,
                    })
                    .click();

                await expect(
                    side === 'voor' ? scoreFor : scoreAgainst,
                ).toHaveText('0');
                await expect(timeline).toHaveCount(0);
            };

            await test.step('a goal by one of ours', async () => {
                const scorer = await scoreForUs();

                await expect(scoreFor).toHaveText('1');
                await expect(timeline).toHaveCount(1);
                await expect(timeline.first()).toContainText(scorer);
                await expect(timeline.first()).toContainText("'");

                await revert('voor');
            });

            await test.step('an own goal by the opponent', async () => {
                await scoreForUs('Eigen doelpunt tegenstander');

                await expect(scoreFor).toHaveText('1');
                await expect(timeline).toHaveCount(1);
                await expect(timeline.first()).toContainText('Eigen doelpunt');

                await revert('voor');
            });

            await test.step('lowering the score in the edit dialog', async () => {
                const first = await scoreForUs();
                await scoreForUs();

                await expect(scoreFor).toHaveText('2');
                await expect(timeline).toHaveCount(2);

                await page.getByRole('button', { name: 'Meer opties' }).click();
                await page
                    .getByRole('menuitem', { name: 'Wedstrijd bewerken' })
                    .click();

                const dialog = page.getByRole('dialog', {
                    name: 'Wedstrijd bewerken',
                });
                const goals = dialog.getByLabel(CLUB_NAME);

                await goals.click();
                await goals.press('ArrowDown');

                await dialog.getByRole('button', { name: 'Opslaan' }).click();
                await expect(dialog).toBeHidden();

                // The later goal is dropped, the first one survives.
                await expect(scoreFor).toHaveText('1');
                await expect(timeline).toHaveCount(1);
                await expect(timeline.first()).toContainText(first);

                await revert('voor');
            });
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
