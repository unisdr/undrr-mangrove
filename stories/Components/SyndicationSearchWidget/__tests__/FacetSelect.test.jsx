/**
 * @file FacetSelect.test.jsx
 * @description Tests for FacetSelect option building: hiding unlabelled
 * taxonomy values and Year ordering.
 */

import React, { useLayoutEffect } from 'react';
import { render, screen } from '@testing-library/react';
import {
  SearchProvider,
  useSearchDispatch,
  actions,
} from '../context/SearchContext';
import FacetSelect from '../components/FacetSelect';
import { FACET_FIELDS } from '../utils/constants';

// Render options as a plain list so the test can read them without opening
// the custom dropdown.
jest.mock('../components/SelectDropdown', () => ({
  SelectDropdown: ({ options }) => (
    <ul data-testid="options">
      {options.map(option => (
        <li key={option.value} data-value={option.value}>
          {option.label}
        </li>
      ))}
    </ul>
  ),
}));

const field = key => FACET_FIELDS.find(f => f.key === key);

const LABELS = { 341: 'Avalanche', 342: 'Cold Wave' };

/** getLabel stand-in matching the useTaxonomies contract. */
function getLabel(fieldKey, value, vocabulary, options) {
  const valueStr = String(value);
  if (fieldKey === 'year') return valueStr;
  const miss = options && 'fallback' in options ? options.fallback : valueStr;
  return LABELS[valueStr] || miss;
}

function SeedFacets({ facets }) {
  const dispatch = useSearchDispatch();
  useLayoutEffect(() => {
    for (const [key, values] of Object.entries(facets)) {
      dispatch(actions.setFacet(key, values, true));
    }
  }, [dispatch, facets]);
  return null;
}

const NO_FACETS = {};

function renderFacet(props, selected = NO_FACETS) {
  return render(
    <SearchProvider config={{}}>
      <SeedFacets facets={selected} />
      <FacetSelect getLabel={getLabel} widgetId="test" {...props} />
    </SearchProvider>
  );
}

function optionValues() {
  return Array.from(screen.getByTestId('options').querySelectorAll('li')).map(
    li => li.getAttribute('data-value')
  );
}

const HAZARD_BUCKETS = [
  { key: '341', doc_count: 10 },
  { key: '9999', doc_count: 50 }, // deleted or unpublished term
  { key: '342', doc_count: 5 },
];

describe('FacetSelect', () => {
  describe('unlabelled taxonomy values', () => {
    it('marks only the three taxonomy-backed facets', () => {
      const marked = FACET_FIELDS.filter(f => f.labelSource === 'taxonomy').map(
        f => f.key
      );
      expect(marked).toEqual([
        'field_country_region',
        'field_hazard',
        'field_theme',
      ]);
    });

    it('hides unlabelled values once taxonomies are ready', () => {
      renderFacet({
        field: field('field_hazard'),
        buckets: HAZARD_BUCKETS,
        taxonomiesReady: true,
      });
      expect(optionValues()).toEqual(['341', '342']);
      expect(screen.queryByText('9999')).not.toBeInTheDocument();
    });

    it('shows raw IDs while taxonomies are loading or failed', () => {
      renderFacet({
        field: field('field_hazard'),
        buckets: HAZARD_BUCKETS,
        taxonomiesReady: false,
      });
      expect(optionValues()).toEqual(['9999', '341', '342']);
      expect(screen.getByText('9999')).toBeInTheDocument();
    });

    it('keeps a selected unlabelled value so it can be deselected', () => {
      renderFacet(
        {
          field: field('field_hazard'),
          buckets: HAZARD_BUCKETS,
          taxonomiesReady: true,
        },
        { field_hazard: ['9999'] }
      );
      expect(optionValues()).toEqual(['9999', '341', '342']);
      expect(screen.getByText('9999')).toBeInTheDocument();
    });

    it('keeps a selected value missing from the buckets', () => {
      renderFacet(
        {
          field: field('field_hazard'),
          buckets: HAZARD_BUCKETS,
          taxonomiesReady: true,
        },
        { field_hazard: ['8888'] }
      );
      expect(optionValues()).toEqual(['8888', '341', '342']);
    });

    it('hides nothing when no value in the facet has a label', () => {
      // e.g. an endpoint that omits this vocabulary, or a langcode filter
      renderFacet({
        field: field('field_country_region'),
        buckets: [
          { key: '123', doc_count: 4 },
          { key: '177', doc_count: 2 },
        ],
        taxonomiesReady: true,
      });
      expect(optionValues()).toEqual(['123', '177']);
    });

    it('does not hide values on facets without labelSource', () => {
      renderFacet({
        field: field('field_resource_type'),
        buckets: [{ key: '9999', doc_count: 3 }],
        taxonomiesReady: true,
      });
      expect(optionValues()).toEqual(['9999']);
    });
  });

  describe('Year ordering', () => {
    const YEAR_BUCKETS = [
      { key: '2019', doc_count: 300 },
      { key: '2024', doc_count: 10 },
      { key: 2021, doc_count: 50 },
      { key: '2025', doc_count: 1 },
    ];

    it('sorts years newest first, not by count', () => {
      renderFacet({ field: field('year'), buckets: YEAR_BUCKETS });
      expect(optionValues()).toEqual(['2025', '2024', '2021', '2019']);
    });

    it('floats selected years to the top', () => {
      renderFacet(
        { field: field('year'), buckets: YEAR_BUCKETS },
        { year: ['2019'] }
      );
      expect(optionValues()).toEqual(['2019', '2025', '2024', '2021']);
    });

    it('still sorts other facets by count', () => {
      renderFacet({
        field: field('field_hazard'),
        buckets: [
          { key: '342', doc_count: 1 },
          { key: '341', doc_count: 9 },
        ],
        taxonomiesReady: true,
      });
      expect(optionValues()).toEqual(['341', '342']);
    });
  });
});
