/**
 * @file SyndicationSearchWidget.DisplayModes.stories.jsx
 * @description Display-mode variants: how individual results are rendered
 * (list vs card vs card-book) and which teaser fields are visible.
 */

import { SyndicationSearchWidget } from './SyndicationSearchWidget';
import { allTeaserFieldsVisible } from './utils/constants';
import { defaultConfig, makeWidgetMeta } from './_storyHelpers';

export default makeWidgetMeta('Display modes', SyndicationSearchWidget);

/**
 * Card display mode — vertical cards in a grid.
 */
export const CardDisplay = {
  args: {
    config: {
      ...defaultConfig,
      displayMode: 'card',
      resultsPerPage: 3,
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Renders search results as vertical cards in a responsive grid.

\`\`\`js
config: {
  displayMode: 'card',
  resultsPerPage: 3,
}
\`\`\`

Cards use \`.mg-card__vc\` BEM classes and are laid out with \`.mg-grid\`.
Each card shows: content type badge, title, body highlight, and metadata (domain + date).
Cards render cleanly without images.

**gridColumns** controls the grid column count (2-6). If not set, it defaults
to \`resultsPerPage\`. The mg-grid system handles responsive breakpoints
automatically (1 col mobile, multi-col desktop).
        `,
      },
    },
  },
};

/**
 * Card book display mode — book cover style cards.
 */
export const CardBookDisplay = {
  args: {
    config: {
      ...defaultConfig,
      displayMode: 'card-book',
      resultsPerPage: 4,
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Renders search results as book-cover style cards in a 4-column grid.

\`\`\`js
config: {
  displayMode: 'card-book',
  resultsPerPage: 4,
}
\`\`\`

Uses \`.mg-card__vc mg-card__book\` BEM classes (vertical book card).
Useful for publication-heavy search results.
        `,
      },
    },
  },
};

/**
 * Hidden teaser fields — toggle visibility of specific teaser fields.
 */
export const HiddenTeaserFields = {
  args: {
    config: {
      ...defaultConfig,
      defaultSort: 'newest',
      visibleTeaserFields: {
        ...allTeaserFieldsVisible(),
        contentType: false,
        publicationType: false,
        siteName: false,
        organization: false,
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Use \`visibleTeaserFields\` to hide specific fields from pre-rendered teaser HTML.
Set a field key to \`false\` to hide it, or \`true\` to keep it visible.
\`null\` (default) shows all fields. Title is not toggleable.

In this example, \`contentType\`, \`publicationType\`, \`siteName\`, and \`organization\` are hidden.
Results are sorted by date (\`defaultSort: 'newest'\`).

\`\`\`js
visibleTeaserFields: {
  image: true,           // Card image (.mg-card__visual)
  contentType: false,    // Content type badge (.mg-card__label)
  publicationType: false,// Publication subtype (.mg-card__publication-type)
  date: true,            // Publication date (.mg-card__date)
  siteName: false,       // Domain label (.mg-search__result-site-name)
  summary: true,         // Body text (.mg-card__description)
  organization: false,   // Organization name (.mg-card__organization)
}
\`\`\`

Uses CSS modifier classes — zero JS overhead, \`display: none\` removes from layout and accessibility tree.
        `,
      },
    },
  },
};
