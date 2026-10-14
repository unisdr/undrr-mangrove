import React, { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Hero } from '../../Components/Hero/Hero';
import { SyndicationSearchWidget } from '../../Components/SyndicationSearchWidget/SyndicationSearchWidget';
import { buildQuery } from '../../Components/SyndicationSearchWidget/utils/queryBuilder';
import { mgShowMore } from '../../assets/js/show-more';
import {
  mgOnThisPageNav,
  mgOnThisPageNavDestroy,
} from '../../assets/js/on-this-page-nav';
import { UndrrChrome } from '../_shared/UndrrChrome';
import { SkipLink } from '../../Utilities/SkipLink/SkipLink';
import {
  COLLECTIONS_URL,
  collections,
  itemFilters,
  relatedFilters,
  relatedRanking,
  tagsFor,
} from './collections';

const SEARCH_ENDPOINT = 'https://www.undrr.org/search-endpoint';
const PREVENTIONWEB_URL = 'https://www.preventionweb.net/';

// A slow or blocked endpoint must not leave "Counting items…" on screen.
const REQUEST_TIMEOUT = 8000;

// Show about eight lines of the description, and collapse only when at least
// six more would be hidden, so only bodies over about fourteen lines collapse.
const MIN_HIDDEN_LINES = 6;
// Eight of the body's own lines; 13.5rem is about the same where lh is missing.
const COLLAPSED_HEIGHT =
  typeof CSS !== 'undefined' && CSS.supports?.('height', '1lh')
    ? '8lh'
    : '13.5rem';

const text = {
  skip: 'Skip to page content',
  breadcrumbs: 'Breadcrumbs',
  home: 'PreventionWeb',
  collections: 'Collections',
  counting: 'Counting items…',
  items: (count, locale) =>
    count === 1
      ? '1 item'
      : `${new Intl.NumberFormat(locale).format(count)} items`,
  noItems: 'No items yet',
  latest: 'Latest item:',
  about: 'About this collection',
  index: 'In this collection',
  related: 'Related collections',
  emptyTitle: 'Nothing has been added to this collection yet',
  emptyText: 'Items added to this collection will be listed here.',
  emptyAction: 'Browse all collections',
  showMore: 'Show more',
  showLess: 'Show less',
  showContext: ' about this collection',
  onThisPage: 'On this page',
  topics: 'Topics',
};

// The search widget says "results"; a collection holds items. One noun on
// the page, in the header and in the list's own count.
const ITEM_LABELS = {
  showingResults: 'Showing {start}–{end} of {total} items',
  showingResultsApprox: 'Showing {start}–{end} of more than {total} items',
  srResultsFound: '{count} item found',
  srResultsFoundPlural: '{count} items found',
  srResultsFoundForQuery: '{count} item found for {query}',
  srResultsFoundPluralForQuery: '{count} items found for {query}',
  srResultsFoundApprox: 'More than {count} items found',
  srResultsFoundApproxForQuery: 'More than {count} items found for {query}',
};

// Analytics regions and labels. The shared UNDRR analytics script reports a
// click's innermost data-vf-google-analytics-region and prefers
// data-vf-analytics-label over link text. Labels stay in English and leave out
// counts, so reports do not split by language or by number.
const REGION = {
  header: 'collection-header',
  nav: 'on-this-page-nav',
  about: 'collection-about',
  content: 'collection-content',
  related: 'collection-related',
};

// Dates follow the editorial manual ("10 July 2026"), which en-US does not.
const dateLocale = lang => (lang === 'en' ? 'en-GB' : lang);

/** POST a query to the search endpoint, giving up after REQUEST_TIMEOUT. */
async function search(body, signal) {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT);
  const abort = () => timeout.abort();
  signal.addEventListener('abort', abort);
  try {
    const response = await fetch(SEARCH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: timeout.signal,
    });
    if (!response.ok) throw new Error(String(response.status));
    return await response.json();
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}

/**
 * The index stores `published_at` as Unix seconds, usually wrapped in an
 * array (`[1762955302]`). Accept that, milliseconds and ISO strings, and
 * return an ISO string, or null when the value is not a usable date.
 */
