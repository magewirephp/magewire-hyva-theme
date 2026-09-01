import { defineConfig } from '@playwright/test';
import 'dotenv/config';
import process from 'process';

export default defineConfig({
    testDir: '.',
    fullyParallel: true,
    retries: process.env.CI ? 2 : 1,
    reporter: [['list']],
    use: {
        baseURL: process.env.BASE_URL.replace(/^\/+|\/+$/g, ''),
        ignoreHTTPSErrors: true,
        browserName: 'chromium',
        headless: true,
        trace: 'off',
        video: 'off',
        screenshot: 'off',
    },
});
