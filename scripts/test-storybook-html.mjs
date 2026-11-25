/** Verify rendered docs, generated snippets and copied HTML in production. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.env.HTML_STORYBOOK_URL || 'http://127.0.0.1:6099';
const url = new URL(`${base.replace(/\/$/, '')}/`);
url.searchParams.set('addonPanel', 'controls');
const browser = await chromium.launch({ headless: true });
const deadline = setTimeout(() => {
  console.error('HTML browser gate exceeded two minutes');
  browser.close().finally(() => process.exit(1));
}, 120_000);

const docsUrl = id => {
  const docs = new URL('iframe.html', url);
  docs.searchParams.set('id', id);
  docs.searchParams.set('viewMode', 'docs');
  return docs.href;
};

async function checkDocs(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto(docsUrl('patterns-publication-record--docs'));
  const publicationDocs = page.locator('#storybook-docs');
  await publicationDocs
    .getByRole('heading', { name: /Publication record prototype/ })
    .waitFor();
  await publicationDocs
    .getByText('Showing {shown} of {total} files', { exact: false })
    .waitFor();
  await publicationDocs.getByRole('heading', { name: /Changelog/ }).waitFor();
  await publicationDocs
    .getByRole('switch', { name: 'Show code' })
    .first()
    .click();
  await publicationDocs
    .locator('pre')
    .filter({
      hasText: /<div\b[^>]*\bclass="mg-publication-record">/,
    })
    .waitFor();

  await page.goto(docsUrl('components-notice-notice--docs'));
  await page
    .getByText('Scheduled maintenance update', { exact: true })
    .first()
    .waitFor();
  await page.getByRole('switch', { name: 'Show code' }).first().click();
  const noticeSource = page
    .locator('pre')
    .filter({ hasText: '<Notice' })
    .filter({ hasText: 'title="Scheduled maintenance update"' });
  await noticeSource.filter({ hasText: 'variant="info"' }).waitFor();
  await page
    .getByRole('combobox', { name: 'variant', exact: true })
    .selectOption('positive');
  await noticeSource.filter({ hasText: 'variant="positive"' }).waitFor();
  assert.deepEqual(errors, [], 'Rendered docs must not raise uncaught errors');
}

// Storybook applies the URL before server-inferred Controls are available.
// Exercise both an explicit Control and a prop absent from the story's args.
async function checkBookmarkedArgs(page) {
  const bookmark = new URL('./', url);
  const preview = page.frameLocator('#storybook-preview-iframe');
  const open = async (id, args) => {
    bookmark.searchParams.set('path', `/story/${id}`);
    bookmark.searchParams.set('args', args);
    await page.goto(bookmark.href);
  };

  await open(
    'components-pageheader--default',
    'languages[0].value:it;languages[0].label:ViaURL'
  );
  // Wait for the bookmarked values in the preview. The first render can
  // briefly show the story defaults before the manager applies the URL.
  const waitForBookmark = { state: 'attached', timeout: 15_000 };
  const languages = preview.locator('.mg-page-header__select');
  await languages
    .locator('option')
    .filter({ hasText: 'ViaURL' })
    .waitFor(waitForBookmark);
  assert.deepEqual(
    (await languages.locator('option').allTextContents()).map(label =>
      label.trim()
    ),
    ['ViaURL'],
    'PageHeader should render the language list from the bookmarked args'
  );

  await open(
    'components-notice-notice--info-notice',
    'headingLevel:h5;isCompact:true'
  );
  await preview
    .locator('.mg-notice.mg-notice--compact h5.mg-notice__title')
    .waitFor(waitForBookmark);

  await open(
    'patterns-content-card--news',
    'className:bookmarked-card;headingLevel:5'
  );
  await preview
    .locator('[data-content-layout].bookmarked-card')
    .getByRole('heading', { level: 5 })
    .waitFor(waitForBookmark);

  await open('components-forms-checkbox--default', 'disabled:true');
  await preview
    .locator('input[type="checkbox"]:disabled')
    .waitFor(waitForBookmark);
}

try {
  const context = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  url.searchParams.set(
    'path',
    '/story/components-buttons-buttons--editorial-cta'
  );
  await page.goto(url.href);
  await page
    .frameLocator('#storybook-preview-iframe')
    .locator('.mg-button')
    .waitFor();
  assert.equal(
    await page
      .frameLocator('#storybook-preview-iframe')
      .locator('body')
      .evaluate(() =>
        performance
          .getEntriesByType('resource')
          .some(entry => /formatHtml[-.]/.test(entry.name))
      ),
    false,
    'Opening a React story with Controls selected must not load the HTML formatter'
  );
  url.searchParams.set('path', '/story/patterns-rich-content--editorial');
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
  // Toolbar rerenders must retain current story output across all themes.
  for (const theme of [
    'PreventionWeb Theme',
    'IRP Theme',
    'MCR2030 Theme',
    'DELTA Resilience Theme',
    'Global UNDRR Theme',
  ]) {
    await page
      .getByRole('button', { name: /Global theme for components/ })
      .click();
    await page.getByRole('option', { name: theme, exact: true }).click();
    await preview
      .locator(`style[data-mangrove-theme="${theme}"]`)
      .waitFor({ state: 'attached' });
    await panel.getByRole('button', { name: 'Copy', exact: true }).click();
    assert.ok(
      (await page.evaluate(() => navigator.clipboard.readText())).includes(
        'risk_register'
      )
    );
  }
  await page.getByRole('button', { name: /^locale( |$)/ }).click();
  await page.getByRole('option', { name: /Arabic/ }).click();
  await preview.locator('.mg-content[dir="rtl"]').waitFor();
  await page.waitForFunction(() =>
    document
      .querySelector('[role="tabpanel"]')
      ?.textContent.includes('dir="rtl"')
  );

  // The live DOM changes without a Storybook args rerender when a tab is clicked.
  url.searchParams.set('globals', 'locale:english');
  url.searchParams.set('path', '/story/components-tabs--tabs');
  url.searchParams.set('addonPanel', 'storybook/html/panel');
  await page.goto(url.href);
  const tabs = page.frameLocator('#storybook-preview-iframe');
  await tabs.getByRole('tab', { name: 'Tab title 2', exact: true }).click();
  await page.waitForFunction(() => {
    const code = document.querySelector('[role="tabpanel"]')?.textContent || '';
    const html = new DOMParser().parseFromString(code, 'text/html');
    return (
      html
        .querySelector('[role="tab"][aria-selected="true"]')
        ?.textContent.trim() === 'Tab title 2'
    );
  });

  // The manager remains mounted during sidebar navigation; channel listeners
  // must follow its new story ID rather than retain their first closure.
  // Storybook 11 sidebar entries are items keyed by story ID, not links.
  await page
    .locator('[data-item-id="components-tabs--tabs-with-default"]')
    .click();
  await tabs.getByRole('tab', { name: 'Tab title 2', exact: true }).waitFor();
  await panel.getByRole('button', { name: 'Copy', exact: true }).click();
  const frame = await (
    await page.locator('#storybook-preview-iframe').elementHandle()
  ).contentFrame();
  await frame.evaluate(() => {
    const channel = window.__STORYBOOK_ADDONS_CHANNEL__;
    window.__htmlStopped = new Promise(resolve => {
      const stopped = request => {
        if (!request.active) {
          channel.off('mangrove/html/request', stopped);
          resolve();
        }
      };
      channel.on('mangrove/html/request', stopped);
    });
  });
  await page.getByRole('tab', { name: /Controls/ }).click();
  await frame.evaluate(() => window.__htmlStopped);
  await frame.evaluate(() => {
    window.__htmlUpdates = 0;
    window.__STORYBOOK_ADDONS_CHANNEL__.on('mangrove/html/update', () => {
      window.__htmlUpdates += 1;
    });
  });
  await tabs.getByRole('tab', { name: 'Tab title 1', exact: true }).click();
  // Allow an observer's 80 ms capture window to elapse for this negative check.
  assert.equal(
    await frame.evaluate(
      () =>
        new Promise(resolve => {
          setTimeout(() => resolve(window.__htmlUpdates), 250);
        })
    ),
    0,
    'Inactive HTML panel must stop publishing DOM updates'
  );
  await page.getByRole('tab', { name: 'HTML', exact: true }).click();
  await page.waitForFunction(() => {
    const html = new DOMParser().parseFromString(
      document.querySelector('[role="tabpanel"]')?.textContent || '',
      'text/html'
    );
    return (
      html
        .querySelector('[role="tab"][aria-selected="true"]')
        ?.textContent.trim() === 'Tab title 1'
    );
  });

  // Changing a real Controls field while HTML is inactive must be reflected
  // on reopening, without a cached snippet from the previous story.
  url.searchParams.set(
    'path',
    '/story/components-buttons-buttons--editorial-cta'
  );
  url.searchParams.set('addonPanel', 'controls');
  await page.goto(url.href);
  await page.locator('#control-label').fill('Updated from Controls');
  await page.getByRole('tab', { name: 'HTML', exact: true }).click();
  await page
    .getByRole('tabpanel', { name: 'HTML', exact: true })
    .getByText('Updated from Controls', { exact: false })
    .first()
    .waitFor();
  await page
    .getByRole('tabpanel', { name: 'HTML', exact: true })
    .getByRole('button', { name: 'Copy', exact: true })
    .click();
  const updated = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(updated.includes('Updated from Controls'));
  assert.ok(
    !updated.includes('risk_register'),
    'Previous story HTML must not survive navigation'
  );
  const docsPage = await context.newPage();
  await checkDocs(docsPage);
  await checkBookmarkedArgs(docsPage);
  console.log(
    'HTML gate passed: rendered docs, generated JSX and HTML, clipboard punctuation, five themes, RTL, live interaction, Controls updates and bookmarked args.'
  );
} finally {
  clearTimeout(deadline);
  await browser.close();
}
