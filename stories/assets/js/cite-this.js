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

// Built-in interface text for the UN official languages and Japanese. Data
// attributes still override any string, for other languages or house style.
// Title quotes and separators follow each language's citation conventions.
const STRINGS = {
  en: {
    label: 'Cite this',
    copy: 'Copy citation',
    copied: 'Citation copied',
    failed: 'Copy failed. Select the citation and copy it manually.',
    copyUrl: 'Copy citation URL',
    urlCopied: 'URL copied',
    urlFailed:
      'Copy failed. Select the URL in the citation and copy it manually.',
    close: 'Close',
    more: 'All citation options',
    ris: 'Download RIS',
    bibtex: 'Download BibTeX',
    accessed: 'accessed {date}',
    quoteOpen: '“',
    quoteClose: '”',
    separator: ', ',
  },
  ar: {
    label: 'الاستشهاد بهذا المحتوى',
    copy: 'نسخ الاستشهاد',
    copied: 'تم نسخ الاستشهاد',
    failed: 'تعذّر النسخ. حدّد الاستشهاد وانسخه يدويًا.',
    copyUrl: 'نسخ رابط الاستشهاد',
    urlCopied: 'تم نسخ الرابط',
    urlFailed: 'تعذّر النسخ. حدّد الرابط في الاستشهاد وانسخه يدويًا.',
    close: 'إغلاق',
    more: 'جميع خيارات الاستشهاد',
    ris: 'تنزيل RIS',
    bibtex: 'تنزيل BibTeX',
    accessed: 'تاريخ الاطلاع: {date}',
    quoteOpen: '“',
    quoteClose: '”',
    separator: '، ',
  },
  es: {
    label: 'Citar',
    copy: 'Copiar la cita',
    copied: 'Cita copiada',
    failed: 'No se pudo copiar. Seleccione la cita y cópiela manualmente.',
    copyUrl: 'Copiar la URL de la cita',
    urlCopied: 'URL copiada',
    urlFailed:
      'No se pudo copiar. Seleccione la URL en la cita y cópiela manualmente.',
    close: 'Cerrar',
    more: 'Todas las opciones de cita',
    ris: 'Descargar RIS',
    bibtex: 'Descargar BibTeX',
    accessed: 'consultado el {date}',
    quoteOpen: '“',
    quoteClose: '”',
    separator: ', ',
  },
  fr: {
    label: 'Citer',
    copy: 'Copier la référence',
    copied: 'Référence copiée',
    failed:
      'La copie a échoué. Sélectionnez la référence et copiez-la manuellement.',
    copyUrl: 'Copier l’URL de la citation',
    urlCopied: 'URL copiée',
    urlFailed:
      'La copie a échoué. Sélectionnez l’URL dans la référence et copiez-la manuellement.',
    close: 'Fermer',
    more: 'Toutes les options de citation',
    ris: 'Télécharger RIS',
    bibtex: 'Télécharger BibTeX',
    accessed: 'consulté le {date}',
    quoteOpen: '«\u202F',
    quoteClose: '\u202F»',
    separator: ', ',
  },
  ja: {
    label: '引用する',
    copy: '引用をコピー',
    copied: '引用をコピーしました',
    failed: 'コピーできませんでした。引用を選択して手動でコピーしてください。',
    copyUrl: '引用URLをコピー',
    urlCopied: 'URLをコピーしました',
    urlFailed:
      'コピーできませんでした。引用内のURLを選択して手動でコピーしてください。',
    close: '閉じる',
    more: 'すべての引用オプション',
    ris: 'RISをダウンロード',
    bibtex: 'BibTeXをダウンロード',
    accessed: '閲覧日：{date}',
    quoteOpen: '“',
    quoteClose: '”',
    separator: ', ',
  },
  ru: {
    label: 'Как цитировать',
    copy: 'Копировать библиографическую ссылку',
    copied: 'Библиографическая ссылка скопирована',
    failed:
      'Не удалось скопировать. Выделите библиографическую ссылку и скопируйте её вручную.',
    copyUrl: 'Копировать URL-адрес',
    urlCopied: 'URL-адрес скопирован',
    urlFailed:
      'Не удалось скопировать. Выделите URL-адрес в библиографической ссылке и скопируйте его вручную.',
    close: 'Закрыть',
    more: 'Все варианты цитирования',
    ris: 'Скачать RIS',
    bibtex: 'Скачать BibTeX',
    accessed: 'дата обращения: {date}',
    quoteOpen: '«',
    quoteClose: '»',
    separator: ', ',
  },
  zh: {
    label: '引用',
    copy: '复制引用',
    copied: '引用已复制',
    failed: '复制失败。请选中引用内容并手动复制。',
    copyUrl: '复制引用网址',
    urlCopied: '网址已复制',
    urlFailed: '复制失败。请选中引用中的网址并手动复制。',
    close: '关闭',
    more: '所有引用选项',
    ris: '下载 RIS',
    bibtex: '下载 BibTeX',
    accessed: '访问日期：{date}',
    quoteOpen: '《',
    quoteClose: '》',
    separator: ', ',
  },
};

