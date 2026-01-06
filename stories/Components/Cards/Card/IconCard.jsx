/* eslint-disable react/no-danger */
import React from 'react';
import DOMPurify from 'dompurify';
import { CtaButton } from '../../Buttons/CtaButton/CtaButton';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

/**
 * IconCard Component
 *
 * A card variant with icon/image, title, summary, and optional CTA.
 * RTL layout is automatic via CSS [dir="rtl"] - use the Storybook locale toolbar.
 *
 * @param {Object} props
 * @param {Array} props.data - Array of card data objects (see data object properties below)
 * @param {boolean} props.centered - Center-align content (default: false, left-aligned)
 *
 * Data object properties:
 * @property {string} icon - Inline SVG markup (alternative to imgback)
 * @property {string} imgback - Image URL (alternative to icon, matches VerticalCard)
 * @property {string} imgalt - Alt text for image (matches VerticalCard)
 * @property {number} iconSize - Width/height of icon/image in pixels (default: 72)
 * @property {string} label - Badge or category label text
 * @property {string} title - Card heading text (required)
 * @property {string} summaryText - Card body text, HTML supported (matches VerticalCard)
 * @property {string} link - URL for card link
 * @property {string} linkText - Text for text link CTA
 * @property {string} button - Button label text
 * @property {string} buttonType - Button style: 'Primary' or 'Secondary'
 */
export function IconCard({ data, centered = false }) {
  return (
    <>
      {data.map((item, index) => (
        <article
          key={item.id || item.title || `icon-card-${index}`}
          className={cls(
            'mg-card',
            'mg-card__icon',
            centered && 'mg-card__icon--centered'
          )}
        >
          {/* Icon or Image */}
          {(item.icon || item.imgback) && (
            <div className="mg-card__visual">
              {item.imgback ? (
                <img
                  src={item.imgback}
                  alt={item.imgalt || ''}
                  className="mg-card__image"
                  width={item.iconSize || 72}
                  height={item.iconSize || 72}
                />
              ) : item.icon ? (
                <span
                  className="mg-card__icon-svg"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(item.icon),
                  }}
                />
              ) : null}
            </div>
          )}

          {/* Card Content */}
          <div className="mg-card__content">
            {/* Optional Label/Badge */}
            {item.label && (
              <div className="mg-card__meta">
                <span className="mg-card__label">{item.label}</span>
              </div>
            )}

            {/* Title */}
            {item.title && (
              <header className="mg-card__title">
                <h3>
                  {item.link && !item.button ? (
                    <a href={item.link}>{item.title}</a>
                  ) : (
                    item.title
                  )}
                </h3>
              </header>
            )}

            {/* Summary */}
            {item.summaryText && (
              <p
                className="mg-card__summary"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(item.summaryText),
                }}
              />
            )}

            {/* CTA - Button or Link */}
            {item.button && (
              <div className="mg-card__cta">
                <CtaButton
                  type={item.buttonType || 'Primary'}
                  label={item.button}
                  href={item.link}
                />
              </div>
            )}

            {item.linkText && !item.button && (
              <p className="mg-card__link">
                <a href={item.link}>{item.linkText}</a>
              </p>
            )}
          </div>
        </article>
      ))}
    </>
  );
}

IconCard.defaultProps = {
  centered: false,
};
