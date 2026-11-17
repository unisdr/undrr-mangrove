import React from 'react';
import PropTypes from 'prop-types';
import { CONTENT_FAMILY_IDS } from '../Content/contentFamilies';
import { ContentPattern } from '../Content/_shared/ContentPattern';

const dateType = PropTypes.shape({
  dateTime: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  label: PropTypes.string,
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
/** Shared card renderer; archetype/profile specifications select content. */
export function ContentCard({
  content,
  headingLevel = 3,
  className,
  layout = 'vertical',
}) {
  if (!['vertical', 'book'].includes(layout))
    throw new TypeError('ContentCard requires a vertical or book layout.');
  return (
    <ContentPattern
      content={content}
      headingLevel={headingLevel}
      className={className}
      presentation="card"
      layout={layout}
    />
  );
}

ContentCard.propTypes = {
  /** Normalized content; all visible strings are caller-localized plain text. Labels may have resolved links. */
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
      kind: PropTypes.oneOf(['photo', 'cover', 'logo']),
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
    resourceType: PropTypes.oneOfType([
      labelType,
      PropTypes.arrayOf(labelType),
    ]),
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
    deadline: dateType,
    freshness: PropTypes.shape({
      kind: PropTypes.oneOf(['updated', 'created']).isRequired,
      date: dateType.isRequired,
    }),
    classification: PropTypes.arrayOf(labelType),
    topics: PropTypes.arrayOf(labelType),
    session: PropTypes.shape({
      bucket: PropTypes.string,
      types: PropTypes.arrayOf(labelType),
      schedule: PropTypes.arrayOf(rangeType),
      exhibitions: PropTypes.arrayOf(rangeType),
      room: PropTypes.string,
      format: PropTypes.string,
    }),
    language: PropTypes.string,
    lang: PropTypes.string,
    dir: PropTypes.oneOf(['ltr', 'rtl', 'auto']),
  }).isRequired,
  /** Heading depth in the containing page (2–6). */
  headingLevel: PropTypes.oneOf([2, 3, 4, 5, 6]),
  className: PropTypes.string,
  /** Geometry only: content selection stays owned by the card projection. */
  layout: PropTypes.oneOf(['vertical', 'book']),
};
