'use strict';

/**
 * DTCG 2025.10 input boundary. Standard values stay portable; the namespaced
 * extension describes Mangrove's CSS/Sass outputs, not additional token types.
 * CSS-only constructs such as a shorthand or a theme marker are output recipes
 * on groups and deliberately have no $value or invented $type.
 */
const NAMESPACE = 'org.undrr.mangrove';
const TYPES = new Set([
  'color',
  'dimension',
  'fontFamily',
  'fontWeight',
  'duration',
  'cubicBezier',
  'number',
  'strokeStyle',
  'border',
  'transition',
  'shadow',
  'gradient',
  'typography',
]);
const ALIAS = /^\{([^{}]+)\}$/;
const GROUP_KEYS = new Set([
  '$type',
  '$description',
  '$extensions',
  '$deprecated',
]);
const TOKEN_KEYS = new Set([
  '$value',
  '$type',
  '$description',
  '$extensions',
  '$deprecated',
]);
const inheritedKeys = ['format', 'private', 'sass'];

function fail(label, id, message) {
  throw new Error(`${label}: ${id || '<root>'}: ${message}`);
}
const object = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);

function extension(node, label, id) {
  if (node.$extensions !== undefined && !object(node.$extensions)) {
    fail(label, id, '$extensions must be an object');
  }
  const ext = node.$extensions?.[NAMESPACE] || {};
  if (!object(ext)) fail(label, id, `${NAMESPACE} extension must be an object`);
  return ext;
}

function validateValue(value, type, label, id) {
  if (typeof value === 'string' && ALIAS.test(value)) return;
  const bad = message => fail(label, id, `${type}: ${message}`);
  const dim = v =>
    object(v) && finite(v.value) && ['px', 'rem'].includes(v.unit);
  const duration = v =>
    object(v) && finite(v.value) && ['ms', 's'].includes(v.unit);
  const color = v =>
    object(v) &&
    typeof v.colorSpace === 'string' &&
    Array.isArray(v.components) &&
    v.components.length === 3 &&
    v.components.every(
      c =>
        finite(c) || c === 'none' || (object(c) && typeof c.$ref === 'string')
    ) &&
    (v.alpha === undefined ||
      (finite(v.alpha) && v.alpha >= 0 && v.alpha <= 1));
  const refOr = (v, check) =>
    (typeof v === 'string' && ALIAS.test(v)) || check(v);
  const typed = (v, t) => {
    try {
      validateValue(v, t, label, id);
      return true;
    } catch {
      return false;
    }
  };
  switch (type) {
    case 'color':
      if (!color(value)) bad('expected a colour-space/components object');
      if (
        ![
          'srgb',
          'srgb-linear',
          'display-p3',
          'a98-rgb',
          'prophoto-rgb',
          'rec2020',
          'lab',
          'lch',
          'oklab',
          'oklch',
          'hsl',
          'hwb',
          'xyz-d50',
          'xyz-d65',
        ].includes(value.colorSpace)
      )
        bad('unknown colorSpace');
      break;
    case 'dimension':
      if (!dim(value)) bad('expected { value: number, unit: "px" or "rem" }');
      break;
    case 'duration':
      if (!duration(value))
        bad('expected { value: number, unit: "ms" or "s" }');
      break;
    case 'number':
      if (!finite(value)) bad('expected a finite number');
      break;
    case 'fontFamily':
      if (
        !(typeof value === 'string' && value.length) &&
        !(
          Array.isArray(value) &&
          value.length &&
          value.every(v => typeof v === 'string' && v.length)
        )
      )
        bad('expected a family name or array of family names');
      break;
    case 'fontWeight':
      if (
        !(finite(value) && value >= 1 && value <= 1000) &&
        ![
          'thin',
          'hairline',
          'extra-light',
          'ultra-light',
          'light',
          'normal',
          'regular',
          'book',
          'medium',
          'semi-bold',
          'demi-bold',
          'bold',
          'extra-bold',
          'ultra-bold',
          'black',
          'heavy',
          'extra-black',
          'ultra-black',
        ].includes(value)
      )
        bad('expected a supported font weight');
      break;
    case 'cubicBezier':
      if (
        !Array.isArray(value) ||
        value.length !== 4 ||
        !value.every(finite) ||
        value[0] < 0 ||
        value[0] > 1 ||
        value[2] < 0 ||
        value[2] > 1
      )
        bad('expected four numbers with x coordinates between 0 and 1');
      break;
    case 'shadow': {
      const shadows = Array.isArray(value) ? value : [value];
      if (
        !shadows.every(v =>
          refOr(
            v,
            s =>
              object(s) &&
              refOr(s.color, color) &&
              ['offsetX', 'offsetY', 'blur', 'spread'].every(k =>
                refOr(s[k], dim)
              ) &&
              (s.inset === undefined || typeof s.inset === 'boolean')
          )
        )
      )
        bad('expected structured shadow values');
      break;
    }
    // These composites are accepted as standard input, and their constituent
    // values are checked here before the output adapter serialises them.
    case 'border':
      if (
        !object(value) ||
        !refOr(value.color, color) ||
        !refOr(value.width, dim) ||
        !typed(value.style, 'strokeStyle')
      )
        bad('expected a border composite');
      break;
    case 'transition':
      if (
        !object(value) ||
        !refOr(value.duration, duration) ||
        !refOr(value.delay, duration) ||
        !typed(value.timingFunction, 'cubicBezier')
      )
        bad('expected a transition composite');
      break;
    case 'gradient':
      if (
        !Array.isArray(value) ||
        !value.every(
          v =>
            object(v) &&
            refOr(v.color, color) &&
            finite(v.position) &&
            v.position >= 0 &&
            v.position <= 1
        )
      )
        bad('expected gradient stops');
      break;
    case 'typography':
      if (
        !object(value) ||
        !typed(value.fontFamily, 'fontFamily') ||
        !refOr(value.fontSize, dim) ||
        !typed(value.fontWeight, 'fontWeight') ||
        !refOr(value.letterSpacing, dim) ||
        !refOr(value.lineHeight, finite)
      )
        bad('expected a typography composite');
      break;
    case 'strokeStyle':
      if (
        ![
          'solid',
          'dashed',
          'dotted',
          'double',
          'groove',
          'ridge',
          'outset',
          'inset',
        ].includes(value) &&
        !(
          object(value) &&
          Array.isArray(value.dashArray) &&
          value.dashArray.every(v => refOr(v, dim)) &&
          ['round', 'butt', 'square'].includes(value.lineCap)
        )
      )
        bad('expected a stroke style');
      break;
    default:
      bad('unsupported DTCG type');
  }
}

