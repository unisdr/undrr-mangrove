import { expect, within } from 'storybook/test';
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
    field_domain_access: ['www_preventionweb_net'],
  },
}));

function mockExportSearch({ args }) {
  const original = globalThis.fetch;
  globalThis.fetch = (url, options) => {
    if (url !== endpoint) return original(url, options);
    const body = JSON.parse(options.body);
    if (args.fixtureError && body.track_total_hits)
      return Promise.resolve({ ok: false });
    const total = args.fixtureEmpty ? 0 : 25;
    return Promise.resolve({
      ok: true,
      json: async () => ({
        hits: {
          total: { value: total, relation: 'eq' },
          hits: total ? records.slice(0, body.size) : [],
        },
        took: 1,
      }),
    });
  };
  return () => {
    globalThis.fetch = original;
  };
}

export default {
  title: 'Components/Syndicated search',
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
      showSearchBox: false,
      showSort: false,
      showPager: false,
      facets: false,
      defaultSort: 'newest',
      defaultFilters: [],
      customFilters: ['type:publication'],
    },
  },
  beforeEach: mockExportSearch,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('button')[0]).toBeVisible();
    await expect(
      canvas.getByRole('link', {
        name: /Contact us|Contáctenos|Contactez-nous|お問い合わせ|联系我们|اتصل بنا|Свяжитесь с нами/,
      })
    ).toBeVisible();
  },
  parameters: {
    docs: {
      description: {
        story:
          'A configured publication list with a three-record download cap. Local fictional metadata keeps downloads deterministic. The fixture represents 25 matches; CSV and JSON include the first three. These example links illustrate the exported structure.',
      },
    },
  },
};

export const DownloadEmpty = {
  ...DownloadResults,
  args: { ...DownloadResults.args, fixtureEmpty: true },
  play: undefined,
};

export const DownloadFailure = {
  ...DownloadResults,
  args: { ...DownloadResults.args, fixtureError: true },
  play: undefined,
};
