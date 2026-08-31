import { test, expect } from '@playwright/test';

const PATH = '/magewire/playwright/scriptbootstrap';
const CSP_SCRIPT_EXPRESSION_ERROR = 'Evaluating expressions on a script is prohibited in the CSP build';

async function visitBootstrapFixture(page) {
    await page.addInitScript(() => {
        window.magewireScriptBootstrapEvents = [];

        document.addEventListener('alpine:init', () => {
            document.getElementById('magewire-runtime-config')
                ?.setAttribute('data-extension-probe', 'forwarded');
        }, { once: true });

        [
            'livewire:init',
            'alpine:initialized',
            'livewire:initialized',
        ].forEach(name => {
            document.addEventListener(name, () => {
                const script = document.getElementById('magewire-script');

                window.magewireScriptBootstrapEvents.push({
                    name,
                    csrf: script?.getAttribute('data-csrf') ?? null,
                    updateUri: script?.getAttribute('data-update-uri') ?? null,
                    extensionProbe: script?.getAttribute('data-extension-probe') ?? null,
                });
            }, { once: true });
        });
    });

    const version = Math.floor(Math.random() * 1_000_000);
    await page.goto(`${PATH}?v=${version}`);
    await page.waitForFunction(() => window.magewireScriptBootstrapEvents
        .some(event => event.name === 'livewire:initialized'));
}

test.describe('Magewire Hyvä Playwright — Script Bootstrap', () => {
    test('keeps Alpine directives off the Magewire script', async ({ page }) => {
        await visitBootstrapFixture(page);

        const script = page.locator('#magewire-script');
        const runtimeConfig = page.locator('#magewire-runtime-config');

        await expect(script).toHaveCount(1);
        await expect(script).not.toHaveAttribute('x-data');
        await expect(script).not.toHaveAttribute('x-bind');
        await expect(script).toHaveAttribute('data-navigate-once', 'true');

        await expect(runtimeConfig).toHaveAttribute('hidden', '');
        await expect(runtimeConfig).toHaveAttribute('x-data', 'magewireScript');
        await expect(runtimeConfig).toHaveAttribute('x-bind', 'magewireScriptBindings');
    });

    test('forwards runtime and extension data before Livewire is initialized', async ({ page }) => {
        await visitBootstrapFixture(page);

        const events = await page.evaluate(() => window.magewireScriptBootstrapEvents);
        const livewireInit = events.find(event => event.name === 'livewire:init');
        const livewireInitialized = events.find(event => event.name === 'livewire:initialized');

        expect(events.map(event => event.name)).toEqual([
            'livewire:init',
            'alpine:initialized',
            'livewire:initialized',
        ]);
        expect(livewireInit).toMatchObject({
            csrf: null,
            updateUri: null,
            extensionProbe: null,
        });
        expect(livewireInitialized.csrf).toMatch(/\S/);
        expect(livewireInitialized.updateUri).toMatch(/\/magewire\/update/);
        expect(livewireInitialized.extensionProbe).toBe('forwarded');

        const runtimeConfig = page.locator('#magewire-runtime-config');
        await expect(runtimeConfig).not.toHaveAttribute('data-csrf');
        await expect(runtimeConfig).not.toHaveAttribute('data-update-uri');
        await expect(runtimeConfig).not.toHaveAttribute('data-extension-probe');
    });

    test('completes a Magewire request with the forwarded configuration', async ({ page }) => {
        await visitBootstrapFixture(page);

        await expect(page.locator('#script-bootstrap-count')).toHaveText('0');

        const responsePromise = page.waitForResponse(response => (
            response.request().method() === 'POST'
            && response.url().includes('/magewire/update')
        ));

        await page.locator('#script-bootstrap-increment').click();

        const response = await responsePromise;
        expect(response.ok()).toBe(true);
        await expect(page.locator('#script-bootstrap-count')).toHaveText('1');
    });

    test('does not evaluate Alpine expressions on the script element', async ({ page }) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => {
            if (message.type() === 'error') {
                errors.push(message.text());
            }
        });

        await visitBootstrapFixture(page);

        expect(errors.filter(message => message.includes(CSP_SCRIPT_EXPRESSION_ERROR))).toEqual([]);
    });
});
