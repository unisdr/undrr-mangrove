#!/usr/bin/env node
/**
 * Mangrove design-token generator.
 *
 * ONE source per brand, ONE generator, every downstream form emitted from it.
 *
 *   tokens/mangrove.yaml       brand-neutral base (system defaults only)
 *   tokens/undrr.yaml          UNDRR identity — a sub-brand like any other
 *   tokens/preventionweb.yaml
 *   tokens/irp.yaml
 *   tokens/mcr.yaml
 *   tokens/delta.yaml
 *
 * A brand layer is merged OVER the base and only then are references
 * resolved, so a brand that overrides one primitive cascades to everything
 * derived from it. That is the property the previous generator could not
 * express and the reason the hand-written theme files were sixty lines of
 * near-duplicates.
 *
 * Emitted per brand:
 *   stories/assets/scss/generated/_tokens-<brand>.scss
 *       @mixin mg-tokens-<brand>  the theme block (:root / .mg-theme-*)
 *       plus any Sass variables the build still needs
 *
 * Usage:
 *   node scripts/build-tokens.cjs            write the generated partials
 *   node scripts/build-tokens.cjs --check    exit 1 if any are stale
 *   node scripts/build-tokens.cjs --baseline update tokens/output-baseline.json
 *
 * The partials are build output and are NOT committed, so the only committed
 * record of what this generator produces is tokens/output-baseline.json — a
 * SHA-256 per emitted file, checked by tokens-source.test.js. A deliberate
 * token change moves it; regenerate it in the same commit with --baseline.
 *
 * Wired into package.json as `yarn build:tokens`, which `yarn scss` and
 * `yarn scss-watch` both run first.
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const ROOT = path.resolve(__dirname, '..');
const TOKENS_DIR = path.join(ROOT, 'tokens');
const SCSS_DIR = path.join(ROOT, 'stories/assets/scss');
const GENERATED_DIR = path.join(SCSS_DIR, 'generated');
const BASELINE_PATH = path.join(TOKENS_DIR, 'output-baseline.json');

class TokenError extends Error {}

/* ------------------------------------------------------------------ *
 * Value formats.
 *
 * `format` is the whole reason this generator exists. Mangrove writes a
 * colour BOTH as bare sRGB channels ("0 79 145", composable via
 * `rgb(var(--x) / 0.5)`) and as a finished colour value ("rgb(0 79 145)").
 * A triplet dropped into a colour position is invalid CSS and is discarded
 * silently — a bug this repository has shipped three times. The source
 * states the colour once; each output declares the shape it needs.
 * ------------------------------------------------------------------ */
const GENERIC_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'math',
  'emoji',
  'fangsong',
]);

const FORMATS = new Set([
  'srgb-channels',
  'srgb-rgb-function',
  'literal',
  'rem',
  'font-family-name',
  'font-family-stack',
]);

/**
 * Formats whose Sass value is CSS syntax rather than a bare token, so it has
 * to travel as a Sass *string* and be interpolated at the use site. Assigning
 * `"Dubai", sans-serif` to a Sass variable makes a list whose interpolation
 * drops the quotes, silently changing the compiled CSS.
 */
const SASS_STRING_FORMATS = new Set(['font-family-stack']);

/**
 * stylelint runs with --fix over stories/**\/*.scss and would rewrite some
 * generated values, putting the linter and the generator in a loop.
 * `value-keyword-case` lowercases `Dubai` to `dubai` in a Sass variable value.
 */
const FORMAT_STYLELINT_DISABLE = {
  'font-family-name': 'value-keyword-case',
};

/**
 * Some rem conversions are exact only at six decimal places: 11.25px / 16 is
 * 0.703125rem, and stylelint's number-max-precision would round it to
 * 0.70313rem — a different value. The rule is suppressed for those
 * declarations rather than letting the linter silently retune the type scale.
 */
const HIGH_PRECISION = /\d*\.\d{6,}/;

