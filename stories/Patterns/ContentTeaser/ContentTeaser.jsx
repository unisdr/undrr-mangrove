import React from 'react';
import PropTypes from 'prop-types';
import { resolveCardLink } from '../../Components/Cards/Card/cardParts';
import { CONTENT_FAMILY_IDS } from '../Content/contentFamilies';
import { resolveTeaserPattern } from './contentTeaserPatterns';
export {
  DRUPAL_CONTENT_PATTERNS,
  DRUPAL_TEASER_TYPES,
} from '../../Integrations/Drupal/contentPatterns';

// Sources resolve destinations before rendering, including current-site eligibility.
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

const dateType = PropTypes.shape({
  dateTime: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  label: PropTypes.string,
});
const labelledDateType = PropTypes.shape({
  dateTime: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
});
const textValuesType = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.arrayOf(PropTypes.string),
]);
const labelType = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({
    label: PropTypes.string.isRequired,
    link: PropTypes.string,
  }),
]);
const rangeType = PropTypes.shape({
  start: dateType,
  end: dateType,
  timeZone: PropTypes.string,
  label: PropTypes.string,
});
const labelledRangeType = PropTypes.shape({
  start: dateType,
  end: dateType,
  timeZone: PropTypes.string,
  label: PropTypes.string.isRequired,
});
const validDate = date => Boolean(date?.dateTime && date?.text?.trim());
const validRange = range => validDate(range?.start);
const text = value =>
  typeof value === 'string' && value.trim() ? value : null;

