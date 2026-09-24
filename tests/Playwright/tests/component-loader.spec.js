import { test, expect } from '@playwright/test';

async function visit(page) {
    await page.goto(`/magewire/playwright/scriptbootstrap?v=${Date.now()}`);
    await page.waitForFunction(() => (
        window.MagewireAddons?.componentLoader
        && window.MagewireUtilities?.loaderTiming
        && document.querySelector('[x-data="magewireComponentLoader"]')?._x_dataStack
        && window.Magewire?.all?.().some(component => component.el?.id === 'script-bootstrap-counter')
    ));
}

test.describe('Magewire component loader', () => {
    test('adjusts the wait from recent component timings', async ({ page }) => {
        await visit(page);

        const thresholds = await page.evaluate(() => {
            const timing = window.MagewireUtilities.loaderTiming;

            Object.defineProperty(navigator, 'connection', {
                configurable: true,
                value: { effectiveType: '2g', rtt: 700, downlink: 0.5 },
            });
            const slowConnection = timing.threshold('loader-test-network');

            Object.defineProperty(navigator, 'connection', {
                configurable: true,
                value: { effectiveType: '4g', rtt: 50, downlink: 10 },
            });

            const name = 'loader-test-timing';
            const unknown = timing.threshold(name);

            timing.record(name, 900);
            timing.record(name, 850);
            const slow = timing.threshold(name);

            timing.record(name, 50);
            timing.record(name, 60);
            timing.record(name, 70);

            return { slowConnection, unknown, slow, fast: timing.threshold(name) };
        });

        expect(thresholds).toEqual({ slowConnection: 250, unknown: 500, slow: 250, fast: 700 });
    });

    test('skips a quick request and clears its timer', async ({ page }) => {
        await visit(page);

        await page.evaluate(() => {
            const root = document.createElement('div');
            root.id = 'loader-test-root';
            document.body.appendChild(root);

            const finish = window.MagewireAddons.componentLoader.start({
                id: 'loader-test-quick',
                name: 'loader-test-quick',
                el: root,
            });

            setTimeout(finish, 50);
        });

        await page.waitForTimeout(650);
        await expect(page.locator('#loader-test-root .magewire-component-loader')).toHaveCount(0);
        expect(await page.evaluate(() => window.MagewireAddons.componentLoader.get('loader-test-quick'))).toBeNull();
    });

    test('keeps one centered spinner for overlapping requests', async ({ page }) => {
        await visit(page);

        await page.evaluate(() => {
            const root = document.createElement('div');
            root.id = 'loader-test-root';
            root.style.cssText = 'width: 300px; height: 180px; padding: 20px';
            document.body.appendChild(root);

            const component = { id: 'loader-test-overlap', name: 'loader-test-overlap', el: root };
            window.loaderTestFinishFirst = window.MagewireAddons.componentLoader.start(component);
            window.loaderTestFinishSecond = window.MagewireAddons.componentLoader.start(component);
        });

        const overlay = page.locator('#loader-test-root .magewire-component-loader');
        await expect(overlay).toBeVisible();
        await expect(overlay.locator('svg.magewire-loading-icon')).toHaveCount(1);
        await expect(page.locator('#loader-test-root')).toHaveAttribute('aria-busy', 'true');

        const rootBox = await page.locator('#loader-test-root').boundingBox();
        const spinnerBox = await overlay.locator('.magewire-component-loader-spinner').boundingBox();
        const surfaces = await overlay.evaluate(node => ({
            overlay: getComputedStyle(node).backgroundColor,
            spinner: getComputedStyle(node.firstElementChild).backgroundColor,
            shadow: getComputedStyle(node.firstElementChild).boxShadow,
        }));
        expect(surfaces).toEqual({
            overlay: 'rgba(0, 0, 0, 0)',
            spinner: 'rgba(0, 0, 0, 0)',
            shadow: 'none',
        });
        expect(spinnerBox.width).toBeLessThanOrEqual(48);
        expect(spinnerBox.height).toBeLessThanOrEqual(48);
        expect(Math.abs((spinnerBox.x + spinnerBox.width / 2) - (rootBox.x + rootBox.width / 2))).toBeLessThan(2);
        expect(Math.abs((spinnerBox.y + spinnerBox.height / 2) - (rootBox.y + rootBox.height / 2))).toBeLessThan(2);

        await page.evaluate(() => window.loaderTestFinishFirst());
        await expect(overlay).toBeVisible();

        await page.evaluate(() => window.loaderTestFinishSecond());
        await expect(overlay).toHaveCount(0);
        await expect(page.locator('#loader-test-root')).not.toHaveAttribute('aria-busy');
    });

    test('shows the spinner inside the component during a slow Magewire request', async ({ page }) => {
        await visit(page);

        let releaseRequest;
        let requestStarted;
        const started = new Promise(resolve => requestStarted = resolve);

        await page.route('**/magewire/update**', async route => {
            requestStarted();
            await new Promise(resolve => releaseRequest = resolve);
            await route.continue();
        });

        await page.locator('#script-bootstrap-increment').click();
        await started;

        const component = page.locator('#script-bootstrap-counter');
        try {
            await expect(component.locator('.magewire-component-loader')).toBeVisible();
            await expect(component).toHaveAttribute('aria-busy', 'true');
        } finally {
            releaseRequest();
        }

        await expect(page.locator('#script-bootstrap-count')).toHaveText('1');
        await expect(component.locator('.magewire-component-loader')).toHaveCount(0);
        await expect(component).not.toHaveAttribute('aria-busy');
    });
});
