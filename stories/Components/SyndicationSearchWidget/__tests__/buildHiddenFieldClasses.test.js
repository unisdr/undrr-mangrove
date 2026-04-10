import { buildHiddenFieldClasses, TEASER_FIELDS, allTeaserFieldsVisible } from '../utils/constants';

describe('buildHiddenFieldClasses', () => {
  it('returns empty string for null', () => {
    expect(buildHiddenFieldClasses(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(buildHiddenFieldClasses(undefined)).toBe('');
  });

  it('returns empty string for empty object', () => {
    expect(buildHiddenFieldClasses({})).toBe('');
  });

  it('returns empty string when all fields are true', () => {
    expect(buildHiddenFieldClasses({ image: true, date: true })).toBe('');
  });

  it('returns hide class for false fields', () => {
    const result = buildHiddenFieldClasses({ image: false, date: false });
    expect(result).toBe('mg-search--hide-image mg-search--hide-date');
  });

  it('only includes false fields, skips true fields', () => {
    const result = buildHiddenFieldClasses({
      image: false,
      contentType: true,
      date: false,
      summary: true,
    });
    expect(result).toBe('mg-search--hide-image mg-search--hide-date');
  });

  it('handles all seven field keys', () => {
    const result = buildHiddenFieldClasses({
      image: false,
      contentType: false,
      publicationType: false,
      date: false,
      siteName: false,
      summary: false,
      organization: false,
    });
    expect(result).toContain('mg-search--hide-image');
    expect(result).toContain('mg-search--hide-contentType');
    expect(result).toContain('mg-search--hide-publicationType');
    expect(result).toContain('mg-search--hide-date');
    expect(result).toContain('mg-search--hide-siteName');
    expect(result).toContain('mg-search--hide-summary');
    expect(result).toContain('mg-search--hide-organization');
  });
});

describe('TEASER_FIELDS', () => {
  it('defines all seven toggleable fields', () => {
    expect(Object.keys(TEASER_FIELDS)).toEqual([
      'image', 'contentType', 'publicationType', 'date', 'summary', 'siteName', 'organization',
    ]);
  });

  it('each field has a label and selector', () => {
    for (const [key, field] of Object.entries(TEASER_FIELDS)) {
      expect(field).toHaveProperty('label');
      expect(field).toHaveProperty('selector');
      expect(typeof field.label).toBe('string');
      expect(field.selector).toMatch(/^\./);
    }
  });
});

describe('allTeaserFieldsVisible', () => {
  it('returns all TEASER_FIELDS keys set to true', () => {
    const result = allTeaserFieldsVisible();
    expect(Object.keys(result)).toEqual(Object.keys(TEASER_FIELDS));
    for (const value of Object.values(result)) {
      expect(value).toBe(true);
    }
  });

  it('returns a new object each call (no shared reference)', () => {
    const a = allTeaserFieldsVisible();
    const b = allTeaserFieldsVisible();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
