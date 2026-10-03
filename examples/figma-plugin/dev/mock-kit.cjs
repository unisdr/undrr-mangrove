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
          '_horizontal',
          '_vertical',
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
