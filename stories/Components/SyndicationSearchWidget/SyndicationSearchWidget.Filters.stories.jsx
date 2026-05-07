/**
 * @file SyndicationSearchWidget.Filters.stories.jsx
 * @description Filter / facet customisation variants:
 * `customFilters` (invisible Elasticsearch constraints), `customFacets`
 * (editor-defined dropdowns), the combination of both, and `allowedTypes`
 * (restricting the Type dropdown).
 */

import { SyndicationSearchWidget } from './SyndicationSearchWidget';
import { defaultConfig, makeWidgetMeta } from './_storyHelpers';

export default makeWidgetMeta('Filters', SyndicationSearchWidget);

/**
 * Custom Elasticsearch filters.
 *
 * `customFilters` are raw Elasticsearch query_string filters applied to all searches.
 * These are invisible to the user and cannot be removed via the UI.
 *
 * Common use cases:
 * - Restrict by content type: `type:news` or `type:(news OR publication)`
 * - Filter by date range: `year:[2020 TO 2024]`
 * - Filter by domain: `field_domain_access:www_preventionweb_net`
 * - Filter by taxonomy: `field_themes:123`
 * - Combine multiple: `type:news AND field_themes:456`
 */
export const CustomFilters = {
  args: {
    config: {
      ...defaultConfig,
      customFilters: [
        'type:(news OR publication)',
        'published_at:[2023-01-01 TO *]',
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
**customFilters** are raw Elasticsearch query_string filters that constrain all searches.
They are applied silently - users cannot see or remove them.

In this example:
- \`type:(news OR publication)\` - Only shows news and publications
- \`published_at:[2023-01-01 TO *]\` - Only content from 2023 onwards

Useful for creating topic-specific search widgets on landing pages.
        `,
      },
    },
  },
};

/**
 * Custom facets (editor-defined dropdowns).
 *
 * `customFacets` are dropdown filters defined in the widget configuration.
 * Each facet has an ID, title, and array of options with labels and queries.
 * Options appear as selectable filters in the sidebar.
 *
 * Structure:
 * ```json
 * {
 *   "id": "unique_id",
 *   "title": "Display Title",
 *   "weight": 10,
 *   "multiSelect": false,
 *   "options": [
 *     { "label": "Option Label", "query": "elasticsearch:query" }
 *   ]
 * }
 * ```
 */
export const CustomFacets = {
  args: {
    config: {
      ...defaultConfig,
      customFacets: [
        {
          id: 'region',
          title: 'Region',
          weight: 10,
          multiSelect: false,
          options: [
            { label: 'Africa', query: 'field_country_region:69' },
            { label: 'Americas', query: 'field_country_region:70' },
            { label: 'Asia-Pacific', query: 'field_country_region:71' },
            { label: 'Europe', query: 'field_country_region:72' },
            { label: 'Arab States', query: 'field_country_region:73' },
          ],
        },
        {
          id: 'hazard_type',
          title: 'Hazard Type',
          weight: 20,
          multiSelect: true,
          options: [
            { label: 'Flood', query: 'field_hazard:347' },
            { label: 'Drought', query: 'field_hazard:344' },
            { label: 'Earthquake', query: 'field_hazard:345' },
            { label: 'Cyclone/Hurricane', query: 'field_hazard:343' },
            { label: 'Wildfire', query: 'field_hazard:346' },
          ],
        },
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
**customFacets** create dropdown filters in the facets sidebar.

Each facet has:
- \`id\` - Unique identifier
- \`title\` - Display label
- \`weight\` - Sort order (lower = higher priority)
- \`multiSelect\` - Allow multiple selections
- \`options\` - Array of {label, query} pairs

In this example:
- **Region** - Single-select dropdown for geographic filtering (uses \`field_country_region\`)
- **Hazard Type** - Multi-select for filtering by hazard (uses \`field_hazard\`)

**Important:** Use exact Elasticsearch field names. Check \`FACET_FIELDS\` in constants.js for correct field names:
- \`field_hazard\` (not \`field_hazards\`)
- \`field_theme\` (not \`field_themes\`)
- \`field_country_region\` (not \`field_regions\`)

Term IDs can be found via the taxonomy API or by inspecting aggregation responses.
        `,
      },
    },
  },
};

