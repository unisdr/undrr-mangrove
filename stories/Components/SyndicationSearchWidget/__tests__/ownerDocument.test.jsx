/**
 * @file ownerDocument.test.jsx
 * @description The widget resolves document lookups in the document it is
 * mounted in, not the global `document`.
 *
 * A block editor that renders its canvas in an iframe (Drupal's Gutenberg 4)
 * runs block JavaScript in the parent window while the widget and its target
 * regions live in the iframe's document. These tests mount the widget into a
 * jsdom iframe and check every lookup lands there. See
 * undrr/web-backlog#3157.
 */

import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from '@testing-library/react';
import { SyndicationSearchWidget } from '../SyndicationSearchWidget';
import { SearchProvider } from '../context/SearchContext';
import { SelectDropdown } from '../components/SelectDropdown';
import { MobileFilterDrawer } from '../components/MobileFilterDrawer';
import { getOwnerDocument, resolveTarget } from '../utils/ownerDocument';

const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      args[0]?.includes?.('not wrapped in act') ||
      args[0]?.includes?.('Search error') ||
      args[0]?.includes?.('Failed to fetch taxonomies')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useTransition: () => [false, fn => fn()],
  useDeferredValue: value => value,
}));

function mockFetch(total = 0) {
  return jest.fn().mockImplementation(url => {
    if (url && url.includes('preventionweb.net/api')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          hits: {
            hits: total
              ? [
                  {
                    _id: '1',
                    _source: {
                      title: 'Test Result',
                      teaser: 'Test teaser content',
                      url: '/test-url',
                      type: 'news',
                    },
                  },
                ]
              : [],
            total: { value: total },
          },
          aggregations: {},
          took: 10,
        }),
    });
  });
}

/**
 * Create an iframe in the global document and return its document, with a
 * mount point for the widget in its body.
 */
function createFrame() {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  const frameDoc = iframe.contentDocument;
  const container = frameDoc.createElement('div');
  frameDoc.body.appendChild(container);
  return { iframe, frameDoc, container };
}

function addTarget(doc, id) {
  const el = doc.createElement('div');
  el.id = id;
  doc.body.appendChild(el);
  return el;
}

describe('getOwnerDocument and resolveTarget', () => {
  it('returns the global document for a node in it, or no node', () => {
    const el = document.createElement('div');
    expect(getOwnerDocument(el)).toBe(document);
    expect(getOwnerDocument(null)).toBe(document);
    expect(getOwnerDocument(undefined)).toBe(document);
  });

  it('returns the document a node belongs to when it is not the global one', () => {
    const other = document.implementation.createHTMLDocument('other');
    const el = other.createElement('div');
    expect(getOwnerDocument(el)).toBe(other);
  });

  it('matches a selector in the node’s document only', () => {
    const other = document.implementation.createHTMLDocument('other');
    const inOther = addTarget(other, 'target-x');
    const inGlobal = addTarget(document, 'target-x');
    const node = other.createElement('div');
    other.body.appendChild(node);

    try {
      expect(resolveTarget('#target-x', node)).toBe(inOther);
      expect(resolveTarget('#target-x', null)).toBe(inGlobal);
      expect(resolveTarget('', node)).toBeNull();
    } finally {
      inGlobal.remove();
    }
  });
});

