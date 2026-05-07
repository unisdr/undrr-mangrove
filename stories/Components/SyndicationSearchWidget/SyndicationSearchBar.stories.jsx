import React from 'react';
import { SyndicationSearchBar } from './SyndicationSearchBar';
import { SyndicationSearchWidget } from './SyndicationSearchWidget';

/**
 * Standalone search bar designed to pair with a SyndicationSearchWidget
 * mounted elsewhere on the page (or on a different page entirely).
 *
 * The bar communicates with the results widget via the URL hash — it
 * writes `#query=<encoded>` on submit, and the widget's existing
 * `useHashSync` hook picks it up. There is no shared store or runtime
 * coupling between the two; the URL is the contract.
 */
export default {
  title: 'Components/SyndicationSearchBar',
  component: SyndicationSearchBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A thin React component that renders a search input + submit button styled to match the rest of Mangrove (\`mg-button mg-button-primary\` + \`mg-icon-search\`). It is intentionally context-free: no shared React store with the results widget, no extra wiring — just a form that updates the URL hash on submit.

### Two placement patterns

**Same-page hero** — mount the bar in a hero/banner area and the results widget further down the same page. Submitting the bar sets the page hash; \`useHashSync\` in the results widget fires and re-runs the search.

**Cross-page hero** — mount the bar on a landing page and the results widget on a separate \`/search\` page. Set \`searchTargetUrl\` so submit navigates to that page with the hash appended.

### Drupal usage

\`\`\`html
<div data-mg-syndicated-search-bar
     data-placeholder="Search PreventionWeb"
     data-search-target-url="/search"></div>
\`\`\`
        `,
      },
    },
  },
};

export const Default = {
  args: {
    placeholder: 'Search...',
  },
};

export const PrefilledQuery = {
  args: {
    defaultQuery: 'climate change',
  },
};

export const CustomLabel = {
  args: {
    placeholder: 'What are you looking for?',
    submitLabel: 'Find',
  },
};

/**
 * Live demo: bar above, results below, communicating via the URL hash on
 * the same page. Submitting the bar updates the hash and the results
 * widget's useHashSync re-runs the search.
 */
export const HeroAboveResults = {
  render: () => (
    <div>
      <div
        style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, #003366, #00558a)',
          color: '#fff',
          marginBottom: '2rem',
          borderRadius: '4px',
        }}
      >
        <h2 style={{ marginTop: 0, color: '#fff' }}>Find what matters</h2>
        <p style={{ color: '#cce' }}>
          Type a query and press Enter — the results below update via URL hash.
        </p>
        <SyndicationSearchBar placeholder="Search disaster risk reduction..." />
      </div>
      <SyndicationSearchWidget config={{ enableHashSync: true }} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A typical hero-search pattern: the bar sits in a banner area, the results render lower on the page, and the URL hash is the bridge.',
      },
    },
  },
};

/**
 * Cross-page navigation — submit takes the user to a different URL with
 * the hash appended. Demoed here with a `navigate` prop that just logs
 * the URL instead of actually navigating away from Storybook.
 */
export const CrossPageNavigation = {
  args: {
    placeholder: 'Search...',
    searchTargetUrl: '/search',
    navigate: url => {
      window.alert(`Would navigate to: ${url}`);
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "When `searchTargetUrl` is set, submit calls the configured `navigate` function with the resolved URL. In production the default navigates via `window.location.assign`; in this story we substitute an alert so you don't actually leave Storybook.",
      },
    },
  },
};
