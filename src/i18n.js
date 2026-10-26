/** Shared mechanics for component-owned UI translation catalogues. */
const DIRECTIONS = {
  en: 'ltr',
  ar: 'rtl',
  es: 'ltr',
  fr: 'ltr',
  ja: 'ltr',
  ru: 'ltr',
  zh: 'ltr',
};

function normalizeLanguage(lang = 'en') {
  return String(lang).trim().toLowerCase().split(/[-_]/)[0];
}

/** Defaults < selected translation < defined explicit overrides. */
export function createLabelResolver(defaultLabels, translations) {
  return (lang, labels) => {
    const language = normalizeLanguage(lang);
    const translated = Object.hasOwn(translations, language)
      ? translations[language]
      : undefined;
    const overrides = Object.fromEntries(
      Object.entries(labels ?? {}).filter(([, value]) => value !== undefined)
    );
    return { ...defaultLabels, ...translated, ...overrides };
  };
}

/** Preserve native metadata; unsupported languages keep inherited direction. */
export function getLanguageProps(lang, dir) {
  const language = normalizeLanguage(lang);
  const inferredDir =
    lang !== undefined && Object.hasOwn(DIRECTIONS, language)
      ? DIRECTIONS[language]
      : undefined;
  const direction = dir === undefined ? inferredDir : dir;
  return {
    ...(lang === undefined ? {} : { lang }),
    ...(direction === undefined ? {} : { dir: direction }),
  };
}

/** Only adapters inspect the container's actual DOM language boundary. */
export function languageFromElement(container) {
  const lang =
    container.dataset.lang ?? container.closest('[lang]')?.getAttribute('lang');
  const dir = container.getAttribute('dir')?.toLowerCase();
  return {
    ...(lang == null ? {} : { lang }),
    ...(['ltr', 'rtl', 'auto'].includes(dir) ? { dir } : {}),
  };
}

/** Optional JSON overrides. Invalid or non-object data is ignored. */
export function labelsFromElement(container) {
  try {
    const labels = JSON.parse(container.dataset.labels);
    return labels && typeof labels === 'object' && !Array.isArray(labels)
      ? labels
      : undefined;
  } catch {
    return undefined;
  }
}
