/** Direction compatibility checks against the production manager and preview. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.env.DIRECTION_STORYBOOK_URL || 'http://127.0.0.1:6099';
const urlFor = (route, globals, iframe = false) => {
  const url = new URL(
    iframe ? 'iframe.html' : './',
    `${base.replace(/\/$/, '')}/`
  );
  url.searchParams.set(iframe ? 'id' : 'path', route);
  if (iframe) url.searchParams.set('viewMode', 'story');
  url.searchParams.set('globals', globals);
  return url.href;
};
const expectLanguage = async (frame, locale, lang, dir, canvas = true) => {
  try {
    await frame.waitForFunction(
      ({ locale, lang, dir, canvas }) => {
        const html = document.documentElement;
        const root = document.getElementById('storybook-root');
        return (
          html.lang === lang &&
          html.dir === dir &&
          window.UNDRR?.langCode === locale &&
          window.UNDRR?.dir === dir &&
          (!canvas || (root?.lang === lang && root?.dir === dir))
        );
      },
      { locale, lang, dir, canvas }
    );
  } catch (cause) {
    const actual = await frame.evaluate(() => ({
      url: location.href,
      html: {
        lang: document.documentElement.lang,
        dir: document.documentElement.dir,
      },
      root: {
        lang: document.getElementById('storybook-root')?.lang,
        dir: document.getElementById('storybook-root')?.dir,
      },
      runtime: window.UNDRR,
    }));
    throw new Error(
      `Language contract mismatch: expected ${JSON.stringify({ locale, lang, dir, canvas })}; actual ${JSON.stringify(actual)}`,
      { cause }
    );
  }
};
const select = async (page, toolbar, option) => {
  await page.getByRole('button', { name: toolbar }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
};
const browser = await chromium.launch({ headless: true });
const deadline = setTimeout(() => {
  console.error('Direction browser gate exceeded two minutes');
  browser.close().finally(() => process.exit(1));
}, 120_000);
try {
  const page = await browser.newPage();
  // Existing direct iframe/bookmarked globals must retain their old semantics.
  for (const [locale, lang, override, dir] of [
    ['english', 'en', 'ltr', 'ltr'],
    ['english', 'en', 'rtl', 'rtl'],
    ['arabic', 'ar', 'ltr', 'rtl'],
    ['arabic', 'ar', 'rtl', 'rtl'],
    ['french', 'fr', 'ltr', 'ltr'],
    ['japanese', 'ja', 'rtl', 'rtl'],
    ['russian', 'ru', 'ltr', 'ltr'],
    ['spanish', 'es', 'ltr', 'ltr'],
    ['chinese', 'zh', 'ltr', 'ltr'],
  ]) {
    await page.goto(
      urlFor(
        'components-tag--default',
        `locale:${locale};addonRtl:${override}`,
        true
      )
    );
    await expectLanguage(page, locale, lang, dir);
  }
  await page.goto(
    urlFor(
      '/story/components-buttons-buttons--editorial-cta',
      'locale:english;addonRtl:ltr'
    )
  );
  const frame = await (
    await page.locator('#storybook-preview-iframe').elementHandle()
  ).contentFrame();
  await expectLanguage(frame, 'english', 'en', 'ltr');
  await select(page, /Text direction/, 'Force right-to-left');
  await expectLanguage(frame, 'english', 'en', 'rtl');
  await select(page, /locale English/, 'Arabic');
  await select(page, /Text direction/, 'Locale direction');
  await expectLanguage(frame, 'arabic', 'ar', 'rtl');

  // Controls and theme rerenders must not reset Arabic direction.
  await page.getByRole('tab', { name: /Controls/ }).click();
  await page.locator('#control-label').fill('Direction after args update');
  await frame
    .locator('.mg-button')
    .filter({ hasText: 'Direction after args update' })
    .waitFor();
  await expectLanguage(frame, 'arabic', 'ar', 'rtl');
  for (const theme of [
    'PreventionWeb Theme',
    'IRP Theme',
    'MCR2030 Theme',
    'DELTA Resilience Theme',
    'Global UNDRR Theme',
  ]) {
    await select(page, /Global theme for components/, theme);
    await frame
      .locator(`style[data-mangrove-theme="${theme}"]`)
      .waitFor({ state: 'attached' });
    await expectLanguage(frame, 'arabic', 'ar', 'rtl');
  }
  await select(page, /Text direction/, 'Force right-to-left');
  await select(page, /locale Arabic/, 'Japanese');
  await expectLanguage(frame, 'japanese', 'ja', 'rtl');
  await select(page, /Text direction/, 'Locale direction');
  await expectLanguage(frame, 'japanese', 'ja', 'ltr');

  // Docs-only pages have no story decorators, including on a cold bookmark.
  await page.goto(
    urlFor('/docs/brand-brand-identity--docs', 'locale:arabic;addonRtl:ltr')
  );
  const docs = await (
    await page.locator('#storybook-preview-iframe').elementHandle()
  ).contentFrame();
  await docs.getByText('Brand identity', { exact: true }).first().waitFor();
  await expectLanguage(docs, 'arabic', 'ar', 'rtl', false);
  assert.equal(
    await docs
      .getByRole('heading', { name: 'Brand identity', exact: true })
      .evaluate(element => element.closest('[lang]').lang),
    'en',
    'English docs prose must retain Storybook’s own language boundary'
  );
  await select(page, /locale Arabic/, 'English');
  await expectLanguage(docs, 'english', 'en', 'ltr', false);
  await select(page, /Text direction/, 'Force right-to-left');
  await expectLanguage(docs, 'english', 'en', 'rtl', false);
  assert.equal(await page.locator('#storybook-preview-iframe').count(), 1);
  console.log(
    'Direction gate passed: bookmarked globals, native toolbar, nine locale/override cases, five themes, args rerenders and docs-only updates.'
  );
} finally {
  clearTimeout(deadline);
  await browser.close();
}
