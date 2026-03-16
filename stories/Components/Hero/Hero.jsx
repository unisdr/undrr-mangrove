import React from 'react';
import PropTypes from 'prop-types';
import { CtaButton } from '../Buttons/CtaButton/CtaButton';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export const variantOptions = {
  primary: '',
  secondary: 'secondary',
  tertiary: 'tertiary',
  quaternary: 'quaternary',
};

/**
 * Full-width hero banner with background image, title, summary, and call-to-action buttons.
 * Renders one section per item in the data array (typically one).
 */
export function Hero({ data, variant }) {
  let variantActive = variantOptions[`${variant}`];

  return (
    <>
      {data.map((item, index) => (
        <section
          key={index}
          className={cls('mg-hero', 'mg-hero--' + `${variantActive}`)}
          style={{ backgroundImage: `url(${item.imgback})` }}
        >
          <div className="mg-hero__overlay">
            <article className="mg-hero__content">
              <div className="mg-hero__meta">
                {item.label && (
                  <span className="mg-hero__label">{item.label}</span>
                )}
              </div>
              <header className="mg-hero__title">
                {item.link ? (
                  <a href={item.link} className="text-xxl">
                    <span dangerouslySetInnerHTML={{ __html: item.title }} />
                  </a>
                ) : (
                  <h1 className="text-xxl">
                    <span dangerouslySetInnerHTML={{ __html: item.title }} />
                  </h1>
                )}
              </header>
              <div className="mg-hero__summaryText">
                <span dangerouslySetInnerHTML={{ __html: item.summaryText }} />
              </div>
              <div className="mg-hero__meta meta-detail">
                {item.detail && (
                  <span className="mg-hero__label detail">{item.detail}</span>
                )}
              </div>
              <div className="mg-hero__buttons">
                {item.primary_button && (
                  <CtaButton Type="Primary" label={item.primary_button} />
                )}
                {item.secondary_button && (
                  <CtaButton Type="Secondary" label={item.secondary_button} />
                )}
              </div>
            </article>
          </div>
        </section>
      ))}
    </>
  );
}

Hero.propTypes = {
  /** Array of hero content objects (typically one). */
  data: PropTypes.arrayOf(
    PropTypes.shape({
      imgback: PropTypes.string,
      label: PropTypes.string,
      title: PropTypes.string.isRequired,
      link: PropTypes.string,
      summaryText: PropTypes.string,
      detail: PropTypes.string,
      primary_button: PropTypes.string,
      secondary_button: PropTypes.string,
    })
  ).isRequired,
  /** Color variant: primary (default blue), secondary, tertiary, or quaternary. */
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'quaternary']),
};
