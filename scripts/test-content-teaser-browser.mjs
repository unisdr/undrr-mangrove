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
      await page.locator('body').evaluate(el => {
        el.tabIndex = -1;
        el.focus();
      });
      await page.evaluate(() => document.fonts.ready);
      if (mobile)
        await page.locator('body').evaluate(el => {
          el.dir = 'rtl';
        });
      const cards = page.locator('.mg-content-teaser');
      assert.equal(await cards.count(), 15);
      await page.locator('.mg-card__image').evaluateAll(images =>
        Promise.all(
          images.map(img => {
            img.loading = 'eager';
            return img.decode();
          })
        )
      );
      const typography = await page.evaluate(() => {
        const probe = document.createElement('span');
        probe.style.cssText =
          'position:absolute;visibility:hidden;font-family:var(--mg-font-family-ui);font-size:var(--mg-content-teaser-metadata-font-size)';
        document.body.append(probe);
        const expected = getComputedStyle(probe);
        const fontSize = expected.fontSize;
        const fontFamily = expected.fontFamily;
        probe.remove();
        const metadata = [
          ...document.querySelectorAll(
            '.mg-content-teaser__before-title time, .mg-content-teaser__metadata, .mg-content-teaser__attribution li, .mg-content-teaser .mg-card__label'
          ),
        ];
        const summary = document.querySelector(
          '.mg-content-teaser .mg-card__summary'
        );
        return {
          count: metadata.length,
          consistent: metadata.every(el => {
            const style = getComputedStyle(el);
            return (
              style.fontSize === fontSize && style.fontFamily === fontFamily
            );
          }),
          smallerThanSummary:
            parseFloat(fontSize) <
            parseFloat(getComputedStyle(summary).fontSize),
        };
      });
      assert(typography.count > 15, `${theme}: metadata missing`);
      assert(
        typography.consistent,
        `${theme}: metadata typography falls back to body styling`
      );
      assert(
        typography.smallerThanSummary,
        `${theme}: metadata should be secondary to summary`
      );
      if (!mobile) {
        const override = await cards.first().evaluate(async card => {
          const summary = card.querySelector('.mg-card__summary');
          const originalSummarySize = getComputedStyle(summary).fontSize;
          card.style.setProperty(
            '--mg-content-teaser-metadata-font-size',
            '19px'
          );
          // Reduced-motion styles retain near-zero transitions; allow them to settle.
          await new Promise(resolve =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          );
          const metadata = [
            ...card.querySelectorAll(
              'time, .mg-content-teaser__attribution li, .mg-card__label'
            ),
          ];
          const result =
            metadata.every(el => getComputedStyle(el).fontSize === '19px') &&
            getComputedStyle(summary).fontSize === originalSummarySize;
          card.style.removeProperty('--mg-content-teaser-metadata-font-size');
          await new Promise(resolve =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          );
          return result;
        });
        assert(
          override,
          `${theme}: metadata token override must preserve summary size`
        );
      }
      const geometry = await page.evaluate(() => {
        const cover = document.querySelector(
          '[data-content-type="publication"] img'
        );
        const image = cover.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          naturalRatio: cover.naturalWidth / cover.naturalHeight,
          renderedRatio: image.width / image.height,
          textOutsideCards: [
            ...document.querySelectorAll('.mg-content-teaser'),
          ].some(card => card.scrollWidth > card.clientWidth + 1),
          horizontal: [
            ...document.querySelectorAll(
              '.mg-content-teaser:has(.mg-card__visual)'
            ),
          ].every(card => {
            const visual = card
              .querySelector('.mg-card__visual')
              .getBoundingClientRect();
            const text = card
              .querySelector('.mg-card__content')
              .getBoundingClientRect();
            return (
              Math.abs(visual.top - text.top) < 2 && visual.right <= text.left
            );
          }),
          loaded: [...document.images].every(
            img => img.complete && img.naturalWidth > 0
          ),
        };
      });
      assert.equal(geometry.overflow, false, `${theme}: viewport overflow`);
      assert.equal(geometry.textOutsideCards, false, `${theme}: text overflow`);
      assert.equal(geometry.loaded, true);
      if (!mobile)
        assert.equal(
          geometry.horizontal,
          true,
          `${theme}: expected side-by-side media and text`
        );
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
      const metadataLink = page.locator(
        '[data-content-type="publication"] .mg-content-teaser__metadata-link'
      );
      await metadataLink.focus();
      assert.equal(
        await metadataLink.evaluate(el => el === document.activeElement),
        true
      );
      assert.equal(
        await metadataLink.evaluate(el => getComputedStyle(el).zIndex),
        '2'
      );
      const topics = page.locator(
        '[data-content-type="event"][data-content-profile="programme-session"] .mg-content-teaser__metadata-link'
      );
      assert.equal(await topics.count(), 2);
      const firstTopic = await topics.nth(0).boundingBox();
      const secondTopic = await topics.nth(1).boundingBox();
      if (Math.abs(firstTopic.y - secondTopic.y) < 2) {
        assert(
          Math.max(
            secondTopic.x - (firstTopic.x + firstTopic.width),
            firstTopic.x - (secondTopic.x + secondTopic.width)
          ) > 0,
          `${theme}: topic links touch or overlap`
        );
      }
      assert.equal(
        await topics.first().locator('..').textContent(),
        'Risk governance Local action'
      );
      await page.screenshot({
        path: `${output}/${index}-${mobile ? 'mobile-rtl-forced' : 'desktop'}.png`,
        fullPage: true,
      });
      await page.route('**/publications/guidance', route =>
        route.fulfill({
          contentType: 'text/html',
          body: '<p>Taxonomy destination fixture</p>',
        })
      );
      await Promise.all([
        page.waitForURL('**/publications/guidance'),
        metadataLink.click(),
      ]);
      assert(
        new URL(page.url()).pathname === '/publications/guidance',
        `${theme}: taxonomy link activated the wrong destination`
      );
      await page.close();
    }
  }
  console.log(
    'Content teaser browser checks passed: five themes, desktop and 320px RTL/forced colours, reduced motion, native focus and complete covers.'
  );
} finally {
  await browser.close();
}