function stylelintDisableFor(format, value) {
  if (FORMAT_STYLELINT_DISABLE[format]) return FORMAT_STYLELINT_DISABLE[format];
  if (HIGH_PRECISION.test(String(value))) return 'number-max-precision';
  return null;
}

// Build-time rem conversion, mirroring mg-rem() in _variables.scss. The 10px
// root was removed in 2.0; consumers use the browser-standard 16px document
// root and this is the only place the number appears in the token pipeline.
const HTML_FONT_SIZE = 16;

function toRem(px) {
  const value = Number(px);
  if (!Number.isFinite(value)) {
    throw new TokenError(`format "rem" needs a number, got "${px}"`);
  }
  const rem = value / HTML_FONT_SIZE;
  return `${Number(rem.toFixed(6))}rem`;
}

function channels(hex) {
  const text = String(hex).trim();
  const match = /^#([0-9a-f]{6})$/i.exec(text);
  if (!match) {
    throw new TokenError(
      `colour "${text}" must be 6-digit hex; the generator emits 8-bit sRGB ` +
        'channels and will not guess at other colour spaces'
    );
  }
  return [0, 2, 4].map(i => parseInt(match[1].slice(i, i + 2), 16)).join(' ');
}

/**
 * A value emitted in a channel shape must actually BE channels — either a
 * literal triplet or a link to a token that is one. Anything else (a named
 * CSS colour, an oklch() value, a finished rgb()) would produce a
 * declaration that is invalid the moment it is wrapped in rgb(), and CSS
 * discards those silently. Such a value has to declare $format: literal.
 */
const CHANNEL_SHAPE = /^(?:\d{1,3} \d{1,3} \d{1,3}|var\(--[a-z0-9-]+\))$/;

function assertChannels(token, value, brandLabel) {
  if (!CHANNEL_SHAPE.test(String(value).trim())) {
    throw new TokenError(
      `${brandLabel}: ${token.id} is emitted in a channel shape but its ` +
        `value "${value}" is not sRGB channels. A colour that cannot be ` +
        'expressed as channels must declare $format: literal.'
    );
  }
  return value;
}

function fontFamilyStack(value) {
  return (Array.isArray(value) ? value : [value])
    .map(family => (GENERIC_FAMILIES.has(family) ? family : `"${family}"`))
    .join(', ');
}

/* ------------------------------------------------------------------ *
 * Source loading
 * ------------------------------------------------------------------ */
const INHERITED = ['$type', '$format', '$private', '$sass'];

function flatten(node, trail, inherited, tokens, file) {
  const context = { ...inherited };
  for (const key of INHERITED) {
    if (Object.prototype.hasOwnProperty.call(node, key))
      context[key] = node[key];
  }

  if (Object.prototype.hasOwnProperty.call(node, '$value')) {
    const id = trail.join('.');
    // A YAML key with nothing after it parses as null, which used to reach the
    // emitter and print the string "null" -- invalid CSS the browser drops
    // without complaint. Same class as the shape bugs above: fail loudly.
    if (node.$value === null || node.$value === undefined) {
      throw new TokenError(
        `${id} has a $value with nothing after it. Give it a value, or ` +
          `remove the token.`,
        file
      );
    }
    // `private` is deliberately left undefined when nothing states it, rather
    // than defaulted to false: `mergeLayers` has to be able to tell "this
    // source said public" from "this source said nothing". Every consumer
    // tests it for truthiness, so undefined behaves as false everywhere.
    tokens.set(id, {
      id,
      file,
      value: node.$value,
      type: context.$type,
      format: node.$format ?? context.$format,
      private: node.$private ?? context.$private,
      sass: node.$sass ?? context.$sass,
      name: node.$name,
      alpha: node.$alpha,
      description: node.$description,
    });
    return;
  }

  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    if (child === null || typeof child !== 'object') {
      throw new TokenError(
        `${[...trail, key].join('.')} in ${file}: expected a token object ` +
          '(a group or a { $value: ... } node)'
      );
    }
    flatten(child, [...trail, key], context, tokens, file);
  }
}

