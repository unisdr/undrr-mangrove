/** Real-browser validation for compact card selection, media semantics and layout variants. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright-core';

const base = process.env.TEASER_STORYBOOK_URL || 'http://127.0.0.1:6010';
const output = process.env.CARD_ARTIFACT_DIR || '/tmp/mangrove-content-card';
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
  for (const [index, theme] of themes.entries())
    for (const layout of ['vertical', 'book'])
      for (const mobile of [false, true]) {
        const page = await browser.newPage({
          viewport: { width: mobile ? 320 : 1280, height: 1000 },
          reducedMotion: 'reduce',
          forcedColors: mobile ? 'active' : 'none',
        });
        const story = layout === 'book' ? 'all-profiles-book' : 'all-profiles';
        await page.goto(
          `${base}/iframe.html?id=patterns-content-card--${story}&viewMode=story&globals=theme:${encodeURIComponent(theme)}`
        );
        await page.locator('.mg-content-card').first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        if (mobile)
          await page.locator('body').evaluate(el => {
            el.dir = 'rtl';
          });
        assert.equal(await page.locator('.mg-content-card').count(), 15);
        await page.locator('.mg-card__image').evaluateAll(images =>
          Promise.all(
            images.map(img => {
              img.loading = 'eager';
              return img.decode();
            })
          )
        );
        const geometry = await page.evaluate(() => {
          const cover = document.querySelector(
            '[data-content-type="publication"] img'
          );
          const rect = cover.getBoundingClientRect();
          const photo = document
            .querySelector('[data-content-type="article"] .mg-card__visual')
            .getBoundingClientRect();
          const logo = document.querySelector(
            '[data-content-type="organization"][data-content-profile="general"] img'
          );
          const vacancy = document.querySelector(
            '[data-content-type="opportunity"]'
          );
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            cardOverflow: [
              ...document.querySelectorAll('.mg-content-card'),
            ].some(card => card.scrollWidth > card.clientWidth + 1),
            coverRatio: rect.width / rect.height,
            naturalRatio: cover.naturalWidth / cover.naturalHeight,
            photoRatio: photo.width / photo.height,
            logoFit: getComputedStyle(logo).objectFit,
            logoInset: (() => {
              const stage = logo.parentElement;
              const image = logo.getBoundingClientRect();
              const outer = stage.getBoundingClientRect();
              const style = getComputedStyle(stage);
              return (
                parseFloat(style.paddingInlineStart) > 0 &&
                parseFloat(style.paddingInlineEnd) > 0 &&
                image.left > outer.left &&
                image.right < outer.right
              );
            })(),
            vacancyHasHiddenFields: Boolean(
              vacancy.querySelector('img,.mg-card__summary,.mg-card__meta')
            ),
          };
        });
        assert.equal(
          geometry.overflow,
          false,
          `${theme}/${layout}: viewport overflow`
        );
        assert.equal(
          geometry.cardOverflow,
          false,
          `${theme}/${layout}: card overflow`
        );
        assert(
          Math.abs(geometry.coverRatio - geometry.naturalRatio) < 0.01,
          `${theme}/${layout}: cropped cover`
        );
        assert(
          Math.abs(geometry.photoRatio - 16 / 9) < 0.02,
          `${theme}/${layout}: photo should remain landscape`
        );
        assert.equal(geometry.logoFit, 'contain');
        assert.equal(
          geometry.logoInset,
          true,
          `${theme}/${layout}: logo needs clear space on both sides`
        );
        assert.equal(geometry.vacancyHasHiddenFields, false);
        const vacancy = page.locator('[data-content-type="opportunity"]');
        assert.equal(await vacancy.locator('time').count(), 1);
        assert.match(await vacancy.innerText(), /Closing date:/);
        assert.equal(
          await page.locator('[data-content-type="event"] time').count(),
          6
        );
        const category = page
          .locator('[data-content-type="resource"] .mg-card__label[href]')
          .first();
        assert.equal(
          await category.evaluate(
            el => getComputedStyle(el).textDecorationLine
          ),
          'none'
        );
        assert.equal(
          await page
            .locator('[data-content-type="resource"] .mg-card__title a')
            .evaluate(el => getComputedStyle(el).textDecorationLine),
          'underline'
        );
        await category.hover();
        assert.equal(
          await category.evaluate(
            el => getComputedStyle(el).textDecorationLine
          ),
          'underline'
        );
        await page.mouse.move(0, 0);
        // Keyboard focus adds an underline and retains the shared focus ring.
        await page.locator('body').evaluate(el => {
          el.tabIndex = -1;
          el.focus();
        });
        await page.keyboard.press('Tab');
        await category.focus();
        const focusedCategory = await category.evaluate(el => {
          const style = getComputedStyle(el);
          return {
            decoration: style.textDecorationLine,
            ring: style.outlineStyle !== 'none' || style.boxShadow !== 'none',
          };
        });
        assert.equal(focusedCategory.decoration, 'underline');
        assert.equal(focusedCategory.ring, true);
        await category.blur();
        // Forced colours intentionally replace authored background colours.
        if (!mobile) {
          const originalBackground = await page.evaluate(() => {
            const photo = document.querySelector(
              '[data-content-type="article"]'
            );
            const before = getComputedStyle(photo).backgroundColor;
            for (const card of [
              photo,
              document.querySelector('[data-content-type="publication"]'),
            ])
              card.style.setProperty(
                '--mg-card-publication-background',
                'rgb(255, 0, 255)'
              );
            return before;
          });
          await page.waitForFunction(
            expected =>
              getComputedStyle(
                document.querySelector('[data-content-type="article"]')
              ).backgroundColor === expected &&
              getComputedStyle(
                document.querySelector('[data-content-type="publication"]')
              ).backgroundColor === 'rgb(255, 0, 255)',
            originalBackground,
            { timeout: 3000 }
          );
          await page.evaluate(() => {
            for (const card of document.querySelectorAll('.mg-content-card'))
              card.style.removeProperty('--mg-card-publication-background');
          });
        }
        await page.locator('body').evaluate(el => {
          el.tabIndex = -1;
          el.focus();
        });
        await page.keyboard.press('Tab');
        assert.equal(
          await page.locator(':focus').evaluate(el => el.tagName),
          'A'
        );
        await page.screenshot({
          path: `${output}/${index}-${layout}-${mobile ? 'mobile-rtl-forced' : 'desktop'}.png`,
          fullPage: true,
        });
        await page.close();
      }
  for (const story of [
    'missing-media',
    'unlabelled',
    'mixed-language',
    'resource-cover',
    'dates-with-published',
    'dates-with-published-book',
    'date-states',
  ]) {
    const page = await browser.newPage({
      viewport: { width: 320, height: 1000 },
    });
    await page.goto(
      `${base}/iframe.html?id=patterns-content-card--${story}&viewMode=story`
    );
    await page.locator('.mg-content-card').first().waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth
      ),
      false,
      story
    );
    if (story === 'missing-media')
      assert.equal(await page.locator('.mg-card__visual').count(), 0);
    if (story === 'unlabelled')
      assert.equal(await page.locator('.mg-card__meta').count(), 0);
    if (story === 'mixed-language') {
      const direction = await page
        .locator('article[lang="ar"]')
        .evaluate(el => getComputedStyle(el).direction);
      assert.equal(direction, 'rtl');
      assert.equal(
        await page
          .locator('article')
          .first()
          .evaluate(el => getComputedStyle(el).direction),
        'ltr'
      );
    }
    if (story.startsWith('dates-with-published')) {
      const cards = page.locator('article');
      assert.equal(await cards.count(), 3);
      for (const card of await cards.all()) {
        assert.match(await card.innerText(), /Published on:/);
        assert.match(
          await card.innerText(),
          /Event dates:|Session:|Closing date:/
        );
      }
    }
    if (story === 'date-states') {
      assert.match(
        await page.locator('body').innerText(),
        /Applications closed/
      );
      assert.match(await page.locator('body').innerText(), /Event ended/);
    }
    await page.screenshot({ path: `${output}/${story}.png`, fullPage: true });
    await page.close();
  }
  console.log(
    'Content cards passed: 15 profiles, vertical/book, five themes, covers/logos, missing media, field omissions, surface overrides and mixed directions.'
  );
} finally {
  await browser.close();
}
