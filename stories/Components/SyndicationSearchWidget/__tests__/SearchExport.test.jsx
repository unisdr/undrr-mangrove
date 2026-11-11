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
import { WidgetRootContext } from '../context/WidgetRootContext';
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
  exportDefaultCount: 1,
  exportContactUrl: '/contact',
  defaultFilters: [],
  enableHashSync: false,
};
function setup(
  open = true,
  labels = {},
  searchResult = response(25),
  configOverrides = {}
) {
  const view = isStale => (
    <SearchProvider config={{ ...config, ...configOverrides }} labels={labels}>
      <Capture />
      <SearchExport isStale={isStale} />
    </SearchProvider>
  );
  const rendered = render(view(false));
  act(() => {
    dispatch(actions.initialize({ ...config, ...configOverrides }));
    dispatch(actions.setResults(searchResult));
  });
  if (open)
    fireEvent.click(
      screen.getByRole('button', {
        name: labels.exportOpen || 'Download results',
      })
    );
  return { ...rendered, stale: value => rendered.rerender(view(value)) };
}
const quantityInput = () => screen.getAllByRole('spinbutton').at(0);
let click;
const originalFetch = global.fetch;
beforeAll(() => {
  window.PointerEvent = MouseEvent;
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

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
  expect(quantityInput()).toHaveAccessibleDescription('25 results available');
  const button = screen.getByRole('button', { name: 'Download CSV' });
  expect(button).toHaveAccessibleDescription(
    expect.stringContaining('current terms, filters and sort order')
  );
  button.focus();
  fireEvent.click(button);
  await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
  expect(button).toHaveFocus();
  expect(click.mock.instances[0].download).toMatch(
    /^search-results-\d{4}-\d{2}-\d{2}\.csv$/
  );
  expect(screen.getByRole('status')).toHaveTextContent('results 1–1 of 25');
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
    name: 'Download JSON',
  });
  fireEvent.click(button);
  expect(button).toHaveAttribute('aria-disabled', 'true');
  expect(button).not.toBeDisabled();
  expect(screen.getByRole('status')).toHaveTextContent('Preparing download');
  fireEvent.click(button);
  fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
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
    fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
    const signal = fetch.mock.calls[0][1].signal;
    if (change === 'input') view.stale(true);
    if (change === 'query') act(() => dispatch(actions.setQuery('new query')));
    if (change === 'unmount') view.unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => resolve({ ok: true, json: async () => response() }));
    expect(click).not.toHaveBeenCalled();
    if (change === 'input') {
      view.stale(false);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Download results' }));
      expect(
        screen.getByRole('button', { name: 'Download CSV' })
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
    fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'could not be completed'
    );
    expect(click).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Download CSV' })
    ).not.toHaveAttribute('aria-disabled');
  }
);

test('reports fresh empty results without creating a file and disables known empty searches', async () => {
  setup();
  fetch.mockResolvedValue({ ok: true, json: async () => response(0) });
  fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(
      'No results are available from this position'
    )
  );
  expect(click).not.toHaveBeenCalled();
  act(() => dispatch(actions.setResults(response(0))));
  expect(screen.getByRole('button', { name: 'Download CSV' })).toBeDisabled();
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
    expect(labels.exportCountLabel).not.toBe('Number of results');
    expect(labels.exportCountError).not.toBe(
      'Enter a whole number from 1 to 25.'
    );
    expect(labels.exportLimited({ start: 1, end: 3, total: 25 })).toContain(
      '25'
    );
    expect(labels.exportContactLink).not.toBe('Contact us');
  }
});

