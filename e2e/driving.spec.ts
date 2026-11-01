import { expect, test } from '@playwright/test';
import dayjs from 'dayjs';

import {
    createMatch,
    deleteMatch,
    login,
    uniqueLabel,
    visitorPage,
} from './helpers/app';

test.describe('Driving schedule', () => {
    let matchUrl = '';

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test.afterEach(async ({ page }) => {
        if (matchUrl) await deleteMatch(page, matchUrl);
        matchUrl = '';
    });

    test('plans drivers for an away match and passes a car on', async ({
        page,
        browser,
    }) => {
        const opponent = uniqueLabel('E2E rijden');

        // Not tomorrow: knvb-import claims that day's hand-entered match.
        matchUrl = await createMatch(page, opponent, {
            away: true,
            date: dayjs().add(2, 'day').format('YYYY-MM-DD'),
        });

        await page.goto('/driving');
        const card = page.getByRole('article').filter({ hasText: opponent });
        const cars = card.getByRole('listitem');

        // Six players at three per car. Nobody has driven yet and there are
        // no vaste rijders, so the rotation runs by name.
        await expect(card.getByText('6 spelers')).toBeVisible();
        await expect(card.getByText('2 auto’s')).toBeVisible();
        await expect(cars).toHaveText([/Anna.*Ingepland/, /Bram/]);

        await card
            .getByRole('button', { name: 'Ouder van Anna kan niet rijden' })
            .click();
        await expect(cars).toHaveText([/Cees/, /Bram/]);
        await expect(
            card.getByRole('button', {
                name: 'Ouder van Anna kan toch weer rijden',
            }),
        ).toBeVisible();

        const visitor = await visitorPage(browser);
        await visitor.goto('/driving');
        await expect(
            visitor
                .getByRole('article')
                .filter({ hasText: opponent })
                .getByRole('listitem'),
        ).toHaveText([/Cees/, /Bram/]);
        await visitor.context().close();
    });
});
