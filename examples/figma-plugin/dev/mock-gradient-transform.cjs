#!/usr/bin/env node
/** Mode-resolved affine inputs. This mock does not establish gradient pixels. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment } = require('./mock-kit.cjs');
const helper = require('vm').runInNewContext(
  fs.readFileSync(
    path.join(__dirname, '../kit-gradient-transform.js'),
    'utf8'
  ) + '\nmgGradientTransform',
  {}
);
const connector = require('../../../scripts/build-figma-connector.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
function fixture() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  doc.styles = { text: [], effect: [] };
  const variants = [];
  const role = (name, type, values) => {
    doc.variables.push({
      id: name.replaceAll('/', '.'),
      name,
      type,
      scopes: type === 'COLOR' ? ['FRAME_FILL'] : ['WIDTH_HEIGHT'],
      values,
    });
    return name;
  };
  const per = fn => Object.fromEntries(doc.modes.map(m => [m.id, fn(m)]));
  const start = role(
    'component/gradient-fixture/start',
    'COLOR',
    per(() => ({ r: 0, g: 0.2, b: 0.4, a: 1 }))
  );
  const end = role(
    'component/gradient-fixture/end',
    'COLOR',
    per(() => ({ r: 0, g: 85 / 255, b: 138 / 255, a: 1 }))
  );
  for (const viewport of [390, 1164]) {
    const w = viewport === 390 ? 358 : 1132;
    const prefix = 'component/gradient-fixture/' + viewport;
    const width = role(
      prefix + '/width',
      'FLOAT',
      per(() => w)
    );
    const height = role(
      prefix + '/height',
      'FLOAT',
      per(m => (m.id === 'mcr' ? 126 : 120))
    );
    const rawA = role(
      prefix + '/raw-a',
      'FLOAT',
      per(m => w / (w + (m.id === 'mcr' ? 126 : 120)))
    );
    const a = role(
      prefix + '/a',
      'FLOAT',
      per(() => ({ alias: rawA }))
    );
    const b = role(
      prefix + '/b',
      'FLOAT',
      per(
        m => (m.id === 'mcr' ? 126 : 120) / (w + (m.id === 'mcr' ? 126 : 120))
      )
    );
    const negativeB = role(
      prefix + '/negative-b',
      'FLOAT',
      per(
        m => -(m.id === 'mcr' ? 126 : 120) / (w + (m.id === 'mcr' ? 126 : 120))
      )
    );
    const normalA = w / (w + 120),
      normalB = 120 / (w + 120);
    const leaf = {
      type: 'FRAME',
      id: 'gradient',
      name: 'Source gradient ' + viewport,
      layout: { direction: 'NONE', width, height },
      children: [],
      gradient: {
        layers: [
          {
            transform: [
              [normalA, normalB, 0],
              [-normalB, normalA, normalB],
            ],
            transformVariables: [
              [a, b, null],
              [negativeB, a, b],
            ],
            stops: [
              { position: 0, color: start },
              { position: 1, color: end },
            ],
          },
        ],
      },
    };
    variants.push({
      id: 'gradient-transform-fixture.' + viewport,
      name: 'Viewport=' + viewport,
      properties: { Viewport: String(viewport) },
      tree: {
        type: 'FRAME',
        id: 'root',
        name: 'Gradient owner',
        layout: {
          direction: 'VERTICAL',
          width,
          height,
          itemSpacing: 0,
          paddingTop: 0,
          paddingRight: 0,
          paddingBottom: 0,
          paddingLeft: 0,
        },
        children: [leaf],
      },
    });
  }
  doc.components = {
    version: 1,
    families: [
      {
        id: 'gradient-transform-fixture',
        name: 'Gradient transform fixture',
        kind: 'component-set',
        review: { genericLabels: false },
        variants,
      },
    ],
  };
  return doc;
}
function layer(doc, index = 0) {
  return doc.components.families[0].variants[index].tree.children[0].gradient
    .layers[0];
}
async function imported(doc) {
  const env = environment(doc, { sharedOnly: true });
  env.state.modeLimit = doc.modes.length;
  env.state.fonts.push({ fontName: { family: 'Roboto', style: 'Regular' } });
  const result = await env.call(
    'importVariables',
    doc,
    doc.modes.map(m => m.id),
    false,
    [],
    true
  );
  assert.deepStrictEqual(Array.from(result.errors), []);
  return env;
}
function state(env) {
  return JSON.stringify({
    nodes: [...env.state.nodes.values()].map(n => [
      n.id,
      n.type,
      n.x,
      n.y,
      n.width,
      n.height,
      n.fills,
    ]),
    styles: env.state.styles,
    images: [...env.state.images],
    fonts: [...env.state.loadedFonts],
  });
}
async function main() {
  const doc = fixture();
  const before = JSON.stringify(doc);
  for (const l of [layer(doc), layer(doc, 1)])
    assert(helper.source(doc, l).length >= 4);
  assert.strictEqual(
    JSON.stringify(doc),
    before,
    'Pure validation cannot rewrite input'
  );
  for (const mode of doc.modes) {
    const env = await imported(doc);
    const first = await env.call('buildMangroveComponents', doc, mode.id, [
      'gradient-transform-fixture',
    ]);
    assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
    for (const [i, w] of [
      [0, 358],
      [1, 1132],
    ]) {
      const node = [...env.state.nodes.values()].find(
        n =>
          n.type === 'FRAME' && n.name === 'Source gradient ' + [390, 1164][i]
      );
      const h = mode.id === 'mcr' ? 126 : 120,
        a = w / (w + h),
        b = h / (w + h);
      assert.deepStrictEqual(copy(node.fills[0].gradientTransform), [
        [a, b, 0],
        [-b, a, b],
      ]);
      assert.strictEqual(node.width, w);
      assert.strictEqual(node.height, h);
      assert(
        node.fills[0].gradientStops.every(
          s => s.boundVariables.color.type === 'VARIABLE_ALIAS'
        )
      );
    }
    const recorded = state(env);
    for (let i = 0; i < 2; i++) {
      const repeat = await env.call('buildMangroveComponents', doc, mode.id, [
        'gradient-transform-fixture',
      ]);
      assert.strictEqual(repeat.errors.length, 0, repeat.errors.join('\n'));
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      assert.strictEqual(state(env), recorded);
    }
    const packet = await connector.buildConnector({
      operation: 'build',
      brandId: mode.id,
      familyIds: ['gradient-transform-fixture'],
      doc,
    });
    assert(packet.gradientRolesEnabled && packet.bytes <= 50000);
    const compiled = await env.runCode(packet.code);
    assert.strictEqual(compiled.errors.length, 0, compiled.errors.join('\n'));
    assert.strictEqual(compiled.createdNodeIds.length, 0);
    assert.strictEqual(state(env), recorded);
  }
  for (const corrupt of [
    d => {
      d.variables.find(v => v.name.endsWith('/390/raw-a')).id = 42;
    },
    d => {
      layer(d).transformVariables[0].pop();
    },
    d => {
      layer(d).transformVariables[0][0] = 1;
    },
    d => {
      layer(d).transformVariables[0][0] = '';
    },
    d => {
      layer(d).transform = [
        [0, 0, 0],
        [0, 0, 0],
      ];
    },
    d => {
      layer(d).transformVariables[0][0] = 'missing';
    },
    d => {
      d.variables.find(v => v.name.endsWith('/390/raw-a')).type = 'COLOR';
    },
    d => {
      delete d.variables.find(v => v.name.endsWith('/390/raw-a')).values.mcr;
    },
    d => {
      const v = d.variables.find(v => v.name.endsWith('/390/raw-a'));
      v.values.mcr = { alias: v.name };
    },
    d => {
      d.variables.find(v => v.name.endsWith('/390/raw-a')).values.mcr = {
        alias: 'missing',
      };
    },
    d => {
      d.variables.find(v => v.name.endsWith('/390/raw-a')).values.mcr = {
        alias: 'component/gradient-fixture/390/b',
        extra: true,
      };
    },
    d => {
      d.variables.find(v => v.name.endsWith('/390/raw-a')).values.mcr =
        Infinity;
    },
    d => {
      for (const suffix of ['/raw-a', '/b', '/negative-b'])
        d.variables.find(
          v => v.name === 'component/gradient-fixture/390' + suffix
        ).values.mcr = 0;
    },
  ]) {
    const broken = fixture();
    corrupt(broken);
    assert.throws(
      () => helper.source(broken, layer(broken)),
      /Gradient transform/
    );
    await assert.rejects(
      () =>
        connector.buildConnector({
          operation: 'build',
          familyIds: ['gradient-transform-fixture'],
          doc: broken,
        }),
      /Gradient transform/
    );
    const env = await imported(doc),
      before = state(env);
    const refused = await env.call('buildMangroveComponents', broken, 'undrr', [
      'gradient-transform-fixture',
    ]);
    assert(refused.errors.length);
    assert.strictEqual(
      state(env),
      before,
      'Source refusal precedes scene/style/font writes'
    );
  }
  for (const corrupt of [
    env => {
      env.state.variables
        .find(v => v.name.endsWith('/390/raw-a'))
        .setSharedPluginData('orgundrrmangrove', 'mgId', 'foreign');
    },
    env => {
      const v = env.state.variables.find(v => v.name.endsWith('/390/raw-a'));
      const m = env.state.collections[0].modes.find(m => m.name === 'MCR2030');
      v.valuesByMode[m.modeId] = Infinity;
    },
    env => {
      const v = env.state.variables.find(v => v.name.endsWith('/390/raw-a'));
      const m = env.state.collections[0].modes.find(m => m.name === 'MCR2030');
      v.valuesByMode[m.modeId] = { type: 'VARIABLE_ALIAS', id: v.id };
    },
    env => {
      const v = env.state.variables.find(v => v.name.endsWith('/390/raw-a'));
      const m = env.state.collections[0].modes.find(m => m.name === 'MCR2030');
      v.valuesByMode[m.modeId] = {
        type: 'VARIABLE_ALIAS',
        id: 'foreign-collection-variable',
      };
    },
    env => {
      const m = env.state.collections[0].modes.find(m => m.name === 'MCR2030');
      for (const suffix of ['/raw-a', '/b', '/negative-b'])
        env.state.variables.find(
          v => v.name === 'component/gradient-fixture/390' + suffix
        ).valuesByMode[m.modeId] = 0;
    },
  ]) {
    const env = await imported(doc);
    corrupt(env);
    const before = state(env);
    const result = await env.call('buildMangroveComponents', doc, 'undrr', [
      'gradient-transform-fixture',
    ]);
    assert(result.errors.length);
    assert.strictEqual(
      state(env),
      before,
      'Nonselected native-mode failure precedes writes'
    );
  }
  // Opt-in scope is atomic for permanent scene/style/image construction even
  // when an unrelated valid family precedes the invalid matrix family. Named
  // font preparation belongs to existing preflight and is not scene mutation.
  for (const native of [false, true]) {
    const mixed = fixture();
    const other = copy(mixed.components.families[0]);
    other.id = 'unrelated-gradient-fixture';
    other.name = 'Unrelated valid fixture';
    other.variants = [other.variants[0]];
    other.variants[0].id = other.id + '.390';
    delete other.variants[0].tree.children[0].gradient.layers[0]
      .transformVariables;
    mixed.components.families.unshift(other);
    const env = await imported(mixed);
    if (native) {
      const v = env.state.variables.find(v => v.name.endsWith('/390/raw-a'));
      const m = env.state.collections[0].modes.find(m => m.name === 'MCR2030');
      v.valuesByMode[m.modeId] = Infinity;
    } else
      mixed.components.families[1].variants[0].tree.children[0].gradient.layers[0].transformVariables[0][0] =
        'missing';
    const permanent = () => {
      const snapshot = JSON.parse(state(env));
      delete snapshot.fonts;
      return JSON.stringify(snapshot);
    };
    const before = permanent();
    const result = await env.call('buildMangroveComponents', mixed, 'undrr', [
      other.id,
      'gradient-transform-fixture',
    ]);
    assert(result.errors.length);
    assert.strictEqual(
      permanent(),
      before,
      'Mixed scope refuses all permanent scene/style/image writes'
    );
    assert.strictEqual(result.createdNodeIds.length, 0);
  }
  const subset = connector.subsetDocument(doc, 'build', 'undrr', [
    'gradient-transform-fixture',
  ]);
  assert(
    subset.variables.some(v => v.name.endsWith('/390/raw-a')),
    'Alias closure retained'
  );
  const literal = copy(doc);
  for (const v of literal.components.families[0].variants)
    delete v.tree.children[0].gradient.layers[0].transformVariables;
  const old = await connector.buildConnector({
    operation: 'build',
    familyIds: ['gradient-transform-fixture'],
    doc: literal,
  });
  assert.strictEqual(old.gradientRolesEnabled, false);
  console.log(
    'Gradient matrix roles: source/native all-mode alias and ownership preflight, two zero-create geometry/paint repeats and compiled parity across five brands pass. Native inverse/pixels and live mode repaint remain separate.'
  );
}
module.exports = { fixture, main };
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
