#!/usr/bin/env node
/** Control-flow mock only. Native wrapping, slots and instance vectors are unverified. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const DIR = path.resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));

function environment(options = {}) {
  const nodes = new Map();
  const styles = ['label', 'label-hover', 'label-focus'].map((role, index) => ({
    id: `existing-style:${role}`,
    fontName: { family: 'Roboto', style: 'Bold' },
    fontSize: 14,
    textDecoration: index ? 'UNDERLINE' : 'NONE',
    getSharedPluginData: (namespace, key) =>
      key === 'mgStyleId' ? `component.editorial-cta.${role}` : '',
    getPluginData: () => '',
  }));
  let sequence = 0;
  const state = {
    nodes,
    created: 0,
    resetCalls: 0,
    loadedFonts: [],
    regenerated: [],
    convertedRoots: [],
    missingSlotChildIds: new Set(),
    existingStyles: styles,
    repairMoves: [],
  };
  function linkedPeers(node) {
    let owner = node.parent;
    while (owner && owner.type !== 'COMPONENT_SET') owner = owner.parent;
    const reference = node.componentPropertyReferences?.characters;
    return owner && reference
      ? owner.findAll(
          item =>
            item !== node &&
            item.type === 'TEXT' &&
            (!options.propagationRequiresSameName || item.name === node.name) &&
            item.componentPropertyReferences?.characters === reference
        )
      : [];
  }
  function copyTextStyle(source, target) {
    for (const field of [
      'textStyleId',
      'textDecoration',
      '_decorationOffset',
      'fontName',
      'fontSize',
    ])
      if (source[field] !== undefined) target[field] = copy(source[field]);
  }
  // Explicit inheritance model for the diagnostic's one-label instances only.
  // This does not model native styled ranges or claim native propagation parity.
  function inheritTextStyle(source) {
    if (source.parent?.type !== 'COMPONENT') return;
    for (const node of nodes.values())
      if (node.type === 'INSTANCE' && node.main === source.parent)
        for (const label of node.children)
          if (
            label.type === 'TEXT' &&
            label.componentPropertyReferences?.characters ===
              source.componentPropertyReferences?.characters
          )
            copyTextStyle(source, label);
  }
  function regenerate(instance) {
    for (const child of [...instance.children]) {
      if (child.type !== 'TEXT' || child.removed) continue;
      const replacement = new Node('TEXT');
      for (const field of [
        'data',
        '_characters',
        'componentPropertyReferences',
        'fontName',
        'fontSize',
        'lineHeight',
        'x',
        'y',
      ])
        if (child[field] !== undefined) replacement[field] = copy(child[field]);
      const index = instance.children.indexOf(child);
      replacement.parent = instance;
      instance.children[index] = replacement;
      child._removed = true;
      nodes.delete(child.id);
      state.regenerated.push({ oldId: child.id, newId: replacement.id });
    }
  }
  function materialize(source) {
    const replacement = source.main.createInstance();
    replacement._slotInserted = true;
    replacement.setProperties(copy(source.props));
    replacement.data = copy(source.data);
    if (options.dropConvertedOwner) {
      replacement.data = {};
      for (const child of replacement.findAll(() => true)) child.data = {};
    }
    state.convertedRoots.push({ oldId: source.id, newId: replacement.id });
    source.remove();
    return replacement;
  }
  class Node {
    constructor(type) {
      this.id = `probe:${++sequence}`;
      state.created += 1;
      this.type = type;
      this.children = [];
      this.data = {};
      this.props = {};
      this.definitions = {};
      this.x = this.y = 0;
      this._width = 100;
      this._height = 24;
      this._paths = [];
      this._removed = false;
      nodes.set(this.id, this);
      if (options.rangeApiUnavailable) {
        this.setRangeTextStyleIdAsync = undefined;
        this.setRangeTextDecoration = undefined;
      }
      if (type === 'COMPONENT' && options.slots)
        this.createSlot = () => {
          const slot = new Node('SLOT');
          this.appendChild(slot);
          const key = this.addComponentProperty('Content', 'SLOT', '');
          slot.componentPropertyReferences = { slotContentId: key };
          return slot;
        };
    }
    get removed() {
      return this._removed;
    }
    get characters() {
      if (this.removed) throw new Error(`Stale characters handle ${this.id}`);
      if (
        options.unreadableMissingSlotChild &&
        state.missingSlotChildIds.has(this.id)
      )
        throw new Error(`Native missing characters handle ${this.id}`);
      return this._characters || '';
    }
    set characters(value) {
      if (this.removed) throw new Error(`Stale characters handle ${this.id}`);
      this._characters = value;
      if (options.propagateLinkedCharactersStyle)
        for (const peer of linkedPeers(this)) copyTextStyle(this, peer);
    }
    get componentPropertyReferences() {
      return this._references;
    }
    set componentPropertyReferences(value) {
      this._references = value;
      if (options.propagateLinkedReferenceStyle)
        for (const peer of linkedPeers(this)) copyTextStyle(this, peer);
    }
    get textDecorationOffset() {
      return this.textDecoration === 'UNDERLINE'
        ? this._decorationOffset || { unit: 'AUTO' }
        : null;
    }
    set textDecorationOffset(value) {
      this._decorationOffset = value;
      inheritTextStyle(this);
    }
    get textDecoration() {
      return this._textDecoration;
    }
    set textDecoration(value) {
      this._textDecoration = value;
      inheritTextStyle(this);
    }
    async setTextStyleIdAsync(id) {
      const style = styles.find(item => item.id === id);
      assert(style, `Unknown probe style ${id}`);
      this.textStyleId = id;
      this.fontName = copy(style.fontName);
      this.fontSize = style.fontSize;
      this.textDecoration = style.textDecoration;
      this._decorationOffset = { unit: 'AUTO' };
      if (options.propagateLinkedStyle)
        for (const peer of linkedPeers(this)) copyTextStyle(this, peer);
      inheritTextStyle(this);
    }
    async setRangeTextStyleIdAsync(start, end, id) {
      assert.strictEqual(start, 0);
      assert.strictEqual(end, this.characters.length);
      const style = styles.find(item => item.id === id);
      assert(style);
      this.textStyleId = id;
      this.fontName = copy(style.fontName);
      this.fontSize = style.fontSize;
      this.textDecoration = style.textDecoration;
      this._decorationOffset = { unit: 'AUTO' };
      if (options.propagateRangeStyle)
        for (const peer of linkedPeers(this)) copyTextStyle(this, peer);
      inheritTextStyle(this);
    }
    setRangeTextDecoration(start, end, value) {
      assert.strictEqual(start, 0);
      assert.strictEqual(end, this.characters.length);
      this.textDecoration = value;
      if (options.propagateRangeDecoration)
        for (const peer of linkedPeers(this)) copyTextStyle(this, peer);
      inheritTextStyle(this);
    }
    get width() {
      if (this.type === 'TEXT') {
        const natural = (this.characters || '').length * 8;
        return options.legendUnsupported
          ? natural
          : Math.min(natural, this.maxWidth || Infinity);
      }
      return this._width;
    }
    get height() {
      if (this.type === 'TEXT')
        return (
          24 *
          Math.max(
            1,
            Math.ceil(((this.characters || '').length * 8) / (this.width || 1))
          )
        );
      return this._height;
    }
    resize(width, height) {
      this._width = width;
      this._height = height;
      if (options.regenerateSlotDescendants && this.type === 'COMPONENT')
        for (const node of [...nodes.values()])
          if (node.type === 'INSTANCE' && node.main === this)
            for (const child of node.findAll(item => item.type === 'INSTANCE'))
              regenerate(child);
      if (
        options.rootFailure &&
        this.name === 'Mangrove native capability probes'
      )
        throw new Error('Simulated root configuration failure');
    }
    get vectorPaths() {
      return copy(this._paths);
    }
    set vectorPaths(value) {
      if (this.parent?.type === 'INSTANCE' && !options.instanceVectors)
        throw new Error('Mock explicitly forbids instance vector geometry');
      this._paths = copy(value);
      const numbers = value[0].data.match(/-?\d+(?:\.\d+)?/g).map(Number);
      const xs = numbers.filter((_, index) => index % 2 === 0);
      const ys = numbers.filter((_, index) => index % 2 === 1);
      this.x = Math.min(...xs);
      this.y = Math.min(...ys);
      this._width = Math.max(...xs) - this.x;
      this._height = Math.max(...ys) - this.y;
    }
    appendChild(node) {
      this.insertChild(this.children.length, node);
    }
    insertChild(index, node) {
      const previousParent = node.parent;
      if (node.parent)
        node.parent.children.splice(node.parent.children.indexOf(node), 1);
      if (previousParent?.type === 'COMPONENT_SET' && this.type === 'FRAME') {
        state.repairMoves.push({
          componentId: node.id,
          setId: previousParent.id,
          remaining: previousParent.children.length,
        });
        if (!previousParent.children.length) previousParent.remove();
      }
      node.parent = this;
      this.children.splice(index, 0, node);
      if (this.type === 'COMPONENT_SET' && node._repairLocalProperty) {
        const localProperty = node._repairLocalProperty;
        const sharedProperty = Object.keys(this.definitions).find(key =>
          key.startsWith('Label#')
        );
        if (!options.keepReparentedPropertyDistinct && sharedProperty) {
          for (const child of node.findAll(item => item.type === 'TEXT'))
            if (child.componentPropertyReferences?.characters === localProperty)
              child._references = {
                ...child.componentPropertyReferences,
                characters: sharedProperty,
              };
          delete node.definitions[localProperty];
          for (const consumer of nodes.values())
            if (consumer.type === 'INSTANCE' && consumer.main === node) {
              for (const child of consumer.children)
                if (child.type === 'TEXT')
                  child._references = {
                    ...child.componentPropertyReferences,
                    characters: sharedProperty,
                  };
              if (options.loseConsumerEditsOnReparent)
                consumer.setProperties({
                  [sharedProperty]: 'Simulated lost consumer edit',
                });
            }
        }
        delete node._repairLocalProperty;
      }
      if (
        options.materializeAllSlotRoots &&
        this.type === 'SLOT' &&
        this.parent?.type === 'INSTANCE' &&
        !this._customized
      ) {
        const replacements = [...this.children].map(materialize);
        if (options.reorderMaterializedDefaults)
          [replacements[0], replacements[1]] = [
            replacements[1],
            replacements[0],
          ];
        this.children = replacements;
        for (const child of replacements) child.parent = this;
        node = replacements[index];
        this._customized = true;
      }
      if (
        options.convertInsertedSlotRoot &&
        this.type === 'SLOT' &&
        this.parent?.type === 'INSTANCE' &&
        node.type === 'INSTANCE' &&
        !node._slotInserted
      ) {
        const replacement = materialize(node);
        replacement.parent = this;
        this.children.splice(index, 0, replacement);
        node = replacement;
      }
      if (
        options.ambiguousSlotInsertion &&
        this.type === 'SLOT' &&
        this.parent?.type === 'INSTANCE' &&
        node.type === 'INSTANCE'
      ) {
        const extra = node.main.createInstance();
        extra.parent = this;
        this.children.push(extra);
      }
      if (
        options.regenerateSlotDescendants &&
        this.type === 'SLOT' &&
        this.parent?.type === 'INSTANCE' &&
        node.type === 'INSTANCE'
      )
        regenerate(node);
      if (
        options.missingInsertedSlotChild &&
        this.type === 'SLOT' &&
        this.parent?.type === 'INSTANCE' &&
        node.type === 'INSTANCE' &&
        Object.values(node.props).includes('Inserted probe sentinel')
      )
        for (const child of node.children)
          state.missingSlotChildIds.add(child.id);
    }
    setExplicitVariableModeForCollection() {}
    getSharedPluginData(namespace, key) {
      if (this.removed) throw new Error(`Stale identity handle ${this.id}`);
      return this.data[`${namespace}:${key}`] || '';
    }
    setSharedPluginData(namespace, key, value) {
      this.data[`${namespace}:${key}`] = value;
    }
    getPluginData() {
      return '';
    }
    addComponentProperty(name, type, defaultValue) {
      const key = `${name}#${this.id}`;
      this.definitions[key] = { type, defaultValue };
      if (
        this._wasVariant &&
        this.parent?.type !== 'COMPONENT_SET' &&
        type === 'TEXT' &&
        name === 'Label'
      )
        this._repairLocalProperty = key;
      return key;
    }
    get componentPropertyDefinitions() {
      if (this.type === 'COMPONENT' && this.parent?.type === 'COMPONENT_SET')
        throw new Error(
          'Can only get definitions of set or non-variant component'
        );
      if (this.type === 'COMPONENT_SET')
        return Object.assign(
          {},
          this.definitions,
          ...this.children.map(node => node.definitions)
        );
      return {
        ...this.definitions,
        ...(this.parent?.type === 'COMPONENT_SET'
          ? this.parent.componentPropertyDefinitions
          : {}),
      };
    }
    get componentProperties() {
      const owner =
        this.main.parent?.type === 'COMPONENT_SET'
          ? this.main.parent
          : this.main;
      return Object.fromEntries(
        Object.entries(owner.componentPropertyDefinitions).map(
          ([key, spec]) => [
            key,
            { type: spec.type, value: this.props[key] ?? spec.defaultValue },
          ]
        )
      );
    }
    setProperties(values) {
      const owner =
        this.main.parent?.type === 'COMPONENT_SET'
          ? this.main.parent
          : this.main;
      for (const [key, value] of Object.entries(values)) {
        assert(key in owner.componentPropertyDefinitions);
        assert.notStrictEqual(
          owner.componentPropertyDefinitions[key].type,
          'SLOT'
        );
        this.props[key] = value;
        for (const node of this.findAll(() => true))
          if (node.componentPropertyReferences?.characters === key) {
            node.characters = value;
            if (options.resetStyleOnInstanceLabelEdit) {
              node.textStyleId = styles[2].id;
              node.textDecoration = 'UNDERLINE';
              node._decorationOffset = { unit: 'AUTO' };
            }
          }
      }
    }
    async getMainComponentAsync() {
      return this.main;
    }
    createInstance() {
      function clone(source, isRoot = false) {
        const node = new Node(isRoot ? 'INSTANCE' : source.type);
        for (const key of [
          'data',
          'props',
          'componentPropertyReferences',
          'characters',
          'fontName',
          'fontSize',
          'lineHeight',
          'textStyleId',
          'textDecoration',
          '_decorationOffset',
          'maxWidth',
          'textAutoResize',
          'layoutSizingHorizontal',
          'layoutSizingVertical',
          '_width',
          '_height',
          '_paths',
          'x',
          'y',
        ])
          if (source[key] !== undefined) node[key] = copy(source[key]);
        if (isRoot) node.main = source;
        else if (source.type === 'INSTANCE') node.main = source.main;
        for (const child of source.children) node.appendChild(clone(child));
        return node;
      }
      return clone(this, true);
    }
    findAll(predicate) {
      return this.children.flatMap(node => [
        ...(predicate(node) ? [node] : []),
        ...node.findAll(predicate),
      ]);
    }
    resetSlot() {
      state.resetCalls += 1;
      throw new Error('Probe must not reset consumer slots');
    }
    remove() {
      if (this.removed) return;
      for (const child of [...this.children]) child.remove();
      if (this.parent)
        this.parent.children.splice(this.parent.children.indexOf(this), 1);
      nodes.delete(this.id);
      this._removed = true;
    }
  }
  const page = new Node('PAGE');
  const figma = {
    editorType: 'figma',
    currentPage: page,
    variables: {
      getLocalVariableCollectionsAsync: async () =>
        options.missingCollection
          ? []
          : [
              {
                id: 'collection:existing',
                name: 'Mangrove',
                modes: [{ modeId: 'mode:existing', name: 'UNDRR' }],
              },
            ],
    },
    loadFontAsync: async font => {
      if (options.missingFont) throw new Error('Missing Regular font');
      state.loadedFonts.push(copy(font));
    },
    getLocalTextStylesAsync: async () => (options.missingStyles ? [] : styles),
    combineAsVariants: (components, parent) => {
      const set = new Node('COMPONENT_SET');
      parent.appendChild(set);
      for (const component of components) {
        set.appendChild(component);
        component._wasVariant = true;
      }
      return set;
    },
    getNodeByIdAsync: async id =>
      state.missingSlotChildIds.has(id) ? null : nodes.get(id) || null,
  };
  for (const [method, type] of [
    ['createFrame', 'FRAME'],
    ['createComponent', 'COMPONENT'],
    ['createText', 'TEXT'],
    ['createVector', 'VECTOR'],
  ])
    figma[method] = () => {
      const node = new Node(type);
      page.appendChild(node);
      return node;
    };
  const context = vm.createContext({ figma });
  for (const file of ['kit-identity.js', 'kit-capabilities.js'])
    vm.runInContext(fs.readFileSync(path.join(DIR, file), 'utf8'), context);
  const call = (name, ...args) => {
    context.args = args;
    return vm.runInContext(`${name}(...args)`, context);
  };
  return { state, figma, call };
}

async function main() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(DIR, 'mangrove-variables.json'))
  );
  for (const options of [{ missingCollection: true }, { missingFont: true }]) {
    const env = environment(options);
    const created = env.state.created;
    const report = await env.call('runMangroveCapabilityProbes', doc, 'undrr');
    assert.strictEqual(report.rootId, null);
    assert.strictEqual(env.state.created, created);
    assert(report.errors.length);
  }
  console.log('ok  collection/font preflight rejects before canvas writes');
  {
    const env = environment({ rootFailure: true });
    const report = await env.call('runMangroveCapabilityProbes', doc, 'undrr');
    assert.strictEqual(report.ledger.length, 1);
    assert(report.errors[0].includes('root configuration'));
    const cleanup = await env.call('removeMangroveCapabilityProbes', report);
    assert.deepStrictEqual(copy(cleanup.removedNodeIds), [report.rootId]);
  }
  console.log('ok  partial root failure returns recoverable exact node ledger');
  {
    const env = environment({ legendUnsupported: true });
    const report = await env.call('runMangroveCapabilityProbes', doc, 'undrr');
    assert.strictEqual(report.tests.legend.supported, false);
    assert.strictEqual(report.tests.slot.status, 'unsupported');
    assert.strictEqual(report.tests.vectorInstance.status, 'error');
    assert(
      report.tests.vectorInstance.errors[0].includes('explicitly forbids')
    );
    assert(report.tests.vectorInstance.affectedNodeIds.length);
    assert.strictEqual(env.state.resetCalls, 0);
    const cleanup = await env.call('removeMangroveCapabilityProbes', report);
    assert.strictEqual(cleanup.errors.length, 0);
    assert.strictEqual(env.state.nodes.size, 1);
  }
  console.log(
    'ok  explicit unsupported native behavior remains failure, later probes and cleanup still run'
  );
  {
    const env = environment({ slots: true, instanceVectors: true });
    const foreign = env.figma.createFrame();
    foreign.name = 'Existing user frame';
    const report = await env.call('runMangroveCapabilityProbes', doc, 'undrr');
    assert(report.tests.legend.supported);
    assert(report.tests.slot.supported);
    assert(report.tests.vectorInstance.supported);
    assert.strictEqual(env.state.resetCalls, 0);
    assert.strictEqual(report.unrecordedDescendantIds.length, 0);
    assert(report.ledger.every(item => item.id !== foreign.id));
    const root = env.state.nodes.get(report.rootId);
    root.appendChild(foreign);
    const blocked = await env.call('removeMangroveCapabilityProbes', report);
    assert(blocked.errors[0].includes('foreign or unrecorded'));
    assert.strictEqual(blocked.removedNodeIds.length, 0);
    assert(env.state.nodes.has(root.id) && env.state.nodes.has(foreign.id));
    env.figma.currentPage.appendChild(foreign);
    const duplicate = copy(report);
    duplicate.ledger.push(duplicate.ledger[0]);
    assert(
      (
        await env.call('removeMangroveCapabilityProbes', duplicate)
      ).errors[0].includes('duplicate')
    );
    const moved = root.children[0];
    env.figma.currentPage.appendChild(moved);
    assert(
      (
        await env.call('removeMangroveCapabilityProbes', report)
      ).errors[0].includes('outside')
    );
    root.appendChild(moved);
    const cleanup = await env.call('removeMangroveCapabilityProbes', report);
    assert.strictEqual(cleanup.errors.length, 0);
    assert.strictEqual(cleanup.removedNodeIds.length, report.ledger.length);
    assert.deepStrictEqual(
      [...env.state.nodes.keys()],
      [env.figma.currentPage.id, foreign.id]
    );
    assert.strictEqual(
      (await env.call('removeMangroveCapabilityProbes', report)).removedNodeIds
        .length,
      0
    );
  }
  console.log(
    'ok  simulated supported branches retain IDs; cleanup refuses foreign children, duplicate ledger and moved assets'
  );
  {
    const env = environment({ slots: true, regenerateSlotDescendants: true });
    const report = await env.call('runMangroveCapabilityProbes', doc, 'undrr');
    assert(
      report.tests.slot.supported,
      JSON.stringify(report.tests.slot.errors)
    );
    assert(env.state.regenerated.length >= 4);
    for (const { oldId, newId } of env.state.regenerated) {
      assert(report.ledger.some(item => item.id === oldId));
      assert(report.ledger.some(item => item.id === newId));
    }
    // Recover an older saved ledger, with stale native handles still in traversal.
    const recovery = copy(report);
    const newIds = new Set(env.state.regenerated.map(item => item.newId));
    recovery.ledger = recovery.ledger.filter(item => !newIds.has(item.id));
    const reconciled = await env.call(
      'refreshMangroveCapabilityProbeLedger',
      recovery
    );
    assert.strictEqual(reconciled.errors.length, 0);
    assert(reconciled.addedNodeIds.length > 0);
    assert(reconciled.missingNodeIds.length > 0);
    const root = env.state.nodes.get(report.rootId);
    const slotConsumer = env.state.nodes.get(report.tests.slot.instanceId);
    const stale = {
      id: env.state.regenerated[0].oldId,
      remove() {},
      getSharedPluginData() {
        throw new Error('Stale native handle must not be read');
      },
    };
    root.children.push(stale);
    // A new direct slot child remains unauthorized, even if it is a probe clone.
    const added = env.state.nodes.get(
      report.tests.slot.observations.find(item => item.editedChildId)
        .editedChildId
    );
    const unrecorded = added.main.createInstance();
    slotConsumer.children[0].appendChild(unrecorded);
    const denied = await env.call(
      'refreshMangroveCapabilityProbeLedger',
      recovery
    );
    assert(denied.errors[0].includes('foreign or unrecorded'));
    assert(!recovery.ledger.some(item => item.id === unrecorded.id));
    unrecorded.remove();
    const cleanup = await env.call('removeMangroveCapabilityProbes', recovery);
    assert.strictEqual(cleanup.errors.length, 0);
    assert.strictEqual(env.state.nodes.size, 1);
  }
  console.log(
    'ok  slot descendant regeneration uses fresh handles, exact generated-source ledger recovery and conservative cleanup'
  );
  {
    const env = environment();
    const report = await env.call('runMangroveCapabilityProbes', doc, 'undrr');
    const removedId = report.ledger.find(item => item.type === 'TEXT').id;
    env.state.nodes.get(removedId).remove();
    const lookup = env.figma.getNodeByIdAsync;
    const tombstone = id => ({
      id,
      removed: true,
      getSharedPluginData() {
        throw new Error('Removed handle identity must not be read');
      },
      remove() {
        throw new Error('Removed root must not be removed again');
      },
    });
    env.figma.getNodeByIdAsync = async id =>
      id === removedId ? tombstone(id) : lookup(id);
    const cleanup = await env.call('removeMangroveCapabilityProbes', report);
    assert.strictEqual(cleanup.errors.length, 0);
    assert(!cleanup.removedNodeIds.includes(removedId));
    const recordedIds = new Set(report.ledger.map(item => item.id));
    env.figma.getNodeByIdAsync = async id =>
      recordedIds.has(id) ? tombstone(id) : lookup(id);
    const repeated = await env.call('removeMangroveCapabilityProbes', report);
    assert.strictEqual(repeated.errors.length, 0);
    assert.strictEqual(repeated.removedNodeIds.length, 0);
    assert.strictEqual(env.state.nodes.size, 1);
  }
  console.log(
    'ok  truthy removed handles are ignored outside the current subtree and after root removal'
  );
  {
    const env = environment({ slots: true, convertInsertedSlotRoot: true });
    const report = await env.call('runMangroveCapabilityProbes', doc, 'undrr');
    assert(
      report.tests.slot.supported,
      JSON.stringify(report.tests.slot.errors)
    );
    assert.strictEqual(env.state.convertedRoots.length, 1);
    const conversion = env.state.convertedRoots[0];
    const event = report.tests.slot.observations.find(
      item => item.phase === 'slotInsertion'
    );
    assert.strictEqual(event.returnedId, conversion.oldId);
    assert.strictEqual(event.actualInsertedId, conversion.newId);
    assert(report.ledger.some(item => item.id === conversion.newId));
    const foreign = env.figma.createFrame();
    env.state.nodes.get(report.rootId).appendChild(foreign);
    const beforeLedger = JSON.stringify(report.ledger);
    const beforeCount = env.state.created;
    const snapshot = await env.call(
      'inspectMangroveCapabilityProbeLedger',
      report
    );
    assert.strictEqual(snapshot.errors.length, 0);
    assert.strictEqual(snapshot.canAuthorizeAdoption, false);
    const unknown = snapshot.nodes.find(item => item.id === foreign.id);
    assert.strictEqual(unknown.recorded, false);
    assert.strictEqual(unknown.owner, '');
    assert.strictEqual(JSON.stringify(report.ledger), beforeLedger);
    assert.strictEqual(env.state.created, beforeCount);
    assert(
      snapshot.nodes.find(item => item.id === conversion.newId)
        .mainComponentRecorded
    );
    assert(snapshot.missingNodeIds.includes(conversion.oldId));
    assert(
      (await env.call('removeMangroveCapabilityProbes', report)).errors.length
    );
    foreign.remove();
    assert.strictEqual(
      (await env.call('removeMangroveCapabilityProbes', report)).errors.length,
      0
    );
  }
  {
    const env = environment({ slots: true, ambiguousSlotInsertion: true });
    const report = await env.call('runMangroveCapabilityProbes', doc, 'undrr');
    assert.strictEqual(report.tests.slot.supported, false);
    assert(report.tests.slot.errors[0].includes('child count'));
    assert(report.ledgerRefresh.unrecordedNodeIds.length);
    assert(
      (await env.call('removeMangroveCapabilityProbes', report)).errors.length
    );
  }
  console.log(
    'ok  new-slot insertion captures the unique converted root; ambiguous insertion and read-only snapshots never authorize adoption'
  );
  {
    const env = environment({ slots: true, materializeAllSlotRoots: true });
    const report = await env.call('runMangroveCapabilityProbes', doc, 'undrr');
    assert(
      report.tests.slot.supported,
      JSON.stringify(report.tests.slot.errors)
    );
    assert.strictEqual(env.state.convertedRoots.length, 3);
    assert.strictEqual(
      report.tests.slot.initialCustomization.defaultIdsChanged,
      true
    );
    assert(report.tests.slot.criteria.baselineChildrenPreserved);
    assert(report.tests.slot.criteria.reorderedIdsPreserved);
    for (const { oldId, newId } of env.state.convertedRoots) {
      assert(report.ledger.some(item => item.id === oldId));
      assert(report.ledger.some(item => item.id === newId));
    }
    assert.strictEqual(report.ledgerRefresh.errors.length, 0);
    const cleanup = await env.call('removeMangroveCapabilityProbes', report);
    assert.strictEqual(cleanup.errors.length, 0);
    assert.strictEqual(env.state.nodes.size, 1);
  }
  for (const options of [
    { dropConvertedOwner: true },
    { reorderMaterializedDefaults: true },
  ]) {
    const env = environment({
      slots: true,
      materializeAllSlotRoots: true,
      ...options,
    });
    const report = await env.call('runMangroveCapabilityProbes', doc, 'undrr');
    assert.strictEqual(report.tests.slot.supported, false);
    assert(report.tests.slot.errors.length);
    for (const { newId } of env.state.convertedRoots)
      assert(!report.ledger.some(item => item.id === newId));
    assert(
      (await env.call('removeMangroveCapabilityProbes', report)).errors.length
    );
  }
  console.log(
    'ok  first customization records all three proven materialized roots, preserves the later baseline and cleans exactly; lost ownership or changed order is refused'
  );
  for (const unreadableMissingSlotChild of [false, true]) {
    const env = environment({
      slots: true,
      missingInsertedSlotChild: true,
      unreadableMissingSlotChild,
    });
    const report = await env.call('runMangroveCapabilityProbes', doc, 'undrr');
    const slot = report.tests.slot;
    assert.strictEqual(slot.status, 'error');
    assert.strictEqual(slot.supported, false);
    assert.strictEqual(slot.phase, 'afterInsertion');
    const described = slot.observations.find(
      item =>
        item.operation === 'describeSlotChild' &&
        item.root.propertyLabel === 'Inserted probe sentinel'
    );
    assert(described);
    assert.strictEqual(described.advertisedChildren.length, 1);
    assert.strictEqual(described.advertisedChildren[0].lookup, 'missing');
    assert.strictEqual(described.advertisedChildren[0].resolved, null);
    assert.strictEqual(described.criteria.allChildrenResolved, false);
    assert.strictEqual(described.criteria.singleResolvedText, false);
    assert.strictEqual(described.criteria.exactMainComponent, true);
    assert.strictEqual(described.criteria.rootOwned, true);
    const raw = described.advertisedChildren[0].raw;
    assert.strictEqual(raw.parentId, described.root.id);
    assert.strictEqual(
      raw.characterPropertyReference,
      described.expectedLabelProperty
    );
    if (unreadableMissingSlotChild) {
      assert.strictEqual(raw.characters, null);
      assert(
        raw.errors.some(error => error.includes('Native missing characters'))
      );
    } else {
      assert.strictEqual(raw.characters, 'Inserted probe sentinel');
      assert.strictEqual(raw.errors.length, 0);
    }
    assert.strictEqual(described.sourceChildren.length, 1);
    assert.strictEqual(
      described.sourceChildren[0].characterPropertyReference,
      described.expectedLabelProperty
    );
    assert(!slot.observations.some(item => item.phase === 'slotInsertion'));
    assert.strictEqual(report.tests.vectorInstance.status, 'error');
    const ledgerBefore = JSON.stringify(report.ledger);
    await env.call('inspectMangroveCapabilityProbeLedger', report);
    assert.strictEqual(JSON.stringify(report.ledger), ledgerBefore);
    // No adoption is needed: the inserted root and its original child were
    // recorded before insertion. Model native's missing child during cleanup.
    const cleanup = await env.call('removeMangroveCapabilityProbes', report);
    assert.strictEqual(cleanup.errors.length, 0);
    assert.strictEqual(env.state.nodes.size, 1);
    assert(!cleanup.removedNodeIds.includes(raw.id));
  }
  console.log(
    'ok  missing Slot child lookups retain exact phase, raw handle readbacks and failed criteria without adoption or unsupported-API claims'
  );
  for (const options of [
    {},
    { propagateLinkedStyle: true },
    { propagateLinkedReferenceStyle: true },
    { propagateLinkedCharactersStyle: true },
  ]) {
    const env = environment(options);
    const sourceStylesBefore = JSON.stringify(env.state.existingStyles);
    const report = await env.call('runMangroveCapabilityProbes', doc, 'undrr');
    const probe = report.tests.textPropertyStyles;
    assert.strictEqual(probe.status, 'observed', JSON.stringify(probe.errors));
    assert.strictEqual(probe.phase, 'complete');
    assert.strictEqual(probe.supported, false);
    assert.strictEqual(probe.findings.initialStylesMatchRequested, true);
    assert.strictEqual(probe.findings.detachedStylesMatchRequested, true);
    assert.strictEqual(
      probe.findings.linkingRetainsRequestedStyles,
      !options.propagateLinkedReferenceStyle
    );
    assert.strictEqual(
      probe.findings.linkedFirstStyleChangesOtherStyleIds,
      Boolean(options.propagateLinkedStyle)
    );
    assert.strictEqual(
      probe.findings.linkedCharactersChangeStyleIds,
      Boolean(options.propagateLinkedCharactersStyle)
    );
    assert.strictEqual(
      probe.findings.linkedLastStyleChangesOtherStyleIds,
      Boolean(options.propagateLinkedStyle)
    );
    assert.strictEqual(
      probe.findings.relinkingRetainsRequestedStyles,
      !options.propagateLinkedReferenceStyle
    );
    assert.strictEqual(
      JSON.stringify(env.state.existingStyles),
      sourceStylesBefore
    );
    assert.strictEqual(
      probe.observations.filter(item =>
        item.phase.startsWith('B_bindSharedLabel')
      ).length,
      3
    );
    assert.strictEqual(
      probe.observations.filter(item =>
        item.phase.startsWith('D_relinkSharedLabel')
      ).length,
      3
    );
    assert(probe.observations.every(item => item.errors.length === 0));
    assert(
      probe.labelIds.every(id => report.ledger.some(item => item.id === id))
    );
    assert.strictEqual(
      (await env.call('removeMangroveCapabilityProbes', report)).errors.length,
      0
    );
    assert.strictEqual(env.state.nodes.size, 1);
  }
  {
    const env = environment({ missingStyles: true });
    const report = await env.call('runMangroveCapabilityProbes', doc, 'undrr');
    assert.strictEqual(report.tests.textPropertyStyles.status, 'error');
    assert.strictEqual(report.tests.textPropertyStyles.phase, 'stylePreflight');
    assert.strictEqual(
      report.tests.textPropertyStyles.affectedNodeIds.length,
      0
    );
  }
  console.log(
    'ok  text property stages distinguish reference, style setter and character propagation without mutating source styles or claiming repair acceptance'
  );
  for (const options of [
    {},
    { propagateLinkedStyle: true },
    { propagateRangeStyle: true },
    { resetStyleOnInstanceLabelEdit: true },
    { rangeApiUnavailable: true },
  ]) {
    const env = environment(options);
    const sourceStylesBefore = JSON.stringify(env.state.existingStyles);
    const report = await env.call('runMangroveCapabilityProbes', doc, 'undrr');
    const probe = report.tests.textPropertyStyles;
    const separate = probe.perVariantProperties;
    const range = probe.rangeSetters;
    assert.strictEqual(probe.status, 'observed');
    assert.strictEqual(
      separate.status,
      'observed',
      JSON.stringify(separate.errors)
    );
    assert.strictEqual(separate.createdPropertyIds.length, 3);
    assert.strictEqual(new Set(separate.createdPropertyIds).size, 3);
    assert.strictEqual(separate.standaloneComponentDefinitions.length, 3);
    for (let index = 0; index < separate.componentIds.length; index++) {
      const original = separate.standaloneComponentDefinitions[index];
      assert.strictEqual(original.id, separate.componentIds[index]);
      assert.deepStrictEqual(Object.keys(original.definitions), [
        separate.createdPropertyIds[index],
      ]);
      const variant = env.state.nodes.get(separate.componentIds[index]);
      assert.throws(
        () => variant.componentPropertyDefinitions,
        /Can only get definitions of set or non-variant component/
      );
    }
    assert(
      separate.createdPropertyIds.every(
        key => key in separate.combinedDefinitions
      )
    );
    assert(separate.createdPropertyIds.every(key => key.startsWith('Label#')));
    assert.strictEqual(separate.findings.createdPropertyIdsRetained, true);
    assert.strictEqual(separate.findings.beforeCombineMatchesRequested, true);
    assert.strictEqual(separate.findings.afterCombineMatchesRequested, true);
    assert.strictEqual(separate.findings.repeatMatchesRequested, true);
    assert.strictEqual(
      separate.findings.afterConsumerEdit.styleIdsMatchRequested,
      !options.resetStyleOnInstanceLabelEdit
    );
    assert(Object.values(separate.findings.afterMainRepeat).every(Boolean));
    assert.strictEqual(probe.supported, false);
    if (options.rangeApiUnavailable) {
      assert.strictEqual(range.status, 'unavailable');
      assert(!range.instanceIds);
      assert(
        !probe.observations.some(item => item.phase === 'F_allRangeStyled')
      );
    } else {
      assert.strictEqual(
        range.status,
        'observed',
        JSON.stringify(range.errors)
      );
      assert.strictEqual(
        range.findings.initialMatchesRequested,
        !options.propagateRangeStyle
      );
      assert.strictEqual(
        range.findings.repeatMatchesRequested,
        !options.propagateRangeStyle
      );
      assert.strictEqual(range.findings.sharedReferenceIdsRetained, true);
      assert.strictEqual(
        range.findings.afterConsumerEdit.styleIdsMatchRequested,
        !options.propagateRangeStyle && !options.resetStyleOnInstanceLabelEdit
      );
      assert.strictEqual(range.findings.afterMainRepeat.labelsMatchEdits, true);
      assert.strictEqual(
        range.findings.afterMainRepeat.propertyValuesMatchEdits,
        true
      );
      assert.strictEqual(range.findings.afterMainRepeat.labelIdsStable, true);
      assert.strictEqual(
        range.findings.afterMainRepeat.referenceIdsStable,
        true
      );
      assert.strictEqual(
        range.findings.afterMainRepeat.styleIdsMatchRequested,
        !options.propagateRangeStyle
      );
      for (const prefix of ['F_initial', 'F_repeat']) {
        assert.strictEqual(
          probe.observations.filter(item =>
            item.phase.startsWith(`${prefix}_styleSetter`)
          ).length,
          3
        );
        assert.strictEqual(
          probe.observations.filter(item =>
            item.phase.startsWith(`${prefix}_decorationSetter`)
          ).length,
          3
        );
        assert.strictEqual(
          probe.observations.filter(item =>
            item.phase.startsWith(`${prefix}_wholeNodeOffset`)
          ).length,
          2
        );
      }
    }
    assert.strictEqual(
      JSON.stringify(env.state.existingStyles),
      sourceStylesBefore
    );
    assert.strictEqual(report.ledgerRefresh.errors.length, 0);
    const cleanup = await env.call('removeMangroveCapabilityProbes', report);
    assert.strictEqual(cleanup.errors.length, 0);
    assert.strictEqual(cleanup.removedNodeIds.length, report.ledger.length);
    assert.strictEqual(env.state.nodes.size, 1);
  }
  console.log(
    'ok  E/F probes expose per-variant property IDs, range setter propagation, consumer reset and API absence; exact cleanup preserves source styles'
  );
  for (const options of [
    {},
    { propagateLinkedStyle: true },
    { propagateLinkedStyle: true, propagationRequiresSameName: true },
    { keepReparentedPropertyDistinct: true },
    { loseConsumerEditsOnReparent: true },
  ]) {
    const env = environment(options);
    const stylesBefore = JSON.stringify(env.state.existingStyles);
    const report = await env.call('runMangroveCapabilityProbes', doc, 'undrr');
    const probe = report.tests.textPropertyStyles;
    const repair = probe.existingSetRepair;
    const shouldStop =
      options.keepReparentedPropertyDistinct ||
      options.loseConsumerEditsOnReparent;
    assert.strictEqual(
      repair.status,
      shouldStop ? 'error' : 'observed',
      JSON.stringify(repair.errors)
    );
    assert.strictEqual(probe.supported, false);
    assert.strictEqual(repair.original.setId, probe.setId);
    assert.strictEqual(repair.original.propertyId, probe.propertyId);
    assert.deepStrictEqual(copy(repair.original.textIds), copy(probe.labelIds));
    assert.strictEqual(repair.existingInstanceIds.length, 6);
    assert.strictEqual(
      repair.uniqueNames.mainStylesMatchRequested,
      !options.propagateLinkedStyle ||
        Boolean(options.propagationRequiresSameName)
    );
    assert.strictEqual(
      repair.uniqueNames.freshConsumers.stylesMatchRequested,
      repair.uniqueNames.mainStylesMatchRequested
    );
    assert(env.state.repairMoves.every(item => item.remaining === 2));
    assert.strictEqual(env.state.repairMoves.length, shouldStop ? 1 : 6);
    assert.strictEqual(repair.cycles.length, shouldStop ? 0 : 2);
    if (shouldStop) {
      assert(
        repair.errors[0].includes('G stopped to preserve original identity')
      );
      assert.strictEqual(repair.freshBatches.length, 1);
      const failed = probe.observations
        .filter(item => item.operation === 'existingSetRepairInvariants')
        .at(-1);
      assert.strictEqual(
        failed.criteria.originalReferencesPreserved,
        !options.keepReparentedPropertyDistinct
      );
      assert.strictEqual(
        failed.criteria.consumerPropertyValuesPreserved,
        !options.loseConsumerEditsOnReparent
      );
    } else {
      assert(
        repair.cycles.every(item => item.originalIdentityAndEditsPreserved)
      );
      assert(repair.cycles.every(item => item.mainStylesMatchRequested));
      assert(
        repair.cycles.every(item => item.freshConsumers.stylesMatchRequested)
      );
      assert(
        repair.cycles.every(item => item.freshConsumers.originalReferenceIds)
      );
      assert.strictEqual(repair.freshBatches.length, 3);
      const set = env.state.nodes.get(probe.setId);
      assert.deepStrictEqual(
        set.children.map(node => node.id),
        copy(repair.original.order)
      );
      assert(
        probe.labelIds.every(
          (id, index) =>
            env.state.nodes.get(id).name === repair.original.textNames[index]
        )
      );
    }
    assert.strictEqual(JSON.stringify(env.state.existingStyles), stylesBefore);
    assert.strictEqual(report.ledgerRefresh.errors.length, 0);
    assert.strictEqual(
      (await env.call('removeMangroveCapabilityProbes', report)).errors.length,
      0
    );
    assert.strictEqual(env.state.nodes.size, 1);
  }
  console.log(
    'ok  G0/G1 separates fresh consumer styling from offsets, never empties the set, and stops without repeating on changed references or lost edits'
  );
  console.log(
    'UNVERIFIED: actual font metrics/HUG maxWidth wrapping, native slot propagation and vectorPaths instance permissions. Mock success proves control flow only.'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
module.exports = { environment };
