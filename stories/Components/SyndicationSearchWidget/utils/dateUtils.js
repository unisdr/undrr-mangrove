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
 * Numbers and numeric strings are epoch seconds (or milliseconds from 1e12
 * up); zero, negative values and other types are not dates. A bare
 * four-digit string is a year, not epoch seconds.
 *
 * @param {number|string|Array|null|undefined} value - Seconds, milliseconds
 *   or an ISO string, optionally wrapped in an array
 * @returns {Date|null} The date, or null when the value is not a usable date
 */
export function toDate(value) {
  const raw = [].concat(value ?? [])[0];
  let date;
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw <= 0) return null;
    date = new Date(raw < 1e12 ? raw * 1000 : raw);
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') return null;
    if (/^\d{4}$/.test(trimmed)) {
      date = new Date(`${trimmed}-01-01T00:00:00Z`);
    } else if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return toDate(Number(trimmed));
    } else {
      date = new Date(trimmed);
    }
  } else {
    return null;
  }
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Machine-readable value for a `<time datetime>` attribute: `YYYY-MM-DD` for
 * date-only values, a full ISO string otherwise. Search API indexes a
 * date-only value at 12:00 UTC (`DateTimePlus::setDefaultDateTime()`);
 * midnight UTC is treated as date-only too.
 *
 * @param {Date} date
 * @returns {string}
 */
export function toDateTimeAttribute(date) {
  const iso = date.toISOString();
  return iso.endsWith('T00:00:00.000Z') || iso.endsWith('T12:00:00.000Z')
    ? iso.slice(0, 10)
    : iso;
}

const isSameUtcDay = (a, b) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

/** One formatter per locale, shared by every result. */
const formatters = new Map();
function getEventFormatter(locale) {
  if (!formatters.has(locale)) {
    formatters.set(
      locale,
      new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    );
  }
  return formatters.get(locale);
}

/**
 * Format an event's dates for display: the start date, or a "start – end"
 * range when the end falls on a different day.
 *
 * Event dates are formatted in UTC: date-only events are indexed at 12:00
 * UTC, so the UTC calendar day is the one the editor entered, which a local
 * time zone far enough from UTC would shift.
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
  const formatter = getEventFormatter(locale);

  let text = formatter.format(start);
  if (end && end > start && !isSameUtcDay(start, end)) {
    text =
      typeof formatter.formatRange === 'function'
        ? formatter.formatRange(start, end)
        : `${text} – ${formatter.format(end)}`;
  }

  return { text, dateTime: toDateTimeAttribute(start) };
}