test('offers one optional CTA that opens both formats in a labelled modal', () => {
  setup(false, {}, response(1000));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Download CSV' })
  ).not.toBeInTheDocument();
  const trigger = screen.getByRole('button', { name: 'Download results' });
  expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  fireEvent.click(trigger);
  const dialog = screen.getByRole('dialog', {
    name: 'Download results',
  });
  expect(dialog).toHaveAttribute('open');
  expect(dialog).toHaveAccessibleDescription(
    expect.stringContaining('current terms, filters and sort order')
  );
  expect(
    screen.getByRole('heading', { name: 'Download results' })
  ).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Download CSV' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Download JSON' })).toBeVisible();
  const quantity = quantityInput();
  expect(quantity).toHaveAccessibleName('Number of results');
  expect(
    quantity.compareDocumentPosition(
      screen.getByRole('spinbutton', { name: 'Start at result' })
    )
  ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  const fields = screen
    .getByText('Fields to include', { selector: 'summary' })
    .closest('summary');
  const format = screen.getByRole('region', { name: 'Download as' });
  expect(quantity.compareDocumentPosition(fields)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
  );
  expect(fields.compareDocumentPosition(format)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
  );
  expect(format).toContainElement(screen.getByRole('status'));
  expect(
    screen.getByRole('button', { name: 'Download CSV' })
  ).toHaveAccessibleDescription(
    expect.stringContaining('CSV for spreadsheets; JSON for software.')
  );
  expect(document.documentElement.style.overflow).toBe('hidden');
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(document.documentElement.style.overflow).toBe('');
});

test('Close cancels a pending export and reopening starts a fresh session', async () => {
  let resolve;
  fetch.mockReturnValue(
    new Promise(done => {
      resolve = done;
    })
  );
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
  const signal = fetch.mock.calls[0][1].signal;
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(signal.aborted).toBe(true);
  expect(
    screen.getByRole('button', { name: 'Download results' })
  ).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'Download results' }));
  await act(async () => resolve({ ok: true, json: async () => response() }));
  expect(click).not.toHaveBeenCalled();
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
  expect(
    screen.getByRole('button', { name: 'Download CSV' })
  ).not.toHaveAttribute('aria-disabled');
});

