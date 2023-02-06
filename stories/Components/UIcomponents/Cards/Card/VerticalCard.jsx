/* eslint-disable react/no-danger */
import React, { Fragment } from 'react';
import DOMPurify from 'dompurify';
import { CtaButton } from '../../Buttons/CtaButton/CtaButton';
// import './card.scss';
import '../../../../assets/scss/_grid.scss';

const cls = (...classes) => ((classes.filter(Boolean).length > 0) ? classes.filter(Boolean).join(' ') : null);

export const hovercolors_options = {
  yellow: '',
  red: 'red',
  blue: 'blue',
  green: 'green',
};

export function VerticalCard({
  data, Hovercolors,
}) {
  let hovercolors_variant = hovercolors_options[`${Hovercolors}`];
  return (
    <>
      <article className="mg-card">

        {data.map((item, index) => (
          <div key={index} className="mg-card__vc">
            <div className="mg-card__visual">
              <img src={item.imgback} alt={item.imgalt} className="mg-card__image" />
              <a href={item.link} className="mg-card__share">{item.share}</a>
            </div>

            <div className={cls('mg-card__content', `${hovercolors_variant}`)}>
              <div className="mg-card__meta">
                <a href={item.link} className="mg-card__label mg-card__label--active">{item.label1}</a>
                <a href={item.link} className="mg-card__label mg-card__label--active">{item.label2}</a>
              </div>

              <header className="mg-card__title">
                <a href={item.link}>{item.title}</a>
              </header>
              <p className="mg-card__summaryText" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.summaryText) }} />
              <CtaButton type="Primary" label={item.button} href={item.link} />
            </div>

          </div>
        ))}
      </article>
    </>
  );
}

VerticalCard.defaultProps = {
  Hovercolors: 'yellow',
};
