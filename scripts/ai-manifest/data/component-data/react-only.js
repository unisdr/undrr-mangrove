/**
 * @file react-only.js
 * @source manual (metadata only)
 *
 * Contains requiresReact flags and reactNote descriptions for
 * components that need React to function. No HTML examples.
 * Some of these components have auto-rendered HTML provided by
 * scripts/ai-manifest/render-component-html.js (check RENDER_SPECS there).
 */

export default {
  'components-charts-barchart': {
    requiresReact: true,
    reactNote:
      'BarChart uses D3 for rendering. It requires React and the D3 library. Import via npm: import { BarChart } from "@undrr/undrr-mangrove".',
  },

  'components-charts-connectedscatterplot': {
    requiresReact: true,
    reactNote:
      'ConnectedScatterPlot uses D3 for rendering. Requires React and D3. Import via npm.',
  },

  'components-charts-histogram': {
    requiresReact: true,
    reactNote:
      'Histogram uses D3 for rendering. Requires React and D3. Import via npm.',
  },

  'components-charts-indexchart': {
    requiresReact: true,
    reactNote:
      'IndexChart uses D3 for rendering. Requires React and D3. Import via npm.',
  },

  'components-maps-mapcomponent': {
    requiresReact: true,
    reactNote:
      'MapComponent uses Leaflet for interactive maps. Requires React and Leaflet. Import via npm.',
  },

  'components-syndicationsearchwidget': {
    requiresReact: true,
    reactNote:
      'SyndicationSearchWidget is a complex search interface querying an Elasticsearch API. Requires React 19. Can be hydrated on a vanilla HTML page using the createHydrator pattern with data-mg-search-widget attributes. See the hydration documentation.',
  },

  'components-megamenu': {
    requiresReact: true,
    reactNote:
      'MegaMenu manages complex open/close state and keyboard navigation. Requires React. Can be hydrated via createHydrator.',
  },

  'components-fetcher': {
    requiresReact: true,
    reactNote:
      'Fetcher is a generic data-fetching wrapper component. Requires React for state management.',
  },

  'components-gallery': {
    requiresReact: true,
    reactNote:
      'Gallery provides a lightbox image viewer. Requires React for modal state and keyboard navigation. Can be hydrated via createHydrator.',
  },

  'components-pager': {
    requiresReact: true,
    reactNote:
      'Pager manages pagination state. Requires React. Import via npm.',
  },

  'components-cookieconsentbanner': {
    requiresReact: true,
    reactNote:
      'CookieConsentBanner manages consent state and cookie storage. Requires React.',
  },

  'components-snackbar': {
    requiresReact: true,
    reactNote:
      'Snackbar manages auto-dismiss timing and state. Requires React.',
  },

  'components-scrollcontainer': {
    requiresReact: true,
    reactNote:
      'ScrollContainer manages horizontal scroll state with navigation buttons. Requires React. Can be hydrated via createHydrator.',
  },

  'components-buttons-sharebuttons': {
    requiresReact: true,
    reactNote:
      'ShareButtons manages share URLs and clipboard state. Requires React. Can be hydrated via createHydrator with data-mg-share-buttons.',
  },

  'components-table-of-contents': {
    requiresReact: true,
    reactNote:
      'TableOfContents inspects the DOM for heading elements and manages scroll-spy state. Requires React.',
  },
};
