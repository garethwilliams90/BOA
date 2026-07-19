// Ad-hoc Playwright smoke test for RTL behaviour, per TESTING.md Layer 3 guidance.
// Forces <html dir="rtl"> before any page script runs, so Swiper's own RTL
// auto-detection (reads computed `direction` at mount time) picks it up.
//   node tests/e2e-rtl-smoke.mjs
import { chromium } from 'playwright';

const PREVIEW_URL = process.env.PREVIEW_URL || 'http://127.0.0.1:9292/';

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function main() {
  const browser = await chromium.launch();
  // Use a mobile-width viewport so slidesPerView (1.1) causes real overflow
  // with only 3 cards — at desktop widths all 3 fit in view and Swiper
  // correctly locks/hides both nav buttons (nothing to scroll).
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto(PREVIEW_URL, { waitUntil: 'load' });

  await page.waitForFunction(() => {
    const el = document.querySelector('[data-product-variants-carousel]');
    return el && el.classList.contains('swiper-initialized');
  }, { timeout: 15000 });

  // On initial load the "prev" button is legitimately `display: none` (there is no
  // previous slide yet), so it has no measurable transform. Advance one slide so
  // both nav buttons are visible before comparing their rotations.
  await page.locator('.product-variants-carousel__nav-button--next').click();
  await page.waitForTimeout(400);

  // Note: this sandbox's Playwright/CDP setup does not honor `addInitScript`
  // (verified against a plain example.com load too), so we can't force
  // <html dir="rtl"> before Swiper's own first-paint auto-detection runs.
  // Instead we flip direction at runtime via Swiper's own documented
  // `changeLanguageDirection` API (https://swiperjs.com/swiper-api#methods),
  // which exercises the exact same `swiper-rtl` class + CSS logical-property
  // codepath our styles depend on.
  await page.evaluate(() => {
    document.documentElement.setAttribute('dir', 'rtl');
    const el = document.querySelector('[data-product-variants-carousel]');
    el.swiper.changeLanguageDirection('rtl');
  });

  const isRtlDetected = await page.evaluate(() => {
    const el = document.querySelector('[data-product-variants-carousel]');
    return el.classList.contains('swiper-rtl');
  });
  assertTrue(isRtlDetected, 'Swiper is in RTL mode and the swiper-rtl class is present');

  const prevRotation = await page.evaluate(() => {
    const icon = document.querySelector('.product-variants-carousel__nav-button--prev .icon-caret');
    return getComputedStyle(icon).transform;
  });
  const nextRotation = await page.evaluate(() => {
    const icon = document.querySelector('.product-variants-carousel__nav-button--next .icon-caret');
    return getComputedStyle(icon).transform;
  });
  assertTrue(prevRotation !== nextRotation, 'Prev/next chevrons are rotated differently from each other in RTL');

  // In LTR, prev rotates 90deg (points to inline-start = left). In RTL, inline-start
  // is the physical right, so the prev chevron's *physical* rotation must flip to
  // -90deg (matrix(0,-1,1,0,...)) instead of matrix(0,1,-1,0,...) for 90deg.
  const ltrPrevRotation = await page.evaluate(() => {
    document.documentElement.setAttribute('dir', 'ltr');
    document.querySelector('[data-product-variants-carousel]').swiper.changeLanguageDirection('ltr');
    const icon = document.querySelector('.product-variants-carousel__nav-button--prev .icon-caret');
    const value = getComputedStyle(icon).transform;
    document.documentElement.setAttribute('dir', 'rtl');
    document.querySelector('[data-product-variants-carousel]').swiper.changeLanguageDirection('rtl');
    return value;
  });
  assertTrue(
    ltrPrevRotation !== prevRotation,
    `Prev chevron rotation flips between LTR (${ltrPrevRotation}) and RTL (${prevRotation})`,
  );

  const navButtonPosition = await page.evaluate(() => {
    const prevBtn = document.querySelector('.product-variants-carousel__nav-button--prev');
    const container = document.querySelector('.product-variants-carousel__swiper');
    const prevRect = prevBtn.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    // inset-inline-start in RTL resolves to the *right* edge of the container.
    return {
      distanceFromRight: containerRect.right - prevRect.right,
      distanceFromLeft: prevRect.left - containerRect.left,
    };
  });
  assertTrue(
    navButtonPosition.distanceFromRight < navButtonPosition.distanceFromLeft,
    `"Prev" button sits near the physical right edge in RTL (inset-inline-start correctly flipped): ${JSON.stringify(navButtonPosition)}`,
  );

  await browser.close();
  console.log('\nAll RTL smoke checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
