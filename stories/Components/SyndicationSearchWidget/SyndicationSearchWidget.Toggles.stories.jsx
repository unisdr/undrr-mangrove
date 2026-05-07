/**
 * @file SyndicationSearchWidget.Toggles.stories.jsx
 * @description Boolean visibility toggles — variants that exercise the
 * `show*` config flags (pager, debug metrics).
 */

import { SyndicationSearchWidget } from './SyndicationSearchWidget';
import { defaultConfig, makeWidgetMeta } from './_storyHelpers';

export default makeWidgetMeta('Toggles', SyndicationSearchWidget);

/**
 * With pager disabled.
 */
export const NoPager = {
  args: {
    config: {
      ...defaultConfig,
      showPager: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Disables the pager at the bottom of search results:

\`\`\`js
config: {
  showPager: false,
}
\`\`\`

When the pager is disabled, only the first page of results is shown. Users cannot navigate to additional pages.

Useful for:
- Preview widgets showing top results
- Compact search experiences
- When you want users to refine their search instead of paginating
        `,
      },
    },
  },
};

/**
 * Debug metrics enabled (shows score, interestingness, longevity).
 */
export const DebugMetrics = {
  args: {
    config: {
      ...defaultConfig,
      showSearchMetrics: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Enables debug metrics on each search result:

\`\`\`js
config: {
  showSearchMetrics: true,
}
\`\`\`

Shows for each result:
- **Score** — Elasticsearch relevance score
- **Int** — Interestingness value (editorial weight)
- **Long** — Longevity value (content freshness decay)

Useful for debugging search ranking and understanding why certain results appear higher.
        `,
      },
    },
  },
};
