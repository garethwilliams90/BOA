# BOA IDEAS Shopify Storefront Assignment — Product Variants Carousel

Reference spec for building a custom Shopify theme section using Liquid, Theme Blocks, JavaScript, and the Cart AJAX API. Use this as the source of truth when implementing — do not deviate from these requirements without a good reason.

## Tech / Platform Constraints

- **Base theme**: Shopify Dawn (copy called "BOA idea home assignment" already installed on the dev store)
- **Deployment**: Shopify CLI
- **Carousel library**: [Swiper.js](https://swiperjs.com) — required, don't substitute another carousel lib
- **Images**: must be responsive and rendered via Shopify's `image_tag` filter (not raw `<img>` with manually built `src`)
- **Layout**: must support both desktop and mobile, and both LTR and RTL — use CSS Logical Properties (`margin-inline-start`, `padding-inline-end`, etc.) instead of physical left/right properties wherever applicable
- **Cart operations**: use the Shopify Cart AJAX API (`/cart/add.js`, etc.) via plain client-side `fetch` — no server round-trips/page reloads for add-to-cart

## Section: "Product Variants Carousel"

A new custom section, built with the Shopify Theme Blocks architecture (not static section settings), so merchants can add/reorder/remove product cards as nested blocks.

### Section-level settings

| Setting | Type | Notes |
|---|---|---|
| Section title | text | |
| Icon | SVG | shown near the title |
| Product cards | nested theme blocks | see "Product Card Theme Block" below |
| Top margin | number (px) | default `0` |
| Bottom margin | number (px) | default `0` |
| Top padding | number (px) | default `20` |
| Bottom padding | number (px) | default `0` |

## Theme Block: "Product Card"

Each carousel slide is one instance of this block. Each instance has its own settings (so different cards can have different labels, colors, CTA text, etc).

### Data shown per card

- Product image — **must reflect the currently selected variant**, not just the product's default image
- Product title (see config rules below)
- Product labels (see config rules below)
- Product description (see config rules below)
- Variant price — must live-update on variant change
- Variant compare_at price (strikethrough) — must live-update on variant change; hidden if not present
- Color options (see rules below)
- CTA button (see rules below)

### Default variant selection

- On load, the **first variant** of the product is selected by default.

### Color options / swatches

- Rendered as clickable circles.
- Generated dynamically from the product's variants — **only** if the product has a variant option literally named "Color" (e.g. products with a "Colors" option or no color option at all should not render this UI section).
- Each circle's color is derived from the value of that variant's Color option (e.g. "Black", "White", "Red", "Blue").
- Clicking a circle updates, without a page reload:
  - selected variant
  - product image
  - price
  - compare-at price
  - availability state
  - CTA button state/text

### CTA button behavior

- If the currently selected variant **is available**:
  - Button is enabled, shows the configured "available" text.
  - Clicking it adds the variant to cart via the Cart AJAX API.
  - After a successful add:
    - If "redirect to cart" is enabled (see settings) → redirect to `/cart`.
    - If disabled → stay on the current page (no redirect, no reload).
- If the currently selected variant **is out of stock**:
  - Button is disabled (not clickable) and shows the configured out-of-stock text.
  - No cart mutation happens if clicked (it shouldn't be clickable at all, but guard against it regardless).

### Product Card block settings (Theme Block schema)

| Setting | Type | Notes |
|---|---|---|
| Redirect to cart after add | checkbox | default: **enabled (true)** |
| Product | product reference | main connection powering the whole card |
| Custom product title | text (optional) | falls back to the product's real title if left blank |
| Custom product description | text/richtext (optional) | falls back to the product's real description if left blank |
| Label text color | color picker | applies to all labels on this card |
| Label background color | color picker | applies to all labels on this card |
| CTA available text | text | e.g. "Add to cart" |
| CTA out-of-stock text | text | e.g. "Sold out" |

### Product Labels

- Label **text values** come from a product metafield: `custom.product_labels`, defined as a **list of strings**.
- Label **styling** (text color + background color) comes from the block settings above, not the metafield — meaning all labels on a given card share the same colors, even though each label's text differs per product. This is expected/acceptable behavior per the spec, not a bug.

## Test Products (already configured on the dev store)

### 1. "Snowboard with colored variants"
- Has a variant option named **Color** with 3 values: Red, Blue, White
- Red and Blue: always in stock
- White: always out of stock (use this to test the disabled CTA / out-of-stock state)
- `custom.product_labels` metafield already populated

### 2. "The Collection Snowboard: Liquid"
- Only 1 variant (the default variant)
- **No** "Color" option → color swatch UI must not render for this product
- `custom.product_labels` metafield populated with long label strings (use this to test label wrapping/overflow handling)

## Acceptance Checklist

- [ ] Section renders with configurable title + SVG icon
- [ ] Section supports margin/padding settings with correct defaults (0/0/20/0)
- [ ] Merchant can add multiple Product Card blocks inside the section, in Shopify theme editor
- [ ] Carousel implemented with Swiper.js
- [ ] Layout works on mobile + desktop
- [ ] Layout works in both LTR and RTL, using CSS logical properties
- [ ] Images use `image_tag` filter and are responsive
- [ ] First variant selected by default on page load
- [ ] Color swatches only appear when product has a "Color" option
- [ ] Clicking a swatch updates image, price, compare-at price, availability, and CTA — no page reload
- [ ] CTA adds to cart via Cart AJAX API when variant is available
- [ ] CTA is disabled + shows out-of-stock text when variant is unavailable
- [ ] Redirect-to-cart checkbox behavior works (default: enabled)
- [ ] Custom title/description override product defaults when provided, otherwise fall back correctly
- [ ] Labels pull text from `custom.product_labels` metafield and styling from block color settings
- [ ] Tested against both sample products (with and without color variants, short and long labels)

## Submission Requirements (not part of the code, but don't forget)

- Private GitHub repo containing the theme code
- `README.md` in the repo describing:
  - the theme blocks built
  - instructions for testing (including the actual storefront URLs where the blocks are set up)
- Invite with **read** access:
  - simone@boaideas.com
  - reneta@boaideas.com
- Email both of the above once complete (or if questions come up) before considering the assignment done

## Useful References

- Shopify CLI: https://shopify.dev/docs/api/shopify-cli
- Theme development docs: https://shopify.dev/docs/storefronts/themes
- Theme architecture: https://shopify.dev/docs/storefronts/themes/architecture
- Theme Blocks quick start: https://shopify.dev/docs/storefronts/themes/architecture/blocks/theme-blocks/quick-start?framework=liquid
- Liquid API reference: https://shopify.dev/docs/api/liquid
- Cart AJAX API: https://shopify.dev/docs/api/ajax/reference/cart
- Swiper.js: https://swiperjs.com