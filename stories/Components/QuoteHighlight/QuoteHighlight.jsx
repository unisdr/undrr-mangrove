import React from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';

/**
 * QuoteHighlight Component
 *
 * A component that displays a highlighted quote with an optional image, attribution, and title.
 * Multiple variants are available: with a separator line or with an image, and with different alignments.
 *
 * `quote`, `attribution` and `attributionTitle` are rendered as HTML so that the
 * inline markup authored copy carries — a `<cite>`, an `<em>`, a `<br>`, a link
 * on a name — survives rather than printing as tags. All three run through
 * DOMPurify's default allow-list first, the same call `TextCta` makes on its
 * `text` prop, so a script, an event-handler attribute or an embed cannot reach
 * the DOM through them. The default pass keeps everything these fields exist to
 * carry; it is short authored copy, not a panel body.
 *
 * One removal is not a script and is worth knowing: the default allow-list drops
 * `target` (and `referrerpolicy`), so an attribution link authored as
 * `target="_blank"` now opens in the same tab. `href`, `rel`, `class`, `id`,
 * `title`, `hreflang`, `lang`, `dir`, `aria-*` and `data-*` all survive. This is
 * the library-wide default, not a choice made here — `TextCta`, `Drawer` and the
 * cards strip it too.
 *
 * Sanitising here is defence in depth, not a licence to pass untrusted input:
 * the values arrive on props, or on `data-quote`, `data-attribution` and
 * `data-attribution-title` when the component is hydrated, and a consumer should
 * still filter them where they are produced. See "Quote HTML handling" in
 * QuoteHighlight.mdx for the consumer-facing statement.
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
          {/* The `<` test picks the wrapper element, not the safety: a quote
              with no markup gets a `<p>`, one with markup gets a `<span>` whose
              content is sanitised. Filtering is DOMPurify's job on both counts
              — React escapes the text branch. */}
          {typeof quote === 'string' && !quote.includes('<') ? (
            <p>{quote}</p>
          ) : (
            <span
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(quote) }}
            />
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
                      `<` test — a linked or emphasised name is the point — and
                      both are sanitised on the way through. */}
                  {attribution && (
                    <p
                      className={`${baseClass}__attribution-name`}
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(attribution),
                      }}
                    />
                  )}
                  {attributionTitle && (
                    <p
                      className={`${baseClass}__attribution-title`}
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(attributionTitle),
                      }}
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
   * The quote text to display. A value containing `<` is rendered as HTML,
   * sanitised with DOMPurify; anything else is rendered as text. See "Quote
   * HTML handling" in the MDX documentation.
   */
  quote: PropTypes.string.isRequired,
  /**
   * The name of the person being quoted. Always rendered as HTML, sanitised
   * with DOMPurify, so a name can carry a link or inline markup.
   */
  attribution: PropTypes.string,
  /**
   * The title or position of the person being quoted. Always rendered as HTML,
   * sanitised with DOMPurify.
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
