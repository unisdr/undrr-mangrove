/**
 * Vanilla citation disclosure for server-rendered pages.
 * The host owns editorial approval and analytics; this module only resolves,
 * displays, copies, and announces a citation.
 */
const WORK_TYPES = new Set([
  'Article',
  'Book',
  'Chapter',
  'CreativeWork',
  'NewsArticle',
  'Report',
  'ScholarlyArticle',
  'TechArticle',
  'WebPage',
]);

const instances = new WeakMap();

function firstText(value) {
  if (Array.isArray(value))
    return value.map(firstText).filter(Boolean).join(', ');
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') {
    return firstText(value.name || value.legalName);
  }
  return '';
}

function cleanUrl(value, base) {
  try {
    const url = new URL(value, base);
    if (!['https:', 'http:'].includes(url.protocol)) return '';
    url.hash = '';
    url.search = '';
    return url.href.replace(/\/$/, '');
  } catch {
    return '';
  }
}

function canonicalUrl(doc) {
  const canonical = doc.querySelector('link[rel="canonical"]')?.href;
  return cleanUrl(canonical || doc.location.href, doc.location.href);
}

function schemaNodes(value) {
  if (Array.isArray(value)) return value.flatMap(schemaNodes);
  if (!value || typeof value !== 'object') return [];
  return [
    value,
    ...schemaNodes(value['@graph']),
    ...schemaNodes(value.mainEntity),
  ];
}

function referenceUrl(value) {
  if (typeof value === 'string') return value;
  return value?.['@id'] || value?.url || '';
}

