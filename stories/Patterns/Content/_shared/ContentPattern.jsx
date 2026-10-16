import React from 'react';
import PropTypes from 'prop-types';
import { resolveCardLink } from '../../../Components/Cards/Card/cardParts';
import {
  CONTENT_FIELDS,
  resolveContentPresentation,
} from '../contentPresentations';

// Sources resolve destinations before rendering, including current-site eligibility.
export function resolveContentUrl(value) {
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
      const key = JSON.stringify([value.label, resolveContentUrl(value.link)]);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function TeaserDate({ value }) {
  return (
    <span>
      {value.label && <>{value.label} </>}
      <time dateTime={value.dateTime} dir="auto">
        {value.text}
      </time>
    </span>
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
    <span className="mg-content-meta__group">
      {items.map((item, index) => {
        const link = resolveContentUrl(item.link);
        return (
          <React.Fragment key={JSON.stringify([item.label, link])}>
            {index > 0 && ' '}
            {link ? (
              <a
                href={link}
                className={[
                  compact && 'mg-card__label',
                  'mg-content-meta__metadata-link',
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
    <ul className="mg-content-meta__attribution">
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
    return normaliseLabels([content.typeLabel, ...(content.labels || [])]);
  }
  if (field === 'location') {
    return normaliseLabels([content.location]);
  }
  if (field === 'resourceType') return normaliseLabels([content.resourceType]);
  if (field === 'eventLocation')
    return normaliseLabels([content.event?.location]);
  if (field === 'organizationLabels')
    return normaliseLabels([content.organizationType]);
  if (field === 'sessionBucket')
    return normaliseLabels([content.session?.bucket]);
  if (field === 'sessionTypes')
    return normaliseLabels(content.session?.types || []);
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
  if (!CONTENT_FIELDS.includes(field))
    throw new TypeError('Unknown content presentation field.');
  return text(content[field]);
}

function TeaserField({ field, value }) {
  if (
    [
      'labels',
      'resourceType',
      'eventLocation',
      'organizationLabels',
      'sessionBucket',
      'sessionTypes',
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
        compact={[
          'labels',
          'resourceType',
          'organizationLabels',
          'sessionBucket',
          'sessionTypes',
          'classification',
          'topics',
        ].includes(field)}
      />
    );
  if (field === 'published' || field === 'deadline')
    return <TeaserDate value={value} />;
  if (field === 'event') return <TeaserRange value={value} />;
  if (field === 'schedule' || field === 'exhibitions')
    return (
      <span className="mg-content-meta__group">
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

function validateDateRoles(fields, rendererName) {
  const requireLabel = (date, path) => {
    if (!text(date?.label))
      throw new TypeError(
        `${rendererName} requires a caller-localized ${path}.label to identify the date's meaning.`
      );
  };
  const selected = Object.fromEntries(
    fields.map(({ field, value }) => [field, value])
  );
  if (selected.deadline) requireLabel(selected.deadline, 'deadline');
  if (selected.freshness)
    requireLabel(selected.freshness.date, 'freshness.date');
  if (selected.exhibitions?.length) {
    selected.exhibitions.forEach(range =>
      requireLabel(range, 'session.exhibitions[]')
    );
    selected.schedule?.forEach(range =>
      requireLabel(range, 'session.schedule[]')
    );
  }
}

/**
 * Internal renderer for distinct teaser and card projections. Shared card geometry, native links and server-renderable content;
 * source adapters supply localized metadata, attribution and resolved URLs.
 */
export function ContentPattern({
  content,
  headingLevel = 3,
  className,
  presentation,
  layout,
}) {
  const rendererName =
    presentation === 'card' ? 'ContentCard' : 'ContentTeaser';
  const { type, profile, title, shortTitle, link, image, lang, dir } = content;
  const resolved = resolveContentPresentation(type, profile, presentation);
  const pattern = resolved?.fields;
  const href = resolveContentUrl(link);
  if (!pattern || !title?.trim() || !href)
    throw new TypeError(
      `${rendererName} requires a supported type/profile, title and resolved HTTP(S) or root-relative link.`
    );
  if (![2, 3, 4, 5, 6].includes(headingLevel))
    throw new TypeError(
      `${rendererName} headingLevel must be between 2 and 6.`
    );

  const Heading = `h${headingLevel}`;
  const media =
    pattern.media === 'none'
      ? 'none'
      : ['photo', 'cover', 'logo'].includes(image?.kind)
        ? image.kind
        : pattern.media;
  const imageSrc = media !== 'none' ? resolveContentUrl(image?.src) : null;
  const before = selectedFields(content, pattern.before);
  const after = selectedFields(content, pattern.after);
  validateDateRoles([...before, ...after], rendererName);
  return (
    <article
      lang={lang}
      dir={dir || (lang ? 'auto' : undefined)}
      data-content-type={type}
      data-content-profile={resolved.profile}
      data-content-presentation={presentation}
      data-content-layout={layout}
      data-content-media={media}
      className={[
        'mg-card',
        presentation === 'teaser'
          ? 'mg-card__hc mg-card-book__hc mg-content-teaser'
          : 'mg-card__vc mg-content-card',
        presentation === 'card' && `mg-content-card--${layout}`,
        presentation === 'card' && media === 'cover' && 'mg-card__book',
        media === 'logo' && 'mg-content-pattern--logo',
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
          <div className="mg-card__meta mg-content-meta__before-title">
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
                  : 'mg-content-meta__metadata'
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

ContentPattern.propTypes = {
  content: PropTypes.object.isRequired,
  headingLevel: PropTypes.oneOf([2, 3, 4, 5, 6]),
  className: PropTypes.string,
  presentation: PropTypes.oneOf(['teaser', 'card']).isRequired,
  layout: PropTypes.oneOf(['horizontal', 'vertical', 'book']).isRequired,
};
