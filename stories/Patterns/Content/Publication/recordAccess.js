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
  // Expanding or collapsing a long resource list: navigation, not a download.
  showAll: 'nav_show_all_downloads',
  // Filtering the resource table.
  filterLanguage: 'nav_filter_language',
  filterText: 'nav_filter_text',
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
 * Adaptive presentation (tiers). Of 27,839 published Drupal publications,
 * 88% have one file, 7.7% two, 1.8% three, 1.4% four or five, 0.9% six to
 * ten, 57 eleven or more, and the largest 34. The presentation grows with
 * the number of files and languages; tune the thresholds here.
 */
/** From this many resources, a table replaces the single access row. */
export const TABLE_FROM = 2;
/** From this many languages, the table gets language filters. */
export const LANGUAGE_FILTER_FROM = 2;
/** From this many resources, the table is tier 3 even in one language. */
export const TIER3_FROM = 6;
/** From this many resources, a text filter is added. */
export const TEXT_FILTER_FROM = 11;
/** From this many languages, the language filter is a select. */
export const LANGUAGE_SELECT_FROM = 6;
/**
 * Rows in view before the rest of the current view is collapsed. Collapsed
 * table rows use plain `hidden` (Chromium ignores `until-found` on rows), so
 * find-in-page can't reach them: the table only collapses from
 * COLLAPSE_FROM resources, where the text filter is there to search them.
 */
export const PREVIEW_ROWS = 6;
export const COLLAPSE_FROM = TEXT_FILTER_FROM;

const languageKey = resource =>
  (resource.lang || resource.language || '').toLowerCase() || null;

/**
 * Languages in first-appearance order, with counts. Resources with no known
 * language appear only under "All".
 */
export function languageGroups(resources = []) {
  const groups = new Map();
  resources.forEach(resource => {
    const key = languageKey(resource);
    if (!key) return;
    const group = groups.get(key) || {
      key,
      label: resource.language || resource.lang,
      lang: resource.lang,
      count: 0,
    };
    group.count += 1;
    groups.set(key, group);
  });
  return [...groups.values()];
}

/**
 * Which presentation a set of resources gets:
 * - tier 0: none; 1: one access row; 2: a table (2–5 files, one language);
 * - tier 3: a table with language filters (2+ languages, or 6+ files);
 * - tier 4: tier 3 plus a text filter (11+ files).
 * Language filters need 2+ languages to be useful, so a one-language tier 3
 * or 4 has none. From 6 languages the filter is a select.
 */
export function presentation(resources = []) {
  const count = resources.length;
  const languages = languageGroups(resources);
  const multilingual = languages.length >= LANGUAGE_FILTER_FROM;
  let tier = 0;
  if (count === 1) tier = 1;
  else if (count >= TEXT_FILTER_FROM) tier = 4;
  else if (count >= TIER3_FROM || multilingual) tier = 3;
  else if (count >= TABLE_FROM) tier = 2;
  let languageFilter = 'none';
  if (tier >= 3 && multilingual)
    languageFilter =
      languages.length >= LANGUAGE_SELECT_FROM ? 'select' : 'buttons';
  return {
    tier,
    count,
    languages,
    languageFilter,
    textFilter: tier === 4,
  };
}

const fold = value =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();

/**
 * Indexes of the resources shown for a language key ("all" for every one)
 * and a text query, which match together. Every word of the query must
 * appear in the title, language or format, ignoring case and accents.
 */
export function filterResources(
  resources = [],
  { language = 'all', query = '' } = {}
) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return resources.flatMap((resource, index) => {
    if (language !== 'all' && languageKey(resource) !== language) return [];
    // Title, language and format; not sizes, where "2" would match "422".
    const format = resource.backup?.format || resource.format;
    const haystack = fold(
      [resource.label, resource.language, format].join(' ')
    );
    return words.every(word => haystack.includes(word)) ? [index] : [];
  });
}

/**
 * Whether row `position` of a view of `viewCount` rows starts collapsed, in
 * a table of `resourceCount` resources. Only tables with a text filter
 * (11+ resources) collapse; a filtered view of 6 rows or fewer never does.
 */
export const isCollapsedRow = (position, viewCount, resourceCount) =>
  resourceCount >= COLLAPSE_FROM &&
  viewCount > PREVIEW_ROWS &&
  position >= PREVIEW_ROWS;

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
 * Link verbs (unisdr/undrr-mangrove#1505), matching the Drupal download box:
 * "Access" for a publisher copy, "Watch" on a video host, and the title (in
 * the single row) or "Download" (in a table) for a hosted-only copy.
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
 * The facts shown for a resource. With a hosted backup they describe our
 * hosted file, so they come from the backup; type and size never move between
 * copies, because each describes one file. Language is the document's, so the
 * backup inherits it when it has none.
 */
export function fileFacts(resource) {
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
