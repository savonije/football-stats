import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Shared helpers for the specs that sign in and write to Firestore.
 *
 * Unlike the read-only specs these mutate data: they create a match or a
 * training, drive it through the UI and delete it again. They therefore run
 * against the **staging** project (`npm run build:e2e` builds with `.env`
 * instead of `.env.production`) and sign in as a staging-only test user taken
 * from the environment. Without those credentials the specs skip rather than
 * fail, so a fresh clone still runs the read-only suite green.
 */

/** The only Firestore project these specs are allowed to talk to. */
const STAGING_PROJECT_ID =
    process.env.E2E_PROJECT_ID ?? 'football-ryan-staging';

const email = process.env.E2E_EMAIL ?? '';
const password = process.env.E2E_PASSWORD ?? '';

export const skipWithoutCredentials = () =>
    test.skip(
        !email || !password,
        'Set E2E_EMAIL and E2E_PASSWORD (staging test user) to run the write specs.',
    );

/** Unique per run, so parallel workers never fight over the same document. */
export const uniqueLabel = (prefix: string) =>
    `${prefix} ${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

/** Whether a locator shows up, without failing the test when it does not. */
export const becomesVisible = (locator: Locator, timeout = 10_000) =>
    locator.waitFor({ state: 'visible', timeout }).then(
        () => true,
        () => false,
    );

/** Every Firestore project this page talks to, collected as it loads. */
const observeFirestoreProjects = (page: Page) => {
    const projects = new Set<string>();

    page.on('request', (request) => {
        const url = request.url();
        if (!url.includes('firestore.googleapis.com')) return;

        // The REST and WebChannel endpoints both name the project, either as a
        // path segment or url-encoded in the query string.
        const [, project] = /projects(?:\/|%2F)([^/%?&]+)/.exec(url) ?? [];
        if (project) projects.add(project);
    });

    return projects;
};

export const login = async (page: Page) => {
    const projects = observeFirestoreProjects(page);

    // The home page reads Firestore on mount, so once it settles we know which
    // project this build is wired to. Assert that *before* signing in: a build
    // made from .env.production must never reach a write step.
    await page.goto('/');
    await expect
        .poll(() => [...projects], { timeout: 20_000 })
        .toEqual([STAGING_PROJECT_ID]);

    await page.goto('/login');
    await page.getByTestId('input-email').fill(email);
    await page.getByTestId('input-password').fill(password);
    await page.getByTestId('btn-submit').click();

    // authStore navigates off /login as soon as Firebase confirms the session.
    await expect(page).toHaveURL('/', { timeout: 20_000 });
};

const openMenu = (page: Page) =>
    page.getByRole('button', { name: 'Menu' }).click();

/**
 * Editing is gated on `useCanEdit()`: signed in *and* the selected season is
 * the active one. Staging having no active season is an environment problem
 * rather than a regression, so skip with a reason instead of failing.
 */
export const skipWithoutEditableSeason = async (page: Page) => {
    // Call right after login(), which leaves the browser on the home page.
    await openMenu(page);

    const editable = await becomesVisible(
        page.getByRole('button', { name: 'Wedstrijd toevoegen' }),
    );

    test.skip(
        !editable,
        'No active season for this user in staging, so nothing is editable.',
    );
};

/** Accept a PrimeVue confirmation, which is an alertdialog rather than a dialog. */
export const acceptConfirm = async (page: Page, acceptLabel: string) => {
    const confirmation = page.getByRole('alertdialog');
    await confirmation.getByRole('button', { name: acceptLabel }).click();
    await expect(confirmation).toBeHidden();
};

/** Filter the match list down to one opponent and open its detail page. */
const openMatch = async (page: Page, opponent: string) => {
    await page.getByPlaceholder('Zoek tegenstander').fill(opponent);
    await page.getByRole('cell', { name: opponent, exact: true }).click();
    await expect(page).toHaveURL(/\/match\/.+/);

    return page.url();
};

/** Create a match from the drawer and return its detail url. */
export const createMatch = async (page: Page, opponent: string) => {
    await page.goto('/');
    await openMenu(page);
    await page.getByRole('button', { name: 'Wedstrijd toevoegen' }).click();

    // Date, home/away and the squad keep the defaults the dialog fills in from
    // the active season, so only the opponent has to be typed.
    const dialog = page.getByRole('dialog', { name: 'Wedstrijd toevoegen' });
    await dialog.getByLabel('Tegenstander').fill(opponent);
    await dialog.getByRole('button', { name: 'Toevoegen' }).click();
    await expect(dialog).toBeHidden();

    return openMatch(page, opponent);
};

/** Best-effort cleanup: drops the match and its appearances again. */
export const deleteMatch = async (page: Page, matchUrl: string) => {
    await page.goto(matchUrl);

    const menu = page.getByRole('button', { name: 'Meer opties' });
    if (!(await becomesVisible(menu))) return;

    await menu.click();
    await page.getByRole('menuitem', { name: 'Wedstrijd verwijderen' }).click();
    await acceptConfirm(page, 'Verwijderen');
    await expect(page).toHaveURL('/');
};

/** Best-effort cleanup for a training created by a spec. */
export const deleteTraining = async (page: Page, trainingUrl: string) => {
    await page.goto(trainingUrl);

    const remove = page.getByRole('button', { name: 'Verwijderen' });
    if (!(await becomesVisible(remove))) return;

    await remove.click();
    await acceptConfirm(page, 'Verwijderen');
    await expect(page).toHaveURL('/training');
};
