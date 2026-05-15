/**
 * @file FeaturePromo.jsx
 * @description Mid-page editorial feature spotlight with overlapping image and content panel.
 *
 * A full-width section placing a large editorial image beside a coloured content panel
 * that overlaps the image. Supports image-left/right reversal, four colour variants
 * driven by theme tokens, and configurable heading level.
 *
 * @module FeaturePromo
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * FeaturePromo component.
 *
 * Renders a full-width editorial spotlight with an image and an overlapping
 * coloured panel containing a heading, summary, and CTA link.
 *
 * @param {Object} props
 * @param {string} props.image                          Image URL
 * @param {string} props.imageAlt                       Descriptive alt text for the image (use "" for decorative)
 * @param {string} props.heading                        Panel heading text
 * @param {string} [props.summary]                      Optional body text beneath the heading
 * @param {string} [props.ctaLabel]                     CTA link label; omit to hide CTA
 * @param {string} [props.ctaUrl]                       CTA link href; omit to hide CTA
 * @param {boolean} [props.ctaExternal=false]           When true, opens CTA in a new tab with noopener
 * @param {boolean} [props.reverse=false]               When true, panel is on the left, image on the right
 * @param {string} [props.variant='primary']            Panel colour variant: 'primary', 'secondary', 'tertiary', or 'quaternary'
 * @param {number} [props.headlineLevel=2]              Semantic heading level (2–6)
 * @param {string} [props.className='']                 Additional CSS classes on the root element
 */
export function FeaturePromo({
  image,
  imageAlt,
  heading,
  summary,
  ctaLabel,
  ctaUrl,
  ctaExternal = false,
  reverse = false,
  variant = 'primary',
  headlineLevel = 2,
  className = '',
}) {
  const HeadingTag = `h${headlineLevel}`;
  const showCta = ctaLabel && ctaUrl;

  const classes = [
    'mg-feature-promo',
    `mg-feature-promo--${variant}`,
    reverse && 'mg-feature-promo--reverse',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classes}>
      <div className="mg-feature-promo__media">
        <img
          src={image}
          alt={imageAlt}
          className="mg-feature-promo__image"
        />
      </div>
      <div className="mg-feature-promo__panel">
        <HeadingTag className="mg-feature-promo__heading">{heading}</HeadingTag>
        {summary && <p className="mg-feature-promo__summary">{summary}</p>}
        {showCta && (
          <a
            href={ctaUrl}
            className="mg-feature-promo__cta mg-button mg-button--primary"
            {...(ctaExternal
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
          >
            {ctaLabel}
          </a>
        )}
      </div>
    </section>
  );
}

FeaturePromo.propTypes = {
  /** Image URL */
  image: PropTypes.string.isRequired,
  /** Alt text for the image. Use empty string for decorative images. */
  imageAlt: PropTypes.string.isRequired,
  /** Panel heading text */
  heading: PropTypes.string.isRequired,
  /** Optional body text beneath the heading */
  summary: PropTypes.string,
  /** CTA link label; omit to hide the CTA */
  ctaLabel: PropTypes.string,
  /** CTA link href; omit to hide the CTA */
  ctaUrl: PropTypes.string,
  /** Open CTA in a new tab when true */
  ctaExternal: PropTypes.bool,
  /** Flip layout so panel is on the left and image on the right */
  reverse: PropTypes.bool,
  /** Panel colour variant */
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'quaternary']),
  /** Semantic heading level (2–6) */
  headlineLevel: PropTypes.oneOf([2, 3, 4, 5, 6]),
  /** Additional CSS classes on the root element */
  className: PropTypes.string,
};

export default FeaturePromo;
