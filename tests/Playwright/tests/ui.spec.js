import { test, expect } from '@playwright/test';

const PATH = '/magewire/playwright/ui';
const workbench = page => page.getByTestId('ui-workbench');
const visibleNotifications = page => page.locator('.magewire-notifier-item:visible');
const notificationOfType = (page, type) => page.locator(`.magewire-notifier-item[data-type="${type}"]:visible`);

async function visitWorkbench(page, query = '') {
    const version = Math.floor(Math.random() * 1_000_000);
    await page.goto(`${PATH}?v=${version}${query}`);
    await page.waitForFunction(() => window.MagewireAddons?.notifier);
    await expect(workbench(page)).toBeVisible();
    await expect(visibleNotifications(page)).toHaveCount(4);
}

test.describe('Magewire Hyvä Playwright — UI workbench', () => {
    test('applies the compatibility presentation to the core component catalogue', async ({ page }) => {
        await visitWorkbench(page);

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

    test('keeps the notification controls interactive', async ({ page }) => {
        await visitWorkbench(page);

        await workbench(page).getByTestId('ui-notifications-persistent').uncheck();
        await workbench(page).getByTestId('ui-notifications-duration').fill('250');
        await workbench(page).getByTestId('ui-notifications-show').click();

        await expect(workbench(page).getByTestId('ui-notification-mode'))
            .toHaveText('Notifications close after 250 ms.');
        await expect(visibleNotifications(page)).toHaveCount(4);
        await expect(visibleNotifications(page)).toHaveCount(0, { timeout: 3000 });

        await workbench(page).getByTestId('ui-notifications-persistent').check();
        await workbench(page).getByTestId('ui-notifications-show').click();
        await expect(visibleNotifications(page)).toHaveCount(4);

        await workbench(page).getByTestId('ui-notifications-clear').click();
        await expect(page.locator('.magewire-notifier-item')).toHaveCount(0);
        await expect(workbench(page).getByTestId('ui-notification-count')).toHaveText('0');
    });

    test('preserves dirty, offline, and loading directives', async ({ page, context }) => {
        await visitWorkbench(page);

        const dirty = workbench(page).getByTestId('ui-dirty-state');
        const offline = workbench(page).getByTestId('ui-offline-state');
        const loading = workbench(page).getByTestId('ui-request-loading');

        await expect(dirty).toBeHidden();
        await workbench(page).getByTestId('ui-dirty-input').fill('Unsaved value');
        await expect(dirty).toBeVisible();

        await expect(offline).toBeHidden();
        await context.setOffline(true);
        await expect(offline).toBeVisible();
        await context.setOffline(false);
        await expect(offline).toBeHidden();

        const responsePromise = page.waitForResponse(response => (
            response.request().method() === 'POST'
            && response.url().includes('/magewire/update')
        ));

        await workbench(page).getByTestId('ui-request-start').click();
        await expect(loading).toBeVisible();

        const response = await responsePromise;
        expect(response.ok()).toBe(true);
        await expect(workbench(page).getByTestId('ui-request-count')).toHaveText('1');
        await expect(loading).toBeHidden();
        await expect(dirty).toBeHidden();
    });

    test('keeps numbered, previous, and next pagination interactive', async ({ page }) => {
        await visitWorkbench(page);

        const pagination = workbench(page).getByTestId('ui-pagination');
        const items = workbench(page).getByTestId('ui-pagination-items');

        await expect(workbench(page).getByTestId('ui-pagination-current-page')).toHaveText('1 / 3');
        await expect(pagination.getByTestId('ui-pagination-previous')).toBeDisabled();
        await expect(pagination.getByTestId('ui-pagination-page-1')).toHaveAttribute('aria-current', 'page');
        await expect(items).toContainText('Reactive storefront components');

        await pagination.getByTestId('ui-pagination-next').click();
        await expect(workbench(page).getByTestId('ui-pagination-current-page')).toHaveText('2 / 3');
        await expect(pagination.getByTestId('ui-pagination-page-2')).toHaveAttribute('aria-current', 'page');
        await expect(items).toContainText('Loading and activity states');

        await pagination.getByTestId('ui-pagination-page-3').click();
        await expect(workbench(page).getByTestId('ui-pagination-current-page')).toHaveText('3 / 3');
        await expect(pagination.getByTestId('ui-pagination-next')).toBeDisabled();
        await expect(items).toContainText('Accessible interaction states');

        await pagination.getByTestId('ui-pagination-previous').click();
        await expect(workbench(page).getByTestId('ui-pagination-current-page')).toHaveText('2 / 3');
    });
});
