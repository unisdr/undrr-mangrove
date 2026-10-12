import { axe } from 'jest-axe';
import {
  mgCiteThis,
  mgCiteThisDestroy,
  resolveCitation,
  toBibtex,
  toRis,
} from '../../../assets/js/cite-this';

function fixture(attributes = '') {
  document.body.innerHTML = `<main><div class="mg-cite-this" data-mg-cite-this ${attributes}>
    <details class="mg-cite-this__fallback">
    <summary class="mg-cite-this__summary">Cite this</summary>
    <div class="mg-cite-this__content">
      <p class="mg-cite-this__text" data-mg-cite-this-text></p>
      <div class="mg-cite-this__actions">
        <button type="button" data-mg-cite-this-copy hidden>Copy citation</button>
        <span data-mg-cite-this-status role="status" aria-live="polite"></span>
      </div>
    </div>
    </details>
  </div></main>`;
  return document.querySelector('[data-mg-cite-this]');
}

beforeEach(() => {
  document.head.innerHTML =
    '<title>Page title</title><meta property="og:site_name" content="UNDRR">';
  document.documentElement.lang = 'en-GB';
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
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
  expect(
    element.querySelector('.mg-cite-this__dialog [data-mg-cite-this-copy]')
  ).not.toHaveAttribute('hidden');
  element.querySelector('.mg-cite-this__trigger').click();
  element
    .querySelector('.mg-cite-this__dialog [data-mg-cite-this-copy]')
    .click();
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

test('uses a work nested under the matching WebPage entity', () => {
  document.head.insertAdjacentHTML(
    'beforeend',
    `<link rel="canonical" href="https://www.undrr.org/publication/report">
     <script type="application/ld+json">{"@type":"https://schema.org/WebPage","url":"https://www.undrr.org/publication/report","name":"Generic page title","mainEntity":{"@type":"https://schema.org/Report","name":"The report","datePublished":"2025-04-10"}}</script>`
  );
  const citation = resolveCitation(fixture());
  expect(citation.source).toBe('schema');
  expect(citation.text).toContain('“The report”');
  expect(citation.text).not.toContain('Generic page title');
});

test('page fallback uses access date without pretending it is a publication date', () => {
  document.head.insertAdjacentHTML(
    'beforeend',
    '<link rel="canonical" href="https://www.undrr.org/terminology/response?version=2025">'
  );
  const citation = resolveCitation(fixture(), new Date('2026-09-25T12:00:00Z'));
  expect(citation.source).toBe('page');
  expect(citation.text).toBe(
    '“Page title”, UNDRR, accessed 25 September 2026, https://www.undrr.org/terminology/response?version=2025.'
  );
});

test('preserves a supplied locator query while keeping it out of analytics events', () => {
  const element = fixture(
    'data-mg-cite-this-title="Report" data-mg-cite-this-url="https://www.undrr.org/report?id=42"'
  );
  const citation = resolveCitation(element);
  expect(citation.text).toContain('https://www.undrr.org/report?id=42.');
  const onOpen = jest.fn();
  element.addEventListener('mg-cite-this:open', onOpen);
  mgCiteThis(element);
  element.querySelector('.mg-cite-this__trigger').click();
  expect(onOpen.mock.calls[0][0].detail.url).toBe(
    'https://www.undrr.org/report'
  );
});

test('emits an open event only while enhanced and clears stale status on close', () => {
  const element = fixture('data-mg-cite-this-citation="Approved citation."');
  const onOpen = jest.fn();
  element.addEventListener('mg-cite-this:open', onOpen);
  mgCiteThis(element);
  const trigger = element.querySelector('.mg-cite-this__trigger');
  trigger.click();
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(element.querySelector('dialog').open).toBe(true);
  expect(element.querySelector('.mg-cite-this__close')).toHaveAccessibleName(
    'Close'
  );
  element.querySelector(
    '.mg-cite-this__dialog [data-mg-cite-this-status]'
  ).textContent = 'Citation copied';
  element.querySelector('.mg-cite-this__close').click();
  expect(
    element.querySelector('.mg-cite-this__dialog [data-mg-cite-this-status]')
  ).toBeEmptyDOMElement();
  expect(document.activeElement).toBe(trigger);
  mgCiteThisDestroy(element);
  expect(element.querySelector('.mg-cite-this__trigger')).toBeNull();
  expect(element.querySelector('.mg-cite-this__fallback')).not.toHaveAttribute(
    'hidden'
  );
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
  element.querySelector('.mg-cite-this__trigger').click();
  element
    .querySelector('.mg-cite-this__dialog [data-mg-cite-this-copy]')
    .click();
  await Promise.resolve();
  expect(onError).toHaveBeenCalledTimes(1);
  expect(
    element.querySelector('.mg-cite-this__dialog [data-mg-cite-this-status]')
  ).toHaveTextContent('Copy failed. Select the citation and copy it manually.');
});

test('markup has no accessibility violations when expanded', async () => {
  const element = fixture('data-mg-cite-this-citation="Approved citation."');
  mgCiteThis(element);
  element.querySelector('.mg-cite-this__trigger').click();
  expect(await axe(document.body)).toHaveNoViolations();
});

test('server markup remains readable without enhancement', () => {
  const element = fixture('data-mg-cite-this-citation="Approved citation."');
  element.querySelector('[data-mg-cite-this-text]').textContent =
    'Approved citation.';
  element.querySelector('details').open = true;
  expect(element).toHaveTextContent('Approved citation.');
  expect(element.querySelector('dialog')).toBeNull();
});

test('an empty vanilla marker uses the page title and URL', () => {
  document.head.insertAdjacentHTML(
    'beforeend',
    '<meta property="og:title" content="Open Graph title">'
  );
  document.body.innerHTML =
    '<main><h1>Heading title</h1><div class="mg-cite-this" data-mg-cite-this></div></main>';
  const element = document.querySelector('[data-mg-cite-this]');
  mgCiteThis(element);

  expect(element.dataset.mgCiteThisSource).toBe('page');
  expect(element.querySelector('.mg-cite-this__header')).toHaveTextContent(
    'Cite this'
  );
  expect(
    element.querySelector('.mg-cite-this__dialog [data-mg-cite-this-text]')
  ).toHaveTextContent('“Page title”');
  expect(
    element.querySelector('.mg-cite-this__dialog [data-mg-cite-this-text]')
  ).toHaveTextContent(new URL(document.location.href).origin);

  mgCiteThisDestroy(element);
  expect(element.querySelector('details')).toBeNull();
  expect(element.querySelector('dialog')).toBeNull();
});

test('an empty marker becomes a readable disclosure when dialog is unavailable', () => {
  HTMLDialogElement.prototype.showModal = undefined;
  document.body.innerHTML =
    '<main><div class="mg-cite-this" data-mg-cite-this></div></main>';
  const element = document.querySelector('[data-mg-cite-this]');
  mgCiteThis(element);

  expect(element.querySelector('details')).not.toHaveAttribute('hidden');
  expect(element.querySelector('[data-mg-cite-this-text]')).toHaveTextContent(
    '“Page title”'
  );
  expect(element.querySelector('.mg-cite-this__trigger')).toBeNull();
  mgCiteThisDestroy(element);
  expect(element.querySelector('details')).toBeNull();
});

test('links URLs in the citation and copies the same plain text', async () => {
  const element = fixture(
    'data-mg-cite-this-title="Report" data-mg-cite-this-year="2025" data-mg-cite-this-url="https://www.undrr.org/report?id=42"'
  );
  const writeText = jest.fn().mockResolvedValue();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  mgCiteThis(element);
  const text = element.querySelector(
    '.mg-cite-this__dialog [data-mg-cite-this-text]'
  );
  const link = text.querySelector('a');
  expect(link).toHaveAttribute('href', 'https://www.undrr.org/report?id=42');
  expect(link).toHaveTextContent('https://www.undrr.org/report?id=42');
  expect(text.textContent.endsWith('?id=42.')).toBe(true);

  element.querySelector('.mg-cite-this__trigger').click();
  element
    .querySelector('.mg-cite-this__dialog [data-mg-cite-this-copy]')
    .click();
  await Promise.resolve();
  expect(writeText).toHaveBeenCalledWith(text.textContent);
});

test('links URLs inside editorial citations without altering their text', () => {
  const citation =
    'UNDRR (2022). Global Assessment Report 2022. Geneva: UNDRR. Available at: https://www.undrr.org/gar2022.';
  const element = fixture(`data-mg-cite-this-citation="${citation}"`);
  mgCiteThis(element);
  const text = element.querySelector('[data-mg-cite-this-text]');
  expect(text.textContent).toBe(citation);
  expect(text.querySelector('a')).toHaveAttribute(
    'href',
    'https://www.undrr.org/gar2022'
  );
});

const reportFields = {
  type: 'report',
  authors: ['United Nations Office for Disaster Risk Reduction', 'Smith, Jane'],
  title: 'Risk & resilience: 100% {tested}',
  publisher: 'UNDRR',
  year: '2025',
  url: 'https://www.undrr.org/report?id=42',
  accessed: new Date('2026-10-12T12:00:00Z'),
};

test('RIS records use CRLF tags with one AU line per creator', () => {
  expect(toRis(reportFields)).toBe(
    [
      'TY  - RPRT',
      'AU  - United Nations Office for Disaster Risk Reduction',
      'AU  - Smith, Jane',
      'TI  - Risk & resilience: 100% {tested}',
      'PY  - 2025',
      'PB  - UNDRR',
      'UR  - https://www.undrr.org/report?id=42',
      'Y2  - 2026/10/12',
      'ER  - ',
      '',
    ].join('\r\n')
  );
  expect(toRis({ ...reportFields, type: 'webpage', year: '' })).toMatch(
    /^TY {2}- ELEC\r\n(?![\s\S]*PY)/
  );
});

test('BibTeX braces organisations, escapes special characters and keeps the URL verbatim', () => {
  const entry = toBibtex(reportFields);
  expect(entry).toMatch(/^@techreport\{united2025risk,\n/);
  expect(entry).toContain(
    'author = {{United Nations Office for Disaster Risk Reduction} and Smith, Jane}'
  );
  expect(entry).toContain(
    'title = {{Risk \\& resilience: 100\\% \\{tested\\}}}'
  );
  expect(entry).toContain('institution = {UNDRR}');
  expect(entry).toContain('url = {https://www.undrr.org/report?id=42}');
  expect(entry).toContain('urldate = {2026-10-12}');
  expect(toBibtex({ ...reportFields, type: 'book' })).toContain(
    'publisher = {UNDRR}'
  );
  expect(toBibtex({ ...reportFields, type: 'webpage' })).toMatch(/^@misc\{/);
});

test('schema people with family and given names are exported inverted', () => {
  document.head.insertAdjacentHTML(
    'beforeend',
    `<link rel="canonical" href="https://www.undrr.org/publication/book">
     <script type="application/ld+json">{"@type":"Book","url":"https://www.undrr.org/publication/book","name":"A book","datePublished":"2024","author":[{"@type":"Person","givenName":"Tania","familyName":"Schoennagel"},{"@type":"Organization","name":"UNDRR"}]}</script>`
  );
  const { fields } = resolveCitation(fixture());
  expect(fields.type).toBe('book');
  expect(fields.authors).toEqual(['Schoennagel, Tania', 'UNDRR']);
});

test('export links are on by default, can be turned off and announce an export event', () => {
  const plain = fixture('data-mg-cite-this-title="Report"');
  mgCiteThis(plain);
  expect(
    [...plain.querySelectorAll('.mg-cite-this__export')].map(
      link => link.dataset.mgCiteThisFormat
    )
  ).toEqual(['ris', 'bibtex']);
  mgCiteThisDestroy(plain);

  const off = fixture(
    'data-mg-cite-this-title="Report" data-mg-cite-this-export="none"'
  );
  mgCiteThis(off);
  expect(off.querySelector('.mg-cite-this__exports')).toBeNull();
  mgCiteThisDestroy(off);

  const element = fixture(
    'data-mg-cite-this-title="Hazard profiles" data-mg-cite-this-year="2025" data-mg-cite-this-type="report" data-mg-cite-this-export="bibtex ris unknown ris" data-mg-cite-this-ris-label="RIS file"'
  );
  const events = [];
  element.addEventListener('mg-cite-this:export', event =>
    events.push(event.detail)
  );
  mgCiteThis(element);
  const links = [...element.querySelectorAll('.mg-cite-this__export')];
  expect(links.map(link => link.textContent)).toEqual([
    'Download BibTeX',
    'RIS file',
  ]);
  expect(links[0]).toHaveAttribute('download', 'hazard-profiles.bib');
  expect(decodeURIComponent(links[1].href)).toContain('TY  - RPRT');
  links[1].dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true })
  );
  expect(events).toEqual([expect.objectContaining({ format: 'ris' })]);
});

test('an editorial citation offers exports only with configured fields', () => {
  const bare = fixture(
    'data-mg-cite-this-citation="Approved." data-mg-cite-this-export="ris"'
  );
  mgCiteThis(bare);
  expect(bare.querySelector('.mg-cite-this__export')).toBeNull();
  mgCiteThisDestroy(bare);

  const configured = fixture(
    'data-mg-cite-this-citation="Approved." data-mg-cite-this-title="Report" data-mg-cite-this-export="ris"'
  );
  mgCiteThis(configured);
  expect(
    configured.querySelector('[data-mg-cite-this-text]')
  ).toHaveTextContent('Approved.');
  expect(configured.querySelector('.mg-cite-this__export')).not.toBeNull();
});

test('Copy link copies the citation URL with its own feedback and event', async () => {
  const element = fixture(
    'data-mg-cite-this-title="Report" data-mg-cite-this-url="https://www.undrr.org/report?id=42" data-mg-cite-this-copy-link-label="Copier le lien"'
  );
  const writeText = jest.fn().mockResolvedValue();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  const events = [];
  element.addEventListener('mg-cite-this:copy-link', event =>
    events.push(event.detail)
  );
  element.addEventListener('mg-cite-this:copy', () => events.push('citation'));
  mgCiteThis(element);
  const button = element.querySelector('.mg-cite-this__copy-link');
  expect(button).toHaveTextContent('Copier le lien');
  button.click();
  await Promise.resolve();
  expect(writeText).toHaveBeenCalledWith('https://www.undrr.org/report?id=42');
  expect(
    element.querySelector('.mg-cite-this__dialog [data-mg-cite-this-status]')
  ).toHaveTextContent('Link copied');
  expect(events).toEqual([expect.objectContaining({ source: 'metadata' })]);
});

test('a failed link copy is reported against the link', async () => {
  const element = fixture('data-mg-cite-this-title="Report"');
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: jest.fn().mockRejectedValue(new Error('denied')) },
  });
  const errors = [];
  element.addEventListener('mg-cite-this:copy-error', event =>
    errors.push(event.detail.target)
  );
  mgCiteThis(element);
  element.querySelector('.mg-cite-this__copy-link').click();
  await Promise.resolve();
  await Promise.resolve();
  expect(errors).toEqual(['link']);
  expect(
    element.querySelector('.mg-cite-this__dialog [data-mg-cite-this-status]')
  ).toHaveTextContent('Select the URL in the citation');
});

