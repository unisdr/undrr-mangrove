import { axe } from 'jest-axe';
import {
  citeThisStrings,
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

test('Copy citation URL copies the citation URL with its own feedback and event', async () => {
  const element = fixture(
    'data-mg-cite-this-title="Report" data-mg-cite-this-url="https://www.undrr.org/report?id=42" data-mg-cite-this-copy-url-label="Copier le lien"'
  );
  const writeText = jest.fn().mockResolvedValue();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  const events = [];
  element.addEventListener('mg-cite-this:copy-url', event =>
    events.push(event.detail)
  );
  element.addEventListener('mg-cite-this:copy', () => events.push('citation'));
  mgCiteThis(element);
  const button = element.querySelector('.mg-cite-this__copy-url');
  expect(button).toHaveTextContent('Copier le lien');
  button.click();
  await Promise.resolve();
  expect(writeText).toHaveBeenCalledWith('https://www.undrr.org/report?id=42');
  expect(
    element.querySelector('.mg-cite-this__dialog [data-mg-cite-this-status]')
  ).toHaveTextContent('URL copied');
  expect(events).toEqual([expect.objectContaining({ source: 'metadata' })]);
});

test('a failed URL copy is reported against the URL', async () => {
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
  element.querySelector('.mg-cite-this__copy-url').click();
  await Promise.resolve();
  await Promise.resolve();
  expect(errors).toEqual(['url']);
  expect(
    element.querySelector('.mg-cite-this__dialog [data-mg-cite-this-status]')
  ).toHaveTextContent('Select the URL in the citation');
});

test('Copy citation URL can be turned off', () => {
  const element = fixture(
    'data-mg-cite-this-title="Report" data-mg-cite-this-copy-url="false"'
  );
  mgCiteThis(element);
  expect(element.querySelector('.mg-cite-this__copy-url')).toBeNull();
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
  const { text } = resolveCitation(element);
  // jsdom computes no display value, so its accessible name pads the inline
  // title and URL isolates with spaces; browsers do not.
  const loose = [...`Copy citation: ${text}`]
    .map(char => char.replace(/[.*+?^${}()|[\]\\]/, '\\$&'))
    .join('\\s*');
  expect(preview).toHaveAccessibleName(new RegExp(`^${loose}$`));
  expect(element.querySelector('.mg-cite-this__preview-text').textContent).toBe(
    text
  );
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
  expect(element.querySelector('.mg-cite-this__copy-url')).toHaveTextContent(
    'Copy citation URL'
  );
});

test('events carry a stable work id, the citing page and where the action happened', async () => {
  document.head.insertAdjacentHTML(
    'beforeend',
    '<link rel="canonical" href="https://www.preventionweb.net/news/story?utm_source=x">'
  );
  const element = fixture(
    'data-mg-cite-this-id="node/12345" data-mg-cite-this-title="Report" data-mg-cite-this-url="https://www.undrr.org/publication/report?lang=fr"'
  );
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: jest.fn().mockResolvedValue() },
  });
  const events = [];
  for (const name of ['open', 'copy', 'copy-url'])
    element.addEventListener(`mg-cite-this:${name}`, event =>
      events.push([name, event.detail])
    );
  mgCiteThis(element);
  element.querySelector('.mg-cite-this__preview').click();
  await Promise.resolve();
  element.querySelector('.mg-cite-this__trigger').click();
  element.querySelector('.mg-cite-this__copy-url').click();
  await Promise.resolve();

  const common = {
    id: 'node/12345',
    url: 'https://www.undrr.org/publication/report',
    pageUrl: 'https://www.preventionweb.net/news/story',
    layout: 'default',
    source: 'metadata',
  };
  expect(events).toEqual([
    ['copy', { ...common, placement: 'field' }],
    ['open', { ...common, placement: 'trigger' }],
    ['copy-url', { ...common, placement: 'dialog' }],
  ]);
});

