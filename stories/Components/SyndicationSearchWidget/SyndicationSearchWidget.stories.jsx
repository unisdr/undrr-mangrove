/**
 * @file SyndicationSearchWidget.stories.jsx
 * @description Storybook stories for the SyndicationSearchWidget component.
 */

import React from 'react';
import { SyndicationSearchWidget } from './SyndicationSearchWidget';
// SCSS is loaded via the Mangrove rollup (stories/assets/scss/_components.scss)

/**
 * Decorator that renders the story description inline above the component.
 * Extracts markdown from parameters.docs.description.story and renders it.
 */
const withInlineDescription = (Story, context) => {
  const description = context.parameters?.docs?.description?.story;

  if (!description) {
    return <Story />;
  }

  return (
    <div>
      <div
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '4px',
          borderLeft: '4px solid #0969da',
          lineHeight: '1.6',
        }}
      >
        <div
          style={{
            fontWeight: '600',
            marginBottom: '0.5rem',
            color: '#0969da',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          About this example
        </div>
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {description.trim().split('```')[0].trim()}
        </div>
      </div>
      <Story />
    </div>
  );
};

export default {
  title: 'Components/SyndicationSearchWidget',
  component: SyndicationSearchWidget,
  decorators: [withInlineDescription],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# UNDRR Syndication Search Widget

A React 19 search widget that integrates with Elasticsearch via the UNDRR /search-endpoint proxy.
This component is tightly coupled with the UNDRR web platform.

## Features

- **Responsive input**: Uses \`useDeferredValue\` to keep the input responsive while searching
- **Non-blocking updates**: Uses \`useTransition\` for smooth result updates
- **Active filters**: Displays removable chips for selected filters
- **Accessibility**: Full ARIA support, keyboard navigation, screen reader announcements
- **Theming**: Works with UNDRR Mangrove design system

## Usage

\`\`\`jsx
import { SyndicationSearchWidget } from '@undrr/mangrove/SyndicationSearchWidget';

<SyndicationSearchWidget
  config={{
    searchEndpoint: 'https://www.undrr.org/search-endpoint',
    resultsPerPage: 5,
    defaultFilters: [{ key: '_language', value: 'en' }],
  }}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    config: {
      description: 'Widget configuration object',
      control: 'object',
    },
  },
};

// Default configuration for stories
const defaultConfig = {
  searchEndpoint: 'https://www.undrr.org/search-endpoint',
  resultsPerPage: 5,
  debounceDelay: 300,
  minSearchLength: 3,
  defaultQuery: '',
  defaultSort: 'relevance',
  showSearchBox: true,
  showResultsCount: true,
  showSearchTimer: true,
  showFacets: true,
  showActiveFilters: true,
  showSearchMetrics: false,
  defaultFilters: [{ key: '_language', value: 'en' }],
};

/**
 * Default story - basic search widget.
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
 * Facets sidebar hidden.
 */
export const HiddenFacets = {
  args: {
    config: {
      ...defaultConfig,
      showFacets: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Hides the facets sidebar for a simpler search experience.

\`\`\`js
config: {
  showFacets: false,
}
\`\`\`

The search still works with all filters via URL hash — users just can't see or modify them through the UI.
        `,
      },
    },
  },
};

/**
 * Minimal configuration - just search.
 */
