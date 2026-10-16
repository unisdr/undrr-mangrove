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
