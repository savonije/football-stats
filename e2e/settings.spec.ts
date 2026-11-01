import { expect, test, type Page } from '@playwright/test';

import { login, openMenu, visitorPage } from './helpers/app';

const FEATURES = [
    {
        link: 'Wasschema',
        path: '/washing',
        toggle: 'Wasschema gebruiken',
        warning:
            'Het wasschema is uitgeschakeld, zet het aan via Instellingen.',
    },
    {
        link: 'Rijschema',
        path: '/driving',
        toggle: 'Rijschema gebruiken',
        warning:
            'Het rijschema is uitgeschakeld, zet het aan via Instellingen.',
    },
    {
        link: 'Regels & afspraken',
        path: '/regulations',
        toggle: 'Regels & afspraken tonen',
        warning:
            'Deze pagina is verborgen voor bezoekers. Zet hem aan via Instellingen.',
    },
];

const setFeature = async (page: Page, toggle: string, on: boolean) => {
    await page.goto('/');
    await openMenu(page);
    await page.getByRole('button', { name: 'Instellingen' }).click();

    const dialog = page.getByRole('dialog', { name: 'Instellingen' });
    const save = dialog.getByRole('button', { name: 'Opslaan' });
    await expect(save).toBeEnabled();
    await dialog.getByRole('switch', { name: toggle }).setChecked(on);
    await save.click();
    await expect(dialog).toBeHidden();
};

const navLink = (page: Page, name: string) =>
    page.getByRole('link', { name, exact: true });

// The dialog saves every switch at once, so these take turns. playwright.config.ts
// also runs this file after all the others, which need the features on.
test.describe.configure({ mode: 'serial' });

test.describe('Instellingen', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    // A failed run must not leave a feature off for the retry.
    test.afterEach(async ({ page }) => {
        for (const { toggle } of FEATURES) await setFeature(page, toggle, true);
    });

    for (const { link, path, toggle, warning } of FEATURES) {
        test(`switches ${link} off for visitors and back on`, async ({
            page,
            browser,
        }) => {
            await setFeature(page, toggle, false);

            const visitor = await visitorPage(browser);
            await visitor.goto(path);
            await expect(visitor).toHaveURL('/');
            await openMenu(visitor);
            await expect(navLink(visitor, 'Spelers')).toBeVisible();
            await expect(navLink(visitor, link)).toBeHidden();

            // Coaches keep the page, with a reminder that visitors can't see it.
            await page.goto(path);
            await expect(page.getByText(warning)).toBeVisible();
            await openMenu(page);
            await expect(navLink(page, link)).toBeVisible();

            await setFeature(page, toggle, true);

            await visitor.goto(path);
            await expect(visitor).toHaveURL(path);
            await openMenu(visitor);
            await expect(navLink(visitor, link)).toBeVisible();
            await visitor.context().close();

            await page.goto(path);
            await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
            await expect(page.getByText(warning)).toBeHidden();
        });
    }
});
