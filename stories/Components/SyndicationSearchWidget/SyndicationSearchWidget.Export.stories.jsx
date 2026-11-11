import { SyndicationSearchWidget } from './SyndicationSearchWidget';
import { defaultConfig, widgetMetaShared } from './_storyHelpers';

const localPreview = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(
  globalThis.location?.hostname
);
const origin = localPreview
  ? 'https://undrr.ddev.site'
  : 'https://www.undrr.org';
const config = {
  ...defaultConfig,
  searchEndpoint: `${origin}/search-endpoint`,
  taxonomyEndpoint: `${localPreview ? '/__mg-local-taxonomy' : 'https://www.preventionweb.net/api/v1/taxonomy'}?vid=prevention_web_regions,hazard,theme&items_per_page=1000&langcode=en`,
  enableHashSync: false,
  showExport: true,
  resultsPerPage: 10,
  exportDefaultCount: 100,
  defaultSort: 'newest',
  displayMode: 'list',
  visibleFilters: ['type', 'field_theme'],
  defaultFilters: [
    { key: '_language', value: 'en' },
    { key: 'field_domain_access', value: 'www_preventionweb_net' },
  ],
};
const sourceDescription = localPreview
  ? `Default real data source: the running local Drupal/Elasticsearch service at ${origin}. Results use its sanitized index, not a fixed fixture.`
  : `Default real data source: ${origin}. Access and network errors remain visible; no fixture data is substituted.`;
export default {
  title: 'Components/Syndicated search/Downloads',
  component: SyndicationSearchWidget,
  ...widgetMetaShared,
  tags: ['!test'],
};
export const DownloadResults = {
  args: { config },
  parameters: {
    docs: {
      description: {
        story: `${sourceDescription} PreventionWeb and English filters, newest posting order, real totals and indexed teasers. Edit the query, filters, start, quantity and fields to download actual CSV/JSON. Endpoint configuration is editable in Controls. These network-dependent examples are excluded from deterministic CI; simulated states are under Fixtures.`,
      },
    },
  },
};
export const DownloadModal = {
  ...DownloadResults,
  parameters: {
    docs: {
      description: {
        story: `${sourceDescription} Choose Download results to open the modal with real availability. No download starts automatically.`,
      },
    },
  },
};
export const DownloadRange = {
  ...DownloadResults,
  name: 'Download a result range',
  parameters: {
    docs: {
      description: {
        story: `${sourceDescription} With at least 1,000 matches, try start 900 and quantity 1,000. Smaller sets always start at result 1. Per-file and result-window limits remain enforced; separate downloads are not a fixed snapshot.`,
      },
    },
  },
};
export const ChooseFields = { ...DownloadResults, name: 'Choose fields' };
export const ChooseResultCount = {
  ...DownloadResults,
  name: 'Choose number of results',
};
export const DownloadActiveSearch = {
  ...DownloadResults,
  name: 'Download active search',
};
export const DownloadWithoutPagination = {
  ...DownloadResults,
  args: { config: { ...config, showPager: false } },
};
export const LatestWebsiteResultsLive = {
  ...DownloadResults,
  name: 'Latest website results (live)',
  args: { config: { ...config, exportDefaultCount: 10 } },
};
