import {
    becomesVisible,
    deleteTraining,
    login,
    skipWithoutCredentials,
    skipWithoutEditableSeason,
} from './helpers/app';
import { expect, test, type Page } from '@playwright/test';

const pad = (value: number) => value.toString().padStart(2, '0');

/** The add/generate/settings actions live behind the overflow menu. */
const openTrainingActions = (page: Page) =>
    page.getByRole('button', { name: 'Meer opties' }).click();

/** A day with no training yet: those cells are the disabled ones. */
const firstFreeDay = async (page: Page, days: number[]) => {
    const today = new Date();

    for (const day of days) {
        const key = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(day)}`;

        if (await page.locator(`[data-date="${key}"]`).isDisabled()) {
            return { key, day };
        }
    }

    return null;
};

const daysInThisMonth = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
};

/** Searching from the end of the month, where the date itself doesn't matter. */
const findFreeDay = (page: Page) =>
    firstFreeDay(
        page,
        Array.from(
            { length: daysInThisMonth() },
            (_, i) => daysInThisMonth() - i,
        ),
    );

/**
 * Searching from the start of the month, for a day that has already passed:
 * only trainings that were actually held count towards attendance. Starting at
 * the other end keeps this off the day findFreeDay() hands the sibling test,
 * which may run in parallel.
 */
const findPastFreeDay = (page: Page) =>
    firstFreeDay(
        page,
        Array.from({ length: new Date().getDate() - 1 }, (_, i) => i + 1),
    );

const addTrainingForDay = async (page: Page, day: number) => {
    await openTrainingActions(page);
    await page.getByRole('menuitem', { name: 'Training toevoegen' }).click();

    const dialog = page.getByRole('dialog', { name: 'Training toevoegen' });

    // UInputDate is a segmented field, not a text input: focus the day
    // segment and type it. The field already defaults to today, so only the
    // day needs changing, and each digit auto-advances the focus.
    const daySegment = dialog
        .locator('[data-testid="date-input"]')
        .locator('[data-reka-date-field-segment="day"]');

    await daySegment.click();
    await page.keyboard.type(String(day));
    await expect(daySegment).toHaveText(String(day));

    await dialog.getByRole('button', { name: 'Training toevoegen' }).click();
    await expect(dialog).toBeHidden();
};

/** The attendance table sits in its own labelled region on /training. */
const attendanceRegion = (page: Page) =>
    page.getByRole('region', { name: 'Trainingsopkomst per speler' });

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
            await addTrainingForDay(page, free!.day);
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

    test('counts a player marked present in the attendance table', async ({
        page,
    }) => {
        await page.goto('/training');
        await expect(page.locator('[data-date]').first()).toBeVisible({
            timeout: 15_000,
        });

        const free = await findPastFreeDay(page);
        test.skip(
            !free,
            'Every day of this month before today already has a training.',
        );

        const dayCell = page.locator(`[data-date="${free!.key}"]`);
        await addTrainingForDay(page, free!.day);
        await expect(dayCell).toBeEnabled();

        await dayCell.click();
        await expect(page).toHaveURL(/\/training\/.+/);
        trainingUrl = page.url();

        const switches = page.getByRole('switch');
        const hasSquad = await becomesVisible(switches.first(), 15_000);

        test.skip(
            !hasSquad,
            'The active staging season has no players to mark attendance for.',
        );

        const playerName =
            (await switches.first().getAttribute('aria-label')) ?? '';

        // A second tab runs its own Firestore client, so the figures it shows
        // came back from the server rather than the acting page's cache.
        const viewer = await page.context().newPage();
        await viewer.goto('/training');

        const region = attendanceRegion(viewer);
        await expect(region).toBeVisible({ timeout: 15_000 });
        await region.getByRole('tab', { name: 'Maand', exact: true }).click();

        // UTable gives a selectable row role="button" rather than "row", so
        // match the <tr> itself instead of going through the row role.
        const playerRow = region
            .locator('tbody tr')
            .filter({ has: viewer.getByRole('cell', { name: playerName }) });
        const attended = playerRow.getByRole('cell').nth(1);

        // The training just created is in the past, so it already counts
        // towards the month's total: only the player's own tally may move.
        await expect(attended).toBeVisible();
        const [before, held] = (await attended.textContent())!
            .split('/')
            .map((part) => Number(part.trim()));

        await page.getByRole('switch', { name: playerName }).click();

        await expect(attended).toHaveText(`${before + 1} / ${held}`);
        await expect(playerRow.getByRole('cell').nth(2)).toHaveText(
            `${Math.round(((before + 1) / held) * 100)}%`,
        );

        await viewer.close();
    });

    test('reports what the bulk generator would create', async ({ page }) => {
        await page.goto('/training');
        await openTrainingActions(page);
        await page.getByRole('menuitem', { name: 'Bulk genereren' }).click();

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

test.describe('Training attendance table', () => {
    test.beforeEach(async ({ page }) => {
        skipWithoutCredentials();
        await login(page);
        await page.goto('/training');
        await expect(attendanceRegion(page)).toBeVisible({ timeout: 15_000 });
    });

    test('shows a period navigator for week and month, but not for the total', async ({
        page,
    }) => {
        const region = attendanceRegion(page);
        const previous = region.getByRole('button', { name: 'Vorige maand' });

        await expect(
            region.getByRole('tab', { name: 'Totaal', exact: true }),
        ).toHaveAttribute('aria-selected', 'true');
        await expect(previous).toBeHidden();

        await region.getByRole('tab', { name: 'Maand', exact: true }).click();
        await expect(previous).toBeVisible();
        await expect(
            region.getByRole('button', { name: 'Vandaag' }),
        ).toBeVisible();

        await region.getByRole('tab', { name: 'Week', exact: true }).click();
        await expect(previous).toBeHidden();
        await expect(
            region.getByRole('button', { name: 'Vorige week' }),
        ).toBeVisible();

        await region.getByRole('tab', { name: 'Totaal', exact: true }).click();
        await expect(
            region.getByRole('button', { name: 'Vorige week' }),
        ).toBeHidden();
    });

    test('does not navigate beyond the current week or month', async ({
        page,
    }) => {
        const region = attendanceRegion(page);
        const nextWeek = region.getByRole('button', {
            name: 'Volgende week',
        });

        // Anything ahead of today has no attendance to report on yet.
        await region.getByRole('tab', { name: 'Week', exact: true }).click();
        await expect(nextWeek).toBeDisabled();

        await region.getByRole('button', { name: 'Vorige week' }).click();
        await expect(nextWeek).toBeEnabled();

        await nextWeek.click();
        await expect(nextWeek).toBeDisabled();

        await region.getByRole('tab', { name: 'Maand', exact: true }).click();
        // A week can straddle two months, so return to today before asserting.
        await region.getByRole('button', { name: 'Vandaag' }).click();
        await expect(
            region.getByRole('button', { name: 'Volgende maand' }),
        ).toBeDisabled();
    });
});

// The only spec here that does not sign in: the table is for coaches alone.
test.describe('Training attendance table, signed out', () => {
    test('stays hidden', async ({ page }) => {
        await page.goto('/training');

        await expect(page.locator('[data-date]').first()).toBeVisible({
            timeout: 15_000,
        });
        await expect(attendanceRegion(page)).toBeHidden();
    });
});
