import React from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { CtaButton } from '../../Buttons/CtaButton/CtaButton';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

/**
 * @typedef {object} IconCardItem
 * @property {string|number} [id] Unique card identifier.
 * @property {string} [icon] Icon class name, for example "mg-icon mg-icon-globe".
 * @property {string} [imgback] Image URL used in place of the icon.
 * @property {string} [imgalt] Alternative text for the image.
 * @property {number} [iconSize] Intrinsic image size when imageScale is omitted. Does not size CSS glyphs.
 * @property {'small'|'medium'|'large'|'full'} [imageScale] Scale for the visual in a vertical card.
 * @property {string} [iconColor] Background color for the icon badge.
 * @property {string} [iconFgColor] Foreground color for the icon glyph.
 * @property {string} [borderColor] Border color for the card.
 * @property {string} [label] Badge or category label.
 * @property {string} [visualLabel] Label above the visual.
 * @property {string} title Card heading.
 * @property {boolean} [srOnlyTitle] Keep the heading available to screen readers and hide it visually.
 * @property {string} [summaryText] Summary, which can include HTML.
 * @property {string} [link] Destination for the call to action.
 * @property {string} [linkText] Text for a link-style call to action.
 * @property {Function} [onClick] Handler for client-side routing.
 * @property {string} [button] Text for a button-style call to action.
 * @property {'Primary'|'Secondary'} [buttonType] Button style.
 */
/** Renders the icon/image visual for a card item. */
function Visual({ item }) {
  if (item.imgback) {
    return (
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

/**
 * A card with an icon or image and an optional call to action.
 * Layout follows the current text direction.
 *
 * @param {Object} props
 * @param {IconCardItem[]} props.data Card data.
 * @param {boolean} [props.centered=false] Center-align content.
 * @param {'default'|'negative'} [props.variant='default'] Visual variant. Use negative on dark backgrounds.
 * @param {'vertical'|'horizontal'} [props.orientation='vertical'] Show the visual above or beside the content. Horizontal cards size the visual without using imageScale.
 */
export function IconCard({
  data,
  centered = false,
  variant = 'default',
  orientation = 'vertical',
}) {
  return (
    <>
      {data.map((item, index) => (
        <article
          key={item.id || item.title || `icon-card-${index}`}
          className={cls(
            'mg-card',
            'mg-card__icon',
            centered && 'mg-card__icon--centered',
            orientation === 'horizontal' && 'mg-card__icon--horizontal',
            variant && variant !== 'default' && `mg-card__icon--${variant}`,
            item.borderColor && 'mg-card__icon--bordered'
          )}
          {...(item.borderColor && {
            style: { '--mg-card-border': item.borderColor },
          })}
        >
          {/* Icon or Image - wrapped in link when srOnlyTitle is true */}
          {(item.icon || item.imgback || item.iconColor) && (
            <div className="mg-card__visual">
              {item.visualLabel && (
                <span className="mg-card__visual-label">
                  {item.visualLabel}
                </span>
              )}
              {item.srOnlyTitle && (item.link || item.onClick) ? (
                <a
                  href={item.link || '#'}
                  onClick={item.onClick}
                  className="mg-card__visual-link"
                >
                  <Visual item={item} />
                </a>
              ) : (
                <Visual item={item} />
              )}
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
                {(item.link || item.onClick) &&
                !item.button &&
                !item.srOnlyTitle ? (
                  <a href={item.link || '#'} onClick={item.onClick}>
                    {item.title?.trim()}
                  </a>
                ) : (
                  item.title?.trim()
                )}
              </header>
            )}

            {/* Summary */}
            {item.summaryText && (
              <p
                className="mg-card__summary"
                // eslint-disable-next-line react/no-danger -- sanitized HTML contract; DOMPurify sanitizes caller input
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(item.summaryText),
                }}
              />
            )}

            {/* CTA - Button or Link */}
            {item.button && (
              <div className="mg-card__cta">
                <CtaButton
                  Type={item.buttonType || 'Primary'}
                  Variant="CTA"
                  label={item.button}
                  href={item.link || '#'}
                  onClick={item.onClick}
                />
              </div>
            )}

            {item.linkText && !item.button && (
              <p className="mg-card__link">
                <a href={item.link || '#'} onClick={item.onClick}>
                  {item.linkText}
                </a>
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
      /** Icon class name (e.g., "mg-icon mg-icon-globe") - see Atom/Icons */
      icon: PropTypes.string,
      /** Image URL (alternative to icon, matches VerticalCard) */
      imgback: PropTypes.string,
      /** Alt text for image (matches VerticalCard) */
      imgalt: PropTypes.string,
      /** Intrinsic image dimensions when imageScale is omitted; does not size CSS glyphs */
      iconSize: PropTypes.number,
      /** Image width scale: small (72px), medium (50%), large (75%), full (100%) */
      imageScale: PropTypes.oneOf(['small', 'medium', 'large', 'full']),
      /** Background color for the icon badge (CSS color, e.g., "#f4b8a8") */
      iconColor: PropTypes.string,
      /** Foreground (glyph) color for the icon (CSS color). Overrides the default neutral gray. */
      iconFgColor: PropTypes.string,
      /** Border color for the card (CSS color, e.g., "#e8963a") */
      borderColor: PropTypes.string,
      /** Badge or category label text */
      label: PropTypes.string,
      /** Text label rendered above the icon/image in the visual area */
      visualLabel: PropTypes.string,
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
      /** Optional activation handler for client-side routing. */
      onClick: PropTypes.func,
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
  /**
   * `vertical` stacks the icon above the content. `horizontal` sets it beside
   * the content, the arrangement undrr.org uses for "what would you like to do"
   * route rows. Horizontal owns the visual's size, so `imageScale` is ignored.
   */
  orientation: PropTypes.oneOf(['vertical', 'horizontal']),
};