test('native cancellation and genuine backdrop presses close and restore focus', () => {
  setup();
  fireEvent(
    screen.getByRole('dialog'),
    new Event('cancel', { bubbles: false, cancelable: true })
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  const trigger = screen.getByRole('button', { name: 'Download results' });
  expect(trigger).toHaveFocus();
  fireEvent.click(trigger);
  const dialog = screen.getByRole('dialog');
  dialog.getBoundingClientRect = () => ({
    left: 10,
    right: 100,
    top: 10,
    bottom: 100,
  });
  fireEvent.pointerDown(screen.getByRole('heading', { level: 2 }), {
    clientX: 20,
    clientY: 20,
  });
  fireEvent.click(dialog, { clientX: 150, clientY: 150 });
  expect(dialog).toHaveAttribute('open');
  fireEvent.pointerDown(dialog, { clientX: 150, clientY: 150 });
  fireEvent.click(dialog, { clientX: 150, clientY: 150 });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

test('restores existing scroll declarations and priorities after dismissal', () => {
  const root = document.documentElement;
  root.style.setProperty('overflow-x', 'clip', 'important');
  root.style.setProperty('overflow-y', 'scroll');
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(root.style.getPropertyValue('overflow-x')).toBe('clip');
  expect(root.style.getPropertyPriority('overflow-x')).toBe('important');
  expect(root.style.getPropertyValue('overflow-y')).toBe('scroll');
  root.style.removeProperty('overflow-x');
  root.style.removeProperty('overflow-y');
});

test('invalidating input focuses the connected results region when the CTA becomes disabled', () => {
  const rootRef = { current: null };
  const view = stale => (
    <SearchProvider config={config}>
      <WidgetRootContext value={rootRef}>
        <div
          ref={element => {
            rootRef.current = element;
          }}
        >
          <Capture />
          <div className="mg-search__main">
            <SearchExport isStale={stale} />
          </div>
        </div>
      </WidgetRootContext>
    </SearchProvider>
  );
  const { container, rerender } = render(view(false));
  act(() => {
    dispatch(actions.initialize({}));
    dispatch(actions.setResults(response()));
  });
  fireEvent.click(screen.getByRole('button', { name: 'Download results' }));
  expect(
    screen.getByRole('heading', { name: 'Download results' })
  ).toHaveFocus();
  rerender(view(true));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  const main = container.querySelector('.mg-search__main');
  expect(main).toHaveFocus();
  expect(main).not.toHaveAttribute('tabindex');
  expect(document.documentElement.style.overflow).toBe('');
});

const blobText = blob =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(blob);
  });

function revealFields() {
  const summary = screen
    .getByText('Fields to include', { selector: 'summary' })
    .closest('summary');
  if (!summary.closest('details').open) fireEvent.click(summary);
  return screen.getAllByRole('checkbox');
}

test('optional fields have useful defaults, keep core fields and reset on reopening', () => {
  setup();
  expect(
    screen.getByRole('group', { name: 'Fields to include' }).closest('details')
  ).toHaveAttribute('open');
  const checkboxes = revealFields();
  expect(checkboxes).toHaveLength(8);
  for (const checkbox of checkboxes) expect(checkbox).toBeChecked();
  expect(
    screen.getByRole('group', { name: 'Fields to include' })
  ).toHaveAccessibleDescription(
    'Record ID and URL are always included. These choices apply to both formats.'
  );
  fireEvent.click(screen.getByRole('checkbox', { name: 'Title' }));
  expect(screen.getByRole('checkbox', { name: 'Title' })).not.toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  fireEvent.click(screen.getByRole('button', { name: 'Download results' }));
  expect(
    screen.getByRole('group', { name: 'Fields to include' }).closest('details')
  ).toHaveAttribute('open');
  for (const checkbox of revealFields()) expect(checkbox).toBeChecked();
});

test('clearing all optional groups exports only ID and URL in both formats', async () => {
  setup();
  for (const checkbox of revealFields()) fireEvent.click(checkbox);
  fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
  await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(1));
  const csv = await blobText(URL.createObjectURL.mock.calls[0][0]);
  expect(csv.split('\r\n')[0]).toBe('"id","url"');
  fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));
  await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(2));
  const data = JSON.parse(await blobText(URL.createObjectURL.mock.calls[1][0]));
  expect(data.scope.fields).toEqual(['id', 'url']);
  expect(Object.keys(data.records[0])).toEqual(['id', 'url']);
});

test('field editing is unavailable during a pending download and the snapshot is retained', async () => {
  let resolve;
  fetch.mockReturnValue(
    new Promise(done => {
      resolve = done;
    })
  );
  setup(true, {}, response(1000));
  revealFields();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Title' }));
  fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));
  for (const checkbox of screen.getAllByRole('checkbox'))
    expect(checkbox).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Close' })).toBeEnabled();
  expect(
    screen.getByRole('spinbutton', { name: 'Start at result' })
  ).toBeDisabled();
  expect(
    screen.getByRole('spinbutton', { name: 'Number of results' })
  ).toBeDisabled();
  await act(async () => resolve({ ok: true, json: async () => response() }));
  const data = JSON.parse(await blobText(URL.createObjectURL.mock.calls[0][0]));
  expect(data.records[0]).not.toHaveProperty('title');
  expect(data.scope.fields).not.toContain('title');
  expect(screen.getByRole('checkbox', { name: 'Title' })).not.toBeDisabled();
});

test('expanded optional fields have no accessibility violations', async () => {
  const { container } = setup();
  revealFields();
  expect(await axe(container)).toHaveNoViolations();
});

const countResponse = (total, count) => ({
  hits: {
    total: { value: total, relation: 'eq' },
    hits: Array.from({ length: Math.min(total, count) }, (_, index) => ({
      _id: String(index + 1),
      _source: { ...hit._source, nid: [index + 1] },
    })),
  },
});

