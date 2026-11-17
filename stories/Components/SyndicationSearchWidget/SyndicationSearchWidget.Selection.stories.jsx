import React, { useState, useEffect } from 'react';
import { SyndicationSearchWidget } from './SyndicationSearchWidget';
import {
  SearchProvider,
  useSearchDispatch,
  actions,
} from './context/SearchContext';
import FacetsSidebar from './components/FacetsSidebar';
import MobileFilterDrawer from './components/MobileFilterDrawer';
import { widgetMetaShared } from './_storyHelpers';

const CONFIG = {
  enableHashSync: false,
  visibleFilters: ['type'],
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

// Local response keeps hierarchy checks independent of the search service.
function TypeFixture() {
  const dispatch = useSearchDispatch();
  useEffect(() => {
    dispatch(
      actions.setResults({
        aggregations: {
          type: {
            buckets: [
              { key: 'publication', doc_count: 20 },
              { key: 'news', doc_count: 10 },
            ],
          },
          field_publication_type: {
            buckets: [{ key: 'report', doc_count: 8 }],
          },
          field_news_type: {
            buckets: [
              { key: '751', doc_count: 7 },
              { key: '752', doc_count: 3 },
            ],
          },
        },
      })
    );
  }, [dispatch]);
  return <></>;
}

function SelectionPreview() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SearchProvider config={CONFIG}>
      <TypeFixture />
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
          'Deterministic hierarchical Type, single-select and searchable multi-select filters. At mobile widths open Filters to exercise selection inside the real drawer; desktop uses the sidebar. No search service is required.',
      },
    },
  },
};
