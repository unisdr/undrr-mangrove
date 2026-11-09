/**
 * @file useExternalTarget.test.jsx
 * @description facetsTarget and searchTarget re-resolve when the target
 * appears, is replaced or is removed after the widget mounts, as block
 * editors do with target blocks. See undrr/web-backlog#3175.
 */

import React from 'react';
import {
  render,
  waitFor,
  act,
  cleanup,
  fireEvent,
} from '@testing-library/react';
import { StrictMode } from 'react';
import { SyndicationSearchWidget } from '../SyndicationSearchWidget';
import { useExternalTarget } from '../hooks/useExternalTarget';

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

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        hits: { hits: [], total: { value: 0 } },
        aggregations: {},
        took: 1,
        results: [],
      }),
  });
});

function addTarget(doc, id) {
  const el = doc.createElement('div');
  el.id = id;
  doc.body.appendChild(el);
  return el;
}

describe('target re-resolution', () => {
  let warnSpy;
  const added = [];

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    added.splice(0).forEach(el => el.remove());
    warnSpy.mockRestore();
  });

  const add = id => {
    const el = addTarget(document, id);
    added.push(el);
    return el;
  };

  it('ignores unrelated DOM changes and batches shared ownership checks', async () => {
    add('settled-target');
    function Probe() {
      const rootRef = React.useRef(null);
      useExternalTarget('#settled-target', true, rootRef);
      return <div ref={rootRef} />;
    }
    render(Array.from({ length: 8 }, (_, i) => <Probe key={i} />));
    await act(async () => {});
    const styleSpy = jest.spyOn(window, 'getComputedStyle');
    try {
      await act(async () => {
        add('unrelated-content');
      });
      expect(styleSpy).not.toHaveBeenCalled();
      await act(async () => {
        window.dispatchEvent(new Event('resize'));
      });
      expect(styleSpy).toHaveBeenCalled();
      expect(styleSpy.mock.calls.length).toBeLessThanOrEqual(40);
    } finally {
      styleSpy.mockRestore();
    }
  });

  it('portals the search input into a target added after mount', async () => {
    render(<SyndicationSearchWidget config={{ searchTarget: '#late-hero' }} />);
    const widget = document.querySelector('[data-mg-search-widget]');
    expect(widget.querySelector('form[role="search"]')).not.toBeNull();

    let target;
    await act(async () => {
      target = add('late-hero');
    });

    await waitFor(() =>
      expect(target.querySelector('form[role="search"]')).not.toBeNull()
    );
    expect(widget.querySelector('form[role="search"]')).not.toBeInTheDocument();
  });

  it('warns once, not on every DOM change, while the target is missing', async () => {
    render(
      <SyndicationSearchWidget
        config={{ facets: 'sidebar', facetsTarget: '#never-there' }}
      />
    );

    await act(async () => {
      for (let i = 0; i < 5; i += 1) add(`unrelated-${i}`);
    });

    const targetWarnings = warnSpy.mock.calls.filter(([message]) =>
      String(message).includes('facetsTarget selector "#never-there"')
    );
    expect(targetWarnings).toHaveLength(1);
    expect(document.querySelector('.mg-search__sidebar')).not.toBeNull();
  });

  it('moves the facets to a replacement target and falls back when it goes', async () => {
    const first = add('facets-slot');
    render(
      <SyndicationSearchWidget
        config={{ facets: 'sidebar', facetsTarget: '#facets-slot' }}
      />
    );
    expect(first.querySelector('.mg-search__facets-external')).not.toBeNull();

    // The editor re-renders the target block as a new node.
    let second;
    await act(async () => {
      first.remove();
      second = add('facets-slot');
    });
    await waitFor(() =>
      expect(second.querySelector('.mg-search__facets-external')).not.toBeNull()
    );

    // The target block is deleted: facets return to the widget.
    await act(async () => {
      second.remove();
    });
    await waitFor(() =>
      expect(document.querySelector('.mg-search__sidebar')).not.toBeNull()
    );
  });

  it('resolves a late target inside the iframe the widget is mounted in', async () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const frameDoc = iframe.contentDocument;
    const container = frameDoc.createElement('div');
    frameDoc.body.appendChild(container);

    try {
      render(
        <SyndicationSearchWidget config={{ searchTarget: '#frame-hero' }} />,
        { container }
      );

      let target;
      await act(async () => {
        // A same-id node in the parent document must not be picked.
        add('frame-hero');
        target = addTarget(frameDoc, 'frame-hero');
      });

      await waitFor(() =>
        expect(target.querySelector('form[role="search"]')).not.toBeNull()
      );
      expect(
        document.getElementById('frame-hero').querySelector('form')
      ).toBeNull();
    } finally {
      cleanup();
      iframe.remove();
    }
  });

  // Regression: a selector that matches the widget's own markup used to
  // portal into it, which removed the match, fell back, matched again and
  // never settled.
  it.each([
    ['searchTarget', { searchTarget: '.mg-search__input-wrapper' }],
    [
      'facetsTarget',
      { facets: 'sidebar', facetsTarget: '.mg-search__sidebar' },
    ],
    ['the widget root', { searchTarget: '[data-mg-search-widget]' }],
  ])('ignores matches inside the widget (%s)', async (_, config) => {
    render(<SyndicationSearchWidget config={config} />);
    await act(async () => {});

    const widget = document.querySelector('[data-mg-search-widget]');
    expect(widget.querySelector('form[role="search"]')).not.toBeNull();
    expect(document.querySelector('.mg-search__form-external')).toBeNull();
    expect(document.querySelector('.mg-search__facets-external')).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('uses a match outside the widget when the selector also matches inside it', async () => {
    // The widget comes first in document order, so its own wrapper is the
    // first match for the selector.
    render(
      <SyndicationSearchWidget
        config={{ searchTarget: '.mg-search__input-wrapper' }}
      />
    );
    let outside;
    await act(async () => {
      outside = document.createElement('div');
      outside.className = 'mg-search__input-wrapper';
      added.push(outside);
      document.body.appendChild(outside);
    });
    await waitFor(() =>
      expect(outside.querySelector('form[role="search"]')).not.toBeNull()
    );
  });

  it('gives up and keeps the in-widget layout when the target keeps being removed', async () => {
    let slot = add('thrash-slot');
    // A host script that replaces the target whenever anything lands in it.
    const host = new MutationObserver(() => {
      if (slot.childNodes.length) {
        slot.remove();
        slot = add('thrash-slot');
      }
    });
    host.observe(document.body, { childList: true, subtree: true });

    try {
      render(
        <SyndicationSearchWidget config={{ searchTarget: '#thrash-slot' }} />
      );
      await waitFor(() =>
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('kept being removed')
        )
      );
      host.disconnect();
      await act(async () => {});
      const widget = document.querySelector('[data-mg-search-widget]');
      expect(widget.querySelector('form[role="search"]')).not.toBeNull();
    } finally {
      host.disconnect();
    }
  });

  it('warns once under StrictMode', async () => {
    render(
      <StrictMode>
        <SyndicationSearchWidget config={{ searchTarget: '#strict-missing' }} />
      </StrictMode>
    );
    await act(async () => {});
    const targetWarnings = warnSpy.mock.calls.filter(([message]) =>
      String(message).includes('searchTarget selector "#strict-missing"')
    );
    expect(targetWarnings).toHaveLength(1);
  });
});

