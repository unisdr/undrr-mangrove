/**
 * @file SyndicationSearchWidget.Integrations.stories.jsx
 * @description Integration / syndication examples — patterns for embedding
 * the widget on landing pages and other UNDRR properties: taxonomy term
 * results, custom Elasticsearch endpoints, and the no-chrome syndicated
 * publication / card layouts used as content blocks.
 */

import { SyndicationSearchWidget } from './SyndicationSearchWidget';
import { allTeaserFieldsVisible } from './utils/constants';
import { defaultConfig, widgetMetaShared } from './_storyHelpers';

export default {
  title: 'Components/Syndicated search/Widget/Integrations',
  component: SyndicationSearchWidget,
  ...widgetMetaShared,
};

/**
 * Taxonomy term results — mixed node and term results.
 */
export const TaxonomyTermResults = {
  args: {
    config: {
      ...defaultConfig,
      defaultQuery: 'flood',
      showSearchMetrics: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates mixed search results containing both content nodes and taxonomy terms.

Search for terms like "flood", "earthquake", or country names like "Japan" to see
taxonomy term results (Hazard, Country, Theme) mixed with regular content.

Taxonomy term results differ from node results:
- **Type badge**: Shows vocabulary name (e.g., "Hazard") instead of content type
- **No date**: Terms don't have a publication date
- **Domain**: Defaults to preventionweb.net (terms don't have field_domain_access)
        `,
      },
    },
  },
};

/**
 * Custom endpoint — point at a different Elasticsearch proxy.
 */
export const CustomEndpoint = {
  args: {
    config: {
      ...defaultConfig,
      searchEndpoint: 'https://www.undrr.org/search-endpoint',
      showSearchMetrics: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Override the search endpoint to point at a different Elasticsearch proxy.

This is useful for:
- **Local development**: Point to a DDEV site (e.g., \`https://novarnish.undrr.ddev.site/search-endpoint\`)
- **Staging/QA**: Point to a staging server
- **Cross-site search**: Query a different UNDRR site's index

### React usage

\`\`\`jsx
<SyndicationSearchWidget
  config={{
    searchEndpoint: 'https://novarnish.undrr.ddev.site/search-endpoint',
  }}
/>
\`\`\`

### Drupal data attribute

\`\`\`html
<div data-undrr-search-widget
     data-search-endpoint="https://staging.undrr.org/search-endpoint">
</div>
\`\`\`

### Default endpoint

If no \`searchEndpoint\` is provided, the widget uses \`https://www.undrr.org/search-endpoint\`
(defined in \`DEFAULT_CONFIG\`). In Drupal, omitting the data attribute falls back to
\`/search-endpoint\` (relative to the current domain).
        `,
      },
    },
  },
};

/**
 * Syndicated publication books — book cover cards without search UI.
 *
 * Embeds recent publications as book-cover cards. Useful for a
 * "Latest publications" rail on any UNDRR property.
 */
export const SyndicatedPublicationBooks = {
  args: {
    config: {
      ...defaultConfig,
      displayMode: 'card-book',
      resultsPerPage: 4,
      showSearchBox: false,
      showFacets: false,
      showActiveFilters: false,
      showResultsCount: false,
      showSearchTimer: false,
      showPager: false,
      defaultSort: 'newest',
      customFilters: ['type:publication'],
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
A "Latest publications" rail: four book-cover cards, filtered to publications only.

\`\`\`js
config: {
  displayMode: 'card-book',
  resultsPerPage: 4,
  showSearchBox: false,
  showFacets: false,
  showActiveFilters: false,
  showResultsCount: false,
  showSearchTimer: false,
  showPager: false,
  defaultSort: 'newest',
  customFilters: ['type:publication'],
}
\`\`\`

Any UNDRR property can embed this to show the latest publications without building its own publication feed.
        `,
      },
    },
  },
};

/**
 * Syndicated cards — hardwired topic query, no search UI.
 *
 * Demonstrates embedding a fixed topic query as a content block.
 * No search box, no facets, no pager — just cards for a specific
 * subject like "early warning" or "rainfall". Use this pattern on
 * landing pages to surface relevant content without exposing search.
 * Adjust `resultsPerPage` and `gridColumns` for different card counts.
 */
export const SyndicatedCards = {
  args: {
    config: {
      ...defaultConfig,
      displayMode: 'card',
      resultsPerPage: 4,
      gridColumns: 4,
      showSearchBox: false,
      showFacets: false,
      showActiveFilters: false,
      showResultsCount: false,
      showSearchTimer: false,
      showPager: false,
      defaultSort: 'newest',
      defaultQuery: 'early warning systems',
      requireImage: true,
      visibleTeaserFields: {
        ...allTeaserFieldsVisible(),
        contentType: false,
        publicationType: false,
        summary: false,
        siteName: false,
        organization: false,
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Syndicated cards: a hardwired topic query rendered as a content block with no search chrome. This example uses four cards, but adjust \`resultsPerPage\` and \`gridColumns\` for any count (2-6).

\`\`\`js
config: {
  displayMode: 'card',
  resultsPerPage: 4,
  gridColumns: 4,
  showSearchBox: false,
  showFacets: false,
  showActiveFilters: false,
  showResultsCount: false,
  showSearchTimer: false,
  showPager: false,
  defaultSort: 'newest',
  defaultQuery: 'early warning systems',
  requireImage: true,
  visibleTeaserFields: {
    image: true,
    contentType: false,
    publicationType: false,
    date: true,
    summary: false,
    siteName: false,
    organization: false,
  },
}
\`\`\`

The key is \`defaultQuery\` — it seeds the search with a topic so the widget loads results immediately without user interaction. Combined with hidden search UI, the result is a static-looking content block that's actually live.

\`requireImage: true\` adds a \`has_image:true\` filter to the Elasticsearch query, so only results with an image are returned. \`visibleTeaserFields\` controls which card fields are visible — here the content type badge, publication type, summary text, site name, and organization are all hidden for a clean card showing just image, title, and date. Toggle any field to \`true\`/\`false\` in Storybook controls to experiment.

**Typical uses:**
- "Latest on early warning" rail on a landing page
- "Recent publications about rainfall" in a sidebar
- Topic spotlight sections on campaign pages

Combine with \`customFilters\` to further narrow (e.g., only publications, only from a specific domain):

\`\`\`js
defaultQuery: 'rainfall',
customFilters: ['type:publication'],
\`\`\`
        `,
      },
    },
  },
};
