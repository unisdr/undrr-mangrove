/**
 * Vanilla citation dialog for server-rendered pages.
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
let nextDialogId = 0;

function firstText(value) {
  if (Array.isArray(value))
    return value.map(firstText).filter(Boolean).join(', ');
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') {
    return firstText(value.name || value.legalName);
  }
  return '';
}

function cleanUrl(value, base, stripQuery = false) {
  try {
    const url = new URL(value, base);
    if (!['https:', 'http:'].includes(url.protocol)) return '';
    url.hash = '';
    if (stripQuery) url.search = '';
    return url.href.replace(/\/$/, '');
  } catch {
    return '';
  }
}

function canonicalUrl(doc) {
  const canonical = doc.querySelector('link[rel="canonical"]')?.href;
  return cleanUrl(
    canonical || doc.location.href,
    doc.location.href,
    !canonical
  );
}

function workTypes(node) {
  return [node?.['@type']]
    .flat()
    .filter(Boolean)
    .map(type => String(type).split(/[\/#]/).pop());
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
    if (!workTypes(node).some(type => WORK_TYPES.has(type))) return false;
    return [node.mainEntityOfPage, node.url, node['@id']].some(
      value => cleanUrl(referenceUrl(value), base) === canonical
    );
  });
  // The WebPage may identify its primary work through mainEntity instead of
  // repeating mainEntityOfPage on that work.
  const page = matches.find(node => workTypes(node).includes('WebPage'));
  const mainEntity = schemaNodes(page?.mainEntity).find(node =>
    workTypes(node).some(type => WORK_TYPES.has(type) && type !== 'WebPage')
  );
  // A matching work is preferable to a matching WebPage wrapper.
  return (
    matches.find(node => !workTypes(node).includes('WebPage')) ||
    mainEntity ||
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
    doc.title?.trim() ||
    doc.querySelector('meta[property="og:title"]')?.content?.trim() ||
    doc.querySelector('h1')?.textContent?.trim() ||
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
      detail: {
        source: citation.source,
        url: cleanUrl(citation.url, element.ownerDocument.location.href, true),
      },
    })
  );
}

function createFallback(element) {
  const doc = element.ownerDocument;
  const fallback = doc.createElement('details');
  fallback.className = 'mg-cite-this__fallback';
  const summary = doc.createElement('summary');
  summary.className = 'mg-cite-this__summary';
  summary.textContent = element.dataset.mgCiteThisLabel || 'Cite this';
  const content = doc.createElement('div');
  content.className = 'mg-cite-this__content';
  const output = doc.createElement('p');
  output.className = 'mg-cite-this__text mg-code';
  output.dataset.mgCiteThisText = '';
  const actions = doc.createElement('div');
  actions.className = 'mg-cite-this__actions';
  const copy = doc.createElement('button');
  copy.type = 'button';
  copy.className = 'mg-cite-this__copy';
  copy.dataset.mgCiteThisCopy = '';
  copy.textContent = element.dataset.mgCiteThisCopyLabel || 'Copy citation';
  copy.hidden = true;
  const status = doc.createElement('span');
  status.className = 'mg-cite-this__status';
  status.dataset.mgCiteThisStatus = '';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  actions.append(copy, status);
  content.append(output, actions);
  fallback.append(summary, content);
  element.append(fallback);
  return fallback;
}

/** Initialise citation dialogs within a document or Drupal behaviour scope. */
export function mgCiteThis(scope = document) {
  for (const element of elementsIn(scope)) {
    if (instances.has(element)) continue;
    const existing = element.querySelector('details.mg-cite-this__fallback');
    const generated = !existing && element.childElementCount === 0;
    const fallback = generated ? createFallback(element) : existing;
    const output = fallback?.querySelector('[data-mg-cite-this-text]');
    const summary = fallback?.querySelector('summary');
    const content = fallback?.querySelector('.mg-cite-this__content');
    if (!fallback || !summary || !content || !output) continue;

    const doc = element.ownerDocument;
    const citation = resolveCitation(element);
    output.textContent = citation.text;
    element.dataset.mgCiteThisSource = citation.source;
    const dialog = doc.createElement('dialog');
    if (typeof dialog.showModal !== 'function') {
      if (generated) instances.set(element, () => fallback.remove());
      continue;
    }

    const trigger = doc.createElement('button');
    trigger.type = 'button';
    trigger.className = 'mg-cite-this__trigger';
    trigger.textContent = summary.textContent.trim();
    trigger.setAttribute('aria-haspopup', 'dialog');

    const dialogId = `mg-cite-this-dialog-${++nextDialogId}`;
    const title = doc.createElement('h2');
    title.id = `${dialogId}-title`;
    title.className = 'mg-cite-this__title';
    title.tabIndex = -1;
    title.textContent = trigger.textContent;

    const close = doc.createElement('button');
    close.type = 'button';
    close.className = 'mg-icon-button mg-cite-this__close';
    close.setAttribute(
      'aria-label',
      element.dataset.mgCiteThisCloseLabel || 'Close'
    );
    const closeIcon = doc.createElement('span');
    closeIcon.className = 'mg-icon mg-icon-close';
    closeIcon.setAttribute('aria-hidden', 'true');
    close.append(closeIcon);

    const header = doc.createElement('div');
    header.className = 'mg-cite-this__dialog-header';
    header.append(title, close);

    const dialogContent = content.cloneNode(true);
    const copy = dialogContent.querySelector('[data-mg-cite-this-copy]');
    const status = dialogContent.querySelector('[data-mg-cite-this-status]');
    if (copy) copy.hidden = false;
    dialog.className = 'mg-cite-this__dialog';
    dialog.setAttribute('aria-labelledby', title.id);
    dialog.append(header, dialogContent);
    element.append(trigger, dialog);
    fallback.hidden = true;

    let statusTimer;
    const onOpen = () => {
      dialog.showModal();
      title.focus();
      emit(element, 'open', citation);
    };
    const onClose = () => {
      clearTimeout(statusTimer);
      if (status) status.textContent = '';
      trigger.focus();
    };
    const closeDialog = () => dialog.close();
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
    trigger.addEventListener('click', onOpen);
    close.addEventListener('click', closeDialog);
    dialog.addEventListener('close', onClose);
    copy?.addEventListener('click', onCopy);
    instances.set(element, () => {
      clearTimeout(statusTimer);
      trigger.removeEventListener('click', onOpen);
      close.removeEventListener('click', closeDialog);
      dialog.removeEventListener('close', onClose);
      copy?.removeEventListener('click', onCopy);
      if (dialog.open) dialog.close();
      trigger.remove();
      dialog.remove();
      if (generated) fallback.remove();
      else fallback.hidden = false;
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