export const Minimal = {
  args: {
    config: {
      ...defaultConfig,
      showFacets: false,
      showActiveFilters: false,
      showResultsCount: false,
      showSearchTimer: false,
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

// Mock data for static display
const mockResults = {
  took: 42,
  hits: {
    total: { value: 1234 },
    hits: [
      {
        _id: '1',
        _score: 12.5,
        _source: {
          title: 'Climate Change and Disaster Risk Reduction',
          url: '/node/123',
          type: 'publication',
          field_domain_access: 'www_undrr_org',
          published_at: '2024-06-15T10:00:00Z',
          teaser:
            'This publication explores the intersection of climate change adaptation and disaster risk reduction strategies.',
        },
        highlight: {
          body: [
            '...the <em>climate change</em> impacts on disaster risk are significant...',
          ],
        },
      },
      {
        _id: '2',
        _score: 10.2,
        _source: {
          title: 'Sendai Framework Progress Report 2024',
          url: '/node/456',
          type: 'news',
          field_domain_access: 'www_preventionweb_net',
          published_at: '2024-05-20T14:30:00Z',
          teaser:
            'Annual progress report on the implementation of the Sendai Framework for Disaster Risk Reduction.',
        },
      },
    ],
  },
  aggregations: {
    type: {
      buckets: [
        { key: 'news', doc_count: 450 },
        { key: 'publication', doc_count: 320 },
        { key: 'event', doc_count: 180 },
      ],
    },
  },
};

/**
 * Static mockup for CSS testing (no API calls).
 */
export const StaticMockup = {
  parameters: {
    docs: {
      description: {
        story: `
A static mockup showing the widget's visual components without making API calls.

Use this story to:
- Review the UI without network dependencies
- Test CSS styling changes
- Document component structure
        `,
      },
    },
  },
  render: () => (
    <div className="mg-search-widget">
      <p
        style={{ padding: '1rem', background: '#f0f0f0', borderRadius: '4px' }}
      >
        <strong>Note:</strong> This is a static display for documentation
        purposes. In production, the widget connects to the /search-endpoint
        API.
      </p>

      <div style={{ marginTop: '1rem' }}>
        <h3>Search Form</h3>
        <form className="mg-search__form" role="search">
          <div className="mg-search__input-wrapper">
            <input
              type="search"
              className="mg-search__input form-control"
              placeholder="Search..."
              defaultValue="climate change"
            />
          </div>
          <button type="submit" className="mg-search__submit btn btn-primary">
            Search
          </button>
        </form>

        <h3 style={{ marginTop: '2rem' }}>Active Filters</h3>
        <div className="mg-search__active-filters">
          <span className="mg-search__active-filters-label">Filtered by:</span>
          <ul className="mg-search__active-filters-list">
            <li>
              <button className="mg-search__filter-chip">
                <span>News</span>
                <span className="mg-search__filter-chip-remove">&times;</span>
              </button>
            </li>
            <li>
              <button className="mg-search__filter-chip">
                <span>English</span>
                <span className="mg-search__filter-chip-remove">&times;</span>
              </button>
            </li>
          </ul>
          <button className="mg-search__clear-all">Clear all filters</button>
        </div>

        <h3 style={{ marginTop: '2rem' }}>Search Results</h3>
        <div className="mg-search__results">
          <p className="mg-search__results-count">
            Showing <strong>2</strong> of <strong>1,234</strong> results for{' '}
            <strong>"climate change"</strong>
            <span className="mg-search__results-time"> (42ms)</span>
          </p>

          <div className="mg-search__results-list">
            {mockResults.hits.hits.map(hit => (
              <article key={hit._id} className="mg-search__result">
                <div className="mg-search__result-content">
                  <div className="mg-search__result-text">
                    <h4 className="mg-search__result-title">
                      <a href="#">{hit._source.title}</a>
                    </h4>
                    <div className="mg-search__result-meta">
                      <span className="mg-search__result-type">
                        {hit._source.type}
                      </span>
                      <span className="mg-search__result-date">
                        {new Date(
                          hit._source.published_at
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mg-search__result-snippet">
                      {hit._source.teaser}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Query syntax reference and test cases.
 *
 * This story documents various Elasticsearch query_string syntax features
 * that users can leverage for advanced searches. Use these queries to verify
 * search behavior after making changes to the query builder.
 */
export const QuerySyntax = {
  args: {
    config: {
      ...defaultConfig,
      showSearchMetrics: true,
      resultsPerPage: 10,
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
## Search query test cases

Use these queries to test search functionality. Copy and paste into the search box.

### Basic queries

| Query | Description | Expected behavior |
|-------|-------------|-------------------|
| \`climate change\` | Simple multi-word | Matches docs with both words (AND), stop words removed, fuzziness added |
| \`disaster risk reduction\` | Common phrase | Stop words "the", "of" etc. removed for consistent matching |
| \`The Draft Articles on the Protection\` | With stop words | Same results as "Draft Articles Protection" |

### Exact phrase matching

| Query | Description | Expected behavior |
|-------|-------------|-------------------|
| \`"climate change"\` | Exact phrase | Matches exact phrase, no fuzziness, no stop word removal |
| \`"Draft Articles"\` | Exact phrase | Finds documents with "Draft Articles" as consecutive words |
| \`"disaster risk reduction"\` | Exact phrase | Stricter matching than without quotes |

### Wildcards and fuzzy

| Query | Description | Expected behavior |
|-------|-------------|-------------------|
| \`ris?\` | Single char wildcard | Matches "risk", "rise", etc. |
| \`red*\` | Multi-char wildcard | Matches "reduction", "reduce", "red", etc. |
| \`evnt~1\` | Fuzzy (edit distance 1) | Matches "event" (typo tolerance) |
| \`earthquke~2\` | Fuzzy (edit distance 2) | Matches "earthquake" |

### Boolean operators

| Query | Description | Expected behavior |
|-------|-------------|-------------------|
| \`flood AND drought\` | AND operator | Both terms required |
| \`flood OR drought\` | OR operator | Either term matches |
| \`flood NOT tsunami\` | NOT operator | Excludes tsunami results |
| \`-"Red Cross"\` | Exclude phrase | Excludes exact phrase |
| \`(UNDRR AND "New York")\` | Grouped | Parentheses for grouping |

### Field-specific searches

| Query | Description | Expected behavior |
|-------|-------------|-------------------|
| \`title:sendai\` | Search title only | Matches "sendai" in title field |
| \`_language:en\` | Language filter | English content only |
| \`type:landing\` | Content type | Landing pages only |
| \`type:(news OR publication)\` | Multiple types | News or publications |

### Date ranges

| Query | Description | Expected behavior |
|-------|-------------|-------------------|
| \`published_at:[2023-01-01 TO 2023-12-31]\` | Date range | Content from 2023 |
| \`published_at:[2020-01-01 TO *]\` | Open range | Content from 2020 onwards |
| \`published_at:[* TO 2022-12-31]\` | Open range | Content before 2023 |

### Boosting

| Query | Description | Expected behavior |
|-------|-------------|-------------------|
| \`history^1.1 review\` | Term boosting | "history" weighted 1.1x higher |
| \`title:sendai^2 body:sendai\` | Field boosting | Title matches weighted 2x |

### Complex combined query

\`\`\`
history^1.1 review disaster ris? red* -"Red Cross" evnt~1 ("UNDRR" AND New Yrk~1) _language:en type:landing published_at:[2023-01-01 TO 2023-10-31]
\`\`\`

This query demonstrates:
- \`history^1.1\` - boosted term
- \`review disaster\` - simple terms
- \`ris?\` - single character wildcard
- \`red*\` - multi-character wildcard
- \`-"Red Cross"\` - excluded phrase
- \`evnt~1\` - fuzzy search for "event"
- \`("UNDRR" AND New Yrk~1)\` - grouped boolean with fuzzy
- \`_language:en\` - field filter
- \`type:landing\` - content type filter
- \`published_at:[2023-01-01 TO 2023-10-31]\` - date range

### Edge cases to verify

| Query | Description | Expected behavior |
|-------|-------------|-------------------|
| \`a\` | Too short | Should not trigger search (min 3 chars) |
| \`ab\` | Too short | Should not trigger search |
| \`abc\` | Minimum length | Should trigger search |
| \`   spaces   \` | Extra whitespace | Should trim and search "spaces" |
| \`:\` | Special char only | Should handle gracefully |
| \`""\` | Empty quotes | Should handle gracefully |
| \`"""\` | Unbalanced quotes | Should handle gracefully |

### Query sanitization (auto-fixed)

These malformed queries are automatically sanitized to prevent Elasticsearch errors:

| Query | Problem | Auto-corrected to |
|-------|---------|-------------------|
| \`"local\` | Unclosed quote | \`local\` |
| \`local OR \` | Trailing operator | \`local\` |
| \`AND climate\` | Leading operator | \`climate\` |
| \`flood OR\` | Trailing OR | \`flood\` |
| \`AND\` | Standalone operator | (empty - no search) |
| \`climate-\` | Trailing special char | \`climate\` |
| \`"test\` | Unclosed quote | \`test\` |
        `,
      },
    },
  },
};