test('quantity is modal-local, starts from configuration, and both formats reuse the same query', async () => {
  setup();
  const input = screen.getByRole('spinbutton', { name: 'Number of results' });
  expect(input).toHaveValue(1);
  expect(input).toHaveAttribute('min', '1');
  expect(input).toHaveAttribute('max', '25');
  expect(input).toHaveAttribute('step', '1');
  const modal = screen.getByRole('dialog');
  fireEvent.change(input, { target: { value: '3' } });
  expect(screen.getByRole('dialog')).toBe(modal);
  expect(fetch).not.toHaveBeenCalled();
  fetch.mockResolvedValue({ ok: true, json: async () => countResponse(25, 3) });
  fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
  await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(1));
  const csvBody = JSON.parse(fetch.mock.calls[0][1].body);
  expect(csvBody).toMatchObject({ size: 3, from: 0 });
  const csv = await blobText(URL.createObjectURL.mock.calls[0][0]);
  expect(csv.split('\r\n').filter(Boolean)).toHaveLength(4);
  revealFields();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Title' }));
  fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));
  await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(2));
  const jsonBody = JSON.parse(fetch.mock.calls[1][1].body);
  expect(jsonBody).toEqual(csvBody);
  const data = JSON.parse(await blobText(URL.createObjectURL.mock.calls[1][0]));
  expect(data.scope.limit).toBe(3);
  expect(data.records).toHaveLength(3);
  expect(data.records[0]).not.toHaveProperty('title');
});

test.each(['', 'abc', '0', '-1', '1.5', '1001'])(
  'invalid quantity %j keeps the modal and focuses a described inline error',
  value => {
    setup();
    const input = screen.getByRole('spinbutton', { name: 'Number of results' });
    fireEvent.change(input, { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a whole number from 1 to 25.'
    );
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      expect.stringContaining('Enter a whole number from 1 to 25.')
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('open');
    expect(input).toHaveValue(
      value === '' || value === 'abc' ? null : Number(value)
    );
  }
);

test.each([
  [1000, 1000, 1000],
  [10, 2, 2],
  [1, 25, 1],
])(
  'requested %s against total %s returns %s records with exact scope',
  async (requested, total, returned) => {
    setup(true, {}, response(Math.max(requested, total)));
    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Number of results' }),
      { target: { value: String(requested) } }
    );
    fetch.mockResolvedValue({
      ok: true,
      json: async () => countResponse(total, requested),
    });
    fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetch.mock.calls[0][1].body).size).toBe(requested);
    const data = JSON.parse(
      await blobText(URL.createObjectURL.mock.calls[0][0])
    );
    expect(data.scope).toMatchObject({
      limit: requested,
      total,
      count: returned,
      limited: total > requested,
    });
    expect(data.records).toHaveLength(returned);
  }
);

