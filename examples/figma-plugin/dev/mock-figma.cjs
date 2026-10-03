#!/usr/bin/env node
/**
 * EXPLORATORY: runs examples/figma-plugin/code.js against a small mock of
 * the Figma variables and styles APIs, so changes can be checked without Figma.
 *
 *   yarn build:figma-tokens
 *   node examples/figma-plugin/dev/mock-figma.cjs
 *
 * The mock copies the Figma behaviours that have bitten this plugin: a
 * per-collection mode limit, removeVariableCodeSyntax throwing when no
 * syntax is set, scope validation, alias type checks and font loading.
 * It also checks text and effect binding types. It is not a full
 * Figma API, so a pass here is not proof that real Figma accepts a change.
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DIR = path.resolve(__dirname, '..');
const SCOPES = new Set([
  'ALL_SCOPES',
  'TEXT_CONTENT',
  'CORNER_RADIUS',
  'WIDTH_HEIGHT',
  'GAP',
  'ALL_FILLS',
  'FRAME_FILL',
  'SHAPE_FILL',
  'TEXT_FILL',
  'STROKE_COLOR',
  'STROKE_FLOAT',
  'EFFECT_FLOAT',
  'EFFECT_COLOR',
  'OPACITY',
  'FONT_FAMILY',
  'FONT_STYLE',
  'FONT_WEIGHT',
  'FONT_SIZE',
  'LINE_HEIGHT',
  'LETTER_SPACING',
  'PARAGRAPH_SPACING',
  'PARAGRAPH_INDENT',
]);

function createFigma(state) {
  let seq = 0;
  const next = prefix => `${prefix}${(seq += 1)}`;

  class Collection {
    constructor(name) {
      this.id = next('c');
      this.name = name;
      this.modes = [{ modeId: next('m'), name: 'Mode 1' }];
    }

    renameMode(modeId, name) {
      this.modes.find(m => m.modeId === modeId).name = name;
    }

    addMode(name) {
      if (this.modes.length >= state.modeLimit) {
        throw new Error(`in addMode: Limited to ${state.modeLimit} modes only`);
      }
      const modeId = next('m');
      this.modes.push({ modeId, name });
      return modeId;
    }
  }

  class Variable {
    constructor(name, collection, type) {
      if (/[.{}]/.test(name)) throw new Error(`invalid name ${name}`);
      this.id = next('v');
      this.name = name;
      this.variableCollectionId = collection.id;
      this.resolvedType = type;
      this.removed = false;
      this.description = '';
      this.hiddenFromPublishing = false;
      this.valuesByMode = {};
      this.pluginData = {};
      this.sharedData = {};
      this.syntax = {};
      this.scopeList = ['ALL_SCOPES'];
    }

    get codeSyntax() {
      return { ...this.syntax };
    }

    get scopes() {
      return this.scopeList;
    }

    set scopes(list) {
      if (list.includes('ALL_SCOPES') && list.length > 1) {
        throw new Error('ALL_SCOPES must be used alone');
      }
      list.forEach(scope => {
        if (!SCOPES.has(scope)) throw new Error(`unknown scope ${scope}`);
      });
      this.scopeList = list;
    }

    setPluginData(key, value) {
      this.pluginData[key] = value;
    }

    getPluginData(key) {
      if (state.sharedOnly) throw new Error('Private plugin data unavailable');
      return this.pluginData[key] || '';
    }

    getSharedPluginData(namespace, key) {
      return (this.sharedData[namespace] || {})[key] || '';
    }

    setSharedPluginData(namespace, key, value) {
      if (!/^[a-zA-Z0-9]{3,}$/.test(namespace))
        throw new Error('Invalid shared namespace');
      this.sharedData[namespace] = this.sharedData[namespace] || {};
      this.sharedData[namespace][key] = value;
    }

    setVariableCodeSyntax(platform, value) {
      this.syntax[platform] = value;
    }

    removeVariableCodeSyntax(platform) {
      if (!(platform in this.syntax)) {
        throw new Error(
          'in removeVariableCodeSyntax: Code syntax field not found'
        );
      }
      delete this.syntax[platform];
    }

    setValueForMode(modeId, value) {
      if (value && value.type === 'VARIABLE_ALIAS') {
        const target = state.variables.find(v => v.id === value.id);
        if (!target || target.resolvedType !== this.resolvedType) {
          throw new Error(`alias type mismatch on ${this.name}`);
        }
      } else if (this.resolvedType === 'COLOR') {
        const ok = ['r', 'g', 'b', 'a'].every(
          k => typeof value[k] === 'number' && value[k] >= 0 && value[k] <= 1
        );
        if (!ok) throw new Error(`invalid colour on ${this.name}`);
      } else if (this.resolvedType === 'FLOAT' && typeof value !== 'number') {
        throw new Error(`invalid number on ${this.name}`);
      } else if (this.resolvedType === 'STRING' && typeof value !== 'string') {
        throw new Error(`invalid string on ${this.name}`);
      }
      this.valuesByMode[modeId] = value;
    }

    remove() {
      this.removed = true;
      state.variables.splice(state.variables.indexOf(this), 1);
    }
  }

  class Style {
    constructor(type) {
      this.id = next('s');
      this.type = type;
      this.name = '';
      this.description = '';
      this.pluginData = {};
      this.sharedData = {};
      this.boundVariables = {};
      this.currentFont = { family: 'Inter', style: 'Regular' };
    }

    getPluginData(key) {
      if (state.sharedOnly) throw new Error('Private plugin data unavailable');
      return this.pluginData[key] || '';
    }

    setPluginData(key, value) {
      this.pluginData[key] = value;
    }

    getSharedPluginData(namespace, key) {
      return (this.sharedData[namespace] || {})[key] || '';
    }

    setSharedPluginData(namespace, key, value) {
      if (!/^[a-zA-Z0-9]{3,}$/.test(namespace))
        throw new Error('Invalid shared namespace');
      this.sharedData[namespace] = this.sharedData[namespace] || {};
      this.sharedData[namespace][key] = value;
    }

    get fontName() {
      return this.currentFont;
    }

    set fontName(font) {
      this.requireFont(font);
      this.currentFont = font;
    }

    requireFont(font) {
      if (!state.loadedFonts.has(`${font.family} ${font.style}`)) {
        throw new Error(`Font not loaded: ${font.family} ${font.style}`);
      }
    }

    set fontSize(value) {
      this.requireFont(this.fontName);
      if (state.failStyleWrites?.has(this.id) || state.failNewStyleWrites)
        throw 'Injected style write failure';
      assert(Number.isFinite(value) && value > 0, 'Invalid style font size');
      this.size = value;
    }

    get fontSize() {
      return this.size;
    }

    setBoundVariable(field, variable) {
      const type = { fontFamily: 'STRING', fontSize: 'FLOAT' }[field];
      assert(type && variable.resolvedType === type, 'Invalid text binding');
      this.requireFont(this.fontName);
      this.boundVariables[field] = { type: 'VARIABLE_ALIAS', id: variable.id };
    }

    set effects(values) {
      values.forEach(effect => {
        assert(['INNER_SHADOW', 'DROP_SHADOW'].includes(effect.type));
        assert(Number.isFinite(effect.radius) && effect.radius >= 0);
        assert(Number.isFinite(effect.spread));
        assert(
          Number.isFinite(effect.offset.x) && Number.isFinite(effect.offset.y)
        );
        assert(
          ['r', 'g', 'b', 'a'].every(
            key => effect.color[key] >= 0 && effect.color[key] <= 1
          )
        );
        assert.strictEqual(effect.blendMode, 'NORMAL');
      });
      this.effectList = JSON.parse(JSON.stringify(values));
    }

    get effects() {
      return this.effectList;
    }

    remove() {
      if (state.rejectStyleRemoval) throw 'Injected style cleanup failure';
      state.styles.splice(state.styles.indexOf(this), 1);
    }
  }

  function createStyle(type) {
    const style = new Style(type);
    state.styles.push(style);
    return style;
  }

  return {
    showUI() {},
    notify() {},
    closePlugin() {},
    listAvailableFontsAsync: async () => state.fonts,
    async loadFontAsync(font) {
      const key = `${font.family} ${font.style}`;
      if (state.rejectedFonts.has(key)) {
        // Real Figma can reject with a string, not an Error instance.
        return Promise.reject(`Unavailable font ${key}`);
      }
      if (
        !state.fonts.some(
          entry =>
            entry.fontName.family === font.family &&
            entry.fontName.style === font.style
        )
      ) {
        throw new Error(`Unavailable font ${key}`);
      }
      state.loadedFonts.add(key);
    },
    getLocalTextStylesAsync: async () =>
      state.styles.filter(style => style.type === 'TEXT'),
    getLocalEffectStylesAsync: async () =>
      state.styles.filter(style => style.type === 'EFFECT'),
    createTextStyle: () => createStyle('TEXT'),
    createEffectStyle: () => createStyle('EFFECT'),
    ui: {
      postMessage(message) {
        state.lastMessage = message;
      },
      set onmessage(handler) {
        state.handler = handler;
      },
    },
    variables: {
      getLocalVariableCollectionsAsync: async () => state.collections,
      getLocalVariablesAsync: async () => state.variables.slice(),
      createVariableCollection(name) {
        const collection = new Collection(name);
        state.collections.push(collection);
        return collection;
      },
      createVariable(name, collection, type) {
        const variable = new Variable(name, collection, type);
        state.variables.push(variable);
        return variable;
      },
      createVariableAlias(variable) {
        return { type: 'VARIABLE_ALIAS', id: variable.id };
      },
      setBoundVariableForEffect(effect, field, variable) {
        const fields = ['color', 'radius', 'spread', 'offsetX', 'offsetY'];
        assert(fields.includes(field), `Invalid effect field ${field}`);
        assert.strictEqual(
          variable.resolvedType,
          field === 'color' ? 'COLOR' : 'FLOAT'
        );
        const result = JSON.parse(JSON.stringify(effect));
        result.boundVariables = Object.assign({}, result.boundVariables, {
          [field]: { type: 'VARIABLE_ALIAS', id: variable.id },
        });
        return result;
      },
    },
  };
}

function loadPlugin(modeLimit, { sharedOnly = false } = {}) {
  const state = {
    sharedOnly,
    modeLimit,
    collections: [],
    variables: [],
    styles: [],
    fonts: ['Inter', 'Roboto', 'Roboto Condensed'].map(family => ({
      fontName: { family, style: 'Regular' },
    })),
    loadedFonts: new Set(),
    rejectedFonts: new Set(),
  };
  vm.runInNewContext(
    ['kit-identity.js', 'code.js']
      .map(file => fs.readFileSync(path.join(DIR, file), 'utf8'))
      .join('\n'),
    {
      figma: createFigma(state),
      __html__: '',
      MG_SHARED_ONLY: sharedOnly,
      console,
    }
  );
  const run = async (doc, modes, prune = false, options = {}) => {
    await state.handler({ type: 'import', doc, modes, prune, ...options });
    if (state.lastMessage.type === 'error') {
      throw new Error(state.lastMessage.message);
    }
    return state.lastMessage.result;
  };
  return { state, run };
}

async function main() {
  const jsonPath = path.join(DIR, 'mangrove-variables.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(
      'mangrove-variables.json missing: run yarn build:figma-tokens'
    );
  }
  const doc = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const all = doc.modes.map(m => m.id);
  const total = doc.variables.length;
  const recommended = doc.styles.text.filter(spec => spec.recommended);
  assert.strictEqual(recommended.length, 12);
  const styleTotal = recommended.length + doc.styles.effect.length;
  // The exporter supplies every binding and source alpha; the plugin must
  // not invent colours or dimensions when it imports the style definitions.
  const names = new Set(doc.variables.map(variable => variable.name));
  for (const spec of doc.styles.text) {
    Object.values(spec.bindings).forEach(name => assert(names.has(name)));
    Object.values(spec.values).forEach(value => assert(value.fontSize > 0));
  }
  for (const spec of doc.styles.effect) {
    Object.values(spec.values)
      .flat()
      .forEach(entry =>
        Object.values(entry.bindings).forEach(name => assert(names.has(name)))
      );
  }

  // Professional: every brand as a mode, idempotent re-import.
  {
    const { state, run } = loadPlugin(10);
    let r = await run(doc, all);
    assert.strictEqual(r.errors.length, 0, r.errors.join('\n'));
    assert.strictEqual(r.counts.created, total);
    assert.strictEqual(r.createdVariableIds.length, total);
    assert.strictEqual(r.updatedVariableIds.length, 0);
    assert.strictEqual(r.collectionId, state.collections[0].id);
    assert.strictEqual(r.counts.values, total * all.length);
    assert.strictEqual(r.styles.counts.text.created, recommended.length);
    assert.strictEqual(r.styles.createdStyleIds.length, styleTotal);
    assert.strictEqual(r.styles.touchedStyleIds.length, styleTotal);
    for (const spec of recommended) {
      const style = state.styles.find(entry => entry.name === spec.name);
      for (const [field, name] of Object.entries(spec.bindings)) {
        const variable = state.variables.find(entry => entry.name === name);
        assert.strictEqual(style.boundVariables[field].id, variable.id);
      }
    }
    assert.strictEqual(
      r.styles.counts.effect.created,
      doc.styles.effect.length
    );
    const ids = state.styles.map(style => style.id).join(',');
    const raised = state.styles.find(
      style => style.name === 'Mangrove/shadow/raised'
    );
    assert.strictEqual(raised.effects[0].type, 'INNER_SHADOW');
    assert.strictEqual(raised.effects[0].color.a, 0.24);
    assert(raised.effects[0].boundVariables.color);
    const focus = state.styles.find(
      style => style.name === 'Mangrove/focus-ring'
    );
    assert.strictEqual(focus.effects.length, 2);
    assert.strictEqual(focus.effects[0].spread, 4);
    assert.strictEqual(focus.effects[1].spread, 2);
    assert.strictEqual(
      focus.effects[0].boundVariables.color.id,
      state.variables.find(variable => variable.name === 'color/focus-ring').id
    );
    assert.strictEqual(
      focus.effects[1].boundVariables.color.id,
      state.variables.find(variable => variable.name === 'color/neutral-0').id
    );
    assert(
      focus.effects.every(
        effect => effect.boundVariables.color && effect.boundVariables.spread
      )
    );
    r = await run(doc, all);
    assert.strictEqual(r.errors.length, 0, r.errors.join('\n'));
    assert.strictEqual(r.counts.created, 0);
    assert.strictEqual(r.createdVariableIds.length, 0);
    assert.strictEqual(r.updatedVariableIds.length, total);
    assert.strictEqual(r.styles.createdStyleIds.length, 0);
    assert.strictEqual(r.styles.updatedStyleIds.length, styleTotal);
    assert.strictEqual(state.variables.length, total);
    assert.strictEqual(state.styles.length, styleTotal);
    assert.strictEqual(state.styles.map(style => style.id).join(','), ids);
    assert.strictEqual(r.styles.counts.text.updated, recommended.length);
    assert.strictEqual(
      r.styles.counts.effect.updated,
      doc.styles.effect.length
    );
    console.log(
      `ok  all brands as modes, ${total} variables, re-import idempotent`
    );
  }

  // Starter or Drafts: 1 mode, all brands ticked, then the file is moved.
  {
    const { state, run } = loadPlugin(1);
    let r = await run(doc, all);
    assert.strictEqual(r.errors.length, all.length - 1);
    assert(r.errors.every(e => e.startsWith('Could not add mode')));
    assert.strictEqual(r.modes.length, 1);
    assert.strictEqual(r.requestedModes.length, all.length);
    state.modeLimit = 10;
    r = await run(doc, all);
    assert.strictEqual(r.errors.length, 0, r.errors.join('\n'));
    assert.strictEqual(state.collections[0].modes.length, all.length);
    console.log(
      'ok  1-mode limit reports cleanly, later import adds the modes'
    );
  }

  // Brand switcher on a 1-mode file.
  {
    const { state, run } = loadPlugin(1);
    const valueOf = name => {
      const variable = state.variables.find(v => v.name === name);
      return variable.valuesByMode[state.collections[0].modes[0].modeId];
    };
    const seen = new Set();
    for (const brand of all) {
      const r = await run(doc, [brand]);
      assert.strictEqual(r.errors.length, 0, r.errors.join('\n'));
      assert.strictEqual(state.variables.length, total);
      assert.strictEqual(state.styles.length, styleTotal);
      const mode = doc.modes.find(m => m.id === brand);
      assert.strictEqual(state.collections[0].modes[0].name, mode.name);
      seen.add(JSON.stringify(valueOf('control/option-selected')));
    }
    assert(seen.size > 1, 'switching brands should change brand colours');
    console.log(
      `ok  brand switcher re-themes one mode across ${all.length} brands`
    );
  }

  // Missing fonts skip their text styles, keep variables/effects, recover.
  const condensedCount = recommended.filter(spec =>
    Object.values(spec.values).some(
      value => value.fontName.family === 'Roboto Condensed'
    )
  ).length;
  const availableTextCount = recommended.length - condensedCount;
  for (const unavailable of ['not-listed', 'load-rejected']) {
    const { state, run } = loadPlugin(1);
    const savedFonts = state.fonts;
    if (unavailable === 'not-listed')
      state.fonts = state.fonts.filter(
        entry => entry.fontName.family !== 'Roboto Condensed'
      );
    else state.rejectedFonts.add('Roboto Condensed Regular');
    let r = await run(doc, [all[0]]);
    assert.strictEqual(
      r.styles.missingFonts.join(','),
      'Roboto Condensed Regular'
    );
    assert.strictEqual(r.styles.counts.text.failed, condensedCount);
    assert.strictEqual(r.styles.counts.text.created, availableTextCount);
    if (unavailable === 'load-rejected') {
      assert(
        r.errors.every(error =>
          error.includes('Unavailable font Roboto Condensed Regular')
        )
      );
    }
    assert.strictEqual(
      r.styles.counts.effect.created,
      doc.styles.effect.length
    );
    assert.strictEqual(state.variables.length, total);
    assert.strictEqual(
      state.styles.length,
      availableTextCount + doc.styles.effect.length,
      'No partial styles after missing font'
    );
    state.fonts = savedFonts;
    state.rejectedFonts.clear();
    r = await run(doc, [all[0]]);
    assert.strictEqual(r.errors.length, 0, r.errors.join('\n'));
    assert.strictEqual(r.styles.counts.text.created, condensedCount);
    assert.strictEqual(r.styles.counts.text.updated, availableTextCount);
    assert.strictEqual(state.styles.length, styleTotal);
    console.log(
      `ok  missing font (${unavailable}) reports and recovers without partial styles`
    );
  }

  // Invalid source definitions fail before collections, modes or assets change.
  {
    const invalid = [];
    function candidate(label, change) {
      const copy = JSON.parse(JSON.stringify(doc));
      change(copy);
      invalid.push([label, copy]);
    }
    candidate('duplicate variable ID', copy =>
      copy.variables.push({ ...copy.variables[0], name: 'duplicate/id' })
    );
    candidate('duplicate variable name', copy =>
      copy.variables.push({ ...copy.variables[0], id: 'duplicate.id' })
    );
    candidate('duplicate mode ID', copy =>
      copy.modes.push({ ...copy.modes[0], name: 'Duplicate brand' })
    );
    candidate('duplicate mode name', copy =>
      copy.modes.push({ ...copy.modes[0], id: 'duplicate-brand' })
    );
    candidate('duplicate style name', copy =>
      copy.styles.text.push({ ...copy.styles.text[0], id: 'duplicate.style' })
    );
    candidate('missing alias', copy => {
      copy.variables[0].values[all[0]] = { alias: 'missing/target' };
    });
    candidate('alias type mismatch', copy => {
      copy.variables[0].values[all[0]] = {
        alias: copy.variables.find(variable => variable.type === 'FLOAT').name,
      };
    });
    candidate('alias cycle', copy => {
      copy.variables[0].values[all[0]] = { alias: copy.variables[1].name };
      copy.variables[1].values[all[0]] = { alias: copy.variables[0].name };
    });
    for (const [label, copy] of invalid) {
      const { state, run } = loadPlugin(1);
      await assert.rejects(() => run(copy, [all[0]]), /Import preflight/);
      assert.strictEqual(state.collections.length, 0, label);
      assert.strictEqual(state.variables.length, 0, label);
      assert.strictEqual(state.styles.length, 0, label);
    }
    console.log(
      'ok  malformed import definitions reject before any document mutation'
    );
  }

  // Existing asset ambiguity, ownership and changed type preserve the entire kit.
  for (const collision of [
    'collection',
    'variable-name',
    'variable-id',
    'foreign-variable',
    'variable-type',
    'style-name',
    'foreign-style',
    'style-type',
  ]) {
    const { state, run } = loadPlugin(1);
    await run(doc, [all[0]]);
    const variable = state.variables[0];
    const style = state.styles[0];
    if (collision === 'collection')
      state.collections.push({
        ...state.collections[0],
        id: 'duplicate-collection',
      });
    if (collision === 'variable-name' || collision === 'variable-id')
      state.variables.push(
        Object.assign(
          Object.create(Object.getPrototypeOf(variable)),
          variable,
          {
            id: 'duplicate-variable',
            name:
              collision === 'variable-name'
                ? variable.name
                : 'duplicate/variable',
            pluginData: { ...variable.pluginData },
          }
        )
      );
    if (collision === 'foreign-variable')
      variable.setPluginData('mgId', 'foreign.owner');
    if (collision === 'variable-type') variable.resolvedType = 'FLOAT';
    if (collision === 'style-name')
      state.styles.push(
        Object.assign(Object.create(Object.getPrototypeOf(style)), style, {
          id: 'duplicate-style',
          pluginData: { ...style.pluginData },
        })
      );
    if (collision === 'foreign-style')
      style.setPluginData('mgStyleId', 'foreign.owner');
    if (collision === 'style-type') style.type = 'EFFECT';
    const before = JSON.stringify({
      collections: state.collections,
      variables: state.variables,
      styles: state.styles,
    });
    await assert.rejects(
      () => run(doc, [all[1]]),
      /Import preflight|Conflicting Mangrove identities/
    );
    const after = JSON.stringify({
      collections: state.collections,
      variables: state.variables,
      styles: state.styles,
    });
    assert.strictEqual(
      after,
      before,
      `${collision}: no mode renaming, deletion, metadata or value mutation`
    );
  }
  console.log(
    'ok  ambiguous or incompatible existing assets reject without breaking identities or changing modes'
  );

  // Desktop private identities migrate to shared metadata, and shared-only
  // runtimes never need the private plugin-data API.
  {
    const { state, run } = loadPlugin(1);
    await run(doc, [all[0]]);
    const ids = [...state.variables, ...state.styles]
      .map(asset => asset.id)
      .join(',');
    for (const variable of state.variables) {
      variable.setPluginData(
        'mgId',
        variable.getSharedPluginData('orgundrrmangrove', 'mgId')
      );
      variable.sharedData = {};
    }
    for (const style of state.styles) {
      style.setPluginData(
        'mgStyleId',
        style.getSharedPluginData('orgundrrmangrove', 'mgStyleId')
      );
      style.sharedData = {};
    }
    const result = await run(doc, [all[1]]);
    assert.strictEqual(result.counts.created, 0);
    assert.strictEqual(result.errors.length, 0);
    assert.strictEqual(
      [...state.variables, ...state.styles].map(asset => asset.id).join(','),
      ids
    );
    assert(
      state.variables.every(variable =>
        variable.getSharedPluginData('orgundrrmangrove', 'mgId')
      )
    );
    assert(
      state.styles.every(style =>
        style.getSharedPluginData('orgundrrmangrove', 'mgStyleId')
      )
    );
    const remote = loadPlugin(1, { sharedOnly: true });
    await remote.run(doc, [all[0]]);
    const remoteIds = [...remote.state.variables, ...remote.state.styles]
      .map(asset => asset.id)
      .join(',');
    const repeat = await remote.run(doc, [all[1]]);
    assert.strictEqual(repeat.errors.length, 0);
    assert.strictEqual(repeat.counts.created, 0);
    assert.strictEqual(
      [...remote.state.variables, ...remote.state.styles]
        .map(asset => asset.id)
        .join(','),
      remoteIds
    );
    console.log(
      'ok  private identities migrate in place and shared-only imports preserve IDs without private APIs'
    );
  }

  // Asset ID reports distinguish successes, partial retained writes and cleanup.
  {
    const { state, run } = loadPlugin(1);
    await run(doc, [all[0]]);
    const existing = state.styles.find(style => style.type === 'TEXT');
    state.failStyleWrites = new Set([existing.id]);
    const result = await run(doc, [all[0]]);
    assert(result.styles.touchedStyleIds.includes(existing.id));
    assert(!result.styles.updatedStyleIds.includes(existing.id));
    assert.strictEqual(result.styles.updatedStyleIds.length, styleTotal - 1);
    assert.strictEqual(result.styles.removedStyleIds.length, 0);
    assert(
      state.styles.some(style => style.id === existing.id),
      'Existing partial style preserved'
    );
    for (const cleanupFails of [false, true]) {
      const fresh = loadPlugin(1);
      fresh.state.failNewStyleWrites = true;
      fresh.state.rejectStyleRemoval = cleanupFails;
      const failed = await fresh.run(doc, [all[0]]);
      const ids = new Set(fresh.state.styles.map(style => style.id));
      assert.strictEqual(
        failed.styles.createdStyleIds.length,
        doc.styles.effect.length
      );
      assert.strictEqual(failed.styles.updatedStyleIds.length, 0);
      assert.strictEqual(
        failed.styles.removedStyleIds.length,
        cleanupFails ? 0 : recommended.length
      );
      assert.strictEqual(
        failed.styles.retainedPartialStyleIds.length,
        cleanupFails ? recommended.length : 0
      );
      assert(failed.styles.createdStyleIds.every(id => ids.has(id)));
      assert(failed.styles.touchedStyleIds.every(id => ids.has(id)));
      assert(failed.styles.removedStyleIds.every(id => !ids.has(id)));
      assert(failed.styles.retainedPartialStyleIds.every(id => ids.has(id)));
    }
    console.log(
      'ok  affected IDs include partial existing writes and distinguish removed or retained failed styles'
    );
  }

  // User-selected roles/sizes, rename by stable style id, and old JSON.
  {
    const { state, run } = loadPlugin(1);
    const spec = recommended[0];
    let r = await run(doc, [all[0]], false, {
      textStyles: [spec.id],
      effects: false,
    });
    assert.strictEqual(r.errors.length, 0, r.errors.join('\n'));
    assert.strictEqual(state.styles.length, 1);
    const id = state.styles[0].id;
    state.styles[0].name = 'User renamed this style';
    const renamed = JSON.parse(JSON.stringify(doc));
    renamed.styles.text.find(style => style.id === spec.id).name =
      'Mangrove/renamed';
    r = await run(renamed, [all[0]], false, {
      textStyles: [spec.id],
      effects: false,
    });
    assert.strictEqual(r.styles.counts.text.updated, 1);
    assert.strictEqual(state.styles[0].id, id);
    assert.strictEqual(state.styles[0].name, 'Mangrove/renamed');
    const legacy = { ...doc };
    delete legacy.styles;
    r = await run(legacy, [all[0]]);
    assert.strictEqual(r.errors.length, 0, r.errors.join('\n'));
    assert.strictEqual(
      state.styles.length,
      1,
      'Legacy JSON keeps existing styles'
    );
    console.log(
      'ok  text selection, style rename preserves id, variable-only JSON remains compatible'
    );
  }
}

main().catch(error => {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
});
