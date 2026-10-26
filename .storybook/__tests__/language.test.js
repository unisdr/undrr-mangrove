import { applyLanguage, resolveLanguage } from '../language';

describe('Storybook language contract', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('lang');
    document.documentElement.removeAttribute('dir');
    delete window.UNDRR;
  });

  it('keeps Arabic RTL even when a bookmarked override says ltr', () => {
    expect(resolveLanguage({ locale: 'arabic', addonRtl: 'ltr' })).toEqual({
      locale: 'arabic',
      lang: 'ar',
      dir: 'rtl',
    });
  });

  it('applies the manual RTL override without changing language or unrelated runtime data', () => {
    document.body.innerHTML = '<div id="storybook-root"></div>';
    const canvas = document.createElement('section');
    window.UNDRR = { existing: 'preserved' };
    applyLanguage({ locale: 'japanese', addonRtl: 'rtl' }, canvas);
    for (const element of [
      document.documentElement,
      document.getElementById('storybook-root'),
      canvas,
    ]) {
      expect(element.lang).toBe('ja');
      expect(element.dir).toBe('rtl');
    }
    expect(window.UNDRR).toEqual({
      existing: 'preserved',
      langCode: 'japanese',
      dir: 'rtl',
    });
    applyLanguage({ locale: 'japanese', addonRtl: 'ltr' }, canvas);
    expect(canvas.dir).toBe('ltr');
    expect(window.UNDRR.dir).toBe('ltr');
  });

  it('supports docs-only documents and defaults without a story canvas', () => {
    applyLanguage({ locale: 'arabic' });
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    applyLanguage({});
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(window.UNDRR.langCode).toBe('english');
  });

  it('preserves unknown locale names while using the existing English language fallback', () => {
    applyLanguage({ locale: 'unknown' });
    expect(document.documentElement.lang).toBe('en');
    expect(window.UNDRR.langCode).toBe('unknown');
  });
  it('does not let a stale embedded docs canvas overwrite newer document globals', () => {
    document.body.innerHTML = '<div id="storybook-root"></div>';
    const canvas = document.createElement('section');
    applyLanguage({ locale: 'english', addonRtl: 'rtl' });
    applyLanguage({ locale: 'english', addonRtl: 'ltr' }, canvas, {
      previewDocument: false,
    });
    expect(canvas.dir).toBe('ltr');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.getElementById('storybook-root').dir).toBe('rtl');
    expect(window.UNDRR).toEqual({ langCode: 'english', dir: 'rtl' });
  });
});
