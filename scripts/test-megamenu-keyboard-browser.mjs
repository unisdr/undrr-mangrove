// Run against the local Storybook: node scripts/test-megamenu-keyboard-browser.mjs
// Desktop keyboard paths from unisdr/undrr-mangrove#1499, checked with the
// real stylesheet so CSS-hidden destination lists count as hidden.
import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
const baseUrl = process.env.STORYBOOK_URL || 'http://localhost:6006';
const storyUrl = `${baseUrl}/iframe.html?id=components-navigation-megamenu--progressive-mobile&viewMode=story&globals=viewport:reset`;
const target = 'Words into Action Guidelines';

const focused = page =>
  page.evaluate(() => {
    const element = document.activeElement;
    return {
      text: element.textContent.trim(),
      visible: element.getClientRects().length > 0,
      inPanel: Boolean(element.closest('.mg-mega-content')),
    };
  });

for (const engine of [chromium, webkit]) {
  const browser = await engine.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await page.goto(storyUrl);
  const trigger = page.getByRole('button', { name: 'Knowledge Hub' });
  await trigger.waitFor();
  const panel = page.getByRole('region', { name: 'Knowledge Hub' });

  // Enter opens without waiting for the hover delay, and toggles.
  await trigger.focus();
  await trigger.press('Enter');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  await trigger.press('Enter');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');

  // Escape returns focus to the trigger; Enter then reopens the panel.
  await trigger.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  assert(
    await trigger.evaluate(element => element === document.activeElement),
    'Escape returns focus to the trigger'
  );
  await trigger.press('Enter');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Tab');
  assert((await focused(page)).inPanel, 'Tab after Enter enters the panel');

  // Arrow keys reach the first category, cross right, then reach a nested
  // destination, landing only on visible elements throughout.
  let current = await focused(page);
  for (let step = 0; current.text !== 'Publications'; step++) {
    assert(step < 10, 'ArrowDown reaches the Publications category');
    await page.keyboard.press('ArrowDown');
    current = await focused(page);
    assert(current.visible, `ArrowDown focused hidden "${current.text}"`);
  }
  await page.keyboard.press('ArrowRight');
  current = await focused(page);
  assert.equal(current.text, 'Global Assessment Report');
  assert(current.visible, 'ArrowRight lands on a visible destination');
  for (let step = 0; current.text !== target; step++) {
    assert(step < 10, `ArrowDown reaches ${target}`);
    await page.keyboard.press('ArrowDown');
    current = await focused(page);
    assert(current.visible, `ArrowDown focused hidden "${current.text}"`);
  }
  assert.equal(
    await page.evaluate(
      () =>
        document.querySelector('.mg-mega-content__section-list-link--active')
          .textContent
    ),
    'Publications',
    'the destination column still belongs to Publications'
  );
  await page.keyboard.press('ArrowLeft');
  assert.equal((await focused(page)).text, 'Publications');

  // Arrow keys inside the panel never scroll the page.
  assert.equal(await page.evaluate(() => window.scrollY), 0);
  assert(await panel.isVisible());

  await browser.close();
  console.log(`${engine.name()}: mega menu desktop keyboard paths pass`);
}