test('reopening resets quantity and validation to the configured initial count', () => {
  setup();
  const input = screen.getByRole('spinbutton', { name: 'Number of results' });
  fireEvent.change(input, { target: { value: '0' } });
  fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
  expect(screen.getByRole('alert')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  fireEvent.click(screen.getByRole('button', { name: 'Download results' }));
  expect(
    screen.getByRole('spinbutton', { name: 'Number of results' })
  ).toHaveValue(1);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test.each(['', '   '])(
  'icon Close remains named for blank override %p',
  label => {
    setup(true, { exportClose: label });
    expect(screen.getByRole('button', { name: 'Close' })).toBeVisible();
  }
);

test('availability describes the full matching set across pages, independently of quantity', () => {
  setup(true, {}, response(73));
  act(() => dispatch(actions.setPage(3)));
  const input = quantityInput();
  expect(input).toHaveAccessibleDescription('73 results available');
  fireEvent.change(input, { target: { value: '5' } });
  expect(input).toHaveAccessibleDescription('73 results available');
  expect(fetch).not.toHaveBeenCalled();
});

test('availability distinguishes a formatted lower bound from an exact total', () => {
  const result = response(10000);
  result.hits.total.relation = 'gte';
  setup(true, {}, result);
  expect(quantityInput()).toHaveAccessibleDescription(
    'At least 10,000 results available\nMax 1,000 per download'
  );
  act(() => dispatch(actions.setResults(response(12345))));
  expect(quantityInput()).toHaveAccessibleDescription(
    '12,345 results available\nMax 1,000 per download'
  );
});

test('availability is hidden during a search refresh', () => {
  setup(true, {}, response(73));
  act(() => dispatch(actions.setLoading(true)));
  expect(quantityInput()).toHaveAccessibleDescription('');
  expect(screen.queryByText(/73 results available/)).not.toBeInTheDocument();
});

test('availability supports string and function overrides with numeric counts', () => {
  const lower = jest.fn(({ count }) => `Matching at least: ${count}`);
  setup(
    true,
    {
      exportAvailable: '{count} matching items',
      exportAvailableAtLeast: lower,
    },
    response(73)
  );
  expect(quantityInput()).toHaveAccessibleDescription('73 matching items');
  const result = response(10000);
  result.hits.total.relation = 'gte';
  act(() => dispatch(actions.setResults(result)));
  expect(lower).toHaveBeenCalledWith({ count: 10000 });
  expect(quantityInput()).toHaveAccessibleDescription(
    'Matching at least: 10000\nMax 1,000 per download'
  );
});

test.each(['en', 'es', 'fr', 'ja', 'zh', 'ar', 'ru'])(
  'availability uses catalogue number formatting for %s',
  lang => {
    setup(true, getSyndicationSearchWidgetLabels(lang), response(12345));
    expect(quantityInput()).toHaveAccessibleDescription(
      expect.stringContaining(new Intl.NumberFormat(lang).format(12345))
    );
  }
);

const startInput = () =>
  screen.getByRole('spinbutton', { name: 'Start at result' });
const offsetResponse = (total, from, count) => ({
  hits: {
    total: { value: total, relation: 'eq' },
    hits: Array.from(
      { length: Math.min(count, Math.max(0, total - from)) },
      (_, index) => ({
        _id: String(from + index + 1),
        _source: { ...hit._source, nid: [from + index + 1] },
      })
    ),
  },
});
test('opening bounds the default; start edits expose the reduced maximum without changing quantity', () => {
  setup(true, {}, response(1000), { exportDefaultCount: 100 });
  const modal = screen.getByRole('dialog');
  expect(startInput()).toHaveValue(1);
  expect(quantityInput()).toHaveValue(100);
  expect(quantityInput()).toHaveAttribute('max', '1000');
  fireEvent.change(startInput(), { target: { value: '996' } });
  expect(screen.getByRole('dialog')).toBe(modal);
  expect(quantityInput()).toHaveValue(100);
  expect(quantityInput()).toHaveAttribute('max', '5');
  expect(quantityInput()).toHaveAttribute('aria-invalid', 'true');
  expect(quantityInput()).toHaveAccessibleDescription(
    expect.stringContaining('Max 5 from this start')
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Enter a whole number from 1 to 5.'
  );
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  fireEvent.click(screen.getByRole('button', { name: 'Download results' }));
  expect(startInput()).toHaveValue(1);
  expect(quantityInput()).toHaveValue(100);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
test.each(['', 'abc', '0', '-1', '1.5', '1001', '10001'])(
  'invalid start %j focuses its associated error first',
  value => {
    setup(true, {}, response(1000));
    const input = startInput();
    fireEvent.change(input, { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      expect.stringContaining('Enter a whole number from 1 to 1,000.')
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(quantityInput()).not.toHaveAttribute('aria-invalid');
    expect(document.body.textContent).not.toContain('Max 0');
  }
);
test('both formats snapshot offset, quantity, fields and search constraints', async () => {
  setup(true, {}, response(1000), {
    defaultFilters: [
      { key: '_language', value: 'en' },
      { key: 'field_domain_access', value: 'www_preventionweb_net' },
    ],
    customFilters: ['type:publication'],
    defaultSort: 'newest',
  });
  fireEvent.change(startInput(), { target: { value: '996' } });
  fireEvent.change(quantityInput(), { target: { value: '5' } });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Title' }));
  expect(fetch).not.toHaveBeenCalled();
  fetch.mockResolvedValue({
    ok: true,
    json: async () => offsetResponse(1000, 995, 5),
  });
  fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
  await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(1));
  const body = JSON.parse(fetch.mock.calls[0][1].body);
  expect(body).toMatchObject({
    from: 995,
    size: 5,
    sort: [{ published_at: { order: 'desc' } }],
  });
  expect(JSON.stringify(body)).toContain('publication');
  expect(JSON.stringify(body)).toContain('www_preventionweb_net');
  expect(JSON.stringify(body)).toContain('status');
  fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));
  await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(2));
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual(body);
  const csv = await blobText(URL.createObjectURL.mock.calls[0][0]);
  const json = JSON.parse(await blobText(URL.createObjectURL.mock.calls[1][0]));
  expect(csv.split('\r\n')[0]).not.toContain('title');
  expect(json.records.map(record => record.id)).toEqual([
    '996',
    '997',
    '998',
    '999',
    '1000',
  ]);
  expect(json.records[0]).not.toHaveProperty('title');
  expect(json.scope).toMatchObject({
    from: 995,
    start: 996,
    end: 1000,
    count: 5,
    total: 1000,
    limit: 5,
  });
  expect(screen.getByRole('status')).toHaveTextContent(
    'results 996–1,000 of 1,000'
  );
});
test('large sets retain per-download and result-window limits', async () => {
  setup(true, {}, response(80000));
  expect(startInput()).toHaveAttribute('max', '10000');
  expect(quantityInput()).toHaveAttribute('max', '1000');
  fireEvent.change(startInput(), { target: { value: '10000' } });
  expect(quantityInput()).toHaveAttribute('max', '1');
  fireEvent.change(quantityInput(), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));
  expect(quantityInput()).toHaveFocus();
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.change(quantityInput(), { target: { value: '1' } });
  fetch.mockResolvedValue({
    ok: true,
    json: async () => offsetResponse(80000, 9999, 1),
  });
  fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));
  await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(1));
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
    from: 9999,
    size: 1,
  });
});
test('fresh shrink within a slice reports the actual shorter range', async () => {
  setup(true, {}, response(1000));
  fireEvent.change(startInput(), { target: { value: '21' } });
  fireEvent.change(quantityInput(), { target: { value: '5' } });
  fetch.mockResolvedValue({
    ok: true,
    json: async () => offsetResponse(22, 20, 5),
  });
  fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));
  await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(1));
  const json = JSON.parse(await blobText(URL.createObjectURL.mock.calls[0][0]));
  expect(json.scope).toMatchObject({
    start: 21,
    end: 22,
    from: 20,
    count: 2,
    limit: 5,
    total: 22,
  });
  expect(screen.getByRole('status')).toHaveTextContent('results 21–22 of 22');
});
test('lower bounds allow a window-bounded start; fresh end-of-set creates no file', async () => {
  const result = response(1000);
  result.hits.total.relation = 'gte';
  setup(true, {}, result);
  fireEvent.change(startInput(), { target: { value: '1001' } });
  expect(quantityInput()).toHaveAttribute('max', '1000');
  expect(quantityInput()).toHaveAccessibleDescription(
    expect.stringContaining('At least 1,000 results available')
  );
  fetch.mockResolvedValue({
    ok: true,
    json: async () => offsetResponse(1000, 1000, 1),
  });
  fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(
      'No results are available from this position'
    )
  );
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});

