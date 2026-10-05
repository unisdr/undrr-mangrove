/** Variables/styles API fixture shared by both plugin cohorts. Native acceptance remains separate. */
'use strict';
const assert = require('assert');
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

module.exports = { createFigma };
