/**
 * @file resolveFacetsLayout.test.js
 * @description Tests for the facets layout resolver.
 */

import { resolveFacetsLayout } from '../utils/constants';

describe('resolveFacetsLayout', () => {
  it('returns the facets value when explicitly set to a valid value', () => {
    expect(resolveFacetsLayout({ facets: false })).toBe(false);
    expect(resolveFacetsLayout({ facets: 'sidebar' })).toBe('sidebar');
    expect(resolveFacetsLayout({ facets: 'horizontal' })).toBe('horizontal');
  });

  it('falls back to "sidebar" when neither facets nor showFacets is set', () => {
    expect(resolveFacetsLayout({})).toBe('sidebar');
  });

  it('respects legacy showFacets: false when facets is unset', () => {
    expect(resolveFacetsLayout({ showFacets: false })).toBe(false);
  });

  it('returns "sidebar" for legacy showFacets: true when facets is unset', () => {
    expect(resolveFacetsLayout({ showFacets: true })).toBe('sidebar');
  });

  it('lets facets take precedence over legacy showFacets', () => {
    // Editor migrating to the new prop while showFacets is still in their config
    expect(
      resolveFacetsLayout({ facets: 'horizontal', showFacets: false })
    ).toBe('horizontal');
    expect(
      resolveFacetsLayout({ facets: false, showFacets: true })
    ).toBe(false);
  });

  it('ignores invalid facets values and falls back', () => {
    // Defensive: an unknown string should not become the layout
    expect(resolveFacetsLayout({ facets: 'inline' })).toBe('sidebar');
    expect(resolveFacetsLayout({ facets: 'inline', showFacets: false })).toBe(false);
  });
});
