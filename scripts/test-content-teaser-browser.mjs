/** Real-browser checks for the experimental content contract and shared card CSS. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright-core';

const base = process.env.TEASER_STORYBOOK_URL || 'http://127.0.0.1:6010';
const output =
  process.env.TEASER_ARTIFACT_DIR || '/tmp/mangrove-content-teaser';
const themes = [
  'Global UNDRR Theme',
  'PreventionWeb Theme',
  'IRP Theme',
  'MCR2030 Theme',
  'DELTA Resilience Theme',
];
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const [index, theme] of themes.entries()) {
    for (const mobile of [false, true]) {
      const page = await browser.newPage({
        viewport: { width: mobile ? 320 : 1280, height: 1000 },
        reducedMotion: 'reduce',
        forcedColors: mobile ? 'active' : 'none',
      });
      await page.goto(
        `${base}/iframe.html?id=patterns-content-teaser--mixed-content&viewMode=story&globals=theme:${encodeURIComponent(theme)}`
      );
      await page.locator('.mg-content-teaser').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      if (mobile)
        await page.locator('body').evaluate(el => {
          el.dir = 'rtl';
        });
      const cards = page.locator('.mg-content-teaser');
      assert.equal(await cards.count(), 4);
      await page
        .locator('.mg-card__image')
        .evaluateAll(images => Promise.all(images.map(img => img.decode())));
      const geometry = await page.evaluate(() => {
        const cover = document.querySelector('.mg-card__book img');
        const image = cover.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          naturalRatio: cover.naturalWidth / cover.naturalHeight,
          renderedRatio: image.width / image.height,
          textOutsideCards: [
            ...document.querySelectorAll('.mg-content-teaser'),
          ].some(card => card.scrollWidth > card.clientWidth + 1),
          loaded: [...document.images].every(
            img => img.complete && img.naturalWidth > 0
          ),
        };
      });
      assert.equal(geometry.overflow, false, `${theme}: viewport overflow`);
      assert.equal(geometry.textOutsideCards, false, `${theme}: text overflow`);
      assert.equal(geometry.loaded, true);
      assert(
        Math.abs(geometry.naturalRatio - geometry.renderedRatio) < 0.01,
        `${theme}: cover cropped`
      );
      await page.keyboard.press('Tab');
      assert.equal(
        await page.locator(':focus').evaluate(el => el.tagName),
        'A'
      );
      assert.equal(
        await page
          .locator(':focus')
          .evaluate(el => el.matches(':focus-visible')),
        true
      );
      await page.screenshot({
        path: `${output}/${index}-${mobile ? 'mobile-rtl-forced' : 'desktop'}.png`,
        fullPage: true,
      });
      await page.close();
    }
  }
  console.log(
    'Content teaser browser checks passed: five themes, desktop and 320px RTL/forced colours, reduced motion, native focus and complete covers.'
  );
} finally {
  await browser.close();
}
