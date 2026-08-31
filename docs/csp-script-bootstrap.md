# CSP-safe Magewire script bootstrap

Magewire provides Alpine.js on pages containing Magewire components. The Hyvä
compatibility module is responsible for loading that bundle without also loading
Hyvä's standalone Alpine.js bundle.

The Magewire script needs runtime request configuration, including the update URI
and the current Magento form key. Livewire conventionally stores those values as
`data-update-uri` and `data-csrf` attributes on its script element.

## Why the script cannot be the Alpine component

Alpine's CSP build deliberately prohibits evaluating expressions on a `script`
element. Consequently, this markup is not CSP compatible:

```html
<script
    id="magewire-script"
    src="magewire.csp.min.js"
    x-data="magewireScript"
    x-bind="magewireScriptBindings"
></script>
```

During `Alpine.start()`, the CSP evaluator encounters `x-data` on an
`HTMLScriptElement` and throws before Livewire can finish initializing. Events
such as `livewire:initialized` and the corresponding Magewire compatibility
events are then never dispatched.

CSP does not prohibit normal attributes such as `src`, `data-csrf`, or
`data-update-uri` on a script. Only the Alpine directives need another host.

## Bootstrap structure

The compatibility module separates Alpine evaluation from asset loading:

```html
<div
    id="magewire-runtime-config"
    hidden
    x-data="magewireScript"
    x-bind="magewireScriptBindings"
></div>

<script
    id="magewire-script"
    src="magewire.csp.min.js"
    data-navigate-once="true"
></script>
```

The hidden element is a temporary runtime configuration host. The external
script remains an inert asset loader with no Alpine directives.

Once Alpine has initialized the host, the compatibility module moves every
generated `data-*` attribute from `#magewire-runtime-config` to
`#magewire-script`. The resulting script follows Livewire's normal DOM contract:

```html
<script
    id="magewire-script"
    src="magewire.csp.min.js"
    data-csrf="current-form-key"
    data-update-uri="/magewire/update"
    data-navigate-once="true"
></script>
```

Moving every `data-*` attribute, rather than only the two core attributes,
preserves attributes supplied by extensions to `magewireScriptBindings`.

## Initialization order

The transfer uses the `alpine:initialized` event intentionally:

1. Livewire begins its startup and schedules its script-placement diagnostic.
2. `Alpine.start()` dispatches `alpine:init`.
3. Magewire registers `magewireScript`, `magewireScriptBindings`, and its cookie
   utility.
4. Alpine initializes the hidden host and evaluates its bindings.
5. Alpine dispatches `alpine:initialized`.
6. The compatibility module moves the generated `data-*` attributes to the
   Magewire script.
7. `Alpine.start()` returns and Livewire dispatches `livewire:initialized`.
8. Livewire's deferred diagnostic finds the configured script in its expected
   location.

This ordering guarantees the attributes are on the script before consumers can
make a Magewire request.

## Attribute ownership and extension points

Treat the three attribute categories differently:

| Attribute category | Owner | Extension point |
| --- | --- | --- |
| Asset attributes such as `src` and `data-navigate-once` | Magewire frontend-assets mechanism | `script.html_attributes` in frontend DI |
| Runtime request attributes such as `data-csrf` and `data-update-uri` | `magewireScriptBindings` | Magewire Alpine binding customization |
| Alpine directives such as `x-data` and `x-bind` | Runtime configuration host | `script-alpine-js-magewire-runtime-config` layout block |

Static script attributes are rendered through
`FrontendAssetsViewModel::getScriptAttributes()`. Runtime attributes should be
returned as `data-*` bindings so they are evaluated on the CSP-safe host and then
forwarded to the script.

The Magento layout block
`script-alpine-js-magewire-runtime-config` can be replaced or moved by an
integration that needs a different runtime configuration host. Keep the stable
IDs `magewire-runtime-config` and `magewire-script` unless the forwarding logic
is replaced at the same time.

## CSRF and full-page cache safety

The CSRF value is read from the browser's current `form_key` cookie by
`magewireScriptBindings`. It is intentionally not embedded as a fixed server-side
value in potentially cached markup.

Moving the evaluated value to the script preserves both requirements:

- Livewire finds `data-csrf` where it expects its script configuration.
- Each browser session supplies its current form key after the page loads.

## Rules for integrations

- Do not add Alpine directives to `#magewire-script`.
- Add static script attributes through the frontend-assets configuration.
- Add dynamic request configuration as `data-*` bindings on the runtime host.
- Do not render a second Alpine.js bundle on a page where Magewire provides it.
- Preserve the `alpine:initialized` transfer when replacing the runtime host.

If the browser reports `Evaluating expressions on a script is prohibited in the
CSP build`, inspect the rendered `#magewire-script` first. It must not contain
`x-data`, `x-bind`, or any other Alpine directive.