const toIsoDate = value => {
  const raw = [].concat(value ?? [])[0];
  if (raw === undefined || raw === null || raw === '') return null;
  const numeric = typeof raw === 'number' ? raw : Number(raw);
  let date;
  if (Number.isFinite(numeric)) {
    date = new Date(numeric < 1e12 ? numeric * 1000 : numeric);
  } else {
    date = new Date(raw);
  }
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const totalOf = data => {
  const total = data?.hits?.total;
  return typeof total === 'number' ? total : (total?.value ?? 0);
};

/**
 * The item count and the newest item's date, from one query: the content
 * list's own query (status filter included) with the same filters, sorted
 * newest first, one hit. The header and the list cannot disagree. A server
 * should run the same query and cache the answer with the collection.
 */
function useItems(filters, known) {
  const [state, setState] = useState(() =>
    known === undefined
      ? { status: 'loading', count: null, latest: null }
      : { status: 'done', count: known, latest: null }
  );
  const key = JSON.stringify(filters);

  useEffect(() => {
    if (known !== undefined) return undefined;
    const controller = new AbortController();
    const body = buildQuery(
      {
        query: '',
        facets: {},
        facetOperators: {},
        customFacets: {},
        sortBy: 'newest',
      },
      { customFilters: JSON.parse(key), facets: false, resultsPerPage: 1 }
    );
    delete body.highlight;
    search(
      { ...body, track_total_hits: true, _source: ['published_at'] },
      controller.signal
    )
      .then(data => {
        const newest = data?.hits?.hits?.[0]?._source?.published_at;
        setState({
          status: 'done',
          count: totalOf(data),
          latest: toIsoDate(newest),
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ status: 'failed', count: null, latest: null });
        }
      });
    return () => controller.abort();
  }, [key, known]);

  return state;
}

/** The node ids of up to three related collections, best first. */
function useRelated(collection) {
  const ranking = relatedRanking(collection);
  const key = JSON.stringify(ranking);
  const [state, setState] = useState(() =>
    ranking ? { status: 'loading', nids: [] } : { status: 'done', nids: [] }
  );

  useEffect(() => {
    if (!key || key === 'null') return undefined;
    const controller = new AbortController();
    search(JSON.parse(key), controller.signal)
      .then(data =>
        setState({
          status: 'done',
          nids: (data?.hits?.hits || [])
            .map(hit => [].concat(hit._source?.nid)[0])
            .filter(Boolean),
        })
      )
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'done', nids: [] });
      });
    return () => controller.abort();
  }, [key]);

  return state;
}

function Paragraph({ part }) {
  if (typeof part === 'string') return <p>{part}</p>;
  return (
    <p>
      {part.before}
      <a href={part.link.href}>{part.link.text}</a>
      {part.after}
    </p>
  );
}

Paragraph.propTypes = {
  part: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
};

/** The body in vanilla ShowMore markup, as a Drupal template would emit it. */
function About({ id, paragraphs }) {
  const button = useRef(null);
  useEffect(() => mgShowMore(button.current), []);
  return (
    <>
      <div
        id={`${id}-body`}
        className="mg-reading__article mg-content"
        style={{ '--mg-show-more-height': COLLAPSED_HEIGHT }}
      >
        {paragraphs.map((part, index) => (
          // Index key: fixed sample copy that never reorders.
          <Paragraph key={index} part={part} />
        ))}
      </div>
      {/* Shipped hidden: without JavaScript the body is simply open. */}
      <button
        ref={button}
        type="button"
        hidden
        className="mg-button mg-button-secondary mg-show-more--button"
        data-mg-show-more="true"
        data-mg-show-more-skip-auto-init="true"
        data-mg-show-more-target={`#${id}-body`}
        data-mg-show-more-min-hidden-lines={MIN_HIDDEN_LINES}
        data-mg-show-more-label-collapsed={text.showMore}
        data-mg-show-more-label-open={text.showLess}
        data-mg-show-more-analytics-collapsed="Collection: show more"
        data-mg-show-more-analytics-open="Collection: show less"
      >
        <span data-mg-show-more-label>{text.showMore}</span>
        <span className="mg-u-sr-only">{text.showContext}</span>
      </button>
    </>
  );
}

About.propTypes = {
  id: PropTypes.string.isRequired,
  paragraphs: PropTypes.array.isRequired,
};

/**
 * The facts line: the item count, linked to the list, and the date of the
 * newest item. At zero the count is plain text: there is nothing to jump to.
 */
