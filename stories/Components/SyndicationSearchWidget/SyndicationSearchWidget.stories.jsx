/**
 * @file SyndicationSearchWidget.stories.jsx
 * @description Quickstart stories for the SyndicationSearchWidget: the
 * default render and a couple of common starting configurations. Variant
 * stories live in sibling files (Layouts, Display modes, Filters,
 * Integrations, Toggles) and are grouped under the same Storybook
 * sidebar namespace `Components/Syndicated search/Widget`.
 */

import { SyndicationSearchWidget } from './SyndicationSearchWidget';
import { defaultConfig, widgetMetaShared } from './_storyHelpers';

export default {
  title: 'Components/Syndicated search',
  component: SyndicationSearchWidget,
  ...widgetMetaShared,
};

/**
 * Default story: the widget with all features enabled.
 */
export const Default = {
  args: {
    config: defaultConfig,
  },
  parameters: {
    docs: {
      description: {
        story: `
The default configuration includes all features enabled:
- Search box with debounced input
- Facets sidebar (Type, Year, Country, Hazard, Theme, Language)
- Active filter chips
- Results count with timing

This is the standard setup for most UNDRR search pages.
        `,
      },
    },
  },
};

/**
 * Pre-filled search query on load.
 */
export const DefaultQuery = {
  args: {
    config: {
      ...defaultConfig,
      defaultQuery: 'climate change',
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Use \`defaultQuery\` to pre-fill the search box on page load.

\`\`\`js
config: {
  defaultQuery: 'climate change',
}
\`\`\`

Useful for:
- Landing pages with a topic focus
- Deep-linking to search results
- Pre-filtered search experiences
        `,
      },
    },
  },
};

/**
 * Minimal configuration: just the search box and results.
 */
export const Minimal = {
  args: {
    config: {
      ...defaultConfig,
      showFacets: false,
      showActiveFilters: false,
      showResultsCount: false,
      showSearchTimer: false,
      showPager: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
A stripped-down search widget with only the essentials:

\`\`\`js
config: {
  showFacets: false,
  showActiveFilters: false,
  showResultsCount: false,
  showSearchTimer: false,
  showPager: false,
}
\`\`\`

Useful for:
- Embedded search in compact spaces
- Simple keyword search without filtering
- Header/navbar search boxes
        `,
      },
    },
  },
};
