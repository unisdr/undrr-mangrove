/* eslint-disable react/no-danger */
import React from 'react';
import DOMPurify from 'dompurify';
import { CtaButton } from '../../Buttons/CtaButton/CtaButton';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export const alignment_options = {
  left: 'left',
  center: 'center',
  right: 'right', // for RTL
};

/**
 * IconCard Component
 *
 * A card variant with icon/image at top, content in middle, and link/button at bottom.
 * Supports alignment customization for LTR, RTL, and centered layouts.
 *
 * @param {Object} props
 * @param {Array} props.data - Array of card data objects
 * @param {string} props.alignment - Content alignment: 'left', 'center', or 'right' (for RTL)
 * @param {boolean} props.stackedLayout - Use stacked (column) layout at all breakpoints
 */
export function IconCard({ data, alignment = 'left', stackedLayout = false }) {
  const alignmentClass = alignment_options[alignment] || 'left';

  return (
    <>
      {data.map((item, index) => (
        <article
          key={item.id || item.title || `icon-card-${index}`}
          className={cls(
            'mg-card',
            'mg-card__icon',
            stackedLayout && 'mg-card__icon--stacked',
            `mg-card__icon--${alignmentClass}`
          )}
        >
          {/* Icon or Image */}
          {(item.icon || item.image) && (
            <div className="mg-card__icon-visual">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.imageAlt || ''}
                  className="mg-card__icon-image"
                  width={item.iconSize || 72}
                  height={item.iconSize || 72}
                />
              ) : item.icon ? (
                <div
                  className="mg-card__icon-icon"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(item.icon),
                  }}
                />
              ) : null}
            </div>
          )}

          {/* Card Content */}
          <div className="mg-card__icon-body">
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

            {/* Summary/Description */}
            {item.description && (
              <p
                className="mg-card__summary"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(item.description),
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
  alignment: 'left',
  stackedLayout: false,
};
