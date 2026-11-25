/** Delta 2027 rendered contracts: actual components, keyboard and media states. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.env.DELTA_STORYBOOK_URL || 'http://127.0.0.1:6101';
const browser = await chromium.launch({ headless: true });
const deadline = setTimeout(() => {
  console.error('Delta 2027 browser checks exceeded two minutes');
  browser.close().finally(() => process.exit(1));
}, 120_000);
const url = new URL('iframe.html', `${base.replace(/\/$/, '')}/`);
url.searchParams.set('id', 'design-decisions-delta-2027--same-components');
url.searchParams.set('viewMode', 'story');
url.searchParams.set('globals', 'theme:Delta 2027 Theme');
const css = (locator, properties) =>
  locator.evaluate((element, names) => {
    const style = getComputedStyle(element);
    return Object.fromEntries(names.map(name => [name, style[name]]));
  }, properties);
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
  });
  const failedFonts = [];
  page.on('response', response => {
    if (/delta-2027.*\.woff2/.test(response.url()) && !response.ok())
      failedFonts.push([response.url(), response.status()]);
  });
  await page.goto(url.href);
  const field = page.getByLabel('Event name', { exact: true });
  await field.waitFor();
  await page.waitForFunction(() =>
    document.body.classList.contains('mg-theme-delta-2027')
  );
  await page.evaluate(() => document.fonts.ready);
  assert.equal(
    await page.evaluate(() => document.fonts.check('14px Inter')),
    true
  );
  for (const family of ['Inter', 'IBM Plex Mono']) {
    assert.equal(
      await page.evaluate(
        name =>
          [...document.fonts].some(
            font =>
              font.family.replaceAll('"', '').includes(name) &&
              font.status === 'loaded'
          ),
        family
      ),
      true,
      `${family} must be an actually loaded font face`
    );
  }
  assert.deepEqual(
    failedFonts,
    [],
    'Theme fonts must load from the built asset layout'
  );
  const fieldStyle = await css(field, [
    'height',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'fontFamily',
  ]);
  assert.equal(fieldStyle.height, '32px');
  assert.equal(fieldStyle.paddingTop, '0px');
  assert.equal(fieldStyle.paddingBottom, '0px');
  assert.equal(fieldStyle.paddingLeft, '12px');
  assert.match(fieldStyle.fontFamily, /Inter/);
  const select = page.getByLabel('Hazard', { exact: true });
  assert.equal((await css(select, ['paddingTop'])).paddingTop, '0px');
  await field.fill('Storm in Central Province');
  await select.selectOption('storm');
  assert.equal(await field.inputValue(), 'Storm in Central Province');
  assert.equal(await select.inputValue(), 'storm');

  const save = page.getByRole('button', { name: 'Save draft', exact: true });
  assert.equal((await css(save, ['height', 'backgroundColor'])).height, '32px');
  assert.equal(
    (await css(save, ['backgroundColor'])).backgroundColor,
    'rgb(45, 111, 163)'
  );
  const settleButton = () =>
    save.evaluate(async node => {
      getComputedStyle(node).backgroundColor;
      await Promise.all(
        node.getAnimations().map(animation => animation.finished)
      );
    });
  await save.hover();
  await settleButton();
  assert.equal(
    (await css(save, ['backgroundColor'])).backgroundColor,
    'rgb(36, 90, 133)'
  );
  await page.mouse.down();
  await settleButton();
  assert.equal(
    (await css(save, ['backgroundColor'])).backgroundColor,
    'rgb(26, 68, 100)'
  );
  await page.mouse.up();

  // Establish keyboard modality, then verify the field's real :focus-visible state.
  await page.keyboard.press('Tab');
  await field.focus();
  assert.equal(
    await field.evaluate(node => node.matches(':focus-visible')),
    true
  );
  assert.match((await css(field, ['boxShadow'])).boxShadow, /inset/);
  await page.keyboard.press('Tab');
  assert.equal(
    await select.evaluate(node => node === document.activeElement),
    true
  );
  await save.focus();
  await page.keyboard.press('Enter');
  assert.match(
    await page.getByRole('status').first().textContent(),
    /Draft saved/
  );

  assert.equal(
    (
      await css(page.getByLabel('Source URL', { exact: true }), [
        'borderTopColor',
      ])
    ).borderTopColor,
    'rgb(200, 53, 42)'
  );
  assert.equal(
    (await css(page.locator('.mg-form-error'), ['color'])).color,
    'rgb(200, 53, 42)'
  );
  const publish = page.getByRole('button', { name: 'Publish', exact: true });
  assert.equal(await publish.isDisabled(), true);
  assert.equal((await css(publish, ['opacity'])).opacity, '1');
  assert.equal(
    (await css(publish, ['backgroundColor'])).backgroundColor,
    'rgb(196, 202, 217)'
  );
  assert.equal(
    (await css(save, ['transitionDuration'])).transitionDuration
      .split(',')[0]
      .trim(),
    '0.1s'
  );
  assert.match(
    (await css(save, ['transitionTimingFunction'])).transitionTimingFunction,
    /cubic-bezier\(0.16, 1, 0.3, 1\)/
  );
  const impact = page.getByRole('tab', { name: 'Impact', exact: true });
  await impact.click();
  await page.keyboard.press('ArrowRight');
  assert.equal(
    await page
      .getByRole('tab', { name: 'Sources', exact: true })
      .getAttribute('aria-selected'),
    'true'
  );

  // Existing card variants consume these roles as ink, even though the names
  // can look like surfaces. Check rendered public HTML, not just token values.
  await page.evaluate(() => {
    const probe = document.createElement('section');
    probe.id = 'delta-contract-probes';
    probe.innerHTML =
      '<article class="mg-card mg-card--tertiary"><h2 class="mg-card__title">Title</h2><span class="mg-card__label">Event summary</span></article><ul class="mg-tree mg-tree--guides" role="tree"><li class="mg-tree__item" role="treeitem"><div class="mg-tree__label-container">Parent</div><ul class="mg-tree__group" role="group"><li class="mg-tree__item" role="treeitem"><div class="mg-tree__label-container">Child one</div></li><li class="mg-tree__item" role="treeitem"><div class="mg-tree__label-container">Child two</div></li></ul></li></ul><section lang="ar" id="arabic-probe"><p>مرحبا</p><section lang="en" id="latin-probe"><p>Latin island</p></section></section>';
    document.body.append(probe);
  });
  assert.equal(
    (
      await css(page.locator('#delta-contract-probes .mg-card__title'), [
        'color',
      ])
    ).color,
    'rgb(20, 20, 19)'
  );
  assert.equal(
    (
      await css(page.locator('#delta-contract-probes .mg-card__label'), [
        'color',
      ])
    ).color,
    'rgb(94, 93, 89)'
  );
  assert.match(
    (await css(page.locator('#arabic-probe p').first(), ['fontFamily']))
      .fontFamily,
    /Noto Sans Arabic/
  );
  assert.match(
    (await css(page.locator('#latin-probe p'), ['fontFamily'])).fontFamily,
    /Inter/
  );
  const treeGeometry = await page
    .locator('#delta-contract-probes .mg-tree__group')
    .evaluate(group => {
      const style = getComputedStyle(group);
      const rows = [...group.querySelectorAll('.mg-tree__label-container')].map(
        node => node.getBoundingClientRect()
      );
      return {
        indent:
          parseFloat(style.paddingInlineStart) +
          parseFloat(style.marginInlineStart) +
          parseFloat(style.borderInlineStartWidth),
        pitch: rows[1].top - rows[0].top,
      };
    });
  assert.equal(treeGeometry.indent, 16);
  assert.equal(treeGeometry.pitch, 32);

  // Changing token data or public adapter roles must change actual rendering.
  // Default screenshots alone cannot establish this authoring contract.
  const overrides = {
    '--mg-typography-weight-medium': '600',
    '--mg-typography-weight-regular': '500',
    '--mg-typography-line-height-tight': '2',
    '--mg-typography-size-body': '15px',
    '--mg-spacing-sm': '18px',
    '--mg-spacing-lg': '28px',
    '--mg-font-size-button': '22px',
    '--mg-padding-button': '1px 21px',
  };
  await page.evaluate(
    values =>
      Object.entries(values).forEach(([key, value]) =>
        document.body.style.setProperty(key, value)
      ),
    overrides
  );
  try {
    assert.deepEqual(
      await css(page.locator('.mg-delta-review__intro h1'), [
        'fontWeight',
        'lineHeight',
      ]),
      { fontWeight: '600', lineHeight: '40px' }
    );
    assert.deepEqual(
      await css(save, ['fontSize', 'fontWeight', 'paddingLeft']),
      { fontSize: '22px', fontWeight: '500', paddingLeft: '21px' }
    );
    assert.equal(
      (
        await css(page.locator('#delta-contract-probes .mg-card__title'), [
          'fontWeight',
        ])
      ).fontWeight,
      '600'
    );
    assert.equal(
      (await css(page.locator('.mg-status-label').first(), ['fontSize']))
        .fontSize,
      '15px'
    );
    assert.deepEqual(await css(select, ['paddingLeft', 'paddingRight']), {
      paddingLeft: '18px',
      paddingRight: '28px',
    });
  } finally {
    await page.evaluate(
      keys => keys.forEach(key => document.body.style.removeProperty(key)),
      Object.keys(overrides)
    );
  }
  await page.locator('#delta-contract-probes').evaluate(node => node.remove());

  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await field.focus();
  const forced = await css(field, ['outlineStyle', 'outlineWidth']);
  assert.equal(forced.outlineStyle, 'solid');
  assert.ok(
    parseFloat(forced.outlineWidth) >= 2,
    'Forced-colour focus must have a visible outline'
  );
  assert.equal(await field.isEditable(), true);
  assert.equal(
    await page.evaluate(
      () =>
        matchMedia('(forced-colors: active)').matches &&
        matchMedia('(prefers-reduced-motion: reduce)').matches
    ),
    true
  );
  await page.emulateMedia({
    forcedColors: 'none',
    reducedMotion: 'no-preference',
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() =>
    window.__STORYBOOK_ADDONS_CHANNEL__.emit('updateGlobals', {
      globals: { addonRtl: 'rtl' },
    })
  );
  await page.waitForFunction(() =>
    document.querySelector('.mg-form-select')?.matches(':dir(rtl)')
  );
  const selectRtl = await css(select, ['paddingLeft', 'paddingRight']);
  assert.equal(selectRtl.paddingLeft, '24px');
  assert.equal(selectRtl.paddingRight, '12px');
  const rtlTree = await page.evaluate(() => {
    const probe = document.createElement('section');
    probe.dir = 'rtl';
    probe.innerHTML =
      '<ul class="mg-tree mg-tree--guides" role="tree"><li class="mg-tree__item" role="treeitem"><div class="mg-tree__label-container">Parent</div><ul class="mg-tree__group" role="group"><li class="mg-tree__item" role="treeitem"><div class="mg-tree__label-container">Child one</div></li><li class="mg-tree__item" role="treeitem"><div class="mg-tree__label-container">Child two</div></li></ul></li></ul>';
    document.body.append(probe);
    const rows = [...probe.querySelectorAll('.mg-tree__label-container')].map(
      node => node.getBoundingClientRect()
    );
    const result = {
      indent: rows[0].right - rows[1].right,
      pitch: rows[2].top - rows[1].top,
    };
    probe.remove();
    return result;
  });
  assert.deepEqual(
    rtlTree,
    { indent: 16, pitch: 32 },
    'RTL Tree must not inherit the prose list inset'
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1
    ),
    true,
    'Mobile RTL review must not overflow horizontally'
  );
  const dialogPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  const dialogUrl = new URL(url.href);
  dialogUrl.searchParams.set('id', 'components-dialog--short-message');
  dialogUrl.searchParams.set('globals', 'theme:Delta 2027 Theme;addonRtl:rtl');
  await dialogPage.goto(dialogUrl.href);
  const dialogTrigger = dialogPage.locator('[data-mg-dialog-trigger]');
  await dialogTrigger.waitFor({ state: 'visible' });
  await dialogTrigger.click();
  const dialog = dialogPage.locator('dialog[open]');
  await dialog.waitFor();
  const dialogRect = await dialog.boundingBox();
  assert.equal(
    dialogRect.width,
    390,
    'Mobile dialog must fill the viewport width'
  );
  assert.equal(
    dialogRect.height,
    844,
    'Mobile dialog must fill the viewport height'
  );
  await dialogPage.keyboard.press('Escape');
  await dialogPage.waitForFunction(
    () => !document.querySelector('dialog[open]')
  );
  await dialogPage.close();

  console.log(
    'Delta 2027 passed: local fonts, 32px controls, field padding, hover/pressed/disabled states, keyboard focus, editing, tabs, card ink, token propagation, motion mapping, 16px/32px Tree geometry, Arabic/Latin routing, forced colours with reduced motion, mobile RTL and full-screen mobile Dialog.'
  );
} finally {
  clearTimeout(deadline);
  await browser.close();
}