test('Copy link can be turned off', () => {
  const element = fixture(
    'data-mg-cite-this-title="Report" data-mg-cite-this-copy-link="false"'
  );
  mgCiteThis(element);
  expect(element.querySelector('.mg-cite-this__copy-link')).toBeNull();
});

test('the default layout labels the group, copies from the preview and keeps the dialog', async () => {
  const element = fixture(
    'data-mg-cite-this-title="Report" data-mg-cite-this-year="2025"'
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

  const label = element.querySelector(
    '.mg-cite-this__panel .mg-cite-this__header'
  );
  expect(label).toHaveTextContent('Cite this');
  expect(element).toHaveAttribute('role', 'group');
  expect(element).toHaveAttribute('aria-labelledby', label.id);
  expect(element.querySelector('.mg-cite-this__trigger')).toHaveTextContent(
    'All citation options'
  );
  expect(element.querySelector('.mg-cite-this__title')).toHaveTextContent(
    'Cite this'
  );

  const preview = element.querySelector('.mg-cite-this__preview');
  expect(preview).toHaveAccessibleName('Copy citation');
  const { text } = resolveCitation(element);
  expect(preview).toHaveTextContent(text);
  preview.click();
  await Promise.resolve();
  await Promise.resolve();
  expect(writeText).toHaveBeenCalledWith(text);
  expect(preview).toHaveTextContent('Citation copied');
  expect(events).toHaveLength(1);

  mgCiteThisDestroy(element);
  expect(element.querySelector('.mg-cite-this__panel')).toBeNull();
  expect(element).not.toHaveAttribute('role');
});

test('the compact variant is the trigger alone', () => {
  const element = fixture('data-mg-cite-this-title="Report"');
  element.classList.add('mg-cite-this--compact');
  mgCiteThis(element);
  expect(element.querySelector('.mg-cite-this__panel')).toBeNull();
  expect(element).not.toHaveAttribute('role');
  expect(element.querySelector('.mg-cite-this__trigger')).toHaveTextContent(
    'Cite this'
  );
  expect(element.querySelector('.mg-cite-this__copy-link')).toHaveTextContent(
    'Copy citation URL'
  );
});
