#!/usr/bin/env node
/** StatusLabel source/API checks. No native SVG renderer or text layout is simulated. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildStatusLabelRecipes,
} = require('../../../scripts/figma-status-label-recipes.cjs');
const copy = v => JSON.parse(JSON.stringify(v));
const id = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const find = (n, name) => n.findAll(c => c.name === name)[0];
function document() {
  const doc = JSON.parse(
    fs.readFileSync(
      root + '/examples/figma-plugin/mangrove-variables.json',
      'utf8'
    )
  );
  doc.components.families = buildStatusLabelRecipes({ root, ...doc });
  return doc;
}
function walk(tree, callback) {
  callback(tree);
  for (const c of tree.children || []) walk(c, callback);
}
function create(doc, options) {
  const env = environment(doc, options),
    exact = new Map();
  for (const v of doc.components.families[0].variants)
    walk(v.tree, n => {
      if (n.type === 'SVG') exact.set(n.svg.assetId, n.svg.markup);
    });
  // The shared SVG mock currently accepts paths from unrelated exact assets,
  // not rounded rectangles or polygons. Restrict this temporary viewport/paint
  // fixture to these five generated SVG leaves. This does not infer Figma's
  // actual path bounds, stroke outlines, clipping, AA or SVG import acceptance.
  env.figma.createNodeFromSvg = markup => {
    const known = [...exact.values()].find(
      source =>
        source.replace(/<svg\b([^>]*)>/, (_, attrs) => {
          const [, w, h] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(attrs);
          return `<svg${attrs} width="${w}" height="${h}">`;
        }) === markup
    );
    assert(known, 'Exact SVG fixture must exactly match a source-derived leaf');
    const [, w, h] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(markup);
    const frame = env.figma.createFrame();
    frame.resize(+w, +h);
    const vector = env.figma.createVector();
    vector.resize(+w, +h);
    vector.vectorPaths = [{ windingRule: 'NONZERO', data: 'M0 0' }];
    vector.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1 }];
    vector.strokes = markup.includes('stroke="#666666"')
      ? [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 }, opacity: 1 }]
      : [];
    vector.strokeWeight = 1;
    vector.strokeAlign = 'CENTER';
    frame.appendChild(vector);
    return frame;
  };
  return env;
}
function changed(file, before, after, check) {
  const read = fs.readFileSync;
  let matched = false;
  fs.readFileSync = function (filename, ...args) {
    const value = read.call(this, filename, ...args);
    if (typeof filename !== 'string' || !filename.endsWith(file)) return value;
    const next = value.replace(before, after);
    matched = next !== value;
    return next;
  };
  try {
    check();
    assert(matched, `Mutation missed ${file}`);
  } finally {
    fs.readFileSync = read;
  }
}
const properties = (n, name) =>
  Object.keys(n.componentProperties).find(
    k => k.replace(/#[^#]+$/, '') === name
  );
async function main() {
  const doc = document(),
    family = doc.components.families[0],
    counts = [doc.variables.length, doc.styles.text.length];
  assert.strictEqual(family.variants.length, 7);
  assert.strictEqual(family.review.specimens.length, 7);
  assert.deepStrictEqual(buildStatusLabelRecipes({ root, ...doc }), [family]);
  assert.deepStrictEqual(
    [doc.variables.length, doc.styles.text.length],
    counts
  );
  const vars = new Map(doc.variables.map(v => [v.name, v])),
    value = (name, mode) => {
      const v = vars.get(name).values[mode];
      return v.alias ? value(v.alias, mode) : v;
    };
  const expected = {
    neutral: [14, 14],
    draft: [12.6, 12.6],
    'waiting-information': [17.08, 10.08],
    'waiting-validation': [11.48, 11.48],
    published: [14, 14],
    warning: [16.24, 16.24],
    negative: [13.58, 13.58],
  };
  let svgs = 0;
  for (const variant of family.variants) {
    const slug = variant.id.replace('status-label.', ''),
      g = variant.sourceGeometry;
    assert.deepStrictEqual([g.shapeWidth, g.shapeHeight], expected[slug]);
    assert.strictEqual(g.indicatorSize, 14);
    assert.strictEqual(g.ringWidth, 1);
    assert.strictEqual(
      g.marginInline,
      Number(((14 - g.shapeWidth) / 2).toFixed(8))
    );
    assert.strictEqual(variant.tree.layout.width, 'HUG');
    assert.strictEqual(variant.tree.children[1].characters, 'Published');
    assert.strictEqual(variant.tree.children[1].textProperty, 'Label');
    assert.strictEqual(variant.tree.focusRing, undefined);
    assert.deepStrictEqual(variant.properties, {
      Status: variant.properties.Status,
    });
    walk(variant.tree, n => {
      if (n.type === 'SVG') {
        svgs++;
        assert(n.svg.monochrome.fills);
        assert.strictEqual(n.layout.width, n.layout.height);
        assert.strictEqual(n.svg.assetId.startsWith('status-label-'), true);
      }
    });
    if (g.polygon) {
      assert.strictEqual(variant.tree.children[0].children.length, 2);
      assert(
        variant.tree.children[0].children.every(
          n =>
            n.svg.markup.includes('<polygon') &&
            !n.svg.markup.includes('stroke=')
        )
      );
      const w = g.shapeWidth,
        R = g.ringWidth,
        pts = g.polygon.outer.map(p => p.map(v => (v * w) / 100)),
        inner = pts.map((p, i) =>
          p.map((n, axis) => n + g.polygon.offsets[i][axis] * R)
        );
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i],
          b = pts[(i + 1) % pts.length],
          p = inner[i],
          length = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const distance =
          ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) /
          length;
        assert(
          Math.abs(distance - R) < 1e-5,
          'Source polygon edges are offset uniformly1px'
        );
      }
    }
  }
  assert.strictEqual(svgs, 5);
  for (const mode of doc.modes) {
    assert.strictEqual(value('status-label/indicator-size', mode.id), 14);
    assert.strictEqual(value('status-label/gap', mode.id), 7.5);
    assert.strictEqual(value('status-label/font-size', mode.id), 16);
    for (const name of [
      'neutral',
      'draft',
      'waiting-information',
      'waiting-validation',
      'published',
      'warning',
      'negative',
    ])
      assert.deepStrictEqual(
        value('status-label/indicator/' + name, mode.id),
        value('status-label/indicator/' + name, 'undrr')
      );
  }
  for (const [file, before, after] of [
    [
      '/stories/Atom/StatusLabel/status-label.scss',
      '@include mg-status-label-indicator-size(0.82);',
      '@include mg-status-label-indicator-size(0.84);',
    ],
    [
      '/stories/Atom/StatusLabel/status-label.scss',
      'transform: rotate(45deg);',
      'transform: rotate(30deg);',
    ],
    [
      '/stories/Atom/StatusLabel/status-label.scss',
      '44.63344% 10.73313%',
      '40% 10%',
    ],
    ['/stories/Atom/StatusLabel/status-label.scss', '+ 0.61803 *', '+ 0.8 *'],
    [
      '/stories/Atom/StatusLabel/status-label.scss',
      'background-color: var(--mg-status-label-indicator-border-color);',
      'background-color: red;',
    ],
    [
      '/stories/Atom/StatusLabel/status-label.scss',
      'line-height: 1.5;',
      'line-height: 1.4;',
    ],
    [
      '/stories/Atom/StatusLabel/status-label.scss',
      'flex: 0 0 auto;',
      'flex: 1 1 auto;',
    ],
    [
      '/stories/Atom/StatusLabel/StatusLabel.stories.jsx',
      '{label}',
      '{modifier}',
    ],
    [
      '/stories/assets/scss/_variables.scss',
      '--mg-status-label-gap: var(--mg-spacing-75);',
      '--mg-status-label-gap: var(--mg-spacing-100);',
    ],
    [
      '/stories/assets/scss/_variables.scss',
      '--mg-status-label-indicator-border-width: 1px;',
      '--mg-status-label-indicator-border-width: 2px;',
    ],
    [
      '/stories/assets/fonts/roboto/sass/_Regular.scss',
      'font-weight: 400;',
      'font-weight: 500;',
    ],
  ])
    changed(file, before, after, () =>
      assert.throws(document, /StatusLabel recipe needs updating/)
    );
  console.log(
    'ok  seven source statuses, idempotent roles/style, all-mode aliases, five source-derived SVG leaves and independent uniform polygon ring checks'
  );
  const env = create(doc, {
    sharedOnly: true,
    rejectedFonts: ['Roboto Condensed Regular', 'Roboto Condensed Bold'],
  });
  await importFoundation(env, doc);
  const first = await env.call('buildMangroveComponents', doc, 'undrr', [
    'status-label',
  ]);
  assert.deepStrictEqual(copy(first.errors), []);
  assert.strictEqual(first.families[0].variantIds.length, 7);
  const nativeVars = new Map(env.state.variables.map(v => [v.name, v]));
  for (const v of first.families[0].variantIds) {
    const n = env.state.nodes.get(v.nodeId),
      spec = family.variants.find(s => s.id === v.id),
      slot = find(n, '14px source indicator allocation'),
      label = find(n, 'Status name');
    assert.strictEqual(slot.width, 14);
    assert.strictEqual(slot.height, 14);
    assert.strictEqual(slot.clipsContent, false);
    assert.strictEqual(n.itemSpacing, 7.5);
    assert.deepStrictEqual(copy(label.fontName), {
      family: 'Roboto',
      style: 'Regular',
    });
    assert.strictEqual(label.fontSize, 16);
    assert.deepStrictEqual(copy(label.lineHeight), {
      unit: 'PERCENT',
      value: 150,
    });
    assert.strictEqual(label.textDecoration, 'NONE');
    assert.strictEqual(
      label.fills[0].boundVariables.color.id,
      nativeVars.get('status-label/color').id
    );
    assert.strictEqual(label.characters, 'Published');
    const geometry = spec.sourceGeometry;
    assert.strictEqual(
      spec.sourceLabel,
      family.review.specimens.find(
        s => s.variant.Status === spec.properties.Status
      ).properties.Label
    );
    for (const leaf of slot.children) {
      if (leaf.type === 'ELLIPSE' || leaf.name === 'Rounded source indicator')
        assert.strictEqual(leaf.strokeAlign, 'INSIDE');
      else {
        assert.strictEqual(leaf.type, 'FRAME');
        assert(leaf.findAll(c => c.type === 'VECTOR').length);
        for (const vector of leaf.findAll(c => c.type === 'VECTOR'))
          assert(vector.fills[0].boundVariables.color.id);
      }
    }
    assert.strictEqual(slot.children.length, geometry.polygon ? 2 : 1);
  }
  const sourceReviews = [...env.state.nodes.values()].filter(
    n =>
      n.type === 'INSTANCE' &&
      id(n).startsWith('review/status-label/specimen/source-')
  );
  assert.strictEqual(sourceReviews.length, 7);
  for (const review of sourceReviews) {
    const spec = family.review.specimens.find(
      s => id(review) === `review/status-label/specimen/${s.id}/instance`
    );
    assert(spec);
    assert.strictEqual(
      review.componentProperties[properties(review, 'Label')].value,
      spec.properties.Label
    );
  }
  const consumer = sourceReviews[0];
  consumer.setProperties({
    [properties(consumer, 'Label')]: 'Edited status meaning retained',
  });
  const identities = () =>
    [...env.state.nodes.values()]
      .filter(id)
      .map(n => [id(n), n.id])
      .sort((a, b) => a[0].localeCompare(b[0]));
  const before = identities();
  const repeat = await env.call('buildMangroveComponents', doc, 'undrr', [
    'status-label',
  ]);
  assert.deepStrictEqual(copy(repeat.errors), []);
  assert.strictEqual(repeat.createdNodeIds.length, 0);
  assert.deepStrictEqual(identities(), before);
  assert.strictEqual(
    consumer.componentProperties[properties(consumer, 'Label')].value,
    'Edited status meaning retained'
  );
  console.log(
    'ok  bounded current-schema API build/repeat preserves IDs and edited Label; native SVG viewport/text/ring acceptance is not simulated'
  );
  const missing = create(doc, { rejectedFonts: ['Roboto Regular'] });
  await importFoundation(missing, doc);
  const refused = await missing.call('buildMangroveComponents', doc, 'undrr', [
    'status-label',
  ]);
  assert(refused.errors.length);
  assert(
    ![...missing.state.nodes.values()].some(n =>
      id(n).startsWith('family/status-label')
    )
  );
  console.log(
    'ok  missing exact Regular font blocks source family without partial canonical nodes'
  );
  console.log(
    'StatusLabel mock passed 3 groups. Native pixels, viewport import, wrapping, script routing and grouped contexts remain pending.'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
