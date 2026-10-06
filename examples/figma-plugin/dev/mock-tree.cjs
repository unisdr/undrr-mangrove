'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const root = path.resolve(__dirname, '../../..');
const { buildTreeRecipes } = require(root + '/scripts/figma-tree-recipes.cjs');
const { environment } = require('./mock-kit.cjs');
const { installTextThicknessFixture } = require('./mock-text-thickness.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const clone = x => JSON.parse(JSON.stringify(x)),
  id = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function walk(n, prefix = '') {
  const key = prefix + '/' + n.id;
  return [[n, key], ...(n.children || []).flatMap(c => walk(c, key))];
}
function installTreeSvgFixture(env, families) {
  const expected = new Set(
    families.flatMap(f =>
      f.variants.flatMap(v =>
        walk(v.tree)
          .filter(([t]) => t.type === 'SVG')
          .map(([t]) => t.svg.markup)
      )
    )
  );
  const original = env.figma.createNodeFromSvg.bind(env.figma);
  env.figma.createNodeFromSvg = markup => {
    const raw = markup.replace(/ width="[\d.]+" height="[\d.]+"/, '');
    if (!expected.has(raw)) return original(markup);
    const v = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(raw);
    assert(v);
    const frame = env.figma.createFrame(),
      vector = env.figma.createVector();
    frame.resize(+v[1], +v[2]);
    vector.resize(+v[1], +v[2]);
    vector.vectorPaths = [
      { windingRule: 'NONZERO', data: /<path d="([^"]+)"/.exec(raw)[1] },
    ];
    vector.strokeWeight = Number(/stroke-width="([\d.]+)"/.exec(raw)[1]);
    vector.strokeAlign = 'CENTER';
    vector.constraints = { horizontal: 'MIN', vertical: 'MIN' };
    vector.strokes = [
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1, visible: true },
    ];
    vector.fills = [];
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
function document() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  d.components.families = buildTreeRecipes({ root, ...d });
  return d;
}
async function main() {
  const d = document();
  assert(
    d.variables
      .filter(v => v.name.startsWith('component/tree/'))
      .every(v => JSON.stringify(v.scopes) === JSON.stringify(['ALL_SCOPES']))
  );
  assert.equal(d.components.families[0].variants.length, 14);
  const authored = clone({ variables: d.variables, styles: d.styles });
  buildTreeRecipes({ root, ...d });
  assert.deepStrictEqual(
    { variables: d.variables, styles: d.styles },
    authored
  );
  for (const mutate of [
    x => {
      x.variables.find(v => v.name === 'spacing/100').values.irp = 11;
    },
    x => {
      x.variables.push({
        ...clone(x.variables.find(v => v.name === 'font-family/ui')),
        id: 'foreign.ui-font',
      });
    },
    x => {
      x.variables.find(v => v.name.startsWith('component/tree/')).type =
        'STRING';
    },
    x => {
      x.styles.text.find(v => v.id.startsWith('component.tree.')).type =
        'EFFECT';
    },
    x => {
      delete x.styles.text.find(v => v.id.startsWith('component.tree.')).values
        .mcr.fontName;
    },
    x => {
      x.styles.text.find(v =>
        v.id.startsWith('component.tree.')
      ).values.mcr.fontName = [];
    },
    x => {
      x.styles.effect.push(
        clone(x.styles.text.find(v => v.id.startsWith('component.tree.')))
      );
    },
  ]) {
    const bad = clone(d);
    mutate(bad);
    const before = clone({ variables: bad.variables, styles: bad.styles });
    assert.throws(
      () => buildTreeRecipes({ root, ...bad }),
      /foundation|foreign/
    );
    assert.deepStrictEqual(
      { variables: bad.variables, styles: bad.styles },
      before
    );
  }
  const read = fs.readFileSync;
  for (const changed of ['source-footprints.json', 'source-capture.js']) {
    try {
      fs.readFileSync = function (file, ...args) {
        const b = read.call(this, file, ...args);
        return String(file) ===
          root + '/examples/figma-plugin/holistic/assets/tree/' + changed
          ? Buffer.concat([Buffer.from(b), Buffer.from('drift')])
          : b;
      };
      const before = clone({ variables: d.variables, styles: d.styles });
      assert.throws(
        () => buildTreeRecipes({ root, ...d }),
        /source-footprints|source-capture/
      );
      assert.deepStrictEqual(
        { variables: d.variables, styles: d.styles },
        before
      );
    } finally {
      fs.readFileSync = read;
    }
  }
  const defaults = new Map();
  for (const v of d.components.families[0].variants)
    for (const [n] of walk(v.tree))
      if (n.type === 'TEXT') {
        assert(
          !defaults.has(n.textProperty) ||
            defaults.get(n.textProperty) === n.characters
        );
        defaults.set(n.textProperty, n.characters);
      }

  {
    const omitted = clone(d),
      role = omitted.variables.find(
        v => v.name.startsWith('component/tree/') && v.type === 'COLOR'
      );
    assert(role);
    delete role.scopes;
    const env = environment(omitted, { sharedOnly: true });
    const report = await env.call(
      'importVariables',
      omitted,
      ['undrr'],
      false,
      [],
      true
    );
    assert(
      report.errors.some(
        e => e.startsWith(role.name + ':') && e.includes('includes')
      ),
      'Missing native scopes must report import failure'
    );
  }
  for (const mode of d.modes) {
    const env = environment(d, { sharedOnly: true });
    installNativeTextPropertyDefaultFixture(env);
    installTreeSvgFixture(env, d.components.families);
    await installTextThicknessFixture(env);
    assert.deepStrictEqual(
      clone(
        (await env.call('importVariables', d, [mode.id], false, [], true))
          .errors
      ),
      []
    );
    const run = () => env.call('buildMangroveComponents', d, mode.id, ['tree']);
    assert.deepStrictEqual(clone((await run()).errors), []);
    const value = name => {
      const v = d.variables.find(v => v.name === name);
      assert(v, name);
      const x = v.values[mode.id];
      return x?.alias ? value(x.alias) : x;
    };
    const sourceAssertions = () => {
      for (const v of d.components.families[0].variants) {
        const key = 'family/tree/variant/' + v.id,
          master = [...env.state.nodes.values()].find(n => id(n) === key);
        assert(master);
        for (const [t, local] of walk(v.tree)) {
          const n =
            t.id === 'root'
              ? master
              : master.findAll(
                  n => id(n) === key + local.replace('/root', '')
                )[0];
          assert(n, local);
          assert.equal(n.opacity, 1);
          for (const field of ['width', 'height'])
            assert.equal(
              n[field],
              typeof t.layout[field] === 'number'
                ? t.layout[field]
                : value(t.layout[field])
            );
          if (t.absolute) {
            assert.equal(n.x, value(t.absolute.offsetX));
            assert.equal(n.y, value(t.absolute.offsetY));
          }
          if (t.type === 'TEXT') {
            assert.equal(n.characters, t.characters);
            const set = master.parent,
              reference = n.componentPropertyReferences.characters;
            assert.equal(
              set.componentPropertyDefinitions[reference].defaultValue,
              t.characters
            );
            if (t.textDecoration) assert.equal(n.textDecoration, 'UNDERLINE');
            if (t.textDecorationThickness)
              assert.deepStrictEqual(
                clone(n.textDecorationThickness),
                t.textDecorationThickness
              );
          }
          if (t.type === 'FRAME' && t.fill) {
            const c = value(t.fill);
            assert.deepStrictEqual(clone(n.fills[0].color), {
              r: c.r,
              g: c.g,
              b: c.b,
            });
            assert.equal(n.fills[0].opacity, c.a);
            assert(n.boundVariables.cornerRadius);
          }
        }
      }
    };
    sourceAssertions();
    const master = [...env.state.nodes.values()].find(
      n => id(n) === 'family/tree/variant/tree.default-390'
    );
    const consumer = master.createInstance();
    env.figma.currentPage.appendChild(consumer);
    const text = consumer.findAll(n => n.type === 'TEXT')[0],
      property = text.componentPropertyReferences.characters;
    consumer.setProperties({ [property]: 'Edited label' });
    consumer.x = 500;
    consumer.y = 600;
    const geometry = () =>
      clone(
        [...env.state.nodes.values()]
          .filter(n => id(n))
          .map(n => ({
            id: n.id,
            key: id(n),
            parent: n.parent?.id,
            type: n.type,
            x: n.x,
            y: n.y,
            width: n.width,
            height: n.height,
            opacity: n.opacity,
            characters: n.type === 'TEXT' ? n.characters : null,
            main: n.type === 'INSTANCE' ? n.main?.id : null,
            vectorPaths: n.type === 'VECTOR' ? n.vectorPaths : null,
          }))
      );
    const before = geometry();
    assert(before.length > 200);
    for (let i = 0; i < 2; i++) {
      const result = await run();
      assert.deepStrictEqual(clone(result.errors), []);
      assert.equal(result.createdNodeIds.length, 0);
      sourceAssertions();
      assert.deepStrictEqual(geometry(), before);
      assert.equal(
        consumer.componentProperties[property].value,
        'Edited label'
      );
      assert.equal(consumer.main.id, master.id);
    }
    console.log(
      mode.id,
      'Tree14 source/default/paint/owning-box/consumer/two zero-create repeats passed (offline only)'
    );
  }
  for (const mutate of [
    x => {
      x.variables.find(v =>
        v.name.endsWith('default-390/item-sendai/x')
      ).values.mcr = NaN;
    },
    x => {
      const v = x.variables.find(v =>
        v.name.endsWith('default-390/item-sendai/x')
      );
      v.values.mcr = { alias: v.name };
    },
    x => {
      x.variables.find(v => v.name.endsWith('default-390/item-sendai/x')).type =
        'STRING';
    },
    x => {
      const i = x.variables.findIndex(v =>
        v.name.endsWith('default-390/item-sendai/x')
      );
      x.variables.splice(i, 1);
    },
    x => {
      x.variables.find(v =>
        v.name.endsWith('default-390/item-sendai/width')
      ).values.mcr = 0;
    },
  ]) {
    const env = environment(d, { sharedOnly: true });
    installTreeSvgFixture(env, d.components.families);
    await installTextThicknessFixture(env);
    assert.deepStrictEqual(
      clone(
        (await env.call('importVariables', d, ['undrr'], false, [], true))
          .errors
      ),
      []
    );
    const bad = clone(d);
    mutate(bad);
    const state = () =>
      clone({
        nodes: [...env.state.nodes.keys()],
        styles: env.state.styles,
        images: [...env.state.images],
        variables: [...env.state.variables],
      });
    const before = state();
    const report = await env.call('buildMangroveComponents', bad, 'undrr', [
      'tree',
    ]);
    assert(report.errors.length);
    assert.equal(report.createdNodeIds.length, 0);
    assert.deepStrictEqual(state(), before);
  }
  const legacy = clone(d);
  for (const v of legacy.components.families[0].variants)
    for (const [n] of walk(v.tree))
      if (n.type === 'TEXT') n.textProperty = 'Label';
  const old = environment(legacy, { sharedOnly: true });
  installNativeTextPropertyDefaultFixture(old);
  installTreeSvgFixture(old, legacy.components.families);
  await installTextThicknessFixture(old);
  assert.deepStrictEqual(
    clone(
      (await old.call('importVariables', legacy, ['undrr'], false, [], true))
        .errors
    ),
    []
  );
  for (let i = 0; i < 2; i++)
    assert.deepStrictEqual(
      clone(
        (await old.call('buildMangroveComponents', legacy, 'undrr', ['tree']))
          .errors
      ),
      []
    );
  const corrupt = [...old.state.nodes.values()].find(
    n =>
      id(n) ===
      'family/tree/variant/tree.default-390/item-sendai/item-sendai-label'
  );
  assert(corrupt);
  assert.notEqual(
    corrupt.characters,
    'Sendai Framework',
    'legacy shared Label must reproduce master default corruption'
  );
  const missing = environment(d, { sharedOnly: true });
  installTreeSvgFixture(missing, d.components.families);
  await installTextThicknessFixture(missing);
  assert.deepStrictEqual(
    clone(
      (await missing.call('importVariables', d, ['undrr'], false, [], true))
        .errors
    ),
    []
  );
  missing.figma.listAvailableFontsAsync = async () => [];
  const state = () =>
    clone({
      nodes: [...missing.state.nodes.keys()],
      styles: missing.state.styles,
      images: [...missing.state.images],
      variables: [...missing.state.variables],
    });
  const before = state();
  const refusal = await missing.call('buildMangroveComponents', d, 'undrr', [
    'tree',
  ]);
  assert(refusal.errors.length);
  assert.equal(refusal.createdNodeIds.length, 0);
  assert.deepStrictEqual(state(), before);
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { installTreeSvgFixture };
