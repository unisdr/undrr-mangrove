#!/usr/bin/env node
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path');
const root = path.resolve(__dirname, '../../..');
const { rangeEnvironment } = require('./mock-rich-text-integration.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const {
  buildFormCompositionRecipes,
} = require('../../../scripts/figma-form-composition-recipes.cjs');
const clone = x => JSON.parse(JSON.stringify(x)),
  identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId'),
  walk = n => [n, ...(n.children || []).flatMap(walk)];
function document() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  const leaves = d.components.families.filter(f =>
    ['checkbox', 'radio'].includes(f.id)
  );
  d.components.families = [
    ...leaves,
    ...buildFormCompositionRecipes({ root, ...d }),
  ];
  return d;
}
function installFormSvgFixture(env, families) {
  const specs = families.flatMap(f =>
    f.variants.flatMap(v => walk(v.tree).filter(n => n.type === 'SVG'))
  );
  const prior = env.figma.createNodeFromSvg;
  env.figma.createNodeFromSvg = markup => {
    const normalize = x => x.replace(/\s+(width|height)=['"][^'"]*['"]/g, '');
    const s = specs.find(s => normalize(s.svg.markup) === normalize(markup));
    if (!s) return prior.call(env.figma, markup);
    const frame = env.figma.createFrame();
    const v = /viewBox=['"]0 0 ([\d.]+) ([\d.]+)['"]/.exec(s.svg.markup);
    frame.resize(+v[1], +v[2]);
    const p = env.figma.createRectangle();
    p.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
    frame.appendChild(p);
    frame.rescale = f => {
      frame.resize(frame.width * f, frame.height * f);
      for (const child of frame.children)
        child.resize(child.width * f, child.height * f);
    };
    frame.name = 'Exact source native-select chevron SVG fixture';
    return frame;
  };
}
const drafts = d => d.components.families.filter(f => f.id.startsWith('form-'));
function sourceDefaults(env, d) {
  for (const f of drafts(d))
    for (const v of f.variants) {
      const key = 'family/' + f.id + '/variant/' + v.id;
      for (const spec of walk(v.tree).filter(n => n.type === 'TEXT')) {
        const nodes = [...env.state.nodes.values()].filter(
          n =>
            n.type === 'TEXT' &&
            identity(n).startsWith(key + '/') &&
            identity(n).endsWith('/' + spec.id) &&
            !ancestorInstance(n)
        );
        assert.equal(nodes.length, 1, key + '/' + spec.id);
        const n = nodes[0];
        assert.equal(n.characters, spec.characters);
        let owner = n.parent;
        while (owner && owner.type !== 'COMPONENT_SET') owner = owner.parent;
        assert.equal(
          owner.componentPropertyDefinitions[
            n.componentPropertyReferences.characters
          ].defaultValue,
          spec.characters
        );
      }
    }
}
function ancestorInstance(n) {
  let p = n.parent;
  while (p) {
    if (p.type === 'INSTANCE') return true;
    p = p.parent;
  }
  return false;
}
async function main() {
  const d = document();
  assert.deepStrictEqual(
    drafts(d).map(f => [f.id, f.variants.length]),
    [
      ['form-group', 12],
      ['form-action', 8],
      ['form-action-newsletter', 8],
    ]
  );
  const before = clone({ variables: d.variables, styles: d.styles });
  buildFormCompositionRecipes({ root, ...d });
  assert.deepStrictEqual({ variables: d.variables, styles: d.styles }, before);
  for (const mode of d.modes) {
    const env = await rangeEnvironment(d);
    installNativeTextPropertyDefaultFixture(env);
    installFormSvgFixture(env, d.components.families);
    await env.call('importVariables', d, [mode.id], false, [], true);
    const run = () =>
      env.call(
        'buildMangroveComponents',
        d,
        mode.id,
        d.components.families.map(f => f.id)
      );
    const first = await run();
    assert.deepStrictEqual(clone(first.errors), []);
    sourceDefaults(env, d);
    const consumers = [];
    for (const f of drafts(d))
      for (const v of f.variants) {
        const key = 'family/' + f.id + '/variant/' + v.id;
        const master = [...env.state.nodes.values()].find(
          n => identity(n) === key
        );
        assert(master);
        assert.equal(master.width, v.sourceGeometry.recorded[mode.id].width);
        assert.equal(master.height, v.sourceGeometry.recorded[mode.id].height);
        assert.equal(master.opacity, 1);
        const resolve = (name, seen = new Set()) => {
          if (typeof name === 'number') return name;
          if (['FILL', 'HUG'].includes(name)) return null;
          assert(!seen.has(name));
          seen.add(name);
          const v = d.variables.find(v => v.name === name);
          assert(v, name);
          const value = v.values[mode.id];
          return value?.alias ? resolve(value.alias, seen) : value;
        };
        for (const spec of walk(v.tree).filter(
          n => n.type === 'FRAME' && n.id !== 'root'
        )) {
          const candidates = master.findAll(
            n => identity(n).endsWith('/' + spec.id) && !ancestorInstance(n)
          );
          assert.equal(candidates.length, 1, spec.id);
          const actual = candidates[0];
          for (const edge of ['width', 'height']) {
            const expected = resolve(spec.layout[edge]);
            if (expected !== null)
              assert.equal(actual[edge], expected, spec.id + '/' + edge);
          }
          assert.equal(actual.opacity, 1);
          if (spec.id.endsWith('-chevron-slot')) {
            const raw = JSON.parse(
              fs.readFileSync(
                path.join(
                  __dirname,
                  '../holistic/assets/form-compositions/source-footprints.json'
                )
              )
            );
            const capture = raw.scenes.find(
              c =>
                c.case === 'action-select-and-continue' &&
                c.mode === mode.id &&
                String(c.viewport.width) === v.properties.SourceViewport
            );
            assert.equal(
              resolve(spec.absolute.offsetX),
              -(6.25 + parseFloat(capture.selectBackground.borderRightWidth))
            );
          }
          if (spec.absolute) {
            assert.equal(
              actual.x,
              spec.absolute.horizontal === 'START'
                ? resolve(spec.absolute.offsetX)
                : actual.parent.width -
                    actual.width +
                    resolve(spec.absolute.offsetX),
              spec.id + '/absolute x'
            );
            assert.equal(
              actual.y,
              spec.absolute.vertical === 'START'
                ? resolve(spec.absolute.offsetY)
                : (actual.parent.height - actual.height) / 2,
              spec.id + '/absolute y'
            );
          }
        }
        for (const spec of walk(v.tree).filter(
          n => n.type === 'TEXT' && n.id.endsWith('-value')
        )) {
          const actual = master.findAll(
            n => identity(n).endsWith('/' + spec.id) && !ancestorInstance(n)
          )[0];
          const paint = resolve(spec.fill);
          assert.deepStrictEqual(clone(actual.fills[0].color), {
            r: paint.r,
            g: paint.g,
            b: paint.b,
          });
        }
        if (f.id === 'form-group') {
          const nested = master.findAll(n => n.type === 'INSTANCE');
          assert.equal(nested.length, 3);
          for (const n of nested) {
            assert(n.main);
            assert.equal(n.height, 40);
          }
        }
        const plain = master.findAll(
          n =>
            n.type === 'TEXT' &&
            !ancestorInstance(n) &&
            n.componentPropertyReferences?.characters
        )[0];
        if (plain) {
          const inst = master.createInstance();
          env.figma.currentPage.appendChild(inst);
          inst.x = 2200;
          inst.y = 2300;
          const ref = plain.componentPropertyReferences.characters;
          const child = inst.findAll(
            n =>
              n.type === 'TEXT' &&
              n.componentPropertyReferences?.characters === ref
          )[0];
          assert(child);
          const descriptor = Object.getOwnPropertyDescriptor(
            child,
            'characters'
          );
          Object.defineProperty(child, 'characters', {
            configurable: true,
            get() {
              return (
                inst.componentProperties[ref]?.value ??
                descriptor.get.call(this)
              );
            },
            set(value) {
              descriptor.set.call(this, value);
            },
          });
          inst.setProperties({ [ref]: 'Edited source form copy' });
          assert(
            inst
              .findAll(n => n.type === 'TEXT')
              .some(n => n.characters === 'Edited source form copy')
          );
          consumers.push({ inst, ref, main: master.id });
        }
      }
    const snapshot = () =>
      JSON.stringify(
        [...env.state.nodes.values()]
          .filter(
            n =>
              identity(n).startsWith('family/form-') ||
              consumers.some(c => n === c.inst)
          )
          .map(n => [
            n.id,
            n.parent?.id,
            n.x,
            n.y,
            n.width,
            n.height,
            n.opacity,
            n.type === 'INSTANCE' ? n.main.id : null,
            n.type === 'TEXT' ? n.characters : null,
            n.type === 'COMPONENT_SET' ? n.componentPropertyDefinitions : null,
          ])
      );
    const snap = snapshot(),
      nodeCount = env.state.nodes.size;
    assert(JSON.parse(snap).length > 150);
    for (let repeat = 0; repeat < 2; repeat++) {
      const r = await run();
      assert.deepStrictEqual(clone(r.errors), []);
      assert.equal(env.state.nodes.size, nodeCount);
      sourceDefaults(env, d);
      assert.equal(snapshot(), snap);
      for (const c of consumers) {
        assert.equal(c.inst.main.id, c.main);
        assert.equal(c.inst.x, 2200);
        assert.equal(c.inst.y, 2300);
        assert.equal(
          c.inst.componentProperties[c.ref].value,
          'Edited source form copy'
        );
      }
    }
    console.log(
      mode.id +
        ' source FormGroup12/action8/Newsletter8 actual builder/defaults/consumer retention/two zero-create repeats passed (offline only)'
    );
  }
  for (const name of ['font-family/text']) {
    const bad = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
      ),
      v = bad.variables.find(v => v.name === name);
    v.values.delta = 'Wrong face';
    const previous = clone({ variables: bad.variables, styles: bad.styles });
    assert.throws(
      () => buildFormCompositionRecipes({ root, ...bad }),
      /font family changed|Captured foundation changed/
    );
    assert.deepStrictEqual(
      { variables: bad.variables, styles: bad.styles },
      previous
    );
  }
  const bad = document();
  const helper = bad.variables.find(v =>
    v.name.startsWith('component/form-composition/')
  );
  helper.type = 'STRING';
  const old = clone({ variables: bad.variables, styles: bad.styles });
  assert.throws(
    () => buildFormCompositionRecipes({ root, ...bad }),
    /Foreign identity type/
  );
  assert.deepStrictEqual({ variables: bad.variables, styles: bad.styles }, old);
  const originalRead = fs.readFileSync;
  for (const suffix of [
    'form-action.scss',
    'form-group.scss',
    'FormGroup.jsx',
    'source-footprints.json',
    'style.css',
    '_Regular.scss',
  ]) {
    fs.readFileSync = function (file, ...args) {
      const bytes = originalRead.call(this, file, ...args);
      return typeof file === 'string' && file.endsWith(suffix)
        ? Buffer.isBuffer(bytes)
          ? Buffer.concat([bytes, Buffer.from('changed')])
          : bytes + 'changed'
        : bytes;
    };
    try {
      assert.throws(document, /recipe needs updating/);
    } finally {
      fs.readFileSync = originalRead;
    }
  }
  const legacy = document();
  legacy.components.families = drafts(legacy).filter(
    f => f.id === 'form-action'
  );
  legacy.components.families[0].variants =
    legacy.components.families[0].variants.filter(
      v =>
        v.properties.SourceViewport === '390' &&
        ['subscribe', 'select-and-continue'].includes(v.properties.Source)
    );
  for (const v of legacy.components.families[0].variants)
    for (const n of walk(v.tree).filter(n => n.type === 'TEXT'))
      n.textProperty = 'Legacy shared ' + n.id;
  const legacyEnv = await rangeEnvironment(legacy);
  installNativeTextPropertyDefaultFixture(legacyEnv);
  installFormSvgFixture(legacyEnv, legacy.components.families);
  await legacyEnv.call('importVariables', legacy, ['undrr'], false, [], true);
  await legacyEnv.call('buildMangroveComponents', legacy, 'undrr', [
    'form-action',
  ]);
  assert.throws(
    () => sourceDefaults(legacyEnv, legacy),
    assert.AssertionError,
    'Unscoped authored label/value defaults must reproduce native-observed corruption'
  );
  const missing = await rangeEnvironment(d, { rejectedFonts: ['Roboto Bold'] });
  installNativeTextPropertyDefaultFixture(missing);
  installFormSvgFixture(missing, d.components.families);
  await missing.call('importVariables', d, ['undrr'], false, [], true);
  const sceneBefore = [...missing.state.nodes.keys()],
    styleBefore = clone(missing.state.styles);
  const refusal = await missing.call('buildMangroveComponents', d, 'undrr', [
    'form-action',
  ]);
  assert(refusal.errors.some(s => /unavailable/i.test(s)));
  assert.deepStrictEqual([...missing.state.nodes.keys()], sceneBefore);
  assert.deepStrictEqual(clone(missing.state.styles), styleBefore);
  console.log(
    'Staged helper/font/type guards retain caller arrays on refusal. Native input/legend/baseline/semantic/pixel gates remain open.'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document, installFormSvgFixture };
