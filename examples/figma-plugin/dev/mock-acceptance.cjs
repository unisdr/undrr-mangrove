#!/usr/bin/env node
/** Focused property/ownership mock. It does not model native rendering or propagation. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const DIR = path.resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));
// Exercise the final normalized exporter document in memory. Reading raw family
// recipes or replacing them with handwritten trees hides identity migrations.
const GENERATED_DOC =
  require('../../../scripts/build-figma-tokens.cjs').buildFigmaVariables();

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
    getRangeFills(start, end) {
      assert.strictEqual(start, 0);
      assert.strictEqual(end, this.characters.length);
      return this.rangeFills || this.fills;
    }
    setBoundVariable() {
      state.writes++;
    }
    setExplicitVariableModeForCollection(collection, mode) {
      state.writes++;
      this.explicitVariableModes = { [collection.id]: mode };
    }
    resize(width, height) {
      state.writes++;
      this.width = width;
      this.height = height;
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
          'width',
          'height',
          'layoutSizingHorizontal',
          'layoutSizingVertical',
          'x',
          'y',
          'fontSize',
          'lineHeight',
          'textStyleId',
          'textAutoResize',
          'textDecoration',
          'textDecorationOffset',
          'textWrapStyle',
          'maxWidth',
          'clipsContent',
          'fills',
          'rangeFills',
          'strokes',
          'boundVariables',
          'vectorPaths',
          'strokeWeight',
          'strokeAlign',
          'cornerRadius',
          'itemSpacing',
          'layoutMode',
          'primaryAxisAlignItems',
          'paddingBottom',
          'counterAxisAlignItems',
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
  const details = set('details', {
    'Title#details-title': definition('TEXT', 'The Sendai Framework'),
    'Paragraph#details-paragraph': definition('TEXT', 'Supporting content'),
  });
  const select = set('select', {
    'Label#select-label': definition('TEXT', 'Category'),
    'Value#select-value': definition('TEXT', 'Select an option'),
    'Help text#select-help': definition('TEXT', 'Help'),
    'Error message#select-error': definition('TEXT', 'Please select an option'),
    'Show label#select-showlabel': definition('BOOLEAN', true),
    'Show help#select-showhelp': definition('BOOLEAN', true),
    'Show error#select-showerror': definition('BOOLEAN', true),
    'Required#select-required': definition('BOOLEAN', false),
  });
  const familyId = parent =>
    parent.data['orgundrrmangrove/mgKitId'].replace('family/', '');
  const variant = (parent, id, axes) => {
    const node = own(
      new Node('COMPONENT', id),
      `family/${familyId(parent)}/variant/${id}`
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
  const detail = variant(details, 'details.open.default.belowmedium.390', {
    Open: 'True',
    State: 'Default',
    Typography: 'BelowMedium',
    MeasuredViewport: '390',
  });
  detail.width = 390;
  detail.layoutSizingHorizontal = 'FIXED';
  detail.layoutSizingVertical = 'HUG';
  add(detail, 'TEXT', 'Title', { characters: 'Title#details-title' });
  add(detail, 'TEXT', 'Paragraph', {
    characters: 'Paragraph#details-paragraph',
  });
  const invalidSelect = variant(select, 'select.invalid', { State: 'Invalid' });
  invalidSelect.layoutSizingHorizontal = 'FIXED';
  invalidSelect.layoutSizingVertical = 'HUG';
  const selectLabel = add(invalidSelect, 'FRAME', 'mg-form-label', {
    visible: 'Show label#select-showlabel',
  });
  add(selectLabel, 'TEXT', 'Label', { characters: 'Label#select-label' });
  add(
    selectLabel,
    'TEXT',
    'Required marker',
    { visible: 'Required#select-required' },
    false
  );
  add(invalidSelect, 'TEXT', 'Value', { characters: 'Value#select-value' });
  add(invalidSelect, 'TEXT', 'Help', {
    characters: 'Help text#select-help',
    visible: 'Show help#select-showhelp',
  });
  const selectError = add(
    invalidSelect,
    'FRAME',
    'Invalid message source state'
  );
  add(selectError, 'TEXT', 'Error', {
    characters: 'Error message#select-error',
    visible: 'Show error#select-showerror',
  });
  // Synthetic TOC geometry is supplied explicitly. This fixture tests the
  // reader's equations and ownership, not a font renderer or auto-layout engine.
  const colors = {
    'color/interactive': { r: 0, g: 0.2, b: 0.6, a: 1 },
    'color/interactive-active': { r: 0.2, g: 0.6, b: 0.8, a: 1 },
    'color/text': { r: 0.1, g: 0.1, b: 0.1, a: 1 },
  };
  function tocText(node, color, style = '') {
    node.fontSize = 16;
    node.lineHeight = { unit: 'PERCENT', value: 150 };
    node.textStyleId = style;
    node.textAutoResize = 'HEIGHT';
    node.layoutSizingHorizontal = 'FILL';
    node.layoutSizingVertical = 'HUG';
    node.textWrapStyle = 'AUTO';
    node.textDecoration = 'UNDERLINE';
    node.textDecorationOffset = { unit: 'PERCENT', value: 15 };
    if (style === '')
      node.boundVariables = {
        fontFamily: [{ type: 'VARIABLE_ALIAS', id: 'font-family/text' }],
        fontSize: [{ type: 'VARIABLE_ALIAS', id: 'font-size/300' }],
      };
    node.fills = [
      {
        type: 'SOLID',
        color: { r: colors[color].r, g: colors[color].g, b: colors[color].b },
        opacity: 1,
        boundVariables: { color: { type: 'VARIABLE_ALIAS', id: color } },
      },
    ];
    return node;
  }
  const tocLinks = set('toc-link', {
    'Label#toc-label': definition('TEXT', 'Source link'),
  });
  const toc = set('table-of-contents', {
    'Title#toc-title': definition('TEXT', 'On this page'),
  });
  for (const width of [240, 390, 900]) {
    for (const State of ['Default', 'Hover', 'Focus', 'HoverFocus']) {
      const component = variant(
        tocLinks,
        `toc-link.${width}.${State.toLowerCase()}`,
        { MeasuredWidth: String(width), State }
      );
      component.maxWidth = component.width = width - 44.5;
      component.layoutSizingHorizontal = component.layoutSizingVertical = 'HUG';
      component.clipsContent = false;
      component.height = (width === 240 ? 72 : width === 390 ? 48 : 24) + 5;
      const label = tocText(
        add(component, 'TEXT', 'Link label', { characters: 'Label#toc-label' }),
        State.includes('Hover')
          ? 'color/interactive-active'
          : 'color/interactive'
      );
      label.width = component.width;
      label.height = component.height - 5;
      label.x = 0;
      label.y = 2.5;
    }
    const component = variant(toc, `table-of-contents.numbered.${width}`, {
      ListStyle: 'Numbered',
      MeasuredWidth: String(width),
    });
    component.width = width;
    component.layoutSizingHorizontal = 'FIXED';
    component.layoutSizingVertical = 'HUG';
    const title = tocText(
      add(component, 'TEXT', 'On this page heading', {
        characters: 'Title#toc-title',
      }),
      'color/text',
      'style:toc-title'
    );
    title.fontName = { family: 'Roboto', style: 'Bold' };
    title.fontSize = 18;
    title.lineHeight = { unit: 'PERCENT', value: 110 };
    title.textWrapStyle = 'BALANCE';
    title.textDecoration = 'NONE';
    title.textDecorationOffset = null;
    title.x = 22;
    title.width = width - 22;
    title.height = width === 240 ? 60 : 40;
    const list = add(component, 'FRAME', 'ol / six source links');
    list.x = 22;
    list.y = title.height + 10;
    for (let index = 1; index <= 6; index++) {
      const row = add(list, 'FRAME', `li / section-${index}`);
      row.x = 0;
      row.counterAxisAlignItems = 'MAX';
      const marker = add(row, 'FRAME', 'Decimal marker / last line');
      marker.x = 0;
      marker.width = 20;
      marker.height = 26.5;
      marker.paddingBottom = 2.5;
      const number = tocText(
        add(marker, 'TEXT', `Source ordered marker ${index}`),
        'color/text',
        'style:toc-marker'
      );
      number.characters = `${index}.`;
      number.width = 20;
      number.height = 24;
      number.x = number.y = 0;
      number.textAlignHorizontal = 'RIGHT';
      number.textDecoration = 'NONE';
      number.textDecorationOffset = null;
      const link = add(row, 'INSTANCE', `Link ${index}`);
      link.isExposedInstance = true;
      link.main = tocLinks.children.find(
        child => child.name === `toc-link.${width}.default`
      );
      link.maxWidth = link.width = width - 44.5;
      link.height = link.main.height;
      link.x = 22.5;
      link.y = 0;
      link.layoutSizingHorizontal = link.layoutSizingVertical = 'HUG';
      link.clipsContent = false;
      const label = tocText(
        add(link, 'TEXT', 'Link label', { characters: 'Label#toc-label' }),
        'color/interactive'
      );
      label.width = link.width;
      label.height = link.height - 5;
      label.x = 0;
      label.y = 2.5;
      marker.y = link.height - 26.5;
      row.height = link.height;
      row.y = (index - 1) * (row.height + 5);
    }
  }
  const sourceDoc = copy(GENERATED_DOC);
  const statusRecipes = [
    sourceDoc.components.families.find(family => family.id === 'status-label'),
  ];
  const sourceVars = new Map(sourceDoc.variables.map(v => [v.name, v]));
  const resolved = name => {
    const v = sourceVars.get(name).values.undrr;
    return v.alias ? resolved(v.alias) : v;
  };
  for (const v of sourceDoc.variables)
    if (v.type === 'COLOR') colors[v.name] = resolved(v.name);
  const tocTemplate = {
    id: 'style:toc-link',
    getPluginData: () => '',
    getSharedPluginData: (namespace, key) =>
      namespace === 'orgundrrmangrove' && key === 'mgStyleId'
        ? 'component.table-of-contents.link'
        : '',
    ...copy(
      sourceDoc.styles.text.find(
        style => style.id === 'component.table-of-contents.link'
      ).values.undrr
    ),
  };
  const roleValues = { 'font-family/text': 'Roboto', 'font-size/300': 16 };
  const statusSet = set('status-label', {
    'Label#status-label': definition('TEXT', 'Published'),
  });
  const statusStyle = {
    getPluginData: () => '',
    id: 'style:status-label',
    getSharedPluginData: (ns, key) =>
      ns === 'orgundrrmangrove' && key === 'mgStyleId'
        ? 'component.status-label.label'
        : '',
  };
  const statusPaint = role => [
    {
      type: 'SOLID',
      color: copy(colors[role]),
      opacity: 1,
      boundVariables: { color: { type: 'VARIABLE_ALIAS', id: role } },
    },
  ];
  for (const recipe of statusRecipes[0].variants) {
    const component = variant(statusSet, recipe.id, recipe.properties);
    component.width = 100;
    component.height = 24;
    component.itemSpacing = 7.5;
    component.layoutMode = 'HORIZONTAL';
    component.layoutSizingHorizontal = component.layoutSizingVertical = 'HUG';
    component.fills = [];
    const slot = add(component, 'FRAME', '14px source indicator allocation');
    slot.width = slot.height = 14;
    slot.x = 0;
    slot.y = 5;
    slot.fills = [];
    slot.layoutMode = recipe.tree.children[0].layout.mode;
    slot.counterAxisAlignItems = recipe.tree.children[0].layout.align;
    slot.primaryAxisAlignItems = recipe.tree.children[0].layout.justify;
    slot.clipsContent = false;
    for (const spec of recipe.tree.children[0].children) {
      const leaf = add(
        slot,
        spec.type === 'SVG' ? 'FRAME' : spec.type,
        spec.name
      );
      leaf.width =
        typeof spec.layout.width === 'number'
          ? spec.layout.width
          : resolved(spec.layout.width);
      leaf.height =
        typeof spec.layout.height === 'number'
          ? spec.layout.height
          : resolved(spec.layout.height);
      leaf.x = spec.position.x;
      leaf.y = spec.position.y;
      if (spec.type === 'SVG') {
        leaf.fills = [];
        leaf.data['orgundrrmangrove/mgSvgAsset'] = JSON.stringify({
          assetId: spec.svg.assetId,
          markup: spec.svg.markup,
        });
        const vector = add(leaf, 'VECTOR', spec.name + ' / vector');
        vector.width = leaf.width;
        vector.height = leaf.height;
        vector.vectorPaths = [{ windingRule: 'NONZERO', data: 'M0 0' }];
        vector.fills = statusPaint(spec.svg.monochrome.fills);
        vector.strokes = spec.svg.monochrome.strokes
          ? statusPaint(spec.svg.monochrome.strokes)
          : [];
        vector.strokeWeight = 1;
        vector.strokeAlign = 'CENTER';
      } else {
        leaf.fills = statusPaint(spec.fill);
        leaf.strokes = statusPaint(spec.stroke);
        leaf.strokeWeight = 1;
        leaf.strokeAlign = 'INSIDE';
        if (spec.bindings.cornerRadius)
          leaf.cornerRadius = resolved(spec.bindings.cornerRadius);
      }
    }
    const text = add(component, 'TEXT', 'Status name', {
      characters: 'Label#status-label',
    });
    text.characters = 'Published';
    text.width = 78.5;
    text.height = 24;
    text.x = 21.5;
    text.y = 0;
    text.fontSize = 16;
    text.lineHeight = { unit: 'PERCENT', value: 150 };
    text.textStyleId = statusStyle.id;
    text.textAutoResize = 'WIDTH_AND_HEIGHT';
    text.layoutSizingHorizontal = text.layoutSizingVertical = 'HUG';
    text.textWrapStyle = 'AUTO';
    text.textDecoration = 'NONE';
    text.textDecorationOffset = null;
    text.fills = statusPaint('status-label/color');
  }
  const collection = {
    id: 'collection:1',
    name: 'Mangrove',
    modes: [{ modeId: 'mode:1', name: 'UNDRR' }],
  };
  const figma = {
    currentPage: page,
    mixed: Symbol('mixed'),
    variables: {
      getLocalVariableCollectionsAsync: async () => [collection],
      getVariableByIdAsync: async id =>
        colors[id]
          ? {
              name: id,
              resolvedType: 'COLOR',
              resolveForConsumer: () => ({
                value: options.quantizedColors
                  ? Object.fromEntries(
                      Object.entries(colors[id]).map(([field, value]) => [
                        field,
                        Math.fround(value),
                      ])
                    )
                  : colors[id],
              }),
            }
          : id in roleValues
            ? {
                name: id,
                resolvedType:
                  typeof roleValues[id] === 'string' ? 'STRING' : 'FLOAT',
                resolveForConsumer: () => ({ value: roleValues[id] }),
              }
            : null,
    },
    getLocalTextStylesAsync: async () => [
      ...(options.missingStatusStyle ? [] : [statusStyle]),
      ...(options.missingTocTemplate ? [] : [tocTemplate]),
    ],
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
    variables: [
      ...Object.entries(colors).map(([name, color]) => ({
        name,
        type: 'COLOR',
        values: { undrr: color },
      })),
      ...Object.entries(roleValues).map(([name, value]) => ({
        name,
        type: typeof value === 'string' ? 'STRING' : 'FLOAT',
        values: { undrr: value },
      })),
    ],
    styles: { text: sourceDoc.styles.text },
    components: {
      families: [combo, radio, details, select, tocLinks, toc, statusSet].map(
        parent => ({
          id: familyId(parent),
          variants: parent.children.map(node => ({
            id: node.name,
            properties: node.axes,
            ...(parent === statusSet
              ? {
                  tree: statusRecipes[0].variants.find(v => v.id === node.name)
                    .tree,
                }
              : {}),
            ...([tocLinks, toc].includes(parent)
              ? {
                  tree: sourceDoc.components.families
                    .find(family => family.id === familyId(parent))
                    .variants.find(variant => variant.id === node.name).tree,
                }
              : {}),
          })),
        })
      ),
    },
  };
  const rebuild = {
    errors: [],
    families: [
      combo,
      radio,
      optionSet,
      details,
      select,
      tocLinks,
      toc,
      statusSet,
    ].map(parent => ({
      id: familyId(parent),
      setId: parent.id,
      variantIds: parent.children.map(node => ({
        id: node.name,
        nodeId: node.id,
      })),
    })),
    audit: [
      'combobox',
      'radio',
      'combobox-option',
      'details',
      'select',
      'toc-link',
      'table-of-contents',
      'status-label',
    ].map(family => ({
      family,
      status: 'built',
    })),
  };
  let context;
  const restart = () => {
    context = vm.createContext({ figma, Date, Math, console });
    for (const file of ['kit-identity.js', 'kit-acceptance.js'])
      vm.runInContext(fs.readFileSync(path.join(DIR, file), 'utf8'), context);
  };
  restart();
  const call = (name, ...args) => {
    context.args = args;
    return vm.runInContext(`${name}(...args)`, context);
  };
  return {
    state,
    restart,
    Node,
    page,
    main,
    combo,
    radio,
    open,
    details,
    select,
    tocLinks,
    toc,
    statusSet,
    tocTemplate,
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
    const env = environment(),
      original = [...env.state.nodes.keys()],
      beforeMatrices = copy(
        env.statusSet.children.map(n => ({ id: n.id, axes: n.axes }))
      );
    const prepared = await env.call(
      'prepareMangroveOverrideProbes',
      env.doc,
      'undrr',
      'status'
    );
    assert.deepStrictEqual(copy(prepared.errors), []);
    assert(prepared.ledger.complete);
    assert.strictEqual(prepared.ledger.probes.length, 7);
    assert.strictEqual(prepared.ledger.statusCanonical.length, 7);
    assert(prepared.createdNodeIds.every(id => !original.includes(id)));
    assert.strictEqual(
      new Set(prepared.createdNodeIds).size,
      prepared.createdNodeIds.length
    );
    for (const probe of prepared.ledger.probes) {
      assert.strictEqual(probe.targets.length, 1);
      assert(probe.targets[0].key.startsWith('Label#'));
      assert.strictEqual(probe.statusSizing.narrow.width, 240);
      assert.strictEqual(probe.statusSizing.restored.horizontal, 'HUG');
      assert.strictEqual(probe.statusSizing.restored.textHorizontal, 'HUG');
    }
    let compared = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert(
      compared.passed,
      JSON.stringify(compared.assertions.filter(a => !a.passed))
    );
    assert.deepStrictEqual(
      copy(env.statusSet.children.map(n => ({ id: n.id, axes: n.axes }))),
      beforeMatrices
    );
    const canonical = env.state.nodes.get(
        prepared.ledger.statusCanonical[0].mainComponentId
      ),
      label = canonical.findAll(n => n.type === 'TEXT')[0];
    label.rangeFills = copy(label.fills);
    label.rangeFills[0].opacity = 0.9;
    compared = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert(!compared.passed);
    assert(
      compared.assertions.some(
        a => !a.passed && a.name.includes('exact native matrix')
      )
    );
    label.rangeFills = copy(label.fills);
    const shape = canonical.findAll(n => n.type === 'ELLIPSE')[0];
    const oldRing = shape.strokeWeight;
    shape.strokeWeight = 2;
    compared = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert(!compared.passed);
    shape.strokeWeight = oldRing;
    const svg = env.statusSet.children
      .find(n => n.axes.Status === 'Warning')
      .findAll(n => n.data['orgundrrmangrove/mgSvgAsset'])[0];
    const oldWidth = svg.width;
    svg.width += 0.01;
    compared = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert(!compared.passed);
    svg.width = oldWidth;
    const sourceBaseline = copy(prepared.ledger);
    sourceBaseline.statusCanonical[0].baseline.nodes[0].diagnostics.multipartFixture =
      'e'.repeat(95000);
    await env.call(
      'mgAcceptancePersist',
      env.state.nodes.get(prepared.rootId),
      sourceBaseline
    );
    assert.strictEqual(
      JSON.parse(
        env.state.nodes
          .get(prepared.rootId)
          .getSharedPluginData('orgundrrmangrove', 'mgAcceptanceLedger')
      ).partCount,
      2
    );
    const root = env.state.nodes.get(prepared.rootId),
      raw = root.getSharedPluginData('orgundrrmangrove', 'mgAcceptanceLedger');
    assert(raw);
    // Recreate the plugin VM: cleanup must recover only the persisted ledger.
    env.restart();
    const cleanup = await env.call(
      'removeMangroveOverrideProbes',
      prepared.rootId
    );
    assert.deepStrictEqual(copy(cleanup.errors), []);
    assert.deepStrictEqual(copy(cleanup.retained), []);
    assert.strictEqual(
      cleanup.removedNodeIds.length,
      prepared.createdNodeIds.length
    );
    assert.deepStrictEqual([...env.state.nodes.keys()], original);
    console.log(
      'ok  Status seven edited axes/text keys, temporary240/restored intrinsic sizing, exact canonical/range/shape/viewport baselines and owned cleanup'
    );
  }
  {
    for (const options of [
      { rejectFont: true },
      { missingStatusStyle: true },
    ]) {
      const env = environment(options),
        ids = [...env.state.nodes.keys()],
        writes = env.state.writes;
      const prepared = await env.call(
        'prepareMangroveOverrideProbes',
        env.doc,
        'undrr',
        'status'
      );
      assert(prepared.errors.length);
      assert.strictEqual(prepared.createdNodeIds.length, 0);
      assert.deepStrictEqual([...env.state.nodes.keys()], ids);
      assert.strictEqual(env.state.writes, writes);
    }
    const wrongAlias = environment();
    const wrongText = wrongAlias.statusSet.children[0].findAll(
      n => n.type === 'TEXT'
    )[0];
    wrongText.rangeFills = copy(wrongText.fills);
    wrongText.rangeFills[0].boundVariables.color.id = 'color/text';
    const untouched = [...wrongAlias.state.nodes.keys()],
      writes = wrongAlias.state.writes;
    const refusedAlias = await wrongAlias.call(
      'prepareMangroveOverrideProbes',
      wrongAlias.doc,
      'undrr',
      'status'
    );
    assert(refusedAlias.errors.some(error => error.includes('alias changed')));
    assert.deepStrictEqual([...wrongAlias.state.nodes.keys()], untouched);
    assert.strictEqual(wrongAlias.state.writes, writes);
    const env = environment(),
      prepared = await env.call(
        'prepareMangroveOverrideProbes',
        env.doc,
        'undrr',
        'status'
      ),
      probe = prepared.ledger.probes[0],
      instance = env.state.nodes.get(probe.nodeId),
      child = instance.children[0].children[0];
    instance.children[0].children = [];
    env.page.appendChild(child);
    const cleanup = await env.call(
      'removeMangroveOverrideProbes',
      prepared.rootId
    );
    assert(cleanup.retained.some(n => n.id === instance.id));
    assert(env.state.nodes.has(child.id));
    console.log(
      'ok  Status font/style preflight writes no canvas; moved or missing recorded shape prevents cleanup'
    );
  }
  {
    const env = environment({ quantizedColors: true });
    for (const node of env.main.findAll(node => node.type === 'TEXT')) {
      node.fontName = {
        ...node.fontName,
        variationSettings: {
          wdth: 100,
          wght: node.fontName.style === 'Bold' ? 700 : 400,
        },
      };
    }
    env.tocTemplate.fontName = copy(
      env.tocLinks.children[0].children[0].fontName
    );
    const prepared = await env.call(
      'prepareMangroveOverrideProbes',
      env.doc,
      'undrr',
      'toc'
    );
    assert.deepStrictEqual(copy(prepared.errors), []);
    assert(prepared.ledger.probes.every(probe => probe.tocGeometry.passed));
    const comparison = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert(
      comparison.passed,
      JSON.stringify(comparison.assertions.filter(check => !check.passed))
    );
    assert(
      comparison.assertions
        .filter(check => check.name.includes(' source color/'))
        .every(check => check.channelTolerance === 1e-6)
    );
    const probe = prepared.ledger.probes[0],
      text = env.state.nodes.get(probe.targets[0].nodeId);
    assert.deepStrictEqual(copy(text.fontName.variationSettings), {
      wdth: 100,
      wght: 400,
    });
    text.fontName.variationSettings.wdth = 99;
    const variationChanged = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert(
      variationChanged.assertions.some(
        check =>
          !check.passed &&
          check.name.includes(text.id) &&
          check.name.endsWith(': fontName')
      )
    );
    const canonical = env.state.nodes.get(
      prepared.ledger.canonicalPaints[0].nodeId
    );
    canonical.rangeFills = copy(canonical.fills);
    canonical.rangeFills[0].opacity = 0.99;
    const colorChanged = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert(
      colorChanged.assertions.some(
        check =>
          !check.passed &&
          check.name.includes(canonical.id) &&
          check.name.includes('rebuilt source')
      )
    );
    console.log(
      'ok  native variationSettings remain full evidence and exact repeat checks; sourceRGBA tolerates only1e-6 float rounding, not changed opacity or axes'
    );
  }
  {
    const env = environment(),
      original = [...env.state.nodes.keys()];
    const prepared = await env.call(
      'prepareMangroveOverrideProbes',
      env.doc,
      'undrr',
      'toc'
    );
    assert.deepStrictEqual(copy(prepared.errors), []);
    assert(prepared.ledger.complete);
    assert.strictEqual(prepared.ledger.probes.length, 6);
    assert.strictEqual(prepared.createdNodeIds.length, 106);
    assert.strictEqual(prepared.ledger.canonicalPaints.length, 51);
    for (const probe of prepared.ledger.probes) {
      assert(
        probe.tocGeometry.passed,
        JSON.stringify(probe.tocGeometry.checks.filter(check => !check.passed))
      );
      assert(probe.baseline.nodes.every(node => !('boundVariables' in node)));
      assert(
        probe.baseline.nodes
          .filter(node => node.type === 'TEXT')
          .every(
            node =>
              Array.isArray(node.rangeFills) &&
              Array.isArray(node.resolvedFills)
          )
      );
      assert(probe.targets.every(target => target.key.includes('#')));
      if (probe.familyId === 'table-of-contents') {
        assert.strictEqual(probe.targets.length, 7);
        assert.strictEqual(
          env.state.nodes.get(probe.nodeId).width,
          probe.requestedWidth
        );
      }
    }
    const saved = env.state.nodes
      .get(prepared.rootId)
      .getSharedPluginData('orgundrrmangrove', 'mgAcceptanceLedger');
    assert(
      saved.length <= 90000,
      `Synthetic persisted evidence length ${saved.length}`
    );
    // Source defaults change while actual synthetic property overrides stay set.
    env.toc.definitions['Title#toc-title'].defaultValue =
      'Changed source title';
    env.tocLinks.definitions['Label#toc-label'].defaultValue =
      'Changed source label';
    const before = { writes: env.state.writes, loads: env.state.loads };
    const compared = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert(
      compared.passed,
      JSON.stringify(compared.assertions.filter(check => !check.passed))
    );
    assert.deepStrictEqual(
      { writes: env.state.writes, loads: env.state.loads },
      before
    );
    assert.strictEqual(compared.canonicalAfter.length, 51);
    const wrapped = prepared.ledger.probes.find(
      probe => probe.id === 'toc-numbered-240'
    );
    const marker = env.state.nodes
      .get(wrapped.nodeId)
      .findAll(node => node.name === 'Decimal marker / last line')[0];
    marker.y = 0;
    const misplaced = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert(!misplaced.passed);
    assert(
      misplaced.assertions.some(
        check => !check.passed && check.name.includes('text ends above link')
      )
    );
    marker.y = 50.5;
    const format = env.state.nodes.get(wrapped.format.nodeId);
    format.textAlignHorizontal = 'LEFT';
    const lostFormat = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert(
      lostFormat.assertions.some(
        check => !check.passed && check.name.includes('textAlignHorizontal')
      )
    );
    const cleanup = await env.call(
      'removeMangroveOverrideProbes',
      prepared.rootId
    );
    assert.deepStrictEqual(copy(cleanup.errors), []);
    assert.deepStrictEqual(copy(cleanup.retained), []);
    assert.strictEqual(cleanup.removedNodeIds.length, 106);
    assert.deepStrictEqual([...env.state.nodes.keys()], original);
    console.log(
      'ok  TOC six-probe scope persists exact106-node ledger, six labels per composition, width/format/identity, source paints and synthetic last-line equations; compare stays read-only'
    );
  }
  {
    const env = environment();
    // Existing composed consumers may retain a former association. It is
    // evidence to preserve, not a canonical DIRECT main-style requirement.
    for (const composition of env.toc.children)
      for (const text of composition.findAll(
        node => node.name === 'Link label'
      ))
        text.textStyleId = 'style:existing-consumer';
    const prepared = await env.call(
      'prepareMangroveOverrideProbes',
      env.doc,
      'undrr',
      'toc'
    );
    assert.deepStrictEqual(copy(prepared.errors), []);
    const direct = prepared.ledger.canonicalPaints.filter(
      item => item.directTypography
    );
    assert.strictEqual(direct.length, 12);
    assert(
      env.doc.components.families
        .find(family => family.id === 'toc-link')
        .variants.every(
          variant =>
            variant.tree.children[0].id === `${variant.tree.id}/Link label`
        )
    );
    assert(direct.every(item => item.directTypography.textStyleId === ''));
    assert(
      direct.every(item =>
        ['fontFamily', 'fontSize'].every(
          field =>
            Array.isArray(item.directTypography.roleBindings[field].alias) &&
            item.directTypography.roleBindings[field].alias.length === 1
        )
      )
    );
    const passed = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert(
      passed.passed,
      JSON.stringify(passed.assertions.filter(item => !item.passed))
    );
    const consumer = env.state.nodes.get(
      prepared.ledger.probes[0].targets[0].nodeId
    );
    const originalBindings = copy(consumer.boundVariables);
    delete consumer.boundVariables.fontSize;
    const consumerLost = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert(
      consumerLost.assertions.some(
        item =>
          !item.passed &&
          item.name.includes(consumer.id) &&
          item.name.endsWith(': typographyBindings')
      )
    );
    consumer.boundVariables = originalBindings;
    const canonical = env.state.nodes.get(direct[0].nodeId);
    const nativeAlias = copy(canonical.boundVariables.fontSize);
    canonical.boundVariables.fontSize = nativeAlias[0];
    const shapeChanged = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert(
      shapeChanged.assertions.some(
        item =>
          !item.passed &&
          item.name === `canonical/${canonical.id}: DIRECT roleBindings`
      )
    );
    canonical.boundVariables.fontSize = nativeAlias;
    delete canonical.boundVariables.fontSize;
    const lost = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert(
      lost.assertions.some(
        item =>
          !item.passed &&
          item.name === `canonical/${canonical.id}: DIRECT roleBindings`
      )
    );
    for (const mutation of [
      fixture =>
        fixture.doc.components.families
          .find(family => family.id === 'toc-link')
          .variants.pop(),
      fixture =>
        (fixture.doc.components.families.find(
          family => family.id === 'toc-link'
        ).variants[0].tree.children[0].textStyleApplication = 'UNKNOWN'),
      fixture =>
        (fixture.doc.components.families.find(
          family => family.id === 'toc-link'
        ).variants[0].tree.children[0].id = 'label'),
      fixture =>
        (fixture.doc.components.families.find(
          family => family.id === 'toc-link'
        ).variants[0].tree.name = 'Other root'),
      fixture =>
        (fixture.doc.components.families.find(
          family => family.id === 'table-of-contents'
        ).variants[0].tree = { type: 'TEXT', textStyleApplication: 'DIRECT' }),
      fixture =>
        (fixture.doc.styles.text = fixture.doc.styles.text.filter(
          style => style.id !== 'component.table-of-contents.link'
        )),
      fixture => (fixture.tocTemplate.fontSize = 17),
      fixture =>
        (fixture.tocLinks.children[0].children[0].textStyleId =
          'style:old-main'),
      fixture =>
        delete fixture.tocLinks.children[0].children[0].boundVariables.fontSize,
      fixture =>
        (fixture.tocLinks.children[0].children[0].boundVariables.fontSize = []),
      fixture =>
        fixture.tocLinks.children[0].children[0].boundVariables.fontSize.push({
          type: 'VARIABLE_ALIAS',
          id: 'font-size/300',
        }),
      fixture =>
        (fixture.tocLinks.children[0].children[0].textDecorationOffset = {
          unit: 'PERCENT',
          value: 20,
        }),
    ]) {
      const fixture = environment();
      mutation(fixture);
      const writes = fixture.state.writes,
        ids = [...fixture.state.nodes.keys()];
      const rejected = await fixture.call(
        'prepareMangroveOverrideProbes',
        fixture.doc,
        'undrr',
        'toc'
      );
      assert(
        rejected.errors.length,
        'Reject invalid DIRECT source/template/main before canvas.'
      );
      assert.strictEqual(fixture.state.writes, writes);
      assert.deepStrictEqual([...fixture.state.nodes.keys()], ids);
    }
    const missing = environment({ missingTocTemplate: true }),
      writes = missing.state.writes;
    const rejected = await missing.call(
      'prepareMangroveOverrideProbes',
      missing.doc,
      'undrr',
      'toc'
    );
    assert(rejected.errors.length);
    assert.strictEqual(missing.state.writes, writes);
    const nativePercent = Math.fround(110 / 100) * 100;
    const rounded = environment();
    for (const component of rounded.toc.children)
      component.findAll(
        node => node.name === 'On this page heading'
      )[0].lineHeight = {
        unit: 'PERCENT',
        value: nativePercent,
      };
    const nativePrepared = await rounded.call(
      'prepareMangroveOverrideProbes',
      rounded.doc,
      'undrr',
      'toc'
    );
    assert.deepStrictEqual(copy(nativePrepared.errors), []);
    assert(
      nativePrepared.ledger.probes.every(probe => probe.tocGeometry.passed)
    );
    const nativeCompared = await rounded.call(
      'compareMangroveOverrideProbes',
      nativePrepared.rootId,
      rounded.rebuild
    );
    assert(
      nativeCompared.passed,
      JSON.stringify(nativeCompared.assertions.filter(item => !item.passed))
    );
    const title = rounded.state.nodes.get(
      nativePrepared.ledger.probes
        .find(probe => probe.familyId === 'table-of-contents')
        .baseline.nodes.find(
          node => node.diagnostics.name === 'On this page heading'
        ).id
    );
    // Both source representations may pass source equality, but a changed
    // native baseline still fails the ordinary-repeat preservation check.
    title.lineHeight.value = 110;
    const changedRepeat = await rounded.call(
      'compareMangroveOverrideProbes',
      nativePrepared.rootId,
      rounded.rebuild
    );
    assert(
      changedRepeat.assertions.some(
        item =>
          !item.passed &&
          item.name.includes(title.id) &&
          item.name.endsWith(': lineHeight')
      )
    );
    for (const invalid of [
      { unit: 'PIXELS', value: 110 },
      { unit: 'PERCENT', value: 110.0001 },
    ]) {
      const fixture = environment();
      fixture.toc.children[0].findAll(
        node => node.name === 'On this page heading'
      )[0].lineHeight = copy(invalid);
      const preparedInvalid = await fixture.call(
        'prepareMangroveOverrideProbes',
        fixture.doc,
        'undrr',
        'toc'
      );
      const comparedInvalid = await fixture.call(
        'compareMangroveOverrideProbes',
        preparedInvalid.rootId,
        fixture.rebuild
      );
      assert(
        comparedInvalid.assertions.some(
          item =>
            !item.passed &&
            item.name.endsWith('initial: title: source line height')
        )
      );
    }
    console.log(
      'ok  TOC DIRECT templates/aliases and 110% exact ratio representation; edited associations persist, invalid scopes/units/drift reject and repeat native changes still fail'
    );
  }
  {
    const env = environment();
    const prepared = await env.call(
      'prepareMangroveOverrideProbes',
      env.doc,
      'undrr',
      'toc'
    );
    assert.deepStrictEqual(copy(prepared.errors), []);
    const record = prepared.ledger.canonicalPaints.find(
      paint => paint.expectedRole === 'color/interactive'
    );
    const text = env.state.nodes.get(record.nodeId),
      original = copy(text.fills);
    // Reproduce nominal Default fill with an effective Hover alias on all text.
    text.rangeFills = copy(original);
    text.rangeFills[0].boundVariables.color.id = 'color/interactive-active';
    const failed = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert(!failed.passed);
    assert.deepStrictEqual(copy(text.fills), original);
    assert(
      failed.assertions.some(
        check =>
          !check.passed &&
          check.name.endsWith(': rebuilt source color/interactive')
      )
    );
    const consumer = env.state.nodes.get(
      prepared.ledger.probes[0].targets[0].nodeId
    );
    consumer.rangeFills = copy(consumer.fills);
    consumer.rangeFills[0].boundVariables.color.id = 'color/interactive-active';
    const consumerFailed = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert(
      consumerFailed.assertions.some(
        check =>
          !check.passed &&
          check.name.includes(consumer.id) &&
          check.name.endsWith(': resolvedFills')
      )
    );
    delete text.rangeFills;
    text.textStyleId = 'style:wrong';
    const wrongStyle = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      env.rebuild
    );
    assert(
      wrongStyle.assertions.some(
        check =>
          !check.passed && check.name === `canonical/${text.id}: textStyleId`
      )
    );
    const alreadyWrong = environment();
    const defaultText = alreadyWrong.tocLinks.children[0].children[0];
    defaultText.rangeFills = copy(defaultText.fills);
    defaultText.rangeFills[0].boundVariables.color.id =
      'color/interactive-active';
    const wrongBaseline = await alreadyWrong.call(
      'prepareMangroveOverrideProbes',
      alreadyWrong.doc,
      'undrr',
      'toc'
    );
    assert.deepStrictEqual(copy(wrongBaseline.errors), []);
    const baselineFailure = await alreadyWrong.call(
      'compareMangroveOverrideProbes',
      wrongBaseline.rootId,
      alreadyWrong.rebuild
    );
    assert(
      baselineFailure.assertions.some(
        check =>
          !check.passed &&
          check.name.includes('initial source color/interactive')
      )
    );
    console.log(
      'ok  effective full-range aliases catch nominally-correct paint drift, already-wrong source baselines, consumer range loss and canonical style-ID changes'
    );
  }
  {
    const env = environment();
    const prepared = await env.call(
      'prepareMangroveOverrideProbes',
      env.doc,
      'undrr',
      'toc'
    );
    assert.deepStrictEqual(copy(prepared.errors), []);
    const probe = prepared.ledger.probes.find(
        item => item.familyId === 'table-of-contents'
      ),
      instance = env.state.nodes.get(probe.nodeId);
    const moved = instance.findAll(node => node.name === 'Link 1')[0];
    env.page.appendChild(moved);
    const cleanup = await env.call(
      'removeMangroveOverrideProbes',
      prepared.rootId
    );
    assert.deepStrictEqual(copy(cleanup.errors), []);
    assert(
      cleanup.retained.some(
        item =>
          item.id === instance.id && item.reason.includes('changed or moved')
      )
    );
    assert(env.state.nodes.has(moved.id));
    assert(env.state.nodes.has(instance.id));
    assert(env.state.nodes.has(prepared.rootId));
    const malformed = environment(),
      text = malformed.tocLinks.children[0].children[0];
    text.rangeFills = Symbol('mixed');
    const nodeIds = [...malformed.state.nodes.keys()],
      writes = malformed.state.writes;
    const rejected = await malformed.call(
      'prepareMangroveOverrideProbes',
      malformed.doc,
      'undrr',
      'toc'
    );
    assert(rejected.errors.some(error => error.includes('range fills')));
    assert.deepStrictEqual([...malformed.state.nodes.keys()], nodeIds);
    assert.strictEqual(malformed.state.writes, writes);
    console.log(
      'ok  TOC exact cleanup retains moved recorded descendants and mixed-range preflight rejects without canvas writes'
    );
  }
  {
    const env = environment(),
      prepared = await env.call(
        'prepareMangroveOverrideProbes',
        env.doc,
        'undrr',
        'toc'
      );
    assert.deepStrictEqual(copy(prepared.errors), []);
    const root = env.state.nodes.get(prepared.rootId),
      manifest = JSON.parse(
        root.getSharedPluginData('orgundrrmangrove', 'mgAcceptanceLedger')
      );
    assert.strictEqual(manifest.kind, 'mangrove-acceptance-ledger-parts');
    assert.strictEqual(manifest.partCount, 2);
    const original = root.getSharedPluginData(
      'orgundrrmangrove',
      'mgAcceptanceLedgerPart0'
    );
    for (const corrupt of [
      '',
      original.slice(1),
      original.replace('"version":1', '"version":2'),
    ]) {
      root.setSharedPluginData(
        'orgundrrmangrove',
        'mgAcceptanceLedgerPart0',
        corrupt
      );
      const writes = env.state.writes,
        loads = env.state.loads,
        ids = [...env.state.nodes.keys()];
      const cleanup = await env.call('removeMangroveOverrideProbes', root.id);
      assert(cleanup.errors.some(error => error.includes('ledger parts')));
      assert.strictEqual(env.state.writes, writes);
      assert.strictEqual(env.state.loads, loads);
      assert.deepStrictEqual([...env.state.nodes.keys()], ids);
    }
    root.setSharedPluginData(
      'orgundrrmangrove',
      'mgAcceptanceLedgerPart0',
      original
    );
    const foreign = { ...manifest, rootId: 'foreign:root' };
    root.setSharedPluginData(
      'orgundrrmangrove',
      'mgAcceptanceLedger',
      JSON.stringify(foreign)
    );
    const rejected = await env.call('removeMangroveOverrideProbes', root.id);
    assert(rejected.errors.some(error => error.includes('manifest')));
    root.setSharedPluginData(
      'orgundrrmangrove',
      'mgAcceptanceLedger',
      JSON.stringify(manifest)
    );
    const comparison = await env.call(
      'compareMangroveOverrideProbes',
      root.id,
      env.rebuild
    );
    assert(comparison.passed);
    console.log(
      'ok  bounded multipart restart recovery rejects absent/truncated/same-length changed parts and foreign root manifests without writes'
    );
  }
  {
    const env = environment();
    const original = [...env.state.nodes.keys()];
    // The explicit group does not need the legacy recipes or a legacy rebuild.
    const doc = copy(env.doc);
    doc.components.families = doc.components.families.filter(family =>
      ['details', 'select'].includes(family.id)
    );
    const prepared = await env.call(
      'prepareMangroveOverrideProbes',
      doc,
      'undrr',
      'details-select'
    );
    assert.deepStrictEqual(copy(prepared.errors), []);
    assert(prepared.ledger.complete);
    assert.strictEqual(prepared.ledger.groupId, 'details-select');
    assert.deepStrictEqual(copy(prepared.ledger.requestedFamilyIds), [
      'details',
      'select',
    ]);
    assert.strictEqual(prepared.ledger.probes.length, 2);
    const [detail, select] = prepared.ledger.probes;
    assert.deepStrictEqual(
      copy(detail.baseline.nodes[0].componentProperties.Open),
      {
        type: 'VARIANT',
        value: 'True',
      }
    );
    for (const probe of prepared.ledger.probes) {
      const instance = env.state.nodes.get(probe.nodeId);
      assert.strictEqual(instance.width, 240);
      assert.deepStrictEqual(copy(probe.consumerSizing), {
        width: 240,
        horizontal: 'FIXED',
        vertical: 'HUG',
      });
      for (const target of probe.targets) {
        assert.strictEqual(
          env.state.nodes.get(target.nodeId)[target.field],
          target.value,
          target.name
        );
      }
    }
    assert(detail.targets.every(target => target.value.length > 90));
    assert.strictEqual(
      select.targets.find(target => target.name === 'Value').value,
      'Depth'
    );
    assert.strictEqual(select.transitions.length, 8);
    assert(select.transitions.every(item => item.expected === item.actual));
    const persisted = env.state.nodes
      .get(prepared.rootId)
      .getSharedPluginData('orgundrrmangrove', 'mgAcceptanceLedger');
    assert(persisted.length <= 90000);
    const rebuild = {
      ...env.rebuild,
      families: env.rebuild.families.filter(item =>
        ['details', 'select'].includes(item.id)
      ),
      audit: env.rebuild.audit.filter(item =>
        ['details', 'select'].includes(item.family)
      ),
    };
    // Model changed source defaults, not Figma layout or native propagation.
    env.details.definitions['Title#details-title'].defaultValue =
      'New source title';
    env.select.definitions['Value#select-value'].defaultValue =
      'New source value';
    const beforeWrites = env.state.writes;
    const beforeLoads = env.state.loads;
    const comparison = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      rebuild
    );
    assert.strictEqual(
      comparison.passed,
      true,
      JSON.stringify(comparison.errors)
    );
    assert.strictEqual(env.state.writes, beforeWrites);
    assert.strictEqual(env.state.loads, beforeLoads);
    assert.strictEqual(
      comparison.assertions.filter(item =>
        item.name.endsWith(': consumer width')
      ).length,
      2
    );
    assert.deepStrictEqual(copy(comparison.requestedFamilyIds), [
      'details',
      'select',
    ]);
    const instance = env.state.nodes.get(detail.nodeId);
    instance.width = 320;
    const lostWidth = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      rebuild
    );
    assert.strictEqual(lostWidth.passed, false);
    assert(
      lostWidth.assertions.some(
        item => !item.passed && item.name.endsWith(': consumer width')
      )
    );
    instance.width = 240;
    instance.height += 37;
    const diagnosticOnly = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      rebuild
    );
    assert.strictEqual(
      diagnosticOnly.passed,
      true,
      'Height diagnostics are not source-geometry assertions'
    );
    const missingFamily = await env.call(
      'compareMangroveOverrideProbes',
      prepared.rootId,
      {
        ...rebuild,
        audit: rebuild.audit.filter(item => item.family !== 'select'),
      }
    );
    assert.strictEqual(missingFamily.passed, false);
    assert(missingFamily.errors.some(error => error.includes('cover select')));
    const cleanup = await env.call(
      'removeMangroveOverrideProbes',
      prepared.rootId
    );
    assert.deepStrictEqual(copy(cleanup.errors), []);
    assert.deepStrictEqual(copy(cleanup.retained), []);
    assert.deepStrictEqual([...env.state.nodes.keys()], original);
    assert.deepStrictEqual(
      new Set(cleanup.removedNodeIds),
      new Set(prepared.createdNodeIds)
    );
    console.log(
      'ok  explicit Details/Select scope preserves long text, short value, BOOLEAN edits, axes and 240px consumer sizing; geometry remains diagnostic and cleanup exact'
    );
  }
  {
    for (const groupId of ['unknown', null, 1, {}, '__proto__']) {
      const env = environment();
      const before = [...env.state.nodes.keys()];
      const writes = env.state.writes;
      const result = await env.call(
        'prepareMangroveOverrideProbes',
        env.doc,
        'undrr',
        groupId
      );
      assert(
        result.errors.some(error => error.includes('Unknown acceptance group'))
      );
      assert.strictEqual(env.state.writes, writes);
      assert.strictEqual(env.state.loads, 0);
      assert.deepStrictEqual([...env.state.nodes.keys()], before);
    }
    const legacy = environment();
    const prepared = await prepare(legacy);
    assert.strictEqual(prepared.ledger.groupId, 'legacy');
    const oldLedger = copy(prepared.ledger);
    delete oldLedger.groupId;
    legacy.state.nodes
      .get(prepared.rootId)
      .setSharedPluginData(
        'orgundrrmangrove',
        'mgAcceptanceLedger',
        JSON.stringify(oldLedger)
      );
    const oldComparison = await legacy.call(
      'compareMangroveOverrideProbes',
      prepared.ledger,
      legacy.rebuild
    );
    assert.strictEqual(oldComparison.passed, true);
    const oldCleanup = await legacy.call(
      'removeMangroveOverrideProbes',
      prepared.rootId
    );
    assert.deepStrictEqual(copy(oldCleanup.errors), []);
    const scoped = environment();
    const scopedRun = await scoped.call(
      'prepareMangroveOverrideProbes',
      scoped.doc,
      'undrr',
      'details-select'
    );
    const root = scoped.state.nodes.get(scopedRun.rootId);
    for (const mutation of ['unknown-group', 'wrong-families', 'wrong-probe']) {
      const ledger = copy(scopedRun.ledger);
      if (mutation === 'unknown-group') ledger.groupId = 'other';
      if (mutation === 'wrong-families')
        ledger.requestedFamilyIds = ['details'];
      if (mutation === 'wrong-probe') ledger.probes[0].familyId = 'radio';
      root.setSharedPluginData(
        'orgundrrmangrove',
        'mgAcceptanceLedger',
        JSON.stringify(ledger)
      );
      const ids = [...scoped.state.nodes.keys()];
      const writes = scoped.state.writes;
      const rejected = await scoped.call(
        'removeMangroveOverrideProbes',
        root.id
      );
      assert(rejected.errors.length, mutation);
      assert.strictEqual(scoped.state.writes, writes, mutation);
      assert.deepStrictEqual([...scoped.state.nodes.keys()], ids, mutation);
    }
    root.setSharedPluginData(
      'orgundrrmangrove',
      'mgAcceptanceLedger',
      JSON.stringify(scopedRun.ledger)
    );
    const user = new scoped.Node('FRAME', 'Unrecorded Select child');
    scoped.state.nodes.get(scopedRun.ledger.probes[1].nodeId).appendChild(user);
    const retained = await scoped.call('removeMangroveOverrideProbes', root.id);
    assert.deepStrictEqual(copy(retained.errors), []);
    assert(scoped.state.nodes.has(user.id));
    assert(
      retained.retained.some(
        item => item.id === scopedRun.ledger.probes[1].nodeId
      )
    );
    console.log(
      'ok  unknown groups reject before writes/font loads, group-less legacy ledgers remain compatible, scope tampering and foreign descendants cannot authorise cleanup'
    );
  }
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