function inspect(document, label) {
  if (!object(document)) fail(label, '', 'expected a JSON object');
  const entries = [];
  const walk = (node, trail, inheritedType, inherited = {}) => {
    const id = trail.join('.');
    if (!object(node)) fail(label, id, 'expected a token or group object');
    const ext = extension(node, label, id);
    const type = node.$type ?? inheritedType;
    const isToken = Object.hasOwn(node, '$value');
    for (const key of Object.keys(node)) {
      if (key.startsWith('$') && !(isToken ? TOKEN_KEYS : GROUP_KEYS).has(key))
        fail(label, id, `unknown standard property ${key}`);
    }
    if (type !== undefined && !TYPES.has(type))
      fail(label, id, `unknown DTCG type "${type}"`);
    if (
      node.$description !== undefined &&
      typeof node.$description !== 'string'
    )
      fail(label, id, '$description must be a string');
    const inheritedOutput = { ...inherited };
    for (const k of inheritedKeys)
      if (ext[k] !== undefined) inheritedOutput[k] = ext[k];
    const metadata = { ...inheritedOutput, ...ext };
    if (isToken) {
      if (!type) fail(label, id, 'token has no $type');
      if (node.$value === null || node.$value === undefined)
        fail(label, id, 'token has no value');
      const children = Object.keys(node).filter(k => !k.startsWith('$'));
      if (children.length)
        fail(label, id, 'a token cannot contain child groups');
      validateValue(node.$value, type, label, id);
      entries.push({
        id,
        value: node.$value,
        type,
        description: node.$description,
        metadata,
      });
      return;
    }
    if (ext.output) {
      if (!object(ext.output) || !Object.hasOwn(ext.output, 'value'))
        fail(label, id, 'CSS output recipe requires a value');
      entries.push({
        id,
        ...ext.output,
        description: node.$description,
        metadata: { ...metadata, ...ext.output },
        recipe: true,
      });
    }
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$')) continue;
      if (/[.{}]/.test(key))
        fail(label, id, `invalid token/group name "${key}"`);
      walk(child, [...trail, key], type, inheritedOutput);
    }
  };
  walk(document, []);
  return entries;
}

