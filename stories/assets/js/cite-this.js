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

function personName(value) {
  if (value?.familyName && value?.givenName) {
    return `${firstText(value.familyName)}, ${firstText(value.givenName)}`;
  }
  return firstText(value);
}

function workType(configured, work) {
  const type = configured?.trim().toLowerCase();
  if (['book', 'report', 'webpage'].includes(type)) return type;
  const types = workTypes(work);
  if (types.includes('Book')) return 'book';
  if (types.includes('Report')) return 'report';
  return 'webpage';
}

// A key that survives title and URL edits, so analytics can count one work
// across the pages that cite it. The URL is only the last resort.
function workIdentifier(data, work, url, base) {
  const schemaId = [work?.identifier]
    .flat()
    .map(value =>
      typeof value === 'object' ? firstText(value?.value) : firstText(value)
    )
    .find(Boolean);
  return (
    data.mgCiteThisId?.trim() ||
    schemaId ||
    (typeof work?.['@id'] === 'string' && work['@id'].trim()) ||
    cleanUrl(url, base, true)
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
  const authors = data.mgCiteThisAuthor?.trim()
    ? [data.mgCiteThisAuthor.trim()]
    : [work?.author].flat().map(personName).filter(Boolean);
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
  const fields = {
    type: workType(data.mgCiteThisType, work),
    authors,
    title,
    publisher,
    year,
    url,
    accessed: now,
  };
  // An editorial citation describes the work in words Mangrove cannot parse,
  // so exports need configured fields rather than page guesses.
  const id = workIdentifier(data, work, url, doc.location.href);
  if (explicit) {
    return {
      text: explicit,
      source: 'provided',
      url,
      id,
      fields: configured ? fields : null,
    };
  }
  return {
    text: formatCitation({ author, title, publisher, year, url, accessed }),
    source: configured ? 'metadata' : work ? 'schema' : 'page',
    url,
    id,
    fields,
  };
}

const EXPORT_FORMATS = {
  ris: {
    label: 'Download RIS',
    extension: 'ris',
    mime: 'application/x-research-info-systems',
    build: toRis,
  },
  bibtex: {
    label: 'Download BibTeX',
    extension: 'bib',
    mime: 'application/x-bibtex',
    build: toBibtex,
  },
};

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

/** RIS record for EndNote, Zotero and Mendeley. */
export function toRis(fields) {
  const type = { book: 'BOOK', report: 'RPRT', webpage: 'ELEC' }[fields.type];
  const lines = [
    ['TY', type],
    ...fields.authors.map(name => ['AU', name]),
    ['TI', fields.title],
    ['PY', fields.year],
    ['PB', fields.publisher],
    ['UR', fields.url],
    ['Y2', isoDate(fields.accessed).replaceAll('-', '/')],
  ].filter(([, value]) => value);
  return `${[...lines, ['ER', '']]
    .map(([tag, value]) => `${tag}  - ${value}`)
    .join('\r\n')}\r\n`;
}

function bibtexText(value) {
  return value
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([{}&%$#_])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

// Organisations are braced so BibTeX does not split them into personal names;
// "Family, Given" names come only from structured Schema.org people.
function bibtexName(name) {
  return /^[^,]+, [^,]+$/.test(name)
    ? bibtexText(name)
    : `{${bibtexText(name)}}`;
}

/** BibTeX entry; `urldate` is read by biblatex and ignored by classic BibTeX. */
export function toBibtex(fields) {
  const entry = { book: 'book', report: 'techreport', webpage: 'misc' }[
    fields.type
  ];
  const key =
    [fields.authors[0], fields.year, fields.title]
      .filter(Boolean)
      .map(part =>
        part
          .normalize('NFKD')
          .replace(/[^A-Za-z0-9\s]/g, '')
          .trim()
          .split(/\s+/)[0]
          ?.toLowerCase()
      )
      .filter(Boolean)
      .join('') || 'citation';
  const publisherField = fields.type === 'report' ? 'institution' : 'publisher';
  const lines = [
    ['author', fields.authors.map(bibtexName).join(' and ')],
    ['title', `{${bibtexText(fields.title)}}`],
    [publisherField, fields.publisher && bibtexText(fields.publisher)],
    ['year', fields.year],
    ['url', fields.url],
    ['urldate', isoDate(fields.accessed)],
  ].filter(([, value]) => value);
  return `@${entry}{${key},\n${lines
    .map(([name, value]) => `  ${name} = {${value}}`)
    .join(',\n')}\n}\n`;
}

// Both formats are offered unless the site lists its own or sets "none".
function exportFormats(element, citation) {
  if (!citation.fields) return [];
  return (element.dataset.mgCiteThisExport ?? 'ris bibtex')
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(
      (name, index, all) => EXPORT_FORMATS[name] && all.indexOf(name) === index
    );
}

function fileName(title) {
  return (
    title
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 60) || 'citation'
  );
}

const URL_PATTERN = /https?:\/\/[^\s<>"]+/g;

// Links each URL in place while keeping the copied text identical to the
// rendered text. Trailing sentence punctuation stays outside the link.
function renderCitation(output, text) {
  const doc = output.ownerDocument;
  output.replaceChildren();
  let index = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const href = match[0].replace(/[.,;:)\]]+$/, '');
    if (match.index > index) output.append(text.slice(index, match.index));
    const link = doc.createElement('a');
    link.href = href;
    link.textContent = href;
    output.append(link);
    index = match.index + href.length;
  }
  if (index < text.length) output.append(text.slice(index));
}

function elementsIn(scope) {
  if (!scope) return [];
  if (!scope.querySelectorAll) return Array.from(scope).flatMap(elementsIn);
  return [
    ...(scope.matches?.('[data-mg-cite-this]') ? [scope] : []),
    ...scope.querySelectorAll('[data-mg-cite-this]'),
  ];
}

function emit(element, name, citation, extra = {}) {
  element.dispatchEvent(
    new CustomEvent(`mg-cite-this:${name}`, {
      bubbles: true,
      detail: {
        source: citation.source,
        id: citation.id,
        url: cleanUrl(citation.url, element.ownerDocument.location.href, true),
        pageUrl: canonicalUrl(element.ownerDocument).replace(/\?.*$/, ''),
        layout: element.classList.contains('mg-cite-this--compact')
          ? 'compact'
          : 'default',
        ...extra,
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
  output.className = 'mg-cite-this__text';
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
    renderCitation(output, citation.text);
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
    let copyLink;
    if (copy && element.dataset.mgCiteThisCopyLink !== 'false') {
      copyLink = doc.createElement('button');
      copyLink.type = 'button';
      copyLink.className = 'mg-cite-this__copy mg-cite-this__copy-link';
      copyLink.textContent =
        element.dataset.mgCiteThisCopyLinkLabel || 'Copy citation URL';
      copy.after(copyLink);
    }
    const exports = exportFormats(element, citation).map(format => {
      const { label, extension, mime, build } = EXPORT_FORMATS[format];
      const link = doc.createElement('a');
      link.className = 'mg-cite-this__export';
      link.href = `data:${mime};charset=utf-8,${encodeURIComponent(
        build(citation.fields)
      )}`;
      link.download = `${fileName(citation.fields.title)}.${extension}`;
      link.textContent =
        element.dataset[
          `mgCiteThis${format === 'ris' ? 'Ris' : 'Bibtex'}Label`
        ] || label;
      link.dataset.mgCiteThisFormat = format;
      return link;
    });
    if (exports.length) {
      const list = doc.createElement('div');
      list.className = 'mg-cite-this__exports';
      list.append(...exports);
      dialogContent.append(list);
    }
    dialog.className = 'mg-cite-this__dialog';
    dialog.setAttribute('aria-labelledby', title.id);
    dialog.append(header, dialogContent);
    // The default layout mirrors ShareButtons: a label, the citation as a
    // copyable field, and a quiet link to the full dialog. The compact
    // variant is the dialog trigger alone.
    const panel = !element.classList.contains('mg-cite-this--compact');
    let wrapper;
    let label;
    let preview;
    let previewText;
    let previewStatus;
    if (panel) {
      wrapper = doc.createElement('div');
      wrapper.className = 'mg-cite-this__panel';
      label = doc.createElement('p');
      label.id = `${dialogId}-label`;
      label.className = 'mg-cite-this__header';
      label.textContent = trigger.textContent;
      element.setAttribute('role', 'group');
      element.setAttribute('aria-labelledby', label.id);

      preview = doc.createElement('button');
      preview.type = 'button';
      preview.className = 'mg-cite-this__preview';
      preview.setAttribute(
        'aria-label',
        element.dataset.mgCiteThisCopyLabel || 'Copy citation'
      );
      const previewIcon = doc.createElement('span');
      previewIcon.className = 'mg-icon mg-icon-file-alt';
      previewIcon.setAttribute('aria-hidden', 'true');
      previewText = doc.createElement('span');
      previewText.className = 'mg-cite-this__preview-text';
      previewText.textContent = citation.text;
      const copyIcon = doc.createElement('span');
      copyIcon.className = 'mg-icon mg-icon-clone';
      copyIcon.setAttribute('aria-hidden', 'true');
      preview.append(previewIcon, previewText, copyIcon);

      previewStatus = doc.createElement('span');
      previewStatus.className = 'mg-u-sr-only';
      previewStatus.setAttribute('role', 'status');
      previewStatus.setAttribute('aria-live', 'polite');

      trigger.textContent =
        element.dataset.mgCiteThisMoreLabel || 'All citation options';
      trigger.classList.add('mg-cite-this__more');
      wrapper.append(label, preview, previewStatus, trigger);
      element.append(wrapper, dialog);
    } else {
      element.append(trigger, dialog);
    }
    fallback.hidden = true;

    let statusTimer;
    let previewTimer;
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
    const announce = (message, delay) => {
      if (status) status.textContent = message;
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => {
        if (status) status.textContent = '';
      }, delay);
    };
    const copyText = async (text, copiedLabel, failedLabel, eventName) => {
      try {
        await navigator.clipboard.writeText(text);
        announce(copiedLabel, 3000);
        emit(element, eventName, citation, { placement: 'dialog' });
      } catch {
        announce(failedLabel, 5000);
        emit(element, 'copy-error', citation, {
          target: eventName === 'copy' ? 'citation' : 'link',
          placement: 'dialog',
        });
      }
    };
    const onCopy = () =>
      copyText(
        citation.text,
        element.dataset.mgCiteThisCopiedLabel || 'Citation copied',
        element.dataset.mgCiteThisFailedLabel ||
          'Copy failed. Select the citation and copy it manually.',
        'copy'
      );
    // The citation's own locator, not a shortlink, so the copied link lasts.
    const onCopyLink = () =>
      copyText(
        citation.url,
        element.dataset.mgCiteThisLinkCopiedLabel || 'Link copied',
        element.dataset.mgCiteThisLinkFailedLabel ||
          'Copy failed. Select the URL in the citation and copy it manually.',
        'copy-link'
      );
    const onPreviewCopy = async () => {
      let message;
      try {
        await navigator.clipboard.writeText(citation.text);
        message = element.dataset.mgCiteThisCopiedLabel || 'Citation copied';
        emit(element, 'copy', citation, { placement: 'field' });
      } catch {
        message =
          element.dataset.mgCiteThisFailedLabel ||
          'Copy failed. Select the citation and copy it manually.';
        emit(element, 'copy-error', citation, {
          target: 'citation',
          placement: 'field',
        });
      }
      previewText.textContent = message;
      previewStatus.textContent = message;
      clearTimeout(previewTimer);
      previewTimer = setTimeout(() => {
        previewText.textContent = citation.text;
        previewStatus.textContent = '';
      }, 3000);
    };
    const onExport = event => {
      const format = event.target.closest('[data-mg-cite-this-format]')?.dataset
        .mgCiteThisFormat;
      if (format) emit(element, 'export', citation, { format });
    };
    trigger.addEventListener('click', onOpen);
    dialogContent.addEventListener('click', onExport);
    close.addEventListener('click', closeDialog);
    dialog.addEventListener('close', onClose);
    copy?.addEventListener('click', onCopy);
    copyLink?.addEventListener('click', onCopyLink);
    preview?.addEventListener('click', onPreviewCopy);
    instances.set(element, () => {
      clearTimeout(statusTimer);
      trigger.removeEventListener('click', onOpen);
      close.removeEventListener('click', closeDialog);
      dialog.removeEventListener('close', onClose);
      copy?.removeEventListener('click', onCopy);
      copyLink?.removeEventListener('click', onCopyLink);
      dialogContent.removeEventListener('click', onExport);
      if (dialog.open) dialog.close();
      clearTimeout(previewTimer);
      preview?.removeEventListener('click', onPreviewCopy);
      wrapper?.remove();
      if (panel) {
        element.removeAttribute('role');
        element.removeAttribute('aria-labelledby');
      }
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
