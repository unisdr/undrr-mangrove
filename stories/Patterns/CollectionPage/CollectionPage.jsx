import React, { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Hero } from '../../Components/Hero/Hero';
import { SyndicationSearchWidget } from '../../Components/SyndicationSearchWidget/SyndicationSearchWidget';
import { buildQuery } from '../../Components/SyndicationSearchWidget/utils/queryBuilder';
import { mgShowMore } from '../../assets/js/show-more';
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

function Facts({ count, failed, itemsId, updated }) {
  return (
    <p className="mg-demo-collection-facts | mg-u-font-size-250">
      {!failed && (
        <>
          {count === null ? (
            <span>{text.counting}</span>
          ) : (
            <a href={`#${itemsId}`}>{text.items(count)}</a>
          )}
          <span aria-hidden="true"> · </span>
        </>
      )}
      {text.lastUpdated} <time dateTime={updated.iso}>{updated.label}</time>
    </p>
  );
}

Facts.propTypes = {
  count: PropTypes.number,
  failed: PropTypes.bool,
  itemsId: PropTypes.string.isRequired,
  updated: PropTypes.object.isRequired,
};

function Tags({ tags }) {
  return (
    <div className="mg-tag-container">
      {tags.map(tag => (
        <a key={tag.href} href={tag.href}>
          {tag.name}
        </a>
      ))}
    </div>
  );
}

Tags.propTypes = {
  tags: PropTypes.array.isRequired,
};

/** Story-only composition of a PreventionWeb collection page. */
export function CollectionPage({
  collection: collectionKey = 'wildfire',
  headerStyle = 'page',
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
  const tags = tagsFor(collection);
  const kicker = `${text.collection} · ${collection.type}`;

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
          {headerStyle === 'hero' ? (
            <>
              <Hero
                layout="split"
                split="2/3"
                headingLevel="h1"
                data={[
                  {
                    label: kicker,
                    title: collection.title,
                    summaryText: collection.summary,
                    // Hero detail is plain text, so the count cannot link here.
                    detail: [
                      !items.failed &&
                        (items.count === null
                          ? text.counting
                          : text.items(items.count)),
                      `${text.lastUpdated} ${collection.updated.label}`,
                    ]
                      .filter(Boolean)
                      .join(' · '),
                    media: { type: 'image', ...collection.image },
                  },
                ]}
              />
              <div className="mg-demo-collection-after-hero">
                <Tags tags={tags} />
              </div>
            </>
          ) : (
            <header className="mg-demo-collection-header">
              <div className="mg-demo-collection-header__text">
                <p className="mg-u-font-size-250">
                  <a href={COLLECTIONS_URL}>{text.collection}</a>
                  <span aria-hidden="true"> · </span>
                  {collection.type}
                </p>
                <h1 className="mg-u-font-size-900">{collection.title}</h1>
                <p className="mg-demo-lede | mg-u-font-size-500">
                  {collection.summary}
                </p>
                <Facts
                  count={items.count}
                  failed={items.failed}
                  itemsId={itemsId}
                  updated={collection.updated}
                />
                <Tags tags={tags} />
              </div>
              <img
                className="mg-demo-collection-header__image"
                src={collection.image.src}
                alt={collection.image.alt}
              />
            </header>
          )}
          <section
            className="mg-demo-collection-section"
            aria-labelledby={`${prefix}-about`}
          >
            <h2 id={`${prefix}-about`}>{text.about}</h2>
            <About id={prefix} paragraphs={collection.body} />
          </section>
          <section
            id={itemsId}
            className="mg-demo-collection-section"
            aria-labelledby={`${itemsId}-title`}
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
                }}
              />
            )}
          </section>
          {related.count > 0 && (
            <section
              className="mg-demo-collection-section"
              aria-labelledby={`${prefix}-related`}
            >
              <h2 id={`${prefix}-related`}>{text.related}</h2>
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
   * `page` sets the header on the page background with the image beside it,
   * like a hazard page. `hero` uses a split `Hero` band, whose detail line is
   * plain text, so the count cannot link to the list.
   */
  headerStyle: PropTypes.oneOf(['page', 'hero']),
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
