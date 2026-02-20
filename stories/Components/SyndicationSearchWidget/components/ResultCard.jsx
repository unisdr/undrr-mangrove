/**
 * @file ResultCard.jsx
 * @description Card-style search result component using mg-card BEM classes.
 *
 * Renders ES hit fields as a Mangrove card (vertical or book variant).
 * Uses BEM classes directly rather than importing Card React components,
 * keeping the search widget self-contained while leveraging the design system.
 *
 * @module SearchWidget/components/ResultCard
 */

import React, { useMemo } from 'react';
import { getContentType, getDomain, DOMAIN_MAP } from '../utils/constants';

/**
 * ResultCard component.
 * Renders a search result as an mg-card using BEM markup.
 *
 * @param {Object} props - Component props
 * @param {Object} props.hit - Elasticsearch hit object
 * @param {string} props.variant - Card variant: 'vertical' or 'book'
 * @param {boolean} props.showMetrics - Whether to show scoring metrics
 */
export function ResultCard({ hit, variant = 'vertical', showMetrics = false }) {
  const source = hit._source || {};
  const highlight = hit.highlight || {};

  const {
    nid,
    title,
    url,
    type,
    field_domain_access: domainArray,
    published_at: publishedAt,
  } = source;

  // Get domain info
  const domainId = Array.isArray(domainArray) ? domainArray[0] : domainArray;
  const domainInfo = domainId ? DOMAIN_MAP.get(domainId) : null;
  const baseUrl = domainInfo?.url || 'https://www.preventionweb.net';

  // Get highlighted content or fallback
  const highlightedTitle = highlight.title?.[0] || title;
  const highlightedBody = highlight.body?.join(' ... ') || '';

  // Format date
  const formattedDate = useMemo(() => {
    if (!publishedAt) return null;
    try {
      const date = new Date(publishedAt);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  }, [publishedAt]);

  // Get type label
  const typeInfo = getContentType(type);
  const typeLabel = typeInfo?.name || type;

  // Get domain label
  const domainLabel = domainInfo?.name;

  // Build full URL
  const fullUrl = useMemo(() => {
    if (!url && nid) return `${baseUrl}/node/${nid}`;
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    return `${baseUrl}${url}`;
  }, [url, nid, baseUrl]);

  // Card BEM class based on variant
  const cardClass = variant === 'book' ? 'mg-card__book' : 'mg-card__vc';

  // Error state - no domain
  if (!domainId) {
    return (
      <article className="mg-search__result-card mg-search__result--error">
        {showMetrics && <ResultCardMetrics hit={hit} source={source} />}
        <p className="mg-search__result-error">
          Content item {nid || 'unknown'} has no assigned domain and cannot be shown.{' '}
          <a href="https://www.undrr.org/contact-us">Report this error</a>.
        </p>
      </article>
    );
  }

  return (
    <article
      className={`mg-search__result-card ${cardClass}`}
      data-result-type={type}
    >
      {showMetrics && <ResultCardMetrics hit={hit} source={source} />}

      {/* Card content */}
      <div className="mg-card__content">
        {/* Content type badge */}
        {typeLabel && (
          <span className="mg-card__label">{typeLabel}</span>
        )}

        {/* Card title */}
        <h3 className="mg-card__title">
          <a
            href={fullUrl}
            dangerouslySetInnerHTML={{ __html: highlightedTitle }}
          />
        </h3>

        {/* Summary text from highlight */}
        {highlightedBody && (
          <p
            className="mg-card__summary"
            dangerouslySetInnerHTML={{ __html: highlightedBody }}
          />
        )}

        {/* Metadata line */}
        <div className="mg-card__meta">
          {domainLabel && (
            <span className="mg-card__meta-item">{domainLabel}</span>
          )}
          {formattedDate && (
            <time
              className="mg-card__meta-item"
              dateTime={publishedAt}
            >
              {formattedDate}
            </time>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Metrics display for card results.
 * @param {Object} props
 * @param {Object} props.hit - ES hit
 * @param {Object} props.source - ES hit._source
 */
function ResultCardMetrics({ hit, source }) {
  return (
    <span className="mg-search__result-metrics">
      <span className="mg-search__result-metric">Score: {hit._score?.toFixed(2)}</span>
      {source.field_meta_interestingness?.[0] !== undefined && (
        <span className="mg-search__result-metric">Int: {source.field_meta_interestingness[0]}</span>
      )}
      {source.field_meta_longevity?.[0] !== undefined && (
        <span className="mg-search__result-metric">Long: {source.field_meta_longevity[0]}</span>
      )}
    </span>
  );
}

export default ResultCard;
