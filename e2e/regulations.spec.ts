import { expect, test } from '@playwright/test';

import { E2E_EMAIL, login, uniqueLabel, visitorPage } from './helpers/app';

test('an edit to the regulations reaches visitors', async ({
    page,
    browser,
}) => {
    const rule = uniqueLabel('Na de training helpt iedereen opruimen');

    await login(page);
    await page.goto('/regulations');
    await page.getByRole('button', { name: 'Bewerken' }).click();

    const editor = page.locator('[contenteditable="true"]');
    await editor.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type(rule);
    await page.getByRole('button', { name: 'Opslaan' }).click();

    await expect(editor).toBeHidden();
    await expect(
        page.getByText(`Laatst bewerkt door ${E2E_EMAIL}`),
    ).toBeVisible();

    const visitor = await visitorPage(browser);
    await visitor.goto('/regulations');
    await expect(visitor.getByText(rule)).toBeVisible();
    await expect(visitor.getByText('Laatst bewerkt door')).toBeHidden();
    await visitor.context().close();
});
