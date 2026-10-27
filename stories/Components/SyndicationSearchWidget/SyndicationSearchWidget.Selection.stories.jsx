import React, { useState } from 'react';
import { SyndicationSearchWidget } from './SyndicationSearchWidget';
import { SearchProvider } from './context/SearchContext';
import FacetsSidebar from './components/FacetsSidebar';
import MobileFilterDrawer from './components/MobileFilterDrawer';
import { widgetMetaShared } from './_storyHelpers';

const CONFIG = {
  enableHashSync: false,
  visibleFilters: [],
  taxonomyEndpoint: './fixtures/search-motion-taxonomies.json',
  customFacets: [
    {
      id: 'region',
      title: 'Region',
      options: [
        { label: 'Africa', query: 'region:africa' },
        { label: 'Asia', query: 'region:asia' },
      ],
    },
    {
      id: 'topics',
      title: 'Topics',
      multiSelect: true,
      options: Array.from({ length: 12 }, (_, index) => ({
        label: `Topic ${index + 1}`,
        query: `topic:${index + 1}`,
      })),
    },
  ],
};

function SelectionPreview() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SearchProvider config={CONFIG}>
      <div className="mg-search-widget">
        <button
          type="button"
          className="mg-search__filter-btn"
          onClick={() => setIsOpen(true)}
        >
          Filters
        </button>
        <aside className="mg-search__sidebar">
          <FacetsSidebar widgetId="selection-desktop" />
        </aside>
        <MobileFilterDrawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          widgetId="selection-mobile"
        />
      </div>
    </SearchProvider>
  );
}

export default {
  title: 'Components/Syndicated search',
  component: SyndicationSearchWidget,
  ...widgetMetaShared,
};

export const FilterSelection = {
  render: () => <SelectionPreview />,
  parameters: {
    docs: {
      description: {
        story:
          'Deterministic single-select and searchable multi-select filters. At mobile widths open Filters to exercise selection inside the real drawer; desktop uses the sidebar. No search service is required.',
      },
    },
  },
};
