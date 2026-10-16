import { CONTENT_FAMILIES } from '../../stories/Patterns/Content/contentFamilies.js';

const slug = value =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Discovery metadata, not a canonical schema or an inventory of working pages. */
export function buildContentPatterns({ docsBase, packageName }) {
  const base = docsBase.endsWith('/') ? docsBase : `${docsBase}/`;
  return {
    version: 1,
    status: 'experimental',
    note: 'Content families own distinct presentation projections. Canonical models are provisional. A stub is not designed or implemented and has no callable component or import.',
    families: CONTENT_FAMILIES.map(family => ({
      id: family.id,
      name: family.name,
      docsUrl: `${base}?path=/docs/patterns-content-${slug(family.name)}--docs`,
      model: family.model,
      presentations: Object.fromEntries(
        Object.entries(family.presentations).map(([name, presentation]) => {
          const result = {
            status: presentation.status,
            intent: presentation.intent,
          };
          if (presentation.reference)
            result.referenceUrl = `${base}?path=/story/${presentation.reference.id}`;
          if (presentation.status === 'experimental' && name === 'teaser') {
            result.import = `import { ContentTeaser } from "${packageName}/components/ContentTeaser.js";`;
            result.input = 'teaser projection; not a canonical domain record';
          }
          return [name, result];
        })
      ),
    })),
  };
}
