/** Real CSS/media regression gate. Emulation and local routes precede mount. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const base = process.env.MOTION_STORYBOOK_URL || 'http://127.0.0.1:6099';
const output = process.env.MOTION_ARTIFACT_DIR || 'artifacts/motion';
const themes = [
  'Global UNDRR Theme',
  'PreventionWeb Theme',
  'IRP Theme',
  'MCR2030 Theme',
  'DELTA Resilience Theme',
];
const modes = [
  { name: 'reduced', reducedMotion: 'reduce', forcedColors: 'none' },
  { name: 'forced', reducedMotion: 'no-preference', forcedColors: 'active' },
  { name: 'combined', reducedMotion: 'reduce', forcedColors: 'active' },
];
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = [];
const deadline = setTimeout(() => {
  console.error('Motion browser gate exceeded six minutes');
  browser.close().finally(() => process.exit(1));
}, 360_000);
const visible = async locator => {
  await locator.waitFor({ state: 'visible' });
  const box = await locator.boundingBox();
  assert(
    box && box.width > 0 && box.height > 0,
    'Visible shape needs nonzero dimensions'
  );
  assert(
    await locator.evaluate(el => {
      for (let node = el; node; node = node.parentElement) {
        const css = getComputedStyle(node);
        if (
          Number(css.opacity) === 0 ||
          css.visibility === 'hidden' ||
          css.display === 'none'
        )
          return false;
      }
      return true;
    }),
    'A visible loading shape must not be concealed by its ancestors'
  );
};
const focusRing = async locator => {
  const state = await locator.evaluate(
    el =>
      new Promise(resolve => {
        const deadline = performance.now() + 500;
        const opaque = color =>
          color !== 'transparent' && !/rgba\([^)]*,\s*0\)/.test(color);
        const inspect = () => {
          const css = getComputedStyle(el);
          const outline =
            css.outlineStyle !== 'none' &&
            parseFloat(css.outlineWidth) > 0 &&
            opaque(css.outlineColor);
          const shadow = css.boxShadow.split(/,(?![^()]*\))/).some(layer => {
            const colors = layer.match(/rgba?\([^)]*\)/g) || [];
            const lengths =
              layer
                .replace(/rgba?\([^)]*\)/g, '')
                .match(/-?(?:\d*\.)?\d+px/g) || [];
            return (
              colors.some(opaque) &&
              lengths.some(value => parseFloat(value) !== 0)
            );
          });
          const state = {
            valid:
              el === document.activeElement &&
              el.matches(':focus-visible') &&
              (outline || shadow),
            active: el === document.activeElement,
            focusVisible: el.matches(':focus-visible'),
            outline: css.outline,
            shadow: css.boxShadow,
            direction: css.direction,
            reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
            forced: matchMedia('(forced-colors: active)').matches,
            element: el.outerHTML.slice(0, 200),
          };
          if (state.valid || performance.now() >= deadline) resolve(state);
          else requestAnimationFrame(inspect);
        };
        inspect();
      })
  );
  assert(
    state.valid,
    `Keyboard focus must retain a painted ring: ${locator.page().url()} ${JSON.stringify(state)}`
  );
};
const style = (locator, pseudo) =>
  locator.evaluate((element, pseudo) => {
    const s = getComputedStyle(element, pseudo);
    return {
      animation: s.animationName,
      duration: parseFloat(s.animationDuration),
      iterations: s.animationIterationCount,
      transform: s.transform,
      background: s.backgroundImage,
      color: s.backgroundColor,
      opacity: Number(s.opacity),
      border: s.borderTopColor,
      track: s.borderBottomColor,
      borders: [
        s.borderTopColor,
        s.borderRightColor,
        s.borderBottomColor,
        s.borderLeftColor,
      ],
      borderWidths: [
        s.borderTopWidth,
        s.borderRightWidth,
        s.borderBottomWidth,
        s.borderLeftWidth,
      ].map(parseFloat),
      borderStyles: [
        s.borderTopStyle,
        s.borderRightStyle,
        s.borderBottomStyle,
        s.borderLeftStyle,
      ],
      display: s.display,
      visibility: s.visibility,
      width: parseFloat(s.width),
      height: parseFloat(s.height),
      adjust: s.forcedColorAdjust,
      transition: s.transitionDuration,
      outline: s.outlineStyle,
      outlineWidth: s.outlineWidth,
      outlineColor: s.outlineColor,
      shadow: s.boxShadow,
    };
  }, pseudo);

try {
  for (const [themeIndex, theme] of themes.entries())
    for (const mode of modes)
      for (const mobile of [false, true]) {
        const name = `${themeIndex}-${mode.name}-${mobile ? 'mobile-rtl' : 'desktop-ltr'}`;
        const context = await browser.newContext({
          viewport: mobile
            ? { width: 375, height: 812 }
            : { width: 1280, height: 900 },
          reducedMotion: mode.reducedMotion,
          forcedColors: mode.forcedColors,
        });
        const page = await context.newPage();
        page.setDefaultTimeout(8_000);
        page.setDefaultNavigationTimeout(30_000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await context.route('**/*', async route => {
          const url = new URL(route.request().url());
          if (url.origin !== new URL(base).origin) return route.abort();
          if (url.pathname === '/__motion__/pending.mp4')
            return route.fulfill({
              status: 200,
              contentType: 'video/mp4',
              body: '',
            });
          if (url.pathname === '/__motion__/search') return; // Deliberately pending until context teardown.
          return route.continue();
        });
        await context.addInitScript(
          ({ mobile }) => {
            if (mobile)
              document.addEventListener('DOMContentLoaded', () => {
                document.documentElement.dir = 'rtl';
              });
            window.__motionScrolls = [];
            const original = Element.prototype.scrollIntoView;
            Element.prototype.scrollIntoView = function (options) {
              window.__motionScrolls.push(options);
              return original.call(this, options);
            };
          },
          { mobile }
        );
        const visit = async story => {
          await page.goto(
            `${base}/iframe.html?id=${story.includes('--') ? story : `quality-motion--${story}`}&viewMode=story&globals=theme:${encodeURIComponent(theme)}${mobile ? ';locale:arabic' : ''}`
          );
          await page.locator('#storybook-root').waitFor();
          const media = await page.evaluate(() => ({
            reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
            forced: matchMedia('(forced-colors: active)').matches,
            direction: getComputedStyle(
              document.querySelector('#storybook-root')
            ).direction,
          }));
          assert.equal(media.reduced, mode.reducedMotion === 'reduce');
          assert.equal(media.forced, mode.forcedColors === 'active');
          assert.equal(media.direction, mobile ? 'rtl' : 'ltr');
          const componentSelectors = {
            loading: ['.mg-loader', '.mg-progress-bar'],
            'gallery-loading': ['.mg-gallery'],
            'drawer-interaction': ['.mg-drawer'],
            'details-interaction': ['.mg-details'],
            navigation: ['.mg-mega-wrapper'],
            'components-syndicated-search--initial-loading': [
              '.mg-search__main',
            ],
          };
          for (const selector of componentSelectors[story]) {
            const element = page.locator(selector).first();
            await element.waitFor({ state: 'attached' });
            assert.equal(
              await element.evaluate(el => getComputedStyle(el).direction),
              mobile ? 'rtl' : 'ltr',
              `${selector} must use the tested text direction`
            );
          }
          const expectedTheme = [
            '',
            'mg-theme-preventionweb',
            'mg-theme-irp',
            'mg-theme-mcr',
            'mg-theme-delta',
          ][themeIndex];
          await page.waitForFunction(
            expected =>
              expected
                ? document.body.classList.contains(expected)
                : !Array.from(document.body.classList).some(name =>
                    name.startsWith('mg-theme-')
                  ),
            expectedTheme
          );
        };
        const checkLoader = async (
          loader,
          {
            label,
            decorative = false,
            reduced = mode.reducedMotion === 'reduce',
          } = {}
        ) => {
          await visible(loader);
          const css = await style(loader);
          const shape =
            reduced && !decorative ? await style(loader, '::before') : css;
          if (reduced) {
            assert.equal(
              css.animation,
              'none',
              'Reduced Loader host must not animate'
            );
            assert.equal(
              shape.animation,
              'none',
              'Reduced Loader shape must not animate'
            );
            assert.equal(
              css.transform,
              'none',
              'Reduced Loader must not retain a rotated frame'
            );
            assert.equal(
              shape.transform,
              'none',
              'Reduced shape must not retain a rotated frame'
            );
            assert(
              shape.opacity > 0 &&
                shape.display !== 'none' &&
                shape.visibility === 'visible',
              'Static loading shape must be painted'
            );
            assert(
              shape.width > 0 && shape.height > 0,
              'Static loading shape has nonzero dimensions'
            );
            assert(
              shape.borderStyles.every(value => value === 'dashed'),
              'Static pending shape must be a complete dashed ring'
            );
            assert(
              shape.borderWidths.every(width => width > 0),
              'Every side of the static ring must have painted width'
            );
            assert(
              shape.borders.every(
                value =>
                  value === shape.borders[0] &&
                  value !== 'transparent' &&
                  !/rgba\([^)]*,\s*0\)/.test(value)
              ),
              'Every side of the static ring must remain painted'
            );
            const pending = decorative
              ? loader.locator('..').getByText(label, { exact: true })
              : loader.getByText(label, { exact: true });
            await visible(pending);
            assert(
              await pending.evaluate(el => {
                const css = getComputedStyle(el);
                const r = el.getBoundingClientRect();
                return (
                  css.clip === 'auto' &&
                  css.clipPath === 'none' &&
                  r.width > 1 &&
                  r.height > 1 &&
                  !el.closest('[aria-hidden="true"]')
                );
              }),
              'Reduced loading text must be visibly readable, not clipped screen-reader-only text'
            );
          } else {
            assert(
              css.animation !== 'none' && css.iterations === 'infinite',
              'Normal-motion Loader must continue rotating'
            );
            assert(
              css.duration >= 0.5,
              'Normal Loader duration must survive global reset'
            );
          }
          const movement = await loader.evaluate(
            async (el, pseudo) => {
              const frame = () =>
                new Promise(resolve => requestAnimationFrame(resolve));
              await frame();
              const before = getComputedStyle(el, pseudo).transform;
              await new Promise(resolve => setTimeout(resolve, 120));
              await frame();
              return {
                before,
                after: getComputedStyle(el, pseudo).transform,
                running: el
                  .getAnimations({ subtree: true })
                  .filter(animation => animation.playState === 'running')
                  .length,
              };
            },
            reduced && !decorative ? '::before' : undefined
          );
          if (reduced) {
            assert.equal(
              movement.before,
              movement.after,
              'Reduced Loader must stay still over time'
            );
            assert.equal(
              movement.running,
              0,
              'Reduced Loader must have no running animations, including pseudos'
            );
          } else
            assert.notEqual(
              movement.before,
              movement.after,
              'Normal Loader must actually rotate over time'
            );
          if (mode.forcedColors === 'active') {
            assert.equal(
              shape.adjust,
              'none',
              'Forced-colour loading shape must retain its painted system colours'
            );
            if (!reduced)
              assert.notEqual(
                css.border,
                css.track,
                'Forced-colour rotating arc must stay distinct'
              );
            else
              assert(
                await loader.evaluate(
                  (el, pseudo) => {
                    const probe = document.createElement('span');
                    probe.style.backgroundColor = 'Canvas';
                    document.body.appendChild(probe);
                    const canvas = getComputedStyle(probe).backgroundColor;
                    probe.remove();
                    return (
                      getComputedStyle(el, pseudo).borderTopColor !== canvas
                    );
                  },
                  decorative ? undefined : '::before'
                ),
                'Static forced-colour ring must contrast with Canvas'
              );
          }
        };
        try {
          await visit('loading');
          const fixtureLoaders = page.locator('.mg-loader');
          const fixtureLabels = [
            'Chargement du contenu…',
            'Chargement des données…',
            'Chargement HTML…',
          ];
          assert.equal(await fixtureLoaders.count(), fixtureLabels.length);
          for (const [index, label] of fixtureLabels.entries())
            await checkLoader(fixtureLoaders.nth(index), { label });
          // Preferences can change while pending work stays mounted. Check the
          // same nodes in both policies, then restore the tested media mode.
          const flipped = mode.reducedMotion !== 'reduce';
          await page.emulateMedia({
            reducedMotion: flipped ? 'reduce' : 'no-preference',
          });
          for (const [index, label] of fixtureLabels.entries())
            await checkLoader(fixtureLoaders.nth(index), {
              label,
              reduced: flipped,
            });
          await page.emulateMedia({ reducedMotion: mode.reducedMotion });
          for (const [index, label] of fixtureLabels.entries())
            await checkLoader(fixtureLoaders.nth(index), { label });
          const progress = page.locator('.mg-progress-bar__track');
          await visible(progress);
          const scanner = await style(progress, '::after');
          if (mode.reducedMotion === 'reduce')
            assert(
              scanner.animation === 'none' &&
                scanner.background.includes('repeating-linear-gradient') &&
                scanner.transform === 'none',
              'Reduced progress must be static dashed, not completed-looking'
            );
          if (mode.forcedColors === 'active')
            assert.equal((await style(progress)).adjust, 'none');
          await page.screenshot({
            path: path.join(output, `${name}-loading.png`),
          });

          await visit('gallery-loading');
          await checkLoader(page.locator('.mg-gallery .mg-loader'), {
            label: 'Chargement du média…',
          });
          if (mode.reducedMotion === 'reduce') {
            const loadingText = page.locator('.mg-gallery .mg-loader > span');
            const originalText = await loadingText.textContent();
            try {
              // Stress the translated caller label within the real media stage.
              // The feedback surface must not intercept gallery controls.
              await loadingText.evaluate(el => {
                el.textContent =
                  'جارٍ تحميل محتوى الوسائط. يرجى الانتظار حتى تصبح المعلومات المعروضة متاحة للقراءة.';
              });
              const next = page.locator('.mg-gallery__arrow--next');
              assert(
                await next.evaluate(button => {
                  const bounds = button.getBoundingClientRect();
                  const hit = document.elementFromPoint(
                    bounds.x + bounds.width / 2,
                    bounds.y + bounds.height / 2
                  );
                  return button.contains(hit);
                }),
                'Long reduced-motion Gallery loading text must not intercept the Next control'
              );
              await next.click({ trial: true });
            } finally {
              await loadingText.evaluate((el, text) => {
                el.textContent = text;
              }, originalText);
            }
          }
          await page.evaluate(() => {
            document.documentElement.style.scrollBehavior = 'smooth';
            document.querySelector(
              '.mg-gallery__thumbnails'
            ).style.scrollBehavior = 'smooth';
          });
          await page
            .getByRole('region', { name: 'Gallery', exact: true })
            .press('End');
          if (mode.reducedMotion === 'reduce') {
            const positioned = await page.evaluate(
              () =>
                new Promise(resolve =>
                  requestAnimationFrame(() => {
                    const rail = document
                      .querySelector('.mg-gallery__thumbnails')
                      .getBoundingClientRect();
                    const target = document
                      .querySelectorAll('.mg-gallery__thumbnail')[15]
                      .getBoundingClientRect();
                    const firstLeft = target.left;
                    const inside =
                      target.left >= rail.left - 1 &&
                      target.right <= rail.right + 1;
                    requestAnimationFrame(() => {
                      const finalTarget = document
                        .querySelectorAll('.mg-gallery__thumbnail')[15]
                        .getBoundingClientRect();
                      resolve(
                        inside && Math.abs(finalTarget.left - firstLeft) < 1
                      );
                    });
                  })
                )
            );
            assert(
              positioned,
              'Reduced Gallery selection must reach its final position within one rendering frame'
            );
          }
          const scrolls = await page.evaluate(() => window.__motionScrolls);
          assert.equal(
            scrolls.at(-1)?.behavior,
            mode.reducedMotion === 'reduce' ? 'instant' : 'smooth',
            'Gallery must explicitly override consumer smooth scroll'
          );
          await page.keyboard.press('Tab');
          await page
            .getByRole('tab', { name: 'View Slide 15', exact: true })
            .focus();
          await focusRing(
            page.getByRole('tab', { name: 'View Slide 15', exact: true })
          );
          assert(
            await page
              .getByRole('tab', { name: 'View Slide 15', exact: true })
              .evaluate(el => el === document.activeElement)
          );
          await page.screenshot({
            path: path.join(output, `${name}-gallery.png`),
          });

          await visit('drawer-interaction');
          const trigger = page.getByRole('button', {
            name: 'Open fixture drawer',
          });
          await trigger.click();
          const drawer = page.locator('.mg-drawer');
          await visible(drawer);
          await page.waitForFunction(
            () => {
              const el = document.querySelector('.mg-drawer');
              return el.contains(document.activeElement) && !el.inert;
            },
            null,
            { timeout: 1500 }
          );
          if (mode.reducedMotion === 'reduce')
            assert(
              (await style(drawer)).transition
                .split(',')
                .every(value => parseFloat(value) <= 0.00001)
            );
          await page.keyboard.press('Escape');
          assert(
            await drawer.evaluate(el => el.inert),
            'Closed drawer controls must be inert'
          );
          assert(
            await trigger.evaluate(el => el === document.activeElement),
            'Drawer must restore focus'
          );

          await visit('details-interaction');
          const summary = page.locator('summary');
          await summary.focus();
          await page.keyboard.press('Enter');
          await focusRing(summary);
          assert(
            await page.locator('details').evaluate(el => el.open),
            'Details must open by keyboard'
          );
          await visible(page.getByText('Fixture content'));
          if (mode.reducedMotion === 'reduce')
            assert(
              (await style(summary)).transition
                .split(',')
                .every(value => parseFloat(value) <= 0.00001)
            );

          await visit('navigation');
          const menuToggle = page.locator(
            '.mg-mega-topbar-mobile__icon-button'
          );
          const panel = page
            .locator(mobile ? '.mg-mega-mobile-sidebar' : '.mg-mega-content')
            .first();
          if (mobile) await menuToggle.click();
          const resources = page.getByRole('button', {
            name: 'Resources',
            exact: true,
          });
          await resources.click();
          if (mobile)
            await page
              .getByRole('button', { name: 'Resources topics', exact: true })
              .click();
          const destinations = page
            .locator(
              mobile
                ? '.mg-mega-mobile-sidebar a[href^="#destination-"]'
                : '.mg-mega-content a[href^="#destination-"]'
            )
            .filter({ visible: true });
          await visible(destinations.last());
          assert.equal(
            await destinations.count(),
            30,
            'Exercise every destination including those after item 12'
          );
          const effectiveVisibility = elements =>
            elements.every(el => {
              const r = el.getBoundingClientRect();
              if (!r.width || !r.height) return false;
              for (let node = el; node; node = node.parentElement) {
                const css = getComputedStyle(node);
                if (
                  Number(css.opacity) === 0 ||
                  css.visibility === 'hidden' ||
                  css.display === 'none'
                )
                  return false;
              }
              return !el.closest('[inert], [aria-hidden="true"]');
            });
          if (mode.reducedMotion !== 'reduce')
            await page.waitForFunction(
              effectiveVisibility,
              await destinations.elementHandles()
            );
          assert(
            await destinations.evaluateAll(effectiveVisibility),
            'No ancestor may conceal interactive menu destinations'
          );
          await page.keyboard.press('Tab');
          await destinations.last().focus();
          await focusRing(destinations.last());
          assert(
            await destinations
              .last()
              .evaluate(el => el === document.activeElement)
          );
          await page.screenshot({
            path: path.join(output, `${name}-menu.png`),
          });
          if (mobile) {
            await page.locator('.mg-mega-mobile-sidebar__close').click();
            assert(
              await panel.evaluate(el => el.inert || !el.isConnected),
              'Exiting mobile navigation must be immediately inert'
            );
            await menuToggle.click();
            await visible(
              page.getByRole('button', { name: 'Resources', exact: true })
            );
            await page.keyboard.press('Escape');
            assert(
              await menuToggle.evaluate(el => el === document.activeElement),
              'Closing mobile navigation restores trigger focus'
            );
          } else {
            const about = page.getByRole('button', {
              name: 'About',
              exact: true,
            });
            await about.click();
            await resources.click();
            await about.click();
            await page.keyboard.press('Escape');
            assert(
              await page
                .locator('.mg-mega-content')
                .evaluateAll(elements => elements.every(el => el.inert)),
              'Closed desktop menu panels must be inert'
            );
            await resources.focus();
            await page.keyboard.press('Enter');
            await visible(
              page.locator('.mg-mega-content[aria-hidden="false"]')
            );
          }

          await visit('components-syndicated-search--initial-loading');
          const skeleton = page.locator('.mg-search__skeleton-title').first();
          await visible(skeleton);
          const loadingRegion = page.locator('.mg-search__results-loading');
          assert.equal(await loadingRegion.getAttribute('aria-live'), 'polite');
          assert(
            (await loadingRegion.textContent()).includes('Loading search'),
            'Initial loading needs an announcement'
          );
          assert.equal(
            await page
              .locator(
                '.mg-search__progress [role="status"], .mg-search__progress [aria-live]'
              )
              .count(),
            0,
            'Decorative search progress must not add live regions'
          );
          const skeletonCss = await style(skeleton);
          if (mode.reducedMotion === 'reduce')
            assert.equal(
              skeletonCss.animation,
              'none',
              'Skeleton shimmer must stop'
            );
          if (mode.forcedColors === 'active') {
            const shape = await skeleton.evaluate(el => {
              const css = getComputedStyle(el);
              return {
                style: css.outlineStyle,
                width: parseFloat(css.outlineWidth),
                color: css.outlineColor,
                pageColor: (() => {
                  const canvas = document.createElement('span');
                  canvas.style.cssText = 'position:absolute;background:Canvas';
                  document.body.appendChild(canvas);
                  const color = getComputedStyle(canvas).backgroundColor;
                  canvas.remove();
                  return color;
                })(),
              };
            });
            assert(
              shape.style !== 'none' &&
                shape.width >= 1 &&
                shape.color !== shape.pageColor,
              'Forced-colour skeleton needs a contrasting visible outline'
            );
          }
          const searchProgress = page.locator(
            '.mg-search__main .mg-progress-bar__track'
          );
          await visible(searchProgress);
          assert.equal(
            await page.locator('.mg-search__main').getAttribute('aria-busy'),
            'true'
          );
          if (mode.reducedMotion === 'reduce') {
            const scan = await style(searchProgress, '::after');
            assert(
              scan.animation === 'none' &&
                scan.background.includes('repeating-linear-gradient'),
              'Search must reuse static dashed shared progress'
            );
          }
          await page.screenshot({
            path: path.join(output, `${name}-search.png`),
          });
          await page
            .getByRole('button', { name: 'Complete search', exact: true })
            .click();
          await page
            .getByRole('list', { name: 'Search results', exact: true })
            .waitFor();
          assert.equal(
            await page.locator('.mg-search__main').getAttribute('aria-busy'),
            'false'
          );
          assert.equal(
            await page.locator('.mg-search__main progress').count(),
            0
          );
          const resultAnnouncement = page.locator(
            '.mg-search__results > [role="status"].mg-u-sr-only'
          );
          assert.equal(
            (await resultAnnouncement.textContent()).trim(),
            '2 results found'
          );
          await page
            .getByRole('button', { name: 'Refresh results', exact: true })
            .click();
          await checkLoader(page.locator('.mg-search__main .mg-loader'), {
            label: 'Recherche en cours…',
            decorative: true,
          });
          const pendingLabel = page
            .locator('.mg-search__results-loader')
            .getByText('Recherche en cours…', { exact: true });
          await visible(pendingLabel);
          assert(
            await pendingLabel.evaluate(el => {
              const bounds = el.getBoundingClientRect();
              for (let node = el; node; node = node.parentElement) {
                if (Number(getComputedStyle(node).opacity) < 1) return false;
              }
              return bounds.left >= -1 && bounds.right <= innerWidth + 1;
            }),
            'Translated pending text must fit narrow LTR and RTL headers at full opacity'
          );
          assert.equal(
            await pendingLabel
              .locator('xpath=ancestor::*[@role="status" or @aria-live]')
              .count(),
            0,
            'Visible search pending text must not add an announcement region'
          );
          assert.equal(
            await page
              .locator('.mg-search__main .mg-loader')
              .getAttribute('aria-hidden'),
            'true',
            'Refresh Loader is decorative; the results region owns announcements'
          );
          assert.equal(
            await page.locator('.mg-search__main').getAttribute('aria-busy'),
            'true'
          );
          await page
            .getByRole('button', { name: 'Fail search', exact: true })
            .click();
          await visible(
            page
              .getByRole('alert')
              .filter({ hasText: 'Search service unavailable' })
          );
          assert.equal(
            await page.locator('.mg-search__main').getAttribute('aria-busy'),
            'false'
          );
          assert.equal(
            await page
              .locator('.mg-search__main progress, .mg-search__main .mg-loader')
              .count(),
            0
          );
          assert.equal(
            await page
              .getByText('Recherche en cours…', { exact: true })
              .count(),
            0,
            'Search pending text must clear on failure'
          );
          assert.deepEqual(
            errors,
            [],
            'Fixtures must not throw browser errors'
          );
          report.push({ name, passed: true });
          console.log(`PASS ${name}`);
        } catch (error) {
          await page
            .screenshot({ path: path.join(output, `${name}-failure.png`) })
            .catch(() => {});
          report.push({ name, passed: false, error: error.stack });
          throw error;
        } finally {
          await context.close();
        }
      }
} finally {
  await fs.writeFile(
    path.join(output, 'results.json'),
    JSON.stringify(report, null, 2)
  );
  clearTimeout(deadline);
  await browser.close();
}
console.log(
  `Motion browser gate passed ${report.length} theme/media/viewport combinations (7 components each).`
);
