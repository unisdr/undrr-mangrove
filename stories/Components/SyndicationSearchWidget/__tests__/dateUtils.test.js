/**
 * @file dateUtils.test.js
 * @description Reading index dates and formatting event dates.
 */

import {
  toDate,
  toDateTimeAttribute,
  formatEventDate,
} from '../utils/dateUtils';

describe('toDate', () => {
  it.each([
    [[1762948800], '2025-11-12T12:00:00.000Z'],
    [1762948800, '2025-11-12T12:00:00.000Z'],
    ['1762948800', '2025-11-12T12:00:00.000Z'],
    [1762948800000, '2025-11-12T12:00:00.000Z'],
    ['2025-11-12T12:00:00Z', '2025-11-12T12:00:00.000Z'],
    ['2024', '2024-01-01T00:00:00.000Z'],
  ])('reads %p', (value, iso) => {
    expect(toDate(value).toISOString()).toBe(iso);
  });

  it.each([
    [0],
    ['0'],
    [[0]],
    [-1],
    ['-1'],
    [true],
    [{}],
    [null],
    [undefined],
    [''],
    [[]],
    ['not a date'],
    [Number.NaN],
  ])('returns null for %p', value => {
    expect(toDate(value)).toBeNull();
  });
});

describe('toDateTimeAttribute', () => {
  it('writes date-only values (12:00 or 00:00 UTC) as YYYY-MM-DD', () => {
    expect(toDateTimeAttribute(new Date('2025-11-12T12:00:00Z'))).toBe(
      '2025-11-12'
    );
    expect(toDateTimeAttribute(new Date('2025-11-12T00:00:00Z'))).toBe(
      '2025-11-12'
    );
  });

  it('keeps a time of day', () => {
    expect(toDateTimeAttribute(new Date('2025-11-12T09:30:00Z'))).toBe(
      '2025-11-12T09:30:00.000Z'
    );
  });
});

describe('formatEventDate', () => {
  it('returns null without a usable start', () => {
    expect(formatEventDate([0], [1762948800])).toBeNull();
  });

  it('shows one date when the end is on the same UTC day', () => {
    expect(formatEventDate([1762948800], [1762959600]).text).toBe(
      'Nov 12, 2025'
    );
  });
});
