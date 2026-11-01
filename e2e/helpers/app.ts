import { expect, type Locator, type Page } from '@playwright/test';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// Created by global-setup.ts in the Auth emulator, so it exists nowhere else.
export const E2E_EMAIL = 'coach@example.test';
export const E2E_PASSWORD = 'e2e-password';

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

const openMenu = (page: Page) =>
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

/** `date` is `YYYY-MM-DD`, at most next month; the dialog defaults to today. */
export const createMatch = async (
    page: Page,
    opponent: string,
    { withSquad = true, date }: { withSquad?: boolean; date?: string } = {},
) => {
    await page.goto('/');
    await openMenu(page);
    await page.getByRole('button', { name: 'Wedstrijd toevoegen' }).click();

    const dialog = page.getByRole('dialog', { name: 'Wedstrijd toevoegen' });
    await dialog.getByLabel('Tegenstander').fill(opponent);

    if (date) {
        await dialog.getByTestId('date-input').click();
        if (!date.startsWith(new Date().toISOString().slice(0, 7))) {
            await page.getByRole('button', { name: 'Volgende maand' }).click();
        }
        await page
            .locator(`[data-value="${date}"]:not([data-outside-view])`)
            .click();
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
