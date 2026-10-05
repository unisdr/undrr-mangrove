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
  if (!options.missingLinkStyle)
    styles.push({
      id: 'existing-style:toc-link',
      fontName: {
        family: 'Roboto',
        style: 'Regular',
        ...(options.variableFont
          ? { variationSettings: { wdth: 100, wght: 400 } }
          : {}),
      },
      fontSize: 16,
      lineHeight: { unit: 'PERCENT', value: 150 },
      textDecoration: 'UNDERLINE',
      textWrapStyle: 'AUTO',
      boundVariables: options.missingTypographyBinding
        ? {}
        : {
            fontFamily: {
              type: 'VARIABLE_ALIAS',
              id: 'existing-variable:font-family/text',
            },
            fontSize: {
              type: 'VARIABLE_ALIAS',
              id: 'existing-variable:font-size/300',
            },
          },
      getSharedPluginData: (namespace, key) =>
        key === 'mgStyleId' ? 'component.table-of-contents.link' : '',
      getPluginData: () => '',
    });
  if (!options.missingMarkerStyle)
    styles.push({
      id: 'existing-style:toc-marker',
      fontName: {
        family: 'Roboto',
        style: 'Regular',
        ...(options.variableFont
          ? { variationSettings: { wdth: 100, wght: 400 } }
          : {}),
      },
      fontSize: 16,
      lineHeight: { unit: 'PERCENT', value: 150 },
      textDecoration: 'NONE',
      textWrapStyle: 'AUTO',
      getSharedPluginData: (namespace, key) =>
        key === 'mgStyleId' ? 'component.table-of-contents.marker' : '',
      getPluginData: () => '',
    });
  const sourceDoc = JSON.parse(
    fs.readFileSync(path.join(DIR, 'mangrove-variables.json'), 'utf8')
  );
  const definitions = new Map(
    sourceDoc.variables.map(variable => [variable.name, variable])
  );
  const sourceValue = name => {
    const entry = definitions.get(name).values.undrr;
    return entry.alias ? sourceValue(entry.alias) : entry;
  };
  const colorVariables = ['color/interactive', 'color/interactive-active'].map(
    name => ({
      id: `existing-variable:${name}`,
      name,
      variableCollectionId: 'collection:existing',
      resolvedType: 'COLOR',
      values: sourceValue(name),
      resolveForConsumer() {
        return {
          value: options.quantizedColors
            ? Object.fromEntries(
                Object.entries(this.values).map(([field, value]) => [
                  field,
                  Math.fround(value),
                ])
              )
            : copy(this.values),
        };
      },
    })
  );
  const typographyVariables = ['font-family/text', 'font-size/300'].map(
    (name, index) => ({
      id: `existing-variable:${name}`,
      name,
      variableCollectionId: 'collection:existing',
      resolvedType:
        options.wrongTypographyType && index === 1
          ? 'STRING'
          : index
            ? 'FLOAT'
            : 'STRING',
      valuesByMode: {
        'mode:existing':
          options.wrongTypographyValue && index === 1 ? 18 : sourceValue(name),
      },
      resolveForConsumer() {
        return { value: this.valuesByMode['mode:existing'] };
      },
    })
  );
  const allVariables = [...colorVariables, ...typographyVariables];
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
    capWrites: [],
    bindingCalls: [],
    rangePaintWrites: [],
    sourceVariables: allVariables,
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
      'lineHeight',
      'textWrapStyle',
    ])
      if (source[field] !== undefined) target[field] = copy(source[field]);
    copyTypographyBindings(source, target);
  }
  function editedLabel(instance, source) {
    const key = source.componentPropertyReferences?.characters;
    return (
      key &&
      instance.props[key] !== undefined &&
      instance.props[key] !== source.characters
    );
  }
  function copyTypographyBindings(source, target) {
    target.boundVariables = { ...target.boundVariables };
    for (const field of ['fontFamily', 'fontSize']) {
      if (source.boundVariables?.[field])
        target.boundVariables[field] = copy(source.boundVariables[field]);
      else delete target.boundVariables[field];
    }
  }
  function rangePaint(node, paints) {
    node._rangeFills = copy(paints);
    node.boundVariables = {
      ...node.boundVariables,
      textRangeFills: paints.flatMap(paint =>
        paint.boundVariables?.color ? [copy(paint.boundVariables.color)] : []
      ),
    };
    if (node.parent?.type === 'COMPONENT')
      for (const instance of nodes.values())
        if (instance.type === 'INSTANCE' && instance.main === node.parent)
          for (const child of instance.children)
            if (child.type === 'TEXT') {
              child._rangeFills = copy(paints);
              child.boundVariables = {
                ...child.boundVariables,
                textRangeFills: copy(node.boundVariables.textRangeFills),
              };
            }
  }
  function linkedPaint(node) {
    for (const peer of linkedPeers(node)) rangePaint(peer, node.fills);
  }
  function nativePaintPeers(node) {
    return options.nativeRangeCoupling && node.textStyleId
      ? linkedPeers(node).filter(
          peer =>
            peer.textStyleId &&
            (!options.rangeCouplingRequiresSameStyle ||
              peer.textStyleId === node.textStyleId)
        )
      : [];
  }
  // Explicit inheritance model for the diagnostic's one-label instances only.
  // This does not model native styled ranges or claim native propagation parity.
  function inheritTextStyle(source) {
    if (source.parent?.type !== 'COMPONENT') return;
    for (const node of nodes.values())
      if (node.type === 'INSTANCE' && node.main === source.parent)
        if (!(
          options.preserveEditedStyleOnDetach &&
          source.textStyleId === '' &&
          editedLabel(node, source)
        ))
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
      this.fills =
        type === 'TEXT'
          ? [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1 }]
          : [];
      nodes.set(this.id, this);
      if (options.rangeApiUnavailable) {
        this.setRangeTextStyleIdAsync = undefined;
        this.setRangeTextDecoration = undefined;
      }
      if (options.rangePaintApiUnavailable) this.setRangeFills = undefined;
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
    get fills() {
      return this._fills;
    }
    get fontSize() {
      return this._fontSize;
    }
    set fontSize(value) {
      this._fontSize = value;
      if (this.boundVariables) {
        this.boundVariables = { ...this.boundVariables };
        delete this.boundVariables.fontSize;
      }
    }
    set fills(value) {
      this._fills = copy(value);
      if (options.nativeRangeCoupling && this.type === 'TEXT') {
        rangePaint(this, value);
        for (const peer of nativePaintPeers(this)) rangePaint(peer, value);
      }
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
      if (options.propagatePeerRangeOnCharacters) linkedPaint(this);
    }
    get componentPropertyReferences() {
      return this._references;
    }
    set componentPropertyReferences(value) {
      this._references = value;
      if (options.propagateLinkedReferenceStyle)
        for (const peer of linkedPeers(this)) copyTextStyle(this, peer);
      if (options.propagatePeerRangeOnReference) linkedPaint(this);
      const peers = nativePaintPeers(this);
      if (peers.length)
        rangePaint(this, peers[0].getRangeFills(0, peers[0].characters.length));
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
      if (id === '') {
        if (options.rejectStyleDetach)
          throw new Error('Synthetic unsupported empty style attachment');
        this.textStyleId = '';
        inheritTextStyle(this);
        return;
      }
      const style = styles.find(item => item.id === id);
      assert(style, `Unknown probe style ${id}`);
      this.textStyleId = id;
      this.fontName = copy(style.fontName);
      this.fontSize = style.fontSize;
      this.textDecoration = style.textDecoration;
      this._decorationOffset = { unit: 'AUTO' };
      this.lineHeight = copy(style.lineHeight || this.lineHeight);
      this.boundVariables = { ...this.boundVariables };
      for (const [field, raw] of Object.entries(style.boundVariables || {}))
        this.boundVariables[field] = Array.isArray(raw)
          ? copy(raw)
          : [copy(raw)];
      if (options.propagateLinkedStyle)
        for (const peer of linkedPeers(this)) copyTextStyle(this, peer);
      inheritTextStyle(this);
      if (options.propagatePeerRangeOnStyle) {
        rangePaint(this, this.fills);
        linkedPaint(this);
      }
    }
    getRangeFills(start, end) {
      assert.strictEqual(start, 0);
      assert.strictEqual(end, this.characters.length);
      return copy(this._rangeFills || this.fills);
    }
    setRangeFills(start, end, paints) {
      assert.strictEqual(start, 0);
      assert.strictEqual(end, this.characters.length);
      assert(
        state.loadedFonts.some(
          face =>
            face.family === this.fontName.family &&
            face.style === this.fontName.style
        ),
        'Load actual text font before range paint writes'
      );
      state.rangePaintWrites.push({ nodeId: this.id, paints: copy(paints) });
      rangePaint(this, paints);
      if (options.propagatePeerRangeOnRangeFill)
        for (const peer of linkedPeers(this)) rangePaint(peer, paints);
      for (const peer of nativePaintPeers(this)) rangePaint(peer, paints);
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
    get maxWidth() {
      return this._maxWidth ?? null;
    }
    set maxWidth(value) {
      state.capWrites.push({ nodeId: this.id, type: this.type, value });
      if (
        options.rejectDirectTextCap &&
        this.type === 'TEXT' &&
        typeof value === 'number'
      )
        throw new Error('Simulated direct TEXT maxWidth setter failure');
      this._maxWidth = value;
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
    setBoundVariable(field, variable) {
      state.bindingCalls.push({ nodeId: this.id, field, variable });
      if (this.type === 'TEXT' && field === 'maxWidth')
        throw new Error("invalid field for text node: 'maxWidth'");
      if (this.type === 'TEXT' && ['fontFamily', 'fontSize'].includes(field)) {
        if (options.failTypographyBinding && field === 'fontSize')
          throw new Error('Synthetic rejected font-size binding');
        this.boundVariables = {
          ...this.boundVariables,
          [field]: [{ type: 'VARIABLE_ALIAS', id: variable.id }],
        };
        if (field === 'fontSize')
          this._fontSize = variable.resolveForConsumer(this).value;
        else
          this.fontName = {
            ...this.fontName,
            family: variable.resolveForConsumer(this).value,
          };
        if (this.parent?.type === 'COMPONENT')
          for (const instance of nodes.values())
            if (
              instance.type === 'INSTANCE' &&
              instance.main === this.parent &&
              !(
                options.preserveEditedStyleOnDetach &&
                editedLabel(instance, this)
              )
            )
              for (const child of instance.children)
                if (child.type === 'TEXT') copyTypographyBindings(this, child);
      }
    }
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
          'layoutMode',
          'textWrapStyle',
          'fills',
          '_rangeFills',
          'boundVariables',
          'clipsContent',
          'paddingTop',
          'paddingBottom',
          'paddingLeft',
          'paddingRight',
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
      getLocalVariablesAsync: async () =>
        options.missingColorRoles
          ? typographyVariables
          : options.missingTypographyVariable
            ? colorVariables
            : options.duplicateColorRole
              ? [...allVariables, colorVariables[0]]
              : options.duplicateTypographyVariable
                ? [...allVariables, typographyVariables[1]]
                : allVariables,
      getVariableByIdAsync: async id =>
        options.missingTypographyLookup && id.includes('font-')
          ? null
          : allVariables.find(variable => variable.id === id) || null,
      setBoundVariableForPaint: (paint, field, variable) => {
        assert.strictEqual(field, 'color');
        return {
          ...copy(paint),
          boundVariables: {
            color: { type: 'VARIABLE_ALIAS', id: variable.id },
          },
        };
      },
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
  for (const options of [
    { missingLinkStyle: true },
    { missingMarkerStyle: true },
    { missingStyles: true },
    { missingColorRoles: true },
    { duplicateColorRole: true },
    { missingFont: true },
    { missingTypographyBinding: true },
    { missingTypographyVariable: true },
    { duplicateTypographyVariable: true },
    { wrongTypographyType: true },
    { wrongTypographyValue: true },
    { missingTypographyLookup: true },
  ]) {
    const env = environment(options);
    const created = env.state.created;
    const report = await env.call(
      'runMangroveCapabilityProbes',
      doc,
      'undrr',
      'toc-range-paints'
    );
    assert.strictEqual(report.rootId, null);
    assert.strictEqual(env.state.created, created);
    assert.strictEqual(report.ledger.length, 0);
    assert.strictEqual(env.state.loadedFonts.length, 0);
    assert.strictEqual(env.state.rangePaintWrites.length, 0);
    assert(report.errors[0].startsWith('Preflight:'));
  }
  for (const change of [
    value => {
      value.styles.text.find(
        style => style.id === 'component.table-of-contents.link'
      ).values.undrr.textDecoration = 'NONE';
    },
    value => {
      value.variables.find(
        variable => variable.name === 'color/interactive'
      ).type = 'FLOAT';
    },
  ]) {
    const changed = copy(doc);
    change(changed);
    const env = environment();
    const report = await env.call(
      'runMangroveCapabilityProbes',
      changed,
      'undrr',
      'toc-range-paints'
    );
    assert.strictEqual(report.rootId, null);
    assert.strictEqual(env.state.loadedFonts.length, 0);
    assert.strictEqual(env.state.rangePaintWrites.length, 0);
  }
  console.log(
    'ok  TOC range preflight rejects missing/ambiguous native fonts/styles/roles and wrong source metadata before canvas'
  );
  {
    const env = environment({ variableFont: true, quantizedColors: true });
    const stylesBefore = JSON.stringify(env.state.existingStyles);
    const variablesBefore = JSON.stringify(env.state.sourceVariables);
    const report = await env.call(
      'runMangroveCapabilityProbes',
      doc,
      'undrr',
      'toc-range-paints'
    );
    const probe = report.tests.tocRangePaints;
    assert.deepStrictEqual(Object.keys(report.tests), ['tocRangePaints']);
    assert.strictEqual(report.ledger.length, 55);
    assert.strictEqual(report.errors.length, 0);
    assert.strictEqual(probe.errors.length, 0, JSON.stringify(probe.errors));
    assert.strictEqual(probe.supported, true);
    assert.deepStrictEqual(copy(report.fonts.loaded), [
      {
        family: 'Roboto',
        style: 'Regular',
        variationSettings: { wdth: 100, wght: 400 },
      },
    ]);
    for (const sample of probe.cases) {
      assert.strictEqual(
        sample.observations.length,
        sample.id === 'F' ? 162 : 68
      );
      assert.strictEqual(sample.supported, true, JSON.stringify(sample));
      assert(
        sample.observations.every(
          observation => observation.labels.length === 2
        )
      );
      for (const phase of ['initial', 'repeat1', 'repeat2', 'guarded']) {
        const setters = sample.observations.filter(
          observation =>
            observation.phase.startsWith(`${phase}_`) && observation.operation
        );
        assert.strictEqual(setters.length, 14);
        assert.deepStrictEqual(
          copy(setters.map(observation => observation.operation.name)),
          Array(2)
            .fill([
              'style',
              'characters',
              'nominalFill',
              'reference',
              'layout',
              'decoration',
              'rangeFill',
            ])
            .flat()
        );
      }
      assert.strictEqual(sample.observations.at(-1).consumers.length, 2);
      assert.strictEqual(
        sample.candidateFindings.paintOnlyRangeRolesMatch,
        true
      );
      assert.strictEqual(sample.candidateFindings.guardedRangeRolesMatch, true);
      assert.strictEqual(sample.crossVariantChanges.length, 0);
      if (sample.id === 'B')
        assert.deepStrictEqual(copy(sample.propertyIds), [null, null]);
      else assert(sample.propertyIds.every(key => key.includes('#')));
      if (sample.id === 'D') assert.notStrictEqual(...sample.propertyIds);
      if (sample.id === 'C' || sample.id === 'F')
        assert(
          sample.observations.at(-1).labels.every(label => !label.textStyleId)
        );
      else
        assert(
          sample.observations
            .at(-1)
            .labels.every(
              label => label.fontName.variationSettings.wght === 400
            )
        );
      assert.strictEqual(
        sample.candidateFindings.guardedSkips.filter(
          item => item.setter === 'characters'
        ).length,
        2
      );
      assert.strictEqual(sample.findings.mainTypographyMatches, true);
      assert.strictEqual(sample.findings.consumerTypographyMatches, true);
      if (sample.id === 'E') {
        assert.notStrictEqual(...sample.requestedStyleIds);
        assert(
          sample.observations
            .at(-1)
            .labels.every(
              (label, index) =>
                label.textStyleId === sample.requestedStyleIds[index]
            )
        );
      }
      if (sample.id === 'F') {
        assert.strictEqual(sample.detachFindings.styleIdsCleared, true);
        assert.strictEqual(sample.detachFindings.consumerStyleIdsCleared, true);
        assert.strictEqual(sample.detachFindings.repeatedRangeRolesMatch, true);
        assert.strictEqual(
          sample.detachFindings.identitiesAndEditsRetained,
          true
        );
      }
      assert.strictEqual(
        sample.candidateFindings.guardedSkips.filter(
          item => item.setter === 'style'
        ).length,
        2
      );
    }
    assert.strictEqual(JSON.stringify(env.state.existingStyles), stylesBefore);
    assert.strictEqual(
      JSON.stringify(env.state.sourceVariables),
      variablesBefore
    );
    const cleanup = await env.call(
      'removeMangroveCapabilityProbes',
      copy(report)
    );
    assert.strictEqual(
      cleanup.errors.length,
      0,
      JSON.stringify(cleanup.errors)
    );
    assert.strictEqual(cleanup.removedNodeIds.length, 55);
    assert.strictEqual(env.state.nodes.size, 1);
  }
  console.log(
    'ok  TOC range six control pairs record every setter, exact typography, native font variations and resolved aliases, preserving source assets with saved-ledger cleanup'
  );
  for (const options of [
    { propagatePeerRangeOnStyle: true },
    { propagatePeerRangeOnRangeFill: true },
    { propagatePeerRangeOnCharacters: true },
    { propagatePeerRangeOnReference: true },
  ]) {
    const env = environment(options);
    const report = await env.call(
      'runMangroveCapabilityProbes',
      doc,
      'undrr',
      'toc-range-paints'
    );
    const cases = report.tests.tocRangePaints.cases;
    assert.strictEqual(report.ledger.length, 55);
    assert.strictEqual(report.tests.tocRangePaints.errors.length, 0);
    assert.strictEqual(cases[0].findings.repeatedRangeRolesMatch, false);
    assert.strictEqual(cases[1].findings.repeatedRangeRolesMatch, true);
    assert.strictEqual(cases[3].findings.repeatedRangeRolesMatch, true);
    assert.strictEqual(
      cases[2].findings.repeatedRangeRolesMatch,
      Boolean(options.propagatePeerRangeOnStyle)
    );
    const expectedSetter = options.propagatePeerRangeOnStyle
      ? 'style'
      : options.propagatePeerRangeOnRangeFill
        ? 'rangeFill'
        : options.propagatePeerRangeOnCharacters
          ? 'characters'
          : 'reference';
    assert.strictEqual(cases[0].crossVariantChanges[0].setter, expectedSetter);
    assert(
      cases[0].crossVariantChanges.some(change =>
        change.phase.startsWith('repeat2_')
      )
    );
    assert(
      cases[0].observations
        .at(-1)
        .labels.every(label => label.nominal.resolved.length === 1)
    );
    assert.strictEqual(
      cases[0].candidateFindings.paintOnlyRangeRolesMatch,
      !options.propagatePeerRangeOnRangeFill
    );
    assert.strictEqual(
      cases[0].candidateFindings.guardedRangeRolesMatch,
      Boolean(
        options.propagatePeerRangeOnStyle ||
        options.propagatePeerRangeOnCharacters
      )
    );
    assert(
      cases.every(
        sample =>
          sample.findings.consumerEditsRetained &&
          sample.findings.consumerIdsStable
      )
    );
    assert.strictEqual(
      (await env.call('removeMangroveCapabilityProbes', report)).errors.length,
      0
    );
    assert.strictEqual(env.state.nodes.size, 1);
  }
  console.log(
    'ok  synthetic style/character/reference/range coupling identifies exact peer-changing phases and separates paint-only/unchanged-setter candidates'
  );
  for (const sameStyle of [false, true]) {
    const env = environment({
      nativeRangeCoupling: true,
      rangeCouplingRequiresSameStyle: sameStyle,
      variableFont: true,
      quantizedColors: true,
    });
    const stylesBefore = JSON.stringify(env.state.existingStyles);
    const variablesBefore = JSON.stringify(env.state.sourceVariables);
    const report = await env.call(
      'runMangroveCapabilityProbes',
      doc,
      'undrr',
      'toc-range-paints'
    );
    const [a, b, c, d, e, f] = report.tests.tocRangePaints.cases;
    assert.strictEqual(report.ledger.length, 55);
    assert.strictEqual(report.tests.tocRangePaints.errors.length, 0);
    assert.strictEqual(a.findings.initialRangeRolesMatch, false);
    assert.strictEqual(a.findings.repeatedRangeRolesMatch, false);
    assert.strictEqual(a.candidateFindings.paintOnlyRangeRolesMatch, false);
    assert.strictEqual(a.candidateFindings.guardedRangeRolesMatch, false);
    assert.strictEqual(a.crossVariantChanges[0].phase, 'initial_1_rangeFill');
    assert(
      a.crossVariantChanges
        .filter(change => change.phase.startsWith('repeat'))
        .every(change => change.setter === 'nominalFill')
    );
    assert([b, c, d].every(sample => sample.supported));
    assert.strictEqual(e.findings.repeatedRangeRolesMatch, sameStyle);
    assert.strictEqual(e.findings.mainStyleIdsMatch, true);
    assert.strictEqual(e.findings.mainTypographyMatches, true);
    assert.strictEqual(e.findings.consumerTypographyMatches, true);
    assert.strictEqual(f.detachFindings.beforeRangeRolesMatch, false);
    assert.strictEqual(f.detachFindings.repairedRangeRolesMatch, true);
    assert.strictEqual(f.detachFindings.repeatedRangeRolesMatch, true);
    assert.strictEqual(f.detachFindings.consumerRangeRolesMatch, true);
    assert.strictEqual(f.detachFindings.styleIdsCleared, true);
    assert.strictEqual(f.detachFindings.consumerStyleIdsCleared, true);
    assert.strictEqual(f.detachFindings.typographyMatches, true);
    assert.strictEqual(f.detachFindings.identitiesAndEditsRetained, true);
    assert.strictEqual(
      f.supported,
      false,
      'Original styled repeat remains failed even if detachment is a successful diagnostic transition'
    );
    assert.strictEqual(JSON.stringify(env.state.existingStyles), stylesBefore);
    assert.strictEqual(
      JSON.stringify(env.state.sourceVariables),
      variablesBefore
    );
    assert.strictEqual(
      (await env.call('removeMangroveCapabilityProbes', copy(report))).errors
        .length,
      0
    );
    assert.strictEqual(env.state.nodes.size, 1);
  }
  {
    const env = environment({
      nativeRangeCoupling: true,
      rejectStyleDetach: true,
    });
    const report = await env.call(
      'runMangroveCapabilityProbes',
      doc,
      'undrr',
      'toc-range-paints'
    );
    const f = report.tests.tocRangePaints.cases[5];
    assert.strictEqual(report.ledger.length, 55);
    assert.strictEqual(f.status, 'error');
    assert.strictEqual(f.phase, 'detach_0_detachStyle');
    assert(f.errors[0].includes('unsupported empty style'));
    assert.strictEqual(f.beforeDetachment.consumers.length, 2);
    assert.strictEqual(
      (await env.call('removeMangroveCapabilityProbes', copy(report))).errors
        .length,
      0
    );
    assert.strictEqual(env.state.nodes.size, 1);
  }
  console.log(
    'ok  observed shared-style/property paint pattern separates distinct-style IDs from in-place detach transition and retains edits, typography and exact failure cleanup'
  );
  {
    const env = environment({
      nativeRangeCoupling: true,
      preserveEditedStyleOnDetach: true,
      variableFont: true,
      quantizedColors: true,
    });
    const stylesBefore = JSON.stringify(env.state.existingStyles);
    const variablesBefore = JSON.stringify(env.state.sourceVariables);
    const report = await env.call(
      'runMangroveCapabilityProbes',
      doc,
      'undrr',
      'toc-range-paints'
    );
    const f = report.tests.tocRangePaints.cases[5];
    assert.strictEqual(report.ledger.length, 55);
    assert.strictEqual(f.observations.length, 162);
    assert.strictEqual(f.status, 'observed', JSON.stringify(f.errors));
    assert.strictEqual(f.detachFindings.consumerStyleIdsCleared, false);
    for (const [field, actual] of Object.entries(f.bindingFindings))
      assert.strictEqual(
        actual,
        field !== 'sharedStyleAssociationSatisfied',
        field
      );
    const literal = f.observations.find(
      observation => observation.phase === 'bindingRepair_0_directTypography'
    );
    assert.strictEqual(
      literal.labels[0].boundVariables.fontSize,
      undefined,
      'Literal font-size write clears native alias'
    );
    const bound = f.observations.find(
      observation => observation.phase === 'bindingRepair_0_fontSizeBinding'
    );
    assert.strictEqual(
      bound.labels[0].typographyBindingValues.find(
        binding => binding.field === 'fontSize'
      ).sourceMatches,
      true
    );
    const final = f.observations.at(-1);
    assert.strictEqual(final.phase, 'binding_final');
    assert(
      final.labels.every(label =>
        label.typographyBindingValues.every(binding => binding.sourceMatches)
      )
    );
    assert(
      final.consumers
        .filter(consumer => !consumer.edited)
        .every(consumer =>
          consumer.label.typographyBindingValues.every(
            binding => binding.sourceMatches
          )
        )
    );
    assert.strictEqual(
      final.consumers.find(consumer => consumer.edited).label.textStyleId,
      'existing-style:toc-link'
    );
    for (const pass of [1, 2]) {
      const setters = f.observations.filter(
        observation =>
          observation.phase.startsWith(`bindingRepeat${pass}_`) &&
          observation.operation
      );
      assert.strictEqual(setters.length, 18);
      for (const index of [0, 1]) {
        const names = setters
          .filter(observation => observation.operation.index === index)
          .map(observation => observation.operation.name);
        assert.deepStrictEqual(copy(names), [
          'directTypography',
          'characters',
          'reference',
          'layout',
          'decoration',
          'fontFamilyBinding',
          'fontSizeBinding',
          'nominalFill',
          'rangeFill',
        ]);
      }
    }
    const calls = env.state.bindingCalls.filter(call =>
      ['fontFamily', 'fontSize'].includes(call.field)
    );
    assert.strictEqual(calls.length, 12);
    assert(
      calls.every(call => f.labelIds.includes(call.nodeId)),
      'Only exact owned main labels are rebound; edited consumers are untouched'
    );
    assert.strictEqual(JSON.stringify(env.state.existingStyles), stylesBefore);
    assert.strictEqual(
      JSON.stringify(env.state.sourceVariables),
      variablesBefore
    );
    assert.strictEqual(
      (await env.call('removeMangroveCapabilityProbes', copy(report))).errors
        .length,
      0
    );
    assert.strictEqual(env.state.nodes.size, 1);
  }
  {
    const env = environment({ failTypographyBinding: true });
    const report = await env.call(
      'runMangroveCapabilityProbes',
      doc,
      'undrr',
      'toc-range-paints'
    );
    const f = report.tests.tocRangePaints.cases[5];
    assert.strictEqual(report.ledger.length, 55);
    assert.strictEqual(f.status, 'error');
    assert.strictEqual(f.phase, 'bindingRepair_0_fontSizeBinding');
    assert(f.errors[0].includes('rejected font-size binding'));
    assert(!f.bindingFindings);
    assert.strictEqual(
      (await env.call('removeMangroveCapabilityProbes', copy(report))).errors
        .length,
      0
    );
    assert.strictEqual(env.state.nodes.size, 1);
  }
  console.log(
    'ok  source-style aliases restore font bindings after literals across two repeats while preserving exact edited-consumer readbacks and reporting shared association as unmet'
  );
  {
    const env = environment({ rangePaintApiUnavailable: true });
    const report = await env.call(
      'runMangroveCapabilityProbes',
      doc,
      'undrr',
      'toc-range-paints'
    );
    assert.strictEqual(report.ledger.length, 31);
    assert.strictEqual(report.tests.tocRangePaints.errors.length, 6);
    assert(
      report.tests.tocRangePaints.cases.every(
        sample =>
          sample.status === 'error' && sample.phase === 'initial_0_rangeFill'
      )
    );
    assert.strictEqual(
      (await env.call('removeMangroveCapabilityProbes', copy(report))).errors
        .length,
      0
    );
    assert.strictEqual(env.state.nodes.size, 1);
  }
  console.log(
    'ok  unavailable range API retains immediate owned evidence with exact failure phases and recoverable cleanup'
  );
  for (const scope of ['toc', null, {}, '']) {
    const env = environment();
    const created = env.state.created;
    const report = await env.call(
      'runMangroveCapabilityProbes',
      doc,
      'undrr',
      scope
    );
    assert.strictEqual(report.rootId, null);
    assert.strictEqual(env.state.created, created);
    assert.strictEqual(env.state.loadedFonts.length, 0);
    assert.strictEqual(report.ledger.length, 0);
    assert(report.errors[0].includes('Unknown capability probe scope'));
  }
  console.log('ok  invalid diagnostic scope rejects before fonts and canvas');
  for (const change of [
    value => {
      value.fontName.family = 'Other Regular';
    },
    value => {
      value.fontSize = 18;
    },
  ]) {
    const changed = copy(doc);
    change(
      changed.styles.text.find(style => style.id === 'text.text.300.regular')
        .values.undrr
    );
    const env = environment();
    const created = env.state.created;
    const report = await env.call(
      'runMangroveCapabilityProbes',
      changed,
      'undrr',
      'toc-link-sizing'
    );
    assert.strictEqual(report.rootId, null);
    assert.strictEqual(env.state.created, created);
    assert.strictEqual(env.state.loadedFonts.length, 0);
    assert(report.errors[0].includes('exact source Roboto Regular'));
  }
  {
    const env = environment();
    const stylesBefore = JSON.stringify(env.state.existingStyles);
    const report = await env.call(
      'runMangroveCapabilityProbes',
      doc,
      'undrr',
      'toc-link-sizing'
    );
    assert.deepStrictEqual(copy(report.errors), []);
    assert.strictEqual(report.scope, 'toc-link-sizing');
    assert.deepStrictEqual(Object.keys(report.tests), ['tocLinkSizing']);
    assert.deepStrictEqual(
      copy(report.preflight.diagnosticCaps),
      [195.5, 345.5, 855.5]
    );
    assert.strictEqual(env.state.loadedFonts.length, 1);
    assert.deepStrictEqual(env.state.loadedFonts[0], {
      family: 'Roboto',
      style: 'Regular',
    });
    assert.strictEqual(env.state.resetCalls, 0);
    assert.strictEqual(env.state.bindingCalls.length, 0);
    assert.strictEqual(JSON.stringify(env.state.existingStyles), stylesBefore);
    assert(
      ![...env.state.nodes.values()].some(n =>
        ['SLOT', 'VECTOR', 'COMPONENT_SET'].includes(n.type)
      )
    );
    const sizing = report.tests.tocLinkSizing;
    assert.strictEqual(sizing.observations.length, 9);
    // The mock has no auto-layout engine. Its fixed instance geometry must not
    // be promoted to supported native shrink-to-fit from successful setters.
    assert.strictEqual(sizing.supported, false);
    for (const sample of sizing.observations) {
      assert.strictEqual(sample.status, 'observed', sample.errors.join('\n'));
      assert.strictEqual(sample.observations.length, 8);
      assert.strictEqual(sample.criteria.propertyTextPropagates, true);
      assert.strictEqual(sample.criteria.stableTextIds, true);
      assert.strictEqual(
        sample.criteria.editedLabelRetainedAfterMasterWrite,
        true
      );
      assert(sample.propertyId.startsWith('Label#'));
      const first = sample.observations[0],
        after = sample.observations.at(-1);
      assert.strictEqual(first.fontSize, 16);
      assert.deepStrictEqual(copy(first.lineHeight), {
        unit: 'PIXELS',
        value: 24,
      });
      assert.strictEqual(first.instance.paddingTop, 2.5);
      assert.strictEqual(first.instance.paddingBottom, 2.5);
      assert.strictEqual(first.instance.clipsContent, false);
      assert.strictEqual(first.textDecoration, 'UNDERLINE');
      assert.deepStrictEqual(copy(first.textDecorationOffset), {
        unit: 'PERCENT',
        value: 15,
      });
      assert.strictEqual(first.textWrapStyle, 'AUTO');
      assert.strictEqual(after.propertyId, first.propertyId);
      assert.deepStrictEqual(copy(after.masterProperty), {
        type: 'TEXT',
        defaultValue: 'Short link',
      });
      assert.strictEqual(after.text.id, first.text.id);
      assert.strictEqual(after.instance.id, first.instance.id);
      assert.strictEqual(after.actualMainComponentId, sample.masterId);
      const direct = sample.pattern === 'direct-text-cap-hug-text';
      assert.strictEqual(
        first[direct ? 'masterText' : 'master'].maxWidth,
        sample.requestedCap
      );
      assert.strictEqual(
        after[direct ? 'masterText' : 'master'].maxWidth,
        sample.requestedCap - 10
      );
      // This deliberately limited mock does not propagate changed master caps.
      // The exact report exposes ignored/non-modelled consumer inheritance.
      assert.strictEqual(
        after[direct ? 'text' : 'instance'].maxWidth,
        sample.requestedCap
      );
    }
    const root = env.state.nodes.get(report.rootId);
    const outsider = env.figma.createFrame();
    outsider.name = 'Unrelated canonical artifact';
    root.appendChild(outsider);
    const refused = await env.call('removeMangroveCapabilityProbes', report);
    assert.strictEqual(refused.removedNodeIds.length, 0);
    assert(refused.errors[0].includes('foreign or unrecorded'));
    env.figma.currentPage.appendChild(outsider);
    const moved = root.children.find(n => n.type === 'COMPONENT');
    env.figma.currentPage.appendChild(moved);
    const movedRefusal = await env.call(
      'removeMangroveCapabilityProbes',
      report
    );
    assert.strictEqual(movedRefusal.removedNodeIds.length, 0);
    assert(movedRefusal.errors[0].includes('outside'));
    root.appendChild(moved);
    const cleanup = await env.call(
      'removeMangroveCapabilityProbes',
      copy(report)
    );
    assert.deepStrictEqual(copy(cleanup.errors), []);
    assert.strictEqual(cleanup.removedNodeIds.length, report.ledger.length);
    assert(env.state.nodes.has(outsider.id));
    assert.strictEqual(env.state.nodes.size, 2);
  }
  console.log(
    'ok  scoped TOC runs only nine finite source-cap patterns, saves actual Label/cap/axis evidence, preserves edits and uses exact-owned cleanup'
  );
  {
    const env = environment({ rejectDirectTextCap: true });
    const report = await env.call(
      'runMangroveCapabilityProbes',
      doc,
      'undrr',
      'toc-link-sizing'
    );
    const probe = report.tests.tocLinkSizing;
    assert.strictEqual(
      probe.observations.filter(s => s.status === 'error').length,
      3
    );
    assert.strictEqual(probe.errors.length, 3);
    assert.strictEqual(
      probe.observations.filter(s => s.status === 'observed').length,
      6
    );
    assert(report.ledger.length);
    assert.strictEqual(report.ledgerRefresh.errors.length, 0);
    const cleanup = await env.call('removeMangroveCapabilityProbes', report);
    assert.strictEqual(cleanup.errors.length, 0);
    assert.strictEqual(cleanup.removedNodeIds.length, report.ledger.length);
    assert.strictEqual(env.state.nodes.size, 1);
  }
  console.log(
    'ok  rejected native direct cap setters retain an exact partial diagnostic ledger and do not trigger a fallback'
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
