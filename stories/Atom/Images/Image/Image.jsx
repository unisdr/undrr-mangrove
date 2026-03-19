import React from 'react';
import PropTypes from 'prop-types';
// import './image.scss';
import mongoliaGoat from '../../../assets/images/Mongolia-cashmere-goats.jpg';
import mongoliaGoatmd from '../../../assets/images/Mongolia-cashmere-goats-md.jpg';
import mongoliaGoatsm from '../../../assets/images/Mongolia-cashmere-goats-sm.jpg';

/**
 * Renders a responsive image as either an `img` or `picture` element with optional lazy loading.
 *
 * @param {Object} props
 * @param {string} [props.className] CSS class; use 'lazy' to enable lazy-loading placeholders
 * @param {string} [props.Type]      Render mode: 'img' for a single image, any other value for a picture element
 */
export const Image = ({ className, Type }) => {
  const image = {
    srclg: mongoliaGoat,
    srcmd: mongoliaGoatmd,
    srcsm: mongoliaGoatsm,
    alt: 'UNDRR Image',
  };
  return (
    <>
      {Type == 'img' ? (
        <>
          {className == 'lazy' ? (
            <img
              src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
              alt={image.alt}
              className={className}
              data-src={image.srclg}
            />
          ) : (
            <img alt={image.alt} className={className} src={image.srclg} />
          )}
        </>
      ) : (
        <>
          {className == 'lazy' ? (
            <picture className={className}>
              <source
                media="(min-width:1024px)"
                srcSet="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
                data-srcset={image.srclg}
              />
              <source
                media="(min-width:767px)"
                srcSet="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
                data-srcset={image.srcmd}
              />
              <img
                src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
                data-src={image.srcsm}
                alt={image.alt}
              />
            </picture>
          ) : (
            <picture className={className}>
              <source media="(min-width:1024px)" srcSet={image.srclg} />
              <source media="(min-width:767px)" srcSet={image.srcmd} />
              <img src={image.srcsm} alt={image.alt} />
            </picture>
          )}
        </>
      )}
    </>
  );
};

Image.propTypes = {
  /** CSS class applied to the image or picture element; use 'lazy' to enable lazy loading. */
  className: PropTypes.string,
  /** Render mode: 'img' for a single image element, any other value for a responsive picture element. */
  Type: PropTypes.string,
};
