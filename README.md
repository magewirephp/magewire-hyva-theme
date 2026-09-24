# Magewire Compatibility with Hyvä

[![Mago](https://github.com/magewirephp/magewire-hyva/actions/workflows/mago.yml/badge.svg?branch=main)](https://github.com/magewirephp/magewire-hyva/actions/workflows/mago.yml)

> Makes [Magewire](https://github.com/magewirephp/magewire) feel native to the Hyvä theme — so reactive, server-driven components just work, without writing JavaScript.

This is the compatibility layer between [Magewire](https://github.com/magewirephp/magewire) v3 and the [Hyvä](https://hyva.io) frontend.

> Hyvä Checkout backwards compatibility lives in a separate module: [`magewirephp/magewire-hyva-checkout`](https://github.com/magewirephp/magewire-hyva-checkout).

## Requirements

- `magewirephp/magewire` `>=3.7`
- `Hyva_Theme`

The module declares a `sequence` after `Magewirephp_Magewire` and `Hyva_Theme`.

## Installation

```bash
composer require magewirephp/magewire-hyva-theme
bin/magento module:enable Magewirephp_MagewireHyvaTheme
bin/magento setup:upgrade
```

Magewire core ships complete, framework-independent component styles without a
frontend build. To include this module's optional Hyvä presentation, rebuild
the Hyvä theme so its Tailwind sources are picked up:

```bash
cd app/design/frontend/<Vendor>/<theme>/web/tailwind
npm run build
```

## Component loader

Magewire requests show a small spinner in the center of the component only when
they take long enough to need feedback. The first request waits 500 ms. A slow
connection or recent slow requests shorten the wait to 250 ms; consistently fast
requests extend it to 700 ms. Recent timings are kept per component for the
browser session.

The request API is `MagewireAddons.componentLoader`; its `start(component)` method
returns a function that finishes that request, and `subscribe(listener)` reports
visibility changes. `MagewireUtilities.loaderTiming` provides `record`,
`threshold`, and `shouldShow` for timing decisions. The spinner markup comes from
`Magewirephp_Magewire::magewire/utils/icons/loading.phtml`.

## Documentation

- [Hyvä CSP script bootstrap](https://docs.magewirephp.nl/pages/theming/csp-script-bootstrap.html)
- [Hyvä documentation](https://docs.hyva.io/)
- [Magewire documentation](https://github.com/magewirephp/magewire)

## Security Vulnerabilities

Please do not report security issues publicly. Disclose them privately to the Magewire maintainers.

## License

Open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
