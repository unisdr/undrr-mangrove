import { CONTENT_FAMILIES, CONTENT_FAMILY_IDS } from '../contentFamilies';
import { resolveTeaserPattern } from '../../ContentTeaser/contentTeaserPatterns';
import { DRUPAL_CONTENT_PATTERNS } from '../../../Integrations/Drupal/contentPatterns';
import { buildContentPatterns } from '../../../../scripts/ai-manifest/content-patterns';

test('archetypes and profiles resolve independently of CMS bundles', () => {
  expect(CONTENT_FAMILY_IDS).toEqual(CONTENT_FAMILIES.map(family => family.id));
  expect(CONTENT_FAMILY_IDS).not.toEqual(
    expect.arrayContaining(['news', 'blog', 'vacancy', 'national-platform'])
  );
  for (const family of CONTENT_FAMILIES) {
    expect(family.model.status).toBe('provisional');
    expect(family.profiles).toHaveProperty(family.defaultProfile);
    expect(family.presentations.card.status).toBe('stub');
    expect(resolveTeaserPattern(family.id)).toBe(
      family.profiles[family.defaultProfile].presentations.teaser.layout
    );
    expect(resolveTeaserPattern(family.id, 'toString')).toBeNull();
    for (const [id, profile] of Object.entries(family.profiles)) {
      expect(resolveTeaserPattern(family.id, id)).toBe(
        profile.presentations.teaser.layout
      );
    }
  }
  expect(Object.keys(DRUPAL_CONTENT_PATTERNS)).toHaveLength(15);
  for (const binding of Object.values(DRUPAL_CONTENT_PATTERNS)) {
    expect(resolveTeaserPattern(binding.type, binding.profile)).not.toBeNull();
  }
  expect(DRUPAL_CONTENT_PATTERNS.news).toEqual({
    type: 'article',
    profile: 'news',
  });
  expect(DRUPAL_CONTENT_PATTERNS.blog).toEqual({
    type: 'article',
    profile: 'commentary',
  });
  expect(resolveTeaserPattern('article', 'programme-session')).toBeNull();
});

test('resource full page remains a stub while Article reuses the existing page reference', () => {
  const byId = Object.fromEntries(
    CONTENT_FAMILIES.map(family => [family.id, family])
  );
  expect(byId.resource.presentations.fullPage.status).toBe('stub');
  expect(byId.article.presentations.fullPage.reference.id).toBe(
    'patterns-article-story--large-image'
  );
  expect(byId.collection.presentations.fullPage.status).toBe('reference');
});

test('AI discovery distinguishes archetypes, profiles, bindings and non-callable stubs', () => {
  const catalog = buildContentPatterns({
    docsBase: 'https://example.org/mangrove',
    packageName: '@undrr/undrr-mangrove',
  });
  expect(catalog.version).toBe(2);
  expect(catalog.families).toHaveLength(11);
  expect(catalog.integrations.drupal.bindings).toEqual(DRUPAL_CONTENT_PATTERNS);
  for (const family of catalog.families) {
    for (const presentation of Object.values(family.presentations)) {
      if (presentation.status === 'stub') {
        expect(presentation).not.toHaveProperty('import');
        expect(presentation).not.toHaveProperty('referenceUrl');
        expect(presentation).not.toHaveProperty('component');
      }
    }
    expect(family.presentations.teaser.import).toBe(
      'import { ContentTeaser } from "@undrr/undrr-mangrove/components/ContentTeaser.js";'
    );
    expect(
      family.profiles[family.defaultProfile].presentations.teaser.input.type
    ).toBe(family.id);
  }
  expect(
    catalog.families.find(f => f.id === 'reference-entry').profiles[
      'hazard-profile'
    ].presentations.teaser.referenceUrl
  ).toBe(
    'https://example.org/mangrove/?path=/story/patterns-content-teaser--hazard-profile'
  );
});