/**
 * Combined custom filters and facets.
 *
 * Shows how customFilters and customFacets work together:
 * - customFilters provide invisible constraints
 * - customFacets provide user-selectable refinements
 */
export const CustomFiltersAndFacets = {
  args: {
    config: {
      ...defaultConfig,
      // Hidden constraints: only publications from PreventionWeb
      customFilters: [
        'type:publication',
        'field_domain_access:www_preventionweb_net',
      ],
      // Hide redundant filters
      visibleFilters: {
        type: false,
        year: false,
        field_domain_access: false,
      },
      // User-selectable facets
      customFacets: [
        {
          id: 'publication_year',
          title: 'Publication Year',
          weight: 5,
          multiSelect: false,
          options: [
            { label: '2024', query: 'published_at:[2024-01-01 TO 2024-12-31]' },
            { label: '2023', query: 'published_at:[2023-01-01 TO 2023-12-31]' },
            { label: '2022', query: 'published_at:[2022-01-01 TO 2022-12-31]' },
            {
              label: '2021 and earlier',
              query: 'published_at:[* TO 2021-12-31]',
            },
          ],
        },
        {
          id: 'document_type',
          title: 'Document Type',
          weight: 10,
          multiSelect: false,
          options: [
            { label: 'Policy Brief', query: 'field_publication_type:601' },
            { label: 'Technical Report', query: 'field_publication_type:602' },
            { label: 'Case Study', query: 'field_publication_type:603' },
            { label: 'Guidelines', query: 'field_publication_type:604' },
          ],
        },
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
This example combines **customFilters**, **visibleFilters**, and **customFacets** for a publications-only search:

**Hidden constraints (customFilters):**
- \`type:publication\` - Only publications appear in results
- \`field_domain_access:www_preventionweb_net\` - Only PreventionWeb content

**Hidden filters (visibleFilters):**
- \`type: false\` - Hides the Type dropdown (already constrained)
- \`year: false\` - Hides the Year dropdown (replaced by custom facet)
- \`field_domain_access: false\` - Hides the Website dropdown (already constrained)

**User options (customFacets):**
- **Publication Year** - Filter by year range
- **Document Type** - Filter by publication category

\`\`\`js
visibleFilters: {
  type: false,           // Hide Type filter
  field_hazard: false,   // Hide Hazard filter
  // Any facet key can be hidden
}
\`\`\`

This pattern is useful for creating specialized search experiences on topic landing pages.
        `,
      },
    },
  },
};

/**
 * Allowed content types (restricts Type dropdown).
 */
export const AllowedTypes = {
  args: {
    config: {
      ...defaultConfig,
      allowedTypes: {
        types: ['news', 'publication', 'event'],
        newsTypes: ['751', '752'], // Update, Press release
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Restricts which content types appear in the **Type** dropdown filter.

\`\`\`js
config: {
  allowedTypes: {
    types: ['news', 'publication', 'event'],  // Only these 3 types
    newsTypes: ['751', '752'],                // Only Update & Press release subtypes
  },
}
\`\`\`

**Available content types:**
| ID | Name |
|----|------|
| \`news\` | News |
| \`event\` | Event |
| \`publication\` | Publication |
| \`landing\` | Landing pages |
| \`vacancy\` | Vacancy |
| \`resource\` | Resources and training |
| \`collections\` | Collection guide |
| \`blog\` | DRR Voices |
| \`terminology\` | Term |
| \`organization\` | Organization |
| \`national_platform\` | National Platform |

**News subtypes (newsTypes):**
| ID | Name |
|----|------|
| \`751\` | Update |
| \`752\` | Press release |
| \`1\` | Statements and messages |
| \`754\` | Feature |
| \`797\` | Community announcement |
| \`756\` | Op Ed |

Use this when embedding search on topic-specific pages (e.g., a news section that shouldn't show events).
        `,
      },
    },
  },
};
