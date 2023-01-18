import React, { Fragment } from 'react';
import './hero.scss';
import '../../../assets/scss/_grid.scss';
import imgPath from '../../../assets/images/hero_background.png';

const cls = (...classes) => ((classes.filter(Boolean).length > 0) ? classes.filter(Boolean).join(' ') : null);
let heroStyle = {
  backgroundImage: `url(${imgPath})`,
};

export const hovercolors_options = {
  yellow: '',
  red: 'red',
  blue: 'blue',
  green: 'green',
};

export function ChildHero({
  data, Hovercolors,
}) {
  let hovercolors_variant = hovercolors_options[`${Hovercolors}`];
  return (

    <>
      <h5>HERO SUB (Child kitchen sink)</h5>
      <section className="mg-card__hero" style={heroStyle}>

        {data.map((item, index) => (
          <div key={index} className="mg-hero__overlay child">

            <article className="mg-hero__content">

              <div className="mg-hero__meta">
                <a href={item.link} className="mg-hero__label">{item.label}</a>
              </div>

              <header className="mg-hero__title">
                <a href="#" className="text-xxl">{item.title}</a>
              </header>

              <div className="mg-hero__subtitle">{item.subtitle}</div>

              <div className="mg-hero__buttons">
                <a href={item.link} className="mg-hero__button mg-hero__button-primary">{item.primary_button}</a>
              </div>

            </article>

          </div>
        ))}
      </section>
    </>
  );
}

ChildHero.defaultProps = {
  Hovercolors: 'yellow',
};
