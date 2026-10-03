import { expect, test, type Page } from '@playwright/test';
import dayjs from 'dayjs';

import {
    createMatch,
    deleteMatch,
    login,
    skipWithoutCredentials,
    skipWithoutEditableSeason,
    skipWithoutFirebaseConfig,
    uniqueLabel,
} from './helpers/app';

const TEAM_CODE = 1;

/** Serves a fake Sportlink programma for the season's own team name. */
const mockSportlink = async (
    page: Page,
    teamName: string,
    matches: { code: number; date: dayjs.Dayjs; opponent: string }[],
) => {
    await page.route('https://data.sportlink.com/teams?**', (route) =>
        route.fulfill({
            json: [{ teamcode: TEAM_CODE, teamnaam: `Club ${teamName}` }],
        }),
    );
    await page.route('https://data.sportlink.com/programma?**', (route) =>
        route.fulfill({
            json: matches.map((match) => ({
                wedstrijdcode: match.code,
                wedstrijddatum: match.date.format(),
                thuisteam: `Club ${teamName}`,
                thuisteamid: TEAM_CODE,
                uitteam: match.opponent,
                status: 'Te spelen',
            })),
        }),
    );
};

/** Sets the Sportlink client_id through Instellingen, returning the old one. */
const setClientId = async (page: Page, clientId: string) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('button', { name: 'Instellingen' }).click();

    const dialog = page.getByRole('dialog', { name: 'Instellingen' });
    const input = dialog.getByLabel('Sportlink client_id');
    const previous = await input.inputValue();
    await input.fill(clientId);
    await dialog.getByRole('button', { name: 'Opslaan' }).click();
    await expect(dialog).toBeHidden();

    return previous;
};

const openImport = async (page: Page) => {
    await page.goto('/');
    await page
        .getByRole('button', { name: 'Wedstrijdschema synchroniseren' })
        .click();
    const dialog = page.getByRole('dialog', {
        name: 'Wedstrijdschema synchroniseren',
    });
    await expect(dialog.getByText('Programma ophalen...')).toBeHidden();
    return dialog;
};

test.describe('KNVB import', () => {
    // Both tests rewrite the one shared client_id setting.
    test.describe.configure({ mode: 'serial' });

    const matchUrls: string[] = [];
    let previousClientId: string | null = null;

    test.beforeEach(async ({ page }) => {
        skipWithoutFirebaseConfig();
        skipWithoutCredentials();
        await login(page);
        await skipWithoutEditableSeason(page);
    });

    test.afterEach(async ({ page }) => {
        for (const url of matchUrls.splice(0)) await deleteMatch(page, url);
        if (previousClientId !== null) {
            await setClientId(page, previousClientId);
            previousClientId = null;
        }
    });

    test('adds new matches once and warns about mismatches', async ({
        page,
    }) => {
        const teamName = await page.locator('h1 span').last().innerText();
        test.skip(!teamName.trim(), 'The staging season has no team name.');

        const existing = uniqueLabel('E2E bestaand');
        const conflicting = uniqueLabel('E2E knvb anders');
        const imported = uniqueLabel('E2E knvb nieuw');
        const code = Date.now();

        previousClientId = await setClientId(page, 'e2e-client');
        matchUrls.push(await createMatch(page, existing));

        await mockSportlink(page, teamName, [
            // Same day as the match just created, different opponent.
            {
                code,
                date: dayjs().endOf('day').subtract(1, 'minute'),
                opponent: conflicting,
            },
            {
                code: code + 1,
                date: dayjs().add(180, 'day').hour(10).minute(30).second(0),
                opponent: imported,
            },
        ]);

        const dialog = await openImport(page);
        await expect(dialog.getByTestId('knvb-new-matches')).toContainText(
            imported,
        );
        await expect(dialog.getByTestId('knvb-new-matches')).not.toContainText(
            conflicting,
        );
        await expect(dialog.getByTestId('knvb-warnings')).toContainText(
            conflicting,
        );

        await dialog.getByRole('button', { name: 'Toevoegen' }).click();
        await expect(dialog).toBeHidden();

        // A second tab reads from the server, not the local write cache.
        const other = await page.context().newPage();
        await other.goto('/');
        await other.getByPlaceholder('Zoek tegenstander').fill(imported);
        await other.getByRole('cell', { name: imported, exact: true }).click();
        await expect(other).toHaveURL(/\/match\/.+/);
        matchUrls.push(other.url());
        await other.close();

        const again = await openImport(page);
        await expect(again.getByTestId('knvb-warnings')).toContainText(
            conflicting,
        );
        await expect(again.getByTestId('knvb-new-matches')).toBeHidden();
    });

    test('hides the sync without a client_id', async ({ page }) => {
        previousClientId = await setClientId(page, '');

        await page.goto('/');
        await expect(
            page.getByRole('heading', { name: 'Wedstrijden', exact: true }),
        ).toBeVisible();
        await expect(
            page.getByRole('button', {
                name: 'Wedstrijdschema synchroniseren',
            }),
        ).toBeHidden();
    });
});
