import { expect, test, type Locator, type Page } from '@playwright/test';

const STAGING_PROJECT_ID =
    process.env.E2E_PROJECT_ID || 'football-ryan-staging';

const email = process.env.E2E_EMAIL ?? '';
const password = process.env.E2E_PASSWORD ?? '';

const requiredFirebaseEnv = [
    'VITE_FIREBASE_APIKEY',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_MESSAGE_SENDER_ID',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_CLUBNAME',
];

const missingFirebaseEnv = requiredFirebaseEnv.filter((name) => {
    const value = process.env[name];
    return value === undefined || value === '';
});

export const skipWithoutFirebaseConfig = () =>
    test.skip(
        missingFirebaseEnv.length > 0,
        `Set ${missingFirebaseEnv.join(', ')} to run specs that boot the app.`,
    );

export const skipWithoutCredentials = () =>
    test.skip(
        !email || !password,
        'Set E2E_EMAIL and E2E_PASSWORD (staging test user) to run the write specs.',
    );

export const uniqueLabel = (prefix: string) =>
    `${prefix} ${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

export const becomesVisible = (locator: Locator, timeout = 10_000) =>
    locator.waitFor({ state: 'visible', timeout }).then(
        () => true,
        () => false,
    );

const observeFirestoreProjects = (page: Page) => {
    const projects = new Set<string>();

    page.on('request', (request) => {
        const url = request.url();
        if (!url.includes('firestore.googleapis.com')) return;

        const [, project] = /projects(?:\/|%2F)([^/%?&]+)/.exec(url) ?? [];
        if (project) projects.add(project);
    });

    return projects;
};

export const login = async (page: Page) => {
    const projects = observeFirestoreProjects(page);

    // Assert the project before signing in: a build made from .env.production
    // must never reach a write step.
    await page.goto('/');
    await expect
        .poll(() => [...projects], { timeout: 20_000 })
        .toEqual([STAGING_PROJECT_ID]);

    await page.goto('/login');
    await page.getByTestId('input-email').fill(email);
    await page.getByTestId('input-password').fill(password);
    await page.getByTestId('btn-submit').click();

    await expect(page).toHaveURL('/', { timeout: 20_000 });
};

const openMenu = (page: Page) =>
    page.getByRole('button', { name: 'Menu' }).click();

/** Call right after login(), which leaves the browser on the home page. */
export const skipWithoutEditableSeason = async (page: Page) => {
    await openMenu(page);

    const editable = await becomesVisible(
        page.getByRole('button', { name: 'Wedstrijd toevoegen' }),
    );

    test.skip(
        !editable,
        'No active season for this user in staging, so nothing is editable.',
    );
};

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

export const createMatch = async (page: Page, opponent: string) => {
    await page.goto('/');
    await openMenu(page);
    await page.getByRole('button', { name: 'Wedstrijd toevoegen' }).click();

    const dialog = page.getByRole('dialog', { name: 'Wedstrijd toevoegen' });
    await dialog.getByLabel('Tegenstander').fill(opponent);
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

export const deleteTraining = async (page: Page, trainingUrl: string) => {
    await page.goto(trainingUrl);

    const remove = page.getByRole('button', { name: 'Verwijderen' });
    if (!(await becomesVisible(remove))) return;

    await remove.click();
    await acceptConfirm(page, 'Verwijderen');
    await expect(page).toHaveURL('/training');
};
