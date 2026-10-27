/**
 * @file decodeEntities.test.js
 * @description Tests for the HTML entity decoder used on taxonomy labels.
 */

import {
  decodeEntities,
  decodeEntitiesFallback,
} from '../utils/decodeEntities';

const CASES = [
  ['Côte d&#039;Ivoire', "Côte d'Ivoire"],
  ['Lao People&#039;s Democratic Republic', "Lao People's Democratic Republic"],
  ['Korea, Dem People&#039;s Rep of', "Korea, Dem People's Rep of"],
  ['Floods &amp; landslides', 'Floods & landslides'],
  ['&lt;b&gt;not markup&lt;/b&gt;', '<b>not markup</b>'],
  ['&quot;quoted&quot; &apos;x&apos;', '"quoted" \'x\''],
  ['&#x27;hex&#X27;', "'hex'"],
  ['Plain text', 'Plain text'],
];

describe('decodeEntities (DOM)', () => {
  it.each(CASES)('decodes %p', (input, expected) => {
    expect(decodeEntities(input)).toBe(expected);
  });

  it('does not interpret markup', () => {
    expect(decodeEntities('<img src=x onerror=alert(1)>&amp;')).toBe(
      '<img src=x onerror=alert(1)>&'
    );
  });

  it('decodes only once', () => {
    expect(decodeEntities('&amp;#039;')).toBe('&#039;');
  });

  it('returns non-strings unchanged', () => {
    expect(decodeEntities(null)).toBeNull();
    expect(decodeEntities(undefined)).toBeUndefined();
    expect(decodeEntities(42)).toBe(42);
  });
});

describe('decodeEntitiesFallback (no DOM)', () => {
  it.each(CASES)('decodes %p', (input, expected) => {
    expect(decodeEntitiesFallback(input)).toBe(expected);
  });

  it('leaves unknown and invalid entities alone', () => {
    expect(decodeEntitiesFallback('&unknown; &#0; &#xFFFFFFF;')).toBe(
      '&unknown; &#0; &#xFFFFFFF;'
    );
  });

  it('decodes only once', () => {
    expect(decodeEntitiesFallback('&amp;#039;')).toBe('&#039;');
  });

  it('is used when document is unavailable', () => {
    const originalCreate = document.createElement;
    // Simulate an environment where the DOM decode fails
    document.createElement = () => {
      throw new Error('no DOM');
    };
    try {
      jest.isolateModules(() => {
        const mod = require('../utils/decodeEntities');
        expect(mod.decodeEntities('d&#039;Ivoire')).toBe("d'Ivoire");
      });
    } finally {
      document.createElement = originalCreate;
    }
  });
});
