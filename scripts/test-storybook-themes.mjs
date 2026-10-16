/** Theme loading, source-chunk and race checks against the production Storybook. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.env.THEME_STORYBOOK_URL || 'http://127.0.0.1:6099';
const themes = [
  ['Global UNDRR Theme', 'rgb(0, 79, 145)'],
  ['PreventionWeb Theme', 'rgb(10, 105, 105)'],
  ['IRP Theme', 'rgb(15, 120, 191)'],
  ['MCR2030 Theme', 'rgb(89, 26, 97)'],
  ['DELTA Resilience Theme', 'rgb(0, 79, 145)'],
];
const browser = await chromium.launch({ headless: true });
const deadline = setTimeout(() => {
  console.error('Theme browser gate exceeded two minutes');
  browser.close().finally(() => process.exit(1));
}, 120_000);
const storyUrl = (id, globals) => {
  // Keep a preview deployment's path prefix when resolving iframe.html.
  const url = new URL('iframe.html', `${base.replace(/\/$/, '')}/`);
  url.searchParams.set('id', id);
  url.searchParams.set('viewMode', id.endsWith('--docs') ? 'docs' : 'story');
  if (globals) url.searchParams.set('globals', globals);
  return url.href;
};
const selectTheme = (page, theme) =>
  page.evaluate(name => {
    window.__STORYBOOK_ADDONS_CHANNEL__.emit('updateGlobals', {
      globals: { theme: name },
    });
  }, theme);
const expectTheme = async (page, theme, color) => {
  await page.waitForFunction(
    ({ theme, color }) => {
      const styles = document.querySelectorAll('style[data-mangrove-theme]');
      const tag = document.querySelector('#storybook-root .mg-tag');
      return (
        styles.length === 1 &&
        styles[0].dataset.mangroveTheme === theme &&
        (!color || (tag && getComputedStyle(tag).backgroundColor === color))
      );
    },
    { theme, color }
  );
};
const holdIrpChunk = async page => {
  let release;
  let intercepted;
  const held = new Promise(resolve => {
    release = resolve;
  });
  const started = new Promise(resolve => {
    intercepted = resolve;
  });
  await page.route('**/style-irp-*.js', async route => {
    const response = await route.fetch();
    intercepted();
    await held;
    await route.fulfill({
      response,
      body: `${await response.text()}\n;globalThis.__mangroveDelayedThemeEvaluated = true;`,
    });
  });
  return { started, release };
};
try {
  const page = await browser.newPage();
  await page.goto(storyUrl('components-tag--default'));
  await expectTheme(page, ...themes[0]);
  const initialChunks = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map(entry => new URL(entry.name).pathname)
      .filter(name =>
        /\/style(?:-(?:preventionweb|irp|mcr|delta))?-[\w-]+\.js$/.test(name)
      )
  );
  assert.equal(
    initialChunks.length,
    1,
    'Initial preview must fetch only one theme chunk'
  );
  for (const [theme, color] of [...themes.slice(1), themes[0]]) {
    await selectTheme(page, theme);
    await expectTheme(page, theme, color);
  }
  await page.close();

  // Hold an earlier response until a later theme is already active.
  const racing = await browser.newPage();
  await racing.goto(storyUrl('components-tag--default'));
  await expectTheme(racing, ...themes[0]);
  const { started, release } = await holdIrpChunk(racing);
  try {
    await selectTheme(racing, themes[2][0]);
    await started;
    await selectTheme(racing, themes[3][0]);
    await expectTheme(racing, ...themes[3]);
    release();
    await racing.waitForFunction(
      () => globalThis.__mangroveDelayedThemeEvaluated
    );
    await expectTheme(racing, ...themes[3]);
  } finally {
    release();
    await racing.close();
  }

  // Drive the manager toolbar: a standalone docs iframe reloads using its
  // original URL globals, so emitting an update there is not a toolbar test.
  const docs = await browser.newPage();
  const managerUrl = new URL(`${base.replace(/\/$/, '')}/`);
  managerUrl.searchParams.set('path', '/docs/brand-brand-identity--docs');
  managerUrl.searchParams.set('globals', 'theme:PreventionWeb Theme');
  await docs.goto(managerUrl.href);
  const frame = await (
    await docs.locator('#storybook-preview-iframe').elementHandle()
  ).contentFrame();
  await frame.getByText('Brand identity', { exact: true }).first().waitFor();
  await expectTheme(frame, themes[1][0]);
  await docs
    .getByRole('button', { name: /Global theme for components/ })
    .click();
  await docs
    .getByRole('option', { name: 'MCR2030 Theme', exact: true })
    .click();
  await expectTheme(frame, themes[3][0]);
  await docs.close();

  // A failed chunk must surface an error while retaining the last usable CSS.
  const failing = await browser.newPage();
  await failing.goto(storyUrl('components-tag--default'));
  await expectTheme(failing, ...themes[0]);
  const earlier = await holdIrpChunk(failing);
  await failing.route('**/style-delta-*.js', route => route.abort());
  try {
    await selectTheme(failing, themes[2][0]);
    await earlier.started;
    const reported = failing.waitForEvent('console', message =>
      message.text().includes('Theme loading failed')
    );
    await selectTheme(failing, themes[4][0]);
    await reported;
    await expectTheme(failing, themes[0][0]);
    earlier.release();
    await failing.waitForFunction(
      () => globalThis.__mangroveDelayedThemeEvaluated
    );
    await expectTheme(failing, themes[0][0]);
    await selectTheme(failing, themes[3][0]);
    await expectTheme(failing, ...themes[3]);
  } finally {
    earlier.release();
    await failing.close();
  }
  console.log(
    'Theme gate passed: lazy first load, five themes, rapid selection, failed chunk recovery and docs-only toolbar updates.'
  );
} finally {
  clearTimeout(deadline);
  await browser.close();
}
