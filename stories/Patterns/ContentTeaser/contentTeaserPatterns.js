/** Teaser projections only; no CMS binding or canonical schema is consumed here. */
import { CONTENT_FAMILIES } from '../Content/contentFamilies.js';

export const TEASER_PATTERNS = Object.fromEntries(
  CONTENT_FAMILIES.map(family => [
    family.id,
    {
      defaultProfile: family.defaultProfile,
      profiles: Object.fromEntries(
        Object.entries(family.profiles).map(([id, profile]) => [
          id,
          profile.presentations.teaser.layout,
        ])
      ),
    },
  ])
);

export function resolveTeaserPattern(type, profile) {
  if (!Object.hasOwn(TEASER_PATTERNS, type)) return null;
  const family = TEASER_PATTERNS[type];
  const selected = profile === undefined ? family.defaultProfile : profile;
  return Object.hasOwn(family.profiles, selected)
    ? family.profiles[selected]
    : null;
}
