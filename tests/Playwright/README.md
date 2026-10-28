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

The browser-event compatibility tests use this module's
`/magewire/playwright/backwardscompatibility` fixture. They verify Magewire 1 payload shapes
from `dispatchBrowserEvent()` and Livewire 3 payload shapes from `dispatch()` on the same
BC-enabled component. This requires the core browser-event queue change from
[Magewire PR #326](https://github.com/magewirephp/magewire/pull/326), released before this module.

The emitUp() compatibility tests use the same `/magewire/playwright/backwardscompatibility` fixture, which also holds
a grandparent, parent, child and sibling component plus an unrelated one. They verify that `emitUp()` and
`emitToRefreshUp()` reach the ancestors only, as in Magewire 1, and that `dispatch()` keeps its Livewire 3 delivery.
This requires the core queue change from [Magewire PR #341](https://github.com/magewirephp/magewire/pull/341).
