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

export function VerticalCard({ data, Hovercolors }) {
  let hovercolors_variant = hovercolors_options[`${Hovercolors}`];
  return (
    <>
      {data.map((item, index) => (
        <article key={index} className="mg-card mg-card__vc">
          {item.imgback && (
            <div className="mg-card__visual">
              <img
                src={item.imgback}
                alt={item.imgalt}
                className="mg-card__image"
              />
              {item.link && item.share && (
                <a href={item.link} className="mg-card__share">
                  {item.share}
                </a>
              )}
            </div>
          )}

          <div className={cls('mg-card__content', `${hovercolors_variant}`)}>
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

VerticalCard.defaultProps = {
  Hovercolors: 'yellow',
};
