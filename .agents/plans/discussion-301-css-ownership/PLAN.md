# TL;DR

Remove Tailwind entirely from `magewire-hyva-theme`. Magewire 3.7 owns complete
vanilla component styling; this package loads only an optional, browser-ready
vanilla Hyvä visual override through Magento layout.

# Context

- Started: 2026-09-08
- Initial type: Git Discussion
- Current type: Git Discussion
- GitHub discussion: https://github.com/magewirephp/magewire/discussions/301
- Companion core work: `magewirephp/magewire`

# Goal

Preserve Hyvä-native presentation without requiring a Tailwind build in either
Magewire package.

# Tasks

- [x] Remove the Hyvä registry observer and event registration
- [x] Remove every Tailwind config, source, and module entry point
- [x] Replace notifier Tailwind input with browser-ready vanilla CSS
- [x] Load the optional override through Magento layout
- [x] Require Magewire 3.7 or newer
- [x] Remove the frontend rebuild instruction
- [x] Verify the vanilla override against the core stylesheet
- [ ] Verify against the released Magewire 3.7 package

# Decisions

## ✅ Use no Tailwind in either Magewire package

The compatibility module serves its optional override through Magento's normal
asset pipeline. It does not register in `hyva-themes.json` and has no CSS build
inputs.

## ✅ Core owns all structural and fallback styling

The compatibility CSS overrides visual properties only. Notifier positioning,
layout, sizing, activity state, animations, and developer exception styling
remain functional when the compatibility asset is absent.

## ✅ Release core first

The companion requires Magewire `>=3.7`, preventing its new semantic selectors
from being installed with an older core that does not provide them.

# Change log

- 2026-09-08: Updated the companion half of discussion #301 for core-owned
  styling and an optional theme override.
- 2026-09-09: Removed the remaining Tailwind build path and replaced it with a
  browser-ready vanilla CSS asset.
- 2026-09-09: Verified the core-only computed styles and the companion override
  cascade in Chromium; the companion changes presentation without supplying
  any structural dependency.
