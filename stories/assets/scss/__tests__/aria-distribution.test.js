/** @jest-environment node */
/**
 * Guards the opt-in boundary of the React Aria styling surface.
 * These checks compile Sass so a clean checkout does not need built CSS files.
 */
const path = require('path');
const sass = require('sass');
const { coverage } = require('../../../../scripts/aria-coverage.cjs');

const SCSS = path.resolve(__dirname, '..');
const compile = entry =>
  sass.compile(path.join(SCSS, `${entry}.scss`), {
    loadPaths: [SCSS],
    silenceDeprecations: ['import'],
    logger: sass.Logger.silent,
  }).css;

describe('optional React Aria distribution', () => {
  const surface = compile('aria/_react-aria');
  const comboBox = compile('aria/_combo-box');

  test('normal themes carry neither Aria selectors nor adapter tokens', () => {
    for (const entry of [
      'style',
      'style-preventionweb',
      'style-irp',
      'style-mcr',
      'style-delta',
      'style-all',
    ]) {
      const css = compile(entry);
      expect(css).not.toMatch(/\.react-aria-|--mg-aria-/);
      expect(css).not.toMatch(/\.mg-combobox/);
    }
  });

  test('the optional file excludes Storybook composition rules', () => {
    expect(surface).toMatch(/\.react-aria-Button\b/);
    expect(surface).not.toMatch(/\.aria-(?:crud|gallery|integration|spike)-/);
    expect(surface).not.toMatch(/@layer\b/);
  });

  test('the pilot is scoped to Mangrove classes and semantic control roles', () => {
    expect(comboBox).toMatch(/\.mg-combobox__option\b/);
    expect(comboBox).toMatch(/var\(--mg-control-option-selected\)/);
    expect(comboBox).not.toMatch(/\.react-aria-/);
    for (const brand of ['mangrove', 'preventionweb', 'irp', 'mcr', 'delta']) {
      const tokens = compile(`brand-tokens/_${brand}`);
      expect(tokens).toMatch(/--mg-control-option-selected:/);
      expect(tokens).not.toMatch(/--mg-aria-/);
    }
  });

  test('the adapter refreshes inside each runtime theme class', () => {
    for (const selector of [
      ':root',
      '.mg-theme-preventionweb',
      '.mg-theme-irp',
      '.mg-theme-mcr',
      '.mg-theme-delta',
    ]) {
      expect(surface).toMatch(
        new RegExp(
          `${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^}]*--mg-aria-color-accent:`
        )
      );
    }
  });

  test('stock class coverage keeps its adoption floor', () => {
    const result = coverage(surface);
    expect(result.covered.length).toBeGreaterThanOrEqual(65);
  });
});
