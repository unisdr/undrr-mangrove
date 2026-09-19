/** @jest-environment node */

/**
 * Curated AI manifest data for CSS-only components.
 *
 * A CSS-only component has no React props for react-docgen to read, so its
 * detail JSON has no `props`. The curated `cssClasses`, `description` and
 * `examples` are the only machine-readable API, and they drift silently when a
 * modifier is added to the stylesheet (undrr-mangrove#1172).
 */
import fs from 'fs';
import path from 'path';
import { COMPONENT_DATA } from '../ai-manifest/component-data.js';

const ROOT = path.resolve(__dirname, '../..');

const modifiersIn = (scssFile, block) => {
  const scss = fs.readFileSync(path.join(ROOT, scssFile), 'utf8');
  const pattern = new RegExp(`\\.(${block}--[a-z0-9-]+)`, 'g');
  return [...new Set([...scss.matchAll(pattern)].map(m => m[1]))];
};

describe('components-status-label manifest data', () => {
  const data = COMPONENT_DATA['components-status-label'];

  it('lists every modifier the stylesheet ships', () => {
    const modifiers = modifiersIn(
      'stories/Atom/StatusLabel/status-label.scss',
      'mg-status-label'
    );
    expect(modifiers).toEqual(
      expect.arrayContaining([
        'mg-status-label--warning',
        'mg-status-label--negative',
      ])
    );
    expect(data.cssClasses).toEqual(expect.arrayContaining(modifiers));
  });

  it('documents the service health variants with an example', () => {
    expect(data.description).toMatch(/warning/);
    expect(data.description).toMatch(/negative/);
    const html = data.examples.map(e => e.html).join('\n');
    expect(html).toContain('mg-status-label--warning');
    expect(html).toContain('mg-status-label--negative');
  });
});

describe('components-empty-state manifest data', () => {
  const data = COMPONENT_DATA['components-empty-state'];

  it('lists every modifier the stylesheet ships', () => {
    const modifiers = modifiersIn(
      'stories/Atom/EmptyState/empty-state.scss',
      'mg-empty-state'
    );
    expect(modifiers).toEqual(
      expect.arrayContaining([
        'mg-empty-state--panel',
        'mg-empty-state--compact',
        'mg-empty-state--start',
      ])
    );
    expect(data.cssClasses).toEqual(expect.arrayContaining(modifiers));
  });

  it('gives heading-level guidance', () => {
    expect(data.description).toMatch(/heading level|outline/i);
  });

  it('includes h3 and p title examples', () => {
    const titles = data.examples
      .map(e => e.html.match(/<(h[1-6]|p) class="mg-empty-state__title"/))
      .filter(Boolean)
      .map(m => m[1]);
    expect(titles).toContain('h3');
    expect(titles).toContain('p');
  });
});

/**
 * The curated description is what reaches `description` in index.json and in
 * every detail file — it outranks the component's own docblock
 * (undrr-mangrove#1231). `summary` is the short line published beside it, so a
 * description written as a paragraph needs one. `yarn validate-manifest`
 * enforces the same rule against the generated manifest; this keeps the
 * feedback on `yarn test`.
 */
describe('curated descriptions and summaries', () => {
  const SUMMARY_MAX_LENGTH = 200;

  const entries = Object.entries(COMPONENT_DATA).filter(
    ([, data]) => typeof data?.description === 'string'
  );

  it('gives every long description a short summary', () => {
    const missing = entries
      .filter(
        ([, data]) =>
          !data.summary && data.description.length > SUMMARY_MAX_LENGTH
      )
      .map(([id]) => id);
    expect(missing).toEqual([]);
  });

  it('keeps every summary within the summary length', () => {
    const tooLong = entries
      .filter(([, data]) => data.summary?.length > SUMMARY_MAX_LENGTH)
      .map(([id]) => id);
    expect(tooLong).toEqual([]);
  });

  it('documents both icon button classes on the Buttons entry', () => {
    const buttons = COMPONENT_DATA['components-buttons-buttons'];
    expect(buttons.summary).toMatch(/icon button/i);
    expect(buttons.description).toMatch(/\.mg-button--icon/);
    expect(buttons.description).toMatch(/\.mg-icon-button/);
  });
});

/**
 * Lifecycle claims have to match the files on disk.
 *
 * The manifest now says outright whether a component has a vanilla lifecycle
 * module, so a consumer no longer probes /js/ for a 404 to find out
 * (undrr-mangrove#1197). `yarn validate-manifest` enforces this against the
 * generated manifest; this keeps the feedback on `yarn test`.
 */
describe('vanilla lifecycle claims', () => {
  const VANILLA_JS_DIR = path.join(ROOT, 'stories/assets/js');
  const CONTRACT_FIELDS = ['hydration', 'vanillaModule'];

  const modulePaths = contract =>
    Object.values(contract?.modules || {}).map(url => {
      const match = /\/mangrove\/[^/]+\/(.+)$/.exec(String(url));
      return match ? match[1] : String(url);
    });

  it('names only modules that exist under stories/assets/js', () => {
    const missing = [];
    for (const [id, data] of Object.entries(COMPONENT_DATA)) {
      for (const field of CONTRACT_FIELDS) {
        const contract = data?.[field];
        if (!contract || typeof contract !== 'object') continue;
        for (const published of modulePaths(contract)) {
          if (!published.startsWith('js/')) continue;
          const source = path.join(
            VANILLA_JS_DIR,
            published.slice('js/'.length)
          );
          if (!fs.existsSync(source)) missing.push(`${id}: ${published}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('never claims a module and an explanation for having none', () => {
    const contradictory = Object.entries(COMPONENT_DATA)
      .filter(([, data]) => data?.vanillaModule && data?.vanillaModuleNote)
      .map(([id]) => id);
    expect(contradictory).toEqual([]);
  });

  it('gives Drawer a vanilla module contract on its own marker', () => {
    const drawer = COMPONENT_DATA['components-navigation-drawer'];
    expect(modulePaths(drawer.vanillaModule)).toEqual(['js/drawer.js']);
    expect(drawer.vanillaModule.selector).toBe('[data-mg-js-drawer]');
    // Distinct from the hydration marker, so one container is never driven
    // by both lifecycles.
    expect(drawer.hydration.selector).toBe('[data-mg-drawer]');
  });

  it('says why Legend has no module rather than leaving it unstated', () => {
    const legend = COMPONENT_DATA['components-dataviz-legend'];
    expect(legend.vanillaModule).toBeUndefined();
    expect(legend.vanillaModuleNote).toMatch(/none is planned/i);
  });
});
