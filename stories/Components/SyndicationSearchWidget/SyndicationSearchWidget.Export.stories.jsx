import { expect, within, userEvent, waitFor } from 'storybook/test';
import { SyndicationSearchWidget } from './SyndicationSearchWidget';
import { widgetMetaShared } from './_storyHelpers';
import latestWebsiteResults from '../../assets/fixtures/search-latest10/results.json';

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

const previewRecords = Array.from({ length: 25 }, (_, index) =>
  index < records.length
    ? records[index]
    : {
        _id: `sample:${1003 - index}:en`,
        _source: {
          ...records[0]._source,
          nid: [1003 - index],
          title: `Sample publication ${index + 1}`,
          url: `/publication/sample-${index + 1}`,
          published_at: [1762733803 - index],
        },
      }
);

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
    const sourceRecords = args.fixtureLatest
      ? latestWebsiteResults.hits.hits.map(hit => ({
          ...hit,
          _source: {
            ...hit._source,
            teaser: Object.entries(latestWebsiteResults.assets).reduce(
              (html, [source, asset]) =>
                html.replaceAll(
                  source,
                  `${globalThis.location.origin}${asset}`
                ),
              hit._source.teaser
            ),
          },
        }))
      : previewRecords;
    const flood = JSON.stringify(body.query).toLowerCase().includes('flood');
    let matching = flood
      ? sourceRecords.filter(hit =>
          String(hit._source.title).toLowerCase().includes('flood')
        )
      : sourceRecords;
    if (args.fixtureLatest) {
      const selectedTypes = [];
      const readTypes = value => {
        if (!value || typeof value !== 'object') return;
        if (value.term?.type) selectedTypes.push(value.term.type);
        if (value.terms?.type) selectedTypes.push(...value.terms.type);
        Object.values(value).forEach(readTypes);
      };
      readTypes(body.post_filter);
      if (selectedTypes.length)
        matching = matching.filter(hit =>
          selectedTypes.includes([].concat(hit._source.type)[0])
        );
    }
    const ordered =
      body.sort?.[0]?.published_at?.order === 'asc'
        ? [...matching].reverse()
        : matching;
    const total = args.fixtureEmpty
      ? 0
      : args.fixtureLatest || flood
        ? matching.length
        : 25;
    return {
      ok: true,
      json: async () => ({
        hits: {
          total: { value: total, relation: 'eq' },
          hits: total
            ? ordered.slice(body.from || 0, (body.from || 0) + body.size)
            : [],
        },
        aggregations: {
          field_theme: { buckets: [{ key: 7, doc_count: total }] },
          type: {
            buckets: Object.entries(
              matching.reduce((counts, hit) => {
                const type = [].concat(hit._source.type)[0];
                counts[type] = (counts[type] || 0) + 1;
                return counts;
              }, {})
            ).map(([key, doc_count]) => ({ key, doc_count })),
          },
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
      exportDefaultCount: 3,
      exportContactUrl: 'https://www.preventionweb.net/contact',
      resultsPerPage: 3,
      showSearchBox: true,
      showSort: true,
      showPager: true,
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
    const pagination = canvas.getByRole('navigation');
    await expect(pagination.compareDocumentPosition(cta(canvas))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    await expect(cta(canvas)).toHaveClass('mg-button-outline');
  },
  parameters: {
    docs: {
      description: {
        story:
          'Standard interactive search with an optional Download results action. The configured publication/language/domain filters combine with visitor input, filters and sort. Fictional fixture metadata represents 25 matches; a flood query narrows to one record. The modal offers CSV and JSON with an initial quantity of three; visitors can choose 1–1,000 records.',
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

export const DownloadWithoutPagination = {
  ...DownloadResults,
  args: {
    ...DownloadResults.args,
    config: { ...DownloadResults.args.config, showPager: false },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(cta(canvas)).toBeEnabled());
    await expect(canvas.queryByRole('navigation')).not.toBeInTheDocument();
    const results = canvasElement.querySelector(
      '.mg-search__results-list, .mg-search__results-grid'
    );
    await expect(results.compareDocumentPosition(cta(canvas))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    await expect(cta(canvas)).toHaveClass('mg-button-outline');
  },
};

export const LatestWebsiteTeasers = {
  ...DownloadResults,
  name: 'Latest 10 website teasers',
  args: {
    ...DownloadResults.args,
    fixtureLatest: true,
    config: {
      ...DownloadResults.args.config,
      resultsPerPage: 10,
      exportDefaultCount: 10,
      defaultSort: 'newest',
      displayMode: 'list',
      visibleFilters: ['type'],
      customFilters: [],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(cta(canvas)).toBeEnabled());
    const teasers = canvasElement.querySelectorAll(
      'article.mg-search__result > .teaser-3-9'
    );
    await expect(teasers.length).toBe(10);
    await expect(
      canvasElement.querySelector('.mg-search__result-content')
    ).not.toBeInTheDocument();
    const dates = latestWebsiteResults.hits.hits.map(
      hit => hit._source.published_at[0]
    );
    await expect(dates).toEqual([...dates].sort((a, b) => b - a));
    await expect(requests[requests.length - 1].sort).toEqual([
      { published_at: { order: 'desc' } },
    ]);
  },
  parameters: {
    docs: {
      description: {
        story:
          'Actual pre-rendered Drupal teaser HTML for the ten newest indexed PreventionWeb records in a local sanitized-index snapshot captured on 10 November 2026. This is sample captured data, not the current live website. Mixed news, publications and a collection use the standard teaser renderer, with cached images for a reliable demo. Newest website posting order and an initial download quantity of ten are configured; exported metadata remains independent of visible teaser fields.',
      },
    },
  },
};

export const ChooseFields = {
  ...DownloadResults,
  name: 'Choose fields',
  play: async context => {
    await openExport(context);
    const modal = within(dialog(within(context.canvasElement)));
    await expect(modal.getAllByRole('checkbox')).toHaveLength(8);
  },
};

export const ChooseResultCount = {
  ...DownloadResults,
  name: 'Choose number of results',
  play: async context => {
    await openExport(context);
    const canvas = within(context.canvasElement);
    const modal = dialog(canvas);
    const controls = within(modal);
    const count = controls.getByRole('spinbutton');
    const before = requests.length;
    await expect(count).toHaveValue(3);
    await userEvent.clear(count);
    await userEvent.type(count, '5');
    await expect(dialog(canvas)).toBe(modal);
    await expect(requests.length).toBe(before);
    await userEvent.click(controls.getByRole('button', { name: /JSON/ }));
    await waitFor(() => expect(requests[requests.length - 1].size).toBe(5));
    await waitFor(() =>
      expect(controls.queryByRole('alert')).not.toBeInTheDocument()
    );
    await expect(controls.getByRole('status')).toBeVisible();
  },
};
