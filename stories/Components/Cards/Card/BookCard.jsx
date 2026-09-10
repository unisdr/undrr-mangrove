import React from 'react';
import PropTypes from 'prop-types';
import { CardTitle, resolveCardLink } from './cardParts';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export function BookCard({ data, variant = 'primary', className }) {
  const variantClass =
    variant && variant !== 'primary' ? `mg-card--${variant}` : null;
  return (
    <>
      {data.map((item, index) => {
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
            {item.imgback && (
              <div className="mg-card__visual">
                <img
                  src={item.imgback}
                  alt={item.imgalt}
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
  data: PropTypes.array.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'quaternary']),
  className: PropTypes.string,
};
