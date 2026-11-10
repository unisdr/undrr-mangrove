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
      // Browser focus scrolls only when needed. An intrinsic focus target can
      // already be below the page nav but still be obscured by the sticky rail.
      // Do not give these targets ids/tabindex or call scrollIntoView: either
      // would conceal a missing focus-selector case.
      for (const kind of ['summary', 'contenteditable']) {
        await page
          .locator(`${rootSelector} [role=tabpanel]:not([hidden])`)
          .evaluate((panel, kind) => {
            const wrapper = document.createElement('div');
            wrapper.style.cssText =
              'margin-block-start:600px;margin-block-end:600px';
            let target;
            if (kind === 'summary') {
              const details = document.createElement('details');
              target = document.createElement('summary');
              details.append(target);
              wrapper.append(details);
            } else {
              target = document.createElement('div');
              target.contentEditable = 'true';
              wrapper.append(target);
            }
            target.dataset.stickyFocusTarget = kind;
            target.textContent = 'Intrinsic focus target';
            const after = document.createElement('button');
            after.textContent = 'Following control';
            after.style.marginBlockStart = '600px';
            wrapper.append(after);
            panel.append(wrapper);
            after.focus({ preventScroll: true });
            const rail = panel
              .closest('.mg-tabs')
              .querySelector('.mg-tabs__rail');
            const hiddenTop = rail.getBoundingClientRect().top + 8;
            window.scrollTo({
              top: target.getBoundingClientRect().top + scrollY - hiddenTop,
              behavior: 'instant',
            });
          }, kind);
        await page.keyboard.press('Shift+Tab');
        const focus = await page.evaluate(kind => {
          const target = document.querySelector(
            `[data-sticky-focus-target="${kind}"]`
          );
          return {
            active: document.activeElement === target,
            top: target.getBoundingClientRect().top,
            railBottom: document
              .querySelector('.mg-tabs__rail')
              .getBoundingClientRect().bottom,
          };
        }, kind);
        assert.equal(focus.active, true, `${theme}: ${kind} receives focus`);
        assert.ok(
          focus.top >= focus.railBottom - 1,
          `${theme}: obscured native ${kind} focus target`
        );
      }
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
  // Selecting a short panel can move its focused sticky trigger above the
  // viewport or underneath the site header. Recover that control only when
  // needed; selecting a visible long panel must preserve the scroll position.
  for (const [depth, keyboard] of [
    [90, false],
    [600, true],
  ]) {
    await open(page);
    await page.locator(rootSelector).evaluate((root, depth) => {
      const panels = root.querySelectorAll('[role=tabpanel]');
      panels[0].innerHTML = '<p>Long panel.</p>'.repeat(60);
      panels[1].innerHTML = '<p>Short panel.</p>';
      root.querySelector('[role=tab]').click();
      window.scrollTo({
        top: root.getBoundingClientRect().top + scrollY + depth,
        behavior: 'instant',
      });
    }, depth);
    const tabs = page.locator(`${rootSelector} [role=tab]`);
    const stable = await page.evaluate(() => scrollY);
    await tabs.first().click();
    assert.equal(await page.evaluate(() => scrollY), stable);
    if (keyboard) await page.keyboard.press('ArrowRight');
    else await tabs.nth(1).click();
    const selected = await tabs.nth(1).evaluate(tab => ({
      focused: tab === document.activeElement,
      top: tab.getBoundingClientRect().top,
      bottom: tab.getBoundingClientRect().bottom,
      navBottom: document.querySelector('nav').getBoundingClientRect().bottom,
      dock: parseFloat(getComputedStyle(tab.closest('.mg-tabs__rail')).top),
    }));
    assert.equal(selected.focused, true);
    assert.ok(selected.top >= Math.max(selected.navBottom, selected.dock) - 1);
    assert.ok(selected.bottom <= 900);
  }

  // The same recovery must scroll the component's actual scroll container,
  // without jumping an already valid outer document position.
  await open(page);
  await page.locator(rootSelector).evaluate(root => {
    const host = root.parentElement;
    host.style.cssText = 'height:500px;overflow-y:auto';
    root.style.setProperty('--mg-tab-sticky-offset', '0px');
    const panels = root.querySelectorAll('[role=tabpanel]');
    panels[0].innerHTML = '<p>Long panel.</p>'.repeat(60);
    panels[1].innerHTML = '<p>Short panel.</p>';
    const tail = document.createElement('div');
    tail.style.height = '1000px';
    host.append(tail);
    root.querySelector('[role=tab]').click();
    window.scrollTo({
      top: host.getBoundingClientRect().top + scrollY - 150,
      behavior: 'instant',
    });
    host.scrollTop = 600;
  });
  const outerScroll = await page.evaluate(() => scrollY);
  await page.locator(`${rootSelector} [role=tab]`).nth(1).click();
  const innerRecovery = await page.locator(rootSelector).evaluate(root => ({
    scroll: root.parentElement.scrollTop,
    top: document.activeElement.getBoundingClientRect().top,
    hostTop: root.parentElement.getBoundingClientRect().top,
    outer: scrollY,
  }));
  assert.ok(innerRecovery.scroll < 600);
  assert.ok(innerRecovery.top >= innerRecovery.hostTop - 1);
  assert.equal(innerRecovery.outer, outerScroll);

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
    'Sticky Tab gate passed: five themes, LTR/RTL, desktop/mobile, native keyboard focus/anchors, long-to-short recovery, nested scroll container, section release, offset/surface overrides, short viewport, responsive stacking, opt-out and CMS lifecycle.'
  );
} finally {
  clearTimeout(deadline);
  await browser.close();
}
