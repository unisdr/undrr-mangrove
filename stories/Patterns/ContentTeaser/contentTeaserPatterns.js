/** Teaser projection lookup; no CMS bindings or canonical schema. */
import { resolveContentPresentation } from '../Content/contentPresentations.js';
export function resolveTeaserPattern(type, profile) {
  return resolveContentPresentation(type, profile, 'teaser')?.fields || null;
}
