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
 * @param {Array} props.items - Array of card data objects (see data object properties below)
 * @param {boolean} props.centered - Center-align content (default: false, left-aligned)
 * @param {string} props.variant - Visual variant: 'default' or 'negative' (for dark backgrounds)
 *
 * Data object properties:
 * @property {string} icon - Icon class name (e.g., "mg-icon mg-icon-globe") - see Atom/Icons
 * @property {Object} image - { src, alt } Image object (alternative to icon)
 * @property {number} iconSize - Width/height of icon in pixels (default: 72)
 * @property {string} imageScale - Scale for icons/images: 'small', 'medium', 'large', or 'full'
 * @property {string[]} labels - Badge or category label text array
 * @property {string} visualLabel - Text label rendered above the icon/image in the visual area
 * @property {string} title - Card heading text (required for accessibility)
 * @property {boolean} srOnlyTitle - Visually hide title but keep for screen readers (for logo cards)
 * @property {string} summary - Card body text, HTML supported
 * @property {string} link - URL for card link
 * @property {string} linkText - Text for text link CTA
 * @property {string} iconColor - Background color for the icon badge (CSS color, e.g., "#f4b8a8")
 * @property {string} iconFgColor - Foreground (glyph) color for the icon (CSS color). Overrides the default neutral gray.
 * @property {string} borderColor - Border color for the card (CSS color, e.g., "#e8963a")
 * @property {string} button - Button label text
 * @property {string} buttonType - Button style: 'Primary' or 'Secondary'
 */
/** Renders the icon/image visual for a card item. */
function renderVisual(item) {
  if (item.image?.src) {
    return (
      <img
        src={item.image?.src}
        alt={item.image?.alt || ''}
        className={cls(
          'mg-card__image',
          item.imageScale && `mg-card__image--${item.imageScale}`
        )}
        {...(!item.imageScale && {
          width: item.iconSize || 72,
          height: item.iconSize || 72,
        })}
      />
    );
  }
  if (item.icon || item.iconColor) {
    return (
      <span
        className={cls(
          'mg-card__icon-wrap',
          item.imageScale && `mg-card__icon-wrap--${item.imageScale}`,
          item.iconColor && 'mg-card__icon-wrap--colored'
        )}
        aria-hidden="true"
        {...((item.iconColor || item.iconFgColor) && {
          style: {
            ...(item.iconColor && { '--mg-icon-bg': item.iconColor }),
            ...(item.iconFgColor && { '--mg-icon-fg': item.iconFgColor }),
          },
        })}
      >
        {item.icon && <span className={item.icon} />}
      </span>
    );
  }
  return null;
}

export function IconCard({ items, centered = false, variant = 'default' }) {
  return (
    <>
      {items.map((item, index) => (
        <article
          key={item.id || item.title || `icon-card-${index}`}
          className={cls(
            'mg-card',
            'mg-card__icon',
            centered && 'mg-card__icon--centered',
            variant && variant !== 'default' && `mg-card__icon--${variant}`,
            item.borderColor && 'mg-card__icon--bordered'
          )}
          {...(item.borderColor && {
            style: { '--mg-card-border': item.borderColor },
          })}
        >
          {/* Icon or Image - wrapped in link when srOnlyTitle is true */}
          {(item.icon || item.image?.src || item.iconColor) && (
            <div className="mg-card__visual">
              {item.visualLabel && (
                <span className="mg-card__visual-label">{item.visualLabel}</span>
              )}
              {item.srOnlyTitle && item.link ? (
                <a href={item.link} className="mg-card__visual-link">
                  {renderVisual(item)}
                </a>
              ) : (
                renderVisual(item)
              )}
            </div>
          )}

          {/* Card Content */}
          <div className="mg-card__content">
            {/* Optional Label/Badge */}
            {item.labels?.[0] && (
              <div className="mg-card__meta">
                <span className="mg-card__label">{item.labels?.[0]}</span>
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
                  <a href={item.link}>{item.title?.trim()}</a>
                ) : (
                  item.title?.trim()
                )}
              </header>
            )}

            {/* Summary */}
            {item.summary && (
              <p
                className="mg-card__summary"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(item.summary),
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
  items: PropTypes.arrayOf(
    PropTypes.shape({
      /** Unique identifier for the card */
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      /** Icon class name (e.g., "mg-icon mg-icon-globe") - see Atom/Icons */
      icon: PropTypes.string,
      /** Image object with src and alt */
      image: PropTypes.shape({
        src: PropTypes.string,
        alt: PropTypes.string,
      }),
      /** Width/height of icon in pixels (ignored when imageScale is set) */
      iconSize: PropTypes.number,
      /** Image width scale: small (72px), medium (50%), large (75%), full (100%) */
      imageScale: PropTypes.oneOf(['small', 'medium', 'large', 'full']),
      /** Background color for the icon badge (CSS color, e.g., "#f4b8a8") */
      iconColor: PropTypes.string,
      /** Foreground (glyph) color for the icon (CSS color). Overrides the default neutral gray. */
      iconFgColor: PropTypes.string,
      /** Border color for the card (CSS color, e.g., "#e8963a") */
      borderColor: PropTypes.string,
      /** Badge or category label text array */
      labels: PropTypes.arrayOf(PropTypes.string),
      /** Text label rendered above the icon/image in the visual area */
      visualLabel: PropTypes.string,
      /** Card heading text (required for accessibility) */
      title: PropTypes.string.isRequired,
      /** Visually hide title but keep for screen readers (for logo cards) */
      srOnlyTitle: PropTypes.bool,
      /** Card body text, HTML supported */
      summary: PropTypes.string,
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
