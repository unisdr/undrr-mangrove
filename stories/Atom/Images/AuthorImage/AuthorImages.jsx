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

export function AuthorImage({
  image,
  imageAlt = '',
  alt,
  name = '',
  title = '',
  org = '',
  variant = 'Large',
  highlight = 'primary',
}) {
  const sizeVariant = size_options[variant];
  const highlightVariant = highlight_options[highlight];
  const altText = imageAlt || alt || '';
  const hasMeta = Boolean(title || org);

  return (
    <figure className={cls('mg-author-image', sizeVariant, highlightVariant)}>
      <div className="mg-author-image__avatar">
        <img src={image} alt={altText} title={altText || undefined} />
      </div>

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
    </figure>
  );
}

AuthorImage.propTypes = {
  /** Avatar image URL */
  image: PropTypes.string.isRequired,
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
};

export const Authorimg = AuthorImage;

export default AuthorImage;
