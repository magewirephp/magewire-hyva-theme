import { test, expect } from '@playwright/test';

const PATH = '/magewire/playwright/scriptbootstrap';
const CSP_SCRIPT_EXPRESSION_ERROR = 'Evaluating expressions on a script is prohibited in the CSP build';

async function visitBootstrapFixture(page) {
    await page.addInitScript(() => {
        window.magewireScriptBootstrapEvents = [];

        document.addEventListener('alpine:init', () => {
            document.getElementById('magewire-runtime')
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
        const runtime = page.locator('#magewire-runtime');

        await expect(script).toHaveCount(1);
        await expect(script).not.toHaveAttribute('x-data');
        await expect(script).not.toHaveAttribute('x-bind');
        await expect(script).toHaveAttribute('data-navigate-once', 'true');

        await expect(runtime).toHaveAttribute('hidden', '');
        await expect(runtime).toHaveAttribute('x-data', 'magewireRuntime');
        await expect(runtime).toHaveAttribute('x-bind', 'magewireRuntimeBindings');
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

        const runtime = page.locator('#magewire-runtime');
        await expect(runtime).not.toHaveAttribute('data-csrf');
        await expect(runtime).not.toHaveAttribute('data-update-uri');
        await expect(runtime).not.toHaveAttribute('data-extension-probe');
    });

    test('keeps the deprecated script providers operational', async ({ page }) => {
        await visitBootstrapFixture(page);

        const attributes = await page.evaluate(() => {
            const probe = document.createElement('div');
            probe.setAttribute('x-data', 'magewireScript');
            probe.setAttribute('x-bind', 'magewireScriptBindings');
            document.body.appendChild(probe);

            window.Alpine.initTree(probe);

            const attributes = {
                csrf: probe.getAttribute('data-csrf'),
                updateUri: probe.getAttribute('data-update-uri'),
            };

            probe.remove();

            return attributes;
        });

        expect(attributes.csrf).toMatch(/\S/);
        expect(attributes.updateUri).toMatch(/\/magewire\/update/);
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
