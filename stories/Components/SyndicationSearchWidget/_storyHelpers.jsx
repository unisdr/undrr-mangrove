/**
 * @file _storyHelpers.jsx
 * @description Shared helpers for the SyndicationSearchWidget story files.
 *
 * The widget's stories are split across several files (Widget, Layouts,
 * Display modes, Filters, Integrations, Toggles) so the Storybook sidebar
 * groups the variants logically. The shared decorator and default config
 * live here so each file stays small.
 */

import React from 'react';

/**
 * Decorator that renders the story description inline above the component.
 * Extracts markdown from `parameters.docs.description.story` and renders
 * the prose portion (everything before the first triple-backtick block).
 */
export const withInlineDescription = (Story, context) => {
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

/**
 * Baseline configuration used as a starting point for most widget stories.
 * Files spread this and override the fields relevant to their variant.
 */
export const defaultConfig = {
  searchEndpoint: 'https://www.undrr.org/search-endpoint',
  resultsPerPage: 5,
  debounceDelay: 500,
  minSearchLength: 3,
  defaultQuery: '',
  defaultSort: 'relevance',
  showSearchBox: true,
  showResultsCount: true,
  showSearchTimer: true,
  showFacets: true,
  showActiveFilters: true,
  showSearchMetrics: false,
  showPager: true,
  defaultFilters: [{ key: '_language', value: 'en' }],
};

/**
 * Component-level docs description used by every widget story file's
 * meta. Centralised so the autodocs landing page reads the same regardless
 * of which file Storybook hits first.
 */
export const widgetDocsDescription = `
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
`;

/**
 * Build a CSF3 meta object for one of the split widget story files.
 *
 * @param {string} subpath - The trailing segment of the title path,
 *   e.g. `'Layouts'`. Final title becomes
 *   `Components/Syndicated search/Widget/<subpath>`.
 * @param {object} component - The widget React component (passed in to
 *   avoid this file pulling SCSS via the widget import chain).
 */
export function makeWidgetMeta(subpath, component) {
  return {
    title: subpath
      ? `Components/Syndicated search/Widget/${subpath}`
      : 'Components/Syndicated search/Widget',
    component,
    decorators: [withInlineDescription],
    parameters: {
      layout: 'padded',
      docs: {
        description: {
          component: widgetDocsDescription,
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
}
