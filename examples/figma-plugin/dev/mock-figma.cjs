#!/usr/bin/env node
/**
 * EXPLORATORY: runs examples/figma-plugin/code.js against a small mock of
 * the Figma variables API, so changes can be checked without Figma.
 *
 *   yarn build:figma-tokens
 *   node examples/figma-plugin/dev/mock-figma.cjs
 *
 * The mock copies the Figma behaviours that have bitten this plugin: a
 * per-collection mode limit, removeVariableCodeSyntax throwing when no
 * syntax is set, scope validation, and alias type checks. It is not a full
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
      return this.pluginData[key] || '';
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

  return {
    showUI() {},
    notify() {},
    closePlugin() {},
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
    },
  };
}

function loadPlugin(modeLimit) {
  const state = { modeLimit, collections: [], variables: [] };
  vm.runInNewContext(fs.readFileSync(path.join(DIR, 'code.js'), 'utf8'), {
    figma: createFigma(state),
    __html__: '',
    console,
  });
  const run = async (doc, modes, prune = false) => {
    await state.handler({ type: 'import', doc, modes, prune });
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

  // Professional: every brand as a mode, idempotent re-import.
  {
    const { state, run } = loadPlugin(10);
    let r = await run(doc, all);
    assert.strictEqual(r.errors.length, 0, r.errors.join('\n'));
    assert.strictEqual(r.counts.created, total);
    assert.strictEqual(r.counts.values, total * all.length);
    r = await run(doc, all);
    assert.strictEqual(r.errors.length, 0, r.errors.join('\n'));
    assert.strictEqual(r.counts.created, 0);
    assert.strictEqual(state.variables.length, total);
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
      const mode = doc.modes.find(m => m.id === brand);
      assert.strictEqual(state.collections[0].modes[0].name, mode.name);
      seen.add(JSON.stringify(valueOf('control/option-selected')));
    }
    assert(seen.size > 1, 'switching brands should change brand colours');
    console.log(
      `ok  brand switcher re-themes one mode across ${all.length} brands`
    );
  }
}

main().catch(error => {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
});
