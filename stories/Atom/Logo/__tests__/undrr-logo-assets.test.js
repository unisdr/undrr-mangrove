import { getUndrrLogoAsset } from '../undrr-logo-assets';

describe('getUndrrLogoAsset', () => {
  it('returns the English default for the English locale', () => {
    const asset = getUndrrLogoAsset('english', 'blue');
    expect(asset.translated).toBe(false);
    expect(asset.lang).toBeUndefined();
  });

  it('returns a translated PNG (with its real dimensions) when the locale/color combination is published', () => {
    const asset = getUndrrLogoAsset('arabic', 'blue');
    expect(asset).toEqual({
      src: 'https://assets.undrr.org/logos/undrr/undrr-logo-ar-blue.png',
      lang: 'ar',
      width: 1313,
      height: 487,
      translated: true,
    });
  });

  it('falls back to the English default for a locale with no asset at all', () => {
    const asset = getUndrrLogoAsset('japanese', 'blue');
    expect(asset.translated).toBe(false);
    expect(asset.lang).toBeUndefined();
  });

  it('falls back to the English default when the color is not published for that locale', () => {
    const asset = getUndrrLogoAsset('chinese', 'blue');
    expect(asset.translated).toBe(false);
  });

  it('resolves the Spanish white variant as an SVG', () => {
    const asset = getUndrrLogoAsset('spanish', 'white');
    expect(asset).toEqual({
      src: 'https://assets.undrr.org/logos/undrr/undrr-logo-es-white.svg',
      lang: 'es',
      width: 971,
      height: 387,
      translated: true,
    });
  });

  it('resolves the Arabic/French/Russian/Chinese white variants as SVGs', () => {
    expect(getUndrrLogoAsset('arabic', 'white')).toEqual({
      src: 'https://assets.undrr.org/logos/undrr/undrr-logo-ar-white.svg',
      lang: 'ar',
      width: 1318,
      height: 490,
      translated: true,
    });
    expect(getUndrrLogoAsset('french', 'white').src).toMatch(/\.svg$/);
    expect(getUndrrLogoAsset('russian', 'white').src).toMatch(/\.svg$/);
    expect(getUndrrLogoAsset('chinese', 'white').src).toMatch(/\.svg$/);
  });

  it('keeps black/blue variants as PNGs', () => {
    expect(getUndrrLogoAsset('arabic', 'black').src).toMatch(/\.png$/);
    expect(getUndrrLogoAsset('arabic', 'blue').src).toMatch(/\.png$/);
  });

  it('defaults to the blue color when none is given', () => {
    const asset = getUndrrLogoAsset('russian');
    expect(asset.lang).toBe('ru');
  });

  it('handles an unknown locale value the same as English', () => {
    const asset = getUndrrLogoAsset('klingon', 'blue');
    expect(asset.translated).toBe(false);
  });
});
