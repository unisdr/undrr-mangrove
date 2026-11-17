/**
 * @file SyndicationSearchWidget.DisplayModes.stories.jsx
 * @description Display-mode variants: how individual results are rendered
 * (list vs card vs card-book) and which teaser fields are visible.
 */

import React, { useEffect } from 'react';
import { expect, waitFor } from 'storybook/test';
import {
  SearchProvider,
  actions,
  useSearchDispatch,
} from './context/SearchContext';
import SearchResults from './components/SearchResults';
import { publicationCoverFixture } from '../Cards/Card/cardGeometryChecks';
import { SyndicationSearchWidget } from './SyndicationSearchWidget';
import { allTeaserFieldsVisible } from './utils/constants';
import { defaultConfig, widgetMetaShared } from './_storyHelpers';

export default {
  title: 'Components/Syndicated search/Display modes',
  component: SyndicationSearchWidget,
  ...widgetMetaShared,
};

/**
 * Card display mode: vertical cards in a grid.
 */
export const CardDisplay = {
  args: {
    config: {
      ...defaultConfig,
      displayMode: 'card',
      resultsPerPage: 3,
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Renders search results as vertical cards in a responsive grid.

\`\`\`js
config: {
  displayMode: 'card',
  resultsPerPage: 3,
}
\`\`\`

Cards use \`.mg-card__vc\` BEM classes and are laid out with \`.mg-grid\`.
Each card shows: content type badge, title, body highlight, and metadata (domain + date).
Cards render cleanly without images.

**gridColumns** controls the grid column count (2-6). If not set, it defaults
to \`resultsPerPage\`. The mg-grid system handles responsive breakpoints
automatically (1 col mobile, multi-col desktop).
        `,
      },
    },
  },
};

/**
 * Card book display mode: book cover style cards.
 */
export const CardBookDisplay = {
  args: {
    config: {
      ...defaultConfig,
      displayMode: 'card-book',
      resultsPerPage: 4,
      gridColumns: 2,
      customFilters: ['type:publication'],
      visibleTeaserFields: { summary: false, contentType: false },
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
A publication catalogue with complete artwork, two readable columns and concise metadata.

\`\`\`js
config: {
  displayMode: 'card-book',
  resultsPerPage: 4,
  gridColumns: 2,
  customFilters: ['type:publication'],
  visibleTeaserFields: { summary: false, contentType: false },
}
\`\`\`

Uses \`.mg-card__vc mg-card__book\` BEM classes (vertical book card).
The endpoint must supply complete artwork. Book mode preserves image URLs and fits them within a shared desktop cover stage. Missing media leaves empty alignment space on desktop and collapses on mobile. Page size and column count are independent; use photo/list mode for general content.
        `,
      },
    },
  },
};

/**
 * Hidden teaser fields: toggle visibility of specific teaser fields.
 */
export const HiddenTeaserFields = {
  args: {
    config: {
      ...defaultConfig,
      defaultSort: 'newest',
      visibleTeaserFields: {
        ...allTeaserFieldsVisible(),
        contentType: false,
        publicationType: false,
        siteName: false,
        organization: false,
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Use \`visibleTeaserFields\` to hide specific fields from pre-rendered teaser HTML.
Set a field key to \`false\` to hide it, or \`true\` to keep it visible.
\`null\` (default) shows all fields. Title is not toggleable.

In this example, \`contentType\`, \`publicationType\`, \`siteName\`, and \`organization\` are hidden.
Results are sorted by date (\`defaultSort: 'newest'\`).

\`\`\`js
visibleTeaserFields: {
  image: true,           // Card image (.mg-card__visual)
  contentType: false,    // Content type badge (.mg-card__label)
  publicationType: false,// Publication subtype (.mg-card__publication-type)
  date: true,            // Publication date (.mg-card__date)
  siteName: false,       // Domain label (.mg-search__result-site-name)
  summary: true,         // Body text (.mg-card__description)
  organization: false,   // Organization name (.mg-card__organization)
}
\`\`\`

Uses CSS modifier classes: zero JS overhead, \`display: none\` removes from layout and accessibility tree.
        `,
      },
    },
  },
};

const BOOK_GRID_CONFIG = {
  displayMode: 'card-book',
  gridColumns: 2,
  resultsPerPage: 4,
  showSearchTimer: false,
  showPager: false,
};
const landscapeArtwork =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect width="240" height="160" fill="white"/><path d="M0 40h240v60H0z" fill="#00558a"/><text x="10" y="24" font-size="14">Landscape artwork</text><text x="10" y="148" font-size="14">Complete bottom edge</text></svg>'
  );
