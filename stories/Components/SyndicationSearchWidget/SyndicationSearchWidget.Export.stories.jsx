import { SyndicationSearchWidget } from './SyndicationSearchWidget';
import { defaultConfig, widgetMetaShared } from './_storyHelpers';

const config = {
  ...defaultConfig,
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
const sourceDescription =
  'Real requests to the normal public UNDRR search endpoint. Access and network errors remain visible; there is no automatic local or fixture fallback.';
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

export const LocalDrupalApi = {
  ...DownloadResults,
  name: 'Local Drupal API',
  args: {
    config: {
      ...config,
      searchEndpoint: 'https://undrr.ddev.site/search-endpoint',
      taxonomyEndpoint:
        '/__mg-local-taxonomy?vid=prevention_web_regions,hazard,theme&items_per_page=1000&langcode=en',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Explicit local development opt-in. Requires the running sanitized DDEV Drupal/Elasticsearch deployment and the Storybook dev server with the opt-in taxonomy proxy; see the README startup command. Search requests go directly to https://undrr.ddev.site/search-endpoint. This is local API integration testing, not production content or an automatic fallback. No download starts automatically.',
      },
    },
  },
};
