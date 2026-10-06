'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment } = require('./mock-kit.cjs');
const { installPageHeaderSvgFixture } = require('./mock-page-header.cjs');
const { buildLogoRecipes } = require('../../../scripts/figma-logo-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = value => JSON.parse(JSON.stringify(value));
const base = () =>
  JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
const key = node => node.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const walk = tree => [tree, ...(tree.children || []).flatMap(walk)];
function document() {
  const d = base(),
    before = copy({ variables: d.variables, styles: d.styles });
  d.components.families = buildLogoRecipes({ root, ...d });
  assert.deepStrictEqual({ variables: d.variables, styles: d.styles }, before);
  return d;
}
function installLogoSvgFixture(env, families) {
  // Reuse the exact-source bounded mock API topology. This does not model SVG
  // paint raster, native path ink bounds or native child overlay acceptance.
  installPageHeaderSvgFixture(env, families);
}
const snapshot = env =>
  [...env.state.nodes.values()]
    .filter(n => key(n).startsWith('family/logo/'))
    .map(n => [
      n.id,
      n.parent?.id,
      key(n),
      n.type,
      n.x,
      n.y,
      n.width,
      n.height,
      n.opacity,
      n.imageHash,
      n.mainComponent?.id,
    ]);
async function main() {
  const d = document(),
    family = d.components.families[0];
  assert.equal(family.id, 'logo');
  assert.equal(family.variants.length, 210);
  const cases = new Set(
    family.variants.map(v =>
      [
        v.properties.Story,
        v.properties.Locale,
        v.properties.SourceViewport,
      ].join('.')
    )
  );
  assert.equal(cases.size, 210);
  assert(
    family.variants.every(
      v => !walk(v.tree).some(t => t.type === 'TEXT' || t.textProperty)
    )
  );
  assert(family.variants.some(v => v.sourceSemantics.objectFit === 'cover'));
  assert(
    family.variants.some(v => v.sourceSemantics.sourceDirection === 'rtl')
  );
  assert(family.variants.some(v => v.tree.children[0].image));
  for (const mode of d.modes) {
    const env = environment(d, { sharedOnly: true });
    installLogoSvgFixture(env, d.components.families);
    const imported = await env.call(
      'importVariables',
      d,
      [mode.id],
      false,
      [],
      true
    );
    assert.deepStrictEqual(copy(imported.errors), []);
    const build = () =>
      env.call('buildMangroveComponents', d, mode.id, ['logo'], {
        refreshReview: false,
      });
    const first = await build();
    assert.deepStrictEqual(copy(first.errors), []);
    assert(first.createdNodeIds.length > 210);
    function authored() {
      for (const v of family.variants) {
        const prefix = 'family/logo/variant/' + v.id;
        const master = [...env.state.nodes.values()].find(
          n => key(n) === prefix
        );
        assert(master && master.type === 'COMPONENT');
        assert.equal(master.width, v.tree.layout.width);
        assert.equal(master.height, v.tree.layout.height);
        assert.equal(master.clipsContent, true);
        assert.equal(master.opacity, 1);
        for (const t of v.tree.children) {
          const n = [...env.state.nodes.values()].find(
            n => key(n) === prefix + '/' + t.id
          );
          assert(n, prefix + '/' + t.id);
          assert.equal(n.width, t.layout.width);
          assert.equal(n.height, t.layout.height);
          assert.equal(n.x, t.position.x);
          assert.equal(n.y, t.position.y);
          if (t.image) assert(n.fills.some(p => p.type === 'IMAGE'));
          if (t.svg) assert(n.findAll(c => c.type === 'VECTOR').length);
        }
      }
    }
    authored();
    const consumers = family.variants.map((v, i) => {
      const master = [...env.state.nodes.values()].find(
        n => key(n) === 'family/logo/variant/' + v.id
      );
      const instance = master.createInstance();
      env.figma.currentPage.appendChild(instance);
      instance.name = 'Own source logo placement ' + i;
      instance.x = 80000 + i * 5;
      instance.y = -1000 - i * 3;
      return {
        instance,
        mainId: master.id,
        name: instance.name,
        x: instance.x,
        y: instance.y,
        width: instance.width,
        height: instance.height,
      };
    });
    const before = snapshot(env);
    assert(before.length > 210);
    const imageCount =
      env.state.images.size ?? Object.keys(env.state.images).length;
    for (let repeat = 0; repeat < 2; repeat++) {
      const report = await build();
      assert.deepStrictEqual(copy(report.errors), []);
      assert.equal(report.createdNodeIds.length, 0);
      authored();
      assert.deepStrictEqual(snapshot(env), before);
      assert.equal(
        env.state.images.size ?? Object.keys(env.state.images).length,
        imageCount
      );
      for (const c of consumers) {
        assert.equal((await c.instance.getMainComponentAsync()).id, c.mainId);
        for (const field of ['name', 'x', 'y', 'width', 'height'])
          assert.equal(c.instance[field], c[field]);
      }
    }
    console.log(
      mode.id +
        ':210 source logo masters, fixed crop owners, stable image cache and linked placements through two zero-create repeats'
    );
  }
  for (const patch of [
    d => {
      d.modes.pop();
    },
    d => {
      d.styles.effect = null;
    },
    d => {
      d.variables = null;
    },
  ]) {
    const bad = base();
    patch(bad);
    const before = copy(bad);
    assert.throws(() => buildLogoRecipes({ root, ...bad }));
    assert.deepStrictEqual(bad, before);
  }
  for (const suffix of [
    'stories/Atom/Logo/logo.scss',
    'stories/Atom/Logo/undrr-logo-assets.js',
    'examples/figma-plugin/holistic/assets/logo/normalized/undrr-logo-blue.svg.0.svg',
    'examples/figma-plugin/holistic/assets/logo/pixel-equivalence-receipt.json',
  ]) {
    const bad = base(),
      before = copy(bad),
      original = fs.readFileSync;
    fs.readFileSync = function (file, ...args) {
      const bytes = original.call(this, file, ...args);
      return typeof file === 'string' && file.endsWith(suffix)
        ? Buffer.concat([Buffer.from(bytes), Buffer.from('\nsource drift')])
        : bytes;
    };
    try {
      assert.throws(
        () => buildLogoRecipes({ root, ...bad }),
        /Logo source changed/
      );
      assert.deepStrictEqual(bad, before);
    } finally {
      fs.readFileSync = original;
    }
  }
}
module.exports = { document, installLogoSvgFixture };
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
