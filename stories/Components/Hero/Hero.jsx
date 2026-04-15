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

const splitSuffixMap = {
  '2/3': '2-3',
  '1/2': '1-2',
  '1/3': '1-3',
};

/**
 * Full-width hero banner. Supports two layouts:
 * - `background` (default): full-bleed background image with coloured overlay.
 * - `split`: solid theme-colour background with a content column and a media column side by side.
 */
export function Hero({
  data,
  variant = 'primary',
  layout = 'background',
  headingLevel = 'h1',
  split = '2/3',
}) {
  const variantActive = variantOptions[variant];
  const HeadingTag = headingLevel;

  const renderTitle = (item) => (
    <header className="mg-hero__title">
      <HeadingTag className="text-xxl">
        {item.link ? (
          <a href={item.link}>
            <span dangerouslySetInnerHTML={{ __html: item.title }} />
          </a>
        ) : (
          <span dangerouslySetInnerHTML={{ __html: item.title }} />
        )}
      </HeadingTag>
    </header>
  );

  const renderContent = (item) => (
    <article className="mg-hero__content">
      <div className="mg-hero__meta">
        {item.label && <span className="mg-hero__label">{item.label}</span>}
      </div>
      {renderTitle(item)}
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
  );

  if (layout === 'split') {
    const splitSuffix = splitSuffixMap[split] || '2-3';
    return (
      <>
        {data.map((item, index) => (
          <section
            key={index}
            className={cls(
              'mg-hero',
              'mg-hero--split',
              `mg-hero--split-${splitSuffix}`,
              variantActive && `mg-hero--${variantActive}`
            )}
          >
            <div className="mg-hero__split-grid">
              {renderContent(item)}
              {item.media && (
                <div className="mg-hero__media">
                  <img
                    src={item.media.src}
                    alt={item.media.alt || ''}
                    className="mg-hero__media-img"
                  />
                </div>
              )}
            </div>
          </section>
        ))}
      </>
    );
  }

  // layout === 'background' (default)
  return (
    <>
      {data.map((item, index) => (
        <section
          key={index}
          className={cls('mg-hero', 'mg-hero--' + `${variantActive}`)}
          style={{ backgroundImage: `url(${item.imgback})` }}
        >
          <div className="mg-hero__overlay">
            {renderContent(item)}
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
      /** Media for split layout. Only `type: 'image'` is supported in v1. */
      media: PropTypes.shape({
        type: PropTypes.oneOf(['image']),
        src: PropTypes.string,
        alt: PropTypes.string,
      }),
    })
  ).isRequired,
  /** Color variant: primary (default blue), secondary, tertiary, or quaternary. */
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'quaternary']),
  /** Layout mode. `background` uses a full-bleed image; `split` uses a solid background with a media column. */
  layout: PropTypes.oneOf(['background', 'split']),
  /** Heading element level for the title. Defaults to `h1`; use `h2` or `h3` for mid-page placement. */
  headingLevel: PropTypes.oneOf(['h1', 'h2', 'h3']),
  /** Column split for `layout="split"`. Content column is always first. Defaults to `2/3`. */
  split: PropTypes.oneOf(['2/3', '1/2', '1/3']),
};
