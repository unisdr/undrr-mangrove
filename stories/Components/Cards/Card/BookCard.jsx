import React from 'react';
import PropTypes from 'prop-types';
import { CardTitle, resolveCardLink } from './cardParts';
const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

// Content contract: see schemas/card.schema.js for canonical field names and documented deviations.
export function BookCard({ items, variant = 'primary', className }) {
  const variantClass =
    variant && variant !== 'primary' ? `mg-card--${variant}` : null;
  return (
    <>
      {items.map((item, index) => {
        const link = resolveCardLink(item.link);
        return (
          <article
            key={index}
            className={cls(
              'mg-card',
              'mg-card__vc',
              'mg-card__book',
              variantClass,
              !link && 'mg-card--no-link',
              className
            )}
          >
            {item.image?.src && (
              <div className="mg-card__visual">
                <img
                  src={item.image?.src}
                  alt={item.image?.alt}
                  className="mg-card__image"
                />
              </div>
            )}

            <div className="mg-card__content">
              <CardTitle
                title={item.title}
                link={link}
                target={item.target}
                rel={item.rel}
              />
            </div>
          </article>
        );
      })}
    </>
  );
}
BookCard.propTypes = {
  items: PropTypes.array.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'quaternary']),
  className: PropTypes.string,
};
