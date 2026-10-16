import { CONTENT_FAMILIES } from '../../stories/Patterns/Content/contentFamilies.js';

import { DRUPAL_CONTENT_PATTERNS } from '../../stories/Integrations/Drupal/contentPatterns.js';

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
    version: 2,
    status: 'experimental',
    note: 'Content families own distinct presentation projections. Canonical models are provisional. A stub is not designed or implemented and has no callable component or import.',
    integrations: {
      drupal: {
        status: 'provisional',
        bindings: DRUPAL_CONTENT_PATTERNS,
        note: 'Profile selection only; no field extraction or URL policy.',
      },
    },
    families: CONTENT_FAMILIES.map(family => ({
      id: family.id,
      name: family.name,
      docsUrl: `${base}?path=/docs/patterns-content-${slug(family.name)}--docs`,
      model: family.model,
      defaultProfile: family.defaultProfile,
      profiles: Object.fromEntries(
        Object.entries(family.profiles).map(([id, profile]) => [
          id,
          {
            name: profile.name,
            intent: profile.intent,
            presentations: {
              teaser: {
                status: profile.presentations.teaser.status,
                referenceUrl: `${base}?path=/story/${profile.presentations.teaser.reference.id}`,
                input: { type: family.id, profile: id },
              },
            },
          },
        ])
      ),
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
