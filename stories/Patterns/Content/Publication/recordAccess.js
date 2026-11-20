/**
 * Cover link, "All downloads (N)" cue and analytics names for the experimental
 * publication record. See docs/PUBLICATION-RECORD-SPEC.md, "Cover link and
 * download cues" (unisdr/undrr-mangrove#1502).
 *
 * Kept free of JSX so the rules can be unit tested without React.
 */

/**
 * Analytics regions and labels. They match the Drupal interim
 * (https://gitlab.com/undrr/drupal-base/-/merge_requests/268) so reports keep
 * working when the record replaces it: every download starts `download_`,
 * every cover click ends `_cover`, and in-page navigation starts `nav_`.
 * Labels are fixed English strings with no counts.
 */
export const ANALYTICS = {
  region: 'undrr-download-box',
  coverRegion: 'undrr-download-box-cover',
  publisher: 'download_publisher',
  internal: 'download_internal',
  backup: 'download_backup',
  allDownloads: 'nav_all_downloads_cover',
};

/** Label for a primary resource link: the publisher copy or the hosted copy. */
export const primaryAnalyticsLabel = resource =>
  resource.origin === 'publisher' ? ANALYTICS.publisher : ANALYTICS.internal;

/**
 * The cover's target is the first primary resource link, never a backup. The
 * projection has already put the publisher copy in the primary slot and the
 * hosted backup beside it, so the cover adds no selection rule of its own: it
 * reads the same object the resource list renders first.
 */
export function coverAccess(resources) {
  const first = resources?.[0];
  if (!first?.href) return undefined;
  return {
    href: first.href,
    lang: first.lang,
    origin: first.origin,
    icon: first.origin === 'publisher' ? 'external-link' : 'download',
    analyticsLabel: `${primaryAnalyticsLabel(first)}_cover`,
  };
}

/** The jump link appears only when the cover alone cannot show every file. */
export const showAllDownloads = resources => (resources?.length ?? 0) >= 2;

/**
 * Pick the CLDR plural form for `count` in the interface language, falling back
 * to `other`, and fill `{count}`. Same approach as the search widget's labels:
 * Intl.PluralRules selects, the catalogue supplies every form. The count is
 * written in ASCII digits, as Drupal's @count is, so ar-EG does not switch to
 * Arabic-Indic digits.
 */
export function pluralLabel(forms, lang, count) {
  if (typeof forms === 'string') return forms.replace('{count}', String(count));
  if (!forms || typeof forms !== 'object') return '';
  let category = 'other';
  try {
    category = new Intl.PluralRules(lang).select(count);
  } catch {
    // Unknown language tag: keep `other`.
  }
  const template = forms[category] ?? forms.other ?? '';
  return template.replace('{count}', String(count));
}
