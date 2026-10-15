/**
 * Deterministic motion states use the real search context, results, progress
 * and drawer components without querying a search service. Controls settle
 * the state on demand so browser and visual checks do not race network timers.
 */
import React, { useEffect, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { SyndicationSearchWidget } from './SyndicationSearchWidget';
import {
  SearchProvider,
  actions,
  useSearchDispatch,
  useSearchState,
} from './context/SearchContext';
import SearchResults from './components/SearchResults';
import SearchProgress from './components/SearchProgress';
import MobileFilterDrawer from './components/MobileFilterDrawer';
import { widgetMetaShared } from './_storyHelpers';

const PREVIEW_CONFIG = {
  enableHashSync: false,
  resultsPerPage: 3,
  showSearchTimer: false,
  showPager: false,
  visibleFilters: ['type'],
  taxonomyEndpoint: './fixtures/search-motion-taxonomies.json',
};
const RESPONSE = {
  hits: {
    total: { value: 2 },
    hits: [
      {
        _id: 'one',
        _source: {
          teaser:
            '<h3>Preparing communities for floods</h3><p>Local early warning and preparedness.</p>',
          type: 'news',
          field_domain_access: ['www_undrr_org'],
        },
      },
      {
        _id: 'two',
        _source: {
          teaser:
            '<h3>Understanding disaster risk</h3><p>Research and practical guidance.</p>',
          type: 'news',
          field_domain_access: ['www_undrr_org'],
        },
      },
    ],
  },
  aggregations: { type: { buckets: [{ key: 'news', doc_count: 2 }] } },
};

function MotionState({ initialState = 'initial' }) {
  const dispatch = useSearchDispatch();
  const { isLoading } = useSearchState();
  const [drawerOpen, setDrawerOpen] = useState(initialState === 'drawer');
  useEffect(() => {
    dispatch(actions.initialize({}));
    if (initialState !== 'initial') dispatch(actions.setResults(RESPONSE));
    dispatch(
      actions.setLoading(
        initialState === 'initial' || initialState === 'refreshing'
      )
    );
  }, [dispatch, initialState]);

  return (
    <>
      <div
        style={{
          display: 'flex',
          gap: 'var(--mg-spacing-50)',
          marginBlockEnd: 'var(--mg-spacing-100)',
        }}
      >
        <button
          type="button"
          className="mg-button mg-button-secondary"
          onClick={() => dispatch(actions.setLoading(true))}
        >
          Refresh results
        </button>
        <button
          type="button"
          className="mg-button mg-button-secondary"
          onClick={() => dispatch(actions.setResults(RESPONSE))}
        >
          Complete search
        </button>
        <button
          type="button"
          className="mg-button mg-button-secondary"
          onClick={() =>
            dispatch(actions.setError('Search service unavailable'))
          }
        >
          Fail search
        </button>
      </div>
      <div className="mg-search-widget">
        <div className="mg-search__main" aria-busy={isLoading}>
          {isLoading && <SearchProgress />}
          <SearchResults
            showMobileFilterButton
            onOpenFilters={() => setDrawerOpen(true)}
          />
        </div>
        <MobileFilterDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          widgetId="motion-preview"
        />
      </div>
    </>
  );
}

function MotionPreview({ initialState }) {
  return (
    <SearchProvider config={PREVIEW_CONFIG}>
      <MotionState initialState={initialState} />
    </SearchProvider>
  );
}

export default {
  title: 'Components/Syndicated search',
  component: SyndicationSearchWidget,
  ...widgetMetaShared,
};

export const InitialLoading = {
  render: () => <MotionPreview initialState="initial" />,
  parameters: {
    docs: {
      description: {
        story:
          'Static skeleton geometry and shared indeterminate ProgressBar. Under reduced motion the strip becomes dashed. Forced colours preserves skeleton outlines.',
      },
    },
  },
};

export const RefreshingResults = {
  render: () => <MotionPreview initialState="refreshing" />,
  parameters: {
    docs: {
      description: {
        story:
          'Retained results stay dimmed, with the shared strip and decorative inline Loader. Complete or fail the search to check busy-state cleanup and result entry.',
      },
    },
  },
};

export const ResultsEntry = {
  render: () => <MotionPreview initialState="ready" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('list', { name: 'Search results' })
      ).toBeInTheDocument()
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Refresh results' })
    );
    await waitFor(() =>
      expect(canvasElement.querySelector('.mg-search__main')).toHaveAttribute(
        'aria-busy',
        'true'
      )
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Complete search' })
    );
    await waitFor(() =>
      expect(canvasElement.querySelector('.mg-search__main')).toHaveAttribute(
        'aria-busy',
        'false'
      )
    );
    expect(canvasElement.querySelector('progress')).toBeNull();
  },
};

export const FilterDrawer = {
  render: () => <MotionPreview initialState="drawer" />,
  parameters: {
    chromatic: { viewports: [375] },
    docs: {
      description: {
        story:
          'At a narrow viewport, the open filter drawer enters from the inline start in both directions and appears instantly under reduced motion. Focus moves immediately. Closing unmounts without an exit delay.',
      },
    },
  },
};
