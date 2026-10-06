#!/usr/bin/env node
/** Actual builder mask ownership fields. This fixture cannot simulate mask rendering. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment } = require('./mock-kit.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const {
  buildConnector,
} = require('../../../scripts/build-figma-connector.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const identity = (node, key = 'mgKitId') =>
  node.getSharedPluginData('orgundrrmangrove', key);
function installMaskFields(env) {
  // Fresh documented fields only. No paint compositing or raster simulation.
  const create = env.figma.createFrame;
  env.figma.createFrame = () => {
    const n = create();
    n.isMask = false;
    n.maskType = 'ALPHA';
    return n;
  };
}
function fixture() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  d.styles = {
    text: [d.styles.text.find(s => s.id === 'component.body')],
    effect: [],
  };
  const role = (name, type, value) => {
    name = 'component/mask-fixture/' + name;
    d.variables.push({
      id: name.replaceAll('/', '.'),
      name,
      type,
      scopes: type === 'COLOR' ? ['FRAME_FILL'] : ['WIDTH_HEIGHT'],
      values: Object.fromEntries(d.modes.map(m => [m.id, value])),
    });
    return name;
  };
  const width = role('width', 'FLOAT', 200),
    height = role('mask-height', 'FLOAT', 200),
    ownerHeight = role('clip-height', 'FLOAT', 168),
    zero = role('zero', 'FLOAT', 0);
  const opaque = role('opaque', 'COLOR', { r: 0, g: 0, b: 0, a: 1 }),
    transparent = role('transparent', 'COLOR', { r: 0, g: 0, b: 0, a: 0 });
  d.components = {
    version: 1,
    families: [
      {
        id: 'mask-fixture',
        name: 'Mask source candidate',
        kind: 'component-set',
        review: { genericLabels: false },
        variants: [
          {
            id: 'mask-fixture.collapsed',
            name: 'State=Collapsed',
            properties: { State: 'Collapsed' },
            tree: {
              id: 'root',
              type: 'FRAME',
              layout: { mode: 'VERTICAL', width: 200, height: 240 },
              children: [
                {
                  id: 'clip',
                  type: 'FRAME',
                  layout: {
                    mode: 'VERTICAL',
                    width,
                    height: ownerHeight,
                    clipsContent: true,
                  },
                  children: [
                    {
                      id: 'mask',
                      type: 'FRAME',
                      alphaMask: { type: 'ALPHA' },
                      layout: { mode: 'NONE', width, height },
                      absolute: {
                        horizontal: 'START',
                        vertical: 'START',
                        offsetX: zero,
                        offsetY: zero,
                      },
                      gradient: {
                        layers: [
                          {
                            transform: [
                              [0, 1, 0],
                              [-1, 0, 1],
                            ],
                            stops: [
                              { position: 0, color: opaque },
                              { position: 0.6, color: opaque },
                              { position: 1, color: transparent },
                            ],
                          },
                        ],
                      },
                    },
                    {
                      id: 'content',
                      type: 'FRAME',
                      layout: { mode: 'VERTICAL', width: 200, height: 240 },
                      fill: 'color/neutral-0',
                      children: [
                        {
                          id: 'label',
                          type: 'TEXT',
                          characters: 'Genuine editable source content',
                          textProperty: 'Label',
                          textStyle: 'component.body',
                          fill: 'color/neutral-900',
                          layout: { width: 200, height: 'HUG' },
                        },
                      ],
                    },
                  ],
                },
                {
                  id: 'toggle',
                  type: 'TEXT',
                  characters: 'Show more',
                  textStyle: 'component.body',
                  fill: 'color/neutral-900',
                  layout: { width: 'HUG', height: 'HUG' },
                },
              ],
            },
          },
        ],
      },
    ],
  };
  return d;
}
const snapshot = env =>
  JSON.stringify({
    variables: env.state.variables,
    styles: env.state.styles,
    collections: env.state.collections,
    nodes: [...env.state.nodes.values()].map(n => ({
      id: n.id,
      type: n.type,
      parent: n.parent?.id,
      children: n.children.map(c => c.id),
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
      isMask: n.isMask,
      maskType: n.maskType,
      fills: n.fills,
      ledger: identity(n, 'mgAlphaMaskV1'),
      characters: n.type === 'TEXT' ? n.characters : undefined,
    })),
  });
async function setup(d, brand) {
  const env = environment(d, { sharedOnly: true });
  env.state.modeLimit = 5;
  installMaskFields(env);
  installNativeTextPropertyDefaultFixture(env);
  const imported = await env.call(
    'importVariables',
    d,
    d.modes.map(m => m.id),
    false,
    [],
    true
  );
  assert.deepStrictEqual(copy(imported.errors), []);
  const run = doc =>
    env.call('buildMangroveComponents', doc || d, brand, ['mask-fixture'], {
      refreshReview: false,
    });
  return { env, run };
}
async function main() {
  for (const brand of fixture().modes.map(m => m.id)) {
    const d = fixture(),
      { env, run } = await setup(d, brand);
    const first = await run();
    assert.deepStrictEqual(copy(first.errors), []);
    const mask = [...env.state.nodes.values()].find(
      n =>
        identity(n) ===
        'family/mask-fixture/variant/mask-fixture.collapsed/clip/mask'
    );
    assert(mask && mask.isMask && mask.maskType === 'ALPHA');
    assert.equal(mask.parent.type, 'FRAME');
    assert.equal(mask.parent.children[0], mask);
    assert.equal(mask.height, 200);
    assert.equal(mask.parent.height, 168);
    const master = [...env.state.nodes.values()].find(
      n =>
        n.type === 'COMPONENT' &&
        identity(n) === 'family/mask-fixture/variant/mask-fixture.collapsed'
    );
    const label = master
      .findAllWithCriteria({ types: ['TEXT'] })
      .find(n => n.componentPropertyReferences.characters);
    const consumer = master.createInstance();
    env.figma.currentPage.appendChild(consumer);
    const ref = label.componentPropertyReferences.characters;
    consumer.setProperties({ [ref]: 'Preserved consumer copy' });
    const baseline = snapshot(env);
    for (let i = 0; i < 2; i++) {
      const r = await run();
      assert.deepStrictEqual(copy(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      assert.equal(snapshot(env), baseline);
    }
    assert.equal(
      consumer.componentProperties[ref].value,
      'Preserved consumer copy'
    );
    const widthVariable = env.state.variables.find(v =>
      v.name.endsWith('/width')
    );
    const heightVariable = env.state.variables.find(v =>
      v.name.endsWith('/mask-height')
    );
    const duplicate = { ...widthVariable, id: 'wrong-duplicate-width-id' };
    env.state.variables.push(duplicate);
    const nativeMode = env.state.collections[0].modes[0].modeId;
    const priorHeight = heightVariable.valuesByMode[nativeMode];
    heightVariable.valuesByMode[nativeMode] = {
      type: 'VARIABLE_ALIAS',
      id: widthVariable.id,
    };
    const aliasBaseline = snapshot(env),
      aliasResult = await run();
    assert(aliasResult.errors.some(e => /exact identity disagrees/.test(e)));
    assert.equal(snapshot(env), aliasBaseline);
    env.state.variables.pop();
    heightVariable.valuesByMode[nativeMode] = priorHeight;
    // Deliberate existing owned field drift must refuse before style/scene writes.
    mask.maskType = 'VECTOR';
    const drift = snapshot(env);
    const refused = await run();
    assert(refused.errors.some(e => /ALPHA mask/.test(e)));
    assert.equal(refused.createdNodeIds.length, 0);
    assert.equal(snapshot(env), drift);
    mask.maskType = 'ALPHA';
    const loadFont = env.figma.loadFontAsync;
    let changedAfterAwait = false;
    env.figma.loadFontAsync = async font => {
      await loadFont(font);
      if (!changedAfterAwait) {
        changedAfterAwait = true;
        mask.isMask = false;
      }
    };
    const lateResult = await run();
    assert(
      changedAfterAwait &&
        lateResult.errors.some(e => /ALPHA mask owned native fields/.test(e))
    );
    env.figma.loadFontAsync = loadFont;
    mask.isMask = true;
    assert.equal(snapshot(env), baseline);
    const absent = copy(d);
    delete absent.components.families[0].variants[0].tree.children[0]
      .children[0].alphaMask;
    const before = snapshot(env);
    const absentResult = await run(absent);
    assert(absentResult.errors.some(e => /explicit ALPHA or NONE/.test(e)));
    assert.equal(snapshot(env), before);
    const none = copy(d),
      node =
        none.components.families[0].variants[0].tree.children[0].children[0];
    node.alphaMask.type = 'NONE';
    delete node.gradient;
    const reset = await run(none);
    assert.deepStrictEqual(copy(reset.errors), []);
    assert.equal(mask.isMask, false);
    assert.deepStrictEqual(copy(mask.fills), []);
    const resetSnapshot = snapshot(env);
    for (let i = 0; i < 2; i++) {
      const r = await run(none);
      assert.deepStrictEqual(copy(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      assert.equal(snapshot(env), resetSnapshot);
    }
    console.log(
      brand +
        ' actual builder ALPHA/NONE ownership, repeat fields, clipped viewport and drift/absent refusal passed; no raster claim'
    );
  }
  // Preserve the full editable fixture and unchanged transport ceiling.
  // This candidate currently cannot be executed through the cloud connector.
  for (const brand of fixture().modes.map(m => m.id))
    await assert.rejects(
      () =>
        buildConnector({
          operation: 'build',
          doc: fixture(),
          brandId: brand,
          familyIds: ['mask-fixture'],
        }),
      /payload exceeds 50000/
    );
  {
    const doc = fixture();
    const variant = doc.components.families[0].variants[0];
    variant.tree = variant.tree.children[0];
    const { env, run } = await setup(doc, 'undrr'),
      before = snapshot(env);
    const result = await run();
    assert(result.errors.some(e => /nested FRAME/.test(e)));
    assert.equal(snapshot(env), before);
    await assert.rejects(
      () =>
        buildConnector({
          operation: 'build',
          doc,
          brandId: 'undrr',
          familyIds: ['mask-fixture'],
        }),
      /nested FRAME/
    );
  }
  const d = fixture();
  d.variables.find(v => v.name.endsWith('/clip-height')).values.mcr = 201;
  const { env, run } = await setup(d, 'undrr'),
    before = snapshot(env),
    result = await run();
  assert(result.errors.some(e => /cover its clipping owner/.test(e)));
  assert.equal(snapshot(env), before);
  await assert.rejects(
    () =>
      buildConnector({
        operation: 'build',
        doc: d,
        brandId: 'undrr',
        familyIds: ['mask-fixture'],
      }),
    /cover its clipping owner/
  );
  // A valid candidate can exceed the unchanged transport ceiling. Either outcome
  // must preserve the mask capability rather than silently truncate it.
  try {
    const c = await buildConnector({
      operation: 'build',
      doc: fixture(),
      brandId: 'undrr',
      familyIds: ['mask-fixture'],
    });
    assert(c.alphaMaskEnabled);
    assert(c.bytes <= 50000);
  } catch (e) {
    assert(/50000|50,000/.test(e.message), e.message);
  }
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { fixture, installMaskFields };