test('the work id falls back to Schema.org identifier, then @id, then the URL', () => {
  document.head.insertAdjacentHTML(
    'beforeend',
    `<link rel="canonical" href="https://www.undrr.org/publication/report">
     <script type="application/ld+json">{"@type":"Report","@id":"https://www.undrr.org/publication/report#work","url":"https://www.undrr.org/publication/report","name":"R","identifier":{"@type":"PropertyValue","propertyID":"DOI","value":"10.1234/abc"}}</script>`
  );
  expect(resolveCitation(fixture()).id).toBe('10.1234/abc');

  const ld = document.querySelector('script[type="application/ld+json"]');
  const work =
    '"@type":"Report","url":"https://www.undrr.org/publication/report","name":"R"';
  ld.textContent = `{${work},"identifier":9781234}`;
  expect(resolveCitation(fixture()).id).toBe('9781234');

  ld.textContent = `{${work},"@id":"https://data.undrr.org/works/abc"}`;
  expect(resolveCitation(fixture()).id).toBe(
    'https://data.undrr.org/works/abc'
  );

  // A fragment on the work or page URL changes with the URL, and a bare
  // fragment repeats on every page, so neither is a stable key.
  for (const id of [
    'https://www.undrr.org/publication/report#work',
    '#article',
  ]) {
    ld.textContent = `{${work},"@id":"${id}"}`;
    expect(resolveCitation(fixture()).id).toBe(
      'https://www.undrr.org/publication/report'
    );
  }

  const element = fixture(
    'data-mg-cite-this-title="Other" data-mg-cite-this-url="https://www.undrr.org/other?x=1"'
  );
  document.querySelector('script[type="application/ld+json"]').remove();
  expect(resolveCitation(element).id).toBeNull();
});

test.each(['42', '43'])(
  'query-addressed work %s has no automatic analytics identity but retains its locator in copies and exports',
  async record => {
    const url = `https://www.undrr.org/report?id=${record}`;
    const element = fixture(
      `data-mg-cite-this-title="Report" data-mg-cite-this-url="${url}"`
    );
    const writeText = jest.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const citation = resolveCitation(element);
    expect(citation.id).toBeNull();
    expect(citation.url).toBe(url);
    const events = [];
    for (const name of ['open', 'copy', 'copy-url', 'export']) {
      element.addEventListener(`mg-cite-this:${name}`, event =>
        events.push(event.detail)
      );
    }
    mgCiteThis(element);
    element.querySelector('.mg-cite-this__trigger').click();
    element.querySelector('dialog [data-mg-cite-this-copy]').click();
    element.querySelector('.mg-cite-this__copy-url').click();
    await Promise.resolve();
    expect(writeText).toHaveBeenCalledWith(citation.text);
    expect(writeText).toHaveBeenCalledWith(url);
    for (const link of element.querySelectorAll('[data-mg-cite-this-format]')) {
      const download = decodeURIComponent(
        link.getAttribute('href').split(',')[1]
      );
      expect(download).toContain(url);
      // Prevent jsdom from trying to navigate to the download data URL.
      link.addEventListener('click', event => event.preventDefault());
      link.click();
    }
    expect(events).toHaveLength(5);
    for (const detail of events) {
      expect(detail.id).toBeNull();
      expect(detail.url).toBe('https://www.undrr.org/report');
      expect(JSON.stringify(detail)).not.toContain(`id=${record}`);
    }
  }
);

test('a query-bearing Schema.org @id has no automatic identity or less-specific fallback', () => {
  document.head.insertAdjacentHTML(
    'beforeend',
    `<link rel="canonical" href="https://www.undrr.org/publication/report">
     <script type="application/ld+json">{"@type":"Report","url":"https://www.undrr.org/publication/report","@id":"https://data.undrr.org/works?id=42","name":"R"}</script>`
  );
  const element = fixture();
  expect(resolveCitation(element).id).toBeNull();
  const opens = [];
  element.addEventListener('mg-cite-this:open', event =>
    opens.push(event.detail)
  );
  mgCiteThis(element);
  element.querySelector('.mg-cite-this__trigger').click();
  expect(opens[0].id).toBeNull();
  element.dataset.mgCiteThisId = 'preventionweb:node/42';
  expect(resolveCitation(element).id).toBe('preventionweb:node/42');
});

test.each(['10.1234/example', '9781234567890'])(
  'a structured identifier %s remains available for a query-addressed work',
  identifier => {
    document.head.insertAdjacentHTML(
      'beforeend',
      `<link rel="canonical" href="https://www.undrr.org/report?id=42">
       <script type="application/ld+json">{"@type":"Report","url":"https://www.undrr.org/report?id=42","identifier":"${identifier}","name":"R"}</script>`
    );
    expect(resolveCitation(fixture()).id).toBe(identifier);
  }
);

