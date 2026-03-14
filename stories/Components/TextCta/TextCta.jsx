import React from 'react';
// import './textcta.scss';

const cls = (...classes) => classes.filter(Boolean).join(' ') || null;

/**
 * Call-to-action banner with heading, rich text, and action buttons.
 *
 * Supports the same color variant system as Hero (primary, secondary,
 * tertiary, quaternary) plus a `backgroundColor` prop for custom colors.
 *
 * @param {Object} props
 * @param {string} props.headline - Banner heading text
 * @param {string} props.text - Body text (HTML supported, rendered via dangerouslySetInnerHTML)
 * @param {Array}  props.buttons - Array of button objects: { label, url, type }
 * @param {string} props.variant - Color variant: 'primary' (default), 'secondary', 'tertiary', 'quaternary'
 * @param {string} props.backgroundColor - Custom CSS background color (overrides variant)
 * @param {string} props.image - Optional image URL displayed alongside the text content
 * @param {string} props.imageAlt - Alt text for the image
 * @param {string} props.headlineSize - Font size token for headline (e.g. '600', '800'). Maps to `mg-u-font-size-{value}`
 * @param {string} props.padding - Custom CSS padding (overrides theme token)
 * @param {boolean} props.centered - Center-align content (default: true; auto-disabled when image is set)
 * @param {string} props.className - Additional CSS classes
 */
export function TextCta({
  headline,
  headlineSize = '600',
  text,
  buttons = [],
  variant = 'primary',
  backgroundColor,
  padding,
  image,
  imageAlt = '',
  centered = true,
  className,
}) {
  const hasImage = !!image;

  return (
    <section
      className={cls(
        'mg-cta',
        variant && `mg-cta--${variant}`,
        hasImage && 'mg-cta--with-image',
        !hasImage && centered && 'mg-cta--centered',
        className
      )}
      {...((backgroundColor || padding) && {
        style: {
          ...(backgroundColor && { '--mg-cta-bg': backgroundColor }),
          ...(padding && { padding }),
        },
      })}
    >
      <div className="mg-cta__inner mg-container">
        <div className="mg-cta__body">
          {headline && (
            <header className={cls('mg-cta__headline', `mg-u-font-size-${headlineSize}`)}>
              {headline}
            </header>
          )}

          {text && (
            <div
              className="mg-cta__text"
              dangerouslySetInnerHTML={{ __html: text }}
            />
          )}

          {buttons.length > 0 && (
            <div className="mg-cta__actions">
              {buttons.map((btn, i) => (
                <a
                  key={i}
                  href={btn.url || '#'}
                  className={cls(
                    'mg-button',
                    btn.type === 'Secondary'
                      ? 'mg-button-secondary'
                      : 'mg-button-primary'
                  )}
                >
                  {btn.label}
                </a>
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