function Facts({ items, locale, itemsId }) {
  if (items.status === 'loading') return text.counting;
  if (items.count === 0) return text.noItems;
  return (
    <>
      <a href={`#${itemsId}`} data-vf-analytics-label="Collection: item count">
        {text.items(items.count, locale)}
      </a>
      {items.latest && (
        <>
          <span aria-hidden="true"> · </span>
          {text.latest}{' '}
          <time dateTime={items.latest.slice(0, 10)}>
            {new Intl.DateTimeFormat(dateLocale(locale), {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(new Date(items.latest))}
          </time>
        </>
      )}
    </>
  );
}

Facts.propTypes = {
  items: PropTypes.object.isRequired,
  itemsId: PropTypes.string.isRequired,
  locale: PropTypes.string.isRequired,
};

/**
 * The sticky On this page bar in explicit mode: vanilla OnThisPageNav markup
 * with one link per section, as a Drupal template would emit it. When the
 * links change (related collections arrive) the script is re-run on the same
 * element, so scroll-spy watches exactly the sections on the page.
 */
function SectionNav({ items }) {
  const nav = useRef(null);
  const key = items.map(item => item.href).join(' ');
  useEffect(() => {
    const element = nav.current;
    mgOnThisPageNav([element]);
    return () => mgOnThisPageNavDestroy(element);
  }, [key]);
  return (
    <nav
      ref={nav}
      className="mg-on-this-page-nav mg-on-this-page-nav--align-container"
      data-mg-on-this-page-nav
      data-mg-on-this-page-nav-skip-auto-init
      data-mg-on-this-page-nav-label={text.onThisPage}
      aria-label={text.onThisPage}
      data-vf-google-analytics-region={REGION.nav}
    >
      <ul className="mg-on-this-page-nav__list">
        {items.map(item => (
          <li key={item.href} className="mg-on-this-page-nav__item">
            <a
              href={item.href}
              className="mg-on-this-page-nav__link"
              data-vf-analytics-label={`On this page: ${item.label}`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

SectionNav.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      href: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
};

/** Story-only composition of a PreventionWeb collection page. */
export function CollectionPage({
  collection: collectionKey = 'wildfire',
  itemCount,
  syncUrl = true,
  dir,
  id,
}) {
  const collection = collections[collectionKey] || collections.wildfire;
  const locale = 'en';
  const instanceId = useId().replace(/:/g, '');
  const prefix = id || `collection-${instanceId}`;
  const aboutId = `${prefix}-about`;
  const itemsId = `${prefix}-items`;
  const relatedId = `${prefix}-related`;
  const items = useItems(itemFilters(collection), itemCount);
  const related = useRelated(collection);
  const [relatedEmpty, setRelatedEmpty] = useState(false);
  const showRelated = related.nids.length > 0 && !relatedEmpty;

  const hasItems = items.status === 'done' && items.count > 0;
  // Wait for the count before mounting the list, so an empty collection
  // never flashes an empty search; if counting fails, show the list anyway.
  const showList = hasItems || items.status === 'failed';

  // Full headings as link text; English analytics labels are fixed.
  const navItems = [
    { href: `#${aboutId}`, text: text.about, label: 'About this collection' },
    { href: `#${itemsId}`, text: text.index, label: 'In this collection' },
    ...(showRelated
      ? [
          {
            href: `#${relatedId}`,
            text: text.related,
            label: 'Related collections',
          },
        ]
      : []),
  ];

  return (
    <div lang={locale} dir={dir}>
      <SkipLink targetId={`${prefix}-content`} label={text.skip} />
      <UndrrChrome locale="english" id={prefix} />
      <div className="mg-demo-shell | mg-container">
        <main
          id={`${prefix}-content`}
          className="mg-page-main | mg-container--spacer"
          tabIndex={-1}
        >
          <header data-vf-google-analytics-region={REGION.header}>
            <nav
              className="mg-breadcrumb | mg-u-font-size-250"
              aria-label={text.breadcrumbs}
            >
              <ul>
                <li>
                  <a href={PREVENTIONWEB_URL}>{text.home}</a>
                </li>
                <li>
                  <a href={COLLECTIONS_URL}>{text.collections}</a>
                </li>
                <li aria-current="page">{collection.title}</li>
              </ul>
            </nav>
            <Hero
              layout="split"
              split="2/3"
              variant="neutral"
              headingLevel="h1"
              data={[
                {
                  label: collection.type,
                  title: collection.title,
                  summaryText: collection.summary || undefined,
                  detail:
                    items.status === 'failed' ? undefined : (
                      <Facts items={items} locale={locale} itemsId={itemsId} />
                    ),
                  tags: tagsFor(collection),
                  tagsLabel: text.topics,
                  media: { type: 'image', ...collection.image },
                },
              ]}
            />
          </header>
          <SectionNav items={navItems} />
          <section
            id={aboutId}
            className="mg-demo-collection-section"
            aria-labelledby={`${aboutId}-title`}
            data-vf-google-analytics-region={REGION.about}
          >
            <h2 id={`${aboutId}-title`}>{text.about}</h2>
            <About id={prefix} paragraphs={collection.body} />
          </section>
          <section
            id={itemsId}
            className="mg-demo-collection-section"
            aria-labelledby={`${itemsId}-title`}
            data-vf-google-analytics-region={REGION.content}
          >
            <h2 id={`${itemsId}-title`}>{text.index}</h2>
            {items.status === 'done' && items.count === 0 && (
              <div className="mg-empty-state">
                <h3 className="mg-empty-state__title">{text.emptyTitle}</h3>
                <p className="mg-empty-state__description">{text.emptyText}</p>
                {/* Related collections are the better next step; offer the
                    full listing only when there are none. */}
                {related.status === 'done' && !showRelated && (
                  <div className="mg-empty-state__actions">
                    <a
                      href={COLLECTIONS_URL}
                      className="mg-button mg-button-secondary"
                      data-vf-analytics-label="Collection: browse all collections"
                    >
                      {text.emptyAction}
                    </a>
                  </div>
                )}
              </div>
            )}
            {showList && (
              <SyndicationSearchWidget
                labels={ITEM_LABELS}
                config={{
                  searchEndpoint: SEARCH_ENDPOINT,
                  customFilters: itemFilters(collection),
                  defaultFilters: [],
                  defaultSort: 'newest',
                  resultsPerPage: 10,
                  showResultsCount: true,
                  showSearchTimer: false,
                  showActiveFilters: true,
                  visibleFilters: {
                    field_domain_access: false,
                    field_country_region: false,
                    _language: false,
                  },
                  enableHashSync: syncUrl,
                  analyticsRegionPrefix: REGION.content,
                }}
              />
            )}
          </section>
          {showRelated && (
            <section
              id={relatedId}
              className="mg-demo-collection-section"
              aria-labelledby={`${relatedId}-title`}
              data-vf-google-analytics-region={REGION.related}
            >
              <h2 id={`${relatedId}-title`}>{text.related}</h2>
              <SyndicationSearchWidget
                config={{
                  searchEndpoint: SEARCH_ENDPOINT,
                  customFilters: relatedFilters(related.nids),
                  defaultFilters: [],
                  resultsPerPage: 3,
                  displayMode: 'card',
                  gridColumns: 3,
                  showSearchBox: false,
                  showResultsCount: false,
                  showSearchTimer: false,
                  showFacets: false,
                  showActiveFilters: false,
                  showPager: false,
                  enableHashSync: false,
                  analyticsRegionPrefix: REGION.related,
                  // The ranking found them; if the list itself comes back
                  // empty (unpublished since), drop the section and its link.
                  onResults: ({ total }) => setRelatedEmpty(total === 0),
                  visibleTeaserFields: {
                    contentType: false,
                    date: false,
                    siteName: false,
                  },
                }}
              />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

CollectionPage.propTypes = {
  /**
   * Sample collection: typical, short, long, without a summary, or one with
   * no items yet.
   */
  collection: PropTypes.oneOf([
    'wildfire',
    'jasper',
    'japan',
    'planned',
    'empty',
  ]),
  /**
   * A known item count. Leave unset to count with the content list's own
   * query, as a server would.
   */
  itemCount: PropTypes.number,
  /** Write the content list's filters to the URL hash. One widget per page. */
  syncUrl: PropTypes.bool,
  /** Text direction, from the Storybook locale toolbar. */
  dir: PropTypes.oneOf(['ltr', 'rtl']),
  /** Prefix for in-page ids, so several examples can share a page. */
  id: PropTypes.string,
};