function schemaWork(doc, canonical) {
  const base = doc.location.href;
  const candidates = [];
  for (const script of doc.querySelectorAll(
    'script[type="application/ld+json"]'
  )) {
    try {
      candidates.push(...schemaNodes(JSON.parse(script.textContent)));
    } catch {
      // Malformed JSON-LD must not prevent the page citation fallback.
    }
  }
  const matches = candidates.filter(node => {
    const types = [node['@type']].flat().filter(Boolean);
    if (!types.some(type => WORK_TYPES.has(String(type).split(/[\/#]/).pop())))
      return false;
    return [node.mainEntityOfPage, node.url, node['@id']].some(
      value => cleanUrl(referenceUrl(value), base) === canonical
    );
  });
  // A matching work is preferable to a matching WebPage wrapper.
  return (
    matches.find(node => ![node['@type']].flat().includes('WebPage')) ||
    matches[0]
  );
}

function publicationYear(value) {
  const match = String(value || '').match(/^(\d{4})(?:-|$)/);
  return match ? match[1] : '';
}

function formatCitation({ author, title, publisher, year, url, accessed }) {
  const lead = author ? `${author}${year ? ` (${year})` : ''}, ` : '';
  const titlePart = `“${title}”`;
  const source = publisher && publisher !== author ? `, ${publisher}` : '';
  const date = !author && year ? ` (${year})` : '';
  const access = year ? '' : `, accessed ${accessed}`;
  return `${lead}${titlePart}${source}${date}${access}, ${url}.`;
}

/** Resolve a citation, in editorial → configured → matching JSON-LD → page order. */
export function resolveCitation(element, now = new Date()) {
  const doc = element.ownerDocument;
  const canonical = canonicalUrl(doc);
  const data = element.dataset;
  const explicit = data.mgCiteThisCitation?.trim();
  if (explicit) return { text: explicit, source: 'provided', url: canonical };

  const configured = [
    data.mgCiteThisAuthor,
    data.mgCiteThisPublisher,
    data.mgCiteThisYear,
    data.mgCiteThisTitle,
    data.mgCiteThisUrl,
  ].some(Boolean);
  const work = schemaWork(doc, canonical);
  const title =
    data.mgCiteThisTitle?.trim() ||
    firstText(work?.headline || work?.name) ||
    doc.querySelector('meta[property="og:title"]')?.content?.trim() ||
    doc.querySelector('h1')?.textContent?.trim() ||
    doc.title?.trim() ||
    'Untitled page';
  const site =
    data.mgCiteThisSite?.trim() ||
    doc.querySelector('meta[property="og:site_name"]')?.content?.trim() ||
    new URL(canonical).hostname.replace(/^www\./, '');
  const author = data.mgCiteThisAuthor?.trim() || firstText(work?.author);
  const publisher =
    data.mgCiteThisPublisher?.trim() || firstText(work?.publisher) || site;
  const year = publicationYear(data.mgCiteThisYear || work?.datePublished);
  const url =
    cleanUrl(data.mgCiteThisUrl || work?.url || canonical, doc.location.href) ||
    canonical;
  const pageLang = doc.documentElement.lang || 'en-GB';
  const locale = pageLang === 'en' ? 'en-GB' : pageLang;
  const accessed = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);
  return {
    text: formatCitation({ author, title, publisher, year, url, accessed }),
    source: configured ? 'metadata' : work ? 'schema' : 'page',
    url,
  };
}

function elementsIn(scope) {
  if (!scope) return [];
  if (!scope.querySelectorAll) return Array.from(scope).flatMap(elementsIn);
  return [
    ...(scope.matches?.('[data-mg-cite-this]') ? [scope] : []),
    ...scope.querySelectorAll('[data-mg-cite-this]'),
  ];
}

function emit(element, name, citation) {
  element.dispatchEvent(
    new CustomEvent(`mg-cite-this:${name}`, {
      bubbles: true,
      detail: { source: citation.source, url: citation.url },
    })
  );
}

/** Initialise citation disclosures within a document or Drupal behaviour scope. */
export function mgCiteThis(scope = document) {
  for (const element of elementsIn(scope)) {
    if (instances.has(element)) continue;
    const details = element.matches('details')
      ? element
      : element.querySelector('details');
    const output = element.querySelector('[data-mg-cite-this-text]');
    if (!details || !output) continue;
    const citation = resolveCitation(element);
    output.textContent = citation.text;
    element.dataset.mgCiteThisSource = citation.source;
    const context = element.querySelector('[data-mg-cite-this-context]');
    if (context) {
      context.textContent =
        citation.source === 'provided'
          ? element.dataset.mgCiteThisProvidedLabel || 'Provided citation'
          : element.dataset.mgCiteThisSuggestedLabel || 'Suggested citation';
    }
    const copy = element.querySelector('[data-mg-cite-this-copy]');
    const status = element.querySelector('[data-mg-cite-this-status]');
    if (copy) copy.hidden = false;
    let statusTimer;
    const onToggle = () => {
      if (details.open) emit(element, 'open', citation);
      else if (status) {
        clearTimeout(statusTimer);
        status.textContent = '';
      }
    };
    const onCopy = async () => {
      try {
        await navigator.clipboard.writeText(citation.text);
        if (status)
          status.textContent =
            element.dataset.mgCiteThisCopiedLabel || 'Citation copied';
        emit(element, 'copy', citation);
        clearTimeout(statusTimer);
        statusTimer = setTimeout(() => {
          if (status) status.textContent = '';
        }, 3000);
      } catch {
        if (status)
          status.textContent =
            element.dataset.mgCiteThisFailedLabel ||
            'Copy failed. Select the citation and copy it manually.';
        emit(element, 'copy-error', citation);
        clearTimeout(statusTimer);
        statusTimer = setTimeout(() => {
          if (status) status.textContent = '';
        }, 5000);
      }
    };
    details.addEventListener('toggle', onToggle);
    copy?.addEventListener('click', onCopy);
    instances.set(element, () => {
      clearTimeout(statusTimer);
      details.removeEventListener('toggle', onToggle);
      copy?.removeEventListener('click', onCopy);
      if (copy) copy.hidden = true;
    });
  }
}

/** Remove listeners before replacing content in a client-side navigation. */
export function mgCiteThisDestroy(scope = document) {
  for (const element of elementsIn(scope)) {
    instances.get(element)?.();
    instances.delete(element);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mgCiteThis(), {
      once: true,
    });
  } else {
    mgCiteThis();
  }
}
