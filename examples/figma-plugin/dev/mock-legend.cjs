#!/usr/bin/env node
'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const {
  buildLegendRecipes,
} = require('../../../scripts/figma-legend-recipes.cjs');
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const clone = x => JSON.parse(JSON.stringify(x));
const walk = n => [n, ...(n.children || []).flatMap(walk)];
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  d.components.families = buildLegendRecipes({ root, ...d });
  return d;
}
async function main() {
  const d = document();
  assert.equal(d.components.families.length, 1);
  assert.equal(d.components.families[0].variants.length, 10);
  const unchanged = clone({ variables: d.variables, styles: d.styles });
  buildLegendRecipes({ root, ...d });
  assert.deepStrictEqual(
    { variables: d.variables, styles: d.styles },
    unchanged
  );
  const propertyDefaults = new Map();
  for (const v of d.components.families[0].variants)
    for (const s of walk(v.tree).filter(n => n.type === 'TEXT')) {
      assert(
        !propertyDefaults.has(s.textProperty) ||
          propertyDefaults.get(s.textProperty) === s.characters
      );
      propertyDefaults.set(s.textProperty, s.characters);
    }
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d);
    installNativeTextPropertyDefaultFixture(env);
    await env.call('importVariables', d, [mode.id], false, [], true);
    const run = () =>
      env.call('buildMangroveComponents', d, mode.id, ['legend']);
    assert.deepStrictEqual(clone((await run()).errors), []);
    const resolve = name => {
      const v = d.variables.find(v => v.name === name);
      assert(v, name);
      const value = v.values[mode.id];
      return value?.alias ? resolve(value.alias) : value;
    };
    function sourceAssertions() {
      for (const v of d.components.families[0].variants) {
        const key = 'family/legend/variant/' + v.id;
        const master = [...env.state.nodes.values()].find(
          n => identity(n) === key
        );
        assert(master);
        assert.equal(master.width, v.sourceGeometry.recorded[mode.id].width);
        assert.equal(master.height, v.sourceGeometry.recorded[mode.id].height);
        for (const spec of walk(v.tree)) {
          const actual =
            spec.id === 'root'
              ? master
              : master.findAll(n => identity(n).endsWith('/' + spec.id))[0];
          assert(actual, spec.id);
          assert.equal(actual.opacity, 1);
          if (spec.type !== 'TEXT') {
            assert.equal(actual.width, resolve(spec.layout.width));
            assert.equal(actual.height, resolve(spec.layout.height));
            if (spec.absolute) {
              assert.equal(actual.x, resolve(spec.absolute.offsetX));
              assert.equal(actual.y, resolve(spec.absolute.offsetY));
            }
            if (spec.fill)
              assert.deepStrictEqual(clone(actual.fills[0].color), {
                r: resolve(spec.fill).r,
                g: resolve(spec.fill).g,
                b: resolve(spec.fill).b,
              });
            if (spec.gradient) {
              assert.equal(actual.fills[0].gradientStops.length, 5);
              assert.deepStrictEqual(
                clone(actual.fills[0].gradientTransform),
                spec.gradient.layers[0].transform
              );
              for (let i = 0; i < 5; i++) {
                const stop = actual.fills[0].gradientStops[i],
                  expected = spec.gradient.layers[0].stops[i];
                assert.equal(stop.position, expected.position);
                assert.deepStrictEqual(
                  clone(stop.color),
                  resolve(expected.color)
                );
                assert(stop.boundVariables.color.id);
              }
            }
          } else {
            assert.equal(actual.characters, spec.characters);
            let owner = actual.parent;
            while (owner && owner.type !== 'COMPONENT_SET')
              owner = owner.parent;
            assert.equal(
              owner.componentPropertyDefinitions[
                actual.componentPropertyReferences.characters
              ].defaultValue,
              spec.characters
            );
          }
        }
      }
    }
    sourceAssertions();
    const master = [...env.state.nodes.values()].find(
      n => identity(n) === 'family/legend/variant/legend.categorical.390'
    );
    const original = master.findAll(
      n => n.type === 'TEXT' && n.characters === 'Disaster Type'
    )[0];
    const ref = original.componentPropertyReferences.characters;
    const consumer = master.createInstance();
    env.figma.currentPage.appendChild(consumer);
    consumer.x = 2200;
    consumer.y = 2300;
    const child = consumer.findAll(
      n =>
        n.type === 'TEXT' && n.componentPropertyReferences?.characters === ref
    )[0];
    assert(child);
    const descriptor = Object.getOwnPropertyDescriptor(child, 'characters');
    Object.defineProperty(child, 'characters', {
      configurable: true,
      get() {
        return (
          consumer.componentProperties[ref]?.value ?? descriptor.get.call(this)
        );
      },
      set(value) {
        descriptor.set.call(this, value);
      },
    });
    consumer.setProperties({ [ref]: 'Edited legend title' });
    const snapshot = () =>
      clone(
        [...env.state.nodes.values()]
          .filter(
            n =>
              identity(n).startsWith('family/legend') ||
              n === consumer ||
              n.parent === consumer
          )
          .map(n => ({
            id: n.id,
            key: identity(n),
            parent: n.parent?.id,
            type: n.type,
            x: n.x,
            y: n.y,
            width: n.width,
            height: n.height,
            opacity: n.opacity,
            fills: n.fills,
            style: n.textStyleId,
            characters: n.type === 'TEXT' ? n.characters : null,
            properties:
              n.type === 'COMPONENT_SET'
                ? n.componentPropertyDefinitions
                : n.type === 'INSTANCE'
                  ? n.componentProperties
                  : null,
          }))
      );
    const before = snapshot(),
      count = env.state.nodes.size;
    assert(before.length > 150);
    for (let i = 0; i < 2; i++) {
      const r = await run();
      assert.deepStrictEqual(clone(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      assert.equal(env.state.nodes.size, count);
      assert.deepStrictEqual(snapshot(), before);
      sourceAssertions();
      assert.equal(
        consumer.componentProperties[ref].value,
        'Edited legend title'
      );
      assert(
        consumer.findAll(
          n => n.type === 'TEXT' && n.characters === 'Edited legend title'
        ).length === 1
      );
    }
    console.log(
      mode.id +
        ' Legend10 source/defaults/paints/gradients/consumer/two zero-create repeats passed (offline only)'
    );
  }
  for (const mutation of [
    ...[
      'foreign',
      {},
      [],
      { family: '', style: 'Regular' },
      { family: 'Roboto Condensed', style: '' },
    ].map(fontName => x => {
      const style = x.styles.text.find(s =>
        s.id.startsWith('component.legend.')
      );
      delete style.type;
      style.values.mcr.fontName = fontName;
    }),
    x => {
      x.variables.find(v => v.name === 'color/red-500').values.delta = {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
      };
    },
    x => {
      x.variables.find(v => v.name.startsWith('component/legend/')).type =
        'STRING';
    },
    x => {
      x.styles.text.find(s =>
        s.id.startsWith('component.legend.')
      ).values.delta = [];
    },
    x => {
      x.styles.text.find(s => s.id.startsWith('component.legend.')).type =
        'EFFECT';
    },
    x => {
      x.styles.effect.push(
        clone(x.styles.text.find(s => s.id.startsWith('component.legend.')))
      );
    },
    x => {
      x.variables.find(v => v.name === 'font-family/ui').values.mcr =
        'Wrong font';
    },
  ]) {
    const bad = document();
    mutation(bad);
    const before = clone({ variables: bad.variables, styles: bad.styles });
    assert.throws(
      () => buildLegendRecipes({ root, ...bad }),
      /Captured foundation changed|Foreign/
    );
    assert.deepStrictEqual(
      { variables: bad.variables, styles: bad.styles },
      before
    );
  }
  const temporary = fs.mkdtempSync(
    path.join(require('os').tmpdir(), 'mangrove-legend-guard-')
  );
  try {
    const asset = 'examples/figma-plugin/holistic/assets/legend/',
      p = JSON.parse(
        fs.readFileSync(path.join(root, asset + 'provenance.json'))
      );
    for (const f of [
      ...Object.keys(p.sourceHashes),
      asset + 'provenance.json',
    ]) {
      fs.mkdirSync(path.dirname(path.join(temporary, f)), { recursive: true });
      fs.copyFileSync(path.join(root, f), path.join(temporary, f));
    }
    for (const f of [
      'stories/Components/DataViz/Legend/Legend.jsx',
      'stories/Components/DataViz/Legend/Legend.stories.jsx',
      'stories/Components/DataViz/Legend/legend.scss',
      'tokens/mangrove.yaml',
      'stories/assets/fonts/roboto-condensed/sass/_Regular.scss',
      'examples/figma-plugin/holistic/assets/content-hub/source-fonts/RobotoCondensed-Bold.woff2',
      asset + 'source-footprints.json',
      asset + 'style.css',
      asset + 'capture.py',
    ]) {
      const file = path.join(temporary, f),
        original = fs.readFileSync(file);
      fs.appendFileSync(file, '\nsource mutation');
      const bad = document(),
        prior = clone({ variables: bad.variables, styles: bad.styles });
      assert.throws(
        () => buildLegendRecipes({ root: temporary, ...bad }),
        /source changed/
      );
      assert.deepStrictEqual(
        { variables: bad.variables, styles: bad.styles },
        prior
      );
      fs.writeFileSync(file, original);
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
  const missing = await rangeEnvironment(d, {
    rejectedFonts: ['Roboto Condensed Bold'],
  });
  installNativeTextPropertyDefaultFixture(missing);
  await missing.call('importVariables', d, ['undrr'], false, [], true);
  const before = clone({
    nodes: [...missing.state.nodes.keys()],
    styles: missing.state.styles,
  });
  const refused = await missing.call('buildMangroveComponents', d, 'undrr', [
    'legend',
  ]);
  assert(refused.errors.some(e => /font/i.test(e)));
  assert.deepStrictEqual(
    clone({
      nodes: [...missing.state.nodes.keys()],
      styles: missing.state.styles,
    }),
    before
  );
  console.log(
    'Legend source native fonts/baselines/raster/reflow/RTL remain open.'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document };
