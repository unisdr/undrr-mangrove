/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
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
 * @param {string} props.variant - Visual variant: 'default' or 'negative' (for dark backgrounds)
 *
 * Data object properties:
 * @property {string} icon - Icon class name (e.g., "mg-icon fa-globe") - see Atom/Icons
 * @property {string} imgback - Image URL (alternative to icon, matches VerticalCard)
 * @property {string} imgalt - Alt text for image (matches VerticalCard)
 * @property {number} iconSize - Width/height of icon in pixels (default: 72)
 * @property {string} imageScale - Scale for icons/images: 'small', 'medium', 'large', or 'full'
 * @property {string} label - Badge or category label text
 * @property {string} title - Card heading text (required for accessibility)
 * @property {boolean} srOnlyTitle - Visually hide title but keep for screen readers (for logo cards)
 * @property {string} summaryText - Card body text, HTML supported (matches VerticalCard)
 * @property {string} link - URL for card link
 * @property {string} linkText - Text for text link CTA
 * @property {string} button - Button label text
 * @property {string} buttonType - Button style: 'Primary' or 'Secondary'
 */
export function IconCard({ data, centered = false, variant = 'default' }) {
  return (
    <>
      {data.map((item, index) => (
        <article
          key={item.id || item.title || `icon-card-${index}`}
          className={cls(
            'mg-card',
            'mg-card__icon',
            centered && 'mg-card__icon--centered',
            variant && variant !== 'default' && `mg-card__icon--${variant}`
          )}
        >
          {/* Icon or Image - wrapped in link when srOnlyTitle is true */}
          {(item.icon || item.imgback) && (
            <div className="mg-card__visual">
              {item.srOnlyTitle && item.link ? (
                <a href={item.link} className="mg-card__visual-link">
                  {item.imgback ? (
                    <img
                      src={item.imgback}
                      alt={item.imgalt || ''}
                      className={cls(
                        'mg-card__image',
                        item.imageScale && `mg-card__image--${item.imageScale}`
                      )}
                      {...(!item.imageScale && {
                        width: item.iconSize || 72,
                        height: item.iconSize || 72,
                      })}
                    />
                  ) : item.icon ? (
                    <span
                      className={cls(
                        'mg-card__icon-wrap',
                        item.imageScale && `mg-card__icon-wrap--${item.imageScale}`
                      )}
                      aria-hidden="true"
                    >
                      <span className={item.icon} />
                    </span>
                  ) : null}
                </a>
              ) : item.imgback ? (
                <img
                  src={item.imgback}
                  alt={item.imgalt || ''}
                  className={cls(
                    'mg-card__image',
                    item.imageScale && `mg-card__image--${item.imageScale}`
                  )}
                  {...(!item.imageScale && {
                    width: item.iconSize || 72,
                    height: item.iconSize || 72,
                  })}
                />
              ) : item.icon ? (
                <span
                  className={cls(
                    'mg-card__icon-wrap',
                    item.imageScale && `mg-card__icon-wrap--${item.imageScale}`
                  )}
                  aria-hidden="true"
                >
                  <span className={item.icon} />
                </span>
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

            {/* Title - plain text when srOnlyTitle (visual link handles click) */}
            {item.title && (
              <header
                className={cls(
                  'mg-card__title',
                  item.srOnlyTitle && 'mg-u-sr-only'
                )}
              >
                {item.link && !item.button && !item.srOnlyTitle ? (
                  <a href={item.link}>{item.title}</a>
                ) : (
                  item.title
                )}
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

IconCard.propTypes = {
  /** Array of card data objects */
  data: PropTypes.arrayOf(
    PropTypes.shape({
      /** Unique identifier for the card */
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      /** Icon class name (e.g., "mg-icon fa-globe") - see Atom/Icons */
      icon: PropTypes.string,
      /** Image URL (alternative to icon, matches VerticalCard) */
      imgback: PropTypes.string,
      /** Alt text for image (matches VerticalCard) */
      imgalt: PropTypes.string,
      /** Width/height of icon in pixels (ignored when imageScale is set) */
      iconSize: PropTypes.number,
      /** Image width scale: small (72px), medium (50%), large (75%), full (100%) */
      imageScale: PropTypes.oneOf(['small', 'medium', 'large', 'full']),
      /** Badge or category label text */
      label: PropTypes.string,
      /** Card heading text (required for accessibility) */
      title: PropTypes.string.isRequired,
      /** Visually hide title but keep for screen readers (for logo cards) */
      srOnlyTitle: PropTypes.bool,
      /** Card body text, HTML supported (matches VerticalCard) */
      summaryText: PropTypes.string,
      /** URL for card link */
      link: PropTypes.string,
      /** Text for text link CTA */
      linkText: PropTypes.string,
      /** Button label text */
      button: PropTypes.string,
      /** Button style: 'Primary' or 'Secondary' */
      buttonType: PropTypes.oneOf(['Primary', 'Secondary']),
    })
  ).isRequired,
  /** Center-align content */
  centered: PropTypes.bool,
  /** Visual variant: default or negative (for dark backgrounds) */
  variant: PropTypes.oneOf(['default', 'negative']),
};