test.each([
  [25, 'eq', false],
  [999, 'eq', false],
  [1000, 'eq', true],
  [1001, 'eq', true],
  [80000, 'eq', true],
  [999, 'gte', false],
  [1000, 'gte', true],
  [1001, 'gte', true],
])(
  'offset follows matched total%s/%s, not quantity',
  (total, relation, visible) => {
    const result = response(total);
    result.hits.total.relation = relation;
    setup(true, {}, result);
    expect(
      !!screen.queryByRole('spinbutton', { name: 'Start at result' })
    ).toBe(visible);
    expect(screen.getAllByRole('spinbutton')).toHaveLength(visible ? 2 : 1);
    fireEvent.change(quantityInput(), { target: { value: '1' } });
    expect(
      !!screen.queryByRole('spinbutton', { name: 'Start at result' })
    ).toBe(visible);
    if (!visible)
      expect(
        quantityInput().closest('.mg-search__export-range')
      ).not.toHaveClass('mg-search__export-range--paged');
  }
);
test('small matched sets bound the default and always download from result1', async () => {
  setup(true, {}, response(25), { exportDefaultCount: 100 });
  expect(
    screen.queryByRole('spinbutton', { name: 'Start at result' })
  ).not.toBeInTheDocument();
  expect(quantityInput()).toHaveValue(25);
  expect(quantityInput()).toHaveAttribute('max', '25');
  fireEvent.change(quantityInput(), { target: { value: '1000' } });
  expect(
    screen.queryByRole('spinbutton', { name: 'Start at result' })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.change(quantityInput(), { target: { value: '25' } });
  fetch.mockResolvedValue({
    ok: true,
    json: async () => offsetResponse(25, 0, 25),
  });
  fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));
  await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(1));
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
    from: 0,
    size: 25,
  });
  const json = JSON.parse(await blobText(URL.createObjectURL.mock.calls[0][0]));
  expect(json.scope).toMatchObject({ from: 0, start: 1, end: 25 });
});
test('a shrinking matched set clears a hidden offset and cancels its pending file', async () => {
  let resolve;
  setup(true, {}, response(1000));
  fireEvent.change(startInput(), { target: { value: '21' } });
  fetch.mockReturnValueOnce(
    new Promise(done => {
      resolve = done;
    })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));
  const signal = fetch.mock.calls[0][1].signal;
  act(() => dispatch(actions.setResults(response(25))));
  expect(signal.aborted).toBe(true);
  expect(
    screen.queryByRole('spinbutton', { name: 'Start at result' })
  ).not.toBeInTheDocument();
  await act(async () =>
    resolve({ ok: true, json: async () => offsetResponse(1000, 20, 1) })
  );
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  fetch.mockResolvedValue({
    ok: true,
    json: async () => offsetResponse(25, 0, 1),
  });
  fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));
  await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(1));
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({
    from: 0,
    size: 1,
  });
  const json = JSON.parse(await blobText(URL.createObjectURL.mock.calls[0][0]));
  expect(json.scope).toMatchObject({ from: 0, start: 1, end: 1 });
  act(() => dispatch(actions.setResults(response(1000))));
  expect(startInput()).toHaveValue(1);
});

