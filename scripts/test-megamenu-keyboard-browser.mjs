// Run against the local Storybook: node scripts/test-megamenu-keyboard-browser.mjs
// Desktop keyboard paths from unisdr/undrr-mangrove#1499, checked with the
// real stylesheet so CSS-hidden destination lists count as hidden.
import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
const baseUrl = process.env.STORYBOOK_URL || 'http://localhost:6006';
const storyUrl = story =>
  `${baseUrl}/iframe.html?id=components-navigation-megamenu--${story}&viewMode=story&globals=viewport:reset`;
const target = 'Words into Action Guidelines';
// Longer than the default 180 ms hover delay, so focus has opened the panel.
const pause = 400;

const focused = page =>
  page.evaluate(() => {
    const element = document.activeElement;
    return {
      text: element.textContent.trim(),
      visible: element.getClientRects().length > 0,
      inPanel: Boolean(element.closest('.mg-mega-content')),
      column: element.classList.contains('mg-mega-content__right'),
    };
  });

async function pressUntil(page, key, text, limit = 12) {
  let current = await focused(page);
  for (let step = 0; current.text !== text; step++) {
    assert(step < limit, `${key} reaches "${text}"`);
    await page.keyboard.press(key);
    current = await focused(page);
    assert(current.visible, `${key} focused hidden "${current.text}"`);
  }
  return current;
}

async function open(page, story) {
  await page.goto(storyUrl(story));
  const trigger = page.getByRole('button', { name: 'Knowledge Hub' });
  await trigger.waitFor();
  return trigger;
}

for (const engine of [chromium, webkit]) {
  const browser = await engine.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  // Enter straight after focus opens the panel, and a second Enter closes it.
  let trigger = await open(page, 'progressive-mobile');
  await trigger.focus();
  await trigger.press('Enter');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  await trigger.press('Enter');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');

  // Pausing lets focus open the panel first; Enter must keep it open so
  // Tab enters it rather than skipping to the next top-bar item.
  trigger = await open(page, 'progressive-mobile');
  await trigger.focus();
  await page.waitForTimeout(pause);
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  await trigger.press('Enter');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Tab');
  assert((await focused(page)).inPanel, 'Tab after a paused Enter enters');

  // Escape returns focus to the trigger; Enter then reopens the panel.
  await page.keyboard.press('Escape');
  assert(
    await trigger.evaluate(element => element === document.activeElement),
    'Escape returns focus to the trigger'
  );
  await page.waitForTimeout(pause);
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
  await trigger.press('Enter');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Tab');
  assert((await focused(page)).inPanel, 'Tab after Enter enters the panel');

  // Arrow keys reach the first category, cross to its destinations, then
  // reach a nested destination, landing only on visible elements throughout.
  await pressUntil(page, 'ArrowDown', 'Publications');
  await page.keyboard.press('ArrowRight');
  assert.equal((await focused(page)).text, 'Global Assessment Report');
  await pressUntil(page, 'ArrowDown', target);
  // ArrowRight inside the destinations stays put.
  await page.keyboard.press('ArrowRight');
  assert.equal((await focused(page)).text, target);
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
  assert.equal(await page.evaluate(() => window.scrollY), 0);

  // From the focused destinations column, ArrowDown starts inside it.
  await page.locator('.mg-mega-content__right').first().focus();
  assert((await focused(page)).column);
  await page.keyboard.press('ArrowDown');
  assert.equal((await focused(page)).text, 'Global Assessment Report');

  // A banner-only section opens with Enter and announces its state.
  await page.mouse.move(700, 880);
  await page.keyboard.press('Escape');
  const promo = page.getByRole('button', { name: 'Promo box' });
  await promo.focus();
  await promo.press('Escape');
  await promo.press('Enter');
  assert.equal(await promo.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Tab');
  assert((await focused(page)).inPanel, 'Tab enters the banner-only panel');

  // In RTL the destinations sit to the left, so the keys swap.
  trigger = await open(page, 'rtl');
  await trigger.focus();
  await trigger.press('Enter');
  await page.keyboard.press('ArrowDown');
  await pressUntil(page, 'ArrowDown', 'Publications');
  await page.keyboard.press('ArrowRight');
  assert.equal((await focused(page)).text, 'Publications');
  await page.keyboard.press('ArrowLeft');
  assert.equal((await focused(page)).text, 'Global Assessment Report');
  await page.keyboard.press('ArrowRight');
  assert.equal((await focused(page)).text, 'Publications');

  await browser.close();
  console.log(`${engine.name()}: mega menu desktop keyboard paths pass`);
}
