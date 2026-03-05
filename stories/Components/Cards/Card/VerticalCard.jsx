/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { CtaButton } from '../../Buttons/CtaButton/CtaButton';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export function VerticalCard({ data, variant = 'primary', className }) {
  const variantClass = variant && variant !== 'primary' ? `mg-card--${variant}` : null;
  return (
    <>
      {data.map((item, index) => (
        <article key={index} className={cls('mg-card', 'mg-card__vc', variantClass, className)}>
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
            {(item.label1 || item.label2) && (
              <div className="mg-card__meta">
                {item.link && item.label1 && (
                  <a
                    href={item.link}
                    className="mg-card__label mg-card__label--active"
                  >
                    {item.label1}
                  </a>
                )}
                {item.link && item.label2 && (
                  <a
                    href={item.link}
                    className="mg-card__label mg-card__label--active"
                  >
                    {item.label2}
                  </a>
                )}
              </div>
            )}

            <header className="mg-card__title">
              <a href={item.link}>{item.title}</a>
            </header>
            {item.summaryText && (
              <p
                className="mg-card__summary"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(item.summaryText),
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

VerticalCard.propTypes = {
  data: PropTypes.array.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'quaternary']),
  className: PropTypes.string,
};
