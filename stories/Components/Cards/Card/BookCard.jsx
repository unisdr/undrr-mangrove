/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { CtaButton } from '../../Buttons/CtaButton/CtaButton';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export function BookCard({ items, variant = 'primary', className }) {
  const variantClass = variant && variant !== 'primary' ? `mg-card--${variant}` : null;
  return (
    <>
      {items.map((item, index) => (
        <article key={index} className={cls('mg-card', 'mg-card__vc', 'mg-card__book', variantClass, className)}>
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
            <header className="mg-card__title">
              <a href={item.link}>{item.title?.trim()}</a>
            </header>
          </div>
        </article>
      ))}
    </>
  );
}

BookCard.propTypes = {
  items: PropTypes.array.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'quaternary']),
  className: PropTypes.string,
};
