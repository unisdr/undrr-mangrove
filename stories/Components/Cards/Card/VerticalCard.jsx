import React from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { CtaButton } from '../../Buttons/CtaButton/CtaButton';
import { CardLabel, CardTitle, resolveCardLink } from './cardParts';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

export function VerticalCard({ data, variant = 'primary', className }) {
  const variantClass =
    variant && variant !== 'primary' ? `mg-card--${variant}` : null;
  return (
    <>
      {data.map((item, index) => {
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
            {item.imgback && (
              <div className="mg-card__visual">
                <img
                  src={item.imgback}
                  alt={item.imgalt}
                  className="mg-card__image"
                />
              </div>
            )}

            <div className="mg-card__content">
              {(item.label1 || item.label2) && (
                <div className="mg-card__meta">
                  <CardLabel label={item.label1} link={link} />
                  <CardLabel label={item.label2} link={link} />
                </div>
              )}

              <CardTitle
                title={item.title}
                link={link}
                target={item.target}
                rel={item.rel}
              />
              {item.summaryText && (
                // eslint-disable-next-line react/no-danger -- sanitized HTML contract; DOMPurify sanitizes caller input
                <p
                  className="mg-card__summary"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(item.summaryText),
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
  data: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      link: PropTypes.string,
      target: PropTypes.string,
      rel: PropTypes.string,
      imgback: PropTypes.string,
      imgalt: PropTypes.string,
      summaryText: PropTypes.string,
      label1: PropTypes.string,
      label2: PropTypes.string,
      button: PropTypes.string,
      /** CTA destination. Defaults to `link`; set it to give an unlinked card a button. */
      buttonLink: PropTypes.string,
    })
  ).isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'quaternary']),
  className: PropTypes.string,
};
