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
