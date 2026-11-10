/** Sticky Tab geometry, CMS enhancement and lifecycle gate against built CSS. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.env.TABS_STORYBOOK_URL || 'http://127.0.0.1:6099';
const themes = [
  'Global UNDRR Theme',
  'PreventionWeb Theme',
  'IRP Theme',
  'MCR2030 Theme',
  'DELTA Resilience Theme',
];
const browser = await chromium.launch();
const deadline = setTimeout(() => {
  console.error('Sticky Tab browser gate exceeded three minutes');
  browser.close().finally(() => process.exit(1));
}, 180_000);
const rootSelector = '.mg-tabs-sticky-example__tabs > .mg-tabs';

async function open(page, { theme = themes[0], rtl = false, args } = {}) {
  const url = new URL('/iframe.html', base);
  url.searchParams.set('id', 'components-tabs--sticky-within-section');
  url.searchParams.set('viewMode', 'story');
  url.searchParams.set(
    'globals',
    `theme:${theme};locale:${rtl ? 'arabic' : 'english'}`
  );
  if (args) url.searchParams.set('args', args);
  await page.goto(url.href);
  await page.locator(`${rootSelector}[data-mg-tabs-initialized]`).waitFor();
  await page.evaluate(() => document.fonts.ready);
}

async function scrollIntoPanel(page) {
  await page.locator(rootSelector).evaluate(root => {
    window.scrollTo({
      top: root.getBoundingClientRect().top + scrollY + 180,
      behavior: 'instant',
    });
  });
  await page.waitForFunction(selector => {
    const root = document.querySelector(selector);
    const rail = root.querySelector('.mg-tabs__rail');
    return (
      Math.abs(
        rail.getBoundingClientRect().top -
          parseFloat(getComputedStyle(rail).top)
      ) < 1
    );
  }, rootSelector);
}

try {
  for (const theme of themes) {
    for (const rtl of [false, true]) {
      const page = await browser.newPage({
        viewport: { width: rtl ? 390 : 1280, height: rtl ? 844 : 900 },
      });
      await open(page, { theme, rtl });
      await scrollIntoPanel(page);
      const geometry = await page.locator(rootSelector).evaluate(root => {
        const rail = root.querySelector('.mg-tabs__rail');
        return {
          railTop: rail.getBoundingClientRect().top,
          navBottom: document.querySelector('nav').getBoundingClientRect()
            .bottom,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          measured: parseFloat(
            root.style.getPropertyValue('--mg-tab-sticky-rail-size')
          ),
          height: rail.getBoundingClientRect().height,
        };
      });
      assert.ok(
        geometry.railTop >= geometry.navBottom,
        `${theme}: nav overlap`
      );
      assert.ok(geometry.railTop - geometry.navBottom < 16);
      assert.equal(geometry.overflow, false);
      assert.ok(Math.abs(geometry.measured - geometry.height) <= 1);
      const tabs = page.locator(`${rootSelector} [role=tab]`);
      await tabs.first().focus();
      await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight');
      assert.equal(await tabs.nth(1).getAttribute('aria-selected'), 'true');
      assert.equal(
        await tabs.nth(1).evaluate(tab => tab === document.activeElement),
        true
      );

      // Native focus/anchor scrolling must keep content below both sticky layers.
      await page
        .locator(`${rootSelector} [role=tabpanel]:not([hidden])`)
        .evaluate(panel => {
          const button = document.createElement('button');
          button.id = 'sticky-focus-target';
          button.textContent = 'Focus target';
          button.style.marginBlockStart = '600px';
          panel.append(button);
          button.focus();
          button.scrollIntoView({ block: 'start', behavior: 'instant' });
        });
      const clear = await page.evaluate(() => ({
        target: document
          .querySelector('#sticky-focus-target')
          .getBoundingClientRect().top,
        rail: document.querySelector('.mg-tabs__rail').getBoundingClientRect()
          .bottom,
      }));
      assert.ok(
        clear.target >= clear.rail - 1,
        `${theme}: obscured focus target`
      );
      await page.locator('#sticky-example-after').evaluate(after => {
        window.scrollTo({
          top: after.getBoundingClientRect().top + scrollY + 150,
          behavior: 'instant',
        });
      });
      assert.ok(
        await page.evaluate(
          () =>
            document.querySelector('.mg-tabs__rail').getBoundingClientRect()
              .bottom <=
            document
              .querySelector('#sticky-example-after')
              .getBoundingClientRect().top +
              1
        )
      );
      await page.close();
    }
  }

  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  await open(page);
  await page.locator(rootSelector).evaluate(root => {
    root.style.setProperty('--mg-tab-sticky-offset', '112px');
    root.style.setProperty('--mg-tab-sticky-background', 'rgb(230, 240, 245)');
  });
  await scrollIntoPanel(page);
  assert.deepEqual(
    await page.locator(`${rootSelector} > .mg-tabs__rail`).evaluate(rail => ({
      top: Math.round(rail.getBoundingClientRect().top),
      background: getComputedStyle(rail).backgroundColor,
    })),
    { top: 112, background: 'rgb(230, 240, 245)' }
  );
  await page.setViewportSize({ width: 844, height: 390 });
  assert.equal(
    await page
      .locator(`${rootSelector} > .mg-tabs__rail`)
      .evaluate(rail => getComputedStyle(rail).position),
    'relative'
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, { args: 'stackOnMobile:!true' });
  assert.ok(
    await page
      .locator(rootSelector)
      .evaluate(root => root.classList.contains('mg-tabs--stacked'))
  );
  assert.equal(
    await page.locator(`${rootSelector} > .mg-tabs__rail`).isVisible(),
    false
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForFunction(
    selector =>
      document
        .querySelector(selector)
        .classList.contains('mg-tabs--horizontal'),
    rootSelector
  );
  await scrollIntoPanel(page);
  await open(page, { args: 'sticky:!false' });
  assert.equal(
    await page
      .locator(`${rootSelector} > .mg-tabs__rail`)
      .evaluate(rail => getComputedStyle(rail).position),
    'relative'
  );

  // Canonical HTML remains readable before enhancement; legacy CMS markup also
  // receives the variant and must regain authored inline state after destroy.
  const css = new URL('/css/style.css', base).href;
  const fixture = `<article class="mg-tabs mg-tabs--horizontal mg-tabs--sticky" data-mg-js-tabs style="--mg-tab-sticky-rail-size:13px!important">
    <ul class="mg-tabs__list">
      <li class="mg-tabs__item"><a class="mg-tabs__link" href="#cms-first">First</a></li>
      <li class="mg-tabs-content"><section class="mg-tabs__section" id="cms-first">First content</section></li>
      <li class="mg-tabs__item"><a class="mg-tabs__link" href="#cms-second">Second</a></li>
      <li class="mg-tabs-content"><section class="mg-tabs__section" id="cms-second">Second content</section></li>
    </ul></article>`;
  await page.setContent(`<link rel="stylesheet" href="${css}">${fixture}`);
  assert.equal(await page.locator('.mg-tabs__section:visible').count(), 2);
  await page.evaluate(async () => {
    window.stickyTestRuntime = await import('/js/tabs.js');
    window.stickyTestRuntime.mgTabsRuntime(
      document.querySelector('.mg-tabs'),
      false
    );
  });
  assert.equal(await page.locator('[role=tab]').count(), 2);
  assert.equal(
    await page
      .locator('.mg-tabs__rail')
      .evaluate(rail => getComputedStyle(rail).position),
    'sticky'
  );
  await page.evaluate(() =>
    window.stickyTestRuntime.mgTabsDestroy(document.querySelector('.mg-tabs'))
  );
  assert.deepEqual(
    await page.locator('.mg-tabs').evaluate(root => ({
      value: root.style.getPropertyValue('--mg-tab-sticky-rail-size'),
      priority: root.style.getPropertyPriority('--mg-tab-sticky-rail-size'),
    })),
    { value: '13px', priority: 'important' }
  );
  assert.equal(await page.locator('.mg-tabs__section:visible').count(), 2);
  await page.close();
  console.log(
    'Sticky Tab gate passed: five themes, LTR/RTL, desktop/mobile, focus/anchors, section release, offset/surface overrides, short viewport, responsive stacking, opt-out and CMS lifecycle.'
  );
} finally {
  clearTimeout(deadline);
  await browser.close();
}
