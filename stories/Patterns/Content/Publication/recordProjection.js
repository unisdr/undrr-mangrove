import { resolveContentUrl } from '../_shared/ContentPattern';

const text = value => (typeof value === 'string' ? value.trim() : '');
const list = value => (Array.isArray(value) ? value : []);
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
  const resource = item => {
    const label = text(item?.label);
    const href = resolveContentUrl(item?.href);
    if (!label || !href) return undefined;
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
    // A backup cannot silently become the primary/original access route.
    return primary ? [{ ...primary, backup: resource(item.backup) }] : [];
  });
  const year = String(input.publicationYear ?? '');
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
    related: links(input.related),
    details: list(input.details).flatMap(item =>
      text(item?.label) && text(item?.value)
        ? [{ label: text(item.label), value: text(item.value) }]
        : []
    ),
  };
}
