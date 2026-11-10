import React, { useLayoutEffect } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import {
  SearchProvider,
  useSearchState,
  useSearchDispatch,
  actions,
} from '../context/SearchContext';
import FacetSelect from '../components/FacetSelect';
import { FACET_FIELDS } from '../utils/constants';
import { getMergedTypeBuckets } from '../utils/facetUtils';

const buckets = getMergedTypeBuckets({
  type: { buckets: [{ key: 'news', doc_count: 10 }] },
  field_news_type: {
    buckets: [
      { key: '751', doc_count: 7 },
      { key: '752', doc_count: 3 },
    ],
  },
});
const field = FACET_FIELDS.find(item => item.key === 'type');
const getLabel = (key, value) => value;
function TypeControl() {
  const { facets } = useSearchState();
  return (
    <FacetSelect
      field={field}
      buckets={buckets}
      selectedValues={facets.type}
      getLabel={getLabel}
    />
  );
}
function SeedSelection({ selected }) {
  const dispatch = useSearchDispatch();
  useLayoutEffect(() => {
    dispatch(actions.setFacet('type', selected, true));
  }, [dispatch, selected]);
  return <></>;
}
function setup({ selected = [], lang = 'en', labels } = {}) {
  return render(
    <SearchProvider
      lang={lang}
      labels={labels}
      config={{
        enableHashSync: false,
        defaultFilters: selected.map(value => ({ key: 'type', value })),
      }}
    >
      <SeedSelection selected={selected} />
      <TypeControl />
    </SearchProvider>
  );
}
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

it('distinguishes inherited inclusion, explicit children and a partially selected parent', async () => {
  const { container } = setup();
  const trigger = screen.getByRole('button');
  fireEvent.click(trigger);
  const news = screen.getByRole('option', { name: /^News 10$/ });
  const press = screen.getByRole('option', { name: /Press release 3$/ });
  fireEvent.click(news);
  const update = screen.getByRole('option', { name: /Update 7$/ });
  expect(news).toHaveAttribute('aria-selected', 'true');
  expect(update).toHaveClass('mg-select__option--inherited');
  expect(update).toHaveAttribute('aria-selected', 'false');
  expect(update).toHaveAccessibleDescription('Included through parent type');
  expect(trigger).toHaveTextContent('News');
  expect(await axe(container)).toHaveNoViolations();

  fireEvent.click(update);
  expect(update).toHaveAttribute('aria-selected', 'true');
  expect(update).not.toHaveClass('mg-select__option--inherited');
  expect(update).not.toHaveAttribute('aria-describedby');
  expect(trigger).toHaveTextContent('2 selected');
  // Removing the explicit child still leaves it included through News.
  fireEvent.click(update);
  expect(update).toHaveClass('mg-select__option--inherited');
  fireEvent.click(update);
  fireEvent.click(news);
  expect(news).toHaveAttribute('aria-selected', 'false');
  expect(news).toHaveClass('mg-select__option--partial');
  expect(news).toHaveAccessibleDescription('Some subtypes selected');
  expect(update).toHaveAttribute('aria-selected', 'true');
  expect(press).not.toHaveClass('mg-select__option--inherited');
  expect(trigger).toHaveTextContent('News: Update');
  expect(await axe(container)).toHaveNoViolations();

  fireEvent.keyDown(trigger, { key: 'Escape' });
  fireEvent.click(trigger);
  expect(news).not.toBeInTheDocument();
  expect(screen.getByRole('option', { name: /^News 10$/ })).toHaveClass(
    'mg-select__option--partial'
  );
  fireEvent.click(screen.getByRole('option', { name: /News: Update 7$/ }));
  expect(screen.getByRole('option', { name: /^News 10$/ })).not.toHaveClass(
    'mg-select__option--partial'
  );
});

it('does not infer a full parent selection from all currently available children', () => {
  setup({ selected: ['field_news_type:751', 'field_news_type:752'] });
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('option', { name: /^News 10$/ })).toHaveClass(
    'mg-select__option--partial'
  );
  expect(screen.getByRole('option', { name: /^News 10$/ })).toHaveAttribute(
    'aria-selected',
    'false'
  );
});

it.each([
  ['ar', 'مشمول من خلال النوع الرئيسي'],
  ['fr', 'Inclus via le type parent'],
])('localizes inherited descriptions in %s', (lang, description) => {
  setup({ selected: ['news'], lang });
  fireEvent.click(screen.getByRole('button'));
  expect(
    screen.getByRole('option', { name: /Update 7$/ })
  ).toHaveAccessibleDescription(description);
});

it('preserves consumer overrides for partial state descriptions', () => {
  setup({
    selected: ['field_news_type:751'],
    labels: { typeSubtypesSelected: 'Selected child types' },
  });
  fireEvent.click(screen.getByRole('button'));
  expect(
    screen.getByRole('option', { name: /^News 10$/ })
  ).toHaveAccessibleDescription('Selected child types');
});
