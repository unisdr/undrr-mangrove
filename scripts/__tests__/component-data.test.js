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
