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
        import: `import { DRUPAL_CONTENT_PATTERNS } from "${packageName}/components/DrupalContentPatterns.js";`,
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
            presentations: Object.fromEntries(
              Object.entries(profile.presentations).map(
                ([presentationName, presentation]) => [
                  presentationName,
                  {
                    status: presentation.status,
                    basis: presentation.basis,
                    intent: presentation.intent,
                    projection: presentation.fields,
                    referenceUrl: `${base}?path=/story/${presentation.reference.id}`,
                    input: { type: family.id, profile: id },
                    ...(presentation.layouts
                      ? {
                          layouts: presentation.layouts.map(layout => ({
                            id: layout,
                            input: { type: family.id, profile: id },
                            props: { layout },
                            referenceUrl: `${base}?path=/story/${presentation.layoutReferences[layout].id}`,
                          })),
                        }
                      : {}),
                  },
                ]
              )
            ),
          },
        ])
      ),
      presentations: Object.fromEntries(
        Object.entries(family.presentations).map(([name, presentation]) => {
          const result = {
            status: presentation.status,
            intent: presentation.intent,
            ...(presentation.basis ? { basis: presentation.basis } : {}),
          };
          if (presentation.additionalReferences)
            result.additionalReferences = presentation.additionalReferences.map(
              reference => ({
                name: reference.story,
                intent: reference.intent,
                referenceUrl: `${base}?path=/story/${reference.id}`,
              })
            );
          if (presentation.reference)
            result.referenceUrl = `${base}?path=/story/${presentation.reference.id}`;
          if (
            presentation.status === 'experimental' &&
            ['teaser', 'card'].includes(name)
          ) {
            const renderer = name === 'card' ? 'ContentCard' : 'ContentTeaser';
            result.import = `import { ${renderer} } from "${packageName}/components/${renderer}.js";`;
            result.input = `${name} projection; not a canonical domain record`;
            if (presentation.layouts) result.layouts = presentation.layouts;
          }
          return [name, result];
        })
      ),
    })),
  };
}

/** Build-time check: documentation links and machine IDs must resolve to the same story. */
export function validateContentReferences(entries) {
  const check = reference => {
    if (!reference) return;
    const story = entries[reference.id];
    if (
      !story ||
      story.title !== reference.kind ||
      story.name !== reference.story
    )
      throw new Error(
        `Content pattern reference does not match the built Storybook index: ${reference.id}`
      );
  };
  for (const family of CONTENT_FAMILIES) {
    if (!entries[`patterns-content-${slug(family.name)}--docs`])
      throw new Error(`Missing content family guide: ${family.id}`);
    for (const presentation of Object.values(family.presentations)) {
      check(presentation.reference);
      presentation.additionalReferences?.forEach(check);
    }
    for (const profile of Object.values(family.profiles))
      for (const presentation of Object.values(profile.presentations)) {
        check(presentation.reference);
        Object.values(presentation.layoutReferences || {}).forEach(check);
      }
  }
}
