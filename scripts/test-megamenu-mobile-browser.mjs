// Run against the local Storybook: node scripts/test-megamenu-mobile-browser.mjs
import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
const baseUrl = process.env.STORYBOOK_URL || 'http://localhost:6006';
const themes = [
  'Global UNDRR Theme',
  'PreventionWeb Theme',
  'IRP Theme',
  'MCR2030 Theme',
  'DELTA Resilience Theme',
];
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  for (const theme of themes)
    for (const direction of ['ltr', 'rtl'])
      for (const story of ['default', 'with-logo']) {
        await page.goto(
          `${baseUrl}/iframe.html?id=components-navigation-megamenu--${story}&viewMode=story&globals=theme:${encodeURIComponent(theme)}`
        );
        const button = page.getByRole('button', {
          name: 'Open navigation menu',
        });
        await button.waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page
          .locator('.mg-mega-topbar__logo-img')
          .evaluateAll(images =>
            Promise.all(images.map(image => image.decode().catch(() => {})))
          );
        await page.locator('html').evaluate((element, direction) => {
          element.dir = direction;
        }, direction);
        const firstLabel = page.locator('.mg-mega-topbar__item-link').first();
        await firstLabel.focus();
        await firstLabel.press(
          direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
        );
        assert(
          await page
            .locator('.mg-mega-topbar__item-link')
            .nth(1)
            .evaluate(element => element === document.activeElement),
          'arrow follows visual reading direction'
        );
        await page.locator('.mg-mega-topbar__nav').evaluate(element => {
          element.scrollLeft = 0;
        });
        // Real mouse gestures must scroll without activating the pressed label.
        const railBox = await page
          .locator('.mg-mega-topbar__nav')
          .boundingBox();
        const startX =
          direction === 'rtl' ? railBox.x + 12 : railBox.x + railBox.width - 12;
        const endX = startX + (direction === 'rtl' ? 70 : -70);
        // Leaving before the threshold must not retain a gesture after an
        // outside release, or capture a later drag that starts outside.
        const railY = railBox.y + railBox.height / 2;
        const outsideY = railBox.y + railBox.height + 25;
        await page.mouse.move(startX, railY);
        await page.mouse.down();
        await page.mouse.move(startX, outsideY);
        await page.mouse.up();
        await page.mouse.down();
        await page.mouse.move(endX, railY, { steps: 8 });
        await page.mouse.up();
        assert(
          await page
            .locator('.mg-mega-topbar__nav')
            .evaluate(element => element.scrollLeft === 0),
          'outside-origin drag must not scroll the rail'
        );
        await page.mouse.move(startX, railBox.y + railBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(endX, railBox.y + railBox.height / 2, {
          steps: 8,
        });
        await page.mouse.move(endX, railBox.y + railBox.height + 25);
        await page.mouse.up();
        assert(
          await page
            .locator('.mg-mega-topbar__nav')
            .evaluate(element => Math.abs(element.scrollLeft) > 20),
          'mouse drag scrolls the rail'
        );
        assert.equal(
          await page.getByRole('dialog').isVisible(),
          false,
          'drag does not open a section'
        );
        const before = await button.boundingBox();
        const rail = page.locator('.mg-mega-topbar__nav');
        const nav = await page.locator('.mg-mega-topbar').boundingBox();
        assert(
          before.y >= nav.y &&
            before.y + before.height <= nav.y + nav.height + 1,
          `button cropped ${JSON.stringify(before)}`
        );
        assert(before.height >= 44);
        await rail.evaluate((e, direction) => {
          e.scrollLeft = direction === 'rtl' ? -200 : 200;
        }, direction);
        const after = await button.boundingBox();
        assert(
          Math.abs(after.x - before.x) < 1,
          `hamburger moved: ${before.x} -> ${after.x}`
        );
        assert(
          (await rail.evaluate(e => Math.abs(e.scrollLeft))) > 0,
          'rail must scroll'
        );
        const item = page.locator('.mg-mega-topbar__item-link').nth(2);
        await item.scrollIntoViewIfNeeded();
        const title = await item.innerText();
        await item.click();
        await page
          .getByRole('dialog')
          .getByRole('heading', { name: title, exact: true })
          .waitFor();
        await page
          .getByRole('dialog')
          .getByRole('button', { name: 'Back', exact: true })
          .tap();
        await page
          .getByRole('dialog')
          .getByRole('heading', { name: 'All sections' })
          .waitFor();
        await page
          .getByRole('dialog')
          .getByRole('button', { name: 'Close mobile navigation' })
          .tap();
        assert(
          await item.evaluate(element => element === document.activeElement),
          'Close restores the section opener'
        );
        await item.tap();
        await page
          .getByRole('dialog')
          .getByRole('heading', { name: title, exact: true })
          .waitFor();
        await page
          .getByRole('dialog')
          .getByRole('button', { name: 'Close mobile navigation' })
          .tap();
        await button.tap();
        await page
          .getByRole('dialog')
          .getByRole('heading', { name: 'All sections' })
          .waitFor();
        await page
          .getByRole('dialog')
          .getByRole('button', { name: 'Close mobile navigation' })
          .tap();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        console.log(engine.name(), theme, direction, story, 'passed');
      }
  for (const width of [320, 768, 899]) {
    await page.setViewportSize({ width, height: 844 });
    for (const story of ['default', 'with-logo']) {
      await page.goto(
        `${baseUrl}/iframe.html?id=components-navigation-megamenu--${story}&viewMode=story`
      );
      const button = page.getByRole('button', { name: 'Open navigation menu' });
      await button.waitFor();
      const nav = await page.locator('.mg-mega-topbar').boundingBox();
      const target = await button.boundingBox();
      assert(
        target.y >= nav.y && target.y + target.height <= nav.y + nav.height + 1
      );
      await page.addStyleTag({
        content: '.mg-mega-topbar__item-link { padding-block: 24px; }',
      });
      const expandedNav = await page.locator('.mg-mega-topbar').boundingBox();
      const expandedTarget = await button.boundingBox();
      assert(
        expandedTarget.y >= expandedNav.y &&
          expandedTarget.y + expandedTarget.height <=
            expandedNav.y + expandedNav.height + 1
      );
      console.log(engine.name(), width, story, 'themed padding passed');
    }
  }
  for (const width of [900, 901, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(
      `${baseUrl}/iframe.html?id=components-navigation-megamenu--default&viewMode=story`
    );
    await page.locator('.mg-mega-topbar__item-link').first().waitFor();
    assert.equal(
      await page
        .getByRole('button', { name: 'Open navigation menu' })
        .isVisible(),
      false
    );
    await page.locator('.mg-mega-topbar__item-link').first().press('ArrowDown');
    const panel = page.locator('.mg-mega-content__left').first();
    await panel.waitFor({ state: 'visible' });
    const panelBox = await panel.boundingBox();
    const headerBox = await page.locator('.mg-mega-topbar').boundingBox();
    assert(
      panelBox.y >= headerBox.y + headerBox.height - 1,
      'desktop panel stays below the header'
    );
    assert(
      await page
        .locator('.mg-mega-topbar__nav')
        .evaluate(element => element.scrollTop === 0),
      'desktop rail must not scroll vertically'
    );
    console.log(engine.name(), width, 'desktop passed');
  }
  await browser.close();
}
