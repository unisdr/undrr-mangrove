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
import { getMergedTypeBuckets } from '../utils/facetUtils';

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
      <FacetSelect
        getLabel={getLabel}
        widgetId="test"
        selectedValues={selected[props.field?.key]}
        {...props}
      />
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

describe('Type hierarchy', () => {
  const buckets = getMergedTypeBuckets({
    type: {
      buckets: [
        { key: 'publication', doc_count: 20 },
        { key: 'news', doc_count: 10 },
      ],
    },
    field_publication_type: { buckets: [{ key: 'report', doc_count: 8 }] },
    field_undrr_publication_types: { buckets: [{ key: '123', doc_count: 9 }] },
    field_news_type: {
      buckets: [
        { key: '751', doc_count: 7 },
        { key: '752', doc_count: 3 },
      ],
    },
    vid: { buckets: [{ key: 'hazard', doc_count: 2 }] },
  });
  const order = buckets.map(bucket => String(bucket.key));

  it.each([
    ['news'],
    ['field_news_type:751'],
    ['publication', 'field_news_type:751', 'field_publication_type:report'],
  ])('keeps aggregation hierarchy with selections %j', (...selectedValues) => {
    renderFacet({ field: field('type'), buckets, selectedValues });
    expect(optionValues()).toEqual(order);
  });

  it('keeps order through selection and deselection', () => {
    const view = selectedValues => (
      <SearchProvider config={{}}>
        <FacetSelect
          field={field('type')}
          buckets={buckets}
          selectedValues={selectedValues}
          getLabel={getLabel}
        />
      </SearchProvider>
    );
    const { rerender } = render(view([]));
    for (const selection of [
      ['news'],
      ['news', 'field_news_type:751'],
      ['field_news_type:751'],
      [],
    ]) {
      rerender(view(selection));
      expect(optionValues()).toEqual(order);
    }
  });

  it('inserts a retained missing subtype at the end of its available group', () => {
    renderFacet({
      field: field('type'),
      buckets,
      selectedValues: ['field_news_type:754'],
    });
    expect(optionValues()).toEqual([
      ...order.slice(0, -1),
      'field_news_type:754',
      order.at(-1),
    ]);
    expect(screen.getByText('News: Feature')).toBeInTheDocument();
  });

  it('puts a retained missing parent before its available children', () => {
    renderFacet({
      field: field('type'),
      buckets: buckets.filter(bucket => bucket.key !== 'news'),
      selectedValues: ['news'],
    });
    expect(optionValues()).toEqual(order);
  });

  it('keeps orphan selections removable without inventing a parent', () => {
    renderFacet({
      field: field('type'),
      buckets: [],
      selectedValues: ['field_news_type:751'],
    });
    expect(optionValues()).toEqual(['field_news_type:751']);
  });

  it('retains an excluded selection beside its allowed parent', () => {
    renderFacet({
      field: field('type'),
      buckets,
      allowedTypes: { types: ['news'], newsTypes: ['752'] },
      selectedValues: ['field_news_type:751'],
    });
    expect(optionValues()).toEqual([
      'news',
      'field_news_type:752',
      'field_news_type:751',
      'vid:hazard',
    ]);
  });
});
