/** Shared locale/direction contract for story canvases and docs-only pages. */
export const LANGUAGE_CODES = {
  english: 'en',
  arabic: 'ar',
  french: 'fr',
  japanese: 'ja',
  russian: 'ru',
  spanish: 'es',
  chinese: 'zh',
};

export const resolveLanguage = ({ locale = 'english', addonRtl } = {}) => ({
  locale,
  lang: LANGUAGE_CODES[locale] || 'en',
  // Preserve the existing additive override and bookmarked addonRtl URLs:
  // Arabic stays RTL; other locales can opt into RTL without changing language.
  dir: locale === 'arabic' || addonRtl === 'rtl' ? 'rtl' : 'ltr',
});

export const applyLanguage = (
  globals,
  canvas,
  { previewDocument = true } = {}
) => {
  const language = resolveLanguage(globals);
  const elements = new Set([
    ...(previewDocument
      ? [document.documentElement, document.getElementById('storybook-root')]
      : []),
    canvas,
  ]);
  elements.forEach(element => {
    element?.setAttribute('lang', language.lang);
    element?.setAttribute('dir', language.dir);
  });
  if (!previewDocument) return;
  window.UNDRR = window.UNDRR || {};
  window.UNDRR.langCode = language.locale;
  window.UNDRR.dir = language.dir;
};
