#!/usr/bin/env node
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path'),
  vm = require('vm');
const api = { module: { exports: {} } };
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, '../kit-alpha-mask.js'), 'utf8'),
  api
);
const {
  mgAlphaMaskPlan,
  mgAlphaMaskDocumentValues,
  mgAlphaMaskNativeValues,
  mgNativeAlphaMaskPlan,
  mgApplyAlphaMask,
} = api.module.exports;
const copy = structuredClone;
const ids = ['undrr', 'delta', 'irp', 'mcr', 'preventionweb'];
function document(height = 168) {
  const values = x => Object.fromEntries(ids.map(id => [id, x]));
  const variables = [
    ['width', 'FLOAT', 100],
    ['mask-height', 'FLOAT', 200],
    ['owner-height', 'FLOAT', height],
    ['zero', 'FLOAT', 0],
    ['opaque', 'COLOR', { r: 0, g: 0, b: 0, a: 1 }],
    ['transparent', 'COLOR', { r: 0, g: 0, b: 0, a: 0 }],
  ].map(([name, type, value]) => ({
    id: name,
    name,
    type,
    values: values(value),
    scopes: ['ALL_SCOPES'],
  }));
  const tree = {
    id: 'mask',
    type: 'FRAME',
    alphaMask: { type: 'ALPHA' },
    layout: { width: 'width', height: 'mask-height' },
    absolute: {
      horizontal: 'START',
      vertical: 'START',
      offsetX: 'zero',
      offsetY: 'zero',
    },
    gradient: {
      layers: [
        {
          transform: [
            [0, 1, 0],
            [-1, 0, 1],
          ],
          stops: [
            { position: 0, color: 'opaque' },
            { position: 0.6, color: 'opaque' },
            { position: 1, color: 'transparent' },
          ],
        },
      ],
    },
  };
  const owner = {
    id: 'owner',
    type: 'FRAME',
    layout: {
      mode: 'VERTICAL',
      width: 'width',
      height: 'owner-height',
      clipsContent: true,
    },
    children: [
      tree,
      {
        id: 'content',
        type: 'FRAME',
        children: [
          {
            id: 'text',
            type: 'TEXT',
            characters: 'Genuine editable source content',
          },
        ],
      },
    ],
  };
  return { modes: ids.map(id => ({ id })), variables, owner, tree };
}
function nativeClosure() {
  const expected = {
    mask: 'family/test/variant/one/owner/mask',
    owner: 'family/test/variant/one/owner',
    content: 'family/test/variant/one/owner/content',
  };
  const make = (id, identity) => {
    const shared = new Map();
    return {
      id,
      type: 'FRAME',
      removed: false,
      identity,
      isMask: false,
      maskType: 'ALPHA',
      getSharedPluginData: (namespace, key) =>
        shared.get(namespace + '/' + key) || '',
      setSharedPluginData: (namespace, key, value) =>
        shared.set(namespace + '/' + key, value),
    };
  };
  const owner = make('native-owner', expected.owner),
    node = make('native-mask', expected.mask),
    content = make('native-content', expected.content);
  owner.children = [node, content];
  node.parent = owner;
  content.parent = owner;
  return {
    node,
    owner,
    content,
    identity: {
      get: n => n.identity,
      expected,
      readState: n =>
        n.getSharedPluginData('orgundrrmangrove', 'mgAlphaMaskV1'),
      writeState: (n, v) =>
        n.setSharedPluginData('orgundrrmangrove', 'mgAlphaMaskV1', v),
    },
  };
}
function main() {
  for (const height of [200, 168]) {
    const d = document(height),
      before = copy(d),
      plan = mgAlphaMaskPlan(d.tree, d.owner, 0);
    const source = mgAlphaMaskDocumentValues(plan, d);
    for (const id of ids)
      assert.deepStrictEqual(copy(source[id]), {
        width: 100,
        height: 200,
        ownerWidth: 100,
        ownerHeight: height,
        transform: [
          [0, 1, 0],
          [-1, 0, 1],
        ],
        colors: [
          { r: 0, g: 0, b: 0, a: 1 },
          { r: 0, g: 0, b: 0, a: 1 },
          { r: 0, g: 0, b: 0, a: 0 },
        ],
      });
    assert.deepStrictEqual(d, before);
    assert.deepStrictEqual(
      copy(
        mgAlphaMaskNativeValues(plan, ids, (name, mode, type) => {
          const v = d.variables.find(v => v.name === name);
          assert.equal(v.type, type);
          return v.values[mode];
        })
      ),
      copy(source)
    );
    const closure = nativeClosure();
    const run = () =>
      mgApplyAlphaMask(
        mgNativeAlphaMaskPlan(
          closure.node,
          closure.owner,
          closure.content,
          plan,
          closure.identity
        )
      );
    run();
    const ledger = closure.node.getSharedPluginData(
      'orgundrrmangrove',
      'mgAlphaMaskV1'
    );
    const snapshots = [
      JSON.stringify({
        ledger,
        flags: [closure.node.isMask, closure.node.maskType],
        ids: closure.owner.children.map(n => n.id),
      }),
    ];
    for (let i = 0; i < 2; i++) {
      run();
      snapshots.push(
        JSON.stringify({
          ledger: closure.node.getSharedPluginData(
            'orgundrrmangrove',
            'mgAlphaMaskV1'
          ),
          flags: [closure.node.isMask, closure.node.maskType],
          ids: closure.owner.children.map(n => n.id),
        })
      );
    }
    assert(snapshots.every(s => s === snapshots[0]));

    const none = copy(d);
    none.tree = none.owner.children[0];
    none.tree.alphaMask = { type: 'NONE' };
    delete none.tree.gradient;
    const reset = mgAlphaMaskPlan(none.tree, none.owner, 0);
    mgAlphaMaskDocumentValues(reset, none);
    mgApplyAlphaMask(
      mgNativeAlphaMaskPlan(
        closure.node,
        closure.owner,
        closure.content,
        reset,
        closure.identity
      )
    );
    assert.equal(closure.node.isMask, false);
    assert.equal(closure.node.maskType, 'ALPHA');
    mgApplyAlphaMask(
      mgNativeAlphaMaskPlan(
        closure.node,
        closure.owner,
        closure.content,
        plan,
        closure.identity
      )
    );
    assert.equal(closure.node.isMask, true);
    assert.throws(
      () =>
        mgNativeAlphaMaskPlan(
          closure.node,
          closure.owner,
          closure.content,
          null,
          closure.identity
        ),
      /explicit/
    );
  }
  for (const mutate of [
    d => (d.tree.alphaMask.type = 'VECTOR'),
    d => (d.tree.alphaMask.extra = true),
    d => (d.tree.type = 'TEXT'),
    d => (d.tree.children = [{ id: 'foreign', type: 'FRAME' }]),
    d => d.owner.children.reverse(),
    d => d.owner.children.push({ id: 'outside', type: 'FRAME' }),
    d => (d.owner.layout.clipsContent = false),
    d => (d.owner.layout.mode = 'NONE'),
    d => (d.tree.absolute.horizontal = 'END'),
    d => (d.tree.fill = 'opaque'),
    d => (d.tree.bindings = { opacity: 'zero' }),
    d => (d.tree.opacity = 0.5),
    d => (d.tree.gradient.layers[0].stops[1].position = -1),
    d => (d.tree.gradient.layers[0].transform[0][0] = NaN),
  ]) {
    const d = document();
    mutate(d);
    assert.throws(() => mgAlphaMaskPlan(d.tree, d.owner, 0));
  }
  for (const mutate of [
    d => (d.variables[0].values.mcr = 0),
    d => (d.variables[1].values.preventionweb = 167),
    d => (d.variables[3].values.irp = 1),
    d => (d.variables[0].type = 'STRING'),
    d => delete d.variables[1].values.delta,
    d => (d.variables[0].values.mcr = { alias: 'width' }),
    d => (d.variables[5].values.mcr.a = NaN),
    d => (d.variables[5].values.mcr.a = 0.1),
    d => (d.variables[4].values.delta.a = 0.8),
  ]) {
    const d = document();
    mutate(d);
    const before = copy(d);
    assert.throws(() =>
      mgAlphaMaskDocumentValues(mgAlphaMaskPlan(d.tree, d.owner, 0), d)
    );
    assert.deepStrictEqual(d, before);
  }
  for (const field of [
    'fill',
    'image',
    'stroke',
    'effectStyle',
    'effects',
    'gradient',
  ]) {
    const bad = document();
    bad.tree.alphaMask = { type: 'NONE' };
    delete bad.tree.gradient;
    bad.tree[field] = 'foreign';
    assert.throws(() => mgAlphaMaskPlan(bad.tree, bad.owner, 0));
  }
  const aliasDoc = document();
  aliasDoc.variables.push({
    id: 'alias-width',
    name: 'alias-width',
    type: 'FLOAT',
    values: Object.fromEntries(ids.map(id => [id, { alias: 'width' }])),
  });
  aliasDoc.tree.layout.width = 'alias-width';
  mgAlphaMaskDocumentValues(
    mgAlphaMaskPlan(aliasDoc.tree, aliasDoc.owner, 0),
    aliasDoc
  );
  for (const change of [
    d => (d.variables[0].values.mcr = { alias: 'width', extra: 1 }),
    d =>
      (d.tree.gradient.layers[0].transformVariables = [
        ['zero', 'zero', 'zero'],
        ['zero', 'zero', 'zero'],
      ]),
    d => (d.variables[5].values.delta.r = 2),
  ]) {
    const invalid = document();
    change(invalid);
    assert.throws(() =>
      mgAlphaMaskDocumentValues(
        mgAlphaMaskPlan(invalid.tree, invalid.owner, 0),
        invalid
      )
    );
  }
  const overflow = document();
  overflow.tree.gradient.layers[0].transform = [
    [1e308, 0, 0],
    [0, 1e308, 0],
  ];
  const overflowPlan = mgAlphaMaskPlan(overflow.tree, overflow.owner, 0);
  assert.throws(
    () => mgAlphaMaskDocumentValues(overflowPlan, overflow),
    /invertible/
  );
  assert.throws(
    () =>
      mgAlphaMaskNativeValues(
        overflowPlan,
        ids,
        (name, mode) =>
          overflow.variables.find(v => v.name === name).values[mode]
      ),
    /invertible/
  );
  const nativeDoc = document(),
    nativePlan = mgAlphaMaskPlan(nativeDoc.tree, nativeDoc.owner, 0);
  assert.throws(
    () =>
      mgAlphaMaskNativeValues(nativePlan, ids, (name, mode) =>
        mode === 'mcr' && name === 'transparent'
          ? { r: 0, g: 0, b: 0, a: 0.2 }
          : nativeDoc.variables.find(v => v.name === name).values[mode]
      ),
    /transparent/
  );
  const changed = document(),
    initial = mgAlphaMaskPlan(changed.tree, changed.owner, 0);
  changed.tree.layout.height = 201;
  assert.throws(
    () => mgAlphaMaskDocumentValues(initial, changed),
    /changed after preparation/
  );
  const d = document(),
    plan = mgAlphaMaskPlan(d.tree, d.owner, 0);
  assert(mgNativeAlphaMaskPlan(null, null, null, plan, null).fresh);
  assert.throws(
    () => mgNativeAlphaMaskPlan(nativeClosure().node, null, null, plan, null),
    /partial/
  );
  for (const mutate of [
    c => (c.node.isMask = true),
    c => (c.node.maskType = Symbol('mixed')),
    c => delete c.node.maskType,
    c => c.owner.children.reverse(),
    c => c.owner.children.push({ id: 'extra' }),
    c => (c.content.parent = { id: 'foreign' }),
    c => (c.identity.expected.content = 'wrong'),
    c => (c.content.removed = true),
  ]) {
    const c = nativeClosure();
    mutate(c);
    assert.throws(() =>
      mgNativeAlphaMaskPlan(c.node, c.owner, c.content, plan, c.identity)
    );
    assert.equal(
      c.node.getSharedPluginData('orgundrrmangrove', 'mgAlphaMaskV1'),
      ''
    );
  }
  for (const mutate of [
    c => (c.node.isMask = false),
    c => (c.node.maskType = 'VECTOR'),
    c => c.owner.children.reverse(),
    c => (c.node.parent = { id: 'foreign' }),
  ]) {
    const c = nativeClosure();
    mgApplyAlphaMask(
      mgNativeAlphaMaskPlan(c.node, c.owner, c.content, plan, c.identity)
    );
    mutate(c);
    assert.throws(() =>
      mgNativeAlphaMaskPlan(c.node, c.owner, c.content, plan, c.identity)
    );
  }
  const future = document(),
    prepared = mgAlphaMaskPlan(future.tree, future.owner, 0),
    changedClosure = nativeClosure();
  future.tree.alphaMask.type = 'NONE';
  delete future.tree.gradient;
  assert.throws(
    () =>
      mgNativeAlphaMaskPlan(
        changedClosure.node,
        changedClosure.owner,
        changedClosure.content,
        prepared,
        changedClosure.identity
      ),
    /changed after preparation/
  );
  const c = nativeClosure(),
    pending = mgNativeAlphaMaskPlan(
      c.node,
      c.owner,
      c.content,
      plan,
      c.identity
    );
  c.node.maskType = 'VECTOR';
  assert.throws(() => mgApplyAlphaMask(pending), /after native preflight/);
  const p = nativeClosure();
  mgApplyAlphaMask(
    mgNativeAlphaMaskPlan(p.node, p.owner, p.content, plan, p.identity)
  );
  const proxy = { ...p.owner, children: p.owner.children.map(n => ({ ...n })) };
  p.node.parent = proxy;
  p.content.parent = proxy;
  mgApplyAlphaMask(
    mgNativeAlphaMaskPlan(p.node, proxy, p.content, plan, p.identity)
  );
  assert.equal(mgAlphaMaskPlan({ type: 'FRAME' }, null, 0), null);
  console.log(
    'ALPHA mask source/native-field contract: all five modes, stable field repeats, explicit NONE reset and premutation refusals pass. Rendered native masks remain unproved.'
  );
}
if (require.main === module) main();
module.exports = { document, nativeClosure };
