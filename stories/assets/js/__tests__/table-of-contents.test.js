import { mgTableOfContents, mgTableOfContentsInit } from '../table-of-contents';

afterEach(() => {
  document.body.innerHTML = '';
});

function setupPage({ contentSelector, title, showTitle, skipAutoInit } = {}) {
  document.body.innerHTML = `
    <article class="mg-content">
      <section
        data-mg-table-of-contents
        ${contentSelector ? `data-mg-table-of-contents-content="${contentSelector}"` : ''}
        ${title ? `data-mg-table-of-contents-title="${title}"` : ''}
        ${showTitle === false ? 'data-mg-table-of-contents-show-title="false"' : ''}
        ${skipAutoInit ? 'data-mg-table-of-contents-skip-auto-init' : ''}
        class="mg-table-of-contents"
      ></section>
      <h2 id="section-a">Section A</h2>
      <p>Content A</p>
      <h2>Section B</h2>
      <p>Content B</p>
      <h2 class="mg-table-of-contents--exclude">Excluded</h2>
      <p>Should not appear</p>
      <h2 class="mg-u-sr-only">Screen reader only</h2>
      <p>Should not appear</p>
      <h2>Section C</h2>
      <p>Content C</p>
    </article>
  `;
  return {
    toc: document.querySelector('[data-mg-table-of-contents]'),
    content: document.querySelector('.mg-content'),
  };
}

describe('mgTableOfContents', () => {
  it('generates TOC links from h2 headings', () => {
    const { toc, content } = setupPage();
    mgTableOfContents(content, toc);

    const links = toc.querySelectorAll('li a');
    expect(links).toHaveLength(3);
    expect(links[0].textContent).toBe('Section A');
    expect(links[1].textContent).toBe('Section B');
    expect(links[2].textContent).toBe('Section C');
  });

  it('uses existing heading IDs', () => {
    const { toc, content } = setupPage();
    mgTableOfContents(content, toc);

    const links = toc.querySelectorAll('li a');
    expect(links[0].getAttribute('href')).toBe('#section-a');
  });

  it('generates IDs for headings without them', () => {
    const { toc, content } = setupPage();
    mgTableOfContents(content, toc);

    // Index 2 because mgTableOfContents prepends an h2 title to the TOC
    // element which is inside content: [0]=title, [1]=Section A, [2]=Section B
    const sectionB = content.querySelectorAll('h2')[2];
    expect(sectionB.id).toBe('section-b');

    const links = toc.querySelectorAll('li a');
    expect(links[1].getAttribute('href')).toBe('#section-b');
  });

  it('excludes headings with mg-table-of-contents--exclude', () => {
    const { toc, content } = setupPage();
    mgTableOfContents(content, toc);

    const linkTexts = Array.from(toc.querySelectorAll('li a')).map(
      a => a.textContent
    );
    expect(linkTexts).not.toContain('Excluded');
  });

  it('excludes headings with mg-u-sr-only', () => {
    const { toc, content } = setupPage();
    mgTableOfContents(content, toc);

    const linkTexts = Array.from(toc.querySelectorAll('li a')).map(
      a => a.textContent
    );
    expect(linkTexts).not.toContain('Screen reader only');
  });

  it('adds default title "On this page"', () => {
    const { toc, content } = setupPage();
    mgTableOfContents(content, toc);

    const header = toc.querySelector('h2#on-this-page');
    expect(header).not.toBeNull();
    expect(header.textContent).toBe('On this page');
  });

  it('uses custom title from data attribute', () => {
    const { toc, content } = setupPage({ title: 'Contents' });
    mgTableOfContents(content, toc);

    const header = toc.querySelector('h2#on-this-page');
    expect(header.textContent).toBe('Contents');
  });

  it('hides title when show-title is false', () => {
    const { toc, content } = setupPage({ showTitle: false });
    mgTableOfContents(content, toc);

    const header = toc.querySelector('h2#on-this-page');
    expect(header).toBeNull();
  });

  it('adds mg-u-sr-only class when title is "hidden"', () => {
    const { toc, content } = setupPage({ title: 'hidden' });
    mgTableOfContents(content, toc);

    const header = toc.querySelector('h2#on-this-page');
    expect(header.classList.contains('mg-u-sr-only')).toBe(true);
  });

  it('renders ordered list when showNumbers is true', () => {
    const { toc, content } = setupPage();
    mgTableOfContents(content, toc, true);

    expect(toc.querySelector('ol')).not.toBeNull();
    expect(toc.querySelector('ul')).toBeNull();
  });

  it('logs error when content element is missing', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { toc } = setupPage();
    mgTableOfContents(null, toc);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});

describe('mgTableOfContentsInit', () => {
  it('auto-initializes elements with data-mg-table-of-contents', () => {
    const { toc } = setupPage({ contentSelector: '.mg-content' });
    mgTableOfContentsInit();

    expect(toc.dataset.mgTableOfContentsInitialized).toBe('true');
    expect(toc.querySelectorAll('li a').length).toBeGreaterThan(0);
  });

  it('skips elements with skip-auto-init during auto-init', () => {
    const { toc } = setupPage({ skipAutoInit: true });
    mgTableOfContentsInit(); // no scope = auto-init path
    expect(toc.dataset.mgTableOfContentsInitialized).toBeUndefined();
  });

  it('processes skip-auto-init elements when scope is passed explicitly', () => {
    const { toc } = setupPage({
      skipAutoInit: true,
      contentSelector: '.mg-content',
    });
    mgTableOfContentsInit([toc]);
    expect(toc.dataset.mgTableOfContentsInitialized).toBe('true');
  });

  it('does not double-initialize', () => {
    const { toc } = setupPage({ contentSelector: '.mg-content' });
    mgTableOfContentsInit();
    const linkCountFirst = toc.querySelectorAll('li a').length;

    mgTableOfContentsInit();
    const linkCountSecond = toc.querySelectorAll('li a').length;
    expect(linkCountSecond).toBe(linkCountFirst);
  });

  it('accepts a single HTMLElement as scope', () => {
    const { toc } = setupPage({ contentSelector: '.mg-content' });
    expect(() => mgTableOfContentsInit(toc)).not.toThrow();
    expect(toc.dataset.mgTableOfContentsInitialized).toBe('true');
  });

  it('defaults to document.body when no content selector is set', () => {
    const { toc } = setupPage(); // no contentSelector
    mgTableOfContentsInit();

    // Should still find headings since they're children of document.body
    expect(toc.querySelectorAll('li a').length).toBeGreaterThan(0);
  });
});
