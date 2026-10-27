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
  neutral: 'neutral',
};

const splitSuffixMap = {
  '2/3': '2-3',
  '1/2': '1-2',
  '1/3': '1-3',
};

function HeroTitle({ item, HeadingTag }) {
  return item.link ? (
    <HeadingTag className="mg-hero__title">
      <a href={item.link} dangerouslySetInnerHTML={{ __html: item.title }} />
    </HeadingTag>
  ) : (
    <HeadingTag
      className="mg-hero__title"
      dangerouslySetInnerHTML={{ __html: item.title }}
    />
  );
}

function HeroMedia({ media }) {
  if (!media) return null;
  const type = media.type || 'image';

  if (type === 'video') {
    return (
      <div className="mg-hero__media mg-hero__media--video">
        <iframe
          src={media.src}
          title={media.title || 'Embedded video'}
          className="mg-hero__media-iframe"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  if (type === 'html') {
    return (
      <div
        className="mg-hero__media mg-hero__media--html"
        dangerouslySetInnerHTML={{ __html: media.html || '' }}
      />
    );
  }

  return (
    <div className="mg-hero__media">
      <img
        src={media.src}
        alt={media.alt || ''}
        className="mg-hero__media-img"
      />
    </div>
  );
}

// The neutral surface carries dark copy, which no veil over a photograph can
// protect, so in the background layout it drops the image.
const showImage = (item, variant) => item.imgback && variant !== 'neutral';

function HeroTags({ tags, label }) {
  if (!tags?.length) return null;
  // A list named for screen readers, so the tags are announced as one group
  // with a count; sighted readers get the grouping from the tags' look.
  return (
    <ul className="mg-hero__tags" aria-label={label}>
      {tags.map(tag => (
        <li key={`${tag.label}-${tag.href || ''}`}>
          {tag.href ? (
            <a className="mg-tag" href={tag.href}>
              {tag.label}
            </a>
          ) : (
            <span className="mg-tag">{tag.label}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function HeroContent({ item, HeadingTag }) {
  const buttons =
    item.buttons ||
    [
      item.primary_button && {
        label: item.primary_button,
        type: 'Primary',
      },
      item.secondary_button && {
        label: item.secondary_button,
        type: 'Secondary',
      },
    ].filter(Boolean);

  return (
    <article className="mg-hero__content">
      {item.logo?.src && (
        <img
          className="mg-hero__logo"
          src={item.logo.src}
          alt={item.logo.alt || ''}
        />
      )}
      <div className="mg-hero__meta">
        {item.label && <span className="mg-hero__label">{item.label}</span>}
      </div>
      <HeroTitle item={item} HeadingTag={HeadingTag} />
      {item.summaryText && (
        <div className="mg-hero__summaryText">
          <span dangerouslySetInnerHTML={{ __html: item.summaryText }} />
        </div>
      )}
      <div className="mg-hero__meta meta-detail">
        {item.detail && (
          <span className="mg-hero__label detail">{item.detail}</span>
        )}
      </div>
      <HeroTags tags={item.tags} label={item.tagsLabel || 'Topics'} />
      {buttons.length > 0 && (
        <div className="mg-hero__buttons">
          {buttons.map((button, index) => (
            <CtaButton
              key={`${button.label}-${index}`}
              Type={button.type}
              Variant="CTA"
              label={button.label}
              href={button.url}
              onClick={button.onClick}
              target={button.target}
              rel={button.rel}
              data-vf-analytics-label={button.analyticsLabel}
            />
          ))}
        </div>
      )}
    </article>
  );
}

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
  size = 'default',
  contained = false,
}) {
  const variantActive = variantOptions[variant];
  const HeadingTag = headingLevel;

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
              size === 'immersive' && 'mg-hero--immersive',
              contained && 'mg-hero--contained',
              variantActive && `mg-hero--${variantActive}`
            )}
          >
            <div
              className={cls(
                'mg-hero__split-grid',
                'mg-container',
                !item.media && 'mg-hero__split-grid--no-media'
              )}
            >
              <HeroContent item={item} HeadingTag={HeadingTag} />
              {item.media && <HeroMedia media={item.media} />}
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
          className={cls(
            'mg-hero',
            size === 'immersive' && 'mg-hero--immersive',
            contained && 'mg-hero--contained',
            !showImage(item, variant) && 'mg-hero--no-image',
            variantActive && `mg-hero--${variantActive}`
          )}
          style={
            showImage(item, variant)
              ? { backgroundImage: `url(${item.imgback})` }
              : undefined
          }
        >
          <div className="mg-hero__overlay">
            <HeroContent item={item} HeadingTag={HeadingTag} />
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
      /**
       * Eyebrow above the title. A string renders as before; a node may hold
       * links, e.g. a parent page link followed by a type ("Collection · Topic
       * guide").
       */
      label: PropTypes.node,
      /**
       * Heading text. Rendered via `dangerouslySetInnerHTML` to allow inline
       * markup (e.g. `<em>`, `<br>`) from CMS-authored content. The consumer
       * (e.g. Drupal text-format pipeline) must sanitise.
       */
      title: PropTypes.string.isRequired,
      link: PropTypes.string,
      /**
       * Summary / lede text. Rendered via `dangerouslySetInnerHTML` to allow
       * inline markup from CMS-authored content. The consumer (e.g. Drupal
       * text-format pipeline) must sanitise.
       */
      summaryText: PropTypes.string,
      /**
       * Facts line below the summary. A string renders as before; a node may
       * hold links, e.g. an item count that jumps to a list on the page.
       */
      detail: PropTypes.node,
      /**
       * Taxonomy tags below the summary and facts line, rendered as a list of
       * outline tags (`ul.mg-hero__tags`, each a `.mg-tag`). Tags with `href`
       * are links. Tag modifiers such as `mg-tag--secondary` still apply in
       * hand-written markup.
       */
      tags: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          href: PropTypes.string,
        })
      ),
      /** Accessible name of the tag list. Defaults to "Topics". */
      tagsLabel: PropTypes.string,
      primary_button: PropTypes.string,
      secondary_button: PropTypes.string,
      /** Optional brand mark displayed above the label and title. */
      logo: PropTypes.shape({
        src: PropTypes.string.isRequired,
        alt: PropTypes.string,
      }),
      /** Structured CTA links. Replaces legacy button strings when supplied. */
      buttons: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          url: PropTypes.string,
          type: PropTypes.oneOf(['Primary', 'Secondary']),
          onClick: PropTypes.func,
          target: PropTypes.string,
          rel: PropTypes.string,
          /**
           * Fixed label for the UNDRR click tracker
           * (`data-vf-analytics-label`), so reports do not split by language
           * or by a number in the button text.
           */
          analyticsLabel: PropTypes.string,
        })
      ),
      /**
       * Media for split layout. Discriminated by `type`:
       * - `image` (default): `src` (required), `alt` (optional; empty string for decorative).
       * - `video`: `src` is an iframe-embeddable URL (e.g. `https://www.youtube.com/embed/…`), `title` is required for a11y.
       * - `html`: `html` is a pre-sanitized HTML string rendered via `dangerouslySetInnerHTML`. The consumer (e.g. Drupal) must sanitize.
       */
      media: PropTypes.shape({
        type: PropTypes.oneOf(['image', 'video', 'html']),
        src: PropTypes.string,
        alt: PropTypes.string,
        title: PropTypes.string,
        html: PropTypes.string,
      }),
    })
  ).isRequired,
  /**
   * Colour variant: primary (default blue), secondary, tertiary, quaternary,
   * or neutral: the page's white surface with dark text and interactive-colour
   * links, for page headers that should not read as a coloured band. Neutral
   * is meant for `layout="split"`; in the background layout it drops the
   * photograph.
   */
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'tertiary',
    'quaternary',
    'neutral',
  ]),
  /** Layout mode. `background` uses a full-bleed image; `split` uses a solid background with a media column. */
  layout: PropTypes.oneOf(['background', 'split']),
  /** Heading element level for the title. Defaults to `h1`; use `h2` or `h3` for mid-page placement. */
  headingLevel: PropTypes.oneOf(['h1', 'h2', 'h3']),
  /** Column split for `layout="split"`. Content column is always first. Defaults to `2/3`. */
  split: PropTypes.oneOf(['2/3', '1/2', '1/3']),
  /** Visual height: standard banner or tall editorial feature. */
  size: PropTypes.oneOf(['default', 'immersive']),
  /** Keep the Hero within its parent instead of extending to the viewport edges. */
  contained: PropTypes.bool,
};