test.each(['host', 'structured'])(
  'an explicitly authored %s identifier is retained even when it is a URL with a query',
  source => {
    const id = 'https://data.undrr.org/works?edition=approved';
    document.head.insertAdjacentHTML(
      'beforeend',
      `<link rel="canonical" href="https://www.undrr.org/report?id=42">
       <script type="application/ld+json">{"@type":"Report","url":"https://www.undrr.org/report?id=42","identifier":"${id}","name":"R"}</script>`
    );
    const element = fixture(
      source === 'host' ? `data-mg-cite-this-id="${id}"` : ''
    );
    expect(resolveCitation(element).id).toBe(id);
    const opens = [];
    element.addEventListener('mg-cite-this:open', event =>
      opens.push(event.detail)
    );
    mgCiteThis(element);
    element.querySelector('.mg-cite-this__trigger').click();
    expect(opens[0].id).toBe(id);
  }
);

test('an editorial citation uses the configured URL for Copy citation URL', () => {
  const element = fixture(
    'data-mg-cite-this-citation="Approved." data-mg-cite-this-url="https://www.undrr.org/publication/report"'
  );
  expect(resolveCitation(element).url).toBe(
    'https://www.undrr.org/publication/report'
  );
});

test('RIS and BibTeX keep each field on one line and escape safely', () => {
  const fields = {
    ...reportFields,
    authors: ['A\\B {x}'],
    title: 'Title\nER  - \nTY  - BOOK',
    url: 'https://www.undrr.org/a?q={1}',
  };
  const ris = toRis(fields);
  expect(ris.match(/^TY {2}- /gm)).toHaveLength(1);
  expect(ris.match(/^ER {2}- /gm)).toHaveLength(1);
  expect(ris).toContain('TI  - Title ER  - TY  - BOOK\r\n');
  const bib = toBibtex(fields);
  expect(bib).toContain('author = {{A\\textbackslash{}B \\{x\\}}}');
  expect(bib).toContain('url = {https://www.undrr.org/a?q=%7B1%7D}');
  expect(bib).not.toContain('Title\n');
});

test.each([
  [
    'https://en.wikipedia.org/wiki/Risk_(statistics).',
    'https://en.wikipedia.org/wiki/Risk_(statistics)',
  ],
  ['(see https://www.undrr.org/x).', 'https://www.undrr.org/x'],
  ['“https://www.undrr.org/x”', 'https://www.undrr.org/x'],
  ['Available: https://www.undrr.org/x?', 'https://www.undrr.org/x'],
])('links %s as %s', (text, href) => {
  const element = fixture(`data-mg-cite-this-citation='${text}'`);
  mgCiteThis(element);
  expect(element.querySelector('[data-mg-cite-this-text] a')).toHaveAttribute(
    'href',
    href
  );
  expect(element.querySelector('[data-mg-cite-this-text]').textContent).toBe(
    text
  );
});

test('a failed copy from the field opens the dialog to copy manually', async () => {
  const element = fixture('data-mg-cite-this-title="Report"');
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: jest.fn().mockRejectedValue(new Error('denied')) },
  });
  const errors = [];
  element.addEventListener('mg-cite-this:copy-error', event =>
    errors.push(event.detail)
  );
  const opens = [];
  element.addEventListener('mg-cite-this:open', event =>
    opens.push(event.detail.placement)
  );
  mgCiteThis(element);
  element.querySelector('.mg-cite-this__preview').click();
  await Promise.resolve();
  await Promise.resolve();
  expect(element.querySelector('dialog').open).toBe(true);
  expect(
    element.querySelector('.mg-cite-this__dialog [data-mg-cite-this-status]')
  ).toHaveTextContent('Select the citation');
  expect(errors).toEqual([
    expect.objectContaining({ target: 'citation', placement: 'field' }),
  ]);
  expect(opens).toEqual(['copy-error']);
});

test.each(['close button', 'native close'])(
  'failed field copy returns focus to the field after %s, then normal opening returns to its trigger',
  async closePath => {
    const element = fixture('data-mg-cite-this-title="Report"');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn().mockRejectedValue(new Error('denied')) },
    });
    mgCiteThis(element);
    const preview = element.querySelector('.mg-cite-this__preview');
    const trigger = element.querySelector('.mg-cite-this__trigger');
    const dialog = element.querySelector('dialog');
    preview.focus();
    preview.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(document.activeElement).toBe(
      element.querySelector('.mg-cite-this__title')
    );
    if (closePath === 'close button') {
      element.querySelector('.mg-cite-this__close').click();
    } else {
      // Escape/native dismissal delivers the same close event.
      dialog.close();
    }
    expect(document.activeElement).toBe(preview);
    trigger.focus();
    trigger.click();
    dialog.close();
    expect(document.activeElement).toBe(trigger);
  }
);

