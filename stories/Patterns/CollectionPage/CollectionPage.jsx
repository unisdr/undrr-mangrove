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
  tagsFor,
} from './collections';

const SEARCH_ENDPOINT = 'https://www.undrr.org/search-endpoint';

// Bodies shorter than this stay open; longer ones collapse to
// --mg-show-more-height. Most PreventionWeb collection descriptions (about
// 150 words) fit.
const ABOUT_THRESHOLD = 320;

const text = {
  skip: 'Skip to page content',
  collection: 'Collection',
  lastUpdated: 'Last updated',
  counting: 'Counting items…',
  items: count => (count === 1 ? '1 item' : `${count.toLocaleString()} items`),
  about: 'About this collection',
  index: 'In this collection',
  related: 'Related collections',
  emptyTitle: 'Nothing has been added to this collection yet',
  emptyText:
    'Content tagged to this collection will be listed here. Until then, browse the other collections on PreventionWeb.',
  emptyAction: 'Browse all collections',
  showMore: 'Show more',
  showLess: 'Show less',
  onThisPage: 'On this page',
  navAbout: 'About',
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

/**
 * The number of results a widget scoped by `filters` would find. Runs the
 * widget's own query (status filter included) with no results, so the
 * header and the widget cannot disagree.
 */
function useResultCount(filters, known) {
  const [count, setCount] = useState(known ?? null);
  const [failed, setFailed] = useState(false);
  const key = JSON.stringify(filters);

  useEffect(() => {
    if (known !== undefined) {
      setCount(known);
      return undefined;
    }
    const controller = new AbortController();
    const body = buildQuery(
      {
        query: '',
        facets: {},
        facetOperators: {},
        customFacets: {},
        sortBy: 'relevance',
      },
      { customFilters: JSON.parse(key), facets: false }
    );
    delete body.highlight;
    fetch(SEARCH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, size: 0 }),
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then(data => {
        const total = data?.hits?.total;
        setCount(typeof total === 'number' ? total : (total?.value ?? 0));
      })
      .catch(error => {
        if (error.name !== 'AbortError') setFailed(true);
      });
    return () => controller.abort();
  }, [key, known]);

  return { count, failed };
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
      <div id={`${id}-body`} className="mg-reading__article mg-content">
        {paragraphs.map((part, index) => (
          // Index key: fixed sample copy that never reorders.
          <Paragraph key={index} part={part} />
        ))}
      </div>
      <button
        ref={button}
        type="button"
        className="mg-button mg-button-primary mg-show-more--button"
        data-mg-show-more="true"
        data-mg-show-more-skip-auto-init="true"
        data-mg-show-more-target={`#${id}-body`}
        data-mg-show-more-threshold={ABOUT_THRESHOLD}
        data-mg-show-more-label-collapsed={text.showMore}
        data-mg-show-more-label-open={text.showLess}
        data-vf-analytics-label="Collection: show more or less"
      >
        {text.showMore}
      </button>
    </>
  );
}

About.propTypes = {
  id: PropTypes.string.isRequired,
  paragraphs: PropTypes.array.isRequired,
};

/** The facts line: the item count, linked to the list, and the last update. */
function Facts({ count, failed, itemsId, updated }) {
  return (
    <>
      {!failed && (
        <>
          {count === null ? (
            text.counting
          ) : (
            <a
              href={`#${itemsId}`}
              data-vf-analytics-label="Collection: item count"
            >
              {text.items(count)}
            </a>
          )}
          <span aria-hidden="true"> · </span>
        </>
      )}
      {text.lastUpdated} <time dateTime={updated.iso}>{updated.label}</time>
    </>
  );
}

Facts.propTypes = {
  count: PropTypes.number,
  failed: PropTypes.bool,
  itemsId: PropTypes.string.isRequired,
  updated: PropTypes.object.isRequired,
};

/**
 * The sticky On this page bar in explicit mode: vanilla OnThisPageNav markup
 * with one link per section, as a Drupal template would emit it.
 */
function SectionNav({ items }) {
  const nav = useRef(null);
  useEffect(() => {
    const element = nav.current;
    mgOnThisPageNav([element]);
    return () => mgOnThisPageNavDestroy(element);
  }, []);
  return (
    <nav
      ref={nav}
      className="mg-on-this-page-nav"
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
  id,
}) {
  const collection = collections[collectionKey] || collections.wildfire;
  const instanceId = useId().replace(/:/g, '');
  const prefix = id || `collection-${instanceId}`;
  const itemsId = `${prefix}-items`;
  const items = useResultCount(itemFilters(collection), itemCount);
  const related = useResultCount(relatedFilters(collection));
  const aboutId = `${prefix}-about`;
  const relatedId = `${prefix}-related`;
  const showRelated = related.count > 0;
  // English analytics labels are fixed; the visible text may be translated.
  const navItems = [
    { href: `#${aboutId}`, text: text.navAbout, label: 'About' },
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
    <div lang="en">
      <SkipLink targetId={`${prefix}-content`} label={text.skip} />
      <UndrrChrome locale="english" id={prefix} />
      <div className="mg-demo-shell | mg-container">
        <main
          id={`${prefix}-content`}
          className="mg-page-main | mg-container--spacer"
          tabIndex={-1}
        >
          <header data-vf-google-analytics-region={REGION.header}>
            <Hero
              layout="split"
              split="2/3"
              variant="neutral"
              headingLevel="h1"
              data={[
                {
                  label: (
                    <>
                      <a
                        href={COLLECTIONS_URL}
                        data-vf-analytics-label="Collection: all collections"
                      >
                        {text.collection}
                      </a>
                      <span aria-hidden="true"> · </span>
                      {collection.type}
                    </>
                  ),
                  title: collection.title,
                  summaryText: collection.summary,
                  detail: (
                    <Facts
                      count={items.count}
                      failed={items.failed}
                      itemsId={itemsId}
                      updated={collection.updated}
                    />
                  ),
                  tags: tagsFor(collection),
                  media: { type: 'image', ...collection.image },
                },
              ]}
            />
          </header>
          {/* Remounted when the related link comes or goes, so scroll-spy
              observes exactly the sections that are on the page. */}
          <SectionNav key={navItems.length} items={navItems} />
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
            {items.count === 0 ? (
              <div className="mg-empty-state">
                <h3 className="mg-empty-state__title">{text.emptyTitle}</h3>
                <p className="mg-empty-state__description">{text.emptyText}</p>
                <div className="mg-empty-state__actions">
                  <a
                    href={COLLECTIONS_URL}
                    className="mg-button mg-button-primary"
                    data-vf-analytics-label="Collection: browse all collections"
                  >
                    {text.emptyAction}
                  </a>
                </div>
              </div>
            ) : (
              <SyndicationSearchWidget
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
                  customFilters: relatedFilters(collection),
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
  /** Sample collection: typical, short, long, or one with no items yet. */
  collection: PropTypes.oneOf(['wildfire', 'jasper', 'japan', 'empty']),
  /**
   * A known item count. Leave unset to count with the content list's own
   * query, as a server would.
   */
  itemCount: PropTypes.number,
  /** Write the content list's filters to the URL hash. One widget per page. */
  syncUrl: PropTypes.bool,
  /** Prefix for in-page ids, so several examples can share a page. */
  id: PropTypes.string,
};
