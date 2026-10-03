#!/usr/bin/env node
/** Focused property/ownership mock. It does not model native rendering or propagation. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const DIR = path.resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));

function environment(options = {}) {
  const state = { nodes: new Map(), writes: 0, loads: 0, loaded: new Set() };
  let sequence = 0;
  class Node {
    constructor(type, name = type) {
      this.id = `n:${++sequence}`;
      this.type = type;
      this.name = name;
      this.children = [];
      this.parent = null;
      this.data = {};
      this._visible = true;
      this._characters = '';
      this.fontName =
        type === 'TEXT' ? { family: 'Roboto', style: 'Regular' } : undefined;
      this.width = 320;
      this.height = 40;
      this.x = this.y = 0;
      this.opacity = 1;
      this.textAlignHorizontal = type === 'TEXT' ? 'LEFT' : undefined;
      this.definitions = {};
      this.propertyOverrides = {};
      this.axes = {};
      state.nodes.set(this.id, this);
    }
    getSharedPluginData(namespace, key) {
      return this.data[`${namespace}/${key}`] || '';
    }
    setSharedPluginData(namespace, key, value) {
      state.writes++;
      this.data[`${namespace}/${key}`] = value;
    }
    getPluginData() {
      return '';
    }
    appendChild(node) {
      state.writes++;
      if (node.parent)
        node.parent.children.splice(node.parent.children.indexOf(node), 1);
      node.parent = this;
      this.children.push(node);
    }
    findAll(predicate = () => true) {
      return this.children.flatMap(node => [
        ...(predicate(node) ? [node] : []),
        ...node.findAll(predicate),
      ]);
    }
    propertyValue(field, initial) {
      const key = this.componentPropertyReferences?.[field];
      if (!key) return initial;
      for (let node = this.parent; node; node = node.parent)
        if (node.type === 'INSTANCE' && key in node.componentProperties)
          return node.componentProperties[key].value;
      return initial;
    }
    get visible() {
      return this.propertyValue('visible', this._visible);
    }
    set visible(value) {
      this._visible = value;
    }
    get characters() {
      return this.type === 'TEXT'
        ? this.propertyValue('characters', this._characters)
        : undefined;
    }
    set characters(value) {
      this._characters = value;
    }
    get componentPropertyDefinitions() {
      assert.notStrictEqual(
        this.parent?.type,
        'COMPONENT_SET',
        'Do not read property definitions on a variant'
      );
      return this.definitions;
    }
    get variantProperties() {
      return this.type === 'COMPONENT' ? this.axes : null;
    }
    get componentProperties() {
      assert.strictEqual(this.type, 'INSTANCE');
      const owner = this.main.parent;
      const values = Object.fromEntries(
        Object.entries(owner.definitions).map(([key, spec]) => [
          key,
          {
            type: spec.type,
            value:
              key in this.propertyOverrides
                ? this.propertyOverrides[key]
                : spec.defaultValue,
          },
        ])
      );
      for (const [key, value] of Object.entries(this.main.axes))
        values[key] = { type: 'VARIANT', value };
      return values;
    }
    setProperties(edits) {
      state.writes++;
      if (options.failNested && this.name === 'mg-combobox__option-2')
        throw new Error('Native nested edit rejected');
      for (const [key, value] of Object.entries(edits)) {
        const spec = this.componentProperties[key];
        assert(spec, 'Actual suffixed property required');
        assert.strictEqual(
          typeof value,
          spec.type === 'BOOLEAN' ? 'boolean' : 'string'
        );
        assert.notStrictEqual(spec.type, 'VARIANT', 'Probe must preserve axes');
        this.propertyOverrides[key] = value;
      }
    }
    async getMainComponentAsync() {
      return this.main || null;
    }
    get exposedInstances() {
      return this.findAll(
        node => node.type === 'INSTANCE' && node.isExposedInstance
      );
    }
    getRangeAllFontNames() {
      return [this.fontName];
    }
    setExplicitVariableModeForCollection(collection, mode) {
      state.writes++;
      this.explicitVariableModes = { [collection.id]: mode };
    }
    createInstance() {
      assert.strictEqual(this.type, 'COMPONENT');
      for (const text of this.findAll(node => node.type === 'TEXT'))
        assert(
          state.loaded.has(`${text.fontName.family}/${text.fontName.style}`),
          'Load exact source fonts before creation'
        );
      function clone(source, root = false) {
        const node = new Node(root ? 'INSTANCE' : source.type, source.name);
        for (const key of [
          '_visible',
          '_characters',
          'fontName',
          'textAlignHorizontal',
          'componentPropertyReferences',
          'isExposedInstance',
          'axes',
          'propertyOverrides',
          'data',
        ])
          if (source[key] !== undefined) node[key] = copy(source[key]);
        if (root) node.main = source;
        else if (source.type === 'INSTANCE') node.main = source.main;
        for (const child of source.children) node.appendChild(clone(child));
        return node;
      }
      return clone(this, true);
    }
    remove() {
      state.writes++;
      for (const child of [...this.children]) child.remove();
      if (this.parent)
        this.parent.children.splice(this.parent.children.indexOf(this), 1);
      this.parent = null;
      state.nodes.delete(this.id);
    }
  }
  const own = (node, key) => {
    node.data[`orgundrrmangrove/mgKitId`] = key;
    return node;
  };
  const page = new Node('PAGE');
  const main = own(new Node('FRAME', 'Mangrove main'), 'main');
  page.appendChild(main);
  const set = (family, definitions) => {
    const node = own(new Node('COMPONENT_SET'), `family/${family}`);
    node.definitions = definitions;
    main.appendChild(node);
    return node;
  };
  const definition = (type, defaultValue) => ({ type, defaultValue });
  const radio = set('radio', {
    'Label#radio-label': definition('TEXT', 'Option A'),
    'Error#radio-error': definition('TEXT', 'Choose an option'),
    'Show label#radio-showlabel': definition('BOOLEAN', true),
    'Show error#radio-showerror': definition('BOOLEAN', true),
  });
  const combo = set('combobox', {
    'Label#combo-label': definition('TEXT', 'Label'),
    'Value#combo-value': definition('TEXT', 'Search hazards'),
    'Help text#combo-help': definition('TEXT', 'Help'),
    'Show label#combo-showlabel': definition('BOOLEAN', true),
    'Show help#combo-showhelp': definition('BOOLEAN', false),
    'Required#combo-required': definition('BOOLEAN', false),
  });
  const optionSet = set('combobox-option', {
    'Label#option-label': definition('TEXT', 'Option'),
  });
  const variant = (parent, id, axes) => {
    const node = own(
      new Node('COMPONENT', id),
      `family/${parent === combo ? 'combobox' : parent === radio ? 'radio' : 'combobox-option'}/variant/${id}`
    );
    node.axes = axes;
    parent.appendChild(node);
    return node;
  };
  const add = (parent, type, name, refs = {}, visible = true) => {
    const node = new Node(type, name);
    node.componentPropertyReferences = refs;
    node._visible = visible;
    if (type === 'TEXT') node.characters = name;
    parent.appendChild(node);
    return node;
  };
  const option = variant(optionSet, 'combobox-option.default', {
    Selected: 'False',
    State: 'Default',
  });
  add(option, 'TEXT', 'Label', { characters: 'Label#option-label' });
  const open = variant(combo, 'combobox.open', { State: 'Open' });
  const label = add(open, 'FRAME', 'mg-combobox__label', {
    visible: 'Show label#combo-showlabel',
  });
  add(label, 'TEXT', 'Label', { characters: 'Label#combo-label' });
  add(
    label,
    'TEXT',
    'Required marker',
    { visible: 'Required#combo-required' },
    false
  );
  add(open, 'TEXT', 'Value', { characters: 'Value#combo-value' });
  add(
    open,
    'TEXT',
    'Help',
    { characters: 'Help text#combo-help', visible: 'Show help#combo-showhelp' },
    false
  );
  for (let index = 1; index <= 3; index++) {
    const node = add(open, 'INSTANCE', `mg-combobox__option-${index}`);
    node.main = option;
    node.isExposedInstance = true;
    add(node, 'TEXT', 'Label', { characters: 'Label#option-label' });
  }
  for (const State of ['Default', 'Invalid']) {
    const id = `radio.true.${State.toLowerCase()}.after.short`;
    const component = variant(radio, id, {
      Checked: 'True',
      State,
      LabelPosition: 'After',
      Content: 'Short',
    });
    const labelFrame = add(component, 'FRAME', 'Radio label', {
      visible: 'Show label#radio-showlabel',
    });
    add(labelFrame, 'TEXT', 'Label', { characters: 'Label#radio-label' });
    const errorFrame = add(
      component,
      'FRAME',
      'Radio error',
      {},
      State === 'Invalid'
    );
    add(errorFrame, 'TEXT', 'Error', {
      characters: 'Error#radio-error',
      visible: 'Show error#radio-showerror',
    });
  }
  const collection = {
    id: 'collection:1',
    name: 'Mangrove',
    modes: [{ modeId: 'mode:1', name: 'UNDRR' }],
  };
  const figma = {
    currentPage: page,
    mixed: Symbol('mixed'),
    variables: { getLocalVariableCollectionsAsync: async () => [collection] },
    getNodeByIdAsync: async id => state.nodes.get(id) || null,
    loadFontAsync: async face => {
      state.loads++;
      if (options.rejectFont) throw new Error('Roboto unavailable');
      state.loaded.add(`${face.family}/${face.style}`);
    },
    createFrame: () => {
      const node = new Node('FRAME');
      page.appendChild(node);
      return node;
    },
  };
  const doc = {
    collection: 'Mangrove',
    modes: [{ id: 'undrr', name: 'UNDRR' }],
    components: {
      families: [
        {
          id: 'combobox',
          variants: [{ id: 'combobox.open', properties: open.axes }],
        },
        {
          id: 'radio',
          variants: radio.children.map(node => ({
            id: node.name,
            properties: node.axes,
          })),
        },
      ],
    },
  };
  const rebuild = {
    errors: [],
    families: [combo, radio, optionSet].map(parent => ({
      id:
        parent === combo
          ? 'combobox'
          : parent === radio
            ? 'radio'
            : 'combobox-option',
      setId: parent.id,
      variantIds: parent.children.map(node => ({
        id: node.name,
        nodeId: node.id,
      })),
    })),
    audit: ['combobox', 'radio', 'combobox-option'].map(family => ({
      family,
      status: 'built',
    })),
  };
  const context = vm.createContext({ figma, Date, Math, console });
  for (const file of ['kit-identity.js', 'kit-acceptance.js'])
    vm.runInContext(fs.readFileSync(path.join(DIR, file), 'utf8'), context);
  const call = (name, ...args) => {
    context.args = args;
    return vm.runInContext(`${name}(...args)`, context);
  };
  return {
    state,
    Node,
    page,
    main,
    combo,
    radio,
    open,
    collection,
    doc,
    rebuild,
    call,
  };
}

async function prepare(env) {
  const result = await env.call(
    'prepareMangroveOverrideProbes',
    env.doc,
    'undrr'
  );
  assert.deepStrictEqual(copy(result.errors), []);
  assert(result.ledger.complete);
  assert.strictEqual(result.ledger.probes.length, 3);
  return result;
}

async function main() {
  {
    const env = environment();
    const review = new env.Node('FRAME', 'Owned review');
    review.x = 480;
    review.width = 800;
    review.setSharedPluginData('orgundrrmangrove', 'mgKitId', 'review');
    env.page.appendChild(review);
    const diagnostics = new env.Node('FRAME', 'Focus diagnostics');
    diagnostics.x = 1700;
    diagnostics.width = 500;
    env.page.appendChild(diagnostics);
    const user = new env.Node('FRAME', 'User artwork');
    user.x = 2500;
    user.absoluteBoundingBox = { x: 2600, y: 30, width: 400, height: 100 };
    user.absoluteRenderBounds = { x: 2590, y: 20, width: 430, height: 120 };
    env.page.appendChild(user);
    const invalid = new env.Node('FRAME', 'Unusable bounds');
    invalid.x = Infinity;
    invalid.absoluteBoundingBox = { x: 10000, y: NaN, width: 200, height: 40 };
    invalid.absoluteRenderBounds = { x: 20000, y: 0, width: -1, height: 40 };
    env.page.appendChild(invalid);
    const positions = env.page.children.map(node => [node, node.x, node.y]);
    const prepared = await prepare(env);
    const root = env.state.nodes.get(prepared.rootId);
    assert.strictEqual(
      root.x,
      3020 + 160,
      'Clear rendered bounds of all page-level artifacts'
    );
    for (const [node, x, y] of positions) {
      assert.strictEqual(node.x, x, 'Existing horizontal position preserved');
      assert.strictEqual(node.y, y, 'Existing vertical position preserved');
    }
    const negative = environment();
    negative.main.x = -1000;
    const onNegativePage = await prepare(negative);
    assert.strictEqual(
      negative.state.nodes.get(onNegativePage.rootId).x,
      -520,
      'Exclude the new frame default position from the existing right edge'
    );
    const noBounds = environment();
    noBounds.main.x = NaN;
    const nodeIds = [...noBounds.state.nodes.keys()];
    const writes = noBounds.state.writes;
    const rejected = await noBounds.call(
      'prepareMangroveOverrideProbes',
      noBounds.doc,
      'undrr'
    );
    assert(rejected.errors.some(error => error.includes('finite page bounds')));
    assert.deepStrictEqual([...noBounds.state.nodes.keys()], nodeIds);
    assert.strictEqual(noBounds.state.writes, writes);
    console.log(
      'ok  fresh probes clear review/diagnostic/user bounds, ignore malformed bounds, exclude themselves and preserve existing positions'
    );
  }
  {
    const env = environment();
    const original = [...env.state.nodes.keys()];
    const prepared = await prepare(env);
    const ledger = copy(prepared.ledger);
    for (const probe of ledger.probes) {
      assert(probe.complete);
      assert(probe.transitions.every(item => item.expected === item.actual));
      for (const target of probe.targets) assert(target.key.includes('#'));
    }
    const combo = ledger.probes[0];
    assert.strictEqual(
      combo.targets.filter(target => target.instanceId !== combo.nodeId).length,
      3
    );
    assert.strictEqual(
      env.state.nodes.get(combo.format.nodeId).textAlignHorizontal,
      'RIGHT'
    );
    const invalid = ledger.probes[2];
    assert.strictEqual(
      env.state.nodes.get(invalid.nodeId).componentProperties.Checked.value,
      'True'
    );
    assert.strictEqual(
      env.state.nodes.get(
        invalid.targets.find(target => target.name === 'Show label').nodeId
      ).visible,
      false
    );
    const error = invalid.baseline.nodes.find(
      node => node.characters === 'Probe visible error'
    );
    assert.strictEqual(error.effectiveVisible, true);
    const beforeWrites = env.state.writes;
    const beforeLoads = env.state.loads;
    // Binding readbacks retain explicit edits when source defaults change.
    // This checks the mock contract, not native component propagation.
    env.combo.definitions['Value#combo-value'].defaultValue = 'New default';
    // Root ID reloads authoritative shared baseline without any UI-held ledger.
    const result = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert.strictEqual(result.passed, true, JSON.stringify(result.errors));
    assert.strictEqual(env.state.writes, beforeWrites);
    assert.strictEqual(env.state.loads, beforeLoads);
    env.state.nodes.get(combo.format.nodeId).textAlignHorizontal = 'LEFT';
    const lost = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert.strictEqual(lost.passed, false);
    assert(
      lost.assertions.some(
        item => item.name.includes('textAlignHorizontal') && !item.passed
      )
    );
    const cleanup = await env.call(
      'removeMangroveOverrideProbes',
      prepared.rootId
    );
    assert.deepStrictEqual(copy(cleanup.errors), []);
    assert.deepStrictEqual(copy(cleanup.retained), []);
    assert.deepStrictEqual(
      [...env.state.nodes.keys()],
      original,
      'No existing source node removed'
    );
    assert.deepStrictEqual(
      new Set(cleanup.removedNodeIds),
      new Set(prepared.createdNodeIds)
    );
    console.log(
      'ok  actual suffixed properties, transitions, nested labels, variant axes, formatting/read-only comparison, persisted ledger and exact cleanup'
    );
  }
  {
    for (const fault of [
      'missing',
      'ambiguous',
      'wrong-type',
      'axis',
      'font',
      'brand',
    ]) {
      const env = environment({ rejectFont: fault === 'font' });
      if (fault === 'missing')
        delete env.combo.definitions['Value#combo-value'];
      if (fault === 'ambiguous')
        env.combo.definitions['Value#other'] = {
          type: 'TEXT',
          defaultValue: '',
        };
      if (fault === 'wrong-type') env.open.type = 'FRAME';
      if (fault === 'axis') env.open.axes = { State: 'Default' };
      if (fault === 'brand') env.collection.modes[0].name = 'DELTA Resilience';
      const before = [...env.state.nodes.keys()];
      const writes = env.state.writes;
      const result = await env.call(
        'prepareMangroveOverrideProbes',
        env.doc,
        'undrr'
      );
      assert(result.errors.length, fault);
      assert.strictEqual(result.createdNodeIds.length, 0, fault);
      assert.deepStrictEqual([...env.state.nodes.keys()], before, fault);
      assert.strictEqual(env.state.writes, writes, fault);
    }
    console.log(
      'ok  missing/ambiguous/wrong-type masters, brand mismatch and font failures reject without canvas writes'
    );
  }
  {
    const env = environment({ failNested: true });
    const original = [...env.state.nodes.keys()];
    const result = await env.call(
      'prepareMangroveOverrideProbes',
      env.doc,
      'undrr'
    );
    assert(
      result.errors.some(error => error.includes('Native nested edit rejected'))
    );
    assert(result.createdNodeIds.length > 1);
    assert.strictEqual(result.ledger.complete, false);
    const comparison = await env.call(
      'compareMangroveOverrideProbes',
      result.rootId,
      env.rebuild
    );
    assert.strictEqual(comparison.passed, false);
    assert(comparison.errors.some(error => error.includes('incomplete')));
    const cleanup = await env.call(
      'removeMangroveOverrideProbes',
      result.rootId
    );
    assert.deepStrictEqual(copy(cleanup.errors), []);
    assert.deepStrictEqual([...env.state.nodes.keys()], original);
    console.log(
      'ok  partial native failure retains exact IDs and persistent evidence, cannot pass, explicit cleanup only'
    );
  }
  {
    for (const change of ['move', 'detach', 'add-child', 'identity']) {
      const env = environment();
      const result = await prepare(env);
      const probe = env.state.nodes.get(result.ledger.probes[0].nodeId);
      if (change === 'move') env.page.appendChild(probe);
      if (change === 'detach') probe.type = 'FRAME';
      if (change === 'add-child')
        probe.appendChild(new env.Node('FRAME', 'User child'));
      if (change === 'identity')
        probe.setSharedPluginData('orgundrrmangrove', 'mgKitId', 'foreign');
      const cleanup = await env.call(
        'removeMangroveOverrideProbes',
        result.rootId
      );
      assert(
        cleanup.retained.some(item => item.id === probe.id),
        change
      );
      assert(env.state.nodes.has(probe.id), change);
      assert(
        env.state.nodes.has(result.rootId),
        'Keep authoritative ledger for retained probes'
      );
      assert([...env.state.nodes.values()].some(node => node === env.open));
    }
    const env = environment();
    const result = await prepare(env);
    const root = env.state.nodes.get(result.rootId);
    const userChild = new env.Node('FRAME', 'Unrecorded sibling');
    root.appendChild(userChild);
    const cleanup = await env.call(
      'removeMangroveOverrideProbes',
      result.rootId
    );
    assert(env.state.nodes.has(userChild.id));
    assert(cleanup.retained.some(item => item.id === root.id));
    console.log(
      'ok  moved/detached/foreign-identity probes and user descendants/siblings are retained'
    );
  }
  {
    const env = environment();
    const result = await prepare(env);
    const combo = result.ledger.probes[0];
    const target = combo.targets.find(item => item.instanceId !== combo.nodeId);
    env.state.nodes.get(target.instanceId).propertyOverrides[target.key] =
      'Lost nested edit';
    const failed = await env.call(
      'compareMangroveOverrideProbes',
      result.rootId,
      env.rebuild
    );
    assert.strictEqual(failed.passed, false);
    assert(
      failed.assertions.some(
        item => !item.passed && item.name.includes('characters')
      )
    );
    const blocked = await env.call(
      'compareMangroveOverrideProbes',
      result.rootId,
      { ...env.rebuild, audit: [] }
    );
    assert.strictEqual(blocked.passed, false);
    assert(
      blocked.errors.some(error => error.includes('did not successfully cover'))
    );
    const changedMode = environment();
    const prepared = await prepare(changedMode);
    changedMode.collection.modes[0].name = 'IRP';
    const wrongBrand = await changedMode.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      changedMode.rebuild
    );
    assert.strictEqual(wrongBrand.passed, false);
    console.log(
      'ok  lost nested edits, incomplete rebuild coverage and brand changes cannot pass'
    );
  }
  {
    for (const change of ['root-identity', 'root-type', 'invalid-ledger']) {
      const env = environment();
      const prepared = await prepare(env);
      const root = env.state.nodes.get(prepared.rootId);
      if (change === 'root-identity')
        root.setSharedPluginData('orgundrrmangrove', 'mgKitId', 'foreign');
      if (change === 'root-type') root.type = 'COMPONENT';
      if (change === 'invalid-ledger') {
        const ledger = copy(prepared.ledger);
        ledger.probes[0].parentId = env.main.id;
        root.setSharedPluginData(
          'orgundrrmangrove',
          'mgAcceptanceLedger',
          JSON.stringify(ledger)
        );
      }
      const ids = [...env.state.nodes.keys()];
      const writes = env.state.writes;
      const cleanup = await env.call(
        'removeMangroveOverrideProbes',
        prepared.rootId
      );
      assert(cleanup.errors.length, change);
      assert.deepStrictEqual([...env.state.nodes.keys()], ids, change);
      assert.strictEqual(env.state.writes, writes, change);
    }
    console.log(
      'ok  changed root ownership/type and invalid persisted ledger cannot authorize cleanup'
    );
  }
}

main().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
