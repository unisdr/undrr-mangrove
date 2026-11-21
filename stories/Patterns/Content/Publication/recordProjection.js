import { resolveContentUrl } from '../_shared/ContentPattern';

const text = value => (typeof value === 'string' ? value.trim() : '');
const list = value => (Array.isArray(value) ? value : []);
/**
 * Where a primary copy lives: `publisher` (external) or `hosted`. Adapters
 * must supply it; a missing origin is an adapter error. Only two cases follow
 * from the data: a primary with a hosted backup is the publisher copy, and a
 * root-relative URL is hosted. An absolute URL could be either (a hosted file
 * can be linked as https://www.undrr.org/media/123/download), so it falls back
 * to `hosted`, which keeps analytics labels internal rather than claiming an
 * external publisher, and warns in development.
 */
export function resourceOrigin(origin, href, backup) {
  if (origin === 'publisher' || origin === 'hosted') return origin;
  if (backup) return 'publisher';
  if (/^https?:/i.test(href) && process.env.NODE_ENV !== 'production') {
    console.warn(
      `PublicationRecord: resource ${href} has no origin; treating it as hosted. ` +
        "Adapters must set origin to 'publisher' or 'hosted'."
    );
  }
  return 'hosted';
}

/** Experimental presentation selection only; not a CMS adapter or domain schema. */
export function projectRecord(input) {
  const title = text(input?.title);
  if (!title)
    throw new TypeError('A publication record needs an approved title.');
  const links = values =>
    list(values).flatMap(item => {
      const label = text(item?.label);
      const href = resolveContentUrl(item?.href);
      return label && href ? [{ ...item, label, href }] : [];
    });
  const languageTag = value =>
    /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i.test(value || '') ? value : undefined;
  // `label` is the document's title: the link text for a hosted-only copy,
  // and the {title} in "Access {title}" or "Watch {title}". A backup uses the
  // interface's fixed wording, so it needs only a URL.
  const resource = (item, { needsLabel = true } = {}) => {
    const label = text(item?.label);
    const href = resolveContentUrl(item?.href);
    if ((needsLabel && !label) || !href) return undefined;
    return {
      label,
      href,
      language: text(item.language),
      labelLang: languageTag(item.labelLang),
      lang: languageTag(item.lang),
      format: text(item.format),
      size: text(item.size),
    };
  };
  const resources = list(input.resources).flatMap(item => {
    const primary = resource(item);
    if (!primary) return [];
    // A backup cannot silently become the primary/original access route.
    const backup = resource(item.backup, { needsLabel: false });
    const origin = resourceOrigin(item.origin, primary.href, backup);
    return [
      {
        ...primary,
        origin,
        backup: backup && { ...backup, origin: 'hosted' },
      },
    ];
  });
  const year = String(input.publicationYear ?? '');
  // When the record's resources were added to the site (Drupal's media
  // creation date), shown for every case as Drupal does. It is not a link
  // check, so it is never presented as one.
  const added = /^\d{4}-\d{2}-\d{2}$/.test(input.resourcesAdded || '')
    ? input.resourcesAdded
    : undefined;
  return {
    ...input,
    title,
    summary: text(input.summary),
    lang: languageTag(input.lang),
    bodyLang: languageTag(input.bodyLang),
    originalTitle: text(input.originalTitle?.text)
      ? {
          text: text(input.originalTitle.text),
          lang: languageTag(input.originalTitle.lang),
        }
      : undefined,
    authors: list(input.authors).map(text).filter(Boolean),
    sources: list(input.sources).flatMap(item =>
      text(item?.label)
        ? [{ label: text(item.label), href: resolveContentUrl(item.href) }]
        : []
    ),
    publicationYear: /^[1-9]\d{3}$/.test(year) ? year : undefined,
    identifiers: list(input.identifiers).map(text).filter(Boolean),
    edition: text(input.edition),
    pages: text(input.pages),
    canonicalUrl: resolveContentUrl(input.canonicalUrl),
    cover: resolveContentUrl(input.cover?.src)
      ? { src: resolveContentUrl(input.cover.src), alt: text(input.cover.alt) }
      : undefined,
    citation: text(input.citation),
    resources,
    resourcesAdded: resources.length > 0 ? added : undefined,
    contactHref: resolveContentUrl(input.contactHref),
    related: links(input.related),
    details: list(input.details).flatMap(item =>
      text(item?.label) && text(item?.value)
        ? [{ label: text(item.label), value: text(item.value) }]
        : []
    ),
  };
}
