import React from 'react';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import { axe } from 'jest-axe';
import SearchExport from '../components/SearchExport';
import {
  SearchProvider,
  useSearchDispatch,
  actions,
} from '../context/SearchContext';
import { getSyndicationSearchWidgetLabels } from '../_labels';

let dispatch;
function Capture() {
  dispatch = useSearchDispatch();
  return null;
}
const hit = {
  _id: '42',
  _source: { title: 'Risk', nid: [42], type: ['publication'] },
};
const response = (total = 1) => ({
  hits: { total: { value: total, relation: 'eq' }, hits: total ? [hit] : [] },
});
const config = {
  exportLimit: 1,
  exportContactUrl: '/contact',
  defaultFilters: [],
  enableHashSync: false,
};
function setup() {
  const view = isStale => (
    <SearchProvider config={config}>
      <Capture />
      <SearchExport isStale={isStale} />
    </SearchProvider>
  );
  const rendered = render(view(false));
  act(() => {
    dispatch(actions.initialize({}));
    dispatch(actions.setResults(response()));
  });
  return { ...rendered, stale: value => rendered.rerender(view(value)) };
}
let click;
const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => response(25) });
  URL.createObjectURL = jest.fn().mockReturnValue('blob:export');
  URL.revokeObjectURL = jest.fn();
  click = jest
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => {});
});
afterEach(() => {
  click.mockRestore();
  global.fetch = originalFetch;
});

test('downloads the configured first records and reports truncation with a contact link', async () => {
  setup();
  const button = screen.getByRole('button', { name: 'Download results (CSV)' });
  expect(button).toHaveAccessibleDescription(
    expect.stringContaining('first 1 matching records')
  );
  button.focus();
  fireEvent.click(button);
  await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
  expect(button).toHaveFocus();
  expect(click.mock.instances[0].download).toMatch(
    /^search-results-\d{4}-\d{2}-\d{2}\.csv$/
  );
  expect(screen.getByRole('status')).toHaveTextContent('first 1 of 25');
  expect(screen.getByRole('link', { name: 'Contact us' })).toHaveAttribute(
    'href',
    '/contact'
  );
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
    from: 0,
    size: 1,
    track_total_hits: true,
  });
});

test('supports JSON and keeps repeated clicks from making parallel requests', async () => {
  let resolve;
  fetch.mockReturnValue(
    new Promise(done => {
      resolve = done;
    })
  );
  setup();
  const button = screen.getByRole('button', {
    name: 'Download results (JSON)',
  });
  fireEvent.click(button);
  expect(button).toHaveAttribute('aria-disabled', 'true');
  expect(button).not.toBeDisabled();
  expect(screen.getByRole('status')).toHaveTextContent('Preparing download');
  fireEvent.click(button);
  fireEvent.click(
    screen.getByRole('button', { name: 'Download results (CSV)' })
  );
  expect(fetch).toHaveBeenCalledTimes(1);
  await act(async () => resolve({ ok: true, json: async () => response() }));
  expect(click.mock.instances[0].download).toMatch(/\.json$/);
  expect(screen.getByRole('status')).toHaveTextContent('1 of 1');
});

test.each(['input', 'query', 'unmount'])(
  'aborts on %s changes and ignores stale responses',
  async change => {
    let resolve;
    fetch.mockReturnValue(
      new Promise(done => {
        resolve = done;
      })
    );
    const view = setup();
    fireEvent.click(
      screen.getByRole('button', { name: 'Download results (CSV)' })
    );
    const signal = fetch.mock.calls[0][1].signal;
    if (change === 'input') view.stale(true);
    if (change === 'query') act(() => dispatch(actions.setQuery('new query')));
    if (change === 'unmount') view.unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => resolve({ ok: true, json: async () => response() }));
    expect(click).not.toHaveBeenCalled();
    if (change === 'input') {
      view.stale(false);
      expect(
        screen.getByRole('button', { name: 'Download results (CSV)' })
      ).not.toHaveAttribute('aria-disabled');
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    }
  }
);

test.each(['http', 'partial', 'network'])(
  'announces %s failure and permits retry',
  async failure => {
    setup();
    if (failure === 'http') fetch.mockResolvedValue({ ok: false });
    if (failure === 'partial')
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ...response(), timed_out: true }),
      });
    if (failure === 'network') fetch.mockRejectedValue(new Error('offline'));
    fireEvent.click(
      screen.getByRole('button', { name: 'Download results (CSV)' })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'could not be completed'
    );
    expect(click).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Download results (CSV)' })
    ).not.toHaveAttribute('aria-disabled');
  }
);

test('reports fresh empty results without creating a file and disables known empty searches', async () => {
  setup();
  fetch.mockResolvedValue({ ok: true, json: async () => response(0) });
  fireEvent.click(
    screen.getByRole('button', { name: 'Download results (CSV)' })
  );
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('No matching records')
  );
  expect(click).not.toHaveBeenCalled();
  act(() => dispatch(actions.setResults(response(0))));
  expect(
    screen.getByRole('button', { name: 'Download results (CSV)' })
  ).toBeDisabled();
});

test('has no accessibility violations and preserves language overrides', async () => {
  const { container } = setup();
  expect(await axe(container)).toHaveNoViolations();
  const ar = getSyndicationSearchWidgetLabels('ar', {
    exportCsv: 'Custom CSV',
  });
  expect(ar.exportCsv).toBe('Custom CSV');
  for (const lang of ['es', 'fr', 'ja', 'zh', 'ar', 'ru']) {
    const labels = getSyndicationSearchWidgetLabels(lang);
    expect(labels.exportScope).toContain('{limit}');
    expect(labels.exportLimited).toContain('{count}');
    expect(labels.exportLimited).toContain('{total}');
    expect(labels.exportContactLink).not.toBe('Contact us');
  }
});
