/* eslint-disable react/no-danger */
import React, { Fragment } from 'react';
import DOMPurify from 'dompurify';
import { CtaButton } from '../../Buttons/CtaButton/CtaButton';
// import './card.scss';
//import '../../../../assets/scss/_grid.scss';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export const hovercolors_options = {
  yellow: '',
  red: 'red',
  blue: 'blue',
  green: 'green',
};

export function BookCard({ data, Hovercolors }) {
  let hovercolors_variant = hovercolors_options[`${Hovercolors}`];
  return (
    <>
      {data.map((item, index) => (
        <article key={index} className="mg-card mg-card__vc mg-card__book">
          <div className="mg-card__visual">
            <img
              src={item.imgback}
              alt={item.imgalt}
              className="mg-card__image"
            />
          </div>

          <div className={cls('mg-card__content', `${hovercolors_variant}`)}>
            <header className="mg-card__title">
              <a href={item.link}>{item.title}</a>
            </header>
          </div>
        </article>
      ))}
    </>
  );
}

BookCard.defaultProps = {
  Hovercolors: 'yellow',
};
