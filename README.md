# Magewire Compatibility with Hyvä

[![Mago](https://github.com/magewirephp/magewire-hyva/actions/workflows/mago.yml/badge.svg?branch=main)](https://github.com/magewirephp/magewire-hyva/actions/workflows/mago.yml)

> Makes [Magewire](https://github.com/magewirephp/magewire) feel native to the Hyvä theme — so reactive, server-driven components just work, without writing JavaScript.

This is the compatibility layer between [Magewire](https://github.com/magewirephp/magewire) v3 and the [Hyvä](https://hyva.io) frontend. It wires Magewire into the Hyvä asset pipeline, hands AlpineJS off to Magewire, and bridges Magewire's flash messages to the Hyvä notifier.

> Hyvä Checkout backwards compatibility lives in a separate module: [`magewirephp/magewire-hyva-checkout`](https://github.com/magewirephp/magewire-hyva-checkout).

## What it does

### Tailwind / asset registration

Magewire and this module ship frontend assets (AlpineJS plugins, Tailwind sources). On the `hyva_config_generate_before` event the module registers both module paths as Hyvä [extensions](https://docs.hyva.io/hyva-themes/compatibility-modules/tailwind-config-merging.html), so their styles and scripts are picked up by the Hyvä Tailwind build automatically.

### AlpineJS consolidation

Magewire already bundles AlpineJS. To avoid loading Alpine twice, the module disables Hyvä's standalone `script-alpine-js` and moves it under Magewire's loader, guaranteeing Alpine is initialized **before** Magewire boots.

### Flash messages

Bridges the Magewire `magewire:flash-messages:dispatch` event to Hyvä's message/notifier UI, so server-side flash messages dispatched from a component surface through the theme's native notification component.

## Requirements

- `magewirephp/magewire` `>=3.2`
- `Hyva_Theme`

The module declares a `sequence` after `Magewirephp_Magewire` and `Hyva_Theme`.

## Installation

```bash
composer require magewirephp/magewire-hyva-theme
bin/magento module:enable Magewirephp_MagewireHyvaTheme
bin/magento setup:upgrade
```

Rebuild the Hyvä theme so the merged Tailwind config and assets are picked up:

```bash
cd app/design/frontend/<Vendor>/<theme>/web/tailwind
npm run build
```

## Documentation

See the [Hyvä docs](https://docs.hyva.io/) and the [Magewire docs](https://github.com/magewirephp/magewire).

## Security Vulnerabilities

Please do not report security issues publicly. Disclose them privately to the Magewire maintainers.

## License

Open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
