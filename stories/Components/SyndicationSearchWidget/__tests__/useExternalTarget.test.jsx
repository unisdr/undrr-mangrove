/**
 * @file useExternalTarget.test.jsx
 * @description facetsTarget and searchTarget re-resolve when the target
 * appears, is replaced or is removed after the widget mounts, as block
 * editors do with target blocks. See undrr/web-backlog#3175.
 */

import React from 'react';
import { render, waitFor, act, cleanup } from '@testing-library/react';
import { SyndicationSearchWidget } from '../SyndicationSearchWidget';

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
    expect(
      widget.querySelector(':scope > form[role="search"]')
    ).not.toBeInTheDocument();
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
});
