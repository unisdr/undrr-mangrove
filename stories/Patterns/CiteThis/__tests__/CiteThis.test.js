import { axe } from 'jest-axe';
import {
  mgCiteThis,
  mgCiteThisDestroy,
  resolveCitation,
} from '../../../assets/js/cite-this';

function fixture(attributes = '') {
  document.body.innerHTML = `<main><details class="mg-cite-this" data-mg-cite-this ${attributes}>
    <summary class="mg-cite-this__summary">Cite this</summary>
    <div class="mg-cite-this__content">
      <p class="mg-cite-this__context" data-mg-cite-this-context></p>
      <p class="mg-cite-this__text" data-mg-cite-this-text></p>
      <div class="mg-cite-this__actions">
        <button type="button" data-mg-cite-this-copy hidden>Copy citation</button>
        <span data-mg-cite-this-status role="status" aria-live="polite"></span>
      </div>
    </div>
  </details></main>`;
  return document.querySelector('[data-mg-cite-this]');
}

beforeEach(() => {
  document.head.innerHTML =
    '<title>Page title</title><meta property="og:site_name" content="UNDRR">';
  document.documentElement.lang = 'en-GB';
});

afterEach(() => {
  mgCiteThisDestroy(document);
  document.body.innerHTML = '';
});

test('editorial text has precedence and is copied unchanged', async () => {
  const element = fixture(
    'data-mg-cite-this-citation="Approved citation." data-mg-cite-this-title="Ignored"'
  );
  const writeText = jest.fn().mockResolvedValue();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  const events = [];
  element.addEventListener('mg-cite-this:copy', event =>
    events.push(event.detail)
  );
  mgCiteThis(element);
  mgCiteThis(element);
  expect(element.querySelector('[data-mg-cite-this-text]')).toHaveTextContent(
    'Approved citation.'
  );
  expect(element.querySelector('[data-mg-cite-this-copy]')).not.toHaveAttribute(
    'hidden'
  );
  element.querySelector('[data-mg-cite-this-copy]').click();
  await Promise.resolve();
  expect(writeText).toHaveBeenCalledTimes(1);
  expect(writeText).toHaveBeenCalledWith('Approved citation.');
  expect(events).toEqual([expect.objectContaining({ source: 'provided' })]);
});

test('configured fields override a matching JSON-LD work', () => {
  document.head.insertAdjacentHTML(
    'beforeend',
    `<link rel="canonical" href="https://www.undrr.org/publication/report">
     <script type="application/ld+json">{"@type":"Report","url":"https://www.undrr.org/publication/report","name":"Schema title","datePublished":"2024-01-01","author":{"name":"Schema author"}}</script>`
  );
  const element = fixture(
    'data-mg-cite-this-title="Editorial title" data-mg-cite-this-year="2025"'
  );
  const citation = resolveCitation(element, new Date('2026-09-25T12:00:00Z'));
  expect(citation.source).toBe('metadata');
  expect(citation.text).toContain('Schema author (2025), “Editorial title”');
  expect(citation.text).not.toContain('Schema title');
});

test('uses only JSON-LD for the canonical work, ignoring other entities and bad JSON', () => {
  document.head.insertAdjacentHTML(
    'beforeend',
    `<link rel="canonical" href="https://www.undrr.org/publication/report">
     <script type="application/ld+json">{bad json</script>
     <script type="application/ld+json">{"@graph":[{"@type":"ScholarlyArticle","url":"https://www.undrr.org/other","name":"Unrelated"},{"@type":"Report","mainEntityOfPage":"https://www.undrr.org/publication/report","name":"Real report","datePublished":"2025-04-10","publisher":{"name":"UNDRR"}}]}</script>`
  );
  const citation = resolveCitation(fixture());
  expect(citation.source).toBe('schema');
  expect(citation.text).toContain('“Real report”');
  expect(citation.text).toContain('(2025)');
  expect(citation.text).not.toContain('Unrelated');
});

test('page fallback uses access date without pretending it is a publication date', () => {
  document.head.insertAdjacentHTML(
    'beforeend',
    '<link rel="canonical" href="https://www.undrr.org/terminology/response?tracking=1">'
  );
  const citation = resolveCitation(fixture(), new Date('2026-09-25T12:00:00Z'));
  expect(citation.source).toBe('page');
  expect(citation.text).toBe(
    '“Page title”, UNDRR, accessed 25 September 2026, https://www.undrr.org/terminology/response.'
  );
});

test('emits an open event only while enhanced and clears stale status on close', () => {
  const element = fixture('data-mg-cite-this-citation="Approved citation."');
  const onOpen = jest.fn();
  element.addEventListener('mg-cite-this:open', onOpen);
  mgCiteThis(element);
  element.open = true;
  element.dispatchEvent(new Event('toggle'));
  expect(onOpen).toHaveBeenCalledTimes(1);
  element.querySelector('[data-mg-cite-this-status]').textContent =
    'Citation copied';
  element.open = false;
  element.dispatchEvent(new Event('toggle'));
  expect(
    element.querySelector('[data-mg-cite-this-status]')
  ).toBeEmptyDOMElement();
  mgCiteThisDestroy(element);
  element.open = true;
  element.dispatchEvent(new Event('toggle'));
  expect(onOpen).toHaveBeenCalledTimes(1);
});

test('announces copy failure and emits an error event', async () => {
  const element = fixture('data-mg-cite-this-citation="Approved citation."');
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: jest.fn().mockRejectedValue(new Error('Denied')) },
  });
  const onError = jest.fn();
  element.addEventListener('mg-cite-this:copy-error', onError);
  mgCiteThis(element);
  element.querySelector('[data-mg-cite-this-copy]').click();
  await Promise.resolve();
  expect(onError).toHaveBeenCalledTimes(1);
  expect(element.querySelector('[data-mg-cite-this-status]')).toHaveTextContent(
    'Copy failed. Select the citation and copy it manually.'
  );
});

test('markup has no accessibility violations when expanded', async () => {
  const element = fixture('data-mg-cite-this-citation="Approved citation."');
  mgCiteThis(element);
  element.open = true;
  expect(await axe(document.body)).toHaveNoViolations();
});