const BOOK_GRID_RESPONSE = {
  hits: {
    total: { value: 4, relation: 'eq' },
    hits: [
      [
        'portrait',
        'Complete portrait cover',
        publicationCoverFixture,
        'publication',
      ],
      ['missing', 'Publication without cover artwork', null, 'publication'],
      [
        'landscape',
        'Complete landscape artwork',
        landscapeArtwork,
        'publication',
      ],
      [
        'mixed',
        'General content retains its supplied image',
        landscapeArtwork,
        'landing',
      ],
    ].map(([id, title, image, type]) => ({
      _id: id,
      _source: {
        nid: id,
        title,
        type,
        field_domain_access: ['www_undrr_org'],
        teaser: `<div class="mg-card mg-card__hc">${image ? `<div class="mg-card__visual"><img src="${image}" alt="" class="mg-card__image" /></div>` : ''}<div class="mg-card__content"><div class="field field--name-node-title mg-card__title"><a href="#${id}">${title}</a></div><p class="mg-card__description">Short editorial context remains readable when a catalogue needs summaries.</p></div></div>`,
      },
    })),
  },
};
function BookGridFixture({ response = BOOK_GRID_RESPONSE }) {
  const dispatch = useSearchDispatch();
  useEffect(() => {
    dispatch(actions.initialize({}));
    dispatch(actions.setResults(response));
  }, [dispatch, response]);
  return (
    <div className="mg-search-widget">
      <SearchResults />
    </div>
  );
}
export const BookGridEdgeCases = {
  name: 'Book grid with mixed and missing artwork',
  render: () => (
    <SearchProvider config={BOOK_GRID_CONFIG}>
      <BookGridFixture />
    </SearchProvider>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('.mg-card__book')).toHaveLength(4)
    );
    const cards = [...canvasElement.querySelectorAll('.mg-card__book')];
    await Promise.all(
      [...canvasElement.querySelectorAll('img')].map(image => image.decode())
    );
    const view = canvasElement.ownerDocument.defaultView;
    expect(cards[1].querySelector('img')).toBeNull();
    const firstContent = cards[0]
      .querySelector('.mg-card__content')
      .getBoundingClientRect();
    const missingContent = cards[1]
      .querySelector('.mg-card__content')
      .getBoundingClientRect();
    if (view.matchMedia('(min-width: 1024px)').matches) {
      expect(Math.abs(firstContent.top - missingContent.top)).toBeLessThan(1);
    } else {
      expect(view.getComputedStyle(cards[1], '::before').content).toBe('none');
    }
    for (const image of canvasElement.querySelectorAll('img')) {
      expect(view.getComputedStyle(image).objectFit).toBe('contain');
      expect(image.src).not.toContain('/styles/por/');
      const bounds = image.getBoundingClientRect();
      const style = view.getComputedStyle(image);
      const width =
        bounds.width -
        parseFloat(style.borderLeftWidth) -
        parseFloat(style.borderRightWidth);
      const height =
        bounds.height -
        parseFloat(style.borderTopWidth) -
        parseFloat(style.borderBottomWidth);
      expect(width / height).toBeCloseTo(
        image.naturalWidth / image.naturalHeight,
        2
      );
    }
  },
};

export const BookGridWithoutImages = {
  name: 'Book grid with images explicitly hidden',
  render: () => (
    <SearchProvider
      config={{ ...BOOK_GRID_CONFIG, visibleTeaserFields: { image: false } }}
    >
      <BookGridFixture />
    </SearchProvider>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('.mg-card__book')).toHaveLength(4)
    );
    expect(canvasElement.querySelector('img')).toBeNull();
    expect(
      canvasElement.querySelector('.mg-search__results-grid--book')
    ).toBeNull();
    for (const card of canvasElement.querySelectorAll('.mg-card__book')) {
      const column = card.closest('[role="listitem"]');
      expect(
        Math.abs(
          card.getBoundingClientRect().width -
            column.getBoundingClientRect().width
        )
      ).toBeLessThan(1);
    }
  },
};

const NO_ARTWORK_RESPONSE = {
  ...BOOK_GRID_RESPONSE,
  hits: {
    ...BOOK_GRID_RESPONSE.hits,
    hits: BOOK_GRID_RESPONSE.hits.hits.map(hit => ({
      ...hit,
      _source: {
        ...hit._source,
        teaser: hit._source.teaser.replace(
          /<div class="mg-card__visual">.*?<\/div>/g,
          ''
        ),
      },
    })),
  },
};
export const BookGridNoArtwork = {
  name: 'Book grid when no results have artwork',
  render: () => (
    <SearchProvider config={BOOK_GRID_CONFIG}>
      <BookGridFixture response={NO_ARTWORK_RESPONSE} />
    </SearchProvider>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelectorAll('.mg-card__book')).toHaveLength(4)
    );
    expect(canvasElement.querySelector('img')).toBeNull();
    const view = canvasElement.ownerDocument.defaultView;
    for (const card of canvasElement.querySelectorAll('.mg-card__book')) {
      expect(view.getComputedStyle(card, '::before').content).toBe('none');
    }
  },
};
