/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { CtaButton } from '../../Buttons/CtaButton/CtaButton';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

// Content contract: see schemas/card.schema.js for canonical field names and documented deviations.
export function BookCard({ data, variant = 'primary', className }) {
  const variantClass = variant && variant !== 'primary' ? `mg-card--${variant}` : null;
  return (
    <>
      {data.map((item, index) => (
        <article key={index} className={cls('mg-card', 'mg-card__vc', 'mg-card__book', variantClass, className)}>
          <div className="mg-card__visual">
            <img
              src={item.imgback}
              alt={item.imgalt}
              className="mg-card__image"
            />
          </div>

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
  data: PropTypes.array.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'quaternary']),
  className: PropTypes.string,
};
