/* eslint-disable react/no-danger */
import React, { Fragment } from 'react';
import DOMPurify from 'dompurify';
import { CtaButton } from '../../Buttons/CtaButton/CtaButton';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export const hovercolors_options = {
  yellow: '',
  red: 'red',
  blue: 'blue',
  green: 'green',
};

export function HorizontalBookCard({ data, Hovercolors }) {
  let hovercolors_variant = hovercolors_options[`${Hovercolors}`];
  return (
    <>
      {data.map((item, index) => (
        <article key={index} className="mg-card mg-card__hc mg-card-book__hc">
          {item.imgback && (
            <div className="mg-card__visual">
              <img
                src={item.imgback}
                alt={item.imgalt}
                className="mg-card__image"
              />
              {/* <a href={item.link} className="mg-card__share">{item.share}</a> */}
            </div>
          )}

          <div className={cls('mg-card__content', `${hovercolors_variant}`)}>
            {item.label1 && (
              <div className="mg-card__meta">
                <a
                  href={item.link}
                  className="mg-card__label mg-card__label--active"
                >
                  {item.label1}
                </a>
                <a
                  href={item.link}
                  className="mg-card__label mg-card__label--active"
                >
                  {item.label2}
                </a>
              </div>
            )}

            <header className="mg-card__title">
              <a href={item.link}>{item.title}</a>
            </header>
            <p
              className="mg-card__summary"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(item.summaryText),
              }}
            />
            {item.link && (
              <CtaButton type="Primary" label={item.button} href={item.link} />
            )}
          </div>
        </article>
      ))}
    </>
  );
}

HorizontalBookCard.defaultProps = {
  Hovercolors: 'yellow',
};
