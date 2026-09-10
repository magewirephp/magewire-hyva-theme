# Playwright

These tests require Magento developer mode and a Hyvä CSP theme.

```sh
cd tests/Playwright
npm install
cp .env.example .env
npm test
```

Set `BASE_URL` in `.env` to the base URL of the Magento installation containing
this module.

The UI compatibility test reuses Magewire core's `/magewire/playwright/ui` workbench. Open that
route directly to inspect the compiled Hyvä presentation manually; the notifications remain visible
until dismissed by default. This fixture is available with Magewire 3.7 and newer.
