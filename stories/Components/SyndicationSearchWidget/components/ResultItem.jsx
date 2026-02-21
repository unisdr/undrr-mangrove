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
 * Swap card variant classes and image styles on teaser HTML for card display modes.
 *
 * Teaser HTML from Elasticsearch already contains mg-card markup.
 * This strips existing variant classes and injects the correct variant
 * for the requested display mode.
 *
 * Also rewrites Drupal image style paths so the image aspect ratio matches
 * the card variant: `landscape_16_9` (16:9) for vertical cards, `por` (3:4)
 * for book cards. The itok token is not validated for anonymous requests.
 *
 * @param {string} html - Teaser HTML string
 * @param {string} displayMode - Display mode: 'list', 'card', or 'card-book'
 * @returns {string} HTML with updated card variant classes and image styles
 */
export function swapCardVariant(html, displayMode) {
  if (!html || displayMode === 'list') return html;
  let result = html
    .replace(/\bmg-card__(?:vc|hc)\b/g, '')
    .replace(/\bmg-card-book__hc\b/g, '')
    .replace(/\bmg-card__book\b/g, '');
  const variant = displayMode === 'card-book'
    ? 'mg-card__vc mg-card__book'
    : 'mg-card__vc';
  result = result.replace(/class="([^"]*)"/, (_, cls) =>
    `class="${cls.trim()} ${variant}"`
  );

  // Rewrite Drupal image styles to match the card aspect ratio.
  // Teaser HTML may arrive with any image style (landscape_16_9, por, etc.).
  // Card mode needs 16:9 (landscape_16_9), book card mode needs 3:4 (por).
  // The itok token is not validated for anonymous image style requests.
  if (displayMode === 'card-book') {
    result = result.replace(
      /\/styles\/[^/]+\/public\//g,
      '/styles/por/public/'
    );
  } else {
    result = result.replace(
      /\/styles\/[^/]+\/public\//g,
      '/styles/landscape_16_9/public/'
    );
  }

  return result;
}

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
 * @param {string} props.displayMode - Display mode: 'list', 'card', or 'card-book'
 */
export function ResultItem({ hit, showMetrics = false, displayMode = 'list' }) {
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
          <span className="mg-search__result-metrics">
            <span className="mg-search__result-metric">Score: {hit._score?.toFixed(2)}</span>
            {source.field_meta_interestingness?.[0] !== undefined && (
              <span className="mg-search__result-metric">Int: {source.field_meta_interestingness[0]}</span>
            )}
            {source.field_meta_longevity?.[0] !== undefined && (
              <span className="mg-search__result-metric">Long: {source.field_meta_longevity[0]}</span>
            )}
          </span>
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

    // Resolve relative URLs and swap card variant for card display modes
    const resolvedTeaser = swapCardVariant(
      resolveRelativeUrls(teaser, baseUrl),
      displayMode
    );

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
          <span className="mg-search__result-metrics">
            <span className="mg-search__result-metric">Score: {hit._score?.toFixed(2)}</span>
            {source.field_meta_interestingness?.[0] !== undefined && (
              <span className="mg-search__result-metric">Int: {source.field_meta_interestingness[0]}</span>
            )}
            {source.field_meta_longevity?.[0] !== undefined && (
              <span className="mg-search__result-metric">Long: {source.field_meta_longevity[0]}</span>
            )}
          </span>
        )}
        <div dangerouslySetInnerHTML={{ __html: finalHtml }} />
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
        <span className="mg-search__result-metrics">
          <span className="mg-search__result-metric">Score: {hit._score?.toFixed(2)}</span>
          {source.field_meta_interestingness?.[0] !== undefined && (
            <span className="mg-search__result-metric">Int: {source.field_meta_interestingness[0]}</span>
          )}
          {source.field_meta_longevity?.[0] !== undefined && (
            <span className="mg-search__result-metric">Long: {source.field_meta_longevity[0]}</span>
          )}
        </span>
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
        </div>
      </div>
    </article>
  );
}

export default ResultItem;