test('a second module copy does not enhance an element twice', () => {
  const element = fixture('data-mg-cite-this-title="Report"');
  mgCiteThis(element);
  expect(element.dataset.mgCiteThisReady).toBe('');
  let second;
  jest.isolateModules(() => {
    second = require('../../../assets/js/cite-this');
  });
  expect(second.mgCiteThis).not.toBe(mgCiteThis);
  second.mgCiteThis(element);
  expect(element.querySelectorAll('.mg-cite-this__panel')).toHaveLength(1);
  expect(element.querySelectorAll('dialog')).toHaveLength(1);
  mgCiteThisDestroy(element);
  expect('mgCiteThisReady' in element.dataset).toBe(false);
});

test('destroy restores authored group attributes', () => {
  const element = fixture('data-mg-cite-this-title="Report"');
  element.setAttribute('role', 'region');
  mgCiteThis(element);
  expect(element).toHaveAttribute('role', 'group');
  mgCiteThisDestroy(element);
  expect(element).toHaveAttribute('role', 'region');
  expect(element).not.toHaveAttribute('aria-labelledby');
});

test('without dialog support the disclosure offers copying', async () => {
  HTMLDialogElement.prototype.showModal = undefined;
  const element = fixture('data-mg-cite-this-title="Report"');
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
  const copy = element.querySelector('[data-mg-cite-this-copy]');
  expect(copy).not.toHaveAttribute('hidden');
  copy.click();
  await Promise.resolve();
  expect(writeText).toHaveBeenCalled();
  expect(events).toEqual([
    expect.objectContaining({ placement: 'disclosure', layout: 'disclosure' }),
  ]);
  mgCiteThisDestroy(element);
  expect(copy).toHaveAttribute('hidden');
});

test('export and linked URL clicks are reported with their placement', () => {
  const element = fixture(
    'data-mg-cite-this-title="Report" data-mg-cite-this-url="https://www.undrr.org/report"'
  );
  const events = [];
  for (const name of ['export', 'visit'])
    element.addEventListener(`mg-cite-this:${name}`, event =>
      events.push([name, event.detail.placement, event.detail.format])
    );
  mgCiteThis(element);
  const click = target =>
    target.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true })
    );
  click(
    element.querySelector('.mg-cite-this__dialog [data-mg-cite-this-text] a')
  );
  click(element.querySelector('.mg-cite-this__export'));
  expect(events).toEqual([
    ['visit', 'dialog', undefined],
    ['export', 'dialog', 'ris'],
  ]);
});

test('interface text follows the page language and falls back to English', () => {
  expect(citeThisStrings('fr-CA').label).toBe('Citer');
  expect(citeThisStrings('zh-Hans').copy).toBe('复制引用');
  expect(citeThisStrings('pt-BR').label).toBe('Cite this');
  expect(citeThisStrings('').label).toBe('Cite this');

  document.documentElement.lang = 'es';
  document.body.innerHTML =
    '<div class="mg-cite-this" data-mg-cite-this></div>';
  const element = document.querySelector('[data-mg-cite-this]');
  mgCiteThis(element);
  expect(element.querySelector('.mg-cite-this__header')).toHaveTextContent(
    'Citar'
  );
  expect(element.querySelector('.mg-cite-this__more')).toHaveTextContent(
    'Todas las opciones de cita'
  );
  expect(element.querySelector('.mg-cite-this__preview').textContent).toMatch(
    /^Copiar la cita: /
  );
  expect(element.querySelector('.mg-cite-this__close')).toHaveAttribute(
    'aria-label',
    'Cerrar'
  );
  expect(
    [...element.querySelectorAll('.mg-cite-this__export')].map(
      link => link.textContent
    )
  ).toEqual(['Descargar RIS', 'Descargar BibTeX']);
});

test('the nearest lang attribute wins and data attributes still override', () => {
  document.documentElement.lang = 'en';
  document.body.innerHTML = `<section lang="fr"><div class="mg-cite-this" data-mg-cite-this data-mg-cite-this-copy-url-label="Copier le lien"></div></section>`;
  const element = document.querySelector('[data-mg-cite-this]');
  mgCiteThis(element);
  expect(element.querySelector('.mg-cite-this__header')).toHaveTextContent(
    'Citer'
  );
  expect(element.querySelector('.mg-cite-this__copy-url')).toHaveTextContent(
    'Copier le lien'
  );
});

