import { expect, test, type Page } from '@playwright/test';

import { skipWithoutFirebaseConfig } from './helpers/app';

const submit = async (page: Page, email: string, password: string) => {
    await page.getByTestId('input-email').fill(email);
    await page.getByTestId('input-password').fill(password);
    await page.getByTestId('btn-submit').click();
};

test.describe('Login errors', () => {
    test.beforeEach(async ({ page }) => {
        skipWithoutFirebaseConfig();
        await page.goto('/login');
    });

    test('asks for an email address', async ({ page }) => {
        await submit(page, '', 'secret');
        await expect(page.getByTestId('error-message')).toHaveText(
            'Vul een e-mailadres in',
        );
    });

    test('asks for a password', async ({ page }) => {
        await submit(page, 'someone@example.com', '');
        await expect(page.getByTestId('error-message')).toHaveText(
            'Vul een wachtwoord in',
        );
    });

    test('rejects wrong credentials', async ({ page }) => {
        await submit(page, `nobody-${Date.now()}@example.com`, 'wrong-pass');
        await expect(page.getByTestId('error-message')).toHaveText(
            'E-mailadres of wachtwoord is onjuist',
            { timeout: 10_000 },
        );
        await expect(page).toHaveURL('/login');
    });

    test('reports other sign-in failures', async ({ page }) => {
        await page.route('**/identitytoolkit.googleapis.com/**', (route) =>
            route.abort(),
        );
        await submit(page, 'someone@example.com', 'secret');
        await expect(page.getByTestId('error-message')).toHaveText(
            'Inloggen mislukt, probeer het later opnieuw',
            { timeout: 10_000 },
        );
    });
});