function validateDocument(document, label = 'DTCG document') {
  inspect(document, label);
  return true;
}

function toHex(value) {
  return (
    '#' +
    value.components
      .map(c =>
        Math.round(c * 255)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  );
}

/** Keep portable values intact until brands have been merged. */
function decodeDocument(document, label = 'DTCG document') {
  const entries = inspect(document, label);
  const meta = extension(document, label, '').brand;
  if (!object(meta) || !meta.id)
    fail(label, '', 'missing brand.id in Mangrove extension');
  const tokens = new Map();
  for (const entry of entries) {
    const m = entry.metadata;
    tokens.set(entry.id, {
      id: entry.id,
      file: label,
      value: entry.value,
      type: m.cssType || entry.type,
      format: m.format,
      private: m.private,
      sass: m.sass,
      name: m.name,
      alpha: entry.recipe ? m.alpha : undefined,
      description: entry.description,
      dtcgType: entry.recipe ? undefined : entry.type,
      dtcgValue: entry.recipe ? undefined : entry.value,
      dtcgMetadata: m,
    });
  }
  return { meta, tokens, file: label };
}

/**
 * Resolve standard aliases/pointers against the merged brand, validate their
 * types, then lower values to the stable CSS resolver's intermediate form.
 * Literal CSS remains a transform concern, not a proprietary token type.
 */
function normalizeTokens(tokens, label) {
  const resolved = new Map();
  const resolving = new Set();
  const get = (id, from) => {
    const token = tokens.get(id);
    if (!token) fail(label, from, `references unknown token "{${id}}"`);
    if (!token.dtcgType)
      fail(label, from, `standard reference must target a DTCG token: ${id}`);
    return token;
  };
  const pointer = (ref, from) => {
    if (!ref.startsWith('#/'))
      fail(label, from, 'only local JSON Pointer references are supported');
    const keys = ref
      .slice(2)
      .split('/')
      .map(k => k.replace(/~1/g, '/').replace(/~0/g, '~'));
    const split = keys.indexOf('$value');
    if (split < 1) fail(label, from, 'JSON Pointer must target a token $value');
    const target = keys.slice(0, split).join('.');
    get(target, from);
    let value = literal(target);
    for (const key of keys.slice(split + 1)) {
      if (
        value === null ||
        typeof value !== 'object' ||
        !Object.hasOwn(value, key)
      )
        fail(label, from, `unresolved JSON Pointer ${ref}`);
      value = value[key];
    }
    return value;
  };
  const expand = (v, from) => {
    if (typeof v === 'string' && ALIAS.test(v)) {
      const id = v.slice(1, -1);
      get(id, from);
      return literal(id);
    }
    if (Array.isArray(v)) return v.map(x => expand(x, from));
    if (object(v)) {
      if (Object.hasOwn(v, '$ref')) return pointer(v.$ref, from);
      return Object.fromEntries(
        Object.entries(v).map(([k, x]) => [k, expand(x, from)])
      );
    }
    return v;
  };
  const literal = id => {
    if (resolved.has(id)) return resolved.get(id);
    if (resolving.has(id)) fail(label, id, 'circular reference');
    resolving.add(id);
    const t = get(id, id);
    const alias = typeof t.dtcgValue === 'string' && ALIAS.exec(t.dtcgValue);
    if (alias && get(alias[1], id).dtcgType !== t.dtcgType)
      fail(
        label,
        id,
        `alias type mismatch (${t.dtcgType} vs ${get(alias[1], id).dtcgType})`
      );
    const value = expand(t.dtcgValue, id);
    validateValue(value, t.dtcgType, label, id);
    resolving.delete(id);
    resolved.set(id, value);
    return value;
  };
  const scalarDim = v =>
    typeof v === 'string' ? v : v.value === 0 ? '0' : `${v.value}${v.unit}`;
  const colorSource = raw => {
    if (
      !object(raw) ||
      !Array.isArray(raw.components) ||
      raw.components.length !== 3
    )
      return null;
    const matches = raw.components.map(
      (c, i) =>
        object(c) &&
        typeof c.$ref === 'string' &&
        new RegExp(`^#/([^#]+?)/\\$value/components/${i}$`).exec(c.$ref)
    );
    if (matches.some(m => !m) || !matches.every(m => m[1] === matches[0][1]))
      return null;
    const target = matches[0][1]
      .split('/')
      .map(k => k.replace(/~1/g, '/').replace(/~0/g, '~'))
      .join('.');
    return raw.colorSpace === literal(target).colorSpace ? target : null;
  };
  const emitsChannels = (token, seen = new Set()) => {
    if (token.format === undefined || token.format === 'srgb-channels')
      return true;
    // Literal aliases inherit the target's emitted shape, including through
    // adapters. Their declared format alone cannot tell channels from rgb().
    const alias =
      token.format === 'literal' &&
      typeof token.dtcgValue === 'string' &&
      ALIAS.exec(token.dtcgValue);
    if (!alias) return false;
    if (seen.has(alias[1])) fail(label, alias[1], 'circular reference');
    seen.add(alias[1]);
    return emitsChannels(get(alias[1], alias[1]), seen);
  };
  const completeColor = (raw, from) => {
    const v = expand(raw, from);
    if (v.colorSpace !== 'srgb')
      fail(label, from, 'shadow CSS currently requires sRGB colours');
    return `rgb(${v.components.map(c => Math.round(c * 255)).join(' ')}${v.alpha !== undefined && v.alpha !== 1 ? ` / ${v.alpha}` : ''})`;
  };
  const colorCss = (raw, from, flatten) => {
    if (typeof raw === 'string' && ALIAS.test(raw)) {
      const target = get(raw.slice(1, -1), from);
      if (flatten || target.private) return completeColor(raw, from);
      return emitsChannels(target) ? `{rgb(${raw.slice(1, -1)})}` : raw;
    }
    const source = colorSource(raw);
    if (
      source &&
      !flatten &&
      !get(source, from).private &&
      emitsChannels(get(source, from))
    )
      return `{rgb(${source}${raw.alpha !== undefined ? ` / ${raw.alpha}` : ''})}`;
    return completeColor(raw, from);
  };
  const dimensionCss = (raw, from, flatten) => {
    if (typeof raw === 'string' && ALIAS.test(raw)) {
      const target = get(raw.slice(1, -1), from);
      return flatten || target.private ? scalarDim(expand(raw, from)) : raw;
    }
    // Property pointers carry structured dimensions too. Resolve them before
    // serialising their value/unit fields instead of emitting undefined units.
    return scalarDim(expand(raw, from));
  };
  const result = new Map();
  for (const [id, t] of tokens) {
    if (!t.dtcgType) {
      result.set(id, t);
      continue;
    }
    const m = t.dtcgMetadata || {};
    const portable = literal(id);
    if (
      t.dtcgType === 'color' &&
      portable.alpha !== undefined &&
      portable.alpha !== 1 &&
      (t.format === 'srgb-channels' || t.format === undefined)
    ) {
      fail(
        label,
        id,
        'sRGB channel output cannot represent alpha; choose a complete colour output format'
      );
    }

    let value = t.dtcgValue;
    let format = t.format;
    const wholeAlias = typeof value === 'string' && ALIAS.exec(value);
    const componentSource = t.dtcgType === 'color' && colorSource(value);
    if (wholeAlias) {
      const target = get(wholeAlias[1], id);
      value =
        m.resolve === 'literal' || target.private
          ? `{=${wholeAlias[1]}}`
          : value;
      // Runtime targets already supply their units; do not pass a var()
      // through numeric conversion. An explicit literal rem output instead
      // converts the resolved typed dimension, independently of target format.
      if (t.dtcgType === 'dimension') {
        if (t.format === 'rem' && (m.resolve === 'literal' || target.private)) {
          value = portable.unit === 'px' ? portable.value : portable.value * 16;
        } else format = 'literal';
      }
      // A complete CSS colour is already wrapped. Reusing it as a colour must
      // not produce rgb(rgb(...)); adapting it to the legacy channel contract
      // instead needs the typed sRGB value at build time. The latter cannot
      // retain a runtime var() link because CSS has no channel-unwrapping step.
      if (t.dtcgType === 'color' && !emitsChannels(target)) {
        if (emitsChannels(t)) {
          if (portable.colorSpace !== 'srgb')
            fail(label, id, 'channel output requires an sRGB colour');
          value = toHex(portable);
        } else format = 'literal';
      }
    } else if (componentSource && emitsChannels(get(componentSource, id))) {
      value = `{${m.resolve === 'literal' || get(componentSource, id).private ? '=' : ''}${componentSource}}`;
    } else {
      switch (t.dtcgType) {
        case 'color':
          if (
            portable.colorSpace === 'srgb' &&
            (['srgb-channels', 'srgb-rgb-function'].includes(t.format) ||
              (portable.alpha !== 0 &&
                (portable.alpha === undefined || portable.alpha === 1)))
          )
            value = toHex(portable);
          else if (portable.colorSpace === 'srgb' && portable.alpha === 0)
            value = 'transparent';
          else if (portable.colorSpace === 'oklch')
            value = `oklch(${Number((portable.components[0] * 100).toFixed(8))}% ${portable.components[1]} ${portable.components[2]}${portable.alpha !== undefined && portable.alpha !== 1 ? ` / ${portable.alpha}` : ''})`;
          else if (portable.colorSpace === 'srgb')
            value = `rgb(${portable.components.map(c => Math.round(c * 255)).join(' ')} / ${portable.alpha})`;
          else
            fail(
              label,
              id,
              `no CSS colour transform for ${portable.colorSpace}`
            );
          break;
        case 'dimension':
          value =
            t.format === 'rem'
              ? portable.unit === 'px'
                ? portable.value
                : portable.value * 16
              : m.unitlessZero && portable.value === 0
                ? '0'
                : `${portable.value}${portable.unit}`;
          break;
        case 'duration':
          value = `${portable.value}${portable.unit}`;
          break;
        case 'cubicBezier':
          value = `cubic-bezier(${portable.join(', ')})`;
          break;
        case 'number':
          value = m.cssUnit
            ? `${Number((portable * (m.cssUnit === '%' ? 100 : 1)).toFixed(8))}${m.cssUnit}`
            : String(portable);
          break;
        case 'fontFamily':
          value = portable;
          break;
        case 'fontWeight':
          value = String(portable);
          break;
        case 'shadow': {
          if (
            m.none &&
            !Array.isArray(portable) &&
            portable.color.alpha === 0 &&
            ['offsetX', 'offsetY', 'blur', 'spread'].every(
              k => portable[k].value === 0
            )
          ) {
            value = 'none';
            break;
          }
          const raw = Array.isArray(t.dtcgValue) ? t.dtcgValue : [t.dtcgValue];
          value = raw
            .map((sh, index) => {
              const shape = Array.isArray(portable)
                ? portable[index]
                : portable;
              const flatten = m.resolve === 'literal';
              if (typeof sh === 'string') {
                const target = get(sh.slice(1, -1), id);
                if (!flatten && !target.private) return sh;
              }
              const source = typeof sh === 'string' ? shape : sh;
              const offsets = [
                source.offsetX,
                source.offsetY,
                source.blur,
                ...(m.omitSpread && shape.spread.value === 0
                  ? []
                  : [source.spread]),
              ]
                .map(v => dimensionCss(v, id, flatten))
                .join(' ');
              const color = colorCss(source.color, id, flatten);
              return `${source.inset ? 'inset ' : ''}${m.colorFirst ? `${color} ${offsets}` : `${offsets} ${color}`}`;
            })
            .join(', ');
          break;
        }
        default:
          fail(label, id, `no CSS output transform for ${t.dtcgType}`);
      }
    }
    result.set(id, {
      ...t,
      type: m.cssType || t.dtcgType,
      format,
      value,
      alpha: t.dtcgType === 'color' ? portable.alpha : t.alpha,
    });
  }
  return result;
}

module.exports = {
  NAMESPACE,
  TYPES,
  validateDocument,
  decodeDocument,
  normalizeTokens,
};
