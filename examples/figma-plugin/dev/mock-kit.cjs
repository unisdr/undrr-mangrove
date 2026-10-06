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
    textRangeFillWrites: [],
    staleTextRangeFillWrites: 0,
  };
  const figma = factoryModule.exports(state);
  state.images = new Map();
  figma.base64Decode = value => new Uint8Array(Buffer.from(value, 'base64'));
  figma.createImage = bytes => {
    const hash = require('crypto')
      .createHash('sha256')
      .update(bytes)
      .digest('hex');
    state.images.set(hash, Buffer.from(bytes));
    return { hash };
  };
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
      if (type === 'ELLIPSE')
        this.arcData = {
          startingAngle: 0,
          endingAngle: 2 * Math.PI,
          innerRadius: 0,
        };
      this.effects = [];
      this.boundVariables = {};
      this._opacity = 1;
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
      this._isExposedInstance = false;
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
    get opacity() {
      const binding = this.boundVariables.opacity;
      if (!binding) return this._opacity;
      const variable = state.variables.find(item => item.id === binding.id);
      return Math.max(0, Math.min(100, resolve(variable, this))) / 100;
    }
    set opacity(value) {
      assert(
        Number.isFinite(value) && value >= 0 && value <= 1,
        'Native node opacity must be in 0..1, unlike percentage variables'
      );
      this._opacity = value;
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
        !['TEXT', 'RECTANGLE', 'ELLIPSE'].includes(this.type),
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
    isNestedInstance() {
      if (this.type !== 'INSTANCE') return false;
      for (let parent = this.parent; parent; parent = parent.parent)
        if (parent.type === 'INSTANCE') return true;
      return false;
    }
    resize(width, height) {
      assert(
        Number.isFinite(width) &&
          width > 0 &&
          Number.isFinite(height) &&
          height > 0
      );
      // Observed in desktop Figma: nested instance dimensions can silently
      // retain the main component value while the Plugin API reports success.
      if (this.isNestedInstance()) return;
      this.width = width;
      this.height = height;
      this._horizontal = 'FIXED';
      this._vertical = 'FIXED';
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
      if (value === 'HUG')
        assert(
          (this.type === 'TEXT' && this.parent?.layoutMode !== 'NONE') ||
            (['FRAME', 'COMPONENT', 'INSTANCE'].includes(this.type) &&
              this.layoutMode !== 'NONE'),
          'HUG needs an auto-layout frame or text child of auto-layout'
        );
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
    set textWrapStyle(value) {
      this.requireFont();
      assert(
        ['AUTO', 'BALANCE', 'PRETTY'].includes(value),
        'Invalid native textWrapStyle enum'
      );
      this._textWrapStyle = value;
    }
    get textWrapStyle() {
      return this._textWrapStyle || 'AUTO';
    }
    set textDecorationOffset(value) {
      this.requireFont();
      assert(value && typeof value === 'object' && !Array.isArray(value));
      assert(
        value.unit === 'AUTO'
          ? Object.keys(value).length === 1
          : ['PIXELS', 'PERCENT'].includes(value.unit) &&
              Number.isFinite(value.value) &&
              Object.keys(value).length === 2 &&
              Object.keys(value).every(key => ['unit', 'value'].includes(key)),
        'Invalid native text decoration offset'
      );
      this._textDecorationOffset = copy(value);
    }
    get textDecorationOffset() {
      if (this.type !== 'TEXT') return undefined;
      return this.textDecoration === 'UNDERLINE'
        ? this._textDecorationOffset || { unit: 'AUTO' }
        : null;
    }
    set layoutPositioning(value) {
      assert(['AUTO', 'ABSOLUTE'].includes(value), 'Invalid positioning enum');
      assert(
        this.parent && this.parent.layoutMode !== 'NONE',
        'Positioning needs an auto-layout parent'
      );
      this._layoutPositioning = value;
    }
    get layoutPositioning() {
      return this._layoutPositioning || 'AUTO';
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
    set fontSize(value) {
      this.requireFont();
      assert(Number.isFinite(value) && value >= 1, 'Invalid native font size');
      this._fontSize = value;
      delete this.boundVariables.fontSize;
    }
    get fontSize() {
      const binding = this.boundVariables.fontSize;
      return binding
        ? resolve(
            state.variables.find(variable => variable.id === binding.id),
            this
          )
        : this._fontSize;
    }
    set characters(value) {
      this.requireFont();
      this._characters = value;
    }
    get characters() {
      return this.type === 'TEXT' ? this._characters : undefined;
    }
    checkTextRange(start, end) {
      assert.strictEqual(this.type, 'TEXT', 'Text range API requires TEXT');
      assert(
        start === 0 && end === this.characters.length,
        'Mock supports the complete text range only'
      );
    }
    getRangeFills(start, end) {
      this.checkTextRange(start, end);
      if (this._textRangeSource && !this._textRangeFillOverride)
        return this._textRangeSource.getRangeFills(
          0,
          this._textRangeSource.characters.length
        );
      return copy(this._textRangeFills ?? this.fills);
    }
    setRangeFills(start, end, fills) {
      this.checkTextRange(start, end);
      this.requireFont();
      assert(Array.isArray(fills), 'Range fills must be paints');
      this._textRangeFills = copy(fills);
      this._textRangeFillOverride = true;
      const aliases = fills.flatMap(paint =>
        paint.boundVariables?.color ? [copy(paint.boundVariables.color)] : []
      );
      if (aliases.length) this.boundVariables.textRangeFills = aliases;
      else delete this.boundVariables.textRangeFills;
      state.textRangeFillWrites.push({ nodeId: this.id, start, end });
    }
    getStyledTextSegments() {
      return [{ fontName: this.fontName }];
    }
    getRangeAllFontNames() {
      return [this.fontName];
    }
    setBoundVariable(field, variable) {
      if (['width', 'height'].includes(field) && this.isNestedInstance())
        return;
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
      for (const text of this.findAllWithCriteria({ types: ['TEXT'] }))
        text.requireFont();
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
      if (id === '') {
        this.textStyleId = '';
        return;
      }
      const style = state.styles.find(
        item => item.id === id && item.type === 'TEXT'
      );
      assert(style, `Missing text style ${id}`);
      this.fontName = style.fontName;
      this.fontSize = style.fontSize;
      this.lineHeight = copy(style.lineHeight);
      this.letterSpacing = copy(
        style.letterSpacing || { unit: 'PIXELS', value: 0 }
      );
      this.textDecoration = style.textDecoration || 'NONE';
      this.textWrapStyle = style.textWrapStyle || 'AUTO';
      this.textStyleId = id;
      // Native style reattachment may retain stale range colour independently
      // of node.fills. This opt-in reproduces the observed TOC repeat defect.
      const stale = options.staleTextRangeFillsAfterStyle?.(this, style);
      if (stale) {
        this._textRangeFills = copy(stale);
        this._textRangeFillOverride = true;
        this.boundVariables.textRangeFills = stale.flatMap(paint =>
          paint.boundVariables?.color ? [copy(paint.boundVariables.color)] : []
        );
        state.staleTextRangeFillWrites += 1;
      }
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
    get isExposedInstance() {
      return this.type === 'INSTANCE' ? this._isExposedInstance : undefined;
    }
    set isExposedInstance(value) {
      assert.strictEqual(this.type, 'INSTANCE');
      assert.strictEqual(typeof value, 'boolean');
      let insideComponent = false;
      for (let parent = this.parent; parent; parent = parent.parent) {
        assert.notStrictEqual(
          parent.type,
          'INSTANCE',
          'Exposure is inherited on instance descendants'
        );
        if (parent.type === 'COMPONENT') insideComponent = true;
      }
      assert(
        insideComponent,
        'Only primary instances within components expose properties'
      );
      this._isExposedInstance = value;
    }
    get exposedInstances() {
      assert.strictEqual(this.type, 'INSTANCE');
      return this.findAll(
        node => node.type === 'INSTANCE' && node.isExposedInstance
      );
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
          'clipsContent',
          'fills',
          'strokes',
          'strokeWeight',
          'strokeCap',
          'strokeJoin',
          'strokeAlign',
          'vectorPaths',
          'arcData',
          'textDecoration',
          '_textDecorationOffset',
          '_layoutPositioning',
          'effects',
          'boundVariables',
          '_opacity',
          'data',
          'sharedData',
          '_fontName',
          '_characters',
          'textStyleId',
          'effectStyleId',
          'componentPropertyReferences',
          '_isExposedInstance',
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
          'textAutoResize',
          'textAlignHorizontal',
          '_textWrapStyle',
          'letterSpacing',
          '_horizontal',
          '_vertical',
        ])
          if (source[field] !== undefined) node[field] = copy(source[field]);
        // Unedited instance text inherits master range paints. Direct consumer
        // range overrides remain distinct from that inheritance.
        if (node.type === 'TEXT') node._textRangeSource = source;
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
    ['createSection', 'SECTION'],
    ['createEllipse', 'ELLIPSE'],
    ['createVector', 'VECTOR'],
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
  const statusFixtures = new Map();
  if (doc.components?.families?.some(family => family.id === 'status-label')) {
    // Compare the caller's asset IDs and raw markup with a fresh guarded source
    // recipe. A modified document cannot register itself as an exact fixture.
    const source = JSON.parse(
      fs.readFileSync(path.join(DIR, 'mangrove-variables.json'), 'utf8')
    );
    const status =
      require('../../../scripts/figma-status-label-recipes.cjs').buildStatusLabelRecipes(
        { root: path.resolve(DIR, '../..'), ...source }
      )[0];
    const expected = new Map();
    const visit = (tree, map) => {
      if (tree.type === 'SVG') map.set(tree.svg.assetId, tree.svg.markup);
      for (const child of tree.children || []) visit(child, map);
    };
    for (const variant of status.variants) visit(variant.tree, expected);
    const actual = new Map();
    for (const family of doc.components.families.filter(
      family => family.id === 'status-label'
    ))
      for (const variant of family.variants) visit(variant.tree, actual);
    for (const [assetId, markup] of actual)
      if (expected.get(assetId) === markup) statusFixtures.set(assetId, markup);
  }
  require('./mock-svg.cjs').installSvgMock(figma, state, {
    createVector: () => figma.createVector(),
    sourceFixtures: statusFixtures,
  });
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
  const {
    buildDefaultKitGuidance,
  } = require('../../../scripts/figma-kit-guidance.cjs');
  const context = vm.createContext({
    MG_KIT_GUIDANCE: buildDefaultKitGuidance(),
    figma,
    __html__: '',
    console,
    MG_SHARED_ONLY: Boolean(options.sharedOnly),
  });
  for (const file of [
    'kit-identity.js',
    'importer.js',
    'code.js',
    'kit-inspection.js',
    'kit-gradient-transform.js',
    'kit-builder.js',
  ])
    vm.runInContext(fs.readFileSync(path.join(DIR, file), 'utf8'), context);
  const layoutFile = path.join(DIR, 'kit-layout.js');
  if (fs.existsSync(layoutFile))
    vm.runInContext(fs.readFileSync(layoutFile, 'utf8'), context);
  const navigationFile = path.join(DIR, 'kit-navigation.js');
  vm.runInContext(fs.readFileSync(navigationFile, 'utf8'), context);
  const welcomeFile = path.join(DIR, 'kit-welcome.js');
  if (fs.existsSync(welcomeFile))
    vm.runInContext(fs.readFileSync(welcomeFile, 'utf8'), context);
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
    const imported = await env.call(
      'importVariables',
      doc,
      ['undrr'],
      false,
      ['text.text.300.regular'],
      false
    );
    assert.strictEqual(imported.errors.length, 0, imported.errors.join('\n'));
    await env.figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    const text = env.figma.createText();
    const style = env.state.styles.find(
      asset => identity(asset, 'mgStyleId') === 'text.text.300.regular'
    );
    assert(style, 'Imported source Regular text style is missing');
    text.fontName = style.fontName;
    await text.setTextStyleIdAsync(style.id);
    text.characters = 'Keep edited label and current source typography';
    const family = env.state.variables.find(
      variable => variable.name === 'font-family/text'
    );
    const size = env.state.variables.find(
      variable => variable.name === 'font-size/300'
    );
    text.setBoundVariable('fontFamily', family);
    text.setBoundVariable('fontSize', size);
    const snapshot = () =>
      JSON.stringify({
        id: text.id,
        type: text.type,
        fontName: text.fontName,
        fontSize: text.fontSize,
        lineHeight: text.lineHeight,
        characters: text.characters,
        boundVariables: text.boundVariables,
        textDecoration: text.textDecoration,
        textWrapStyle: text.textWrapStyle,
        width: text.width,
        height: text.height,
      });
    const before = snapshot();
    env.state.loadedFonts.delete(
      `${text.fontName.family} ${text.fontName.style}`
    );
    await assert.rejects(text.setTextStyleIdAsync(''), /unloaded/);
    assert.strictEqual(text.textStyleId, style.id);
    assert.strictEqual(snapshot(), before);
    await env.figma.loadFontAsync(style.fontName);
    await text.setTextStyleIdAsync('');
    assert.strictEqual(text.textStyleId, '');
    assert.strictEqual(
      snapshot(),
      before,
      'Empty association setter changed source typography, identity, content or current aliases'
    );
    text.fontSize = 16;
    assert.strictEqual(
      text.boundVariables.fontSize,
      undefined,
      'Literal size write must clear its previous variable alias'
    );
    assert(
      text.boundVariables.fontFamily,
      'Literal size write must preserve the unrelated family alias'
    );
    text.setBoundVariable('fontSize', size);
    assert.strictEqual(
      snapshot(),
      before,
      'Explicit direct size binding did not restore the exact source record'
    );
  }
  console.log(
    'ok  empty text-style association requires loaded font and preserves type, typography, identity and aliases; literal font-size clears only its alias before explicit rebind'
  );
  {
    const {
      buildFigmaVariables,
    } = require('../../../scripts/build-figma-tokens.cjs');
    const build = () => buildFigmaVariables();
    const helperName = 'component/textarea/default-block-size';
    const current = build();
    const height = current.variables.find(
      variable => variable.name === helperName
    );
    assert(height, 'Textarea source height helper is missing');
    assert.deepStrictEqual(height.scopes, ['WIDTH_HEIGHT']);
    assert.deepStrictEqual(height.codeSyntax, {});
    assert(Object.values(height.values).every(value => value === 88.1));
    const originalRead = fs.readFileSync;
    function withSource(suffix, replace, check) {
      fs.readFileSync = function (file, ...args) {
        const result = originalRead.call(this, file, ...args);
        return typeof file === 'string' && file.endsWith(suffix)
          ? replace(result)
          : result;
      };
      try {
        check();
      } finally {
        fs.readFileSync = originalRead;
      }
    }
    const jsx = '/stories/Components/Forms/Textarea/Textarea.jsx';
    const form = '/stories/Components/Forms/_form-base.scss';
    withSource(
      jsx,
      source => source.replace('rows = 4,', 'rows = 1,'),
      () => {
        const oneRow = build().variables.find(
          variable => variable.name === helperName
        );
        assert(Object.values(oneRow.values).every(value => value === 32.9));
      }
    );
    const guardedChanges = [
      [
        jsx,
        source => source.replace('rows = 4,', 'rows = 0,'),
        /default rows must be positive/,
      ],
      [
        jsx,
        source => source.replace('{error && errorText && (', '{errorText && ('),
        /no longer matches/,
      ],
      [
        form,
        source => source.replace('height: auto;', 'height: 200px;'),
        /no longer matches/,
      ],
      [
        form,
        source =>
          source.replace(
            '.mg-form-textarea {',
            '.mg-form-textarea {\n  line-height: 2;'
          ),
        /overrides typography or value colour/,
      ],
      [
        form,
        source =>
          source.replace(
            '.mg-form-textarea {',
            '.mg-form-textarea {\n  color: #123;'
          ),
        /overrides typography or value colour/,
      ],
      [
        form,
        source => {
          const start = source.indexOf('.mg-form-textarea {');
          return (
            source.slice(0, start) +
            source
              .slice(start)
              .replace('var(--mg-color-red-900)', 'var(--mg-color-red-600)')
          );
        },
        /no longer matches/,
      ],
    ];
    for (const [file, replace, error] of guardedChanges)
      withSource(file, replace, () => assert.throws(build, error));
    console.log(
      'ok  Textarea height follows JSX rows and source guards reject changed geometry, typography and error treatment'
    );
  }
  {
    const env = environment(doc, {
      rejectedFonts: ['RobotoCondensed Regular', 'RobotoCondensed Bold'],
    });
    const helperName = 'component/textarea/default-block-size';
    await importFoundation(env, doc);
    const first = await env.call('buildMangroveComponents', doc, 'undrr', [
      'textarea',
    ]);
    assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
    assert.strictEqual(first.families.length, 1);
    const built = first.families[0];
    assert.strictEqual(built.id, 'textarea');
    assert.strictEqual(built.variantIds.length, 6);
    const variables = new Map(
      env.state.variables.map(variable => [variable.name, variable])
    );
    const set = env.state.nodes.get(built.setId);
    const definitions = set.componentPropertyDefinitions;
    const property = name =>
      Object.keys(definitions).find(key => key.startsWith(`${name}#`));
    for (const name of ['Label', 'Value', 'Help text', 'Error message']) {
      assert(property(name), `Textarea ${name} text property missing`);
      assert.strictEqual(definitions[property(name)].type, 'TEXT');
    }
    for (const name of ['Show label', 'Show help', 'Show error', 'Required']) {
      assert(property(name), `Textarea ${name} visibility property missing`);
      assert.strictEqual(definitions[property(name)].type, 'BOOLEAN');
    }
    assert.strictEqual(definitions[property('Required')].defaultValue, false);
    const expected = {
      default: [
        'form-input/border-color',
        'form-input/background',
        'color/neutral-500',
      ],
      filled: [
        'form-input/border-color',
        'form-input/background--focus',
        'component/text-input/browser-fieldtext',
      ],
      focused: [
        'color/form-focus',
        'form-input/background--focus',
        'color/neutral-500',
      ],
      invalid: ['color/red-900', 'form-input/background', 'color/neutral-500'],
      invalidfocused: [
        'color/form-focus',
        'form-input/background--focus',
        'color/neutral-500',
      ],
      disabled: ['color/neutral-400', 'color/white', 'color/neutral-400'],
    };
    const find = (node, name) => node.findAll(child => child.name === name)[0];
    for (const item of built.variantIds) {
      const component = env.state.nodes.get(item.nodeId);
      const state = item.id.slice('textarea.'.length);
      const control = find(component, 'mg-form-textarea');
      const value = find(component, 'mg-form-textarea__value');
      assert(control && value, `Textarea ${state} control is missing`);
      assert.strictEqual(control.height, 88.1);
      assert.strictEqual(
        control.boundVariables.height.id,
        variables.get(helperName).id
      );
      assert.strictEqual(control.layoutMode, 'VERTICAL');
      assert.strictEqual(control.primaryAxisAlignItems, 'MIN');
      assert.strictEqual(control.clipsContent, true);
      assert.strictEqual(control.paddingTop, 6.25);
      assert.strictEqual(control.paddingBottom, 6.25);
      assert.strictEqual(control.strokeWeight, 1);
      assert.strictEqual(value.textAutoResize, 'HEIGHT');
      assert.strictEqual(value.layoutSizingHorizontal, 'FILL');
      assert.strictEqual(value.lineHeight.unit, 'PERCENT');
      assert.strictEqual(value.lineHeight.value, 115);
      assert.strictEqual(
        value.componentPropertyReferences.characters,
        property('Value')
      );
      const [border, fill, text] = expected[state];
      assert.strictEqual(
        control.strokes[0].boundVariables.color.id,
        variables.get(border).id
      );
      assert.strictEqual(
        control.fills[0].boundVariables.color.id,
        variables.get(fill).id
      );
      assert.strictEqual(
        value.fills[0].boundVariables.color.id,
        variables.get(text).id
      );
      assert.strictEqual(
        Boolean(find(component, 'mg-form-error')),
        state.startsWith('invalid')
      );
      assert.strictEqual(
        Boolean(control.effectStyleId),
        state.includes('focused')
      );
    }
    const editable = [...env.state.nodes.values()].find(
      node =>
        identity(node, 'mgKitId') ===
        'review/textarea/specimen/multiline/instance'
    );
    assert(editable, 'Textarea multiline review instance missing');
    const specimen = doc.components.families.find(
      family => family.id === 'textarea'
    ).review.specimens[0];
    assert.strictEqual(
      editable.componentProperties[property('Value')].value,
      specimen.properties.Value
    );
    assert(specimen.properties.Value.includes('\n'));
    assert(
      specimen.properties.Value.split('\n').length > 4,
      'Overflow specimen must exceed the default row count before wrapping'
    );
    assert.strictEqual(
      editable.componentProperties[property('Required')].value,
      true
    );
    assert.strictEqual(
      editable.parent.width -
        editable.parent.paddingLeft -
        editable.parent.paddingRight,
      240
    );
    assert.strictEqual(editable.layoutSizingHorizontal, 'FILL');
    assert.strictEqual(find(editable, 'mg-form-textarea').clipsContent, true);
    assert.strictEqual(
      find(editable, 'mg-form-textarea__value').textAutoResize,
      'HEIGHT'
    );
    editable.setProperties({
      [property('Value')]: 'First line\nSecond line\nThird line',
      [property('Required')]: false,
      [property('Show help')]: false,
    });
    const owned = ownership(env.state);
    const second = await env.call('buildMangroveComponents', doc, 'undrr', [
      'textarea',
    ]);
    assert.strictEqual(second.errors.length, 0, second.errors.join('\n'));
    assert.strictEqual(second.createdNodeIds.length, 0);
    assert.deepStrictEqual(ownership(env.state), owned);
    assert.deepStrictEqual(
      copy(second.families[0].propertyIds),
      copy(built.propertyIds)
    );
    assert.strictEqual(
      editable.componentProperties[property('Value')].value,
      'First line\nSecond line\nThird line'
    );
    assert.strictEqual(
      editable.componentProperties[property('Required')].value,
      false
    );
    assert.strictEqual(
      editable.componentProperties[property('Show help')].value,
      false
    );
    console.log(
      'ok  native Textarea builder binds measured geometry, six source states and multiline 240px review without Condensed fonts; reimport preserves IDs and text/visibility edits'
    );
  }
  {
    const composed = copy(doc);
    const family = composed.components.families.find(
      item => item.id === 'tabs'
    );
    family.review = {
      genericLabels: false,
      width: 720,
      specimens: [
        {
          id: 'coordinated-columns',
          name: 'Nested content and measured geometry',
          variant: { Layout: 'Horizontal' },
          width: 240,
          instanceWidth: 293,
          properties: {},
          nodes: [
            {
              path: ['mg-tabs__item-1'],
              properties: { Label: 'Nested edited seed' },
            },
          ],
        },
      ],
    };
    const env = environment(composed);
    await importFoundation(env, composed);
    const first = await env.call('buildMangroveComponents', composed, 'undrr', [
      'tabs',
    ]);
    assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
    const instance = [...env.state.nodes.values()].find(
      node =>
        identity(node, 'mgKitId') ===
        'review/tabs/specimen/coordinated-columns/instance'
    );
    assert.strictEqual(instance.width, 293);
    assert.strictEqual(instance.layoutSizingHorizontal, 'FIXED');
    const nested = instance.children.find(
      node => node.name === 'mg-tabs__item-1'
    );
    const property = Object.keys(nested.componentProperties).find(key =>
      key.startsWith('Label#')
    );
    assert.strictEqual(
      nested.componentProperties[property].value,
      'Nested edited seed'
    );
    assert(
      ![...env.state.nodes.values()].some(
        node =>
          identity(node, 'mgKitId') ===
          'review/tabs/specimen/long-label/instance'
      )
    );
    nested.setProperties({ [property]: 'Keep the nested designer edit' });
    instance.resize(311, instance.height);
    const ids = ownership(env.state);
    const second = await env.call(
      'buildMangroveComponents',
      composed,
      'undrr',
      ['tabs']
    );
    assert.strictEqual(second.errors.length, 0, second.errors.join('\n'));
    assert.strictEqual(second.createdNodeIds.length, 0);
    assert.deepStrictEqual(ownership(env.state), ids);
    assert.strictEqual(
      nested.componentProperties[property].value,
      'Keep the nested designer edit'
    );
    assert.strictEqual(instance.width, 311);
    for (const invalid of [
      { path: ['Missing'], width: 100 },
      { path: ['mg-tabs__item-1'], properties: { Label: false } },
      { path: ['mg-tabs__item-1'], width: -1 },
    ]) {
      const bad = copy(composed);
      bad.components.families.find(
        item => item.id === 'tabs'
      ).review.specimens[0].nodes = [invalid];
      const rejected = await env.call('buildMangroveComponents', bad, 'undrr', [
        'tabs',
      ]);
      assert(!rejected.families.some(item => item.id === 'tabs'));
      assert(rejected.errors.length);
      assert(!rejected.updatedNodeIds.includes(instance.id));
    }
    console.log(
      'ok  composed review seeds nested properties and shared geometry only on fresh instances, preserving edits and rejecting malformed paths/types/sizes'
    );
  }
  {
    for (const properties of [
      { Required: 'true' },
      { Missing: 'value' },
      { Value: false },
    ]) {
      const malformed = copy(doc);
      malformed.components.families.find(
        family => family.id === 'textarea'
      ).review.specimens[0].properties = properties;
      const env = environment(malformed);
      await importFoundation(env, malformed);
      const styleCount = env.state.styles.length;
      const result = await env.call(
        'buildMangroveComponents',
        malformed,
        'undrr',
        ['textarea']
      );
      assert.strictEqual(result.families.length, 0);
      assert.strictEqual(
        env.figma.currentPage.children.length,
        0,
        'Review property preflight must reject before canvas writes'
      );
      assert.strictEqual(
        env.state.styles.length,
        styleCount,
        'Review property preflight must reject before style writes'
      );
      assert(
        result.errors.some(error =>
          error.includes('must match a named TEXT or BOOLEAN property')
        )
      );
    }
    console.log(
      'ok  review specimen preflight rejects unknown properties and wrong TEXT/BOOLEAN values before canvas or style writes'
    );
  }
  {
    const env = environment(doc, {
      rejectedFonts: ['RobotoCondensed Regular', 'RobotoCondensed Bold'],
    });
    await importFoundation(env, doc);
    const first = await env.call('buildMangroveComponents', doc, 'undrr', [
      'table',
    ]);
    assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
    assert.deepStrictEqual(
      copy(first.families.map(family => [family.id, family.variantIds.length])),
      [
        ['table-header-cell', 4],
        ['table-body-cell', 4],
        ['table-row', 24],
        ['table', 8],
      ]
    );
    const variables = new Map(
      env.state.variables.map(variable => [variable.name, variable])
    );
    const tableBuilt = first.families.find(family => family.id === 'table');
    const rowsBuilt = first.families.find(family => family.id === 'table-row');
    for (const [preset, columns, height] of [
      ['story', [131.78125, 131.78125, 456.4375], 65.78125],
      ['narrowstory', [86.125, 86.125, 120.453125], 222.515625],
    ]) {
      const row = env.state.nodes.get(
        rowsBuilt.variantIds.find(
          variant => variant.id === `table-row.large.default.odd.${preset}`
        ).nodeId
      );
      assert.strictEqual(row.layoutSizingVertical, 'HUG');
      assert.strictEqual(row.minHeight, height);
      assert(
        !row.boundVariables.height,
        'Hugging rows must clear inherited fixed-height bindings'
      );
      assert(
        row.boundVariables.minHeight,
        'Measured row minimum belongs on its master'
      );
      for (let index = 0; index < 3; index++) {
        const cell = row.children[index];
        assert.strictEqual(cell.width, columns[index]);
        assert(
          cell.boundVariables.width,
          'Shared column width belongs on the primary cell instance inside a Row master'
        );
        assert.strictEqual(cell.layoutSizingHorizontal, 'FIXED');
        assert.strictEqual(cell.layoutSizingVertical, 'HUG');
        assert(
          !cell.boundVariables.height,
          'Hugging story cells must clear inherited fixed-height bindings'
        );
      }
    }
    const tableRecipe = doc.components.families.find(
      family => family.id === 'table'
    );
    for (const specimen of tableRecipe.review.specimens) {
      assert(['Story', 'NarrowStory'].includes(specimen.variant.Content));
      assert(
        specimen.nodes.every(
          node => node.width === undefined && node.height === undefined
        ),
        'Nested Table review nodes seed content only; real Figma ignored descendant geometry overrides'
      );
    }
    const tableDefault = env.state.nodes.get(
      tableBuilt.variantIds.find(
        variant => variant.id === 'table.large.default'
      ).nodeId
    );
    assert.strictEqual(tableDefault.children.length, 5);
    for (const row of tableDefault.children) {
      assert.strictEqual(
        row.children.filter(child => child.type === 'INSTANCE').length,
        3
      );
      assert.strictEqual(row.layoutSizingHorizontal, 'FILL');
      assert(row.isExposedInstance);
      for (const cell of row.children.filter(
        child => child.type === 'INSTANCE'
      )) {
        assert.strictEqual(cell.layoutSizingHorizontal, 'FILL');
        assert.strictEqual(cell.layoutSizingVertical, 'FILL');
        assert(cell.isExposedInstance);
        assert.strictEqual(cell.clipsContent, false);
        const value = cell.findAll(child => child.type === 'TEXT')[0];
        assert.strictEqual(value.textAutoResize, 'HEIGHT');
        assert.strictEqual(value.lineHeight.value, 140);
      }
    }
    const firstBody = tableDefault.children.find(
      row => row.name === 'mg-table__body-row-1'
    );
    assert.strictEqual(firstBody.paddingTop, 0);
    assert.strictEqual(
      firstBody.boundVariables.paddingTop.id,
      variables.get('component/geometry/zero').id
    );
    assert.strictEqual(firstBody.height, 42.890625);
    const laterBody = tableDefault.children.find(
      row => row.name === 'mg-table__body-row-3'
    );
    assert.strictEqual(laterBody.height, 43.390625);
    assert.strictEqual(laterBody.paddingTop, 0.5);
    assert.strictEqual(tableDefault.paddingBottom, 0.5);
    const grid = env.state.nodes.get(
      tableBuilt.variantIds.find(variant => variant.id === 'table.large.border')
        .nodeId
    );
    assert.strictEqual(grid.strokeWeight, 0.5);
    assert.strictEqual(grid.strokesIncludedInLayout, true);
    const half = variables.get('component/table/half-border-width');
    const halfValue = half.resolveForConsumer(grid).value;
    assert.strictEqual(
      halfValue + halfValue,
      1,
      'Adjacent half strokes must form one source grid seam'
    );
    const stripe = env.state.nodes.get(
      tableBuilt.variantIds.find(
        variant => variant.id === 'table.large.striped'
      ).nodeId
    );
    assert.strictEqual(stripe.children[1].fills.length, 0);
    assert.strictEqual(
      stripe.children[2].fills[0].boundVariables.color.id,
      variables.get('color/neutral-25').id
    );
    assert.strictEqual(stripe.children[2].strokes.length, 0);
    assert.strictEqual(
      stripe.children[4].fills[0].boundVariables.color.id,
      variables.get('color/neutral-25').id
    );
    const findReview = id =>
      [...env.state.nodes.values()].find(
        node =>
          identity(node, 'mgKitId') === `review/table/specimen/${id}/instance`
      );
    const wide = findReview('long-content'),
      narrow = findReview('narrow-content');
    assert(
      wide && narrow,
      'Source long and narrow Table review specimens missing'
    );
    const find = (node, path) =>
      path.reduce(
        (parent, name) => parent.children.find(child => child.name === name),
        node
      );
    const labelProperty = node =>
      Object.keys(node.componentProperties).find(name =>
        name.startsWith('Label#')
      );
    for (const instance of [wide, narrow]) {
      for (let row = 0; row < 5; row++) {
        const parent = find(instance, [
          row === 0 ? 'mg-table__head' : `mg-table__body-row-${row}`,
        ]);
        for (let col = 0; col < 3; col++) {
          const cell = parent.children.find(
            child => child.name === `mg-table__cell-${col + 1}`
          );
          assert.strictEqual(
            cell.width,
            instance === wide
              ? [131.78125, 131.78125, 456.4375][col]
              : [86.125, 86.125, 120.453125][col]
          );
          assert.strictEqual(
            cell.boundVariables.width.id,
            variables.get(
              `component/table/specimen/${instance === wide ? 'long-content' : 'narrow-content'}/column-${col + 1}`
            ).id
          );
          assert.strictEqual(
            cell.componentProperties[labelProperty(cell)].value,
            row === 0
              ? 'Table header'
              : col < 2
                ? 'Content Goes Here'
                : 'In publishing and graphic design, dummy is a placeholder text commonly used to demonstrate'
          );
        }
      }
    }
    assert.strictEqual(narrow.width, 292.703125);
    assert.strictEqual(
      narrow.parent.width -
        narrow.parent.paddingLeft -
        narrow.parent.paddingRight,
      240
    );
    assert.strictEqual(narrow.layoutSizingHorizontal, 'FIXED');
    assert.strictEqual(
      find(narrow, ['mg-table__body-row-1']).minHeight,
      222.015625
    );
    assert.strictEqual(
      find(narrow, ['mg-table__body-row-2']).minHeight,
      222.515625
    );
    assert.strictEqual(
      find(narrow, ['mg-table__body-row-1']).layoutSizingVertical,
      'HUG'
    );
    assert(!find(narrow, ['mg-table__body-row-1']).boundVariables.height);
    assert(find(narrow, ['mg-table__body-row-1']).boundVariables.minHeight);
    assert(
      !findReview('long-label') && !findReview('narrow'),
      'Composed Table must not seed a nonexistent root Label'
    );
    const edited = find(wide, ['mg-table__body-row-1', 'mg-table__cell-3']);
    const label = labelProperty(edited);
    edited.setProperties({
      [label]: 'Designer table content\nPreserve this second line',
    });
    const owned = ownership(env.state);
    const second = await env.call('buildMangroveComponents', doc, 'undrr', [
      'table',
    ]);
    assert.strictEqual(second.errors.length, 0, second.errors.join('\n'));
    assert.strictEqual(second.createdNodeIds.length, 0);
    assert.deepStrictEqual(ownership(env.state), owned);
    assert.strictEqual(
      edited.componentProperties[label].value,
      'Designer table content\nPreserve this second line'
    );
    assert.strictEqual(
      edited.width,
      456.4375,
      'Geometry remains linked to the measured Row master, not a nested resize override'
    );
    const {
      buildFigmaVariables,
    } = require('../../../scripts/build-figma-tokens.cjs');
    const read = fs.readFileSync;
    for (const [file, before, after] of [
      [
        '/stories/Atom/Table/table.scss',
        'line-height: 1.4;',
        'line-height: 1.5;',
      ],
      [
        '/stories/Atom/Table/table.scss',
        'font-weight: 600;',
        'font-weight: 700;',
      ],
      [
        '/stories/Atom/Table/table.scss',
        'var(--mg-color-neutral-25)',
        'var(--mg-color-neutral-50)',
      ],
      [
        '/stories/Atom/Table/Table.jsx',
        '<td>{details}</td>',
        '<td>{tdtext}</td>',
      ],
    ]) {
      fs.readFileSync = function (filename, ...args) {
        const source = read.call(this, filename, ...args);
        return typeof filename === 'string' && filename.endsWith(file)
          ? source.replace(before, after)
          : source;
      };
      try {
        assert.throws(
          () => buildFigmaVariables(),
          /no longer matches|inventory changed/
        );
      } finally {
        fs.readFileSync = read;
      }
    }
    console.log(
      'ok  Table composes40 bounded variants with source columns on Row masters, hugging Story cells/rows above browser minimum heights, collapsed seams and editable text; review never resizes nested geometry and reimport preserves text edits'
    );
  }
  {
    const env = environment(doc);
    await importFoundation(env, doc);
    const built = await env.call('buildMangroveComponents', doc, 'undrr', [
      'button',
    ]);
    assert.strictEqual(built.errors.length, 0, built.errors.join('\n'));
    let lists = 0;
    let loads = 0;
    const listFonts = env.figma.listAvailableFontsAsync;
    env.figma.listAvailableFontsAsync = async () => {
      lists += 1;
      return listFonts();
    };
    env.figma.loadFontAsync = async () => {
      loads += 1;
      throw 'Mock desktop font loading failure';
    };
    await env.state.handler({ type: 'inspect' });
    assert.strictEqual(env.state.lastMessage.type, 'inspection');
    assert.strictEqual(env.state.lastMessage.result.fonts, null);
    assert(env.state.lastMessage.result.nodes.length > 0);
    assert.strictEqual(
      lists,
      0,
      'Structural inspection must not enumerate fonts'
    );
    assert.strictEqual(loads, 0, 'Structural inspection must not load fonts');
    await env.state.handler({ type: 'inspect', checkFonts: true });
    assert.strictEqual(env.state.lastMessage.type, 'inspection');
    assert.strictEqual(lists, 1);
    assert.strictEqual(
      loads,
      6,
      'Opt-in font checks probe both source families'
    );
    assert.strictEqual(env.state.lastMessage.result.fonts.loads.length, 6);
    assert(
      env.state.lastMessage.result.fonts.loads.every(entry => !entry.loaded),
      'Font failures remain reported without failing structural inspection'
    );
    console.log(
      'ok  desktop inspection skips font APIs by default and reports explicit font probes independently'
    );
  }
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
    const disabledOpacity = variableByName.get(
      'component/combobox/disabled-opacity'
    );
    const disabledCombo = [...env.state.nodes.values()].find(
      node =>
        identity(node, 'mgKitId') ===
        'family/combobox/variant/combobox.disabled'
    );
    const disabledReview = [...env.state.nodes.values()].find(
      node =>
        identity(node, 'mgKitId') ===
        'review/combobox/specimen/combobox.disabled/instance'
    );
    assert.strictEqual(
      disabledOpacity.resolveForConsumer(disabledCombo).value,
      55,
      'CSS 0.55 exports as a Figma opacity percentage'
    );
    for (const node of [disabledCombo, disabledReview]) {
      assert(node, 'Disabled component and review instance both exist');
      assert.strictEqual(node.opacity, 0.55);
      assert.strictEqual(node.boundVariables.opacity.id, disabledOpacity.id);
      assert(
        node.findAll(child => child.opacity !== 1).length === 0,
        'Disabled opacity belongs on the root without compounding descendants'
      );
    }
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
    for (const [id, variantId] of [
      ['tabs', 'tabs.horizontal'],
      ['combobox', 'combobox.open'],
    ]) {
      const family = first.families.find(item => item.id === id);
      const component = env.state.nodes.get(
        family.variantIds.find(item => item.id === variantId).nodeId
      );
      const nested = component.findAllWithCriteria({ types: ['INSTANCE'] });
      assert.strictEqual(nested.length, 3);
      assert(
        nested.every(instance => instance.isExposedInstance),
        `${id}: nested component properties must be exposed`
      );
    }
    const tabsLong = [...env.state.nodes.values()].find(
      node =>
        identity(node, 'mgKitId') === 'review/tabs/specimen/long-label/instance'
    );
    assert.strictEqual(tabsLong.exposedInstances.length, 3);
    const firstTab = tabsLong.exposedInstances.find(
      instance => instance.name === 'mg-tabs__item-1'
    );
    const tabLabel = Object.keys(firstTab.componentProperties).find(name =>
      name.startsWith('Label#')
    );
    assert.strictEqual(
      firstTab.componentProperties[tabLabel].value,
      'A longer Mangrove label to check resizing and wrapping',
      'Long rail specimen edits the actual nested tab label'
    );
    assert(
      firstTab
        .findAllWithCriteria({ types: ['TEXT'] })
        .every(node => node.textAutoResize === 'WIDTH_AND_HEIGHT'),
      'Tab labels preserve source nowrap'
    );
    firstTab.setProperties({
      [tabLabel]: 'A designer changed this nested tab',
    });
    const narrowButton = [...env.state.nodes.values()].find(
      node =>
        identity(node, 'mgKitId') === 'review/button/specimen/narrow/instance'
    );
    const narrowText = narrowButton
      .findAllWithCriteria({ types: ['TEXT'] })
      .find(node =>
        node.componentPropertyReferences?.characters?.startsWith('Label#')
      );
    const narrowProperty = Object.keys(narrowButton.componentProperties).find(
      name => name.startsWith('Label#')
    );
    narrowButton.setProperties({
      [narrowProperty]: 'A designer keeps this narrow Button label',
    });
    narrowText.textAutoResize = 'WIDTH_AND_HEIGHT';
    narrowText.textAlignHorizontal = 'RIGHT';
    narrowText.resize(177, 21);
    narrowText.layoutSizingHorizontal = 'FIXED';
    narrowText.layoutSizingVertical = 'FIXED';
    const narrowFormatting = () =>
      JSON.stringify({
        autoResize: narrowText.textAutoResize,
        align: narrowText.textAlignHorizontal,
        width: narrowText.width,
        height: narrowText.height,
        horizontal: narrowText.layoutSizingHorizontal,
        vertical: narrowText.layoutSizingVertical,
      });
    const originalFormatting = narrowFormatting();
    const inputStyle = env.state.styles.find(
      style => identity(style, 'mgStyleId') === 'component.input'
    );
    assert.strictEqual(inputStyle.lineHeight.unit, 'PERCENT');
    assert.strictEqual(inputStyle.lineHeight.value, 115);
    for (const id of ['component.body', 'component.help', 'component.error']) {
      const style = env.state.styles.find(
        item => identity(item, 'mgStyleId') === id
      );
      assert.strictEqual(style.lineHeight.unit, 'PIXELS');
      assert.strictEqual(style.lineHeight.value, 24);
    }
    const textInputBuilt = first.families.find(
      family => family.id === 'text-input'
    );
    const filledInput = env.state.nodes.get(
      textInputBuilt.variantIds.find(
        variant => variant.id === 'text-input.filled'
      ).nodeId
    );
    const filledValue = filledInput
      .findAllWithCriteria({ types: ['TEXT'] })
      .find(node => node.name === 'mg-form-input__value');
    assert.strictEqual(
      filledValue.fills[0].boundVariables.color.id,
      variableByName.get('component/text-input/browser-fieldtext').id,
      'Filled input preserves observed browser field-text black, with its source caveat'
    );
    assert.deepStrictEqual(
      copy(
        variableByName
          .get('component/text-input/browser-fieldtext')
          .resolveForConsumer(filledValue).value
      ),
      { r: 0, g: 0, b: 0, a: 1 },
      'Measured input fieldtext must resolve to actual black, not Mangrove near-black'
    );
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
    assert.strictEqual(disabledCombo.opacity, 0.55);
    assert.strictEqual(disabledReview.opacity, 0.55);
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
    assert.strictEqual(
      firstTab.componentProperties[tabLabel].value,
      'A designer changed this nested tab'
    );
    assert.strictEqual(
      narrowFormatting(),
      originalFormatting,
      'Rebuild must preserve designer narrow-text formatting'
    );
    assert(
      !second.updatedNodeIds.includes(narrowText.id),
      'Existing narrow label is not rewritten'
    );
    assert.strictEqual(
      narrowButton.componentProperties[narrowProperty].value,
      'A designer keeps this narrow Button label'
    );
    const fieldNarrow = [...env.state.nodes.values()].find(
      node =>
        identity(node, 'mgKitId') ===
        'review/text-input/specimen/narrow/instance'
    );
    const fieldReviewBefore = JSON.stringify({
      properties: fieldNarrow.componentProperties,
      text: fieldNarrow.findAllWithCriteria({ types: ['TEXT'] }).map(node => ({
        id: node.id,
        autoResize: node.textAutoResize,
        horizontal: node.layoutSizingHorizontal,
        vertical: node.layoutSizingVertical,
      })),
    });
    const refreshed = await env.call(
      'buildMangroveComponents',
      doc,
      'undrr',
      ['button'],
      { refreshNarrowReview: true }
    );
    assert.strictEqual(refreshed.errors.length, 0, refreshed.errors.join('\n'));
    assert.strictEqual(refreshed.createdNodeIds.length, 0);
    assert.deepStrictEqual(ownership(env.state), owned);
    assert.strictEqual(
      narrowButton.componentProperties[narrowProperty].value,
      'A designer keeps this narrow Button label',
      'Explicit layout refresh preserves the Label override'
    );
    assert.strictEqual(narrowButton.parent.width, 256);
    assert.strictEqual(
      narrowButton.parent.width -
        narrowButton.parent.paddingLeft -
        narrowButton.parent.paddingRight,
      240,
      'The narrow consumer has 240px available after review padding'
    );
    assert.strictEqual(narrowButton.width, 240);
    assert.strictEqual(narrowButton.layoutSizingHorizontal, 'FILL');
    assert.strictEqual(narrowButton.layoutSizingVertical, 'HUG');
    assert.strictEqual(narrowText.textAutoResize, 'HEIGHT');
    assert.strictEqual(narrowText.textAlignHorizontal, 'CENTER');
    assert.strictEqual(narrowText.layoutSizingHorizontal, 'FILL');
    assert.strictEqual(narrowText.layoutSizingVertical, 'HUG');
    assert.strictEqual(
      narrowText.width,
      240 - narrowButton.paddingLeft - narrowButton.paddingRight
    );
    assert(refreshed.updatedNodeIds.includes(narrowText.id));
    assert(
      env.state.loadedFonts.has(
        `${narrowText.fontName.family} ${narrowText.fontName.style}`
      ),
      'The existing label font is loaded before layout edits'
    );
    assert(
      refreshed.audit.some(
        entry =>
          entry.nodeId === narrowButton.id &&
          entry.status === 'narrow-review-layout-refreshed' &&
          entry.preservedLabel === true
      )
    );
    assert.strictEqual(
      JSON.stringify({
        properties: fieldNarrow.componentProperties,
        text: fieldNarrow
          .findAllWithCriteria({ types: ['TEXT'] })
          .map(node => ({
            id: node.id,
            autoResize: node.textAutoResize,
            horizontal: node.layoutSizingHorizontal,
            vertical: node.layoutSizingVertical,
          })),
      }),
      fieldReviewBefore,
      'Button layout refresh does not change TextInput review formatting'
    );
    assert(
      second.audit.some(
        entry =>
          entry.nodeId === tabsLong.id &&
          entry.status === 'existing-nested-review-label-preserved'
      ),
      'Existing nested review labels receive an explicit preservation/migration hint'
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
    assert.strictEqual(
      inspection.nodes.find(node => node.id === tabsLong.id).exposedInstanceIds
        .length,
      3
    );
    console.log(
      'ok  complete build, stable IDs and properties, editable review overrides, binding inspection'
    );
    const tabSourceIds = Object.entries(ownership(env.state))
      .filter(([key]) => key.startsWith('family/tabs/'))
      .map(([, id]) => id);
    for (const longLabelTarget of [
      null,
      '',
      [],
      'mg-tabs__item-1',
      ['missing-tab'],
      ['mg-tabs__item-1', 'missing-label'],
    ]) {
      const malformed = copy(doc);
      malformed.components.families.find(
        family => family.id === 'tabs'
      ).review.longLabelTarget = longLabelTarget;
      const rejected = await env.call(
        'buildMangroveComponents',
        malformed,
        'undrr',
        ['tabs']
      );
      assert(
        rejected.audit.some(
          entry => entry.family === 'tabs' && entry.status === 'blocked'
        ),
        'Malformed label target must block its composed family'
      );
      assert(!rejected.families.some(family => family.id === 'tabs'));
      assert(
        tabSourceIds.every(id => !rejected.updatedNodeIds.includes(id)),
        'Malformed target must not alter existing Tabs construction'
      );
      assert.strictEqual(rejected.createdNodeIds.length, 0);
    }
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
    const env = environment(doc);
    await importFoundation(env, doc);
    const initial = await env.call('buildMangroveComponents', doc, 'undrr');
    assert.strictEqual(initial.errors.length, 0, initial.errors.join('\n'));
    const originalIds = ownership(env.state);
    const unselectedIds = [...env.state.nodes.values()]
      .filter(node =>
        /^(family|review)\/tabs(?:-trigger)?(?:\/|$)/.test(
          identity(node, 'mgKitId')
        )
      )
      .map(node => node.id);
    const editable = [...env.state.nodes.values()].find(
      node =>
        identity(node, 'mgKitId') ===
        'review/button/specimen/long-label/instance'
    );
    const label = Object.keys(editable.componentProperties).find(name =>
      name.startsWith('Label#')
    );
    editable.setProperties({ [label]: 'Keep this designer override' });
    env.state.rejectedFonts.add('Roboto Condensed Regular');
    env.state.rejectedFonts.add('Roboto Condensed Bold');
    env.state.loadedFonts.clear();
    const updated = await env.call('buildMangroveComponents', doc, 'undrr', [
      'button',
      'text-input',
      'combobox-option',
      'combobox',
    ]);
    assert.strictEqual(updated.errors.length, 0, updated.errors.join('\n'));
    assert.strictEqual(updated.families.length, 4);
    assert.strictEqual(updated.createdNodeIds.length, 0);
    assert.deepStrictEqual(ownership(env.state), originalIds);
    assert(
      unselectedIds.every(id => !updated.updatedNodeIds.includes(id)),
      'Unselected Tabs construction and review nodes must remain untouched'
    );
    assert.strictEqual(
      editable.componentProperties[label].value,
      'Keep this designer override'
    );
    assert(!env.state.loadedFonts.has('Roboto Condensed Regular'));
    assert(!env.state.loadedFonts.has('Roboto Condensed Bold'));
    console.log(
      'ok  selected Roboto families update existing kit without loading or rewriting unavailable Tabs'
    );

    env.state.modeLimit = 5;
    const collection = env.state.collections[0];
    collection.addMode(doc.modes.find(mode => mode.id === 'delta').name);
    const beforeModes = [...env.state.nodes.values()].map(node => [
      node.id,
      copy(node.explicitVariableModes),
    ]);
    let styleWrites = 0;
    for (const style of env.state.styles) {
      const original = style.setBoundVariable;
      style.setBoundVariable = function (...args) {
        styleWrites += 1;
        return original.apply(this, args);
      };
    }
    env.state.loadedFonts.clear();
    const blocked = await env.call('buildMangroveComponents', doc, 'delta', [
      'button',
    ]);
    assert.strictEqual(blocked.families.length, 0);
    assert.strictEqual(blocked.createdNodeIds.length, 0);
    assert.strictEqual(blocked.updatedNodeIds.length, 0);
    assert.strictEqual(
      styleWrites,
      0,
      'Mode transition must block before styles'
    );
    assert.strictEqual(blocked.styles, undefined);
    assert(
      blocked.errors.some(error => error.includes('Roboto Condensed')),
      'Unavailable descendant font must report its exact family'
    );
    assert(
      blocked.audit.some(
        entry =>
          entry.nodeId && entry.status === 'blocked-container-mode-transition'
      )
    );
    assert.deepStrictEqual(ownership(env.state), originalIds);
    assert.deepStrictEqual(
      [...env.state.nodes.values()].map(node => [
        node.id,
        copy(node.explicitVariableModes),
      ]),
      beforeModes,
      'Blocked mode transition must preserve every explicit mode'
    );
    console.log(
      'ok  unavailable descendant font blocks a container mode transition before style or canvas writes'
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
    // Exercise both the local codec and its dependency-free emitted decoder.
    const isolatedDecoder = vm.runInNewContext(
      `(${connector.decompressJSON.toString()})`
    );
    const fixtures = [
      null,
      '',
      [],
      {},
      false,
      'Latin café, العربية, 中文, 🦀\nSecond line',
      'Repeated Unicode 災 🦀'.repeat(2000),
    ];
    let seed = 573;
    let saturated = '';
    for (let i = 0; i < 400000; i += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      saturated += String.fromCharCode(32 + (seed % 95));
    }
    fixtures.push(saturated);
    for (const fixture of fixtures) {
      const packed = connector.compressJSON(fixture);
      assert.deepStrictEqual(connector.decompressJSON(packed), fixture);
      assert.strictEqual(
        JSON.stringify(isolatedDecoder(packed)),
        JSON.stringify(fixture)
      );
    }
    const saturatedHeader = connector.compressJSON(saturated).split(':');
    assert.strictEqual(Number(saturatedHeader[0]), 16);
    assert(
      Number(saturatedHeader[1]) > 65536,
      'Dictionary cap was not exercised'
    );
    for (const malformed of [
      '',
      '7:1:AA==',
      '17:1:AA==',
      '8:0:',
      '8:2:AA==',
      '9:1:AP8=',
    ])
      assert.throws(() => connector.decompressJSON(malformed));
    const env = environment(doc, { sharedOnly: true });
    const allStyles = [...doc.styles.text, ...doc.styles.effect];
    const chunks = (ids, size) =>
      Array.from({ length: Math.ceil(ids.length / size) }, (_, index) =>
        ids.slice(index * size, (index + 1) * size)
      );
    // Explicit caller batches cover every exported asset, including optional
    // text styles. The compiler may add dependencies, never omit requested IDs.
    const importBatches = [
      ...chunks(
        doc.variables.map(spec => spec.id),
        70
      ).map(variableIds => ({ variableIds })),
      ...chunks(
        allStyles.map(spec => spec.id),
        20
      ).map(styleIds => ({ styleIds })),
    ];
    const nativeVariableIds = new Map();
    const nativeStyleIds = new Map();
    const importSizes = [];
    const aliasSpec = doc.variables.find(spec => spec.values.undrr?.alias);
    const expectedClosure = new Set();
    function aliasClosure(spec) {
      expectedClosure.add(spec.id);
      const target = spec.values.undrr?.alias;
      if (target)
        aliasClosure(doc.variables.find(item => item.name === target));
    }
    aliasClosure(aliasSpec);
    const aliasSubset = connector.subsetDocument(
      doc,
      'import',
      'undrr',
      [],
      undefined,
      { variableIds: [aliasSpec.id] }
    );
    assert.deepStrictEqual(
      aliasSubset.variables.map(spec => spec.id).sort(),
      [...expectedClosure].sort()
    );
    assert.strictEqual(
      aliasSubset.styles.text.length + aliasSubset.styles.effect.length,
      0
    );
    expectedClosure.clear();
    const oneStyle = doc.styles.text[0];
    Object.values(oneStyle.bindings).forEach(name =>
      aliasClosure(doc.variables.find(spec => spec.name === name))
    );
    const styleSubset = connector.subsetDocument(
      doc,
      'import',
      'undrr',
      [],
      undefined,
      { styleIds: [oneStyle.id] }
    );
    assert.deepStrictEqual(
      styleSubset.variables.map(spec => spec.id).sort(),
      [...expectedClosure].sort()
    );
    assert.deepStrictEqual(
      styleSubset.styles.text.map(style => style.id),
      [oneStyle.id]
    );
    assert.strictEqual(styleSubset.styles.effect.length, 0);
    for (const [iteration, mode] of [...doc.modes, doc.modes[0]].entries()) {
      const coveredVariables = new Set();
      const coveredStyles = new Set();
      for (const selection of importBatches) {
        const payload = await connector.buildConnector({
          operation: 'import',
          brandId: mode.id,
          doc,
          ...selection,
        });
        assert(payload.characters <= 50000 && payload.bytes <= 50000);
        importSizes.push(payload.bytes);
        const subset = connector.subsetDocument(
          doc,
          'import',
          mode.id,
          [],
          undefined,
          selection
        );
        const byName = new Map(subset.variables.map(spec => [spec.name, spec]));
        for (const spec of subset.variables) {
          const value = spec.values[mode.id];
          if (value && typeof value === 'object' && 'alias' in value)
            assert(
              byName.has(value.alias),
              'Batch omitted an alias dependency'
            );
        }
        for (const style of [...subset.styles.text, ...subset.styles.effect]) {
          const bindingNames = style.bindings
            ? Object.values(style.bindings)
            : style.values[mode.id].flatMap(entry =>
                Object.values(entry.bindings || {})
              );
          for (const name of bindingNames)
            assert(
              byName.has(name),
              'Batch omitted a style binding dependency'
            );
        }
        assert.deepStrictEqual(
          connector.decompressJSON(connector.compressJSON(subset)),
          subset
        );
        for (const [specs, originals, covered] of [
          [subset.variables, doc.variables, coveredVariables],
          [
            [...subset.styles.text, ...subset.styles.effect],
            allStyles,
            coveredStyles,
          ],
        ]) {
          for (const spec of specs) {
            covered.add(spec.id);
            const original = originals.find(item => item.id === spec.id);
            assert.deepStrictEqual(
              spec,
              { ...original, values: { [mode.id]: original.values[mode.id] } },
              'Import batching discarded metadata'
            );
          }
        }
        const imported = await env.runCode(payload.code);
        assert.strictEqual(
          imported.result.errors.length,
          0,
          imported.result.errors.join('\n')
        );
        assert.strictEqual(
          imported.result.styles.errors.length,
          0,
          imported.result.styles.errors.join('\n')
        );
        assert.deepStrictEqual(copy(imported.scope), payload.scope);
        assert.strictEqual(imported.scope.prune, false);
        assert.strictEqual(
          imported.removedVariableIds.length + imported.removedStyleIds.length,
          0
        );
        assert.strictEqual(
          imported.createdStyleIds.length,
          imported.result.styles.counts.text.created +
            imported.result.styles.counts.effect.created
        );
        for (const [assets, key, nativeIds] of [
          [env.state.variables, 'mgId', nativeVariableIds],
          [env.state.styles, 'mgStyleId', nativeStyleIds],
        ]) {
          for (const asset of assets) {
            const id = identity(asset, key);
            if (nativeIds.has(id))
              assert.strictEqual(asset.id, nativeIds.get(id));
            else nativeIds.set(id, asset.id);
          }
        }
        if (iteration > 0) {
          // Subsequent brands and the final repeat must reuse every native ID.
          assert.strictEqual(
            imported.createdVariableIds.length +
              imported.createdStyleIds.length,
            0
          );
        }
      }
      assert.deepStrictEqual(
        [...coveredVariables].sort(),
        doc.variables.map(spec => spec.id).sort()
      );
      assert.deepStrictEqual(
        [...coveredStyles].sort(),
        allStyles.map(spec => spec.id).sort()
      );
      const physicalMode = env.state.collections[0].modes[0].modeId;
      for (const spec of doc.variables) {
        const variable = env.state.variables.find(
          asset => identity(asset, 'mgId') === spec.id
        );
        const value = spec.values[mode.id];
        const expected =
          value && typeof value === 'object' && 'alias' in value
            ? {
                type: 'VARIABLE_ALIAS',
                id: nativeVariableIds.get(
                  doc.variables.find(target => target.name === value.alias).id
                ),
              }
            : value;
        assert.deepStrictEqual(
          copy(variable.valuesByMode[physicalMode]),
          expected
        );
        assert.strictEqual(variable.description, spec.description);
        assert.deepStrictEqual(copy(variable.scopes), spec.scopes);
        assert.deepStrictEqual(copy(variable.codeSyntax), spec.codeSyntax);
        assert.strictEqual(
          variable.hiddenFromPublishing,
          spec.hiddenFromPublishing
        );
      }
      for (const spec of allStyles) {
        const style = env.state.styles.find(
          asset => identity(asset, 'mgStyleId') === spec.id
        );
        assert.strictEqual(style.name, spec.name);
        assert.strictEqual(style.description, spec.description || '');
        const expectedAlias = name => ({
          type: 'VARIABLE_ALIAS',
          id: nativeVariableIds.get(
            doc.variables.find(variable => variable.name === name).id
          ),
        });
        if (spec.bindings) {
          assert.deepStrictEqual(
            copy(style.fontName),
            spec.values[mode.id].fontName
          );
          assert.strictEqual(style.fontSize, spec.values[mode.id].fontSize);
          assert.deepStrictEqual(
            copy(style.lineHeight),
            spec.values[mode.id].lineHeight
          );
          for (const [field, name] of Object.entries(spec.bindings))
            assert.deepStrictEqual(
              copy(style.boundVariables[field]),
              expectedAlias(name)
            );
        } else {
          assert.deepStrictEqual(
            copy(style.effects),
            spec.values[mode.id].map(entry => ({
              ...entry.effect,
              boundVariables: Object.fromEntries(
                Object.entries(entry.bindings || {}).map(([field, name]) => [
                  field,
                  expectedAlias(name),
                ])
              ),
            }))
          );
        }
      }
    }
    assert.strictEqual(nativeVariableIds.size, doc.variables.length);
    assert.strictEqual(nativeStyleIds.size, allStyles.length);
    await assert.rejects(
      connector.buildConnector({ operation: 'import', doc }),
      /exceeds 50000.*variableIds\/styleIds batches/
    );
    // Validation happens in the compiler before any script or native writes.
    const untouched = JSON.stringify({
      variables: [...nativeVariableIds],
      styles: [...nativeStyleIds],
    });
    for (const options of [
      { variableIds: [] },
      { variableIds: ['missing'] },
      { styleIds: ['missing'] },
      { variableIds: [doc.variables[0].id, doc.variables[0].id] },
      { styleIds: [allStyles[0].id, allStyles[0].id] },
      { variableIds: [null] },
      { styleIds: 'invalid' },
    ])
      await assert.rejects(
        connector.buildConnector({ operation: 'import', doc, ...options })
      );
    for (const mutate of [
      bad => bad.variables.push(copy(bad.variables[0])),
      bad => bad.styles.effect.push(copy(bad.styles.effect[0])),
      bad => {
        bad.variables[0].values.undrr = { alias: 'missing' };
      },
      bad => {
        bad.variables[0].values.undrr = { alias: 'font-size/100' };
      },
      bad => {
        bad.styles.text[0].bindings.fontFamily = 'font-size/100';
      },
      bad => {
        bad.styles.effect[0].values.undrr[0].bindings.color = 'font-size/100';
      },
      bad => {
        bad.variables[0].values.undrr = { alias: bad.variables[0].name };
      },
      bad => {
        bad.variables[0].values.undrr = { r: NaN };
      },
    ]) {
      const bad = copy(doc);
      mutate(bad);
      await assert.rejects(
        connector.buildConnector({
          operation: 'import',
          doc: bad,
          variableIds: [doc.variables[0].id],
        }),
        /Import preflight/
      );
    }
    assert.strictEqual(
      JSON.stringify({
        variables: [...nativeVariableIds],
        styles: [...nativeStyleIds],
      }),
      untouched
    );
    console.log(
      `ok  lossless import batches: ${doc.modes.length} brands, ${doc.variables.length} variables / ${allStyles.length} styles, ${Math.min(...importSizes)}-${Math.max(...importSizes)} bytes`
    );
    const importScript = await connector.buildConnector({
      operation: 'import',
      doc,
      styleIds: [
        ...doc.styles.text.filter(style => style.recommended),
        ...doc.styles.effect,
      ].map(style => style.id),
    });
    const imported = await env.runCode(importScript.code);
    assert.strictEqual(
      imported.result.errors.length,
      0,
      imported.result.errors.join('\n')
    );
    assert.strictEqual(imported.createdVariableIds.length, 0);
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
    const table = doc.components.families.find(family => family.id === 'table');
    assert(table, 'Table connector batching fixture missing');
    const setIds = new Map();
    const variantNodeIds = new Map();
    function stableBatch(report) {
      assert.strictEqual(report.errors.length, 0, report.errors.join('\n'));
      for (const family of report.families) {
        const guidance = doc.kitGuidance.families.find(
          item => item.id === family.id
        );
        assert.strictEqual(
          env.state.nodes.get(family.setId).description,
          guidance.connectorDescription,
          'Scoped connector builds must retain current consumer guidance'
        );
        if (setIds.has(family.id))
          assert.strictEqual(family.setId, setIds.get(family.id));
        else setIds.set(family.id, family.setId);
        for (const variant of family.variantIds) {
          const key = `${family.id}/${variant.id}`;
          if (variantNodeIds.has(key))
            assert.strictEqual(variant.nodeId, variantNodeIds.get(key));
          else variantNodeIds.set(key, variant.nodeId);
        }
      }
      for (const setId of setIds.values()) {
        const variants = env.state.nodes
          .get(setId)
          .children.filter(node => node.type === 'COMPONENT');
        for (let i = 0; i < variants.length; i += 1)
          for (let j = i + 1; j < variants.length; j += 1) {
            const a = variants[i];
            const b = variants[j];
            assert(
              a.x + a.width <= b.x ||
                b.x + b.width <= a.x ||
                a.y + a.height <= b.y ||
                b.y + b.height <= a.y,
              'Retained variants overlap after a scoped connector batch'
            );
          }
      }
      for (const nodeId of variantNodeIds.values())
        assert(!env.state.nodes.get(nodeId).removed);
    }
    stableBatch(built);
    for (const variant of table.variants) {
      const subset = connector.subsetDocument(
        doc,
        'build',
        'undrr',
        ['table'],
        [variant.id]
      );
      assert.strictEqual(
        subset.components.families.find(family => family.id === 'table')
          .variants.length,
        1
      );
      for (const family of subset.components.families)
        for (const specimen of family.review?.specimens || [])
          assert(
            family.variants.some(item =>
              Object.entries(specimen.variant).every(
                ([key, value]) => item.properties[key] === value
              )
            ),
            'A scoped batch retained a review selector for an omitted variant'
          );
      const payload = await connector.buildConnector({
        operation: 'build',
        familyIds: ['table'],
        variantIds: [variant.id],
        doc,
      });
      assert(payload.characters <= 50000 && payload.bytes <= 50000);
      const report = await env.runCode(payload.code);
      assert.deepStrictEqual(copy(report.scope), {
        familyIds: ['table'],
        variantIds: [variant.id],
      });
      stableBatch(report);
    }
    assert.strictEqual(
      env.state.nodes.get(setIds.get('table')).children.length,
      table.variants.length
    );
    const repeatBatch = await connector.buildConnector({
      operation: 'build',
      familyIds: ['table'],
      variantIds: [table.variants[0].id],
      doc,
    });
    const repeated = await env.runCode(repeatBatch.code);
    stableBatch(repeated);
    assert.strictEqual(repeated.createdNodeIds.length, 0);
    await assert.rejects(
      connector.buildConnector({
        operation: 'build',
        familyIds: ['table'],
        variantIds: ['unknown-variant'],
        doc,
      }),
      /Unknown table variant/
    );
    await assert.rejects(
      connector.buildConnector({
        operation: 'build',
        familyIds: ['button', 'table'],
        variantIds: [table.variants[0].id],
        doc,
      }),
      /Variant batches require one family/
    );
    await assert.rejects(
      connector.buildConnector({
        operation: 'build',
        familyIds: ['table'],
        doc,
      }),
      /batch one family with explicit variantIds/
    );
    await assert.rejects(
      connector.buildConnector({
        operation: 'build',
        familyIds: ['text-cta'],
        doc,
      }),
      /batch one family with explicit variantIds/
    );
    const cta = doc.components.families.find(
      family => family.id === 'text-cta'
    );
    assert(cta, 'Text CTA connector batching fixture missing');
    env.state.rejectedFonts.delete('Roboto Condensed Regular');
    for (const variant of cta.variants) {
      const payload = await connector.buildConnector({
        operation: 'build',
        familyIds: ['text-cta'],
        variantIds: [variant.id],
        doc,
      });
      assert(payload.characters <= 50000 && payload.bytes <= 50000);
      const report = await env.runCode(payload.code);
      assert.deepStrictEqual(copy(report.scope), {
        familyIds: ['text-cta'],
        variantIds: [variant.id],
      });
      stableBatch(report);
    }
    assert.strictEqual(
      env.state.nodes.get(setIds.get('text-cta')).children.length,
      cta.variants.length
    );
    const ctaRepeatPayload = await connector.buildConnector({
      operation: 'build',
      familyIds: ['text-cta'],
      variantIds: [cta.variants[0].id],
      doc,
    });
    const ctaRepeated = await env.runCode(ctaRepeatPayload.code);
    stableBatch(ctaRepeated);
    assert.strictEqual(ctaRepeated.createdNodeIds.length, 0);
    console.log(
      'ok  packed connector codec, all-brand import bounds, canonical IDs/font failures, scoped Table/CTA batch identities/nonoverlapping grids and bounded inspection'
    );
  }
}
if (require.main === module)
  main().catch(error => {
    console.error(`FAIL ${error.stack || error}`);
    process.exitCode = 1;
  });
module.exports = { environment, importFoundation };
