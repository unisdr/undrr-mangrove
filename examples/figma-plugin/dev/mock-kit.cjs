#!/usr/bin/env node
/** Targeted native component and diagnostics checks. This mock does not render. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const DIR = path.resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));
const identity = (asset, key) =>
  asset.getSharedPluginData?.('orgundrrmangrove', key) ||
  asset.getPluginData(key);

// Reuse the variables/styles mock without executing its independent scenarios.
const baseSource = fs.readFileSync(
  path.join(__dirname, 'mock-figma.cjs'),
  'utf8'
);
const factoryBoundary = baseSource.indexOf('\nfunction loadPlugin(');
assert(factoryBoundary > 0, 'Variables mock factory boundary is missing');
const factoryModule = { exports: {} };
vm.runInNewContext(
  `${baseSource.slice(0, factoryBoundary)}\nmodule.exports = createFigma;`,
  { require, __dirname, module: factoryModule }
);

function environment(doc, options = {}) {
  const fonts = new Map();
  for (const spec of doc.styles.text)
    for (const value of Object.values(spec.values))
      fonts.set(
        `${value.fontName.family} ${value.fontName.style}`,
        value.fontName
      );
  fonts.set('Inter Regular', { family: 'Inter', style: 'Regular' });
  const state = {
    modeLimit: 1,
    collections: [],
    variables: [],
    styles: [],
    fonts: [...fonts.values()].map(fontName => ({ fontName })),
    loadedFonts: new Set(),
    rejectedFonts: new Set(options.rejectedFonts || []),
    nodes: new Map(),
    viewportCalls: 0,
  };
  const figma = factoryModule.exports(state);
  const rejectPrivate = () => {
    throw new Error('Private plugin data is unsupported in this runtime');
  };
  if (options.sharedOnly) {
    for (const method of ['createTextStyle', 'createEffectStyle']) {
      const create = figma[method];
      figma[method] = () => {
        const style = create();
        style.getPluginData = style.setPluginData = rejectPrivate;
        return style;
      };
    }
  }
  let sequence = 0;
  const next = () => `node:${++sequence}`;
  function resolve(variable, consumer, seen = new Set()) {
    assert(!seen.has(variable.id), 'Variable alias cycle');
    seen.add(variable.id);
    const collection = state.collections.find(
      item => item.id === variable.variableCollectionId
    );
    let mode = collection.modes[0].modeId;
    for (let node = consumer; node; node = node.parent) {
      if (node.explicitVariableModes?.[collection.id]) {
        mode = node.explicitVariableModes[collection.id];
        break;
      }
    }
    const value = variable.valuesByMode[mode];
    return value?.type === 'VARIABLE_ALIAS'
      ? resolve(
          state.variables.find(item => item.id === value.id),
          consumer,
          seen
        )
      : value;
  }
  const baseCreateVariable = figma.variables.createVariable;
  figma.variables.createVariable = (...args) => {
    const variable = baseCreateVariable(...args);
    variable.resolveForConsumer = consumer => ({
      value: resolve(variable, consumer),
      resolvedType: variable.resolvedType,
    });
    if (options.sharedOnly)
      variable.getPluginData = variable.setPluginData = rejectPrivate;
    return variable;
  };
  figma.variables.getVariableByIdAsync = async id =>
    state.variables.find(item => item.id === id);
  figma.variables.setBoundVariableForPaint = (paint, field, variable) => {
    assert.strictEqual(field, 'color');
    assert.strictEqual(variable.resolvedType, 'COLOR');
    return {
      ...copy(paint),
      boundVariables: { color: { type: 'VARIABLE_ALIAS', id: variable.id } },
    };
  };

  class Node {
    constructor(type) {
      this.id = next();
      this.type = type;
      this.name = type;
      this.parent = null;
      this.children = [];
      this.data = {};
      this.x = this.y = 0;
      this.width = this.height = 100;
      this.fills = [];
      this.strokes = [];
      this.effects = [];
      this.boundVariables = {};
      this.explicitVariableModes = {};
      this.visible = true;
      this.removed = false;
      this.layoutMode = 'NONE';
      this.clipsContent = false;
      this._strokesIncludedInLayout = false;
      this._fontName = { family: 'Inter', style: 'Regular' };
      this._characters = '';
      this._definitions = {};
      this.overrides = {};
      this._horizontal = this._vertical = 'FIXED';
      state.nodes.set(this.id, this);
    }
    set name(value) {
      if (this.type === 'COMPONENT' && this.parent?.type === 'COMPONENT_SET')
        assert(/[^=,]+=.+/.test(value), 'Variant names must encode properties');
      this._name = value;
    }
    get name() {
      return this._name;
    }
    set strokesIncludedInLayout(value) {
      assert(
        this.layoutMode !== 'NONE',
        'Stroke layout needs auto layout enabled first'
      );
      this._strokesIncludedInLayout = value;
    }
    get strokesIncludedInLayout() {
      return this._strokesIncludedInLayout;
    }
    getPluginData(key) {
      if (options.sharedOnly) rejectPrivate();
      return this.data[key] || '';
    }
    setPluginData(key, value) {
      if (options.sharedOnly) rejectPrivate();
      this.data[key] = value;
    }
    getSharedPluginData(namespace, key) {
      return this.sharedData?.[namespace]?.[key] || '';
    }
    setSharedPluginData(namespace, key, value) {
      this.sharedData = this.sharedData || {};
      this.sharedData[namespace] = this.sharedData[namespace] || {};
      this.sharedData[namespace][key] = value;
    }
    appendChild(node) {
      this.insertChild(this.children.length, node);
    }
    insertChild(index, node) {
      assert(
        !['TEXT', 'RECTANGLE'].includes(this.type),
        'Cannot parent in a leaf'
      );
      if (node.type === 'TEXT') node.requireFont();
      if (node.parent)
        node.parent.children.splice(node.parent.children.indexOf(node), 1);
      node.parent = this;
      this.children.splice(index, 0, node);
    }
    findAll(callback = () => true) {
      const nodes = [];
      for (const child of this.children) {
        if (callback(child)) nodes.push(child);
        nodes.push(...child.findAll(callback));
      }
      return nodes;
    }
    findAllWithCriteria({ types }) {
      return this.findAll(node => types.includes(node.type));
    }
    resize(width, height) {
      assert(
        Number.isFinite(width) &&
          width > 0 &&
          Number.isFinite(height) &&
          height > 0
      );
      this.width = width;
      this.height = height;
    }
    resizeWithoutConstraints(width, height) {
      this.resize(width, height);
    }
    set layoutSizingHorizontal(value) {
      if (value === 'FILL')
        assert(
          this.parent && this.parent.layoutMode !== 'NONE',
          'FILL needs auto layout parent'
        );
      this._horizontal = value;
    }
    get layoutSizingHorizontal() {
      return this._horizontal;
    }
    set layoutSizingVertical(value) {
      if (value === 'FILL')
        assert(
          this.parent && this.parent.layoutMode !== 'NONE',
          'FILL needs auto layout parent'
        );
      this._vertical = value;
    }
    get layoutSizingVertical() {
      return this._vertical;
    }
    set counterAxisAlignItems(value) {
      assert(
        ['MIN', 'CENTER', 'MAX', 'BASELINE'].includes(value),
        'Invalid alignment enum'
      );
      this._counterAlign = value;
    }
    get counterAxisAlignItems() {
      return this._counterAlign;
    }
    requireFont() {
      assert(
        state.loadedFonts.has(
          `${this._fontName.family} ${this._fontName.style}`
        ),
        `Text mutation with unloaded ${this._fontName.family} ${this._fontName.style}`
      );
    }
    set fontName(value) {
      assert(
        state.loadedFonts.has(`${value.family} ${value.style}`),
        'Assigned unloaded font'
      );
      this._fontName = copy(value);
    }
    get fontName() {
      return this.type === 'TEXT' ? this._fontName : undefined;
    }
    set characters(value) {
      this.requireFont();
      this._characters = value;
    }
    get characters() {
      return this.type === 'TEXT' ? this._characters : undefined;
    }
    getStyledTextSegments() {
      return [{ fontName: this.fontName }];
    }
    getRangeAllFontNames() {
      return [this.fontName];
    }
    setBoundVariable(field, variable) {
      if (!variable) {
        delete this.boundVariables[field];
        return;
      }
      assert.strictEqual(
        variable.resolvedType,
        field === 'visible'
          ? 'BOOLEAN'
          : ['fontFamily', 'fontStyle', 'characters'].includes(field)
            ? 'STRING'
            : 'FLOAT'
      );
      this.boundVariables[field] = { type: 'VARIABLE_ALIAS', id: variable.id };
    }
    setExplicitVariableModeForCollection(collection, modeId) {
      assert(collection.modes.some(mode => mode.modeId === modeId));
      this.explicitVariableModes[collection.id] = modeId;
    }
    get resolvedVariableModes() {
      return Object.fromEntries(
        state.collections.map(collection => {
          let modeId = collection.modes[0].modeId;
          for (let node = this; node; node = node.parent)
            if (node.explicitVariableModes[collection.id]) {
              modeId = node.explicitVariableModes[collection.id];
              break;
            }
          return [collection.id, modeId];
        })
      );
    }
    async setTextStyleIdAsync(id) {
      this.requireFont();
      const style = state.styles.find(
        item => item.id === id && item.type === 'TEXT'
      );
      assert(style, `Missing text style ${id}`);
      this.fontName = style.fontName;
      this.fontSize = style.fontSize;
      this.lineHeight = copy(style.lineHeight);
      this.textStyleId = id;
    }
    async setEffectStyleIdAsync(id) {
      this.effectStyleId = id;
      if (!id) {
        this.effects = [];
        return;
      }
      const style = state.styles.find(
        item => item.id === id && item.type === 'EFFECT'
      );
      assert(style, `Missing effect style ${id}`);
      this.effects = copy(style.effects);
    }
    get componentPropertyDefinitions() {
      assert(['COMPONENT', 'COMPONENT_SET'].includes(this.type));
      assert(
        this.parent?.type !== 'COMPONENT_SET',
        'Variant property getter is forbidden'
      );
      return this._definitions;
    }
    addComponentProperty(name, type, defaultValue) {
      const owner = this.parent?.type === 'COMPONENT_SET' ? this.parent : this;
      const key = `${name}#${next()}`;
      owner._definitions[key] = { type, defaultValue };
      return key;
    }
    get componentProperties() {
      assert.strictEqual(this.type, 'INSTANCE');
      const owner =
        this.main.parent?.type === 'COMPONENT_SET'
          ? this.main.parent
          : this.main;
      return Object.fromEntries(
        Object.entries(owner._definitions).map(([name, definition]) => [
          name,
          {
            type: definition.type,
            value:
              name in this.overrides
                ? this.overrides[name]
                : definition.defaultValue,
          },
        ])
      );
    }
    setProperties(properties) {
      for (const [key, value] of Object.entries(properties)) {
        assert(key in this.componentProperties, `Unknown property ${key}`);
        this.overrides[key] = value;
      }
    }
    createInstance() {
      assert.strictEqual(this.type, 'COMPONENT');
      function clone(source, root = false) {
        const node = new Node(root ? 'INSTANCE' : source.type);
        for (const field of [
          'name',
          'x',
          'y',
          'width',
          'height',
          'visible',
          'fills',
          'strokes',
          'effects',
          'boundVariables',
          'data',
          'sharedData',
          '_fontName',
          '_characters',
          'textStyleId',
          'effectStyleId',
          'componentPropertyReferences',
          'layoutMode',
          'paddingTop',
          'paddingBottom',
          'paddingLeft',
          'paddingRight',
          'itemSpacing',
          'minHeight',
          'maxHeight',
          'minWidth',
          'maxWidth',
          'constraints',
          'lineHeight',
          'fontSize',
        ])
          if (source[field] !== undefined) node[field] = copy(source[field]);
        if (root) node.main = source;
        else if (source.type === 'INSTANCE') {
          node.main = source.main;
          node.overrides = copy(source.overrides);
        }
        for (const child of source.children) node.appendChild(clone(child));
        return node;
      }
      return clone(this, true);
    }
    async getMainComponentAsync() {
      return this.main || null;
    }
    swapComponent(component) {
      this.main = component;
    }
    remove() {
      for (const child of [...this.children]) child.remove();
      if (this.parent)
        this.parent.children.splice(this.parent.children.indexOf(this), 1);
      this.parent = null;
      this.removed = true;
      state.nodes.delete(this.id);
    }
  }
  const page = new Node('PAGE');
  page.name = 'Kit';
  const root = new Node('DOCUMENT');
  root.appendChild(page);
  figma.root = root;
  figma.currentPage = page;
  figma.fileKey = 'mock-kit';
  figma.editorType = 'figma';
  figma.mixed = Symbol('mixed');
  for (const [name, type] of [
    ['createFrame', 'FRAME'],
    ['createText', 'TEXT'],
    ['createComponent', 'COMPONENT'],
    ['createRectangle', 'RECTANGLE'],
  ]) {
    figma[name] = () => {
      const node = new Node(type);
      // New text is initially page-owned; Figma does not require a font to create it.
      node.parent = page;
      page.children.push(node);
      return node;
    };
  }
  figma.combineAsVariants = (components, parent) => {
    assert(
      components.length > 0 &&
        components.every(node => node.type === 'COMPONENT')
    );
    const set = new Node('COMPONENT_SET');
    parent.appendChild(set);
    for (const component of components) {
      Object.assign(set._definitions, component._definitions);
      set.appendChild(component);
    }
    return set;
  };
  figma.getNodeByIdAsync = async id => state.nodes.get(id) || null;
  figma.viewport = {
    scrollAndZoomIntoView() {
      state.viewportCalls += 1;
    },
  };
  const context = vm.createContext({
    figma,
    __html__: '',
    console,
    MG_SHARED_ONLY: Boolean(options.sharedOnly),
  });
  for (const file of [
    'kit-identity.js',
    'code.js',
    'kit-inspection.js',
    'kit-builder.js',
  ])
    vm.runInContext(fs.readFileSync(path.join(DIR, file), 'utf8'), context);
  const call = (name, ...args) => {
    context.mockArgs = args;
    return vm.runInContext(`${name}(...mockArgs)`, context);
  };
  const runCode = code =>
    vm.runInContext(`(async function(){${code}})()`, context);
  return { state, figma, call, runCode };
}

function ownership(state) {
  return Object.fromEntries(
    [...state.nodes.values()]
      .filter(node => identity(node, 'mgKitId') && node.type !== 'DOCUMENT')
      .map(node => [identity(node, 'mgKitId'), node.id])
  );
}
async function importFoundation(env, doc) {
  const result = await env.call(
    'importVariables',
    doc,
    ['undrr'],
    false,
    [],
    true
  );
  assert.strictEqual(result.errors.length, 0, result.errors.join('\n'));
}
async function main() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(DIR, 'mangrove-variables.json'), 'utf8')
  );
  assert(doc.components?.families.length, 'Build updated token JSON first');
  {
    const env = environment(doc);
    await importFoundation(env, doc);
    const first = await env.call('buildMangroveComponents', doc, 'undrr');
    assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
    assert.strictEqual(first.families.length, doc.components.families.length);
    assert.strictEqual(
      first.families.reduce((sum, family) => sum + family.variantIds.length, 0),
      doc.components.families.reduce(
        (sum, family) => sum + family.variants.length,
        0
      )
    );
    assert(
      first.createdNodeIds.length > 0 && first.updatedNodeIds.length === 0
    );
    const buttonRecipe = doc.components.families.find(
      family => family.id === 'button'
    );
    const buttonBuilt = first.families.find(family => family.id === 'button');
    const variableByName = new Map(
      env.state.variables.map(variable => [variable.name, variable])
    );
    for (const variant of buttonRecipe.variants.filter(
      item => item.tree.focusRing
    )) {
      const ring = variant.tree.focusRing;
      const component = env.state.nodes.get(
        buttonBuilt.variantIds.find(item => item.id === variant.id).nodeId
      );
      assert.strictEqual(
        component.fills.length,
        0,
        'Outline control stays transparent'
      );
      assert.strictEqual(
        component.effects.length,
        0,
        'No spread effect on a transparent control'
      );
      assert.strictEqual(
        component.clipsContent,
        false,
        'Native focus outlines must remain visible'
      );
      const outer = component.children.find(node =>
        identity(node, 'mgKitId').endsWith('/focus/outer')
      );
      const separator = component.children.find(node =>
        identity(node, 'mgKitId').endsWith('/focus/separator')
      );
      assert(outer && separator, 'Two owned native outline rectangles');
      const offset = variableByName
        .get(ring.offset)
        .resolveForConsumer(component).value;
      assert.strictEqual(outer.x, -offset);
      assert.strictEqual(outer.y, -offset);
      assert.strictEqual(outer.width, component.width + offset * 2);
      assert.strictEqual(outer.height, component.height + offset * 2);
      assert.strictEqual(separator.width, component.width);
      assert.strictEqual(separator.height, component.height);
      for (const [node, color, weight, radius] of [
        [outer, ring.color, ring.width, ring.outerRadius],
        [separator, ring.separatorColor, ring.offset, ring.radius],
      ]) {
        assert.strictEqual(
          node.fills.length,
          0,
          'No epsilon or opaque focus decoration fill'
        );
        assert.strictEqual(node.effects.length, 0);
        assert.strictEqual(node.strokeAlign, 'OUTSIDE');
        assert.strictEqual(node.layoutPositioning, 'ABSOLUTE');
        assert.strictEqual(node.constraints.horizontal, 'STRETCH');
        assert.strictEqual(node.constraints.vertical, 'STRETCH');
        assert.strictEqual(
          node.strokes[0].boundVariables.color.id,
          variableByName.get(color).id
        );
        assert.strictEqual(
          node.boundVariables.strokeWeight.id,
          variableByName.get(weight).id
        );
        assert.strictEqual(
          node.boundVariables.cornerRadius.id,
          variableByName.get(radius).id
        );
      }
      assert(
        component.children.indexOf(outer) <
          component.children.findIndex(node => node.type === 'TEXT'),
        'Focus decorations remain behind content'
      );
    }
    const owned = ownership(env.state);
    const editable = [...env.state.nodes.values()].find(
      node =>
        node.type === 'INSTANCE' &&
        identity(node, 'mgKitId') ===
          'review/button/specimen/long-label/instance'
    );
    const label = Object.keys(editable.componentProperties).find(name =>
      name.startsWith('Label#')
    );
    editable.setProperties({ [label]: 'A designer changed this label' });
    const propertyIds = first.families
      .map(family => family.propertyIds.join('|'))
      .join(';');
    const second = await env.call('buildMangroveComponents', doc, 'undrr');
    assert.strictEqual(second.errors.length, 0, second.errors.join('\n'));
    assert.strictEqual(
      second.createdNodeIds.length,
      0,
      'Rebuild duplicated nodes'
    );
    assert.deepStrictEqual(
      ownership(env.state),
      owned,
      'Owned node IDs changed'
    );
    assert.strictEqual(
      second.families.map(family => family.propertyIds.join('|')).join(';'),
      propertyIds
    );
    assert.strictEqual(
      editable.componentProperties[label].value,
      'A designer changed this label'
    );
    const inspection = await env.call('inspectMangroveKit');
    assert.strictEqual(
      inspection.errors.length,
      0,
      inspection.errors.join('\n')
    );
    assert(
      inspection.nodes.some(
        node => node.type === 'INSTANCE' && node.mainComponent?.id
      )
    );
    assert(
      inspection.nodes.some(node =>
        node.resolvedBindings.some(binding => binding.name === 'radius/button')
      )
    );
    console.log(
      'ok  complete build, stable IDs and properties, editable review overrides, binding inspection'
    );
    const failedStyle = env.state.styles.find(
      style => identity(style, 'mgStyleId') === 'component.button'
    );
    failedStyle.setBoundVariable = () => {
      throw new Error('Mock style binding failure');
    };
    const failedUpdate = await env.call(
      'buildMangroveComponents',
      doc,
      'undrr',
      ['button']
    );
    assert.strictEqual(
      failedUpdate.families.length,
      0,
      'Failed style update reused stale shared style'
    );
    assert.strictEqual(failedUpdate.createdNodeIds.length, 0);
    assert.strictEqual(
      failedUpdate.updatedNodeIds.length,
      0,
      'Failed style update modified canvas'
    );
    assert.deepStrictEqual(ownership(env.state), owned);
    console.log(
      'ok  failed shared style update blocks its family instead of using stale style'
    );
  }
  {
    const env = environment(doc, {
      rejectedFonts: ['Roboto Condensed Regular', 'Roboto Condensed Bold'],
    });
    await importFoundation(env, doc);
    const result = await env.call('buildMangroveComponents', doc, 'undrr');
    assert(result.errors.length > 0);
    const built = result.families.map(family => family.id);
    assert(
      built.includes('button') &&
        built.includes('text-input') &&
        built.includes('combobox')
    );
    assert(!built.includes('tabs-trigger') && !built.includes('tabs'));
    assert(
      ![...env.state.nodes.values()].some(node =>
        identity(node, 'mgKitId').startsWith('family/tabs')
      )
    );
    console.log(
      'ok  missing Condensed font blocks Tabs dependencies while other families build'
    );
  }
  {
    const env = environment(doc);
    await importFoundation(env, doc);
    env.state.variables.find(
      variable => variable.name === 'radius/button'
    ).resolvedType = 'STRING';
    const result = await env.call('buildMangroveComponents', doc, 'undrr', [
      'button',
    ]);
    assert.strictEqual(result.families.length, 0);
    assert.strictEqual(result.createdNodeIds.length, 0);
    assert.strictEqual(
      env.figma.currentPage.children.length,
      0,
      'Type preflight leaked canvas nodes'
    );
    assert(
      result.errors.some(error =>
        error.includes('Missing FLOAT variable radius/button')
      )
    );
    console.log('ok  wrong variable type is rejected before canvas mutation');
  }
  {
    const env = environment(doc, { sharedOnly: true });
    await importFoundation(env, doc);
    const first = await env.call('buildMangroveComponents', doc, 'undrr', [
      'button',
    ]);
    assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
    const second = await env.call('buildMangroveComponents', doc, 'undrr', [
      'button',
    ]);
    assert.strictEqual(second.errors.length, 0, second.errors.join('\n'));
    assert.strictEqual(second.createdNodeIds.length, 0);
    assert.strictEqual(second.families[0].setId, first.families[0].setId);
    const inspection = await env.call('inspectMangroveKit');
    assert.strictEqual(
      inspection.errors.length,
      0,
      inspection.errors.join('\n')
    );
    assert(inspection.nodes.some(node => node.mgKitId === 'family/button'));
    console.log(
      'ok  shared-only runtime builds, inspects and reimports with private metadata APIs disabled'
    );
  }
  {
    const env = environment(doc);
    await importFoundation(env, doc);
    const first = await env.call(
      'createMangroveFocusDiagnostics',
      doc,
      'undrr'
    );
    assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
    assert.strictEqual(first.specimens.length, 4);
    const firstIds = first.createdNodeIds.slice().sort().join(',');
    const second = await env.call(
      'createMangroveFocusDiagnostics',
      doc,
      'undrr'
    );
    assert.strictEqual(second.errors.length, 0, second.errors.join('\n'));
    assert.strictEqual(second.createdNodeIds.length, 0);
    assert.strictEqual(
      second.updatedNodeIds.slice().sort().join(','),
      firstIds
    );
    const literal = second.specimens.find(node =>
      node.mgKitId.endsWith('shape.source')
    );
    const reverse = second.specimens.find(node =>
      node.mgKitId.endsWith('shape.reverse')
    );
    assert.strictEqual(
      literal.effects.map(effect => effect.spread).join(','),
      '4,2'
    );
    assert.strictEqual(
      reverse.effects.map(effect => effect.spread).join(','),
      '2,4'
    );
    const bound = second.specimens.find(node =>
      node.mgKitId.endsWith('shape.bound')
    );
    assert(
      bound.resolvedBindings.some(
        binding =>
          binding.name === 'effect-size/focus-ring/outer-spread' &&
          binding.resolved.value === 4
      )
    );
    const clipped = second.specimens.find(node =>
      node.mgKitId.endsWith('shape.clipped')
    );
    assert.strictEqual(clipped.clipsContent, true);
    console.log(
      'ok  focus diagnostics retain IDs, both orders and resolved bound geometry'
    );
  }
  {
    const connector = require('../../../scripts/build-figma-connector.cjs');
    assert.deepStrictEqual(
      connector.decompressJSON(connector.compressJSON(doc)),
      doc
    );
    const env = environment(doc, { sharedOnly: true });
    const importScript = await connector.buildConnector({
      operation: 'import',
      doc,
    });
    const imported = await env.runCode(importScript.code);
    assert.strictEqual(
      imported.result.errors.length,
      0,
      imported.result.errors.join('\n')
    );
    assert.strictEqual(
      imported.createdVariableIds.length,
      doc.variables.length
    );
    assert.strictEqual(
      imported.createdStyleIds.length,
      imported.result.styles.counts.text.created +
        imported.result.styles.counts.effect.created
    );
    const build = await connector.buildConnector({
      operation: 'build',
      familyIds: ['button'],
      doc,
    });
    const built = await env.runCode(build.code);
    assert.strictEqual(built.errors.length, 0, built.errors.join('\n'));
    const reimported = await env.runCode(importScript.code);
    assert.strictEqual(
      reimported.updatedVariableIds.length,
      reimported.result.counts.updated
    );
    assert.strictEqual(
      reimported.updatedStyleIds.length,
      reimported.result.styles.counts.text.updated +
        reimported.result.styles.counts.effect.updated
    );
    assert.strictEqual(reimported.createdStyleIds.length, 0);
    const inspect = await connector.buildConnector({
      operation: 'inspect',
      doc,
    });
    const report = await env.runCode(inspect.code);
    assert.strictEqual(report.errorCount, 0, report.errors.join('\n'));
    assert.strictEqual(report.sets.length, 1);
    assert(Buffer.byteLength(JSON.stringify(report)) < 16000);
    assert(report.selectedNodes.length === 0);
    const selected = await connector.buildConnector({
      operation: 'inspect',
      nodeIds: [report.sets[0].id],
      doc,
    });
    const selection = await env.runCode(selected.code);
    assert.strictEqual(selection.selectedNodes[0].id, report.sets[0].id);
    assert(Buffer.byteLength(JSON.stringify(selection)) < 16000);
    const full = await env.call('inspectMangroveKit');
    const largeText = full.nodes.find(node => node.type === 'TEXT');
    largeText.characters = '災'.repeat(10000);
    const bounded = connector.connectorInspectionSummary(full, [largeText.id]);
    assert(
      bounded.detailOmitted,
      'Oversized Unicode details were not compacted'
    );
    assert(Buffer.byteLength(JSON.stringify(bounded)) < 16000);
    env.state.rejectedFonts.add('Roboto Condensed Regular');
    const failedImport = await env.runCode(importScript.code);
    assert.strictEqual(failedImport.result.styles.counts.text.failed, 3);
    assert.strictEqual(failedImport.retainedPartialStyleIds.length, 0);
    assert.strictEqual(
      failedImport.updatedStyleIds.length,
      failedImport.result.styles.counts.text.updated +
        failedImport.result.styles.counts.effect.updated
    );
    console.log(
      'ok  connector codec, canonical import IDs and font failures, minified remote build, bounded Unicode summary and selected node inspection'
    );
  }
}
if (require.main === module)
  main().catch(error => {
    console.error(`FAIL ${error.stack || error}`);
    process.exitCode = 1;
  });
module.exports = { environment, importFoundation };
