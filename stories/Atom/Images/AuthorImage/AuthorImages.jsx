import React from 'react';
import PropTypes from 'prop-types';
// import './author-image.scss';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export const size_options = {
  Large: 'mg-author-image--large',
  Small: 'mg-author-image--small',
};

export const highlight_options = {
  primary: 'mg-author-image--primary',
  secondary: 'mg-author-image--secondary',
  tertiary: 'mg-author-image--tertiary',
};

/**
 * Author portrait with name, title and organisation, optionally linked.
 *
 * @param {Object} props
 * @param {string} [props.image]                                         Avatar image URL
 * @param {string} [props.imageAlt='']                                   Accessible alt text for the avatar image
 * @param {string} [props.alt]                                           Backward-compatible alt text; `imageAlt` takes precedence
 * @param {string} [props.name='']                                       Author name
 * @param {string} [props.title='']                                      Job title or role
 * @param {string} [props.org='']                                        Organisation or affiliation
 * @param {'Large'|'Small'} [props.variant='Large']                      Visual size
 * @param {'primary'|'secondary'|'tertiary'} [props.highlight='primary'] Accent colour
 * @param {'vertical'|'horizontal'} [props.layout='vertical']            Layout direction
 * @param {'default'|'inverse'} [props.tone='default']                   Text tone
 * @param {string} [props.href='']                                       Link destination
 * @param {string} [props.target]                                        Link target
 * @param {string} [props.rel]                                           Link rel attribute; defaults to `noreferrer noopener` when `target` is `_blank`
 */
export function AuthorImage({
  image,
  imageAlt = '',
  alt,
  name = '',
  title = '',
  org = '',
  variant = 'Large',
  highlight = 'primary',
  layout = 'vertical',
  tone = 'default',
  href = '',
  target,
  rel,
}) {
  const sizeVariant = size_options[variant];
  const highlightVariant = highlight_options[highlight];
  const layoutVariant =
    layout === 'horizontal'
      ? 'mg-author-image--horizontal'
      : 'mg-author-image--vertical';
  const toneVariant = tone === 'inverse' ? 'mg-author-image--inverse' : null;
  const hasImage = Boolean(image);
  const altText = imageAlt || alt || '';
  const hasMeta = Boolean(title || org);
  const linkRel =
    rel || (target === '_blank' ? 'noreferrer noopener' : undefined);
  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href
    ? {
        href,
        target,
        rel: linkRel,
        className: 'mg-author-image__link',
      }
    : { className: 'mg-author-image__body' };

  return (
    <figure
      className={cls(
        'mg-author-image',
        sizeVariant,
        highlightVariant,
        layoutVariant,
        !hasImage && 'mg-author-image--no-image',
        toneVariant
      )}
    >
      <Wrapper {...wrapperProps}>
        {hasImage && (
          <div className="mg-author-image__avatar">
            <img src={image} alt={altText} title={altText || undefined} />
          </div>
        )}

        <figcaption className="mg-author-image__content">
          {name && <p className="mg-author-image__name">{name}</p>}

          {hasMeta && (
            <p className="mg-author-image__meta">
              {title && <span className="mg-author-image__title">{title}</span>}
              {title && org && (
                <span className="mg-author-image__separator" aria-hidden="true">
                  ·
                </span>
              )}
              {org && <span className="mg-author-image__org">{org}</span>}
            </p>
          )}
        </figcaption>
      </Wrapper>
    </figure>
  );
}

AuthorImage.propTypes = {
  /** Avatar image URL */
  image: PropTypes.string,
  /** Accessible alt text for the avatar image */
  imageAlt: PropTypes.string,
  /** Backward-compatible alt prop */
  alt: PropTypes.string,
  /** Author name */
  name: PropTypes.string,
  /** Job title or role */
  title: PropTypes.string,
  /** Organisation or affiliation */
  org: PropTypes.string,
  /** Visual size */
  variant: PropTypes.oneOf(['Large', 'Small']),
  /** Accent colour */
  highlight: PropTypes.oneOf(['primary', 'secondary', 'tertiary']),
  /** Layout direction */
  layout: PropTypes.oneOf(['vertical', 'horizontal']),
  /** Text tone */
  tone: PropTypes.oneOf(['default', 'inverse']),
  /** Link destination */
  href: PropTypes.string,
  /** Link target */
  target: PropTypes.string,
  /** Link rel attribute */
  rel: PropTypes.string,
};

export const Authorimg = AuthorImage;

export default AuthorImage;
