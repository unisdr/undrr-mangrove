import React from 'react';
import PropTypes from 'prop-types';
import { CtaButton } from '../Buttons/CtaButton/CtaButton';
// import imgPath from '../../../assets/images/hero_background.png';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export const variantOptions = {
  primary: '',
  secondary: 'secondary',
  tertiary: 'tertiary',
  quaternary: 'quaternary',
};

/**
 * Smaller hero banner for child/section pages with linked label, title, and single CTA button.
 * Renders one section per item in the data array (typically one).
 */
export function ChildHero({ data, variant = 'primary' }) {
  let variantActive = variantOptions[`${variant}`];
  return (
    <>
      {data.map((item, index) => (
        <section
          key={index}
          className={cls(
            'mg-hero',
            'mg-hero--child',
            'mg-hero--' + `${variantActive}`
          )}
          style={{ backgroundImage: `url(${item.imgback})` }}
        >
          <div className="mg-hero__overlay">
            <article className="mg-hero__content">
              <div className="mg-hero__meta">
                <a href={item.link} className="mg-hero__label">
                  {item.label}
                </a>
              </div>

              <header className="mg-hero__title">
                <a href="#" className="text-xxl">
                  {item.title}
                </a>
              </header>

              <div className="mg-hero__summaryText">{item.summaryText}</div>

              <div className="mg-hero__buttons">
                <CtaButton type="Primary" label={item.primary_button} />
                {/* <a href={item.link} className="mg-hero__button mg-hero__button-primary">{item.primary_button}</a> */}
              </div>
            </article>
          </div>
        </section>
      ))}
    </>
  );
}

ChildHero.propTypes = {
  /** Array of child hero content objects (typically one). */
  data: PropTypes.arrayOf(
    PropTypes.shape({
      imgback: PropTypes.string,
      label: PropTypes.string,
      title: PropTypes.string.isRequired,
      link: PropTypes.string,
      summaryText: PropTypes.string,
      primary_button: PropTypes.string,
    })
  ).isRequired,
  /** Color variant: primary (default blue), secondary, tertiary, or quaternary. */
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'quaternary']),
};
