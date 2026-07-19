# BOA IDEAS — Product Variants Carousel (Shopify Theme Assignment)

A custom Shopify Dawn theme section/block pair that renders a horizontal
product carousel with live variant switching and Cart AJAX add-to-cart,
built with the Shopify **Theme Blocks** architecture.

Full functional spec: [`AGENTS.md`](./AGENTS.md).
 Task-by-task build log: [`TASK_BREAKDOWN.md`](./TASK_BREAKDOWN.md).
  Testing strategy: [`TESTING.md`](./TESTING.md).

## What was built

### `sections/product-variants-carousel.liquid` — "Product Variants Carousel" section

- Configurable section title + SVG icon, shown in a header row.
- Top/bottom margin and top/bottom padding settings (px), defaults `0 / 0 / 20 / 0`.
- Accepts any number of nested `product-card` theme blocks (added/reordered/removed
  by the merchant in the theme editor), rendered as [Swiper.js](https://swiperjs.com)
  slides.
- Swiper is loaded from local theme assets (`assets/swiper-bundle.min.js` /
  `.css`) and initialized per-section-instance (no global singleton), with:
  - Previous/next chevron buttons (auto-hidden when there's nothing to scroll to)
  - Pagination bullets
  - Responsive `slidesPerView` breakpoints (mobile → large desktop)
  - Full RTL support — chevron rotation and button position flip via
    `.swiper-rtl` + CSS logical properties (`inset-inline-start/end`), no
    hardcoded `left`/`right`
- Because Shopify wraps every block rendered via `content_for 'blocks'` in its
  own `.shopify-block` wrapper div, and Swiper requires slides to be *direct*
  children of `.swiper-wrapper`, the carousel init script tags those wrapper
  divs with `swiper-slide` at runtime rather than fighting Shopify's markup.

### `blocks/product-card.liquid` — "Product Card" theme block

One instance = one carousel slide, each with independent settings:

| Setting | Type |
|---|---|
| Product | product reference |
| Redirect to cart after add | checkbox (default: enabled) |
| Custom product title | text (optional, falls back to `product.title`) |
| Custom product description | richtext (optional, falls back to `product.description`) |
| Label text color | color |
| Label background color | color |
| CTA available text | text |
| CTA out-of-stock text | text |

Behavior:

- First variant selected by default on load.
- Product image rendered via `image_tag` (responsive `widths`/`sizes`), and
  swapped on variant change without a page reload.
- Price and compare-at price (strikethrough, hidden when absent) live-update
  on variant change.
- Color swatches render **only** when the product has a variant option
  literally named "Color" — one clickable circle per color value, tinted via
  a CSS custom property derived from the color name. Clicking a swatch updates
  the selected variant, image, price, compare-at price, availability, and CTA
  — all client-side, no reload.
- CTA button adds the currently selected variant to the cart via
  `/cart/add.js` (Cart AJAX API, plain `fetch`). Disabled + shows the
  out-of-stock text when the selected variant is unavailable (both via the
  `disabled` attribute and a JS guard clause). On success, redirects to
  `/cart` if the block's "Redirect to cart" setting is enabled, otherwise
  shows an inline success message and stays on the page.
- Labels: text values come from the `custom.product_labels` product
  metafield (list of strings); styling (text/background color) comes from the
  block settings, shared across all labels on that card.
- Per-card state (selected variant, swatches, cart requests) is fully scoped
  to that card's own DOM node — multiple Product Card blocks on the same
  section instance don't interfere with each other.

### `assets/product-card-logic.js`

Pure, DOM-free helper functions (variant lookup by id/color, CTA state
derivation, add-to-cart guard) shared between the block's runtime JS and the
unit test suite — see [Testing](#testing) below.

## Testing

Three layers, per `TESTING.md`:

1. **Static/lint** — `shopify theme check` (no errors on any file touched by
   this feature).
2. **JS unit tests** (`tests/product-card-logic.test.js`, fixtures in
   `tests/fixtures/products.js`, modeled on the two real dev-store test
   products):
   ```bash
   npm install
   npm test
   ```
3. **End-to-end smoke tests** (Playwright, driven against a running
   `shopify theme dev` server or any live preview URL):
   ```bash
   npm run test:e2e       # carousel init, swatch clicks, cart add, redirect on/off
   npm run test:e2e:rtl   # RTL chevron rotation + inset-inline flip
   ```
   Both accept a `PREVIEW_URL` env var, e.g.
   `PREVIEW_URL="http://127.0.0.1:9292/" npm run test:e2e`.

### Manual QA / storefront URLs

The theme is developed against the **"BOA Ideas home assignment"** theme on
the `boa-soda-home-test-21e665ab.myshopify.com` dev store (theme id
`141446643787`).

- **Theme editor:** `https://admin.shopify.com/store/boa-soda-home-test-21e665ab/themes/141446643787/editor`
- **Storefront preview:** `https://boa-soda-home-test-21e665ab.myshopify.com/?preview_theme_id=141446643787`

> Before sharing/using the links above, push the latest code to that theme:
> `shopify theme push --theme 141446643787`. For live iteration while
> developing, `shopify theme dev` spins up its own temporary preview link
> (printed in the terminal) pointed at a personal development theme instead.

Manually re-tested against both dev-store fixture products on every pass:

- **"Snowboard with colored variants"** — 3-way Color option (Red/Blue/White,
  White always out of stock) — exercises swatches, live variant switching,
  and the disabled/out-of-stock CTA path.
- **"The Collection Snowboard: Liquid"** — single variant, no Color option,
  long label strings — exercises the "no swatches" path and label
  wrapping/overflow.

## Local development

```bash
shopify theme dev --store boa-soda-home-test-21e665ab.myshopify.com
```

## Repo access

Read access for `simone@boaideas.com` and `reneta@boaideas.com`.
