# Magewire Compatibility with Hyvä

[![Mago](https://github.com/magewirephp/magewire-hyva/actions/workflows/mago.yml/badge.svg?branch=main)](https://github.com/magewirephp/magewire-hyva/actions/workflows/mago.yml)

> Makes [Magewire](https://github.com/magewirephp/magewire) feel native to the Hyvä theme — so reactive, server-driven components just work, without writing JavaScript.

This is the compatibility layer between [Magewire](https://github.com/magewirephp/magewire) v3 and the [Hyvä](https://hyva.io) frontend.

> Hyvä Checkout backwards compatibility lives in a separate module: [`magewirephp/magewire-hyva-checkout`](https://github.com/magewirephp/magewire-hyva-checkout).

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
