import {
    expect,
    test,
    type Browser,
    type Locator,
    type Page,
} from '@playwright/test';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// Created by global-setup.ts in the Auth emulator, so it exists nowhere else.
export const E2E_EMAIL = 'coach@example.test';
export const E2E_PASSWORD = 'e2e-password';

/**
 * Seeded by global-setup.ts as an inactive season with two finished matches:
 * Oude Rivaal 3-1 (home, March 2026; Anna 2, Bram 1) and Verre Rivaal 0-2
 * (away, April 2026), played by Anna, Bram and Cees, with Cees in goal. Nothing
 * can edit an inactive season, so read-only specs can assert exact figures.
 */
export const ARCHIVED_SEASON = '2025-2026';

/** Makes `page` open on the archived season, as a stored selection would. */
export const viewArchivedSeason = (page: Page) =>
    page.addInitScript(
        (id) => localStorage.setItem('selectedSeason', id),
        ARCHIVED_SEASON,
    );

/** A signed-out browser of its own: whatever it renders came from the server. */
export const visitorPage = async (browser: Browser) => {
    const context = await browser.newContext({
        baseURL: test.info().project.use.baseURL,
    });
    return context.newPage();
};

/**
 * Picks `YYYY-MM-DD` in a DatePicker whose calendar opens on today's month,
 * which is every empty one and every one that defaults to today.
 */
export const pickDate = async (page: Page, trigger: Locator, date: string) => {
    // UCalendar labels itself "Evenementdatum, <month>".
    const calendar = page.getByLabel(/^Evenementdatum/);

    // The previous picker's calendar lingers while it animates closed.
    await expect(calendar).toHaveCount(0);
    await trigger.click();

    const [year = 0, month = 0] = date.split('-').map(Number);
    const now = new Date();
    const steps = (year - now.getFullYear()) * 12 + month - 1 - now.getMonth();
    const turn = calendar.getByRole('button', {
        name: steps < 0 ? 'Vorige maand' : 'Volgende maand',
        exact: true,
    });
    for (let i = 0; i < Math.abs(steps); i++) await turn.click();

    await calendar
        .locator(`[data-value="${date}"]:not([data-outside-view])`)
        .click();
};

/** A Node-side Firebase client on the emulators, as the e2e build connects. */
export const emulatorClient = (name: string) => {
    const app = initializeApp(
        { projectId: 'demo-football-stats', apiKey: 'demo' },
        name,
    );
    const db = getFirestore(app);
    const auth = getAuth(app);
    connectFirestoreEmulator(db, '127.0.0.1', 8180);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
        disableWarnings: true,
    });

    return { app, db, auth };
};

export const uniqueLabel = (prefix: string) =>
    `${prefix} ${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

const becomesVisible = (locator: Locator, timeout = 10_000) =>
    locator.waitFor({ state: 'visible', timeout }).then(
        () => true,
        () => false,
    );

export const login = async (page: Page) => {
    await page.goto('/login');
    await page.getByTestId('input-email').fill(E2E_EMAIL);
    await page.getByTestId('input-password').fill(E2E_PASSWORD);
    await page.getByTestId('btn-submit').click();

    await expect(page).toHaveURL('/', { timeout: 20_000 });
};

export const openMenu = (page: Page) =>
    page.getByRole('button', { name: 'Menu' }).click();

export const acceptConfirm = async (page: Page, acceptLabel: string) => {
    const confirmation = page.getByRole('alertdialog');
    await confirmation.getByRole('button', { name: acceptLabel }).click();
    await expect(confirmation).toBeHidden();
};

const openMatch = async (page: Page, opponent: string) => {
    await page.getByPlaceholder('Zoek tegenstander').fill(opponent);
    await page.getByRole('cell', { name: opponent, exact: true }).click();
    await expect(page).toHaveURL(/\/match\/.+/);

    return page.url();
};

/** `date` is `YYYY-MM-DD`; the dialog defaults to a home match today. */
export const createMatch = async (
    page: Page,
    opponent: string,
    {
        withSquad = true,
        date,
        away = false,
    }: { withSquad?: boolean; date?: string; away?: boolean } = {},
) => {
    await page.goto('/');
    await openMenu(page);
    await page.getByRole('button', { name: 'Wedstrijd toevoegen' }).click();

    const dialog = page.getByRole('dialog', { name: 'Wedstrijd toevoegen' });
    await dialog.getByLabel('Tegenstander').fill(opponent);

    if (date) await pickDate(page, dialog.getByTestId('date-input'), date);

    if (away) {
        await dialog.getByLabel('Uit of thuis').click();
        await page.getByRole('option', { name: 'Uit', exact: true }).click();
    }

    // The dialog preselects the whole squad, so an empty match means
    // unpicking every option again.
    if (!withSquad) {
        const players = dialog.locator('[data-testid="match-players"]');
        await players.click();

        const selected = page.getByRole('option', { selected: true });
        for (let left = await selected.count(); left > 0; left--) {
            await selected.first().click();
        }

        await players.click();
    }
    await dialog.getByRole('button', { name: 'Toevoegen' }).click();
    await expect(dialog).toBeHidden();

    return openMatch(page, opponent);
};

export const deleteMatch = async (page: Page, matchUrl: string) => {
    await page.goto(matchUrl);

    const menu = page.getByRole('button', { name: 'Meer opties' });
    if (!(await becomesVisible(menu))) return;

    await menu.click();
    await page.getByRole('menuitem', { name: 'Wedstrijd verwijderen' }).click();
    await acceptConfirm(page, 'Verwijderen');
    await expect(page).toHaveURL('/');
};

/** Trainings older than a week open read-only; switch that off. */
export const unlockTraining = async (page: Page) => {
    const toggle = page.getByTestId('read-only-toggle');
    if (!(await becomesVisible(toggle))) return;

    if ((await toggle.getAttribute('aria-pressed')) === 'true') {
        await toggle.click();
    }
};

export const deleteTraining = async (page: Page, trainingUrl: string) => {
    await page.goto(trainingUrl);
    await unlockTraining(page);

    const menu = page.getByRole('button', { name: 'Meer opties' });
    if (!(await becomesVisible(menu))) return;

    await menu.click();
    await page.getByRole('menuitem', { name: 'Training verwijderen' }).click();
    await acceptConfirm(page, 'Verwijderen');
    await expect(page).toHaveURL('/training');
};
