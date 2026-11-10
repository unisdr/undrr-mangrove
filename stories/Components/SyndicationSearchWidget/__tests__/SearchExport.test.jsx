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
function setup(open = true, labels = {}) {
  const view = isStale => (
    <SearchProvider config={config} labels={labels}>
      <Capture />
      <SearchExport isStale={isStale} />
    </SearchProvider>
  );
  const rendered = render(view(false));
  act(() => {
    dispatch(actions.initialize({}));
    dispatch(actions.setResults(response()));
  });
  if (open)
    fireEvent.click(screen.getByRole('button', { name: 'Download results' }));
  return { ...rendered, stale: value => rendered.rerender(view(value)) };
}
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
    expect(screen.getByRole('status')).toHaveTextContent('No matching records')
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
      'Enter a whole number from 1 to 1,000.'
    );
    expect(labels.exportLimited).toContain('{count}');
    expect(labels.exportLimited).toContain('{total}');
    expect(labels.exportContactLink).not.toBe('Contact us');
  }
});

test('offers one optional CTA that opens both formats in a labelled modal', () => {
  setup(false);
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
  const quantity = screen.getByRole('spinbutton');
  const fields = screen
    .getByText('Fields to include', { selector: 'summary span' })
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
    .getByText('Fields to include', { selector: 'summary span' })
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
  expect(screen.getByText('11 fields included')).toBeVisible();
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
  expect(screen.getByText('2 fields included')).toBeVisible();
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
  setup();
  revealFields();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Title' }));
  fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));
  for (const checkbox of screen.getAllByRole('checkbox'))
    expect(checkbox).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Close' })).toBeEnabled();
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
  expect(input).toHaveAttribute('max', '1000');
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
      'Enter a whole number from 1 to 1,000.'
    );
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      expect.stringContaining('Enter a whole number from 1 to 1,000.')
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('open');
    expect(input).toHaveValue(
      value === '' || value === 'abc' ? null : Number(value)
    );
  }
);

test.each([
  [1000, 1002, 1000],
  [10, 2, 2],
  [1, 25, 1],
])(
  'requested %s against total %s returns %s records with exact scope',
  async (requested, total, returned) => {
    setup();
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
