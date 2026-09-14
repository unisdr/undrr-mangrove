import logoBlue from '../../assets/images/undrr-logo-blue.svg';
import logoWhite from '../../assets/images/undrr-logo-white.svg';

const ASSET_BASE = 'https://assets.undrr.org/logos/undrr/';

/**
 * Locale keys match Storybook's `locale` toolbar and the `locale` prop used by
 * other locale-aware Mangrove components. Each listed color maps to the
 * translated asset at assets.undrr.org/logos/undrr/ for that language, with
 * real pixel dimensions for the source file. Unlisted locale/color pairs fall
 * back to the bundled English default for that color.
 */
export const UNDRR_LOGO_LOCALES = {
  arabic: {
    code: 'ar',
    colors: {
      black: { width: 1318, height: 490 },
      blue: { width: 1313, height: 487 },
      white: { width: 1318, height: 490 },
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
      white: { width: 971, height: 414 },
    },
  },
  russian: {
    code: 'ru',
    colors: {
      black: { width: 971, height: 338 },
      blue: { width: 971, height: 338 },
      white: { width: 971, height: 338 },
    },
  },
  chinese: {
    code: 'zh',
    colors: {
      black: { width: 971, height: 339 },
      white: { width: 971, height: 339 },
    },
  },
};

const ENGLISH_DEFAULT = {
  blue: { src: logoBlue, lang: undefined, translated: false },
  white: { src: logoWhite, lang: undefined, translated: false },
};

/**
 * Resolves the UNDRR wordmark asset for a locale + color, falling back to the
 * bundled English SVG when no translated asset exists. Translated assets are
 * raster PNGs with different proportions than the English wordmark, so use
 * the returned `width`/`height` rather than values tuned for the English SVG.
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