test('hiding the focused start control moves focus to quantity', () => {
  setup(true, {}, response(1000));
  startInput().focus();
  act(() => dispatch(actions.setResults(response(999))));
  expect(
    screen.queryByRole('spinbutton', { name: 'Start at result' })
  ).not.toBeInTheDocument();
  expect(quantityInput()).toHaveFocus();
});

test.each([
  [25, 'eq'],
  [999, 'eq'],
  [999, 'gte'],
  [1000, 'eq'],
  [80000, 'eq'],
])(
  'quantity help for %s/%s shows a separate maximum only for large sets',
  (total, relation) => {
    const result = response(total);
    result.hits.total.relation = relation;
    setup(true, {}, result);
    const input = quantityInput();
    const helper = document.getElementById(
      input.getAttribute('aria-describedby')
    );
    expect(helper.textContent).not.toMatch(/[•·]/);
    expect(input).toHaveAttribute(
      'max',
      String(relation === 'eq' ? Math.min(total, 1000) : 1000)
    );
    if (total < 1000) {
      expect(helper.textContent).not.toContain('Max');
      expect(helper.textContent.split('\n')).toHaveLength(1);
    } else {
      expect(helper.textContent.split('\n')).toHaveLength(2);
      expect(helper.textContent.split('\n')[1]).toBe('Max 1,000 per download');
    }
  }
);