function loadSource(dir, fileName) {
  const absolute = path.join(dir, fileName);
  let document;
  try {
    document = YAML.parse(fs.readFileSync(absolute, 'utf8'));
  } catch (error) {
    throw new TokenError(`tokens/${fileName}: ${error.message}`);
  }
  if (!document || typeof document !== 'object') {
    throw new TokenError(`tokens/${fileName}: not a YAML mapping`);
  }
  const meta = document.$brand;
  if (!meta || !meta.id) {
    throw new TokenError(
      `tokens/${fileName}: missing $brand.id (every source names the brand it carries)`
    );
  }
  const tokens = new Map();
  flatten(document, [], {}, tokens, `tokens/${fileName}`);
  return { meta, tokens, file: `tokens/${fileName}` };
}

function loadSources(dir) {
  const names = fs
    .readdirSync(dir)
    .filter(name => name.endsWith('.yaml'))
    .sort();
  if (names.length === 0) {
    throw new TokenError(`no *.yaml token sources found in ${dir}`);
  }

  const sources = names.map(name => loadSource(dir, name));
  const base = sources.find(source => source.meta.base);
  if (!base) {
    throw new TokenError(
      'no base source: exactly one tokens/*.yaml must set `$brand.base: true`'
    );
  }
  if (sources.filter(source => source.meta.base).length > 1) {
    throw new TokenError(
      'more than one tokens/*.yaml sets `$brand.base: true`'
    );
  }

  const brands = sources.filter(source => !source.meta.base);
  const seenId = new Map();
  const seenOutput = new Map();
  for (const brand of brands) {
    if (seenId.has(brand.meta.id)) {
      throw new TokenError(
        `duplicate $brand.id "${brand.meta.id}" in ${brand.file} and ` +
          `${seenId.get(brand.meta.id)}`
      );
    }
    seenId.set(brand.meta.id, brand.file);
    const output = brand.meta.output || brand.meta.id;
    if (seenOutput.has(output)) {
      throw new TokenError(
        `two brands write the same output name "${output}": ${brand.file} and ` +
          `${seenOutput.get(output)}. Set a distinct $brand.output.`
      );
    }
    seenOutput.set(output, brand.file);
  }

  return { base, brands };
}

/* ------------------------------------------------------------------ *
 * Merge + resolution
 *
 * The brand layer is merged over the base FIRST; references resolve
 * afterwards, against the merged table. That ordering is the point: a brand
 * that redefines one primitive moves every token derived from it.
 * ------------------------------------------------------------------ */
/**
 * Properties of a token that describe its SHAPE and its IDENTITY rather than
 * its value, and therefore survive an override that only re-values it.
 *
 * A plain `{ ...inherited, ...token }` spread cannot express this: `flatten`
 * writes every key, so a key the override did not state arrives as
 * `undefined` and DELETES what the base declared. Three live bugs came out of
 * that, each one silent:
 *
 *   - `format`: a sub-brand that re-values a colour without restating
 *     `$format: srgb-rgb-function` reverted it to bare channels. That is
 *     precisely the `.mg-button-outline` failure documented in
 *     tokens/mangrove.yaml — a triplet in a colour position is invalid CSS
 *     and is discarded without a word;
 *   - `name`: an override that omitted `$name` stopped writing the property
 *     its consumers actually read and wrote `--mg-<id>` instead, so the
 *     override became a no-op;
 *   - `private`: an override of a brand primitive that omitted `$private`
 *     leaked it into the emitted CSS as a public custom property.
 *
 * `value`, `alpha` and `description` are deliberately NOT here. They belong
 * to the specific value a layer states: an override supplies its own colour,
 * its own opacity and its own reasoning, and inheriting the base's prose onto
 * a different value is how a comment comes to describe something that is no
 * longer true.
 */
const CARRIED = ['type', 'format', 'private', 'sass', 'name'];

function mergeLayers(layers) {
  const merged = new Map();
  for (const layer of layers) {
    for (const [id, token] of layer.tokens) {
      const inherited = merged.get(id);
      if (!inherited) {
        merged.set(id, token);
        continue;
      }
      const next = { ...inherited, ...token };
      for (const key of CARRIED) {
        if (token[key] === undefined) next[key] = inherited[key];
      }
      merged.set(id, next);
    }
  }
  return merged;
}

