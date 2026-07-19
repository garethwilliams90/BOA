// Ad-hoc Playwright smoke test against the live dev-store preview, per TESTING.md
// Layer 3 guidance. Not part of the `npm test` suite (needs network + a live
// preview URL), run manually:
//   node tests/e2e-smoke.mjs
import { chromium } from 'playwright';

const PREVIEW_URL = process.env.PREVIEW_URL
  || 'https://boa-soda-home-test-21e665ab.myshopify.com/?preview_theme_id=141534167115';

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function main() {
  const browser = await chromium.launch();
  // Mobile width so slidesPerView (1.1) overflows with only 3 cards; at desktop
  // widths all 3 fit in view and Swiper correctly locks/hides both nav buttons.
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const cartAddRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('/cart/add.js')) {
      cartAddRequests.push(request);
    }
  });

  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto(PREVIEW_URL, { waitUntil: 'load' });

  // Store password gate, if present.
  const passwordInput = page.locator('input[type="password"]').first();
  if (await passwordInput.count()) {
    console.log('Store password gate detected — set STORE_PASSWORD env var to bypass.');
    if (process.env.STORE_PASSWORD) {
      await passwordInput.fill(process.env.STORE_PASSWORD);
      await page.locator('button[type="submit"], input[type="submit"]').first().click();
      await page.waitForLoadState('load');
    }
  }

  const carousel = page.locator('[data-product-variants-carousel]').first();
  assertTrue(await carousel.count() === 1, 'Carousel container is present on the page');

  await page.waitForFunction(() => {
    const el = document.querySelector('[data-product-variants-carousel]');
    return el && el.classList.contains('swiper-initialized');
  }, { timeout: 15000 });
  assertTrue(true, 'Swiper initialized on the carousel container (swiper-initialized class present)');

  const cards = page.locator('[data-product-card-block]');
  const cardCount = await cards.count();
  assertTrue(cardCount >= 2, `Found ${cardCount} product card(s) rendered inside the carousel`);

  // Regression check: Shopify wraps every block rendered via `content_for 'blocks'`
  // in its own `.shopify-block` div, which must carry the `swiper-slide` class
  // (added at runtime) since Swiper only recognizes direct children of
  // `.swiper-wrapper` as slides.
  const slidesPerSwiper = await page.evaluate(() => document.querySelector('[data-product-variants-carousel]').swiper.slides.length);
  assertTrue(slidesPerSwiper === cardCount, `Swiper recognizes all ${cardCount} rendered cards as slides (found ${slidesPerSwiper})`);

  const translateBefore = await page.evaluate(() => document.querySelector('[data-product-variants-carousel]').swiper.translate);
  await page.locator('.product-variants-carousel__nav-button--next').click();
  await page.waitForTimeout(500);
  const translateAfter = await page.evaluate(() => document.querySelector('[data-product-variants-carousel]').swiper.translate);
  assertTrue(translateAfter !== translateBefore, 'Clicking the "next" nav button actually advances the carousel');

  // Locate the card with color swatches ("Snowboard with colored variants").
  const colorCard = page.locator('[data-product-card-block]:has([data-product-card-swatch])').first();
  assertTrue(await colorCard.count() === 1, 'Found the card with color swatches');

  const image = colorCard.locator('.product-card-block__image');
  const priceEl = colorCard.locator('[data-product-card-price]');
  const ctaButton = colorCard.locator('[data-product-card-button]');

  const initialSrc = await image.getAttribute('src');
  const initialPrice = (await priceEl.textContent()).trim();

  const whiteSwatch = colorCard.locator('[data-product-card-swatch][data-color-value="White"]');
  await whiteSwatch.click();

  await page.waitForFunction(
    (expected) => {
      const img = document.querySelector('[data-product-card-block]:has([data-product-card-swatch]) .product-card-block__image');
      return img && img.getAttribute('src') !== expected;
    },
    initialSrc,
    { timeout: 5000 },
  ).catch(() => {});

  const updatedSrc = await image.getAttribute('src');
  assertTrue(updatedSrc !== initialSrc, 'Clicking the White swatch updated the product image (no reload)');

  const isCtaDisabledForWhite = await ctaButton.isDisabled();
  assertTrue(isCtaDisabledForWhite === true, 'CTA is disabled after selecting the out-of-stock White swatch');

  await whiteSwatch.click({ force: true }).catch(() => {});
  assertTrue(cartAddRequests.length === 0, 'No /cart/add.js request fired for the disabled (White) CTA');

  const redSwatch = colorCard.locator('[data-product-card-swatch][data-color-value="Red"]');
  await redSwatch.click();
  await page.waitForTimeout(300);

  const isCtaEnabledForRed = await ctaButton.isDisabled();
  assertTrue(isCtaEnabledForRed === false, 'CTA re-enabled after selecting the available Red swatch');

  const priceAfterRed = (await priceEl.textContent()).trim();
  assertTrue(priceAfterRed === initialPrice, 'Price text is present after switching back to the first-loaded (Red) variant');

  await ctaButton.click();
  await page.waitForTimeout(1000);

  assertTrue(cartAddRequests.length === 1, `Clicking an enabled CTA fired exactly one /cart/add.js request (got ${cartAddRequests.length})`);

  // Filter out known-benign noise from Shopify's own scripts when proxied through
  // the local `shopify theme dev` server (unrelated to this section/block's code).
  const KNOWN_BENIGN_PATTERNS = [
    /favicon/,
    /origin_trials/,
    /cdn\.shopify\.com.*CORS/,
    /Failed to load resource/,
    /\[HotReload]/,
  ];
  const relevantConsoleErrors = consoleErrors.filter(
    (msg) => !KNOWN_BENIGN_PATTERNS.some((pattern) => pattern.test(msg)),
  );
  assertTrue(relevantConsoleErrors.length === 0, `No unexpected console/page errors (got: ${JSON.stringify(relevantConsoleErrors)})`);

  // The earlier CTA click redirected to /cart (redirect_to_cart=true on that
  // card) — go back to test a card configured with "Redirect to cart" disabled;
  // it must stay on the page (no navigation) and show a success status instead.
  await page.goto(PREVIEW_URL, { waitUntil: 'load' });
  const noRedirectCard = page.locator('[data-product-card-block][data-redirect-to-cart="false"]').first();
  if (await noRedirectCard.count()) {
    const urlBefore = page.url();
    await noRedirectCard.locator('[data-product-card-button]').click();
    await page.waitForTimeout(800);
    assertTrue(page.url() === urlBefore, 'Card with "redirect to cart" disabled does not navigate away after add-to-cart');
    const statusText = (await noRedirectCard.locator('[data-product-card-status]').textContent()).trim();
    assertTrue(statusText.length > 0, `Card with "redirect to cart" disabled shows a success status message ("${statusText}")`);
  } else {
    console.log('SKIP: no card configured with redirect_to_cart=false was found to test.');
  }

  await browser.close();
  console.log('\nAll smoke checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
