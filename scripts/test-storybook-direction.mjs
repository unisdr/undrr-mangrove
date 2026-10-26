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
  const docsId = new URL(page.url()).searchParams
    .get('path')
    ?.match(/^\/docs\/(.+)$/)?.[1];
  // A docs globals update can reinitialize the preview and replay manager
  // globals. Wait for Storybook's render completion, not the first transient
  // lang/dir write, before starting another toolbar interaction.
  if (docsId) {
    await page.evaluate(id => {
      const channel = window.__STORYBOOK_ADDONS_CHANNEL__;
      window.__directionDocsRendered = new Promise(resolve => {
        const rendered = storyId => {
          if (storyId === id) {
            channel.off('docsRendered', rendered);
            resolve();
          }
        };
        channel.on('docsRendered', rendered);
      });
    }, docsId);
  }
  await page.getByRole('option', { name: option, exact: true }).click();
  if (docsId) await page.evaluate(() => window.__directionDocsRendered);
  const selectedTitle = new RegExp(
    `${option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`
  );
  await page
    .getByRole('region', { name: 'Toolbar', exact: true })
    .getByRole('button', { name: selectedTitle })
    .waitFor();
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
  // Tabs docs embeds real inline canvases, including one with fixed Arabic
  // story globals. Its override must not leak into the docs host or siblings.
  await page.goto(
    urlFor('/docs/components-tabs--docs', 'locale:english;addonRtl:ltr')
  );
  const embeddedDocs = await (
    await page.locator('#storybook-preview-iframe').elementHandle()
  ).contentFrame();
  const expectCanvases = async (lang, dir) => {
    await embeddedDocs.waitForFunction(
      ({ lang, dir }) => {
        const ordinary = document.getElementById(
          'story--components-tabs--centred-group-inner'
        );
        const fixed = document.getElementById(
          'story--components-tabs--right-to-left-inner'
        );
        return (
          ordinary?.lang === lang &&
          ordinary?.dir === dir &&
          fixed?.lang === 'ar' &&
          fixed?.dir === 'rtl'
        );
      },
      { lang, dir }
    );
  };
  await expectCanvases('en', 'ltr');
  await expectLanguage(embeddedDocs, 'english', 'en', 'ltr', false);
  await select(page, /locale English/, 'Arabic');
  await expectCanvases('ar', 'rtl');
  await expectLanguage(embeddedDocs, 'arabic', 'ar', 'rtl', false);
  await select(page, /locale Arabic/, 'English');
  await expectCanvases('en', 'ltr');
  await select(page, /Text direction/, 'Force right-to-left');
  await expectCanvases('en', 'rtl');
  await expectLanguage(embeddedDocs, 'english', 'en', 'rtl', false);
  await select(page, /Global theme for components/, 'PreventionWeb Theme');
  await embeddedDocs
    .locator('style[data-mangrove-theme="PreventionWeb Theme"]')
    .waitFor({ state: 'attached' });
  await expectCanvases('en', 'rtl');
  await expectLanguage(embeddedDocs, 'english', 'en', 'rtl', false);
  assert.equal(await page.locator('#storybook-preview-iframe').count(), 1);
  console.log(
    'Direction gate passed: bookmarked globals, native toolbar, nine locale/override cases, five themes, args rerenders, docs-only updates and independent inline story overrides.'
  );
} finally {
  clearTimeout(deadline);
  await browser.close();
}
