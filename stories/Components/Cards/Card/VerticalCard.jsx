import React from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { CtaButton } from '../../Buttons/CtaButton/CtaButton';
import { CardLabel, CardTitle, resolveCardLink } from './cardParts';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

/**
 * @typedef {object} VerticalCardItem
 * @property {string} title Card title.
 * @property {string} [link] Card title link.
 * @property {string} [target] Target for the link.
 * @property {string} [rel] Relationship for the link.
 * @property {string} [imgback] Image URL.
 * @property {string} [imgalt] Alternative text for the image.
 * @property {string} [summaryText] Summary, which can include HTML.
 * @property {string} [label1] First label.
 * @property {string} [label2] Second label.
 * @property {string} [button] Call to action label.
 * @property {string} [buttonLink] Call to action destination. Defaults to link.
 */

/**
 * A vertical card with optional media and a call to action.
 *
 * @param {Object} props
 * @param {VerticalCardItem[]} props.data Card data.
 * @param {'primary'|'secondary'|'tertiary'|'quaternary'} [props.variant='primary'] Visual variant.
 * @param {string} [props.className] Additional CSS classes.
 */
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
                <p
                  className="mg-card__summary"
                  // eslint-disable-next-line react/no-danger -- sanitized HTML contract; DOMPurify sanitizes caller input
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