test('the access date is written in the page language', () => {
  document.documentElement.lang = 'fr';
  document.head.insertAdjacentHTML(
    'beforeend',
    '<link rel="canonical" href="https://www.undrr.org/fr/terminologie">'
  );
  const citation = resolveCitation(fixture(), new Date('2026-09-25T12:00:00Z'));
  expect(citation.text).toBe(
    '«\u202FPage title\u202F», UNDRR, consulté le 25 septembre 2026, https://www.undrr.org/fr/terminologie.'
  );
});

test('controls carry fixed labels for the UNDRR click tracker', () => {
  document.documentElement.lang = 'fr';
  const element = fixture(
    'data-mg-cite-this-title="Rapport" data-mg-cite-this-url="https://www.undrr.org/fr/rapport"'
  );
  mgCiteThis(element);
  const label = selector =>
    element.querySelector(selector).dataset.vfAnalyticsLabel;
  expect(element).toHaveAttribute(
    'data-vf-google-analytics-region',
    'cite-this'
  );
  expect(label('.mg-cite-this__preview')).toBe(
    'Cite this: Copy citation (field)'
  );
  expect(label('.mg-cite-this__more')).toBe('Cite this: All citation options');
  expect(label('.mg-cite-this__dialog [data-mg-cite-this-copy]')).toBe(
    'Cite this: Copy citation (dialog)'
  );
  expect(label('.mg-cite-this__copy-url')).toBe('Cite this: Copy citation URL');
  expect(label('[data-mg-cite-this-format="ris"]')).toBe(
    'Cite this: Download RIS'
  );
  expect(label('.mg-cite-this__dialog [data-mg-cite-this-text] a')).toBe(
    'Cite this: Citation link'
  );
  expect(label('.mg-cite-this__close')).toBe('Cite this: Close');
  mgCiteThisDestroy(element);
  expect(element).not.toHaveAttribute('data-vf-google-analytics-region');
});

test('a host analytics region is kept', () => {
  const element = fixture(
    'data-vf-google-analytics-region="publication-actions"'
  );
  element.classList.add('mg-cite-this--compact');
  mgCiteThis(element);
  expect(element).toHaveAttribute(
    'data-vf-google-analytics-region',
    'publication-actions'
  );
  expect(
    element.querySelector('.mg-cite-this__trigger').dataset.vfAnalyticsLabel
  ).toBe('Cite this: Open');
  mgCiteThisDestroy(element);
  expect(element).toHaveAttribute(
    'data-vf-google-analytics-region',
    'publication-actions'
  );
});

test('title quotes, separators and digits follow each language', () => {
  document.head.insertAdjacentHTML(
    'beforeend',
    '<link rel="canonical" href="https://www.undrr.org/page">'
  );
  const now = new Date('2026-09-25T12:00:00Z');
  const cite = lang => {
    document.documentElement.lang = lang;
    return resolveCitation(fixture('data-mg-cite-this-title="T"'), now).text;
  };
  expect(cite('ru')).toBe(
    '«T», UNDRR, дата обращения: 25 сентября 2026 г., https://www.undrr.org/page.'
  );
  expect(cite('zh')).toMatch(/^《T》, UNDRR, 访问日期：2026年9月25日, /);
  expect(cite('ar-EG')).toBe(
    '“T”، UNDRR، تاريخ الاطلاع: 25 سبتمبر 2026، https://www.undrr.org/page.'
  );
});

test('the title and URLs are isolated for right-to-left pages', () => {
  document.documentElement.lang = 'ar';
  const element = fixture(
    'data-mg-cite-this-title="Global Assessment Report" data-mg-cite-this-url="https://www.undrr.org/gar"'
  );
  mgCiteThis(element);
  const text = element.querySelector(
    '.mg-cite-this__dialog [data-mg-cite-this-text]'
  );
  expect(text.querySelector('bdi')).toHaveTextContent(
    /^Global Assessment Report$/
  );
  expect(text.querySelector('a')).toHaveAttribute('dir', 'ltr');
  const preview = element.querySelector('.mg-cite-this__preview-text');
  expect(preview.querySelector('bdi')).not.toBeNull();
  expect(preview.querySelector('a')).toBeNull();
  expect(preview.querySelector('span[dir="ltr"]')).toHaveTextContent(
    'https://www.undrr.org/gar'
  );
});

test('an editorial citation is rendered without a title isolate', () => {
  const element = fixture('data-mg-cite-this-citation="Approved citation."');
  mgCiteThis(element);
  expect(element.querySelector('[data-mg-cite-this-text] bdi')).toBeNull();
});
