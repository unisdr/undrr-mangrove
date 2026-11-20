// Run against the local Storybook: node scripts/test-megamenu-keyboard-browser.mjs
// Desktop disclosure navigation from unisdr/undrr-mangrove#1499, checked with
// the real stylesheet and real Tab order. See "Design principles" in
// stories/Components/MegaMenu/MegaMenu.mdx.
import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
const baseUrl = process.env.STORYBOOK_URL || 'http://localhost:6006';
const storyUrl = story =>
  `${baseUrl}/iframe.html?id=components-navigation-megamenu--${story}&viewMode=story&globals=viewport:reset`;
const target = 'Words into Action Guidelines';
const nested = 'Risk Analysis Reports';

const focused = page =>
  page.evaluate(() => {
    const element = document.activeElement;
    return {
      text: element.textContent.trim(),
      visible: element.getClientRects().length > 0,
      inPanel: Boolean(element.closest('.mg-mega-content')),
      category: document
        .querySelector(
          '.mg-mega-topbar__item--active .mg-mega-content__section-list-link--active'
        )
        ?.textContent.trim(),
    };
  });

async function pressUntil(page, key, text, limit = 40) {
  let current = await focused(page);
  for (let step = 0; current.text !== text; step++) {
    assert(step < limit, `${key} reaches "${text}"`);
    await page.keyboard.press(key);
    current = await focused(page);
    assert(current.visible, `${key} focused hidden "${current.text}"`);
  }
  return current;
}

async function load(page, story) {
  await page.goto(storyUrl(story));
  const trigger = page.getByRole('button', { name: 'Knowledge Hub' });
  await trigger.waitFor();
  return trigger;
}

for (const engine of [chromium, webkit]) {
  // Safari, like WebKit here, skips links on Tab unless the visitor turns on
  // "Press Tab to highlight each item"; Option+Tab always includes them.
  const tab = engine === webkit ? 'Alt+Tab' : 'Tab';
  const browser = await engine.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  // Focus and hover never open a panel.
  let trigger = await load(page, 'progressive-mobile');
  await trigger.focus();
  await trigger.hover();
  await page.waitForTimeout(500);
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');

  // Enter opens; Tab alone reaches a nested destination of the chosen
  // category, passing later categories without switching destinations.
  await trigger.press('Enter');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  let reached = await pressUntil(page, tab, nested);
  assert(reached.inPanel, 'the destination is inside the panel');
  assert.equal(reached.category, 'Publications');

  // The #1499 task: choose Practical guidance, then Tab past the remaining
  // categories and its landing link to the guidelines.
  await pressUntil(page, `Shift+${tab}`, 'Practical guidance');
  await page.keyboard.press('Enter');
  await page.keyboard.press(tab);
  assert.equal((await focused(page)).text, 'Risk Information');
  await page.keyboard.press(tab);
  assert.equal((await focused(page)).text, 'Practical guidance');
  await page.keyboard.press(tab);
  reached = await focused(page);
  assert.equal(reached.text, target);
  assert.equal(reached.category, 'Practical guidance');

  // Shift+Tab walks back to the trigger through visible entries only.
  await pressUntil(page, `Shift+${tab}`, 'Knowledge Hub');

  // Enter on another category shows its destinations, led by its page.
  await page.getByRole('button', { name: 'Risk Information' }).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press(tab);
  assert.equal((await focused(page)).text, 'Risk Information');
  await page.keyboard.press(tab);
  assert.equal((await focused(page)).text, 'PreventionWeb');

  // Arrow shortcuts land only on visible entries.
  await pressUntil(page, 'ArrowUp', 'Risk Information', 5);
  await page.keyboard.press('End');
  assert.equal((await focused(page)).text, 'Sendai Framework Monitor');

  // Escape closes and returns focus; Enter reopens.
  await page.keyboard.press('Escape');
  assert(
    await trigger.evaluate(element => element === document.activeElement),
    'Escape returns focus to the trigger'
  );
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
  await trigger.press('Enter');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');

  // Focus moving out of the navigation closes the panel.
  await page.getByRole('link', { name: 'Explore resources' }).focus();
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');

  // Pointer: click toggles, and moving away leaves the panel open.
  await trigger.click();
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  await page.mouse.move(700, 880);
  await page.waitForTimeout(500);
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  await trigger.click();
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');

  // A section with a landing page is a button; its page is in the panel.
  const about = page.getByRole('button', { name: 'About Us' });
  await about.click();
  assert.equal(
    await page
      .locator('.mg-mega-topbar__item--active .mg-mega-content')
      .getByRole('link', { name: 'Learn More About Us' })
      .getAttribute('href'),
    '/about'
  );
  await about.click();

  // A banner-only section opens with Enter and Tab enters it.
  const promo = page.getByRole('button', { name: 'Promo box' });
  await promo.focus();
  await promo.press('Enter');
  assert.equal(await promo.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press(tab);
  assert((await focused(page)).inPanel, 'Tab enters the banner-only panel');

  // The trial's path: pointer navigation, browser Back, pointer use of
  // another section, then the keyboard. Enter opens, Tab enters the panel
  // rather than returning to the header, and ArrowDown on the trigger opens
  // the panel instead of scrolling the page.
  trigger = await load(page, 'progressive-mobile');
  await trigger.click();
  await page
    .locator('.mg-mega-topbar__item--active .mg-mega-content__menu--desktop')
    .getByRole('link', { name: 'Policy Briefs' })
    .click();
  await page.waitForURL(url => !url.href.includes('iframe.html'));
  await page.goBack();
  trigger = page.getByRole('button', { name: 'Knowledge Hub' });
  await trigger.waitFor();
  await page.getByRole('button', { name: 'About Us' }).click();
  await page.getByRole('button', { name: 'About Us' }).click();
  await trigger.focus();
  await trigger.press('Enter');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press(tab);
  assert((await focused(page)).inPanel, 'Tab after Back enters the panel');
  await trigger.focus();
  await trigger.press('Enter');
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await trigger.press('ArrowDown');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  assert((await focused(page)).inPanel, 'ArrowDown moves into the panel');
  assert.equal(
    await page.evaluate(() => window.scrollY),
    scrollBefore,
    'ArrowDown on the trigger does not scroll the page'
  );

  // Category buttons keep the full column width of the former links.
  trigger = await load(page, 'progressive-mobile');
  await trigger.click();
  const widths = await page.evaluate(() => {
    const button = document.querySelector(
      '.mg-mega-topbar__item--active .mg-mega-content__section-list-link'
    );
    const list = button.closest('.mg-mega-content__section-list');
    return {
      button: button.getBoundingClientRect().width,
      list: list.getBoundingClientRect().width,
    };
  });
  assert(
    widths.button >= widths.list - 1,
    `category spans its column (${widths.button} of ${widths.list})`
  );

  // RTL: the bar arrows follow reading direction.
  trigger = await load(page, 'rtl');
  await trigger.focus();
  await page.keyboard.press('ArrowLeft');
  assert.equal((await focused(page)).text, 'About Us');

  await browser.close();
  console.log(`${engine.name()}: mega menu desktop disclosure paths pass`);
}
