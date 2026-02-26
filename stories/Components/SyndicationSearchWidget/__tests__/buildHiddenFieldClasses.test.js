import { buildHiddenFieldClasses } from '../utils/constants';

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