function languageOf(element) {
  return (
    element.closest('[lang]')?.getAttribute('lang') ||
    element.ownerDocument.documentElement.lang ||
    'en'
  );
}

/** Built-in interface text for a language tag, falling back to English. */
export function citeThisStrings(lang = 'en') {
  const primary = String(lang).toLowerCase().split(/[-_]/)[0];
  return STRINGS[primary] || STRINGS.en;
}

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
function workIdentifier(data, work, url, canonical, base) {
  const schemaId = [work?.identifier]
    .flat()
    .map(value => {
      const id = value && typeof value === 'object' ? value.value : value;
      return typeof id === 'number' ? String(id) : firstText(id);
    })
    .find(Boolean);
  return (
    data.mgCiteThisId?.trim() ||
    schemaId ||
    nodeId(work?.['@id'], [url, canonical], base) ||
    url
  );
}

// An @id is only stable when it is not the page or work URL plus a fragment,
// which would change with the URL or, if relative, repeat on every page.
function nodeId(value, urls, base) {
  if (typeof value !== 'string' || !value.trim()) return '';
  let resolved;
  try {
    resolved = new URL(value.trim(), base);
  } catch {
    return '';
  }
  const withoutHash = cleanUrl(resolved.href, base);
  if (!withoutHash || urls.includes(withoutHash)) return '';
  if (cleanUrl(resolved.href, base, true) === cleanUrl(base, base, true))
    return '';
  return resolved.href;
}

function publicationYear(value) {
  const match = String(value || '').match(/^(\d{4})(?:-|$)/);
  return match ? match[1] : '';
}

function formatCitation(
  { author, title, publisher, year, url, accessed },
  strings = STRINGS.en
) {
  const sep = strings.separator;
  const lead = author ? `${author}${year ? ` (${year})` : ''}${sep}` : '';
  const source = publisher && publisher !== author ? `${sep}${publisher}` : '';
  const date = !author && year ? ` (${year})` : '';
  const access = year
    ? ''
    : `${sep}${strings.accessed.replace('{date}', accessed)}`;
  const start = lead.length + strings.quoteOpen.length;
  return {
    text: `${lead}${strings.quoteOpen}${title}${strings.quoteClose}${source}${date}${access}${sep}${url}.`,
    titleRange: [start, start + title.length],
  };
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
  const pageLang = languageOf(element);
  const locale = pageLang === 'en' ? 'en-GB' : pageLang;
  const accessed = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    numberingSystem: 'latn',
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
  const id = workIdentifier(data, work, url, canonical, doc.location.href);
  if (explicit) {
    return {
      text: explicit,
      source: 'provided',
      url,
      id,
      fields: configured ? fields : null,
    };
  }
  const { text, titleRange } = formatCitation(
    { author, title, publisher, year, url, accessed },
    citeThisStrings(pageLang)
  );
  return {
    text,
    titleRange,
    source: configured ? 'metadata' : work ? 'schema' : 'page',
    url,
    id,
    fields,
  };
}

const EXPORT_FORMATS = {
  ris: {
    extension: 'ris',
    mime: 'application/x-research-info-systems',
    build: toRis,
  },
  bibtex: {
    extension: 'bib',
    mime: 'application/x-bibtex',
    build: toBibtex,
  },
};

// A line break inside a field would end an RIS tag or BibTeX value early.
function oneLine(value) {
  return String(value ?? '')
    .replace(/\s*[\r\n]+\s*/g, ' ')
    .trim();
}

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
  ]
    .map(([tag, value]) => [tag, oneLine(value)])
    .filter(([, value]) => value);
  return `${[...lines, ['ER', '']]
    .map(([tag, value]) => `${tag}  - ${value}`)
    .join('\r\n')}\r\n`;
}

