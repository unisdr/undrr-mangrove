import { expect, within, userEvent, waitFor } from 'storybook/test';
import { SyndicationSearchWidget } from './SyndicationSearchWidget';
import { widgetMetaShared } from './_storyHelpers';

const endpoint = '/__mg-export-search';
const records = [
  {
    nid: [1003],
    title: 'Understanding disaster risk',
    url: '/publication/understanding-risk',
    display_date: ['2026'],
    display_date_precision: ['year'],
  },
  {
    nid: [1002],
    title: 'Local resilience in practice',
    url: '/publication/local-resilience',
    display_date: ['2025'],
    display_date_precision: ['year'],
  },
  {
    nid: [1001],
    title: 'Flood risk and early warning',
    url: '/publication/flood-risk',
    display_date: ['2024'],
    display_date_precision: ['year'],
  },
].map(source => ({
  _id: `node:${source.nid[0]}:en`,
  _source: {
    ...source,
    type: ['publication'],
    _language: ['en'],
    field_theme: [7],
    published_at: [1762732800 + Number(source.nid[0])],
    field_domain_access: ['www_preventionweb_net'],
  },
}));

const requests = [];
function mockExportSearch({ args }) {
  requests.length = 0;
  const timers = new Set();
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    if (url === '/__mg-export-taxonomy')
      return {
        ok: true,
        json: async () => ({
          results: [{ id: 7, name: 'Disaster risk management' }],
        }),
      };
    if (url !== endpoint) return original(url, options);
    const body = JSON.parse(options.body);
    requests.push(body);
    if (args.fixtureDelay && body.track_total_hits) {
      await new Promise(resolve => {
        const timer = setTimeout(() => {
          timers.delete(timer);
          resolve();
        }, args.fixtureDelay);
        timers.add(timer);
      });
    }
    if (args.fixtureError && body.track_total_hits) return { ok: false };
    const flood = JSON.stringify(body.query).toLowerCase().includes('flood');
    const matching = flood
      ? records.filter(hit => hit._source.title.toLowerCase().includes('flood'))
      : records;
    const ordered =
      body.sort?.[0]?.published_at?.order === 'asc'
        ? [...matching].reverse()
        : matching;
    const total = args.fixtureEmpty ? 0 : flood ? matching.length : 25;
    return {
      ok: true,
      json: async () => ({
        hits: {
          total: { value: total, relation: 'eq' },
          hits: total ? ordered.slice(0, body.size) : [],
        },
        aggregations: {
          field_theme: { buckets: [{ key: 7, doc_count: total }] },
        },
        took: 1,
      }),
    };
  };
  return () => {
    for (const timer of timers) clearTimeout(timer);
    globalThis.fetch = original;
  };
}

const cta = canvas =>
  canvas.getByRole('button', {
    name: /^(Download results|Descargar resultados|Télécharger les résultats|結果をダウンロード|下载结果|تنزيل النتائج|Скачать результаты)$/,
  });
const dialog = canvas => canvas.getByRole('dialog');
async function openExport({ canvasElement }) {
  const canvas = within(canvasElement);
  await waitFor(() => expect(cta(canvas)).toBeEnabled());
  await userEvent.click(cta(canvas));
  await expect(dialog(canvas)).toBeVisible();
}

export default {
  title: 'Components/Syndicated search/Downloads',
  component: SyndicationSearchWidget,
  ...widgetMetaShared,
};

export const DownloadResults = {
  args: {
    config: {
      searchEndpoint: endpoint,
      enableHashSync: false,
      showExport: true,
      exportLimit: 3,
      exportContactUrl: 'https://www.preventionweb.net/contact',
      resultsPerPage: 3,
      showSearchBox: true,
      showSort: true,
      showPager: false,
      facets: 'sidebar',
      visibleFilters: ['field_theme'],
      taxonomyEndpoint: '/__mg-export-taxonomy',
      debounceDelay: 0,
      defaultSort: 'newest',
      defaultFilters: [
        { key: '_language', value: 'en' },
        { key: 'field_domain_access', value: 'www_preventionweb_net' },
      ],
      customFilters: ['type:publication'],
    },
  },
  beforeEach: mockExportSearch,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(cta(canvas)).toBeEnabled());
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story:
          'Standard interactive search with an optional Download results action. The configured publication/language/domain filters combine with visitor input, filters and sort. Fictional fixture metadata represents 25 matches; a flood query narrows to one record. The modal always offers CSV and JSON with a three-record cap.',
      },
    },
  },
};

export const DownloadEmpty = {
  ...DownloadResults,
  args: { ...DownloadResults.args, fixtureEmpty: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(cta(canvas)).toBeDisabled());
  },
};

export const DownloadFailure = {
  ...DownloadResults,
  args: { ...DownloadResults.args, fixtureError: true },
  play: async context => {
    await openExport(context);
    await userEvent.click(
      within(dialog(within(context.canvasElement))).getByRole('button', {
        name: /CSV/,
      })
    );
    await expect(
      within(context.canvasElement).getByRole('alert')
    ).toBeVisible();
  },
};

export const DownloadModal = {
  ...DownloadResults,
  play: openExport,
};

export const DownloadPreparing = {
  ...DownloadResults,
  args: { ...DownloadResults.args, fixtureDelay: 10000 },
  play: async context => {
    await openExport(context);
    const modal = within(dialog(within(context.canvasElement)));
    await userEvent.click(modal.getByRole('button', { name: /CSV/ }));
    await expect(modal.getByRole('button', { name: /CSV/ })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  },
};

export const DownloadActiveSearch = {
  ...DownloadResults,
  play: async context => {
    const canvas = within(context.canvasElement);
    await waitFor(() => expect(cta(canvas)).toBeEnabled());
    await userEvent.click(canvas.getByRole('button', { name: 'Theme' }));
    await userEvent.click(
      canvas.getByRole('option', { name: /Disaster risk management/ })
    );
    await userEvent.keyboard('{Escape}');
    await userEvent.click(canvas.getByRole('button', { name: 'Sort' }));
    await userEvent.click(canvas.getByRole('option', { name: 'Oldest' }));
    await userEvent.type(canvas.getByRole('searchbox'), 'flood');
    await waitFor(() =>
      expect(
        JSON.stringify(requests[requests.length - 1].query).toLowerCase()
      ).toContain('flood')
    );
    await waitFor(() =>
      expect(
        canvas.getByRole('link', { name: 'Flood risk and early warning' })
      ).toBeVisible()
    );
    await waitFor(() => expect(cta(canvas)).toBeEnabled());
    const search = requests[requests.length - 1];
    await openExport(context);
    await userEvent.click(
      within(dialog(canvas)).getByRole('button', { name: /JSON/ })
    );
    await waitFor(() =>
      expect(requests[requests.length - 1].track_total_hits).toBe(true)
    );
    const exported = requests[requests.length - 1];
    const stripClock = body =>
      JSON.parse(
        JSON.stringify(body, (key, value) =>
          key === 'now' ? undefined : value
        )
      );
    await expect(stripClock(exported.query)).toEqual(stripClock(search.query));
    await expect(exported.post_filter).toEqual(search.post_filter);
    await expect(exported.sort).toEqual(search.sort);
    await expect(exported.from).toBe(0);
    await expect(within(dialog(canvas)).getByRole('status')).toBeVisible();
  },
};
