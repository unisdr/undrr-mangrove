/** Compiled CSS/semantic boundary gate against the production Storybook. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';
import axe from 'axe-core';

const base = process.env.CONTENT_STORYBOOK_URL || 'http://127.0.0.1:6099';
const output = process.env.CONTENT_ARTIFACT_DIR || 'artifacts/rich-content';
const themes = [
  ['Global UNDRR Theme', 'style.css'],
  ['PreventionWeb Theme', 'style-preventionweb.css'],
  ['IRP Theme', 'style-irp.css'],
  ['MCR2030 Theme', 'style-mcr.css'],
  ['DELTA Resilience Theme', 'style-delta.css'],
];
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = [];
const deadline = setTimeout(() => {
  console.error('Rich-content browser gate exceeded four minutes');
  browser.close().finally(() => process.exit(1));
}, 240_000);

async function open(page, story, theme, rtl) {
  const url = new URL('/iframe.html', base);
  url.searchParams.set('id', `patterns-rich-content--${story}`);
  url.searchParams.set('viewMode', 'story');
  url.searchParams.set(
    'globals',
    `theme:${theme};locale:${rtl ? 'arabic' : 'english'};a11y.manual:!true`
  );
  await page.goto(url.href);
  await page
    .locator(story === 'editorial' ? '#rich-content-demo' : '#rich-boundaries')
    .waitFor();
  const expected = ['', 'preventionweb', 'irp', 'mcr', 'delta'][
    themes.findIndex(([name]) => name === theme)
  ];
  await page.waitForFunction(token => {
    const body = document.body;
    const loaded = getComputedStyle(body)
      .getPropertyValue('--mg-theme-loaded')
      .trim();
    const correctClass = token
      ? body.classList.contains(`mg-theme-${token}`)
      : ![...body.classList].some(name => name.startsWith('mg-theme-'));
    return (
      correctClass &&
      loaded === token &&
      getComputedStyle(body).getPropertyValue('--mg-spacing-100').trim() !== ''
    );
  }, expected);
  assert.equal(
    await page.locator('body').evaluate(el => getComputedStyle(el).direction),
    rtl ? 'rtl' : 'ltr'
  );
  await page.evaluate(() => document.fonts.ready);
}

async function a11y(page) {
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () =>
    window.axe.run(document.querySelector('#storybook-root'), {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
      },
    })
  );
  assert.deepEqual(
    results.violations.map(v => ({
      id: v.id,
      nodes: v.nodes.map(n => n.target),
    })),
    [],
    'Editorial boundary must pass axe'
  );
}

try {
  for (const [theme, file] of themes) {
    for (const width of [320, 1280]) {
      for (const rtl of [false, true]) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
        });
        await open(page, 'editorial', theme, rtl);
        const editorial = await page.evaluate(() => {
          const root = document.querySelector('#rich-content-demo');
          const style = el => getComputedStyle(el);
          return {
            pageFits: document.documentElement.scrollWidth <= window.innerWidth,
            proseLinks: [...root.querySelectorAll('a')].every(a =>
              style(a).textDecorationLine.includes('underline')
            ),
            bodyQuote:
              style(root.querySelector('blockquote')).fontSize ===
              style(root.querySelector('p')).fontSize,
            inlineCite: style(root.querySelector('cite')).display === 'inline',
            imageFits:
              root.querySelector('img').getBoundingClientRect().width <=
              root.getBoundingClientRect().width,
            tableCount: root.querySelectorAll('table').length,
            overflow:
              root.querySelector('.mg-content__scroll').scrollWidth >
              root.querySelector('.mg-content__scroll').clientWidth,
            codeContained:
              root.querySelector('pre').getBoundingClientRect().width <=
              root.getBoundingClientRect().width,
          };
        });
        assert(
          editorial.pageFits &&
            editorial.proseLinks &&
            editorial.bodyQuote &&
            editorial.inlineCite &&
            editorial.imageFits &&
            editorial.overflow &&
            editorial.codeContained,
          JSON.stringify(editorial)
        );
        assert.equal(editorial.tableCount, 2);
        const scroller = page.locator('.mg-content__scroll');
        await page.keyboard.press('Tab');
        await scroller.focus();
        assert(
          await scroller.evaluate(
            el =>
              el.matches(':focus-visible') &&
              getComputedStyle(el).boxShadow !== 'none'
          ),
          'Overflow region has visible keyboard focus'
        );
        const start = await scroller.evaluate(el => el.scrollLeft);
        await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight');
        await page.waitForTimeout(150);
        assert.notEqual(
          await scroller.evaluate(el => el.scrollLeft),
          start,
          'Named table region scrolls by keyboard'
        );
        const code = page.locator('#rich-content-demo pre');
        await code.focus();
        assert(
          await page
            .locator('#rich-content-demo pre')
            .evaluate(
              el =>
                el.matches(':focus-visible') &&
                getComputedStyle(el).boxShadow !== 'none'
            ),
          'Code region has visible keyboard focus'
        );
        if (width === 320) {
          const codeStart = await code.evaluate(el => el.scrollLeft);
          assert.equal(
            await code.evaluate(el => getComputedStyle(el).direction),
            'ltr'
          );
          await page.keyboard.press('ArrowRight');
          await page.waitForFunction(
            start =>
              document.querySelector('#rich-content-demo pre').scrollLeft !==
              start,
            codeStart
          );
        }
        await a11y(page);
        if (width === 320)
          await page.screenshot({
            path: path.join(output, `${file}-${rtl ? 'rtl' : 'ltr'}.png`),
            fullPage: true,
          });

        await open(page, 'boundaries', theme, rtl);
        const boundary = await page.evaluate(() => {
          const s = selector =>
            getComputedStyle(document.querySelector(selector));
          const component = () => {
            const card = s('#rich-boundaries .mg-card');
            const title = s('#rich-boundaries .mg-card__title');
            const link = s('#rich-boundaries .mg-card__title a');
            return [
              card.padding,
              card.borderWidth,
              title.fontFamily,
              title.fontSize,
              title.lineHeight,
              link.color,
              link.textDecorationLine,
            ];
          };
          const cardInside = component();
          const root = document.querySelector('#rich-boundaries');
          root.classList.remove('mg-content');
          const cardOutside = component();
          root.classList.add('mg-content');
          return {
            cardInside,
            cardOutside,
            classedProse: s('.editorial-reference').textDecorationLine.includes(
              'underline'
            ),
            button: s('.mg-button').textDecorationLine,
            card: s('#rich-boundaries .mg-card__title a').textDecorationLine,
            outside: s('#outside-prose a').textDecorationLine,
            legacyCite: s('#legacy-body cite').display,
            optedCite: s('#both-boundaries cite').display,
            classedQuote:
              s('.third-party-widget blockquote').fontSize ===
              s('#legacy-body blockquote').fontSize,
            calloutBorder: s('#ckeditor-callout').borderInlineStartWidth,
            panelLink: s('#mg-tabs__section-rich-panel a').textDecorationLine,
            navPadding: s('[aria-label="Panel navigation"] ul')
              .paddingInlineStart,
            outsideNavPadding: s('#outside-navigation ul').paddingInlineStart,
            formHeadingMargin: s('[aria-label="Panel form"] h3')
              .marginBlockStart,
            outsideHeadingMargin: s('#outside-prose h3').marginBlockStart,
          };
        });
        assert(
          boundary.classedProse && boundary.classedQuote,
          JSON.stringify(boundary)
        );
        assert.equal(boundary.button, 'none');
        assert.deepEqual(
          boundary.cardInside,
          boundary.cardOutside,
          'Card must retain its own link/typography/box treatment'
        );
        assert.equal(boundary.outside, 'none');
        assert.equal(boundary.legacyCite, 'block');
        assert.equal(boundary.optedCite, 'inline');
        assert.equal(boundary.calloutBorder, '0px');
        assert(boundary.panelLink.includes('underline'));
        assert.equal(boundary.navPadding, boundary.outsideNavPadding);
        assert.equal(boundary.formHeadingMargin, boundary.outsideHeadingMargin);
        await a11y(page);
        if (width === 320 && !rtl)
          await page.screenshot({
            path: path.join(output, `${file}-boundaries.png`),
            fullPage: true,
          });
        report.push({ theme, width, rtl, editorial, boundary });
        await page.close();
      }
    }
  }
  // Combined media settings retain visible link cues and pass the same
  // scoped WCAG axe checks; viewport/direction cases cover keyboard overflow.
  const page = await browser.newPage({
    viewport: { width: 320, height: 900 },
    forcedColors: 'active',
    reducedMotion: 'reduce',
  });
  await open(page, 'editorial', themes[0][0], false);
  assert(
    await page
      .locator('#rich-content-demo a')
      .first()
      .evaluate(el =>
        getComputedStyle(el).textDecorationLine.includes('underline')
      )
  );
  await a11y(page);
  await page.screenshot({
    path: path.join(output, 'combined-media.png'),
    fullPage: true,
  });
  await page.close();
  console.log(
    `Rich-content browser gate passed: ${report.length} theme/viewport/direction combinations plus combined media`
  );
} finally {
  clearTimeout(deadline);
  await fs.writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(report, null, 2)
  );
  await browser.close();
}