const BIBTEX_ESCAPES = {
  '\\': '\\textbackslash{}',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
};

function bibtexText(value) {
  return oneLine(value).replace(
    /[\\~^{}&%$#_]/g,
    char => BIBTEX_ESCAPES[char] || `\\${char}`
  );
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
    ['year', oneLine(fields.year)],
    // Braces would close the field early; percent-encoding keeps the URL valid.
    [
      'url',
      oneLine(fields.url).replace(
        /[{}]/g,
        char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
      ),
    ],
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

// Sentence punctuation and closing quotes stay outside the link; a closing
// bracket stays inside when the URL opened it, as in Wikipedia titles.
function trimUrl(url) {
  let href = url;
  for (;;) {
    const last = href.at(-1);
    const unbalanced = (open, close) =>
      href.split(close).length > href.split(open).length;
    if (/[.,;:!?'"\u2019\u201d]/.test(last)) href = href.slice(0, -1);
    else if (last === ')' && unbalanced('(', ')')) href = href.slice(0, -1);
    else if (last === ']' && unbalanced('[', ']')) href = href.slice(0, -1);
    else return href;
  }
}

// Links each URL in place while keeping the copied text identical to the
// rendered text. Trailing sentence punctuation stays outside the link.
// URLs and the title are isolated so that, in right-to-left text, a Latin
// title or URL does not pull the surrounding punctuation out of place.
function appendText(output, text, links) {
  const doc = output.ownerDocument;
  let index = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const href = trimUrl(match[0]);
    if (match.index > index) output.append(text.slice(index, match.index));
    const url = doc.createElement(links ? 'a' : 'span');
    if (links) url.href = href;
    url.dir = 'ltr';
    url.textContent = href;
    output.append(url);
    index = match.index + href.length;
  }
  if (index < text.length) output.append(text.slice(index));
}

function renderCitation(output, citation, links = true) {
  const { text, titleRange } = citation;
  output.replaceChildren();
  if (!titleRange) {
    appendText(output, text, links);
    return;
  }
  const [start, end] = titleRange;
  const title = output.ownerDocument.createElement('bdi');
  title.textContent = text.slice(start, end);
  appendText(output, text.slice(0, start), links);
  output.append(title);
  appendText(output, text.slice(end), links);
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
        layout: element.dataset.mgCiteThisLayout,
        ...extra,
      },
    })
  );
}

// Fixed English labels for the UNDRR click tracker, which otherwise reports
// visible text: the citation itself, or a translated label.
const REGION = 'data-vf-google-analytics-region';
function track(node, action) {
  node.dataset.vfAnalyticsLabel = `Cite this: ${action}`;
}