/**
 * The layer stack for a brand: the base, then its `extends` chain, then the
 * brand itself. Sub-brands default to extending the default brand because
 * that is the runtime truth — a `.mg-theme-*` block is a delta applied on
 * top of Mangrove's `:root`, and IRP's theme really does link to UNDRR's
 * --mg-color-orange-900. A brand that wants none of that sets
 * `$brand.extends: mangrove`.
 */
function layersFor(brand, base, byId, seen = new Set()) {
  if (seen.has(brand.meta.id)) {
    throw new TokenError(
      `circular $brand.extends chain through "${brand.meta.id}"`
    );
  }
  seen.add(brand.meta.id);
  const parentId = brand.meta.extends;
  if (!parentId || parentId === base.meta.id) return [base, brand];
  const parent = byId.get(parentId);
  if (!parent) {
    throw new TokenError(
      `${brand.file}: $brand.extends "${parentId}" is not a known brand`
    );
  }
  return [...layersFor(parent, base, byId, seen), brand];
}

function propertyName(token) {
  if (token.name) return token.name;
  return `--mg-${token.id.split('.').join('-')}`;
}

function sassOutputs(token) {
  if (!token.sass) return [];
  if (token.sass === true) {
    return [
      { name: `$mg-${token.id.split('.').join('-')}`, format: token.format },
    ];
  }
  const list = Array.isArray(token.sass) ? token.sass : [token.sass];
  return list.map(entry =>
    typeof entry === 'string'
      ? { name: entry, format: token.format }
      : { name: entry.name, format: entry.format || token.format }
  );
}

const REFERENCE = /\{([^{}]+)\}/g;
// {path} {=path} {rgb(path)} {rgb(=path)} {rgb(path / 0.24)}
const CAST = /^(?:(rgb)\(\s*(.+?)\s*\))$/;

function parseReference(body) {
  const cast = CAST.exec(body.trim());
  let spec = body.trim();
  let wrap = null;
  let alpha = null;
  if (cast) {
    wrap = cast[1];
    spec = cast[2];
    const slash = spec.lastIndexOf('/');
    if (slash !== -1) {
      alpha = spec.slice(slash + 1).trim();
      spec = spec.slice(0, slash).trim();
    }
  }
  const flat = spec.startsWith('=');
  return {
    wrap,
    alpha,
    flat,
    target: flat ? spec.slice(1).trim() : spec.trim(),
  };
}

/**
 * Resolves one brand's merged token table into emitted values.
 *
 * Every failure here is loud: an unknown reference, a reference to a token
 * with no custom property to link to, a cycle, or an unknown format. Silent
 * wrong output is the failure mode this whole architecture exists to prevent.
 */
