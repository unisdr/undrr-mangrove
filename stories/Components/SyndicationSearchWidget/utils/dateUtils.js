/**
 * @file dateUtils.js
 * @description Date helpers for values read from the search index.
 *
 * Search API dates (`published_at`, `event_start`, `event_end`) arrive in
 * `_source` as Unix seconds, usually wrapped in an array (`[1762955302]`).
 * Milliseconds and ISO strings are accepted too, so fixtures and other
 * endpoints keep working.
 *
 * @module SearchWidget/utils/dateUtils
 */

/** Content types whose results show their event date instead of the publish date. */
export const EVENT_TYPES = ['event', 'conference_event'];

/**
 * Normalise an index date value to a Date.
 *
 * @param {number|string|Array|null|undefined} value - Seconds, milliseconds
 *   or an ISO string, optionally wrapped in an array
 * @returns {Date|null} The date, or null when the value is not a usable date
 */
export function toDate(value) {
  const raw = [].concat(value ?? [])[0];
  if (raw === undefined || raw === null || raw === '') return null;
  const numeric = typeof raw === 'number' ? raw : Number(raw);
  let date;
  if (Number.isFinite(numeric)) {
    date = new Date(numeric < 1e12 ? numeric * 1000 : numeric);
  } else {
    date = new Date(raw);
  }
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Machine-readable value for a `<time datetime>` attribute: `YYYY-MM-DD` for
 * date-only values (midnight UTC), a full ISO string otherwise.
 *
 * @param {Date} date
 * @returns {string}
 */
export function toDateTimeAttribute(date) {
  const iso = date.toISOString();
  return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso;
}

const isSameUtcDay = (a, b) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

/**
 * Format an event's dates for display: the start date, or a "start – end"
 * range when the end falls on a different day.
 *
 * Event dates are formatted in UTC: date-only events are indexed as midnight
 * UTC, and a local time zone west of UTC would show them a day early.
 *
 * @param {*} startValue - `event_start` from `_source`
 * @param {*} endValue - `event_end` from `_source`
 * @param {string} [locale='en-US'] - Locale for the formatted text
 * @returns {{ text: string, dateTime: string }|null} Display text and the
 *   start date's `datetime` value, or null without a usable start date
 */
export function formatEventDate(startValue, endValue, locale = 'en-US') {
  const start = toDate(startValue);
  if (!start) return null;
  const end = toDate(endValue);
  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

  let text = formatter.format(start);
  if (end && end > start && !isSameUtcDay(start, end)) {
    text =
      typeof formatter.formatRange === 'function'
        ? formatter.formatRange(start, end)
        : `${text} – ${formatter.format(end)}`;
  }

  return { text, dateTime: toDateTimeAttribute(start) };
}