function createFallback(element) {
  const doc = element.ownerDocument;
  const t = citeThisStrings(languageOf(element));
  const fallback = doc.createElement('details');
  fallback.className = 'mg-cite-this__fallback';
  const summary = doc.createElement('summary');
  summary.className = 'mg-cite-this__summary';
  summary.textContent = element.dataset.mgCiteThisLabel || t.label;
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
  copy.textContent = element.dataset.mgCiteThisCopyLabel || t.copy;
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
    // The ready flag also stops a second copy of this module, such as a
    // versioned and a latest/ build on one page, from enhancing it twice.
    if (instances.has(element) || 'mgCiteThisReady' in element.dataset)
      continue;
    const existing = element.querySelector('details.mg-cite-this__fallback');
    const generated = !existing && element.childElementCount === 0;
    const fallback = generated ? createFallback(element) : existing;
    const output = fallback?.querySelector('[data-mg-cite-this-text]');
    const summary = fallback?.querySelector('summary');
    const content = fallback?.querySelector('.mg-cite-this__content');
    if (!fallback || !summary || !content || !output) continue;

    const doc = element.ownerDocument;
    const t = citeThisStrings(languageOf(element));
    const citation = resolveCitation(element);
    renderCitation(output, citation);
    element.dataset.mgCiteThisSource = citation.source;
    const dialog = doc.createElement('dialog');
    element.dataset.mgCiteThisReady = '';
    const regionSet = !element.hasAttribute(REGION);
    if (regionSet) element.setAttribute(REGION, 'cite-this');
    if (typeof dialog.showModal !== 'function') {
      // Without dialog support the disclosure stays, with copying enabled.
      element.dataset.mgCiteThisLayout = 'disclosure';
      const fallbackCopy = content.querySelector('[data-mg-cite-this-copy]');
      const fallbackStatus = content.querySelector(
        '[data-mg-cite-this-status]'
      );
      let fallbackTimer;
      const onFallbackCopy = async () => {
        let message;
        try {
          await navigator.clipboard.writeText(citation.text);
          message = element.dataset.mgCiteThisCopiedLabel || t.copied;
          emit(element, 'copy', citation, { placement: 'disclosure' });
        } catch {
          message = element.dataset.mgCiteThisFailedLabel || t.failed;
          emit(element, 'copy-error', citation, {
            target: 'citation',
            placement: 'disclosure',
          });
        }
        if (!fallbackStatus) return;
        fallbackStatus.textContent = message;
        clearTimeout(fallbackTimer);
        fallbackTimer = setTimeout(() => {
          fallbackStatus.textContent = '';
        }, 3000);
      };
      if (fallbackCopy) {
        track(fallbackCopy, 'Copy citation (disclosure)');
        fallbackCopy.hidden = false;
        fallbackCopy.addEventListener('click', onFallbackCopy);
      }
      instances.set(element, () => {
        clearTimeout(fallbackTimer);
        if (fallbackCopy) {
          fallbackCopy.removeEventListener('click', onFallbackCopy);
          fallbackCopy.hidden = true;
          delete fallbackCopy.dataset.vfAnalyticsLabel;
        }
        if (regionSet) element.removeAttribute(REGION);
        if (generated) fallback.remove();
      });
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
      element.dataset.mgCiteThisCloseLabel || t.close
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
    if (copy) {
      copy.hidden = false;
      track(copy, 'Copy citation (dialog)');
    }
    for (const link of dialogContent.querySelectorAll(
      '[data-mg-cite-this-text] a'
    )) {
      track(link, 'Citation link');
    }
    track(close, 'Close');
    let copyUrl;
    if (copy && element.dataset.mgCiteThisCopyUrl !== 'false') {
      copyUrl = doc.createElement('button');
      copyUrl.type = 'button';
      copyUrl.className = 'mg-cite-this__copy mg-cite-this__copy-url';
      copyUrl.textContent = element.dataset.mgCiteThisCopyUrlLabel || t.copyUrl;
      track(copyUrl, 'Copy citation URL');
      copy.after(copyUrl);
    }
    const exports = exportFormats(element, citation).map(format => {
      const { extension, mime, build } = EXPORT_FORMATS[format];
      const link = doc.createElement('a');
      link.className = 'mg-cite-this__export';
      link.href = `data:${mime};charset=utf-8,${encodeURIComponent(
        build(citation.fields)
      )}`;
      link.download = `${fileName(citation.fields.title)}.${extension}`;
      link.textContent =
        element.dataset[
          `mgCiteThis${format === 'ris' ? 'Ris' : 'Bibtex'}Label`
        ] || t[format];
      link.dataset.mgCiteThisFormat = format;
      track(link, `Download ${format === 'ris' ? 'RIS' : 'BibTeX'}`);
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
    element.dataset.mgCiteThisLayout = panel ? 'default' : 'compact';
    const authored = ['role', 'aria-labelledby'].map(name => [
      name,
      element.getAttribute(name),
    ]);
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
      // The visible citation stays in the accessible name (WCAG 2.5.3); the
      // hidden prefix says what pressing it does.
      const previewAction = doc.createElement('span');
      previewAction.className = 'mg-u-sr-only';
      previewAction.textContent = `${
        element.dataset.mgCiteThisCopyLabel || t.copy
      }: `;
      const previewIcon = doc.createElement('span');
      previewIcon.className = 'mg-icon mg-icon-file-alt';
      previewIcon.setAttribute('aria-hidden', 'true');
      previewText = doc.createElement('span');
      previewText.className = 'mg-cite-this__preview-text';
      renderCitation(previewText, citation, false);
      const copyIcon = doc.createElement('span');
      copyIcon.className = 'mg-icon mg-icon-clone';
      copyIcon.setAttribute('aria-hidden', 'true');
      preview.append(previewIcon, previewAction, previewText, copyIcon);
      track(preview, 'Copy citation (field)');

      previewStatus = doc.createElement('span');
      previewStatus.className = 'mg-u-sr-only';
      previewStatus.setAttribute('role', 'status');
      previewStatus.setAttribute('aria-live', 'polite');

      trigger.textContent = element.dataset.mgCiteThisMoreLabel || t.more;
      trigger.classList.add('mg-cite-this__more');
      track(trigger, 'All citation options');
      wrapper.append(label, preview, previewStatus, trigger);
      element.append(wrapper, dialog);
    } else {
      track(trigger, 'Open');
      element.append(trigger, dialog);
    }
    fallback.hidden = true;

    let statusTimer;
    let previewTimer;
    // `trigger` is a person opening the dialog; `copy-error` is the dialog
    // opening itself after a failed copy from the field.
    const openDialog = placement => {
      dialog.showModal();
      title.focus();
      emit(element, 'open', citation, { placement });
    };
    const onOpen = () => openDialog('trigger');
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
          target: eventName === 'copy' ? 'citation' : 'url',
          placement: 'dialog',
        });
      }
    };
    const onCopy = () =>
      copyText(
        citation.text,
        element.dataset.mgCiteThisCopiedLabel || t.copied,
        element.dataset.mgCiteThisFailedLabel || t.failed,
        'copy'
      );
    // The citation's own locator, not a shortlink, so the copied link lasts.
    const onCopyUrl = () =>
      copyText(
        citation.url,
        element.dataset.mgCiteThisUrlCopiedLabel || t.urlCopied,
        element.dataset.mgCiteThisUrlFailedLabel || t.urlFailed,
        'copy-url'
      );
    const onPreviewCopy = async () => {
      const message = element.dataset.mgCiteThisCopiedLabel || t.copied;
      try {
        await navigator.clipboard.writeText(citation.text);
        emit(element, 'copy', citation, { placement: 'field' });
      } catch {
        // The field is a button, so open the dialog where the citation is
        // selectable text and explain there.
        emit(element, 'copy-error', citation, {
          target: 'citation',
          placement: 'field',
        });
        openDialog('copy-error');
        announce(element.dataset.mgCiteThisFailedLabel || t.failed, 5000);
        return;
      }
      previewText.textContent = message;
      previewStatus.textContent = message;
      clearTimeout(previewTimer);
      previewTimer = setTimeout(() => {
        renderCitation(previewText, citation, false);
        previewStatus.textContent = '';
      }, 3000);
    };
    const onDialogClick = event => {
      const format = event.target.closest('[data-mg-cite-this-format]')?.dataset
        .mgCiteThisFormat;
      if (format) {
        emit(element, 'export', citation, { format, placement: 'dialog' });
      } else if (event.target.closest('[data-mg-cite-this-text] a')) {
        emit(element, 'visit', citation, { placement: 'dialog' });
      }
    };
    trigger.addEventListener('click', onOpen);
    dialogContent.addEventListener('click', onDialogClick);
    close.addEventListener('click', closeDialog);
    dialog.addEventListener('close', onClose);
    copy?.addEventListener('click', onCopy);
    copyUrl?.addEventListener('click', onCopyUrl);
    preview?.addEventListener('click', onPreviewCopy);
    instances.set(element, () => {
      // Close first, while the close handler still returns focus.
      if (dialog.open) dialog.close();
      clearTimeout(statusTimer);
      clearTimeout(previewTimer);
      trigger.removeEventListener('click', onOpen);
      close.removeEventListener('click', closeDialog);
      dialog.removeEventListener('close', onClose);
      copy?.removeEventListener('click', onCopy);
      copyUrl?.removeEventListener('click', onCopyUrl);
      dialogContent.removeEventListener('click', onDialogClick);
      preview?.removeEventListener('click', onPreviewCopy);
      wrapper?.remove();
      if (regionSet) element.removeAttribute(REGION);
      for (const [name, value] of authored) {
        if (value === null) element.removeAttribute(name);
        else element.setAttribute(name, value);
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
    if (!instances.has(element)) continue;
    instances.get(element)();
    instances.delete(element);
    delete element.dataset.mgCiteThisReady;
    delete element.dataset.mgCiteThisLayout;
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
