/** Hit testing and touch input are required: jsdom cannot catch stacked backdrops. */
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright-core';

const base = process.env.SEARCH_STORYBOOK_URL || 'http://127.0.0.1:6099';
const engine = process.env.SEARCH_BROWSER || 'chromium';
assert(['chromium', 'webkit'].includes(engine));
const browser = await { chromium, webkit }[engine].launch();
const themes = [
  'Global UNDRR Theme',
  'PreventionWeb Theme',
  'IRP Theme',
  'MCR2030 Theme',
  'DELTA Resilience Theme',
];
try {
  // Inline open-drawer examples lock the whole docs document, even when
  // desktop CSS hides the drawer. Exercise docs as well as isolated stories.
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(
      `${base}/iframe.html?id=components-syndicated-search--docs&viewMode=docs`
    );
    const example = page.locator(
      'iframe[src*="components-syndicated-search--filter-drawer"]'
    );
    await example.scrollIntoViewIfNeeded();
    const drawerFrame = example.contentFrame();
    await drawerFrame.locator('.mg-search__drawer').waitFor();
    assert.equal(
      await drawerFrame.locator('body').evaluate(el => el.style.overflow),
      'hidden',
      'The open drawer must still lock its own document'
    );
    assert.notEqual(
      await page.locator('body').evaluate(el => getComputedStyle(el).overflowY),
      'hidden',
      'The example must not lock the surrounding docs'
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.move(width / 2, 200);
    await page.mouse.wheel(0, 600);
    await page.waitForFunction(() => window.scrollY > 0);
    console.log(`${engine}: docs scrolling at ${width}px: passed`);
    await page.close();
  }
  for (const theme of themes) {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    });
    await page.route('**/*search-endpoint*', route =>
      route.fulfill({
        json: {
          hits: {
            total: { value: 4 },
            hits: Array.from({ length: 4 }, (_, index) => ({
              _id: String(index),
              _source: {
                type: 'news',
                field_domain_access: ['www_undrr_org'],
                teaser: `<div class="mg-card mg-card__hc">${
                  index > 1
                    ? '<div class="mg-card__visual"><img class="mg-card__image" src="/test-cover.svg" alt="Test publication cover" /></div>'
                    : ''
                }<div class="mg-card__content"><h3 class="mg-card__title"><a href="#result-${index}">Publication ${index}</a></h3><p>${
                  index % 2
                    ? 'A longer description of community resilience. '.repeat(
                        16
                      )
                    : 'Short summary.'
                }</p></div></div>`,
              },
            })),
          },
          aggregations: {},
        },
      })
    );
    await page.route('**/api/**', route =>
      route.fulfill({ json: { results: [] } })
    );
    await page.route('**/test-cover.svg', route =>
      route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80"><rect width="60" height="80" fill="navy"/></svg>',
      })
    );
    await page.goto(
      `${base}/iframe.html?id=components-syndicated-search-display-modes--card-book-display&viewMode=story&globals=${encodeURIComponent(`theme:${theme}`)}`
    );
    await page
      .getByRole('searchbox', { name: 'Search', exact: true })
      .fill('climate');
    await page.getByRole('button', { name: 'Submit search' }).click();
    const cards = page.locator('.mg-search__results-grid .mg-card__book');
    await cards.last().waitFor();
    const heights = await cards.evaluateAll(elements =>
      elements.map(el => el.getBoundingClientRect().height)
    );
    assert.equal(heights.length, 4);
    assert(
      Math.max(...heights) - Math.min(...heights) < 1,
      'Search book cards must fill their grid row'
    );
    const coverRatios = await cards
      .locator('.mg-card__visual')
      .evaluateAll(elements =>
        elements.map(el => {
          const rect = el.getBoundingClientRect();
          return rect.width / rect.height;
        })
      );
    assert.equal(coverRatios.length, 2);
    assert(
      coverRatios.every(ratio => Math.abs(ratio - 3 / 4) < 0.01),
      'Cover proportions must remain 3:4'
    );
    const standaloneHeight = await cards.first().evaluate(el => {
      const wrapper = document.createElement('div');
      wrapper.style.width = `${el.getBoundingClientRect().width}px`;
      const clone = el.cloneNode(true);
      wrapper.append(clone);
      document.body.append(wrapper);
      const height = clone.getBoundingClientRect().height;
      wrapper.remove();
      return height;
    });
    assert(
      standaloneHeight < Math.min(...heights),
      'Standalone book cards must retain content height'
    );
    await page.setViewportSize({ width: 390, height: 844 });
    assert(
      await page
        .locator('.mg-search__results-grid')
        .evaluate(el => el.scrollWidth <= el.clientWidth + 1),
      'Mobile book cards must not overflow their grid'
    );
    console.log(
      `${engine}: ${theme}, search book card row height and covers: passed`
    );
    await page.close();
    for (const mobile of [true, false]) {
      for (const reducedMotion of ['no-preference', 'reduce']) {
        const page = await browser.newPage({
          viewport: mobile
            ? { width: 390, height: 844 }
            : { width: 1280, height: 900 },
          isMobile: mobile,
          hasTouch: mobile,
          reducedMotion,
        });
        const input = locator => (mobile ? locator.tap() : locator.click());
        await page.goto(
          `${base}/iframe.html?id=components-syndicated-search--filter-selection&viewMode=story&globals=${encodeURIComponent(`theme:${theme}`)}`
        );
        if (mobile)
          await input(
            page.getByRole('button', { name: 'Filters', exact: true })
          );
        const surface = page.locator(
          mobile ? '.mg-search__drawer' : '.mg-search__sidebar'
        );
        const region = surface.getByRole('button', {
          name: 'Region',
          exact: true,
        });
        await input(region);
        await input(page.getByRole('option', { name: 'Asia', exact: true }));
        assert.match(await region.textContent(), /Asia/);
        assert.equal(await region.getAttribute('aria-expanded'), 'false');

        const topics = surface.getByRole('button', {
          name: 'Topics',
          exact: true,
        });
        await input(topics);
        const search = page.getByRole('textbox', { name: 'Search Topics' });
        await search.fill('Topic 12');
        const option = page.getByRole('option', {
          name: 'Topic 12',
          exact: true,
        });
        await input(option);
        assert.equal(await option.getAttribute('aria-selected'), 'true');
        assert.equal(await topics.getAttribute('aria-expanded'), 'true');
        await input(option);
        assert.equal(await option.getAttribute('aria-selected'), 'false');
        // A real outside tap closes only the select; it must not activate
        // the drawer footer or underlying page control on the same gesture.
        if (mobile) {
          const footer = await surface
            .getByRole('button', { name: 'View results' })
            .boundingBox();
          await page.touchscreen.tap(
            footer.x + footer.width / 2,
            footer.y + footer.height / 2
          );
          assert.equal(await surface.isVisible(), true);
        } else {
          await page.mouse.click(1000, 500);
        }
        assert.equal(await topics.getAttribute('aria-expanded'), 'false');
        assert.equal(
          await topics.evaluate(el => el === document.activeElement),
          true
        );

        // Keyboard activation and selection continue to work in both layouts.
        await region.focus();
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        assert.match(await region.textContent(), /Africa/);
        if (mobile) {
          await input(surface.getByRole('button', { name: 'View results' }));
          assert.equal(await surface.count(), 0);
        }
        console.log(
          `${engine}: ${theme}, ${mobile ? 'touch drawer' : 'desktop mouse'}, ${reducedMotion}: passed`
        );
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}