function normaliseLabels(values) {
  const seen = new Set();
  return values
    .flat()
    .filter(Boolean)
    .map(value => (typeof value === 'string' ? { label: value } : value))
    .filter(value => {
      if (!text(value.label)) return false;
      const key = JSON.stringify([value.label, resolveTeaserUrl(value.link)]);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function TeaserDate({ value }) {
  return (
    <>
      {value.label && <>{value.label} </>}
      <time dateTime={value.dateTime} dir="auto">
        {value.text}
      </time>
    </>
  );
}
TeaserDate.propTypes = { value: dateType.isRequired };

function TeaserRange({ value }) {
  return (
    <span>
      {value.label && <>{value.label} </>}
      <TeaserDate value={value.start} />
      {validDate(value.end) && (
        <>
          {' '}
          – <TeaserDate value={value.end} />
        </>
      )}
      {value.timeZone && <> ({value.timeZone})</>}
    </span>
  );
}
TeaserRange.propTypes = { value: rangeType.isRequired };

function TeaserLabels({ items, compact = true }) {
  return (
    <span className="mg-content-teaser__group">
      {items.map((item, index) => {
        const link = resolveTeaserUrl(item.link);
        return (
          <React.Fragment key={JSON.stringify([item.label, link])}>
            {index > 0 && ' '}
            {link ? (
              <a
                href={link}
                className={[
                  compact && 'mg-card__label',
                  'mg-content-teaser__metadata-link',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {item.label}
              </a>
            ) : (
              <span className={compact ? 'mg-card__label' : undefined}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </span>
  );
}
TeaserLabels.propTypes = {
  compact: PropTypes.bool,
  items: PropTypes.arrayOf(labelType).isRequired,
};

function TeaserAttribution({ items }) {
  return (
    <ul className="mg-content-teaser__attribution">
      {items.map((item, index) => (
        <React.Fragment key={item}>
          {index > 0 && ' '}
          <li>{item}</li>
        </React.Fragment>
      ))}
    </ul>
  );
}
TeaserAttribution.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
};

function fieldValue(content, field) {
  if (field === 'labels') {
    return normaliseLabels([
      content.typeLabel,
      content.type === 'resource' && content.resourceType,
      ...(content.labels || []),
    ]);
  }
  if (field === 'location') {
    return normaliseLabels([
      content.type === 'event' ? content.event?.location : content.location,
    ]);
  }
  if (field === 'organizationType' || field === 'status')
    return normaliseLabels([content[field]]);
  if (field === 'classification' || field === 'topics')
    return normaliseLabels(content[field] || []);
  if (field === 'published' || field === 'deadline')
    return validDate(content[field]) ? content[field] : null;
  if (field === 'event')
    return validRange(content.event) ? content.event : null;
  if (field === 'schedule' || field === 'exhibitions')
    return (content.session?.[field] || []).filter(validRange);
  if (['bucket', 'room', 'format'].includes(field))
    return text(content.session?.[field]);
  if (field === 'freshness') {
    return ['updated', 'created'].includes(content.freshness?.kind) &&
      validDate(content.freshness?.date)
      ? content.freshness
      : null;
  }
  if (field === 'sources' || field === 'authors') {
    const values =
      content[field] ??
      (field === 'sources' && content.source ? [content.source] : []);
    return [...new Set(values.filter(value => text(value)))];
  }
  return text(content[field]);
}

function TeaserField({ field, value }) {
  if (
    [
      'labels',
      'location',
      'classification',
      'topics',
      'organizationType',
      'status',
    ].includes(field)
  )
    return (
      <TeaserLabels
        items={value}
        compact={['labels', 'classification', 'topics'].includes(field)}
      />
    );
  if (field === 'published' || field === 'deadline')
    return <TeaserDate value={value} />;
  if (field === 'event') return <TeaserRange value={value} />;
  if (field === 'schedule' || field === 'exhibitions')
    return (
      <span className="mg-content-teaser__group">
        {value.map((range, index) => (
          <React.Fragment key={JSON.stringify(range)}>
            {index > 0 && ' '}
            <TeaserRange value={range} />
          </React.Fragment>
        ))}
      </span>
    );
  if (field === 'freshness')
    return (
      <span data-freshness-kind={value.kind}>
        <TeaserDate value={value.date} />
      </span>
    );
  if (field === 'sources' || field === 'authors')
    return <TeaserAttribution items={value} />;
  return <span>{value}</span>;
}
TeaserField.propTypes = {
  field: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired,
};

function selectedFields(content, fields) {
  return fields
    .map(field => ({ field, value: fieldValue(content, field) }))
    .filter(({ value }) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value)
    );
}

function validateDateRoles(content) {
  const requireLabel = (date, path) => {
    if (!text(date?.label))
      throw new TypeError(
        `ContentTeaser requires a caller-localised ${path}.label to identify the date's meaning.`
      );
  };
  if (content.type === 'opportunity' && validDate(content.deadline))
    requireLabel(content.deadline, 'deadline');
  if (content.type === 'collection' && validDate(content.freshness?.date))
    requireLabel(content.freshness.date, 'freshness.date');
  if (content.type === 'event' && content.profile === 'programme-session') {
    const exhibitions = (content.session?.exhibitions || []).filter(validRange);
    if (exhibitions.length) {
      exhibitions.forEach(range =>
        requireLabel(range, 'session.exhibitions[]')
      );
      (content.session?.schedule || [])
        .filter(validRange)
        .forEach(range => requireLabel(range, 'session.schedule[]'));
    }
  }
}

/**
 * Experimental horizontal content teasers selected by archetype and editorial
 * profile. Shared card geometry, native links and server-renderable content;
 * source adapters supply localised metadata, attribution and resolved URLs.
 */
export function ContentTeaser({ content, headingLevel = 3, className }) {
  const { type, profile, title, shortTitle, link, image, lang } = content;
  const pattern = resolveTeaserPattern(type, profile);
  const href = resolveTeaserUrl(link);
  if (!pattern || !title?.trim() || !href)
    throw new TypeError(
      'ContentTeaser requires a supported type/profile, title and resolved HTTP(S) or root-relative link.'
    );
  if (![2, 3, 4, 5, 6].includes(headingLevel))
    throw new TypeError('ContentTeaser headingLevel must be between 2 and 6.');
  validateDateRoles(content);
  const Heading = `h${headingLevel}`;
  const imageSrc = pattern.image ? resolveTeaserUrl(image?.src) : null;
  const before = selectedFields(content, pattern.before);
  const after = selectedFields(content, pattern.after);
  return (
    <article
      lang={lang}
      data-content-type={type}
      data-content-profile={profile}
      className={[
        'mg-card',
        'mg-card__hc',
        'mg-card-book__hc',
        'mg-content-teaser',
        pattern.logo && 'mg-content-teaser--logo',
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
        {before.length > 0 && (
          <div className="mg-card__meta mg-content-teaser__before-title">
            {before.map(({ field, value }, index) => (
              <React.Fragment key={field}>
                {index > 0 && ' '}
                <TeaserField field={field} value={value} />
              </React.Fragment>
            ))}
          </div>
        )}
        <Heading className="mg-card__title">
          <a href={href}>
            {(pattern.useShortTitle && shortTitle?.trim()) || title}
          </a>
        </Heading>
        {after.map(({ field, value }) =>
          ['sources', 'authors'].includes(field) ? (
            <TeaserField key={field} field={field} value={value} />
          ) : (
            <p
              key={field}
              className={
                field === 'summary'
                  ? 'mg-card__summary'
                  : 'mg-content-teaser__metadata'
              }
            >
              <TeaserField field={field} value={value} />
            </p>
          )
        )}
      </div>
    </article>
  );
}

ContentTeaser.propTypes = {
  /** Normalised content; all visible strings are caller-localised plain text. Labels may have resolved links. */
  content: PropTypes.shape({
    type: PropTypes.oneOf(CONTENT_FAMILY_IDS).isRequired,
    /** Editorial profile within the archetype; omitted selects its documented default. */
    profile: PropTypes.string,
    title: PropTypes.string.isRequired,
    shortTitle: PropTypes.string,
    link: PropTypes.string.isRequired,
    image: PropTypes.shape({
      src: PropTypes.string.isRequired,
      alt: PropTypes.string.isRequired,
    }),
    summary: PropTypes.string,
    labels: PropTypes.arrayOf(labelType),
    typeLabel: PropTypes.string,
    published: dateType,
    event: PropTypes.shape({
      start: dateType,
      end: dateType,
      timeZone: PropTypes.string,
      location: PropTypes.string,
      label: PropTypes.string,
    }),
    resourceType: PropTypes.string,
    location: PropTypes.oneOfType([labelType, PropTypes.arrayOf(labelType)]),
    delivery: PropTypes.string,
    identifier: PropTypes.string,
    sources: PropTypes.arrayOf(PropTypes.string),
    authors: PropTypes.arrayOf(PropTypes.string),
    /** Compatibility input for the first experimental draft; prefer sources. */
    source: PropTypes.string,
    organizationType: textValuesType,
    scope: PropTypes.string,
    status: textValuesType,
    deadline: labelledDateType,
    freshness: PropTypes.shape({
      kind: PropTypes.oneOf(['updated', 'created']).isRequired,
      date: labelledDateType.isRequired,
    }),
    classification: PropTypes.arrayOf(labelType),
    topics: PropTypes.arrayOf(labelType),
    session: PropTypes.shape({
      bucket: PropTypes.string,
      schedule: PropTypes.arrayOf(rangeType),
      exhibitions: PropTypes.arrayOf(labelledRangeType),
      room: PropTypes.string,
      format: PropTypes.string,
    }),
    language: PropTypes.string,
    lang: PropTypes.string,
  }).isRequired,
  /** Heading depth in the containing page (2–6). */
  headingLevel: PropTypes.oneOf([2, 3, 4, 5, 6]),
  className: PropTypes.string,
};
