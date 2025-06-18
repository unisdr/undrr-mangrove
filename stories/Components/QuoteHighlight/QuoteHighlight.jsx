import React from 'react';
import PropTypes from 'prop-types';

/**
 * QuoteHighlight Component
 *
 * A component that displays a highlighted quote with an optional image, attribution, and title.
 * Multiple variants are available: with a separator line or with an image, and with different alignments.
 */
const QuoteHighlight = ({
  quote,
  attribution,
  attributionTitle,
  imageSrc,
  imageAlt,
  backgroundColor = 'light',
  variant = 'line',
  alignment = 'full',
  className = '',
  ...props
}) => {
  const baseClass = 'mg-quote-highlight';
  const hasImage = !!imageSrc;

  return (
    <section
      className={`${baseClass} ${baseClass}--${backgroundColor} ${baseClass}--${variant} ${baseClass}--${alignment} ${hasImage ? `${baseClass}--has-image` : ''} ${className}`}
      {...props}
    >
      <div className={`${baseClass}__content`}>
        <blockquote className={`${baseClass}__quote`}>
          {typeof quote === 'string' && !quote.includes('<') ? (
            <p>{quote}</p>
          ) : (
            <span dangerouslySetInnerHTML={{ __html: quote }} />
          )}
        </blockquote>

        {variant === 'line' && (
          <div className={`${baseClass}__separator`}></div>
        )}

        {(attribution || attributionTitle || hasImage) && (
          <div className={`${baseClass}__attribution`}>
            <div className={`${baseClass}__attribution-wrapper`}>
              {hasImage && (
                <div className={`${baseClass}__portrait-container`}>
                  <img
                    src={imageSrc}
                    alt={imageAlt || `${attribution || 'Quote'} image`}
                    className={`${baseClass}__portrait`}
                  />
                </div>
              )}
              {(attribution || attributionTitle) && (
                <div className={`${baseClass}__attribution-text`}>
                  {attribution && (
                    <p
                      className={`${baseClass}__attribution-name`}
                      dangerouslySetInnerHTML={{ __html: attribution }}
                    />
                  )}
                  {attributionTitle && (
                    <p
                      className={`${baseClass}__attribution-title`}
                      dangerouslySetInnerHTML={{ __html: attributionTitle }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {variant === 'image' && hasImage && (
        <div className={`${baseClass}__image-container`}>
          <img
            src={imageSrc}
            alt={imageAlt || `${attribution || 'Quote'} image`}
            className={`${baseClass}__image`}
          />
        </div>
      )}
    </section>
  );
};

QuoteHighlight.propTypes = {
  /** The quote text to display */
  quote: PropTypes.string.isRequired,
  /** The name of the person being quoted */
  attribution: PropTypes.string,
  /** The title or position of the person being quoted */
  attributionTitle: PropTypes.string,
  /** URL for the image to display */
  imageSrc: PropTypes.string,
  /** Alt text for the image */
  imageAlt: PropTypes.string,
  /** Background color variant */
  backgroundColor: PropTypes.oneOf(['light', 'dark', 'bright']),
  /** Component variant: 'line' (with separator line) or 'image' (with image) */
  variant: PropTypes.oneOf(['line', 'image']),
  /** Component alignment: 'full' (full width), 'left' (float left), 'right' (float right) */
  alignment: PropTypes.oneOf(['full', 'left', 'right']),
  /** Additional CSS class names */
  className: PropTypes.string,
};

export default QuoteHighlight;
