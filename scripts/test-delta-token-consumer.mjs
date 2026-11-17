/** Verify the standalone DTCG consumer and the source-regeneration demonstration. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.env.DELTA_TOKEN_CONSUMER_URL || 'http://127.0.0.1:6105';
const browser = await chromium.launch({ headless: true });
const deadline = setTimeout(() => {
  console.error('Standalone token consumer exceeded two minutes');
  browser.close().finally(() => process.exit(1));
}, 120_000);
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const requests = [];
  const failures = [];
  page.on('request', request => requests.push(request.url()));
  page.on('response', response => {
    if (!response.ok()) failures.push([response.url(), response.status()]);
  });
  page.on('pageerror', error => failures.push(error.message));
  await page.goto(base);
  await page.waitForFunction(() =>
    [...document.querySelectorAll('iframe')].every(
      frame => frame.contentDocument?.body?.dataset.ready === 'true'
    )
  );
  const baseline = page.frame({ name: 'baseline' });
  const edited = page.frame({ name: 'edited' });
  assert.ok(
    baseline && edited,
    'Both independent consumer documents must load'
  );
  const measure = frame =>
    frame.locator('button').evaluate(element => {
      const styles = getComputedStyle(element);
      return {
        weight: styles.fontWeight,
        padding: styles.paddingInlineStart,
        background: styles.backgroundColor,
      };
    });
  assert.deepEqual(await measure(baseline), {
    weight: '500',
    padding: '12px',
    background: 'rgb(45, 111, 163)',
  });
  assert.deepEqual(await measure(edited), {
    weight: '700',
    padding: '16px',
    background: 'rgb(124, 58, 237)',
  });
  await edited
    .getByLabel('Event name', { exact: true })
    .fill('Edited source, independent consumer');
  await edited.getByRole('button', { name: 'Save draft', exact: true }).click();
  assert.match(await edited.getByRole('status').textContent(), /Draft saved/);
  assert.equal(
    await baseline.getByLabel('Event name', { exact: true }).inputValue(),
    'Flooding in Central Province'
  );
  assert.equal(
    await page.evaluate(
      async () =>
        (await (await fetch('report.json')).json()).repositorySourcesUnchanged
    ),
    true
  );
  const editedDocument = await page.evaluate(
    async () => await (await fetch('edited.tokens.json')).json()
  );
  assert.equal(JSON.stringify(editedDocument).includes('$extensions'), false);
  assert.deepEqual(failures, []);
  assert.equal(
    requests.some(url =>
      /react|storybook|style-delta|style-all|mangrove\.css/i.test(
        new URL(url).pathname
      )
    ),
    false,
    'No React or Mangrove stylesheet may be loaded'
  );
  assert.equal(
    requests.some(url =>
      new URL(url).pathname.endsWith('/baseline.tokens.json')
    ),
    true
  );
  assert.equal(
    requests.some(url => new URL(url).pathname.endsWith('/edited.tokens.json')),
    true
  );
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1
    ),
    true
  );
  console.log(
    'Standalone consumer passed: complete JSON files only, independent alias resolution, source-generated colour/weight/spacing changes, native form interaction, isolated panes, no React/Mangrove stylesheet, unchanged canonical sources, and mobile reflow.'
  );
} finally {
  clearTimeout(deadline);
  await browser.close();
}
