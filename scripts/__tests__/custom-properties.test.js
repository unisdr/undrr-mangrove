/** @jest-environment node */

/**
 * The manifest's custom property inventory.
 *
 * A component's custom properties are its theming API, and before
 * undrr-mangrove#1207 they appeared nowhere machine-readable — a consuming
 * team had to grep the compiled CSS for them. The inventory is only worth
 * having if it is right, so this checks the extraction itself against fixed
 * CSS, and then checks the real library in both directions: nothing described
 * that the CSS does not have, and nothing exposed that nobody described.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  collectCustomProperties,
  NOT_PUBLIC,
  OWNERS,
  PROPERTY_DOCS,
} from '../ai-manifest/custom-properties.js';

const ROOT = path.resolve(__dirname, '../..');
const CSS_DIR = path.join(ROOT, 'stories/assets/css');
const compiled = fs.existsSync(path.join(CSS_DIR, 'style.css'));

/** Run the collector over one throwaway bundle of CSS. */
const collectFrom = (css, themeTokens = []) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-custom-props-'));
  try {
    fs.writeFileSync(path.join(dir, 'style.css'), css);
    return collectCustomProperties(dir, themeTokens);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

describe('collectCustomProperties', () => {
  it('separates a property with a default from an input hook', () => {
    const result = collectFrom(`
      .mg-notice { --mg-notice-bg: rebeccapurple; background: var(--mg-notice-bg); }
      .mg-card__icon { color: var(--mg-icon-fg, rgb(var(--mg-color-neutral-700))); }
    `);

    expect(result.byComponent['components-notice-notice']).toEqual([
      {
        name: '--mg-notice-bg',
        type: 'default',
        description: PROPERTY_DOCS['--mg-notice-bg'],
        default: 'rebeccapurple',
      },
    ]);
    expect(result.byComponent['components-cards-icon-card']).toEqual([
      {
        name: '--mg-icon-fg',
        type: 'hook',
        description: PROPERTY_DOCS['--mg-icon-fg'],
        default: 'rgb(var(--mg-color-neutral-700))',
      },
    ]);
  });

  it('takes the default from the plain rule, not from a modifier', () => {
    // .mg-switch--small declares --mg-switch-size first in the real bundle.
    // Reporting 1.125rem as the default would be wrong in both directions:
    // it is neither what an unmodified switch measures nor what a reader can
    // set to get one.
    const result = collectFrom(`
      .mg-switch--small { --mg-switch-size: 1.125rem; }
      .mg-switch__track { inline-size: var(--mg-switch-size, 1.5rem); }
    `);

    expect(result.byComponent['components-forms-checkbox']).toEqual([
      expect.objectContaining({ name: '--mg-switch-size', default: '1.5rem' }),
    ]);
  });

  it('reads a var() fallback that is itself a function call', () => {
    const result = collectFrom(
      '.mg-switch { background: var(--mg-switch-track-overlay--pending, rgb(var(--mg-color-neutral-500) / 0.4)); }'
    );

    expect(result.byComponent['components-forms-checkbox'][0].default).toBe(
      'rgb(var(--mg-color-neutral-500) / 0.4)'
    );
  });

  it('leaves theme tokens to tokens.json', () => {
    const result = collectFrom(
      ':root { --mg-spacing-100: 0.5rem; --mg-card-border-radius: 4px; }',
      ['--mg-spacing-100', '--mg-card-border-radius']
    );

    expect(result.unattributed).toEqual([]);
    expect(result.byComponent).toEqual({});
  });

  it('reports a described property the CSS does not have', () => {
    const result = collectFrom('.mg-notice { color: red; }');

    expect(result.absent).toContain('--mg-notice-bg');
  });

  it('reports an exposed property nothing describes', () => {
    const result = collectFrom('.mg-notice { --mg-notice-invented: 1px; }');

    expect(result.undocumented).toEqual([
      'components-notice-notice: --mg-notice-invented',
    ]);
  });

  it('reports a property no component claims', () => {
    const result = collectFrom('.thing { --mg-unclaimed-thing: 1px; }');

    expect(result.unattributed).toEqual(['--mg-unclaimed-thing']);
  });

  it('says so rather than reporting an empty library when nothing is compiled', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-custom-props-'));
    try {
      expect(collectCustomProperties(dir).skipped).toMatch(/yarn scss/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('authored data', () => {
  it('describes every property it claims, and claims every one it describes', () => {
    const unclaimed = Object.keys(PROPERTY_DOCS).filter(
      name =>
        !Object.values(OWNERS).some(matchers =>
          matchers.some(matcher =>
            matcher.endsWith('-') ? name.startsWith(matcher) : name === matcher
          )
        )
    );

    expect(unclaimed).toEqual([]);
  });

  it('gives a reason for every property held back from the API', () => {
    for (const [name, reason] of Object.entries(NOT_PUBLIC)) {
      expect(typeof reason).toBe('string');
      expect(reason.length).toBeGreaterThan(20);
      expect(PROPERTY_DOCS[name]).toBeUndefined();
    }
  });
});

// The library itself, which needs `yarn scss` to have run. Skipped rather
// than failed without it, the same way the manifest's own CSS class check is.
const describeCompiled = compiled ? describe : describe.skip;

describeCompiled('the compiled library', () => {
  const { buildTokensDictionary } = require('../build-tokens.cjs');
  const result = collectCustomProperties(
    CSS_DIR,
    buildTokensDictionary().tokens.map(token => token.name)
  );

  it('exposes no component property that is undescribed', () => {
    expect(result.undocumented).toEqual([]);
  });

  it('leaves no --mg-* property belonging to nobody', () => {
    expect(result.unattributed).toEqual([]);
  });

  it('describes no property the compiled CSS has dropped', () => {
    expect(result.absent).toEqual([]);
  });

  it('covers every component that exposes properties', () => {
    // A partial rollout reads as "this component has none", which is the
    // failure mode the hydration contracts had before #1194.
    expect(Object.keys(result.byComponent).sort()).toEqual(
      Object.keys(OWNERS).sort()
    );
  });
});
