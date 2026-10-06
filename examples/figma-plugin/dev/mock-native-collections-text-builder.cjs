#!/usr/bin/env node
'use strict';
const assert = require('assert');
const {
  document: source,
  setup: importSetup,
} = require('./mock-native-collections-text-import.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
function document() {
  const d = source();
  d.variables.push({
    id: 'neutral-0',
    name: 'color/neutral-0',
    type: 'COLOR',
    scopes: ['ALL_SCOPES'],
    values: Object.fromEntries(
      d.modes.map(m => [m.id, { r: 1, g: 1, b: 1, a: 1 }])
    ),
  });
  d.nativeCollections.collections[0].variableIds.push('neutral-0');
  for (const v of d.variables) v.scopes = ['ALL_SCOPES'];
  return d;
}
function setup(d) {
  const e = importSetup(d);
  installNativeTextPropertyDefaultFixture(e);
  e.figma.getFontFamilyVariationAxes = () => [];
  const probe = e.figma.createText(),
    proto = Object.getPrototypeOf(probe),
    descriptor = Object.getOwnPropertyDescriptor(proto, 'characters');
  probe.remove();
  // Bounded documented instance-property display, through the actual owning reference.
  Object.defineProperty(proto, 'characters', {
    ...descriptor,
    get() {
      const ref = this.componentPropertyReferences?.characters;
      for (let p = this.parent; p; p = p.parent)
        if (p.type === 'INSTANCE' && ref && Object.hasOwn(p.overrides, ref))
          return p.overrides[ref];
      return descriptor.get.call(this);
    },
  });
  return e;
}
function snapshot(e) {
  return JSON.stringify({
    nodes: [...e.state.nodes.values()].map(n => ({
      id: n.id,
      type: n.type,
      parent: n.parent?.id,
      width: n.width,
      height: n.height,
      x: n.x,
      y: n.y,
      characters: n.type === 'TEXT' ? n.characters : undefined,
      reference: n.componentPropertyReferences,
      properties: n.type === 'INSTANCE' ? n.componentProperties : undefined,
      definitions:
        n.type === 'COMPONENT_SET' ? n.componentPropertyDefinitions : undefined,
      modes: n.explicitVariableModes,
      key: n.getSharedPluginData('orgundrrmangrove', 'mgKitId'),
      ledger: n.getSharedPluginData('orgundrrmangrove', 'mgNativeScenePlan'),
      textStyleId: n.textStyleId,
      fills: n.fills,
    })),
    styles: e.state.styles,
    variables: e.state.variables.map(v => ({
      id: v.id,
      owner: v.variableCollectionId,
      values: v.valuesByMode,
    })),
    collections: e.state.collections.map(c => ({
      id: c.id,
      modes: c.modes,
      ids: c.variableIds,
    })),
  });
}
async function main() {
  const d = document(),
    original = copy(d);
  for (const brand of d.modes) {
    const e = setup(d);
    let r = await e.call(
      'importVariables',
      d,
      d.modes.map(m => m.id),
      false
    );
    assert.deepStrictEqual(copy(r.errors), []);
    r = await e.call('buildMangroveComponents', d, brand.id);
    assert.deepStrictEqual(copy(r.errors), []);
    assert(r.createdNodeIds.length > 5);
    assert.equal(r.nativeCollections.capability, 'plain-text-instances-v1');
    assert.equal(r.nativeCollections.version, 2);
    assert.equal(r.nativeCollections.profile, 'plain-text-instances-v1');
    const nodes = [...e.state.nodes.values()],
      key = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId'),
      label = nodes.find(n => key(n) === 'family/label/variant/label.default'),
      wrapper = nodes.find(
        n => key(n) === 'family/wrapper/variant/wrapper.default'
      );
    assert(label && wrapper);
    const nested = wrapper.children.find(n => n.type === 'INSTANCE');
    assert.equal((await nested.getMainComponentAsync()).id, label.id);
    const nestedText = nested.findAll(n => n.type === 'TEXT')[0];
    assert.equal(nestedText.characters, 'Authored wrapper label');
    const text = label.findAll(n => n.type === 'TEXT')[0];
    assert.equal(text.characters, 'Editable whole label');
    const ref = text.componentPropertyReferences.characters;
    assert.equal(
      label.parent.componentPropertyDefinitions[ref].defaultValue,
      text.characters
    );
    const style = e.state.styles.find(s => s.type === 'TEXT');
    assert(style);
    for (const field of ['fontFamily', 'fontSize']) {
      const binding = style.boundVariables[field];
      assert(binding);
      const v = e.state.variables.find(v => v.id === binding.id);
      assert.equal(
        v.variableCollectionId,
        e.state.collections.find(
          c =>
            JSON.parse(
              c.getSharedPluginData(
                'orgundrrmangrove',
                'mgNativeCollectionPlan'
              )
            ).collectionId === 'layout'
        ).id
      );
    }
    const consumer = wrapper.createInstance();
    e.figma.currentPage.appendChild(consumer);
    const own = consumer.findAll(n => n.type === 'INSTANCE')[0];
    const ownText = own.findAll(n => n.type === 'TEXT')[0],
      ownRef = ownText.componentPropertyReferences.characters;
    own.setProperties({ [ownRef]: 'Retained actual nested consumer copy' });
    assert.equal(ownText.characters, 'Retained actual nested consumer copy');
    for (const c of e.state.collections) {
      const owner = JSON.parse(
        c.getSharedPluginData('orgundrrmangrove', 'mgNativeCollectionPlan')
      ).collectionId;
      const desired = d.modes.find(
        m => m.id === (owner === 'foundation' ? 'mcr' : 'delta')
      );
      consumer.setExplicitVariableModeForCollection(
        c,
        c.modes.find(m => m.name === desired.name).modeId
      );
    }
    const sizeRole = e.state.variables.find(
      v => v.name === 'fixture/text-size'
    );
    assert.equal(
      sizeRole.resolveForConsumer(ownText).value,
      17,
      'Fixed alias graph resolves target collection independent mode'
    );
    const main = nodes.find(n => key(n) === 'main');
    for (const c of e.state.collections)
      assert.equal(
        main.explicitVariableModes[c.id],
        c.modes.find(m => m.name === brand.name).modeId
      );
    const before = snapshot(e);
    for (let i = 0; i < 2; i++) {
      r = await e.call('buildMangroveComponents', d, brand.id);
      assert.deepStrictEqual(copy(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      assert.equal(snapshot(e), before);
      assert.equal(ownText.characters, 'Retained actual nested consumer copy');
    }
    const imports = snapshot(e);
    for (let i = 0; i < 2; i++) {
      r = await e.call(
        'importVariables',
        d,
        d.modes.map(m => m.id),
        false
      );
      assert.deepStrictEqual(copy(r.errors), []);
      assert.equal(r.counts.created, 0);
      assert.equal(snapshot(e), imports);
    }
    console.log(
      'v2 ' +
        brand.id +
        ' actual importer/styles/TEXT/defaults/nested instances and nonempty two-repeat snapshots pass'
    );
  }
  assert.deepStrictEqual(d, original);
  const e = setup(d);
  await e.call(
    'importVariables',
    d,
    d.modes.map(m => m.id),
    false
  );
  const before = snapshot(e);
  e.figma.listAvailableFontsAsync = async () => [
    { fontName: { family: 'Inter', style: 'Regular' } },
  ];
  await assert.rejects(
    () => e.call('buildMangroveComponents', d, 'undrr'),
    /unavailable/
  );
  assert.equal(snapshot(e), before);
  const unresolved = setup(d);
  await unresolved.call(
    'importVariables',
    d,
    d.modes.map(m => m.id),
    false
  );
  unresolved.figma.getFontFamilyVariationAxes = family =>
    family === 'Roboto' ? ['wght'] : [];
  const originalAssets = snapshot(unresolved);
  await assert.rejects(
    () => unresolved.call('buildMangroveComponents', d, 'undrr'),
    /axes are unresolved/
  );
  assert.equal(snapshot(unresolved), originalAssets);
  const late = setup(d);
  await late.call(
    'importVariables',
    d,
    d.modes.map(m => m.id),
    false
  );
  await late.call('buildMangroveComponents', d, 'undrr');
  const main = [...late.state.nodes.values()].find(n => n.type === 'TEXT'),
    load = late.figma.loadFontAsync;
  let changed = false;
  late.figma.loadFontAsync = async font => {
    await load(font);
    if (!changed) {
      changed = true;
      main.characters = 'Changed during font preparation';
    }
  };
  await assert.rejects(
    () => late.call('buildMangroveComponents', d, 'undrr'),
    /ownership changed|topology changed/
  );
  assert.equal(main.characters, 'Changed during font preparation');
  for (const change of [
    env => {
      const v = env.state.variables.find(v => v.name === 'fixture/base-size'),
        owner = env.state.collections.find(
          c => c.id === v.variableCollectionId
        );
      v.valuesByMode[
        owner.modes.find(
          m => m.name === d.modes.find(m => m.id === 'mcr').name
        ).modeId
      ] = -1;
    },
    env => {
      const v = env.state.variables.find(v => v.name === 'fixture/base-family'),
        owner = env.state.collections.find(
          c => c.id === v.variableCollectionId
        );
      v.valuesByMode[
        owner.modes.find(
          m => m.name === d.modes.find(m => m.id === 'mcr').name
        ).modeId
      ] = 'Unavailable actual native face';
    },
  ]) {
    const env = setup(d);
    await env.call(
      'importVariables',
      d,
      d.modes.map(m => m.id),
      false
    );
    change(env);
    const before = snapshot(env);
    await assert.rejects(
      () => env.call('buildMangroveComponents', d, 'undrr'),
      /minimum|unavailable/
    );
    assert.equal(snapshot(env), before);
  }
  const partial = setup(d);
  await partial.call(
    'importVariables',
    d,
    d.modes.map(m => m.id),
    false
  );
  const partialBefore = snapshot(partial);
  await assert.rejects(
    () => partial.call('buildMangroveComponents', d, 'undrr', ['label']),
    /complete family document/
  );
  assert.equal(snapshot(partial), partialBefore);
  const foreign = setup(d);
  await foreign.call(
    'importVariables',
    d,
    d.modes.map(m => m.id),
    false
  );
  const foreignStyle = foreign.figma.createTextStyle();
  foreignStyle.name = d.styles.text[0].name;
  const foreignBefore = snapshot(foreign);
  await assert.rejects(
    () => foreign.call('buildMangroveComponents', d, 'undrr'),
    /style identity/
  );
  assert.equal(snapshot(foreign), foreignBefore);
  const linked = setup(d);
  await linked.call(
    'importVariables',
    d,
    d.modes.map(m => m.id),
    false
  );
  await linked.call('buildMangroveComponents', d, 'undrr');
  const wrong = Array.from(linked.state.nodes.values()).find(
      n => n.type === 'INSTANCE'
    ),
    wrapper = Array.from(linked.state.nodes.values()).find(
      n =>
        n.getSharedPluginData('orgundrrmangrove', 'mgKitId') ===
        'family/wrapper/variant/wrapper.default'
    );
  wrong.main = wrapper;
  const linkedBefore = snapshot(linked);
  await assert.rejects(
    () => linked.call('buildMangroveComponents', d, 'undrr'),
    /instance main ownership/
  );
  assert.equal(snapshot(linked), linkedBefore);
  const styleLate = setup(d);
  await styleLate.call(
    'importVariables',
    d,
    d.modes.map(m => m.id),
    false
  );
  await styleLate.call('buildMangroveComponents', d, 'undrr');
  const currentStyle = styleLate.state.styles[0],
    nativeLoad = styleLate.figma.loadFontAsync;
  let styleChanged = false;
  styleLate.figma.loadFontAsync = async font => {
    await nativeLoad(font);
    if (!styleChanged) {
      styleChanged = true;
      currentStyle.name = 'Externally renamed during await';
    }
  };
  await assert.rejects(
    () => styleLate.call('buildMangroveComponents', d, 'undrr'),
    /style identity|style changed/
  );
  assert.equal(currentStyle.name, 'Externally renamed during await');
  const idsLate = setup(d);
  await idsLate.call(
    'importVariables',
    d,
    d.modes.map(m => m.id),
    false
  );
  let idsChanged = false;
  const idsLoad = idsLate.figma.loadFontAsync;
  let externallyChanged;
  idsLate.figma.loadFontAsync = async font => {
    await idsLoad(font);
    if (!idsChanged) {
      idsChanged = true;
      const v = idsLate.state.variables.find(
          v => v.name === 'fixture/base-size'
        ),
        old = v.id;
      v.id = 'replacement-uuid';
      for (const variable of idsLate.state.variables)
        for (const [mode, value] of Object.entries(variable.valuesByMode))
          if (value?.type === 'VARIABLE_ALIAS' && value.id === old)
            variable.valuesByMode[mode] = { ...value, id: v.id };
      externallyChanged = snapshot(idsLate);
    }
  };
  await assert.rejects(
    () => idsLate.call('buildMangroveComponents', d, 'undrr'),
    /asset identities changed/
  );
  assert.equal(
    snapshot(idsLate),
    externallyChanged,
    'No writes after simulated external identity replacement'
  );
  console.log(
    'v2 native nonselected font/size, foreign style, wrong owning main and font-await style/text refusal boundaries pass. No native/transport/rendering acceptance.'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document, setup, snapshot };
