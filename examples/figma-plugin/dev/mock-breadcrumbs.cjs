#!/usr/bin/env node
/** Breadcrumbs source/API contracts. The exact SVG fixture does not render ink. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment } = require('./mock-kit.cjs');
const {
  buildBreadcrumbRecipes,
} = require('../../../scripts/figma-breadcrumb-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = v => JSON.parse(JSON.stringify(v));
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  doc.components.families = buildBreadcrumbRecipes({ root, ...doc });
  return doc;
}
function installBreadcrumbSvgFixture(env, family) {
  const specs = family.variants.flatMap(v =>
    v.tree.children
      .filter(n => n.id.startsWith('separator-'))
      .map(n => n.children[0])
  );
  const previous = env.figma.createNodeFromSvg;
  env.state.breadcrumbSvgCalls = [];
  env.figma.createNodeFromSvg = markup => {
    const spec = specs.find(
      s =>
        s.svg.markup === markup.replace(/ width="[\d.]+" height="[\d.]+"/, '')
    );
    if (!spec) return previous(markup);
    // Only these exact source-derived assets are replaced. No arbitrary path,
    // browser baseline, rasterisation or viewport-bound parity is simulated.
    env.state.breadcrumbSvgCalls.push(markup);
    const frame = env.figma.createFrame();
    frame.resize(spec.layout.width, spec.layout.height);
    Object.getPrototypeOf(frame).rescale = function (scale) {
      this.resizeWithoutConstraints(this.width * scale, this.height * scale);
      for (const child of this.children || [])
        child.resizeWithoutConstraints(
          child.width * scale,
          child.height * scale
        );
    };
    const vector = new frame.constructor('VECTOR');
    vector.resize(spec.layout.width, spec.layout.height);
    vector.vectorPaths = [{ windingRule: 'NONZERO', data: 'M0 0' }];
    vector.fills = [
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1, visible: true },
    ];
    vector.strokes = [];
    frame.appendChild(vector);
    return frame;
  };
}
async function main() {
  const doc = document(),
    family = doc.components.families[0];
  const assets = copy({ variables: doc.variables, styles: doc.styles });
  assert.deepStrictEqual(buildBreadcrumbRecipes({ root, ...doc }), [family]);
  assert.deepStrictEqual(
    copy({ variables: doc.variables, styles: doc.styles }),
    assets
  );
  assert.deepStrictEqual(
    family.variants.map(v => v.properties.Color),
    ['Default', 'White']
  );
  for (const mode of doc.modes) {
    for (const style of doc.styles.text.filter(s =>
      s.id.startsWith('component.breadcrumbs.')
    )) {
      assert.strictEqual(style.values[mode.id].fontSize, 16);
      assert.strictEqual(style.values[mode.id].lineHeight.value, 150);
      assert.strictEqual(
        style.values[mode.id].fontName.family,
        'Roboto Condensed'
      );
    }
    const env = environment(doc, { sharedOnly: true });
    installBreadcrumbSvgFixture(env, family);
    const imported = await env.call(
      'importVariables',
      doc,
      [mode.id],
      false,
      [],
      true
    );
    assert.deepStrictEqual(copy(imported.errors), []);
    const first = await env.call('buildMangroveComponents', doc, mode.id, [
      'breadcrumbs',
    ]);
    assert.deepStrictEqual(copy(first.errors), []);
    assert.strictEqual(first.families[0].variantIds.length, 2);
    assert.strictEqual(env.state.breadcrumbSvgCalls.length, 6);
    for (const entry of first.families[0].variantIds) {
      const main = env.state.nodes.get(entry.nodeId),
        spec = family.variants.find(v => v.id === entry.id);
      assert.strictEqual(main.children.length, 7);
      assert.strictEqual(main.paddingTop, 10);
      const labels = main.children.filter(n => n.type === 'TEXT');
      assert.strictEqual(labels.length, 4);
      assert.deepStrictEqual(
        labels.map(n => n.textDecoration),
        ['UNDERLINE', 'UNDERLINE', 'UNDERLINE', 'NONE']
      );
      assert.deepStrictEqual(
        labels.map(n => n.fontName.style),
        ['Regular', 'Regular', 'Regular', 'Bold']
      );
      const paint = env.state.variables.find(
        v =>
          v.name ===
          (spec.properties.Color === 'White' ? 'color/white' : 'color/text')
      );
      for (const label of labels)
        assert.strictEqual(label.fills[0].boundVariables.color.id, paint.id);
      for (const slot of main.children.filter(n => n.type === 'FRAME')) {
        assert.strictEqual(slot.width, 28);
        assert.strictEqual(
          slot.children[0].x,
          Number((10.4 + (5.6 - 5.6 * Math.SQRT2) / 2).toFixed(8))
        );
      }
      const consumer = main.createInstance();
      const key = Object.keys(consumer.componentProperties).find(
        k => k.replace(/#[^#]+$/, '') === 'Current page'
      );
      assert(key);
      const linkKey = Object.keys(consumer.componentProperties).find(
        k => k.replace(/#[^#]+$/, '') === 'Link 2'
      );
      assert(linkKey);
      consumer.setProperties({
        [key]: 'Edited current page',
        [linkKey]: 'Edited ancestor',
      });
      consumer.x = 112;
      consumer.y = 223;
    }
    const owned = () =>
      [...env.state.nodes.values()]
        .filter(n => !n.removed && identity(n))
        .map(n => [identity(n), n.id])
        .sort();
    const before = owned();
    const consumers = [...env.state.nodes.values()].filter(
      n => n.type === 'INSTANCE' && n.x === 112 && n.y === 223
    );
    for (let i = 0; i < 2; i++) {
      const repeat = await env.call('buildMangroveComponents', doc, mode.id, [
        'breadcrumbs',
      ]);
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      assert.deepStrictEqual(owned(), before);
      assert.strictEqual(env.state.breadcrumbSvgCalls.length, 6);
      for (const consumer of consumers) {
        assert(!consumer.removed);
        assert.strictEqual(consumer.x, 112);
        assert.strictEqual(consumer.y, 223);
        const key = Object.keys(consumer.componentProperties).find(
          k => k.replace(/#[^#]+$/, '') === 'Current page'
        );
        assert.strictEqual(
          consumer.componentProperties[key].value,
          'Edited current page'
        );
        const linkKey = Object.keys(consumer.componentProperties).find(
          k => k.replace(/#[^#]+$/, '') === 'Link 2'
        );
        assert.strictEqual(
          consumer.componentProperties[linkKey].value,
          'Edited ancestor'
        );
      }
    }
  }
  console.log(
    'ok  two bounded four-item trails, all-five-brand source bindings, exact SVG API fixtures and two zero-create repeats retaining current-page edits'
  );
  const read = fs.readFileSync;
  for (const [suffix, from, to] of [
    ['breadcrumbs.scss', 'inline-size: 0.35em', 'inline-size: 0.4em'],
    ['Breadcrumbs.jsx', 'aria-current="page"', 'aria-current="step"'],
  ]) {
    fs.readFileSync = function (file, ...args) {
      const text = read.call(this, file, ...args);
      return typeof file === 'string' && file.endsWith(suffix)
        ? text.replace(from, to)
        : text;
    };
    try {
      assert.throws(document, /recipe needs updating/);
    } finally {
      fs.readFileSync = read;
    }
  }
  const broken = document();
  broken.variables.find(v => v.name === 'font-size/300').values.delta = 18;
  assert.throws(
    () => buildBreadcrumbRecipes({ root, ...broken }),
    /equal positive/
  );
  console.log(
    'ok  source anatomy/geometry changes and unequal brand SVG dimensions fail closed; native acceptance pending'
  );
}
module.exports = { installBreadcrumbSvgFixture };
if (require.main === module)
  main().catch(error => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
