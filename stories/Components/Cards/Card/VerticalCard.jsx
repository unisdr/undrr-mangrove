import React from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { CtaButton } from '../../Buttons/CtaButton/CtaButton';
import { CardLabel, CardTitle, resolveCardLink } from './cardParts';
const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

// Content contract: see schemas/card.schema.js for canonical field names and documented deviations.
export function VerticalCard({ items, variant = 'primary', className }) {
  const variantClass =
    variant && variant !== 'primary' ? `mg-card--${variant}` : null;
  return (
    <>
      {items.map((item, index) => {
        const link = resolveCardLink(item.link);
        const buttonLink = resolveCardLink(item.buttonLink) ?? link;
        return (
          <article
            key={index}
            className={cls(
              'mg-card',
              'mg-card__vc',
              variantClass,
              !link && 'mg-card--no-link',
              className
            )}
          >
            {item.image?.src && (
              <div className="mg-card__visual">
                <img
                  src={item.image?.src}
                  alt={item.image?.alt}
                  className="mg-card__image"
                />
              </div>
            )}

            <div className="mg-card__content">
              {(item.labels?.[0] || item.labels?.[1]) && (
                <div className="mg-card__meta">
                  <CardLabel label={item.labels?.[0]} link={link} />
                  <CardLabel label={item.labels?.[1]} link={link} />
                </div>
              )}

              <CardTitle
                title={item.title}
                link={link}
                target={item.target}
                rel={item.rel}
              />
              {item.summary && (
                <p
                  className="mg-card__summary"
                  // eslint-disable-next-line react/no-danger -- sanitized HTML contract; DOMPurify sanitizes caller input
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(item.summary),
                  }}
                />
              )}
              {item.button && buttonLink && (
                <CtaButton
                  Type="Primary"
                  Variant="CTA"
                  label={item.button}
                  href={buttonLink}
                  target={item.target}
                  rel={item.rel}
                />
              )}
            </div>
          </article>
        );
      })}
    </>
  );
}
VerticalCard.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      link: PropTypes.string,
      target: PropTypes.string,
      rel: PropTypes.string,
      image: PropTypes.shape({
        src: PropTypes.string,
        alt: PropTypes.string,
      }),
      summary: PropTypes.string,
      labels: PropTypes.arrayOf(PropTypes.string),
      button: PropTypes.string,
      /** CTA destination. Defaults to `link`; set it to give an unlinked card a button. */
      buttonLink: PropTypes.string,
    })
  ).isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'quaternary']),
  className: PropTypes.string,
};