function resolve(tokens, brandLabel) {
  const emitted = new Map(); // id -> { name, value, literal, token }
  const visiting = new Set();

  const get = (id, from) => {
    const token = tokens.get(id);
    if (!token) {
      throw new TokenError(
        `${brandLabel}: ${from} references unknown token "{${id}}"`
      );
    }
    return token;
  };

  // The literal (brand-resolved, link-free) form of a token, used by `{=ref}`
  // and by every standalone artifact that cannot rely on a var() chain.
  const literalOf = id => build(id).literal;

  const linkOf = (id, from) => {
    const token = get(id, from);
    if (token.private) {
      throw new TokenError(
        `${brandLabel}: ${from} links to "{${id}}", which is $private and has ` +
          'no custom property to point at. Use {=' +
          id +
          '} to resolve it at build time.'
      );
    }
    return `var(${propertyName(token)})`;
  };

  const substitute = (template, from, { flattenAll = false } = {}) =>
    String(template).replace(REFERENCE, (_match, body) => {
      const ref = parseReference(body);
      const inner =
        ref.flat || flattenAll
          ? literalOf(ref.target)
          : linkOf(ref.target, from);
      if (!ref.wrap) return inner;
      const token = get(ref.target, from);
      if (token.type !== 'color') {
        throw new TokenError(
          `${brandLabel}: ${from} casts "{${ref.target}}" to rgb() but its ` +
            `$type is "${token.type}", not "color"`
        );
      }
      return ref.alpha ? `rgb(${inner} / ${ref.alpha})` : `rgb(${inner})`;
    });

  const shape = (token, base) => {
    const format =
      token.format || (token.type === 'color' ? 'srgb-channels' : 'literal');
    if (!FORMATS.has(format)) {
      throw new TokenError(
        `${brandLabel}: ${token.id} declares unknown format "${format}" ` +
          `(expected one of ${[...FORMATS].join(', ')})`
      );
    }
    switch (format) {
      case 'srgb-channels':
        return assertChannels(token, base, brandLabel);
      case 'srgb-rgb-function':
        assertChannels(token, base, brandLabel);
        return token.alpha != null
          ? `rgb(${base} / ${token.alpha})`
          : `rgb(${base})`;
      case 'rem':
        return toRem(base);
      case 'font-family-name':
        return (Array.isArray(token.value) ? token.value : [token.value])[0];
      case 'font-family-stack':
        return fontFamilyStack(token.value);
      case 'literal':
      default:
        return base;
    }
  };

  const build = id => {
    if (emitted.has(id)) return emitted.get(id);
    if (visiting.has(id)) {
      throw new TokenError(
        `${brandLabel}: circular reference — ${[...visiting, id].join(' -> ')}`
      );
    }
    visiting.add(id);
    const token = get(id, id);

    let base;
    if (
      token.type === 'color' &&
      typeof token.value === 'string' &&
      token.value.startsWith('#')
    ) {
      base = channels(token.value);
    } else if (Array.isArray(token.value)) {
      base = token.value;
    } else {
      base = substitute(token.value, token.id);
    }

    let literalBase;
    if (
      token.type === 'color' &&
      typeof token.value === 'string' &&
      token.value.startsWith('#')
    ) {
      literalBase = channels(token.value);
    } else if (Array.isArray(token.value)) {
      literalBase = token.value;
    } else {
      literalBase = substitute(token.value, token.id, { flattenAll: true });
    }

    // A token whose whole value is one build-time reference inherits the
    // referenced token's reasoning. Brand primitives are $private, so
    // without this the "DELTA's hover is deliberately lighter" and "this
    // WCAG divergence is sourced" notes would never reach a generated file.
    const lone = /^\{=([^{}|/]+)\}$/.exec(String(token.value).trim());
    const inherited =
      token.description ??
      (lone && tokens.has(lone[1].trim())
        ? tokens.get(lone[1].trim()).description
        : undefined);

    const record = {
      id,
      token: { ...token, description: inherited },
      name: token.private ? null : propertyName(token),
      value: shape(token, base),
      literal: shape(token, literalBase),
      sass: sassOutputs(token).map(output => ({
        name: output.name,
        format: output.format,
        value: shape({ ...token, format: output.format }, literalBase),
      })),
    };
    visiting.delete(id);
    emitted.set(id, record);
    return record;
  };

  for (const id of tokens.keys()) build(id);

  const byProperty = new Map();
  for (const record of emitted.values()) {
    if (!record.name) continue;
    if (byProperty.has(record.name)) {
      throw new TokenError(
        `${brandLabel}: "${record.name}" is emitted by both ` +
          `${byProperty.get(record.name).id} and ${record.id}`
      );
    }
    byProperty.set(record.name, record);
  }

  return { emitted, byProperty };
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */
function comment(text, prefix, indent = '') {
  const out = [];
  for (const paragraph of String(text).split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    let line = '';
    for (const word of words) {
      if (line && `${indent}${prefix}${line} ${word}`.length > 78) {
        out.push(`${indent}${prefix}${line}`);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    if (line) out.push(`${indent}${prefix}${line}`);
  }
  return out;
}

function declarations(records, indent) {
  const lines = [];
  for (const [index, record] of records.entries()) {
    if (index > 0) lines.push('');
    lines.push(`${indent}// ${record.id}`);
    if (record.token.description) {
      lines.push(...comment(record.token.description, '// ', indent));
    }
    const disable = stylelintDisableFor(record.token.format, record.value);
    if (disable)
      lines.push(`${indent}// stylelint-disable-next-line ${disable}`);
    lines.push(`${indent}${record.name}: ${record.value};`);
  }
  return lines;
}

function renderBrand(brand, resolved, ownIds, label) {
  const lines = [];
  lines.push('// GENERATED FILE — DO NOT EDIT.');
  lines.push(`// Brand: ${brand.meta.title || label}`);
  lines.push(`// Selector: ${brand.meta.selector}`);
  lines.push(...comment(brand.meta.description || '', '// '));
  lines.push(`// Source: ${brand.file}`);
  lines.push('// Regenerate: yarn build:tokens');
  lines.push('// Edit the YAML source, never this file.');
  lines.push('// `npx jest tokens-source` fails if the two disagree.');

  const own = ownIds
    .map(id => resolved.emitted.get(id))
    .filter(record => record.name);
  const sassVars = ownIds
    .map(id => resolved.emitted.get(id))
    .flatMap(record => record.sass.map(entry => ({ record, entry })));

  for (const { record, entry } of sassVars) {
    lines.push('');
    lines.push(`// ${record.id} (${entry.format})`);
    if (record.token.description) {
      lines.push(...comment(record.token.description, '// '));
    }
    const disable = stylelintDisableFor(entry.format, entry.value);
    if (disable) lines.push(`// stylelint-disable-next-line ${disable}`);
    lines.push(
      SASS_STRING_FORMATS.has(entry.format)
        ? `${entry.name}: '${entry.value}';`
        : `${entry.name}: ${entry.value};`
    );
  }

  lines.push('');
  lines.push(`// The ${brand.meta.selector} token block.`);
  lines.push(`@mixin mg-tokens-${label} {`);
  lines.push(...declarations(own, '  '));
  lines.push('}');

  lines.push('');

  return lines.join('\n');
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */
function build({ tokensDir = TOKENS_DIR } = {}) {
  const { base, brands } = loadSources(tokensDir);
  const files = new Map();

  // The default brand is merged into the base's own :root block, because
  // that is what Mangrove's :root has always been. Keeping UNDRR in its own
  // source is what makes "adopt Mangrove without adopting UNDRR branding" an
  // expressible position rather than a rewrite.
  const defaultBrand = brands.find(brand => brand.meta.default);
  if (!defaultBrand) {
    throw new TokenError(
      'no default brand: exactly one tokens/*.yaml must set `$brand.default: true`'
    );
  }
  const byId = new Map(brands.map(brand => [brand.meta.id, brand]));

  const targets = brands.map(brand => {
    const layers = layersFor(brand, base, byId);
    const tokens = mergeLayers(layers);
    const isDefault = brand === defaultBrand;
    return {
      meta: brand.meta,
      file: layers.map(layer => layer.file).join(' + '),
      tokens,
      // The default brand owns Mangrove's whole :root; a sub-brand emits
      // only what its own source declares, which is what a theme block is.
      ownIds: isDefault ? [...tokens.keys()] : [...brand.tokens.keys()],
    };
  });

  for (const target of targets) {
    const output = target.meta.output || target.meta.id;
    const resolved = resolve(target.tokens, output);
    files.set(
      path.relative(ROOT, path.join(GENERATED_DIR, `_tokens-${output}.scss`)),
      renderBrand(target, resolved, target.ownIds, output)
    );
  }

  return files;
}

/* ------------------------------------------------------------------ *
 * Output baseline
 *
 * The generated partials are build output and are NOT committed. That leaves
 * nothing in the repository to compare the generator against: on a fresh
 * clone Jest's globalSetup writes the partials from `build()`, and a test
 * that then compares `build()` to those files compares the generator to
 * itself and cannot fail. Every CI run is a fresh clone, so "the generator's
 * output changed" was caught by nothing at all.
 *
 * tokens/output-baseline.json closes that. It is a lockfile: one SHA-256 per
 * emitted file, committed, and independent of whether the partials exist.
 * A full golden copy of the partials would say more on failure, but it is
 * ~1500 lines that churn on every legitimate colour change and it would
 * re-commit exactly the build output this PR stopped committing. The digest
 * says only THAT the output moved — which, paired with the contributor's own
 * `git diff` of tokens/ and of the regenerated partials, is enough.
 *
 * Update it deliberately, in the same commit as the token change:
 *
 *     node scripts/build-tokens.cjs --baseline
 * ------------------------------------------------------------------ */
const BASELINE_NOTE =
  'GENERATED FILE - DO NOT EDIT BY HAND. SHA-256 of every file ' +
  'scripts/build-tokens.cjs emits. The generated partials are not committed, ' +
  'so this is the only committed record of what the generator produces. ' +
  'Regenerate with `node scripts/build-tokens.cjs --baseline` in the same ' +
  'commit as the tokens/*.yaml change that moved it. ' +
  'MERGE CONFLICTS: never resolve one by hand or by picking a side on ' +
  'merit - these values are a function of the generator and the token ' +
  'sources, not of either branch\'s intent, so a hand-merged digest is ' +
  'simply wrong. Take either side to clear the conflict, then re-run ' +
  '--baseline and commit what it writes. A branch that changes what the ' +
  'generator emits (for example by adding a mixin) will legitimately have ' +
  'its own baseline, and taking the other side without re-running leaves a ' +
  'digest that no longer describes anything.';

function digest(contents) {
  return crypto.createHash('sha256').update(contents, 'utf8').digest('hex');
}

/** The baseline document for a build's output. */
function baselineOf(files) {
  return {
    $comment: BASELINE_NOTE,
    algorithm: 'sha256',
    files: Object.fromEntries(
      [...files].map(([relative, contents]) => [relative, digest(contents)])
    ),
  };
}

function readBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) {
    throw new TokenError(
      `${path.relative(ROOT, BASELINE_PATH)} is missing. Recreate it with ` +
        '`node scripts/build-tokens.cjs --baseline`.'
    );
  }
  return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
}

function writeBaseline(files = build()) {
  const contents = `${JSON.stringify(baselineOf(files), null, 2)}\n`;
  if (
    fs.existsSync(BASELINE_PATH) &&
    fs.readFileSync(BASELINE_PATH, 'utf8') === contents
  ) {
    return false;
  }
  fs.writeFileSync(BASELINE_PATH, contents);
  return true;
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */
function main(argv) {
  if (argv.includes('--baseline')) {
    const relative = path.relative(ROOT, BASELINE_PATH);
    process.stdout.write(
      writeBaseline()
        ? `build-tokens: wrote ${relative}\n`
        : `build-tokens: ${relative} already matches the generator\n`
    );
    return;
  }

  const check = argv.includes('--check');
  const files = build();
  const stale = [];

  for (const [relative, contents] of files) {
    const absolute = path.join(ROOT, relative);
    const current = fs.existsSync(absolute)
      ? fs.readFileSync(absolute, 'utf8')
      : null;
    // Only write when the content actually changed. Rewriting identical bytes
    // still bumps mtime, which makes webpack rebuild and invalidates the chunk
    // hash held by any open Storybook tab, producing a ChunkLoadError loop.
    if (current === contents) continue;
    if (check) {
      stale.push(relative);
      continue;
    }
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, contents);
    process.stdout.write(`build-tokens: wrote ${relative}\n`);
  }

  if (check && stale.length > 0) {
    process.stderr.write(
      'build-tokens: generated files are stale:\n' +
        stale.map(file => `  ${file}\n`).join('') +
        'Run `yarn build:tokens`.\n'
    );
    process.exitCode = 1;
  }
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`build-tokens: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  build,
  TokenError,
  BASELINE_PATH,
  baselineOf,
  readBaseline,
  writeBaseline,
};
