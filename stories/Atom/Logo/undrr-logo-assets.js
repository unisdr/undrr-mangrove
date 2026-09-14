import logoBlue from '../../assets/images/undrr-logo-blue.svg';
import logoWhite from '../../assets/images/undrr-logo-white.svg';

const ASSET_BASE = 'https://assets.undrr.org/logos/undrr/';

/**
 * Locale keys match Storybook's global `locale` toolbar (.storybook/preview.js
 * `langArr`) and the `locale` prop convention used by other locale-aware
 * Mangrove components (e.g. ArticleStory's `words[locale]`). Each entry lists
 * only the colors actually published at assets.undrr.org/logos/undrr/ for
 * that language, with their real pixel dimensions (verified by downloading
 * and measuring each file — they are NOT proportioned like the English
 * wordmark, see the `crop` warning below). A locale/color combination not
 * listed here (e.g. `arabic` + `white`, or `japanese` entirely) has no
 * translated asset and falls back to the English default for that color.
 */
export const UNDRR_LOGO_LOCALES = {
  arabic: {
    code: 'ar',
    colors: {
      black: { width: 1318, height: 490 },
      blue: { width: 1313, height: 487 },
    },
  },
  spanish: {
    code: 'es',
    colors: {
      black: { width: 971, height: 388 },
      blue: { width: 971, height: 388 },
      white: { width: 971, height: 387 },
    },
  },
  french: {
    code: 'fr',
    colors: {
      black: { width: 971, height: 414 },
      blue: { width: 971, height: 415 },
    },
  },
  russian: {
    code: 'ru',
    colors: {
      black: { width: 971, height: 338 },
      blue: { width: 971, height: 338 },
    },
  },
  chinese: {
    code: 'zh',
    colors: {
      black: { width: 971, height: 339 },
    },
  },
};

const ENGLISH_DEFAULT = {
  blue: { src: logoBlue, lang: undefined, translated: false },
  white: { src: logoWhite, lang: undefined, translated: false },
};

/**
 * Resolves the UNDRR wordmark asset for a locale + color, falling back to
 * the bundled English SVG when no translated asset exists for that exact
 * combination — e.g. `locale="japanese"` (no translation published at all)
 * or `locale="arabic", color="white"` (only black/blue are published). This
 * fallback is what keeps the result safe to use on both light backgrounds
 * (`color: 'blue'`, falls back to black/blue/English) and dark ones
 * (`color: 'white'`, only ever swaps in a real white-on-transparent asset —
 * today that's Spanish only — rather than a low-contrast black/blue image).
 *
 * Translated assets are raster PNGs with different proportions than the
 * English wordmark (~2.3-2.9:1 vs. ~6.6-6.9:1) — do not pair the result
 * with Logo's `crop="autocrop"` variant (see Logo.mdx), and use the
 * returned `width`/`height` rather than a value tuned for the English
 * asset.
 */
export function getUndrrLogoAsset(locale, color = 'blue') {
  const entry = UNDRR_LOGO_LOCALES[locale];
  const dims = entry?.colors[color];
  if (entry && dims) {
    return {
      src: `${ASSET_BASE}undrr-logo-${entry.code}-${color}.png`,
      lang: entry.code,
      width: dims.width,
      height: dims.height,
      translated: true,
    };
  }
  return ENGLISH_DEFAULT[color] || ENGLISH_DEFAULT.blue;
}
