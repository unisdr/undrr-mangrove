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
  // The backup explanation's contact link: not a download, so not download_.
  contact: 'contact_download_help',
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
    // Same window behaviour as the labelled link it duplicates.
    newWindow: first.origin === 'publisher',
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

/**
 * Resource presentation (unisdr/undrr-mangrove#1505), matching the Drupal
 * download box. A publisher copy reads "Access {title}", or "Watch {title}"
 * on a video host; a hosted-only copy shows the title alone.
 */
const VIDEO_HOSTS = /^(www\.|m\.)?(youtube\.com|youtu\.be|vimeo\.com)$/i;

export function linkVerb(resource) {
  if (resource.origin !== 'publisher') return 'title';
  try {
    return VIDEO_HOSTS.test(new URL(resource.href).hostname)
      ? 'watch'
      : 'access';
  } catch {
    return 'access'; // Root-relative publisher copy (story fixtures).
  }
}

/** "PDF, 1.6 MB · English": type and size, then language; unknown parts drop. */
export function fileMeta({ format, size, language } = {}) {
  return [[format, size].filter(Boolean).join(', '), language]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Which line carries the file facts. With a hosted backup they describe our
 * hosted file, so they sit on the backup line; otherwise on the primary.
 * Type and size never move between copies, because they describe one file.
 * Language is the document's, so the backup inherits it when it has none.
 */
export function resourceMeta(resource) {
  const { backup } = resource;
  const file = backup
    ? {
        format: backup.format,
        size: backup.size,
        language: backup.language || resource.language,
        // The language name is spoken in the file's language ("Français").
        lang: backup.lang || resource.lang,
      }
    : resource;
  return {
    line: backup ? 'backup' : 'primary',
    text: fileMeta(file),
    facts: fileMeta({ format: file.format, size: file.size }),
    language: file.language || '',
    lang: file.lang,
  };
}

/** Fill `{title}` while keeping the title separate for its own lang/dir. */
export function splitTemplate(template, token = '{title}') {
  const index = template.indexOf(token);
  if (index < 0) return [template, ''];
  return [template.slice(0, index), template.slice(index + token.length)];
}
