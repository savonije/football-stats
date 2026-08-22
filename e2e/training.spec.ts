import { expect, test, type Page } from '@playwright/test';

import {
    becomesVisible,
    deleteTraining,
    login,
    skipWithoutCredentials,
    skipWithoutEditableSeason,
} from './helpers/app';

const pad = (value: number) => value.toString().padStart(2, '0');

/** A day with no training yet: those cells are the disabled ones. */
const findFreeDay = async (page: Page) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    for (let day = lastDay; day > 0; day--) {
        const key = `${year}-${pad(month + 1)}-${pad(day)}`;

        if (await page.locator(`[data-date="${key}"]`).isDisabled()) {
            return { key, day };
        }
    }

    return null;
};

test.describe('Trainings', () => {
    let trainingUrl = '';

    test.beforeEach(async ({ page }) => {
        skipWithoutCredentials();
        await login(page);
        await skipWithoutEditableSeason(page);
    });

    test.afterEach(async ({ page }) => {
        if (trainingUrl) await deleteTraining(page, trainingUrl);
        trainingUrl = '';
    });

    test('adds a training and marks a player present, then absent', async ({
        page,
    }) => {
        await page.goto('/training');
        await expect(page.locator('[data-date]').first()).toBeVisible({
            timeout: 15_000,
        });

        const free = await findFreeDay(page);
        test.skip(
            !free,
            'Every day of this month already has a training in staging.',
        );

        const dayCell = page.locator(`[data-date="${free!.key}"]`);

        await test.step('add a training for a free date', async () => {
            await page
                .getByRole('button', { name: 'Training toevoegen' })
                .click();

            const dialog = page.getByRole('dialog', {
                name: 'Training toevoegen',
            });

            // The panel overlays the whole dialog, so pick the day inside it;
            // selecting a date closes it again.
            const picker = page.locator('[data-pc-section="panel"]');
            await dialog.getByLabel('Datum').click();
            await expect(picker).toBeVisible();

            // Neighbouring months share the aria-label, and only they carry
            // data-p-other-month.
            await picker
                .locator(
                    `[data-pc-section="daycell"][aria-label="${free!.day}"]:not([data-p-other-month="true"])`,
                )
                .click();
            await expect(picker).toBeHidden();

            await dialog
                .getByRole('button', { name: 'Training toevoegen' })
                .click();
            await expect(dialog).toBeHidden();
            await expect(dayCell).toBeEnabled();
        });

        await dayCell.click();
        await expect(page).toHaveURL(/\/training\/.+/);
        trainingUrl = page.url();

        const switches = page.getByRole('switch');
        const hasSquad = await becomesVisible(switches.first(), 15_000);

        test.skip(
            !hasSquad,
            'The active staging season has no players to mark attendance for.',
        );

        const total = await switches.count();
        const playerName =
            (await switches.first().getAttribute('aria-label')) ?? '';
        const playerSwitch = page.getByRole('switch', { name: playerName });

        await expect(page.getByText(`0 / ${total} aanwezig`)).toBeVisible();

        // A second tab has its own Firestore client, so what it shows came
        // from the server. A reload cannot tell that apart from the acting
        // page's local cache.
        const viewer = await page.context().newPage();
        await viewer.goto(trainingUrl);
        await expect(viewer.getByText(`0 / ${total} aanwezig`)).toBeVisible();

        await test.step('mark the player present', async () => {
            await playerSwitch.click();

            await expect(page.getByText(`1 / ${total} aanwezig`)).toBeVisible();
            await expect(
                viewer.getByText(`1 / ${total} aanwezig`),
            ).toBeVisible();
            await expect(
                viewer.getByRole('switch', { name: playerName }),
            ).toBeChecked();
        });

        await test.step('mark the player absent again', async () => {
            await playerSwitch.click();

            await expect(page.getByText(`0 / ${total} aanwezig`)).toBeVisible();
            await expect(
                viewer.getByText(`0 / ${total} aanwezig`),
            ).toBeVisible();
            await expect(
                viewer.getByRole('switch', { name: playerName }),
            ).not.toBeChecked();
        });

        await viewer.close();
    });

    test('reports what the bulk generator would create', async ({ page }) => {
        await page.goto('/training');
        await page.getByRole('button', { name: 'Bulk genereren' }).click();

        const dialog = page.getByRole('dialog', {
            name: 'Trainingen voor een maand genereren',
        });

        await expect(
            dialog.getByText(
                /nieuwe training|bestaan al|nog geen trainingsdagen/i,
            ),
        ).toBeVisible();

        await dialog.getByRole('button', { name: 'Annuleren' }).click();
        await expect(dialog).toBeHidden();
    });
});
