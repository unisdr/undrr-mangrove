import { CONTENT_FAMILIES } from './contentFamilies.js';

export const CONTENT_FIELDS = [
  'labels',
  'resourceType',
  'location',
  'eventLocation',
  'organizationType',
  'organizationLabels',
  'classification',
  'topics',
  'published',
  'deadline',
  'event',
  'schedule',
  'exhibitions',
  'bucket',
  'sessionBucket',
  'sessionTypes',
  'room',
  'format',
  'freshness',
  'sources',
  'authors',
  'summary',
  'delivery',
  'identifier',
  'scope',
  'status',
  'language',
];
const FAMILIES = Object.fromEntries(
  CONTENT_FAMILIES.map(family => [family.id, family])
);

export function resolveContentPresentation(type, profile, presentation) {
  if (!Object.hasOwn(FAMILIES, type)) return null;
  const family = FAMILIES[type];
  const selected = profile === undefined ? family.defaultProfile : profile;
  if (!Object.hasOwn(family.profiles, selected)) return null;
  const spec = family.profiles[selected].presentations[presentation];
  if (!spec || spec.status !== 'experimental' || !spec.fields) return null;
  if (
    ![...spec.fields.before, ...spec.fields.after].every(field =>
      CONTENT_FIELDS.includes(field)
    )
  )
    throw new TypeError('Unknown content presentation field.');
  return { profile: selected, ...spec };
}
