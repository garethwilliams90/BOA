# Task Breakdown — Product Variants Carousel

Companion to `AGENTS.md` (full spec). Work through these tasks **in order** — later tasks depend on earlier ones. Each task lists its own scope AND the cross-cutting constraints it must not violate, since those constraints (RTL/LTR, logical properties, `image_tag`, responsive margins) apply across almost every task and are easy to silently drop when focusing on one file at a time.

Give these to the agent one at a time (or a few at a time), always pointing it back at `AGENTS.md` for full field-level detail.

---

## Global constraints (apply to every task below — repeat these in every prompt)

- Base theme: Dawn copy ("BOA Ideas test store")
- CSS: use logical properties (`margin-inline-*`, `padding-inline-*`, `inset-inline-*`, etc.), never hardcoded `left`/`right`, so RTL keeps working
- Images always via `image_tag`, never manual `<img src="{{ image | img_url }}">`
- No new dependencies beyond Swiper.js (loaded via CDN or theme asset, per Dawn conventions)
- Don't introduce full-page reloads for any interaction described in the spec (variant switch, add to cart when "stay on page" is chosen)

---

## Task 1 — Scaffold the section shell

**Goal:** Get an empty, configurable section registered in the theme — no cards, no carousel logic yet.

- Create `sections/product-variants-carousel.liquid`
- Add section schema with:
  - `title` (text)
  - `icon` (a way to accept an SVG — inline picker or a text/code field per your theme's convention)
  - margin/padding number settings: top margin (default 0), bottom margin (default 0), top padding (default 20), bottom padding (default 0)
- Render title + icon at the top of the section
- Apply margin/padding as inline CSS custom properties or a scoped `<style>` block, using logical properties
- **Do not** add the Product Card block type yet — just get the section itself installable in the theme editor and confirm the settings show up and apply visually

**Check before moving on:** section appears in theme editor, settings panel shows all 5 fields with correct defaults, changing padding/margin visibly changes spacing in both LTR and RTL preview.

---

## Task 2 — Define the Product Card theme block schema (no rendering logic yet)

**Goal:** Get the block type registered with all settings fields, nested inside the section from Task 1. Focus purely on schema — static/dummy rendering only.

- Register a `product-card` theme block, nested under the section from Task 1
- Add all settings from the AGENTS's "Product Card block settings" table:
  - product reference
  - redirect-to-cart checkbox (default: **true**)
  - custom title (optional text)
  - custom description (optional text)
  - label text color picker
  - label background color picker
  - CTA available text
  - CTA out-of-stock text
- In the block's Liquid, just print the raw settings values (e.g. `{{ block.settings.product.title }}`) to confirm data is flowing — no styling, no variant logic, no carousel yet
- Merchant should be able to add multiple instances of this block inside the section in the theme editor

**Check before moving on:** can add 2+ Product Card blocks in the editor, each bound to a different product, each showing its own settings independently (confirms per-instance config isn't leaking between cards).

---

## Task 3 — Static (non-interactive) product card markup

**Goal:** Make one card look right for the *default* variant, with no JS interactivity yet. This locks in markup/data structure before layering on behavior.

- Product image for the **first variant**, via `image_tag`, responsive
- Title: custom title if set, else `product.title`
- Description: custom description if set, else `product.description`
- Labels: read `custom.product_labels` metafield (list of strings), render each as a pill/badge using the block's label text-color and background-color settings
- Price + compare-at price for the first variant (compare-at hidden if not present/equal)
- CTA button:
  - text = "available" text from settings if first variant is available, else "out-of-stock" text
  - visually disabled state if out of stock (styling only for now, click-blocking comes in Task 5)
- Color swatches:
  - only render this block at all if the product has a variant option literally named "Color"
  - one circle per color value found across the product's variants, swatch fill = that color name (simplest approach: CSS `background-color: {{ value | handle }}` or a small named-color mapping — pick one approach and keep it consistent)
  - **The Collection Snowboard: Liquid** (no Color option) is the negative test case — swatches must not appear for it at all

**Check before moving on:** render the section with both test products. "Snowboard with colored variants" shows 3 swatches + correct first-variant data; "The Collection Snowboard: Liquid" shows no swatches and correct data for its single variant. Long labels on the second product don't break layout.

---

## Task 4 — Variant switching (color swatch click → live update, no reload)

**Goal:** Wire up the JS that makes clicking a swatch update the card in place, using data already available in Liquid (no network call needed for this part — that's Task 5's job).

- On section/card render, expose per-variant data to JS (id, image, price, compare_at_price, available, option value) — e.g. via a `data-*` attribute with JSON, scoped per card instance so multiple cards on the page don't collide
- Add click handlers to swatches that:
  - mark the clicked swatch as "selected" (visual state)
  - update the card's image (still via responsive `image_tag`-rendered sources — swap `src`/`srcset`, don't drop responsiveness)
  - update price and compare-at price text
  - update CTA text/enabled-state based on the newly selected variant's availability
  - update the "currently selected variant id" stored somewhere accessible to Task 5 (e.g. a data attribute on the card root, or a small per-card JS state object)
- Must not touch or break: the section-level margin/padding, the label rendering, or any other card on the page when this one's swatch is clicked

**Check before moving on:** click each of the 3 swatches on "Snowboard with colored variants" — image, price, compare-at, and CTA text/state all update correctly and instantly, with no console errors, and the White (out-of-stock) swatch correctly disables the CTA.

---

## Task 5 — Add-to-cart via Cart AJAX API + redirect behavior

**Goal:** Make the CTA actually mutate the cart, respecting the current task's build on top of Task 4's "currently selected variant" state.

- CTA click handler:
  - guard clause: if current variant is unavailable, do nothing (belt-and-suspenders on top of the disabled attribute from Task 3/4)
  - if available: POST to `/cart/add.js` with the currently selected variant id (from Task 4's state, not always variant 1 — this is the part most likely to regress if built in isolation)
  - on success:
    - if this card's "redirect to cart" setting is enabled → navigate to `/cart`
    - if disabled → stay on page, no reload (optionally surface a lightweight success indication, not specified in AGENTS so keep it minimal)
  - handle fetch errors gracefully (don't leave the button in a stuck/loading state silently)

**Check before moving on:** add-to-cart works for Red and Blue variants, is blocked for White; redirect happens only when the per-card checkbox is enabled; switching color then adding to cart adds the *newly selected* variant, not the first one.

---

## Task 6 — Carousel behavior (Swiper.js)

**Goal:** Wrap the already-working cards in Swiper, last so carousel mechanics don't interfere with debugging variant/cart logic earlier.

- Load Swiper.js (CSS + JS) per Dawn's asset-loading conventions
- Initialize Swiper on the section's card list, one instance per section instance on the page (avoid global singleton init that breaks with multiple sections on a page)
- Confirm swatch clicks, image updates, and add-to-cart still work correctly on cards inside the carousel (event delegation/listener scoping is the usual breakage point here)
- Responsive behavior: reasonable slides-per-view breakpoints for mobile vs desktop (AGENTS doesn't pin exact numbers — use sensible Dawn-consistent breakpoints)
- Confirm carousel nav/pagination (if used) also respects logical properties for RTL (arrow direction should flip appropriately)

**Check before moving on:** full section works end-to-end, in a carousel, on both a LTR and an RTL preview, on mobile and desktop viewport widths.

---

## Task 7 — Cross-check against the full spec

**Goal:** Regression pass — no new code, just verification against `AGENTS.md`'s Acceptance Checklist.

- Go through every line of the Acceptance Checklist in `AGENTS.md`
- Re-test both sample products
- Re-test RTL
- Re-test with 2+ Product Card blocks in the same section instance (make sure per-card state, from Tasks 4–5, never leaks across cards)
- Fix any regressions found — don't add new features at this stage

---

## Task 8 — Repo + submission housekeeping (not code)

- Push to a **private** GitHub repo
- Write the actual submission `README.md` (describing the blocks built + test URLs) — note: this is a *different* AGENTS.md from the spec file you're reading now; don't overwrite this one, add the submission doc separately or merge intentionally
- Invite `simone@boaideas.com` and `reneta@boaideas.com` with **read** access
- Email both once done (or if blocked on questions)