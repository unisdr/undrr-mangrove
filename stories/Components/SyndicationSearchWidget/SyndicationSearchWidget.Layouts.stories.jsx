/**
 * @file SyndicationSearchWidget.Layouts.stories.jsx
 * @description Layout variations: where the facets render relative to the
 * search input and results region. Covers `facets: false`, the horizontal
 * facet strip, and the external-region portal added under #981.
 */

import React from 'react';
import { SyndicationSearchWidget } from './SyndicationSearchWidget';
import { defaultConfig, widgetMetaShared } from './_storyHelpers';

export default {
  title: 'Components/Syndicated search/Layouts',
  component: SyndicationSearchWidget,
  ...widgetMetaShared,
};

/**
 * Facets hidden — search + results only.
 */
export const HiddenFacets = {
  args: {
    config: {
      ...defaultConfig,
      facets: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Hides the facets entirely for a simpler search experience.

\`\`\`js
config: {
  facets: false,
}
\`\`\`

The search still works with all filters via URL hash — users just can't see or modify them through the UI.

Legacy \`showFacets: false\` continues to work as a backwards-compatible alias for \`facets: false\`.
        `,
      },
    },
  },
};

/**
 * Horizontal facet strip layout.
 */
export const HorizontalFacets = {
  args: {
    config: {
      ...defaultConfig,
      facets: 'horizontal',
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Renders facets as a horizontal strip above the results region instead of in a right-hand sidebar. Useful in narrow content regions or where a sidebar would compete with surrounding page chrome.

\`\`\`js
config: {
  facets: 'horizontal',
}
\`\`\`

On viewports under 768px the strip is hidden and the mobile filter drawer takes over (same pattern as the sidebar layout).
        `,
      },
    },
  },
};

/**
 * Search input rendered in an external DOM region via portal.
 *
 * Common "hero search" pattern: input lives in a banner region, results
 * render where the widget is mounted. Same React tree spans the portal,
 * so input state and results stay in sync without any URL-hash bridge.
 */
export const ExternalSearchRegion = {
  args: {
    config: {
      ...defaultConfig,
      searchTarget: '#mg-story-hero-search',
    },
  },
  render: args => (
    <div>
      <div
        id="mg-story-hero-search"
        style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, #003366, #00558a)',
          borderRadius: '4px',
          marginBottom: '1.5rem',
        }}
      >
        {/* SearchForm portals into here */}
      </div>
      <SyndicationSearchWidget {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Renders the search input into a DOM element outside the widget's own container, identified by a CSS selector. Useful for hero / banner patterns where the input sits in a styled region above the page while results render lower down.

\`\`\`js
config: {
  searchTarget: '#hero-search',
}
\`\`\`

The widget's React tree spans the portal so \`SearchContext\` still flows — typing in the portaled input updates the deferred query and re-runs the search live, no URL-hash dance required. Drupal sites pass the target via \`data-search-target\`.

If the target element is not present at mount time the widget falls back to rendering the input in-place and logs a single console warning.

For **cross-page** hero patterns (input on a landing page, results on \`/search\`), use a plain HTML form posting to the results URL with a \`#query=\` fragment instead — \`searchTarget\` only works within one page.
        `,
      },
    },
  },
};

/**
 * Facets rendered in an external DOM region via portal.
 */
export const ExternalFacetsRegion = {
  args: {
    config: {
      ...defaultConfig,
      facets: 'sidebar',
      facetsTarget: '#mg-story-external-facets',
    },
  },
  render: args => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        gap: '1.5rem',
        alignItems: 'flex-start',
      }}
    >
      <aside
        id="mg-story-external-facets"
        style={{
          padding: '1rem',
          background: '#f7f7f7',
          borderRadius: '4px',
          minHeight: '4rem',
        }}
      >
        {/* Facets render here via createPortal */}
      </aside>
      <div>
        <SyndicationSearchWidget {...args} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Renders the facets UI into a DOM element outside the widget's own container, identified by a CSS selector. Useful when a consuming page wants to place facets in a left rail or other region of the page that is not a child of the widget.

\`\`\`js
config: {
  facetsTarget: '#my-page-left-rail',
}
\`\`\`

The widget's React tree spans the portal so search context still flows — the facets and results stay in sync without any extra wiring. Drupal sites can pass the target via \`data-facets-target\`.

If the target element is not present at mount time the widget falls back to the in-widget \`facets\` layout and logs a single console warning.
        `,
      },
    },
  },
};
