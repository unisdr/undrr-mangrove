/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { CtaButton } from '../../Buttons/CtaButton/CtaButton';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export function HorizontalCard({ items, variant = 'primary', className }) {
  const variantClass = variant && variant !== 'primary' ? `mg-card--${variant}` : null;
  return (
    <>
      {items.map((item, index) => (
        <article key={index} className={cls('mg-card', 'mg-card__hc', variantClass, className)}>
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
            {item.labels?.length > 0 && (
              <div className="mg-card__meta">
                {item.labels?.[0] && (
                  <a
                    href={item.link}
                    className="mg-card__label mg-card__label--active"
                  >
                    {item.labels[0]}
                  </a>
                )}
                {item.labels?.[1] && (
                  <a
                    href={item.link}
                    className="mg-card__label mg-card__label--active"
                  >
                    {item.labels[1]}
                  </a>
                )}
              </div>
            )}

            <header className="mg-card__title">
              <a href={item.link}>{item.title?.trim()}</a>
            </header>
            {item.summary && (
              <p
                className="mg-card__summary"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(item.summary),
                }}
              />
            )}
            {item.button && (
              <CtaButton type="Primary" label={item.button} href={item.link} />
            )}
          </div>
        </article>
      ))}
    </>
  );
}

HorizontalCard.propTypes = {
  items: PropTypes.array.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'quaternary']),
  className: PropTypes.string,
};