describe('shared target ownership', () => {
  let searchTarget;
  let facetsTarget;
  const sharedConfig = {
    searchTarget: '#shared-search',
    facetsTarget: '#shared-facets',
    facets: 'horizontal',
    enableHashSync: false,
  };

  beforeEach(() => {
    searchTarget = addTarget(document, 'shared-search');
    facetsTarget = addTarget(document, 'shared-facets');
  });

  afterEach(() => {
    cleanup();
    searchTarget.remove();
    facetsTarget.remove();
  });

  function Pair({ secondActive = false, hiddenProps = { hidden: true } }) {
    return (
      <>
        <section {...(secondActive ? hiddenProps : {})}>
          <SyndicationSearchWidget
            config={{ ...sharedConfig, defaultQuery: 'Bonn' }}
          />
        </section>
        <section {...(secondActive ? {} : hiddenProps)}>
          <SyndicationSearchWidget
            config={{ ...sharedConfig, defaultQuery: 'training' }}
          />
        </section>
      </>
    );
  }

  const input = () => searchTarget.querySelector('input');

  it('transfers shared controls between tabs while preserving each query', async () => {
    const view = render(<Pair />);
    await waitFor(() => expect(input()).toHaveValue('Bonn'));
    expect(searchTarget.querySelectorAll('form')).toHaveLength(1);
    expect(
      facetsTarget.querySelectorAll('.mg-search__facets-external')
    ).toHaveLength(1);
    expect(document.querySelectorAll('.mg-search__facets-strip')).toHaveLength(
      0
    );

    fireEvent.change(input(), { target: { value: 'Bonn edited' } });
    view.rerender(<Pair secondActive />);
    await waitFor(() => expect(input()).toHaveValue('training'));
    expect(searchTarget.querySelectorAll('form')).toHaveLength(1);
    expect(
      facetsTarget.querySelectorAll('.mg-search__facets-external')
    ).toHaveLength(1);

    view.rerender(<Pair />);
    await waitFor(() => expect(input()).toHaveValue('Bonn edited'));
  });

  it.each([
    ['find-in-page disclosure', { hidden: 'until-found' }],
    ['ARIA hidden region', { 'aria-hidden': 'true' }],
    ['display style', { style: { display: 'none' } }],
    ['visibility style', { style: { visibility: 'hidden' } }],
  ])('excludes widgets in a hidden ancestor (%s)', async (_, hiddenProps) => {
    const view = render(<Pair hiddenProps={hiddenProps} />);
    await waitFor(() => expect(input()).toHaveValue('Bonn'));
    expect(searchTarget.querySelectorAll('form')).toHaveLength(1);
    view.rerender(<Pair secondActive hiddenProps={hiddenProps} />);
    await waitFor(() => expect(input()).toHaveValue('training'));
    expect(searchTarget.querySelectorAll('form')).toHaveLength(1);
  });

  it('rechecks CSS visibility on resize without requiring an attribute mutation', async () => {
    const style = document.createElement('style');
    style.textContent = '.shared-resize-test { display: block; }';
    document.head.append(style);
    try {
      render(
        <>
          <div className="shared-resize-test">
            <SyndicationSearchWidget
              config={{ ...sharedConfig, defaultQuery: 'first' }}
            />
          </div>
          <SyndicationSearchWidget
            config={{ ...sharedConfig, defaultQuery: 'second' }}
          />
        </>
      );
      await waitFor(() => expect(input()).toHaveValue('first'));
      await act(async () => {
        style.sheet.cssRules[0].style.display = 'none';
        window.dispatchEvent(new Event('resize'));
      });
      await waitFor(() => expect(input()).toHaveValue('second'));
    } finally {
      style.remove();
    }
  });

  it('allows the owning widget to put both control regions in the same target', async () => {
    render(
      <SyndicationSearchWidget
        config={{ ...sharedConfig, facetsTarget: '#shared-search' }}
      />
    );
    await waitFor(() =>
      expect(searchTarget.querySelectorAll('form')).toHaveLength(1)
    );
    expect(
      searchTarget.querySelectorAll('.mg-search__facets-external')
    ).toHaveLength(1);
  });

  it('transfers controls when native disclosures open and close', async () => {
    const view = render(
      <>
        <details>
          <summary>First</summary>
          <SyndicationSearchWidget
            config={{ ...sharedConfig, defaultQuery: 'first' }}
          />
        </details>
        <details open>
          <summary>Second</summary>
          <SyndicationSearchWidget
            config={{ ...sharedConfig, defaultQuery: 'second' }}
          />
        </details>
      </>
    );
    await waitFor(() => expect(input()).toHaveValue('second'));
    const disclosures = view.container.querySelectorAll('details');
    await act(async () => {
      disclosures[0].open = true;
      disclosures[1].open = false;
    });
    await waitFor(() => expect(input()).toHaveValue('first'));
    expect(searchTarget.querySelectorAll('form')).toHaveLength(1);
  });

  it('uses document order rather than mount order and transfers on unmount', async () => {
    const firstSlot = document.createElement('div');
    const secondSlot = document.createElement('div');
    document.body.append(firstSlot, secondSlot);
    try {
      render(
        <SyndicationSearchWidget
          config={{ ...sharedConfig, defaultQuery: 'second' }}
        />,
        { container: secondSlot }
      );
      await waitFor(() => expect(input()).toHaveValue('second'));
      const first = render(
        <SyndicationSearchWidget
          config={{ ...sharedConfig, defaultQuery: 'first' }}
        />,
        { container: firstSlot }
      );
      await waitFor(() => expect(input()).toHaveValue('first'));
      expect(searchTarget.querySelectorAll('form')).toHaveLength(1);
      first.unmount();
      await waitFor(() => expect(input()).toHaveValue('second'));
      expect(searchTarget.querySelectorAll('form')).toHaveLength(1);
    } finally {
      cleanup();
      firstSlot.remove();
      secondSlot.remove();
    }
  });

  it('respects an outer hidden ancestor even when an inner region has aria-hidden=false', async () => {
    render(
      <>
        <div hidden>
          <div aria-hidden="false">
            <SyndicationSearchWidget
              config={{ ...sharedConfig, defaultQuery: 'hidden' }}
            />
          </div>
        </div>
        <SyndicationSearchWidget
          config={{ ...sharedConfig, defaultQuery: 'visible' }}
        />
      </>
    );
    await waitFor(() => expect(input()).toHaveValue('visible'));
    expect(searchTarget.querySelectorAll('form')).toHaveLength(1);
  });

  it('observes classes that change ancestor visibility without depending on viewport geometry', async () => {
    const style = document.createElement('style');
    style.textContent = '.shared-test-hidden { display: none; }';
    document.head.append(style);
    try {
      const view = render(
        <Pair hiddenProps={{ className: 'shared-test-hidden' }} />
      );
      await waitFor(() => expect(input()).toHaveValue('Bonn'));
      view.rerender(
        <Pair secondActive hiddenProps={{ className: 'shared-test-hidden' }} />
      );
      await waitFor(() => expect(input()).toHaveValue('training'));
      expect(searchTarget.querySelectorAll('form')).toHaveLength(1);
    } finally {
      style.remove();
    }
  });
});
