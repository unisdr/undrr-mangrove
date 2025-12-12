/**
 * @file ResultItem.jsx
 * @description Individual search result card component.
 *
 * Supports two rendering modes:
 * 1. Teaser mode: Uses pre-rendered HTML teaser from Elasticsearch (default)
 * 2. Fallback mode: Builds result card from individual fields
 *
 * @module SearchWidget/components/ResultItem
 */

import React, { useMemo } from 'react';
import { getContentType, getDomain, DOMAIN_MAP } from '../utils/constants';

/**
 * Resolve relative URLs to absolute using the domain's base URL.
 *
 * @param {string} html - HTML string with potentially relative URLs
 * @param {string} baseUrl - Base URL for the domain
 * @returns {string} HTML with absolute URLs
 */
function resolveRelativeUrls(html, baseUrl) {
  if (!html || !baseUrl) return html;

  // Ensure html is a string (could be array or object from Elasticsearch)
  const htmlString = typeof html === 'string' ? html : String(html);

  // Replace relative href and src attributes
  return htmlString
    .replace(/href="\/([^"]*?)"/g, `href="${baseUrl}/$1"`)
    .replace(/src="\/([^"]*?)"/g, `src="${baseUrl}/$1"`);
}

/**
 * ResultItem component.
 * Renders a single search result with title, snippet, metadata.
 *
 * The component uses the pre-rendered teaser HTML from Elasticsearch
 * when available, which provides consistent styling with the Drupal theme.
 * Falls back to building from fields when teaser is not available.
 *
 * @param {Object} props - Component props
 * @param {Object} props.hit - Elasticsearch hit object
 * @param {boolean} props.showMetrics - Whether to show scoring metrics
 */
export function ResultItem({ hit, showMetrics = false }) {
  const source = hit._source || {};
  const highlight = hit.highlight || {};

  // Extract fields
  const {
    nid,
    title,
    url,
    type,
    field_domain_access: domainArray,
    published_at: publishedAt,
    teaser,
  } = source;

  // Get domain info (field_domain_access is an array)
  const domainId = Array.isArray(domainArray) ? domainArray[0] : domainArray;
  const domainInfo = domainId ? DOMAIN_MAP.get(domainId) : null;
  const baseUrl = domainInfo?.url || 'https://www.preventionweb.net';

  /**
   * If the result has no domain access, show an error.
   */
  if (!domainId) {
    return (
      <article className="mg-search__result mg-search__result--error">
        {showMetrics && (
          <span className="mg-search__result-score">Score: {hit._score}</span>
        )}
        <p className="mg-search__result-error">
          Content item {nid || 'unknown'} has no assigned domain and cannot be shown.{' '}
          <a href="https://www.undrr.org/contact-us">Report this error</a>.
        </p>
      </article>
    );
  }

  /**
   * Render using pre-rendered teaser HTML.
   * This is the preferred mode as it matches Drupal's theme output.
   */
  if (teaser) {
    // Get domain label for site attribution
    const domainLabel = domainInfo
      ? domainInfo.url.replace('https://', '')
      : domainId;

    // Resolve relative URLs in the teaser HTML
    const resolvedTeaser = resolveRelativeUrls(teaser, baseUrl);

    // Inject domain label before the title field
    let finalHtml = resolvedTeaser;
    const titleFieldIndex = finalHtml.indexOf('<div class="field field--name-node-title');
    if (titleFieldIndex !== -1) {
      const domainLabelHtml = `<p class="mg-search__result-site-name">${domainLabel}</p>`;
      finalHtml = finalHtml.slice(0, titleFieldIndex) + domainLabelHtml + finalHtml.slice(titleFieldIndex);
    }

    return (
      <article className="mg-search__result" data-result-type={type}>
        {showMetrics && (
          <span className="mg-search__result-score">Score: {hit._score}</span>
        )}
        <div dangerouslySetInnerHTML={{ __html: finalHtml }} />
        {showMetrics && (
          <details className="mg-search__result-metrics">
            <summary>Scoring Details</summary>
            <pre>
              {JSON.stringify(
                {
                  score: hit._score,
                  interestingness: source.field_meta_interestingness,
                  longevity: source.field_meta_longevity,
                },
                null,
                2
              )}
            </pre>
          </details>
        )}
      </article>
    );
  }

  /**
   * Fallback: Build result card from individual fields.
   * Used when teaser HTML is not available in the index.
   */

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

  return (
    <article className="mg-search__result" data-result-type={type}>
      {showMetrics && (
        <span className="mg-search__result-score">Score: {hit._score}</span>
      )}
      <div className="mg-search__result-content">
        <div className="mg-search__result-text">
          {/* Title */}
          <h3 className="mg-search__result-title">
            <a
              href={fullUrl}
              dangerouslySetInnerHTML={{ __html: highlightedTitle }}
            />
          </h3>

          {/* Metadata line */}
          <div className="mg-search__result-meta">
            {typeLabel && (
              <span className="mg-search__result-type">{typeLabel}</span>
            )}
            {domainLabel && (
              <span className="mg-search__result-domain">{domainLabel}</span>
            )}
            {formattedDate && (
              <time
                className="mg-search__result-date"
                dateTime={publishedAt}
              >
                {formattedDate}
              </time>
            )}
          </div>

          {/* Snippet */}
          {highlightedBody && (
            <p
              className="mg-search__result-snippet"
              dangerouslySetInnerHTML={{ __html: highlightedBody }}
            />
          )}

          {/* Debug: Scoring metrics */}
          {showMetrics && (
            <details className="mg-search__result-metrics">
              <summary>Scoring Details</summary>
              <pre>
                {JSON.stringify(
                  {
                    score: hit._score,
                    interestingness: source.field_meta_interestingness,
                    longevity: source.field_meta_longevity,
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          )}
        </div>
      </div>
    </article>
  );
}

export default ResultItem;
