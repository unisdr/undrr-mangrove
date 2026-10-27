import {
  createLabelResolver,
  getLanguageProps,
  languageFromElement,
  labelsFromElement,
} from '../i18n';
import { withLanguage } from '../../.storybook/withLanguage';

describe('shared UI translation contract', () => {
  const defaults = Object.freeze({ action: 'Continue', help: 'Help' });
  const french = Object.freeze({ action: 'Continuer' });
  const resolve = createLabelResolver(defaults, { en: defaults, fr: french });

  it.each(['fr', 'FR', 'fr-CA', 'fr_CA', ' fr-CA '])(
    'selects %s and fills missing catalogue keys from English',
    lang => expect(resolve(lang)).toEqual({ action: 'Continuer', help: 'Help' })
  );

  it.each([undefined, '', 'de', 'constructor', '__proto__', 'toString'])(
    'falls back safely for %s',
    lang => expect(resolve(lang)).toEqual(defaults)
  );

  it('preserves empty and function overrides, ignores undefined, and does not mutate inputs', () => {
    const help = ({ count }) => `${count} aides`;
    const labels = Object.freeze({ action: '', help, omitted: undefined });
    expect(resolve('fr', labels)).toEqual({ action: '', help });
    expect(resolve('fr', { action: undefined }).action).toBe('Continuer');
    expect(resolve('fr').action).toBe('Continuer');
    expect(resolve().action).toBe('Continue');
  });

  it('keeps language metadata separate from catalogue fallback and explicit direction', () => {
    expect(getLanguageProps('ar-EG')).toEqual({ lang: 'ar-EG', dir: 'rtl' });
    expect(getLanguageProps('FR_ca')).toEqual({ lang: 'FR_ca', dir: 'ltr' });
    expect(getLanguageProps('he-IL')).toEqual({ lang: 'he-IL' });
    expect(getLanguageProps('')).toEqual({ lang: '' });
    expect(getLanguageProps()).toEqual({});
    expect(getLanguageProps('ar', 'ltr')).toEqual({ lang: 'ar', dir: 'ltr' });
    expect(getLanguageProps(undefined, 'auto')).toEqual({ dir: 'auto' });
  });

  it('reads data-lang before the nearest own/ancestor lang, preserving empty boundaries', () => {
    const doc = document.implementation.createHTMLDocument();
    doc.documentElement.lang = 'ar';
    const parent = doc.body.appendChild(doc.createElement('section'));
    parent.lang = 'fr-CA';
    const container = parent.appendChild(doc.createElement('div'));
    expect(languageFromElement(container)).toEqual({ lang: 'fr-CA' });
    container.lang = 'ja';
    expect(languageFromElement(container)).toEqual({ lang: 'ja' });
    container.dataset.lang = 'es';
    expect(languageFromElement(container)).toEqual({ lang: 'es' });
    container.dataset.lang = '';
    expect(languageFromElement(container)).toEqual({ lang: '' });
    delete container.dataset.lang;
    container.lang = '';
    expect(languageFromElement(container)).toEqual({ lang: '' });
    container.removeAttribute('lang');
    parent.removeAttribute('lang');
    expect(languageFromElement(container)).toEqual({ lang: 'ar' });
  });

  it.each([undefined, '', '{', 'null', '[]', '5', '"text"'])(
    'ignores invalid JSON label objects: %s',
    value => {
      const el = document.createElement('div');
      if (value !== undefined) el.dataset.labels = value;
      expect(labelsFromElement(el)).toBeUndefined();
    }
  );

  it('reads JSON labels without dropping intentional empty values', () => {
    const el = document.createElement('div');
    el.dataset.labels = '{"action":"","help":"Aide"}';
    expect(labelsFromElement(el)).toEqual({ action: '', help: 'Aide' });
  });

  it('Storybook forwards locale through lang and preserves explicit args and overrides', () => {
    const Story = () => null;
    const labels = { action: 'Custom' };
    const context = { args: { labels }, globals: { locale: 'arabic' } };
    expect(withLanguage(Story, context).props.args).toEqual({
      lang: 'ar',
      labels,
    });
    expect(
      withLanguage(Story, {
        ...context,
        globals: { locale: 'french', addonRtl: 'rtl' },
      }).props.args
    ).toMatchObject({ lang: 'fr', dir: 'rtl' });
    expect(
      withLanguage(Story, {
        ...context,
        args: { dir: 'ltr' },
        globals: { addonRtl: 'rtl' },
      }).props.args.dir
    ).toBe('ltr');
    expect(
      withLanguage(Story, { ...context, args: { labels, lang: '' } }).props.args
        .lang
    ).toBe('');
    expect(
      withLanguage(Story, { ...context, args: { labels, lang: 'fr' } }).props
        .args.lang
    ).toBe('fr');
  });
});
