import { CONTENT_FAMILIES, CONTENT_FAMILY_IDS } from '../contentFamilies';
import {
  TEASER_PATTERNS,
  DRUPAL_TEASER_TYPES,
} from '../../ContentTeaser/contentTeaserPatterns';
import { buildContentPatterns } from '../../../../scripts/ai-manifest/content-patterns';

test('each indexed content family owns its teaser projection and reserves other presentations', () => {
  expect([...CONTENT_FAMILY_IDS].sort()).toEqual(
    CONTENT_FAMILIES.map(family => family.id).sort()
  );
  expect(CONTENT_FAMILIES.map(family => family.id).sort()).toEqual(
    Object.values(DRUPAL_TEASER_TYPES).sort()
  );
  for (const family of CONTENT_FAMILIES) {
    expect(family.model.status).toBe('provisional');
    expect(Object.keys(family.presentations).sort()).toEqual([
      'card',
      'fullPage',
      'teaser',
    ]);
    expect(family.presentations.teaser.status).toBe('experimental');
    expect(TEASER_PATTERNS[family.id]).toBe(family.presentations.teaser.layout);
    expect(family.presentations.card.status).toBe('stub');
  }
});

test('full resource page is a stub and existing news/collection pages are references', () => {
  const byId = Object.fromEntries(
    CONTENT_FAMILIES.map(family => [family.id, family])
  );
  expect(byId.resource.presentations.fullPage).toMatchObject({
    status: 'stub',
  });
  expect(byId.news.presentations.fullPage).toMatchObject({
    status: 'reference',
    reference: {
      kind: 'Patterns/Article story',
      story: 'Large, prominent image',
      id: 'patterns-article-story--large-image',
    },
  });
  expect(byId.collection.presentations.fullPage.status).toBe('reference');
});

test('AI discovery distinguishes stubs from callable renderers and page references', () => {
  const catalog = buildContentPatterns({
    docsBase: 'https://example.org/mangrove',
    packageName: '@undrr/undrr-mangrove',
  });
  expect(catalog.families).toHaveLength(15);
  for (const family of catalog.families) {
    expect(family.docsUrl).toContain(
      'https://example.org/mangrove/?path=/docs/patterns-content-'
    );
    for (const presentation of Object.values(family.presentations)) {
      if (presentation.status === 'stub') {
        expect(presentation).not.toHaveProperty('import');
        expect(presentation).not.toHaveProperty('referenceUrl');
        expect(presentation).not.toHaveProperty('component');
      }
      if (presentation.status === 'reference') {
        expect(presentation.referenceUrl).toMatch(/\?path=\/story\//);
        expect(presentation).not.toHaveProperty('import');
      }
    }
    expect(family.presentations.teaser.import).toBe(
      'import { ContentTeaser } from "@undrr/undrr-mangrove/components/ContentTeaser.js";'
    );
  }
  expect(
    catalog.families.find(family => family.id === 'hazard-profile')
      .presentations.teaser.referenceUrl
  ).toBe(
    'https://example.org/mangrove/?path=/story/patterns-content-teaser--hazard-profile'
  );
});