describe('SyndicationSearchWidget mounted in an iframe', () => {
  let frame;

  beforeEach(() => {
    global.fetch = mockFetch();
    frame = createFrame();
  });

  // Unmount before the iframe goes: removing it first detaches the
  // document React still holds portals in.
  afterEach(() => {
    cleanup();
    frame.iframe.remove();
  });

  it('portals facets into the facetsTarget in the iframe document', () => {
    const frameTarget = addTarget(frame.frameDoc, 'facets-sidebar');
    // A same-id element in the parent document must not be picked.
    const decoy = addTarget(document, 'facets-sidebar');

    try {
      render(
        <SyndicationSearchWidget
          config={{ facets: 'sidebar', facetsTarget: '#facets-sidebar' }}
        />,
        { container: frame.container }
      );

      expect(
        frameTarget.querySelector('.mg-search__facets-external')
      ).not.toBeNull();
      expect(decoy.querySelector('.mg-search__facets-external')).toBeNull();
      expect(frame.container.querySelector('.mg-search__sidebar')).toBeNull();
    } finally {
      decoy.remove();
    }
  });

  it('portals the search input into the searchTarget in the iframe document', () => {
    const frameTarget = addTarget(frame.frameDoc, 'hero-search');
    const decoy = addTarget(document, 'hero-search');

    try {
      render(
        <SyndicationSearchWidget config={{ searchTarget: '#hero-search' }} />,
        {
          container: frame.container,
        }
      );

      expect(frameTarget.querySelector('form[role="search"]')).not.toBeNull();
      expect(decoy.querySelector('form[role="search"]')).toBeNull();
    } finally {
      decoy.remove();
    }
  });

  it('falls back to the in-widget layout when the target exists only in the parent document', () => {
    const parentOnly = addTarget(document, 'parent-only-facets');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      render(
        <SyndicationSearchWidget
          config={{ facets: 'sidebar', facetsTarget: '#parent-only-facets' }}
        />,
        { container: frame.container }
      );

      expect(parentOnly.childElementCount).toBe(0);
      expect(
        frame.container.querySelector('.mg-search__sidebar')
      ).not.toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('facetsTarget selector "#parent-only-facets"')
      );
    } finally {
      warnSpy.mockRestore();
      parentOnly.remove();
    }
  });

  it('scrolls the widget in the iframe document when paging', async () => {
    jest.useFakeTimers();
    global.fetch = mockFetch(40);
    const scrolled = [];
    const FrameElement = frame.iframe.contentWindow.Element;
    FrameElement.prototype.scrollIntoView = function scrollIntoView() {
      scrolled.push(this);
    };

    try {
      render(
        <SyndicationSearchWidget
          config={{ debounceDelay: 100, resultsPerPage: 10 }}
        />,
        { container: frame.container }
      );

      const widget = frame.container.querySelector('[data-mg-search-widget]');
      const input = widget.querySelector('input[type="search"]');
      fireEvent.change(input, { target: { value: 'test' } });

      act(() => {
        jest.advanceTimersByTime(200);
      });
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });

      await waitFor(
        () => {
          expect(widget.querySelector('.mg-pager')).not.toBeNull();
        },
        { timeout: 2000 }
      );

      await act(async () => {
        fireEvent.click(
          widget.querySelector('.mg-pager button[aria-label="Go to next page"]')
        );
      });

      expect(scrolled).toEqual([widget]);
    } finally {
      delete FrameElement.prototype.scrollIntoView;
      jest.useRealTimers();
    }
  });
});

describe('Widget parts mounted in an iframe', () => {
  let frame;

  beforeEach(() => {
    global.fetch = mockFetch();
    frame = createFrame();
  });

  // Unmount before the iframe goes: removing it first detaches the
  // document React still holds portals in.
  afterEach(() => {
    cleanup();
    frame.iframe.remove();
  });

  it('portals the dropdown backdrop into the iframe body', () => {
    render(
      <SelectDropdown
        id="type"
        label="Type"
        options={[{ value: 'news', label: 'News' }]}
        onChange={() => {}}
      />,
      { container: frame.container }
    );

    fireEvent.click(frame.container.querySelector('.mg-select__trigger'));

    expect(
      frame.frameDoc.body.querySelector(':scope > .mg-select__backdrop')
    ).not.toBeNull();
    expect(document.querySelector('.mg-select__backdrop')).toBeNull();
  });

  it('keeps a drawer dropdown backdrop inside the iframe drawer', () => {
    render(
      <SearchProvider config={{ visibleFilters: [] }}>
        <MobileFilterDrawer isOpen onClose={() => {}} widgetId="w" />
      </SearchProvider>,
      { container: frame.container }
    );
    const drawer = frame.container.querySelector('.mg-search__drawer');
    fireEvent.click(drawer.querySelector('.mg-select__trigger'));
    expect(
      drawer.querySelector(':scope > .mg-select__backdrop')
    ).not.toBeNull();
    expect(
      frame.frameDoc.body.querySelector(':scope > .mg-select__backdrop')
    ).toBeNull();
    expect(document.querySelector('.mg-select__backdrop')).toBeNull();
  });

  it('locks scroll on and listens for Escape in the iframe document', () => {
    const onClose = jest.fn();
    render(
      <SearchProvider config={{}}>
        <MobileFilterDrawer isOpen onClose={onClose} widgetId="w" />
      </SearchProvider>,
      { container: frame.container }
    );

    expect(frame.frameDoc.body.style.overflow).toBe('hidden');
    expect(document.body.style.overflow).not.toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(frame.frameDoc, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
