import React from 'react';
import PropTypes from 'prop-types';
import { resolveCardLink } from '../../Components/Cards/Card/cardParts';

const TYPES = ['news', 'publication', 'resource', 'event'];

// Sources resolve destinations before rendering. Never infer a domain from an
// array order here. Relative paths must be root-relative on the consuming site.
export function resolveTeaserUrl(value) {
  const url = resolveCardLink(value)?.trim();
  if (
    !url ||
    [...url].some(
      character => character.charCodeAt(0) <= 32 || character === '\\'
    ) ||
    !/^(https?:\/\/|\/(?!\/))/i.test(url)
  )
    return null;
  try {
    const parsed = new URL(url, 'https://mangrove.invalid');
    return ['https:', 'http:'].includes(parsed.protocol) ? url : null;
  } catch {
    return null;
  }
}

function TeaserDate({ value }) {
  return value ? <time dateTime={value.dateTime}>{value.text}</time> : null;
}

const dateType = PropTypes.shape({
  dateTime: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
});
TeaserDate.propTypes = { value: dateType };

/**
 * Experimental content pattern for a single news, publication, resource or
 * event teaser. Reuses card geometry and interaction classes, with plain-text
 * content and native links that also work in server-rendered HTML.
 */
export function ContentTeaser({ content, headingLevel = 3, className }) {
  const {
    type,
    title,
    shortTitle,
    link,
    image,
    summary,
    labels,
    typeLabel,
    published,
    event,
    resourceType,
    source,
    language,
    lang,
  } = content;
  const href = resolveTeaserUrl(link);
  if (!TYPES.includes(type) || !title?.trim() || !href) {
    throw new TypeError(
      'ContentTeaser requires a supported type, title and resolved HTTP(S) or root-relative link.'
    );
  }
  if (![2, 3, 4, 5, 6].includes(headingLevel)) {
    throw new TypeError('ContentTeaser headingLevel must be between 2 and 6.');
  }
  const Heading = `h${headingLevel}`;
  const imageSrc = resolveTeaserUrl(image?.src);
  const labelItems = [
    ...new Set([typeLabel, ...(labels || [])].filter(Boolean)),
  ];
  return (
    <article
      lang={lang}
      className={[
        'mg-card',
        'mg-card__vc',
        'mg-content-teaser',
        type === 'publication' && 'mg-card__book',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {imageSrc && (
        <div className="mg-card__visual">
          <img
            src={imageSrc}
            alt={image.alt ?? ''}
            className="mg-card__image"
            loading="lazy"
          />
        </div>
      )}
      <div className="mg-card__content">
        {labelItems.length > 0 && (
          <div className="mg-card__meta">
            {labelItems.map(label => (
              <span className="mg-card__label" key={label}>
                {label}
              </span>
            ))}
          </div>
        )}
        <Heading className="mg-card__title">
          <a href={href}>{shortTitle?.trim() || title}</a>
        </Heading>
        {type === 'event' && event?.start && (
          <p className="mg-content-teaser__metadata">
            <TeaserDate value={event.start} />
            {event.end && (
              <>
                {' '}
                – <TeaserDate value={event.end} />
              </>
            )}
            {event.timeZone && <> ({event.timeZone})</>}
          </p>
        )}
        {type !== 'event' && published && (
          <p className="mg-content-teaser__metadata">
            <TeaserDate value={published} />
          </p>
        )}
        {type === 'event' && event?.location && (
          <p className="mg-content-teaser__metadata">{event.location}</p>
        )}
        {type === 'resource' && resourceType && (
          <p className="mg-content-teaser__metadata">{resourceType}</p>
        )}
        {summary && <p className="mg-card__summary">{summary}</p>}
        {(source || language) && (
          <p className="mg-content-teaser__metadata">
            {[source, language].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </article>
  );
}

ContentTeaser.propTypes = {
  /** Normalised source-neutral content; all visible strings are caller-localised plain text. */
  content: PropTypes.shape({
    type: PropTypes.oneOf(TYPES).isRequired,
    title: PropTypes.string.isRequired,
    shortTitle: PropTypes.string,
    link: PropTypes.string.isRequired,
    image: PropTypes.shape({
      src: PropTypes.string.isRequired,
      alt: PropTypes.string.isRequired,
    }),
    summary: PropTypes.string,
    labels: PropTypes.arrayOf(PropTypes.string),
    typeLabel: PropTypes.string,
    published: dateType,
    event: PropTypes.shape({
      start: dateType,
      end: dateType,
      timeZone: PropTypes.string,
      location: PropTypes.string,
    }),
    resourceType: PropTypes.string,
    source: PropTypes.string,
    language: PropTypes.string,
    lang: PropTypes.string,
  }).isRequired,
  /** Heading depth in the containing page (2–6). */
  headingLevel: PropTypes.oneOf([2, 3, 4, 5, 6]),
  className: PropTypes.string,
};
