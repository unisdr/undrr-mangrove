import React from 'react';
import PropTypes from 'prop-types';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

/**
 * Renders a logo image with alt text.
 * The `autocrop` variant crops to a fixed box on mobile/tablet instead of
 * shrinking the whole image, so the logo stays legible at small sizes — used
 * by the page header ("black bar").
 */
export const Logo = ({
  src,
  alt,
  title,
  width,
  height,
  lang,
  autocrop = false,
  className,
}) => (
  <img
    src={src}
    alt={alt}
    title={title}
    width={width}
    height={height}
    lang={lang}
    className={cls('mg-logo', autocrop && 'mg-logo--autocrop', className)}
  />
);

Logo.propTypes = {
  /** URL of the logo image. */
  src: PropTypes.string.isRequired,
  /** Alternative text describing the logo for screen readers. */
  alt: PropTypes.string.isRequired,
  /** Title attribute shown on hover. */
  title: PropTypes.string,
  /** Native image width, for layout stability. */
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Native image height, for layout stability. */
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /**
   * BCP 47 language tag of the wordmark's text (e.g. `ar`, `es`, `fr`, `ru`,
   * `zh`), so screen readers pronounce the alt text in the right language.
   * Omit for the default English logo, which inherits the page language.
   */
  lang: PropTypes.string,
  /**
   * Crop to a fixed box on mobile/tablet instead of letterboxing with
   * `object-fit: contain`. Tuned for the horizontal UNDRR wordmark; re-check
   * the crop box in `logo.scss` if a differently-proportioned asset is used.
   */
  autocrop: PropTypes.bool,
  /** Additional CSS classes. */
  className: PropTypes.string,
};
