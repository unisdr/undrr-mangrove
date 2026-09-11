import React, { useId } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { CtaButton } from '../Buttons/CtaButton/CtaButton';

const cls = (...classes) => classes.filter(Boolean).join(' ') || null;

const EMPTY_BUTTONS = [];

/**
 * Call-to-action banner with heading, rich text, and action buttons.
 *
 * Supports the same color variant system as Hero (primary, secondary,
 * tertiary, quaternary) plus a `backgroundColor` prop for custom colors.
 *
 * @param {Object} props
 * @param {string} props.eyebrow - Optional short label above the headline
 * @param {string} props.headline - Banner heading text
 * @param {string} props.text - Body text (HTML supported, rendered via dangerouslySetInnerHTML)
 * @param {Array}  props.buttons - Array of button objects: { label, url, type }
 * @param {string} props.variant - Color variant: 'primary' (default), 'secondary', 'tertiary', 'quaternary'
 * @param {string} props.backgroundColor - Custom CSS background color (overrides variant)
 * @param {string} props.image - Optional image URL displayed alongside the text content
 * @param {string} props.imageAlt - Alt text for the image
 * @param {string} props.headlineSize - Font size token for headline (e.g. '600', '800'). Maps to `mg-u-font-size-{value}`
 * @param {number} props.headlineLevel - Semantic heading level (2–6). Controls the HTML element (h2, h3, etc.) independently of visual size
 * @param {string} props.padding - Custom CSS padding (overrides theme token)
 * @param {boolean} props.centered - Center-align content (default: true; auto-disabled when image is set)
 * @param {'stacked'|'inline'} props.layout - Content and action arrangement
 * @param {string} props.className - Additional CSS classes
 */
export function TextCta({
  eyebrow,
  headline,
  headlineSize = '600',
  headlineLevel = 2,
  text,
  buttons = EMPTY_BUTTONS,
  variant = 'primary',
  tone = 'strong',
  backgroundColor,
  padding,
  image,
  imageAlt = '',
  centered = true,
  layout = 'stacked',
  className,
  children,
}) {
  const hasImage = !!image;
  const inlineActions = layout === 'inline' && children == null;
  const headlineId = useId();
  const HeadingTag = `h${headlineLevel}`;

  return (
    <section
      className={cls(
        'mg-cta',
        variant && `mg-cta--${variant}`,
        tone === 'soft' && 'mg-cta--soft',
        inlineActions && 'mg-cta--inline',
        hasImage && 'mg-cta--with-image',
        !hasImage && centered && layout !== 'inline' && 'mg-cta--centered',
        className
      )}
      {...(headline
        ? { 'aria-labelledby': headlineId }
        : { 'aria-label': 'Call to action' })}
      {...((backgroundColor || padding) && {
        style: {
          ...(backgroundColor && { '--mg-cta-bg': backgroundColor }),
          ...(padding && { padding }),
        },
      })}
    >
      <div className="mg-cta__inner mg-container">
        <div className="mg-cta__body">
          <div className="mg-cta__content">
            {eyebrow && <p className="mg-cta__eyebrow">{eyebrow}</p>}
            {headline && (
              <HeadingTag
                id={headlineId}
                className={cls(
                  'mg-cta__headline',
                  `mg-u-font-size-${headlineSize}`
                )}
              >
                {headline}
              </HeadingTag>
            )}

            {text && (
              <div
                className="mg-cta__text"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }}
              />
            )}
          </div>

          {children != null && (
            <div className="mg-cta__custom-content">{children}</div>
          )}

          {buttons.length > 0 && (
            <div className="mg-cta__actions">
              {buttons.map((btn, i) => (
                <CtaButton
                  key={i}
                  label={btn.label}
                  href={btn.url || '#'}
                  Type={btn.type}
                  Variant={btn.variant}
                  Outline={btn.outline}
                  target={btn.target}
                  rel={btn.rel}
                />
              ))}
            </div>
          )}
        </div>

        {hasImage && (
          <div className="mg-cta__image">
            <img src={image} alt={imageAlt} />
          </div>
        )}
      </div>
    </section>
  );
}

TextCta.propTypes = {
  /** Composed content, such as a form. Rendered after copy and before buttons. */
  children: PropTypes.node,
  /** Strong colour surface or pale accent surface with dark text. */
  tone: PropTypes.oneOf(['strong', 'soft']),
  /** Optional short label above the headline */
  eyebrow: PropTypes.string,
  /** Banner heading text */
  headline: PropTypes.string,
  /** Font size token for headline (e.g. '600', '800'). Maps to `mg-u-font-size-{value}` */
  headlineSize: PropTypes.string,
  /** Semantic heading level (2–6). Controls the HTML element independently of visual size */
  headlineLevel: PropTypes.oneOf([2, 3, 4, 5, 6]),
  /** Body text (HTML supported, sanitized via DOMPurify) */
  text: PropTypes.string,
  /** Array of button objects: { label, url, type } */
  buttons: PropTypes.arrayOf(
    PropTypes.shape({
      /** Button text */
      label: PropTypes.string.isRequired,
      /** Button link URL */
      url: PropTypes.string,
      /** Button style: 'Primary' or 'Secondary' */
      type: PropTypes.oneOf(['Primary', 'Secondary']),
      /** Button treatment: conventional or editorial CTA */
      variant: PropTypes.oneOf(['Default', 'CTA']),
      /** Use the transparent outlined treatment */
      outline: PropTypes.bool,
      /** Link browsing context */
      target: PropTypes.string,
      /** Link relationship tokens */
      rel: PropTypes.string,
    })
  ),
  /** Color variant: 'primary', 'secondary', 'tertiary', 'quaternary' */
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'quaternary']),
  /** Custom CSS background color (overrides variant) */
  backgroundColor: PropTypes.string,
  /** Custom CSS padding (overrides theme token) */
  padding: PropTypes.string,
  /** Image URL displayed alongside text (triggers side-by-side layout) */
  image: PropTypes.string,
  /** Alt text for the image */
  imageAlt: PropTypes.string,
  /** Center-align content (auto-disabled when image is set) */
  centered: PropTypes.bool,
  /** Content and action arrangement */
  layout: PropTypes.oneOf(['stacked', 'inline']),
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default TextCta;
