/** Copy HTML from the production manager and check its rendered inline text. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.env.HTML_STORYBOOK_URL || 'http://127.0.0.1:6099';
const url = new URL(`${base.replace(/\/$/, '')}/`);
url.searchParams.set('path', '/story/patterns-rich-content--editorial');
url.searchParams.set('addonPanel', 'storybook/html/panel');
const browser = await chromium.launch({ headless: true });
const deadline = setTimeout(() => {
  console.error('HTML browser gate exceeded two minutes');
  browser.close().finally(() => process.exit(1));
}, 120_000);

try {
  const context = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  await page.goto(url.href);
  await page.getByRole('tab', { name: 'HTML', exact: true }).click();
  const panel = page.getByRole('tabpanel', { name: 'HTML', exact: true });
  await panel.getByText('risk_register', { exact: false }).first().waitFor();
  await panel.getByRole('button', { name: 'Copy', exact: true }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(copied.includes('<div'), 'Copy must supply HTML markup');

  const preview = page.frameLocator('#storybook-preview-iframe');
  const original = await preview
    .locator('.mg-content p')
    .filter({ has: preview.locator('strong') })
    .innerText();

  // Render the clipboard as a consumer would. Comparing visible text catches
  // whitespace introduced around inline tags, rather than just code layout.
  const pasted = await context.newPage();
  await pasted.setContent(copied);
  const paragraph = pasted.locator('.mg-content p').filter({
    has: pasted.locator('strong'),
  });
  assert.equal(
    await paragraph.innerText(),
    original,
    'Pasted HTML must preserve spaces and punctuation around strong/em/code'
  );
  assert.equal(
    await pasted.locator('.mg-content p').first().innerText(),
    await preview.locator('.mg-content p').first().innerText(),
    'Pasted HTML must preserve link punctuation'
  );
  console.log(
    'HTML gate passed: production panel clipboard preserves inline text and punctuation.'
  );
} finally {
  clearTimeout(deadline);
  await browser.close();
}
