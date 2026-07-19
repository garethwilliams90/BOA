## Testing

Testing here has to work around the fact that most of the "logic" lives in Liquid templates and DOM-driven JS inside a Shopify theme — there's no app server to unit test in the traditional sense. Split testing into three layers:

### 1. Static / lint checks (run on every change)
- Run **Shopify Theme Check** (`shopify theme check`) against the whole theme and fix all errors before moving on; warnings should be reviewed, not blindly ignored
- Keep Theme Check passing as a gate before starting the next task in `TASK_BREAKDOWN.md` — don't let lint debt stack up across tasks

### 2. JS unit tests (for logic that can be isolated from the DOM)
- Extract the pure logic — picking the right variant object from an option value, formatting money, deciding CTA text/disabled state from an availability flag — into small standalone functions, not inline in click handlers
- Unit test those functions (e.g. with Vitest or Jest) with fixtures modeled on the two real test products:
  - variant lookup by color value for "Snowboard with colored variants" (Red/Blue/White)
  - confirms no color-option logic runs for "The Collection Snowboard: Liquid"
  - CTA state derivation for both an available and an out-of-stock variant
- These tests don't need a live Shopify store — they're testing plain JS functions with mock variant data shaped like Shopify's product JSON

### 3. End-to-end / manual QA (against the real dev store)
- Use the Acceptance Checklist above as the canonical manual QA script — every item should be explicitly re-checked, not assumed passing, before submission
- If time allows, automate the add-to-cart and variant-switch flows with Playwright against the dev store's preview URL:
  - load a page with the section
  - click each color swatch and assert image/price/CTA text change
  - click CTA on an available variant and assert a cart request fires and behaves per the redirect setting
  - confirm the White swatch leaves the CTA disabled and clicking it does not fire a cart request
- Re-run the full manual QA pass after Task 7 (regression pass) in `TASK_BREAKDOWN.md`, and again right before submission

## Code Review

Treat this as if a real reviewer (not just yourself) will read the diff before it merges. Two review passes per task, not one at the very end:

### Self-review checklist (do this before considering any task in `TASK_BREAKDOWN.md` "done")
- Re-read the diff top to bottom as if you didn't write it
- Check it against the **Global constraints** in `TASK_BREAKDOWN.md` (logical properties, `image_tag`, no full reloads, no extra dependencies) — these are the easiest things to accidentally violate while focused on one task
- Check it doesn't regress anything already verified in an earlier task's "check before moving on" step
- No leftover debug `console.log`s, commented-out code, or hardcoded test-store IDs/URLs
- Settings schema changes are backward-compatible with any card instances already configured in the theme editor (don't rename/remove a setting key that earlier tasks already created content against)

### Structured review pass (before merging each task, and again before final submission)
- Open a PR per task (or per small group of tasks) rather than one giant PR at the end, so review comments map to a specific, small diff
- PR description should reference which Acceptance Checklist items it addresses
- Review focus areas, in order:
  1. **Correctness against spec** — does behavior match this doc exactly, including the edge cases (no-Color-option product, out-of-stock variant, long labels)?
  2. **Cross-cutting constraints** — RTL/logical properties, responsive images, no page reloads
  3. **State isolation** — with 2+ Product Card blocks on the same section instance, does interacting with one card ever affect another? (This is the most common regression point across Tasks 4–6 in `TASK_BREAKDOWN.md`.)
  4. **Code quality** — naming, duplication, whether DOM logic and pure logic are separated enough to be unit-testable
- Fix anything raised in review before starting the next task, not in a batch at the end