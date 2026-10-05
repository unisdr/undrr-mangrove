/** Source-backed Mangrove foundation variables/styles, without kit construction. */
'use strict';
const fs = require('fs');
const path = require('path');
const tokens = require('./build-tokens.cjs');

const ROOT = path.resolve(__dirname, '..');
const CONTROL_SCSS = path.join(
  ROOT,
  'stories/assets/scss/_control-tokens.scss'
);
const VARIABLES_SCSS = path.join(ROOT, 'stories/assets/scss/_variables.scss');
const MIXINS_SCSS = path.join(ROOT, 'stories/assets/scss/_mixins.scss');
const HTML_FONT_SIZE = 16;
const COLLECTION = 'Mangrove';

/* ------------------------------------------------------------------ *
 * Colour parsing
 * ------------------------------------------------------------------ */
const round = n => Math.round(n * 10000) / 10000;

function rgba(r, g, b, a = 1) {
  return {
    r: round(r / 255),
    g: round(g / 255),
    b: round(b / 255),
    a: round(a),
  };
}

function oklchToRgba(l, c, h, a = 1) {
  const hr = (h * Math.PI) / 180;
  const A = c * Math.cos(hr);
  const B = c * Math.sin(hr);
  const l_ = l + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = l - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = l - 0.0894841775 * A - 1.291485548 * B;
  const [L, M, S] = [l_ ** 3, m_ ** 3, s_ ** 3];
  const linear = [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
  const gamma = v => {
    const x = Math.min(1, Math.max(0, v));
    return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
  };
  const [r, g, b] = linear.map(gamma);
  return { r: round(r), g: round(g), b: round(b), a: round(a) };
}

function parseColor(value) {
  const v = String(value).trim();
  if (v === 'transparent') return rgba(0, 0, 0, 0);
  let m = /^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/.exec(v);
  if (m) return rgba(+m[1], +m[2], +m[3]);
  m =
    /^rgb\(\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*(?:\/\s*([\d.]+)\s*)?\)$/.exec(
      v
    );
  if (m) return rgba(+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4]);
  m = /^#([0-9a-f]{6})$/i.exec(v);
  if (m) {
    const n = parseInt(m[1], 16);
    return rgba((n >> 16) & 255, (n >> 8) & 255, n & 255);
  }
  m =
    /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)$/.exec(
      v
    );
  if (m) {
    const l = m[2] ? +m[1] / 100 : +m[1];
    return oklchToRgba(l, +m[3], +m[4], m[5] == null ? 1 : +m[5]);
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Dimension parsing
 * ------------------------------------------------------------------ */
function parseLength(value) {
  const v = String(value).trim();
  if (v === '0') return 0;
  let m = /^(-?[\d.]+)rem$/.exec(v);
  if (m) return round(+m[1] * HTML_FONT_SIZE);
  m = /^(-?[\d.]+)px$/.exec(v);
  if (m) return +m[1];
  return null;
}

/* ------------------------------------------------------------------ *
 * Naming and scopes
 * ------------------------------------------------------------------ */
const figmaName = id => id.split('.').join('/');

function scopesFor(id, type) {
  if (type === 'COLOR') return ['ALL_SCOPES'];
  const group = id.split('.')[0];
  if (/opacity/.test(id)) return ['OPACITY'];
  if (group === 'z-index') return [];
  if (group === 'font-size') return ['FONT_SIZE'];
  if (group === 'radius') return ['CORNER_RADIUS'];
  if (group === 'border-width') return ['STROKE_FLOAT'];
  if (group === 'width') return ['WIDTH_HEIGHT'];
  if (group === 'spacing' || group === 'container') {
    return ['GAP', 'WIDTH_HEIGHT'];
  }
  return ['ALL_SCOPES'];
}

function webSyntax(record) {
  if (!record.name) return null;
  const isChannels =
    record.token.type === 'color' &&
    (record.token.format || 'srgb-channels') === 'srgb-channels';
  return isChannels ? `rgb(var(${record.name}))` : `var(${record.name})`;
}

/* ------------------------------------------------------------------ *
 * Per-token conversion
 * ------------------------------------------------------------------ */
const LONE_REFERENCE = /^\{=?\s*([^{}()/=\s]+)\s*\}$/;

/** The Figma type and literal value of one resolved record, or a reason. */
function literalOf(record) {
  const { type } = record.token;
  if (type === 'color') {
    const color = parseColor(record.literal);
    return color
      ? { type: 'COLOR', value: color }
      : { skip: `colour "${record.literal}" has no Figma equivalent` };
  }
  if (type === 'dimension') {
    const parts = String(record.literal).trim().split(/\s+/).map(parseLength);
    if (parts.some(px => px == null) || parts.length > 2) {
      return { skip: `"${record.literal}" is not one or two rem/px lengths` };
    }
    // A two-value shorthand is block then inline, which Figma auto layout
    // binds as vertical and horizontal padding.
    return parts.length === 2
      ? { type: 'FLOAT', pair: parts }
      : { type: 'FLOAT', value: parts[0] };
  }
  if (type === 'number') {
    const n = Number(record.literal);
    if (!Number.isFinite(n))
      return { skip: `"${record.literal}" is not a number` };
    // Figma opacity variables are percentages.
    return {
      type: 'FLOAT',
      value: /opacity/.test(record.id) ? round(n * 100) : n,
    };
  }
  return { skip: `$type ${type} has no faithful Figma variable type` };
}

function sameValue(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/* ------------------------------------------------------------------ *
 * Control roles from _control-tokens.scss
 * ------------------------------------------------------------------ */
const CONTROL_LINE =
  /^\s*(--mg-control-[\w-]+):\s*(?:rgb\(\s*var\((--mg-[\w-]+)\)\s*(?:\/\s*([\d.]+)\s*)?\)|var\((--mg-[\w-]+)\))\s*;/;

function readControlRoles() {
  return fs
    .readFileSync(CONTROL_SCSS, 'utf8')
    .split('\n')
    .map(line => CONTROL_LINE.exec(line))
    .filter(Boolean)
    .map(m => ({
      name: m[1],
      target: m[2] || m[4],
      castRgb: Boolean(m[2]),
      alpha: m[3] == null ? null : Number(m[3]),
    }));
}

/* ------------------------------------------------------------------ *
 * Font-family roles from _variables.scss
 *
 * Roles map onto faces in Sass, not in tokens/*.yaml, so they are read
 * from the :root block. Figma needs one family name, so the first face in
 * each stack is used; the CSS fallbacks have no Figma meaning.
 * ------------------------------------------------------------------ */
function readFontRoles() {
  const source = fs.readFileSync(VARIABLES_SCSS, 'utf8');
  const faces = new Map();
  for (const m of source.matchAll(/^\$mg-font-face-([\w-]+):\s*"([^"]+)"/gm)) {
    faces.set(m[1], m[2]);
  }
  const roles = [];
  for (const m of source.matchAll(
    /^\s*(--mg-font-family-([\w-]+)):\s*#\{mg-font-stack\(\$mg-font-face-([\w-]+)\)\}/gm
  )) {
    if (faces.has(m[3]))
      roles.push({ name: m[1], role: m[2], family: faces.get(m[3]) });
  }
  return roles;
}

/* ------------------------------------------------------------------ *
 * Style definitions. Values stay in the exporter, alongside variables.
 * ------------------------------------------------------------------ */
const DEFAULT_TEXT_SIZES = {
  text: ['300', 'button', 'form-input'],
  heading: ['400', '500', '600', '900', '1000', '1100'],
  display: ['900', '1000'],
  ui: ['tab'],
};

function buildStyles(modes, resolved, output) {
  const byName = new Map(output.map(variable => [variable.name, variable]));
  const literal = (id, mode) => {
    const record = resolved.get(mode.id).emitted.get(id);
    if (!record) throw new Error(`Style token ${id} missing in ${mode.name}`);
    return record.literal;
  };
  const text = [];
  const sizes = output.filter(variable => variable.id.startsWith('font-size.'));
  for (const role of readFontRoles()) {
    for (const size of sizes) {
      const step = size.id.slice('font-size.'.length);
      text.push({
        id: `text.${role.role}.${step}.regular`,
        name: `${COLLECTION}/${role.role}/${step}/Regular`,
        recommended: DEFAULT_TEXT_SIZES[role.role]?.includes(step) || false,
        description:
          `Latin-script ${role.role} foundation, Regular. ` +
          'Automatic line height; component weights and line heights are not implied.\n\n' +
          `CSS: ${role.name}; ${size.codeSyntax.WEB}`,
        bindings: {
          fontFamily: `font-family/${role.role}`,
          fontSize: size.name,
        },
        values: Object.fromEntries(
          modes.map(mode => [
            mode.id,
            {
              fontName: { family: role.family, style: 'Regular' },
              fontSize: parseLength(literal(size.id, mode)),
              lineHeight: { unit: 'AUTO' },
            },
          ])
        ),
      });
    }
  }

  // An alpha cast needs its own colour variable so the effect keeps both
  // the source opacity and brand switching. Binding the opaque source
  // colour would replace the cast's alpha.
  function derived(id, type, values, description, codeSyntax = {}) {
    const name = figmaName(id);
    const variable = {
      id,
      name,
      type,
      description,
      scopes: [type === 'COLOR' ? 'EFFECT_COLOR' : 'EFFECT_FLOAT'],
      hiddenFromPublishing: false,
      codeSyntax,
      values,
    };
    output.push(variable);
    byName.set(name, variable);
    return name;
  }

  const effect = [];
  for (const id of ['shadow.raised', 'shadow.raised-hover']) {
    const values = {};
    const colors = {};
    let colorVariable = null;
    for (const mode of modes) {
      const record = resolved.get(mode.id).emitted.get(id);
      const match = /^(inset\s+)?(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.+)$/.exec(
        record.literal
      );
      const lengths = match && match.slice(2, 6).map(parseLength);
      const color = match && parseColor(match[6]);
      if (!match || lengths.some(value => value == null) || !color) {
        throw new Error(
          `Cannot export effect ${id} [${mode.name}]: ${record.literal}`
        );
      }
      const [x, y, radius, spread] = lengths;
      values[mode.id] = [
        {
          effect: {
            type: match[1] ? 'INNER_SHADOW' : 'DROP_SHADOW',
            color,
            offset: { x, y },
            radius,
            spread,
            visible: true,
            blendMode: 'NORMAL',
          },
          bindings: {},
        },
      ];
      colors[mode.id] = color;
      const reference = /\{rgb\(([^\s/()]+)\)\}/.exec(
        String(record.token.value)
      );
      const target = reference && figmaName(reference[1]);
      if (
        target &&
        byName.has(target) &&
        (colorVariable == null || colorVariable === target)
      ) {
        colorVariable = target;
      }
    }
    // Verify the direct colour binding against every brand, including alpha.
    const direct =
      colorVariable &&
      modes.every(mode =>
        sameValue(
          parseColor(literal(colorVariable.replaceAll('/', '.'), mode)),
          colors[mode.id]
        )
      );
    if (!direct) {
      colorVariable = derived(
        `effect-color.${id}`,
        'COLOR',
        colors,
        `Colour extracted from --mg-${id.replaceAll('.', '-')}, including its alpha cast.`
      );
    }
    for (const mode of modes) values[mode.id][0].bindings.color = colorVariable;
    // Bind geometry if a future brand gives the shadow different dimensions.
    for (const field of ['radius', 'spread', 'offsetX', 'offsetY']) {
      const get = entry =>
        field.startsWith('offset')
          ? entry.effect.offset[field === 'offsetX' ? 'x' : 'y']
          : entry.effect[field];
      const numbers = Object.fromEntries(
        modes.map(mode => [mode.id, get(values[mode.id][0])])
      );
      if (new Set(Object.values(numbers)).size > 1) {
        const name = derived(
          `effect-size.${id}.${field}`,
          'FLOAT',
          numbers,
          `Derived ${field} of ${figmaName(id)}.`
        );
        for (const mode of modes) values[mode.id][0].bindings[field] = name;
      }
    }
    effect.push({
      id,
      name: `${COLLECTION}/${figmaName(id)}`,
      description: `CSS: var(--mg-${id.replaceAll('.', '-')}). Inset border, represented as an inner shadow.`,
      values,
    });
  }

  // Fail visibly if the mixin's recipe changes rather than exporting an
  // obsolete focus effect. Dimensions and colours are resolved per brand.
  const mixin = /@mixin mg-focus-ring\s*\{([^}]+)\}/.exec(
    fs.readFileSync(MIXINS_SCSS, 'utf8')
  )?.[1];
  if (
    !mixin ||
    !/box-shadow:\s*0 0 0 var\(--mg-focus-ring-offset\) rgb\(var\(--mg-color-neutral-0\)\);/.test(
      mixin
    ) ||
    !/outline:\s*var\(--mg-focus-ring-width\) solid rgb\(var\(--mg-color-focus-ring\)\);/.test(
      mixin
    ) ||
    !/outline-offset:\s*var\(--mg-focus-ring-offset\);/.test(mixin)
  ) {
    throw new Error('mg-focus-ring changed: update its Figma effect recipe.');
  }
  const outer = derived(
    'effect-size.focus-ring.outer-spread',
    'FLOAT',
    Object.fromEntries(
      modes.map(mode => {
        const offset = parseLength(literal('focus-ring.offset', mode));
        const width = parseLength(literal('focus-ring.width', mode));
        if (offset == null || width == null || offset < 0 || width < 0) {
          throw new Error(
            `Cannot export focus ring dimensions [${mode.name}].`
          );
        }
        return [mode.id, offset + width];
      })
    ),
    'Outer extent of mg-focus-ring: offset plus width.',
    { WEB: 'calc(var(--mg-focus-ring-offset) + var(--mg-focus-ring-width))' }
  );
  effect.push({
    id: 'focus-ring',
    name: `${COLLECTION}/focus-ring`,
    description:
      'mg-focus-ring: coloured outer band followed by the neutral separator in Figma paint order. Two zero-blur outward shadows approximate the CSS outline; verified on opaque rendered Figma diagnostic shapes.',
    values: Object.fromEntries(
      modes.map(mode => [
        mode.id,
        [
          {
            effect: {
              type: 'DROP_SHADOW',
              color: parseColor(literal('color.neutral-0', mode)),
              offset: { x: 0, y: 0 },
              radius: 0,
              spread: parseLength(literal('focus-ring.offset', mode)),
              visible: true,
              blendMode: 'NORMAL',
            },
            bindings: { color: 'color/neutral-0', spread: 'focus-ring/offset' },
          },
          {
            effect: {
              type: 'DROP_SHADOW',
              color: parseColor(literal('color.focus-ring', mode)),
              offset: { x: 0, y: 0 },
              radius: 0,
              spread:
                parseLength(literal('focus-ring.offset', mode)) +
                parseLength(literal('focus-ring.width', mode)),
              visible: true,
              blendMode: 'NORMAL',
            },
            bindings: { color: 'color/focus-ring', spread: outer },
          },
          // Figma paints the later effect over the earlier one. Rendered
          // diagnostics confirmed the neutral separator must be painted last.
        ].reverse(),
      ])
    ),
  });
  return { text, effect };
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */
function buildFigmaFoundations() {
  const { base, brands } = tokens.loadSources(tokens.TOKENS_DIR);
  const byId = new Map(brands.map(brand => [brand.meta.id, brand]));
  const ordered = [...brands].sort(
    (a, b) => Number(Boolean(b.meta.default)) - Number(Boolean(a.meta.default))
  );

  const modes = ordered.map(brand => ({
    id: brand.meta.id,
    name: brand.meta.title || brand.meta.id,
    selector: brand.meta.selector,
  }));

  const resolved = new Map(
    ordered.map(brand => {
      const merged = tokens.mergeLayers(tokens.layersFor(brand, base, byId));
      return [brand.meta.id, tokens.resolve(merged, brand.meta.id)];
    })
  );

  // Every token id any brand emits, in source order of the default brand.
  const ids = [];
  const seen = new Set();
  for (const r of resolved.values()) {
    for (const id of r.emitted.keys()) {
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }

  const variables = new Map();
  const skipped = [];

  // Pass 1: literal values per mode, so pass 2 can check alias fidelity.
  for (const id of ids) {
    const perMode = {};
    let figmaType = null;
    let reason = null;
    let first = null;
    let paired = false;
    for (const mode of modes) {
      const record = resolved.get(mode.id).emitted.get(id);
      if (!record) continue;
      first = first || record;
      const lit = literalOf(record);
      if (lit.skip) {
        reason = lit.skip;
        break;
      }
      figmaType = lit.type;
      paired = paired || Boolean(lit.pair);
      const lone =
        record.token.alpha == null &&
        LONE_REFERENCE.exec(String(record.token.value).trim());
      perMode[mode.id] = {
        literal: lit.pair || lit.value,
        reference: lone ? lone[1] : null,
      };
    }
    if (reason) {
      skipped.push({ id, reason });
      continue;
    }
    const missing = modes
      .filter(mode => !perMode[mode.id])
      .map(mode => mode.id);
    const onlyIn = missing.length
      ? modes.filter(mode => perMode[mode.id]).map(mode => mode.id)
      : null;
    if (!paired) {
      variables.set(id, {
        id,
        name: figmaName(id),
        type: figmaType,
        record: first,
        perMode,
        onlyIn,
      });
      continue;
    }
    ['block', 'inline'].forEach((axis, index) => {
      const split = {};
      for (const [modeId, entry] of Object.entries(perMode)) {
        const pair = Array.isArray(entry.literal)
          ? entry.literal
          : [entry.literal, entry.literal];
        split[modeId] = { literal: pair[index], reference: null };
      }
      variables.set(`${id}.${axis}`, {
        id: `${id}.${axis}`,
        name: figmaName(`${id}.${axis}`),
        type: figmaType,
        record: first,
        perMode: split,
        onlyIn,
        axis,
      });
    });
  }

  // Pass 2: aliases where the target exists and resolves identically.
  const output = [];
  for (const variable of variables.values()) {
    const values = {};
    const fallback = variable.perMode[Object.keys(variable.perMode)[0]];
    for (const mode of modes) {
      const own = variable.perMode[mode.id] || fallback;
      const target = own.reference && variables.get(own.reference);
      const targetValue = target && (target.perMode[mode.id] || null);
      values[mode.id] =
        target &&
        target.type === variable.type &&
        targetValue &&
        sameValue(targetValue.literal, own.literal)
          ? { alias: target.name }
          : own.literal;
    }
    const { record } = variable;
    const notes = [];
    if (record.token.description)
      notes.push(String(record.token.description).trim());
    if (record.name) {
      notes.push(
        variable.axis
          ? `CSS: ${variable.axis} part of ${record.name}`
          : `CSS: ${record.name}`
      );
    }
    if (variable.onlyIn)
      notes.push(`Only defined by: ${variable.onlyIn.join(', ')}.`);
    output.push({
      id: variable.id,
      name: variable.name,
      type: variable.type,
      description: notes.join('\n\n'),
      scopes: scopesFor(variable.id, variable.type),
      hiddenFromPublishing: Boolean(record.token.private),
      codeSyntax:
        webSyntax(record) && !variable.axis ? { WEB: webSyntax(record) } : {},
      values,
    });
  }

  // Control roles: alias when the role is a plain pass-through, otherwise
  // resolve the alpha per brand.
  const byProperty = new Map();
  for (const variable of variables.values()) {
    if (variable.record.name) byProperty.set(variable.record.name, variable);
  }
  for (const role of readControlRoles()) {
    const target = byProperty.get(role.target);
    if (!target) {
      skipped.push({
        id: role.name,
        reason: `references ${role.target}, which is not exported`,
      });
      continue;
    }
    const values = {};
    for (const mode of modes) {
      if (role.alpha == null) {
        values[mode.id] = { alias: target.name };
      } else {
        const lit = (
          target.perMode[mode.id] || Object.values(target.perMode)[0]
        ).literal;
        values[mode.id] = { ...lit, a: round(lit.a * role.alpha) };
      }
    }
    output.push({
      id: role.name.replace(/^--mg-/, '').replace(/^control-/, 'control.'),
      name: role.name.replace(/^--mg-control-/, 'control/'),
      type: target.type,
      description: `Framework-neutral control role.\n\nCSS: ${role.name}`,
      scopes: ['ALL_SCOPES'],
      hiddenFromPublishing: false,
      codeSyntax: { WEB: `var(${role.name})` },
      values,
    });
  }

  for (const role of readFontRoles()) {
    output.push({
      id: `font-family.${role.role}`,
      name: `font-family/${role.role}`,
      type: 'STRING',
      description:
        'Font-family role. Latin-script face only; Arabic and other scripts ' +
        `map this role to other faces in _fonts.scss.\n\nCSS: ${role.name}`,
      scopes: ['FONT_FAMILY'],
      hiddenFromPublishing: false,
      codeSyntax: { WEB: `var(${role.name})` },
      values: Object.fromEntries(modes.map(mode => [mode.id, role.family])),
    });
  }

  const styles = buildStyles(modes, resolved, output);
  return { collection: COLLECTION, modes, variables: output, styles, skipped };
}
module.exports = { buildFigmaFoundations, parseColor, parseLength };
