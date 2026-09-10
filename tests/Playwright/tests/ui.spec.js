import { test, expect } from '@playwright/test';

const PATH = '/magewire/playwright/ui';
const visibleNotifications = page => page.locator('.magewire-notifier-item:visible');
const notificationOfType = (page, type) => page.locator(`.magewire-notifier-item[data-type="${type}"]:visible`);

test.describe('Magewire Hyvä Playwright — UI workbench', () => {
    test('applies the compatibility presentation to the core component catalogue', async ({ page }) => {
        const version = Math.floor(Math.random() * 1_000_000);
        await page.goto(`${PATH}?v=${version}`);
        await page.waitForFunction(() => window.MagewireAddons?.notifier);

        await expect(page.getByTestId('ui-workbench')).toBeVisible();
        await expect(visibleNotifications(page)).toHaveCount(4);

        for (const type of ['success', 'info', 'warning', 'error']) {
            const notification = notificationOfType(page, type);

            await expect(notification).toHaveCSS('border-top-width', '2px');
            await expect(notification).toHaveCSS('border-left-width', '2px');
            await expect(notification).toHaveCSS('border-radius', '4px');
            await expect(notification).toHaveCSS('font-weight', '600');
        }

        const info = notificationOfType(page, 'info');
        const occurrenceBadge = info.locator('.magewire-notifier-occurrences');

        await expect(occurrenceBadge).toBeVisible();
        await expect(occurrenceBadge).toHaveCSS('border-top-width', '0px');

        const surfaces = await Promise.all([
            info.evaluate(element => getComputedStyle(element).backgroundColor),
            occurrenceBadge.evaluate(element => getComputedStyle(element).backgroundColor),
        ]);

        expect(surfaces[0]).not.toBe('rgba(0, 0, 0, 0)');
        expect(surfaces[1]).toBe(surfaces[0]);
    });
});
