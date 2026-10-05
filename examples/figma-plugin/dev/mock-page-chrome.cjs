#!/usr/bin/env node
/** Exact source assets and actual builder API repeats. No native geometry claim. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment } = require('./mock-kit.cjs');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const {
  buildPageChromeRecipes,
  SOURCE_HASHES,
  WIDTHS,
} = require('../../../scripts/figma-page-chrome-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = x => JSON.parse(JSON.stringify(x));
function document() {
  const doc = buildFigmaVariables();
  doc.components.families = buildPageChromeRecipes({ root, ...doc });
  return doc;
}
function installPageChromeSvgFixture(env, families) {
  const exact = new Map();
  function walk(node) {
    if (node.svg) exact.set(node.svg.markup, node.svg);
    (node.children || []).forEach(walk);
  }
  families.forEach(f => f.variants.forEach(v => walk(v.tree)));
  const previous = env.figma.createNodeFromSvg.bind(env.figma);
  env.figma.createNodeFromSvg = markup => {
    const source = [...exact.keys()].find(
      m =>
        markup === m ||
        markup.replace(/ width="[^"]+" height="[^"]+"/, '') === m
    );
    if (!source) return previous(markup);
    const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(source);
    assert(box);
    const frame = env.figma.createFrame();
    frame.resize(Number(box[1]), Number(box[2]));
    // Exact bounded markup only. These API shapes do not rasterize source paths.
    const vector = env.figma.createVector();
    vector.resize(frame.width, frame.height);
    vector.vectorPaths = [{ windingRule: 'NONZERO', data: source }];
    const fill = exact.get(source).monochrome?.fills;
    vector.fills = fill
      ? [
          {
            type: 'SOLID',
            color: { r: 1, g: 1, b: 1 },
            opacity: 1,
            visible: true,
          },
        ]
      : [];
    vector.strokes = fill
      ? []
      : [
          {
            type: 'SOLID',
            color: { r: 0, g: 0, b: 0 },
            opacity: 1,
            visible: true,
          },
        ];
    vector.strokeWeight = 2;
    vector.strokeAlign = 'CENTER';
    vector.constraints = { horizontal: 'MIN', vertical: 'MIN' };
    frame.appendChild(vector);
    frame.rescale = scale => {
      frame.resizeWithoutConstraints(frame.width * scale, frame.height * scale);
      vector.resizeWithoutConstraints(
        vector.width * scale,
        vector.height * scale
      );
      vector.strokeWeight *= scale;
    };
    return frame;
  };
}
async function main() {
  const doc = document(),
    families = doc.components.families;
  assert.deepStrictEqual(
    families.map(f => [f.id, f.variants.length]),
    [['page-chrome', 6]]
  );
  assert.deepStrictEqual(
    families[0].variants.map(v => Number(v.properties.Viewport)),
    WIDTHS
  );
  assert.deepStrictEqual(copy(doc), copy(document()));
  for (const variant of families[0].variants) {
    const ids = new Set();
    function walk(n) {
      assert(!ids.has(n.id), n.id);
      ids.add(n.id);
      if (n.type === 'TEXT') assert(n.characters);
      (n.children || []).forEach(walk);
    }
    walk(variant.tree);
    assert.strictEqual(
      variant.tree.layout.width,
      Number(variant.properties.Viewport)
    );
  }
  for (const mode of doc.modes) {
    const env = environment(doc, { sharedOnly: true });
    installPageChromeSvgFixture(env, families);
    await env.call('importVariables', doc, [mode.id], false, [], false);
    const first = await env.call('buildMangroveComponents', doc, mode.id, [
      'page-chrome',
    ]);
    assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
    assert(first.createdNodeIds.length);
    const owned = new Map(
      [...env.state.nodes.values()].map(n => [
        n.getSharedPluginData('orgundrrmangrove', 'mgKitId'),
        n,
      ])
    );
    let positionedChecks = 0;
    function compareFixedGeometry(spec, key, isRoot = false) {
      const node = owned.get(key);
      assert(node, key);
      if (spec.type === 'FRAME' || spec.type === 'SVG') {
        for (const field of ['width', 'height'])
          if (typeof spec.layout[field] === 'number')
            assert(
              Math.abs(node[field] - spec.layout[field]) < 1e-10,
              key + '/' + field
            );
        if (!isRoot && spec.position) {
          assert.strictEqual(node.x, spec.position.x, key + '/x');
          assert.strictEqual(node.y, spec.position.y, key + '/y');
          positionedChecks++;
        }
      }
      (spec.children || []).forEach(child =>
        compareFixedGeometry(child, key + '/' + child.id)
      );
    }
    for (const variant of families[0].variants)
      compareFixedGeometry(
        variant.tree,
        'family/page-chrome/variant/' + variant.id,
        true
      );
    assert(positionedChecks > 100, 'Positioned composition fixture missing');
    const component = env.state.nodes.get(
      first.families[0].variantIds[0].nodeId
    );
    const consumer = component.createInstance();
    env.state.nodes.get(first.reviewRootId).appendChild(consumer);
    const property = Object.keys(consumer.componentProperties).find(k =>
      k.startsWith('Navigation title 1#')
    );
    assert(property);
    consumer.setProperties({ [property]: 'Edited navigation' });
    const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
    const geometryBefore = [...env.state.nodes.values()]
      .map(n => [n.id, n.parent?.id, n.x, n.y, n.width, n.height])
      .sort();
    const before = [...env.state.nodes.values()]
      .filter(identity)
      .map(n => [identity(n), n.id])
      .sort();
    for (let i = 0; i < 2; i++) {
      const again = await env.call('buildMangroveComponents', doc, mode.id, [
        'page-chrome',
      ]);
      assert.strictEqual(again.errors.length, 0, again.errors.join('\n'));
      assert.strictEqual(again.createdNodeIds.length, 0);
      assert.deepStrictEqual(
        [...env.state.nodes.values()]
          .map(n => [n.id, n.parent?.id, n.x, n.y, n.width, n.height])
          .sort(),
        geometryBefore
      );
      assert.deepStrictEqual(
        [...env.state.nodes.values()]
          .filter(identity)
          .map(n => [identity(n), n.id])
          .sort(),
        before
      );
      assert.strictEqual(
        (await consumer.getMainComponentAsync()).id,
        component.id
      );
      assert.strictEqual(
        consumer.componentProperties[property].value,
        'Edited navigation'
      );
    }
  }
  const collision = copy(doc);
  collision.styles.text.find(
    s => s.id === 'component/page-chrome/nav-mobile'
  ).id = 'foreign.chrome';
  assert.throws(
    () => buildPageChromeRecipes({ root, ...collision }),
    /Foreign identity/
  );
  const altered = copy(doc);
  altered.variables.find(v => v.name === 'font-size/400').values.undrr = 20;
  assert.throws(
    () => buildPageChromeRecipes({ root, ...altered }),
    /face\/size/
  );
  const read = fs.readFileSync;
  for (const file of [
    'stories/Patterns/_shared/UndrrChrome.jsx',
    'stories/assets/fonts/roboto-condensed/sass/_Bold.scss',
  ]) {
    fs.readFileSync = (target, ...args) => {
      const value = read(target, ...args);
      return String(target) === path.join(root, file)
        ? Buffer.isBuffer(value)
          ? Buffer.concat([value, Buffer.from('\n// deliberate source drift')])
          : value + '\n// deliberate source drift'
        : value;
    };
    try {
      assert.throws(
        () => buildPageChromeRecipes({ root, ...copy(doc) }),
        /source contract needs updating/
      );
    } finally {
      fs.readFileSync = read;
    }
    assert(SOURCE_HASHES[file]);
  }
  const env = environment(doc, { sharedOnly: true });
  installPageChromeSvgFixture(env, families);
  await env.call('importVariables', doc, ['undrr'], false, [], false);
  env.figma.loadFontAsync = async () => {
    throw new Error('Missing source UI Bold');
  };
  const nodes = env.state.nodes.size,
    styles = env.state.styles.length;
  const refused = await env.call('buildMangroveComponents', doc, 'undrr', [
    'page-chrome',
  ]);
  assert(refused.errors.length);
  assert(refused.errors.join(' ').includes('Missing source UI Bold'));
  assert.strictEqual(env.state.nodes.size, nodes);
  assert.strictEqual(env.state.styles.length, styles);
  console.log(
    'Page chrome: exact six authored closed viewport contracts, all-five builder two zero-create repeats, edited navigation/links, source/font/identity guards passed. Native browser/font/pixel equivalence and open navigation remain unverified.'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { main, installPageChromeSvgFixture };
