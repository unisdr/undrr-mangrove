import React from 'react';
import PropTypes from 'prop-types';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

/**
 * Renders a logo image with alt text.
 * The `crop="autocrop"` variant crops to a fixed box on mobile/tablet
 * instead of shrinking the whole image, so the logo stays legible at small
 * sizes — used by the page header ("black bar"). It is tuned to the
 * proportions of the default English horizontal wordmark only: verified
 * against the translated assets (assets.undrr.org/logos/undrr/), it cuts the
 * bottom off their subtitle line, since those assets are ~2.3-2.9:1
 * (roughly square) rather than the ~6.6:1 the crop box assumes. Do not use
 * `crop="autocrop"` with a translated or otherwise differently-proportioned
 * logo asset.
 */
export const Logo = ({
  src,
  alt,
  title,
  width,
  height,
  lang,
  crop,
  className,
}) => (
  <img
    src={src}
    alt={alt}
    title={title}
    width={width}
    height={height}
    lang={lang}
    className={cls('mg-logo', crop && `mg-logo--${crop}`, className)}
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
   * `zh`). Correct, valid usage on an `<img>`, but treat it as a hint rather
   * than a guarantee: screen readers generally read `alt` text using the
   * page's ambient language, and support for honoring `lang` set directly on
   * an `<img>` varies by browser/AT combination. Omit for the default
   * English logo, which inherits the page language.
   */
  lang: PropTypes.string,
  /**
   * Crop variant. `"autocrop"` crops to a fixed box below the desktop
   * breakpoint instead of letterboxing with `object-fit: contain`. Tuned for
   * the default English horizontal wordmark's proportions — do not use with
   * translated or other differently-proportioned assets (see component
   * doc-comment above). Unset renders the uncropped default.
   */
  crop: PropTypes.oneOf(['autocrop']),
  /** Additional CSS classes. */
  className: PropTypes.string,
};
