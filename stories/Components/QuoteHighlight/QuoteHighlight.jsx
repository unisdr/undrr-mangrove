import React from 'react';
import PropTypes from 'prop-types';

/**
 * QuoteHighlight Component
 *
 * A component that displays a highlighted quote with an optional image, attribution, and title.
 * Multiple variants are available: with a separator line or with an image, and with different alignments.
 *
 * Trust boundary: `quote`, `attribution` and `attributionTitle` are rendered
 * unescaped and are not sanitised. The intent is inline markup in authored copy
 * — a `<cite>`, an `<em>`, a `<br>`, a link on a name — which escaping would
 * print as tags. `attribution` and `attributionTitle` always take the HTML
 * path; `quote` takes it whenever the string contains a `<`, and is rendered as
 * text otherwise. That check picks a rendering path, not a safe one: it is a
 * substring test, so a quote that merely mentions a `<` goes through as markup.
 *
 * All three arrive on props, or on `data-quote`, `data-attribution` and
 * `data-attribution-title` when the component is hydrated, so the boundary is
 * the consumer's own code and the sanitising belongs where those values are
 * produced. Worth stating plainly because the sibling components closest to
 * this one in shape — `TextCta`, `Drawer` and the cards, all rendering short
 * authored strings — do run DOMPurify, and this one does not. See "Quote HTML
 * trust contract" in QuoteHighlight.mdx for the consumer-facing statement.
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
          {/* Authored quote copy, rendered as-is so its inline markup survives.
              The `<` test routes between text and markup; it does not filter.
              See the trust boundary note at the top of this file. */}
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
                  {/* Both attribution fields always take the HTML path, with no
                      `<` test — a linked or emphasised name is the point. See
                      the trust boundary note at the top of this file. */}
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
  /**
   * The quote text to display. A value containing `<` is rendered as
   * unsanitised HTML; anything else is rendered as text. See "Quote HTML trust
   * contract" in the MDX documentation.
   */
  quote: PropTypes.string.isRequired,
  /**
   * The name of the person being quoted. Always rendered as unsanitised HTML,
   * so a name can carry a link or inline markup. Sanitise it yourself.
   */
  attribution: PropTypes.string,
  /**
   * The title or position of the person being quoted. Always rendered as
   * unsanitised HTML. Sanitise it yourself.
   */
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
