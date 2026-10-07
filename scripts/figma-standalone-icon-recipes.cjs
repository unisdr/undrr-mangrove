'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert/strict'),
  crypto = require('crypto'),
  vm = require('vm'),
  zlib = require('zlib');
const copy = x => JSON.parse(JSON.stringify(x)),
  sha = b => crypto.createHash('sha256').update(b).digest('hex');
const modes = ['undrr', 'delta', 'irp', 'mcr', 'preventionweb'];
function preserveOriginalPaint(row) {
  let s = row.normalizedMarkup;
  const rewrites = row.paintRewrites;
  let index = 0;
  s = s.replace(
    /\b(fill|stroke)=(['"])([^'"]*)\2/g,
    (full, field, q, value) => {
      if (value === 'none') return full;
      const r = rewrites[index++];
      assert(r && r.field === field && r.replacement === value);
      return field + '=' + q + r.original + q;
    }
  );
  assert.equal(index, rewrites.length);
  return s;
}
function buildStandaloneIconRecipes({
  root,
  modes: declared,
  variables,
  styles,
}) {
  const fail = m => {
    throw Error('Standalone Icon source: ' + m);
  };
  const manifest = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        '../examples/figma-plugin/holistic/assets/standalone-icon/provenance.json'
      )
    )
  );
  const assetRoot = path.join(
    __dirname,
    '../examples/figma-plugin/holistic/assets/standalone-icon'
  );
  function readAsset(f) {
    const entry = manifest.archives[f];
    if (!entry) fail('archive declaration ' + f);
    const bytes = fs.readFileSync(path.join(assetRoot, entry.path));
    if (
      bytes.length !== entry.archive.bytes ||
      sha(bytes) !== entry.archive.sha256
    )
      fail('archive ' + f);
    const raw = entry.path.endsWith('.gz') ? zlib.gunzipSync(bytes) : bytes;
    if (raw.length !== entry.raw.bytes || sha(raw) !== entry.raw.sha256)
      fail('restored raw ' + f);
    return raw;
  }
  if (
    declared
      .map(x => x.id)
      .sort()
      .join(',') !== [...modes].sort().join(',')
  )
    fail('five exact modes');
  for (const [f, p] of Object.entries(manifest.inputPins)) {
    const b = readAsset(f);
    if (b.length !== p.bytes || sha(b) !== p.sha256) fail('input ' + f);
  }
  for (const [f, p] of Object.entries(manifest.sourcePins)) {
    const b = fs.readFileSync(root + '/' + f);
    if (b.length !== p.bytes || sha(b) !== p.sha256) fail('source ' + f);
  }
  const profiles = JSON.parse(
    readAsset('source-recipe-projection/actual-source-contract-profiles.json')
  );
  for (const [f, p] of Object.entries(profiles.rawPins)) {
    const b = readAsset('icons-browser/' + f);
    if (b.length !== p.bytes || sha(b) !== p.sha256) fail('raw ' + f);
  }
  const normal = JSON.parse(
      readAsset('v2-style-flattening/normalized-icon-masks.json')
    ),
    rows = new Map(normal.rows.map(x => [x.name, x]));
  const builder = fs.readFileSync(
    root + '/examples/figma-plugin/kit-builder.js',
    'utf8'
  );
  if (sha(builder) !== manifest.builder.sha256)
    fail('reviewed SVG planner changed');
  const start = builder.indexOf('function mgSvgPlan(tree) {'),
    end = builder.indexOf('\nfunction mgSvgTopology(node)', start),
    plan = vm.runInNewContext(builder.slice(start, end) + '\nmgSvgPlan', {});
  const vars = copy(variables),
    names = new Map(vars.map(x => [x.name, x])),
    ids = new Map(vars.map(x => [x.id, x]));
  if (names.size !== vars.length || ids.size !== vars.length)
    fail('variable identity collision');
  for (const [kind, type] of [
    ['text', 'TEXT'],
    ['effect', 'EFFECT'],
  ]) {
    if (!Array.isArray(styles[kind])) fail('style array');
    for (const s of styles[kind]) {
      if (s.type !== undefined && s.type !== type) fail('style kind');
      if (
        Object.keys(s.values || {})
          .sort()
          .join(',') !== [...modes].sort().join(',')
      )
        fail('style modes');
      for (const v of Object.values(s.values)) {
        if (
          kind === 'text' &&
          (!v ||
            Array.isArray(v) ||
            !v.fontName ||
            typeof v.fontName.family !== 'string' ||
            !v.fontName.family.trim() ||
            typeof v.fontName.style !== 'string' ||
            !v.fontName.style.trim())
        )
          fail('TEXT fontName');
        if (kind === 'effect' && !Array.isArray(v)) fail('EFFECT array');
      }
    }
  }
  function resolve(name, mode, seen = new Set()) {
    const v = names.get(name) || ids.get(name);
    if (!v || v.type !== 'COLOR' || seen.has(v.id))
      fail('typed COLOR alias ' + name);
    seen.add(v.id);
    const x = v.values?.[mode];
    if (x?.alias) return resolve(x.alias, mode, seen);
    if (
      !x ||
      !['r', 'g', 'b'].every(
        k => Number.isFinite(x[k]) && x[k] >= 0 && x[k] <= 1
      ) ||
      (x.a !== undefined && (!Number.isFinite(x.a) || x.a < 0 || x.a > 1))
    )
      fail('COLOR ' + name);
    return x;
  }
  function rgba(s) {
    const x = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(s);
    if (!x) fail('captured RGB ' + s);
    return { r: +x[1] / 255, g: +x[2] / 255, b: +x[3] / 255, a: 1 };
  }
  function roleFor(p, i, values) {
    if (p.multicolorOriginalPaint) return null;
    let role;
    const util = (p.classes + ' ' + p.parentClasses).match(
      /mg-u-color--([\w-]+)/
    );
    if (util) role = 'color/' + util[1];
    else if (p.parentClasses === 'mg-tag') role = 'color/neutral-0';
    else if (p.parentClasses === 'mg-cta') role = 'color/interactive';
    else if (i >= 10 && i <= 13) {
      role = 'component/standalone-icon/inline-' + p.name;
      const record = {
        id: role,
        name: role,
        type: 'COLOR',
        scopes: ['ALL_SCOPES'],
        values,
        description:
          'Authored Icons.stories.jsx inline colour; captured literal all-mode paint, not inferred palette equality',
      };
      const existing = names.get(role);
      if (existing) assert.deepEqual(existing, record);
      else {
        vars.push(record);
        names.set(role, record);
        ids.set(role, record);
      }
      return role;
    } else role = 'color/text';
    for (const mode of modes) {
      const actual = resolve(role, mode),
        expected = values[mode];
      for (const k of ['r', 'g', 'b'])
        if (Math.round(actual[k] * 255) !== Math.round(expected[k] * 255))
          fail('authored paint role ' + role + ' ' + mode);
      if ((actual.a ?? 1) !== 1) fail('paint alpha ' + role);
    }
    return role;
  }
  const variants = profiles.profiles.map((p, i) => {
    const byMode = {};
    for (const o of p.observations) {
      const mode = modes.find(m => o.sourceKey.includes('-' + m + '-'));
      if (!mode) fail('observation mode');
      const value = rgba(o.sourcePaint.color);
      if (byMode[mode]) assert.deepEqual(byMode[mode], value);
      else byMode[mode] = value;
      if (
        !p.multicolorOriginalPaint &&
        o.sourcePaint.color !== o.sourcePaint.backgroundColor
      )
        fail('currentColor background');
      assert.equal(o.sourceRect.width, parseFloat(p.geometry.width));
      if (o.sourceRect.height <= 0 || !Number.isFinite(o.sourceRect.height))
        fail('owner height');
      assert.equal(o.sourceRect.height, p.observations[0].sourceRect.height);
    }
    assert.equal(Object.keys(byMode).length, 5);
    assert.equal(p.geometry['mask-size'], 'contain');
    assert.equal(p.geometry['mask-position'], '50% 50%');
    assert.equal(p.geometry['mask-repeat'], 'no-repeat');
    const row = rows.get(p.name);
    assert(row);
    let markup = p.multicolorOriginalPaint
      ? preserveOriginalPaint(row)
      : row.normalizedMarkup;
    const flipped = p.geometry.transform === 'matrix(-1, 0, 0, 1, 0, 0)';
    if (!flipped && p.geometry.transform !== 'none') fail('transform');
    if (flipped) {
      const [x, y, w] = row.viewBox;
      markup = markup.replace(
        /(<svg\b[^>]*>)([\s\S]*)(<\/svg>)$/,
        (_, a, b, c) =>
          a +
          `<g transform="translate(${2 * x + w} 0) scale(-1 1)">` +
          b +
          '</g>' +
          c
      );
    }
    const [x, y, w, h] = row.viewBox,
      ownerWidth = parseFloat(p.geometry.width),
      glyphHeight = parseFloat(p.geometry.height),
      ownerHeight = p.observations[0].sourceRect.height,
      scale = Math.min(ownerWidth / w, glyphHeight / h),
      width = w * scale,
      height = h * scale;
    const role = roleFor(p, i, byMode),
      svg = { assetId: 'standalone.icon.' + i + '.' + p.name, markup };
    const leaf = {
      id: 'artwork',
      type: 'SVG',
      name: p.name,
      layout: { width, height },
      position: { x: (ownerWidth - width) / 2, y: (glyphHeight - height) / 2 },
      svg,
    };
    if (role) {
      const fields = [];
      for (const field of ['fills', 'strokes'])
        try {
          plan({ ...leaf, svg: { ...svg, monochrome: { [field]: role } } });
          fields.push(field);
        } catch (e) {
          if (!e.message.includes('needs exactly one source paint colour'))
            throw e;
        }
      if (!fields.length) fail('paint coverage');
      svg.monochrome = Object.fromEntries(fields.map(f => [f, role]));
    }
    plan(leaf);
    return {
      id: 'icon-contract-' + i,
      name: 'Contract=' + i,
      properties: { Contract: String(i) },
      sourceContract: {
        name: p.name,
        classes: p.classes,
        parentClasses: p.parentClasses,
        observations: copy(p.observations),
        geometry: copy(p.geometry),
        paintRole: role,
        paintProvenance: p.multicolorOriginalPaint
          ? 'Original multicolour SVG paint; no monochrome binding'
          : i >= 10 && i <= 13
            ? 'Inline authored literal'
            : p.parentClasses === 'mg-tag'
              ? 'Tag foreground authored neutral-0'
              : p.parentClasses === 'mg-cta'
                ? 'Inherited real link interactive role'
                : 'Authored utility or body text role',
        multicolorOriginalPaint: p.multicolorOriginalPaint,
        sourceMarkupSHA256: row.sourceSHA256,
        normalizedMaskSHA256: row.normalizedSHA256,
        sourceOnly: true,
        ownerHeight,
        glyphHeight,
        inlineBaselinePlacement:
          'Unmeasured pseudo clientRect; source glyph viewport START candidate, no exact inline-baseline placement claim',
      },
      tree: {
        id: 'root',
        type: 'FRAME',
        name: p.name + ' owning source box',
        layout: {
          mode: 'VERTICAL',
          width: ownerWidth,
          height: ownerHeight,
          clipsContent: false,
        },
        fill: null,
        children: [leaf],
      },
    };
  });
  assert.equal(variants.length, 131);
  const family = {
    id: 'standalone-icon-source-candidate',
    kind: 'component-set',
    name: 'Standalone Icon source candidate',
    review: { preserveVariantSizing: true, genericLabels: false },
    defaultVariant: variants[16].id,
    variants,
    limitations: [
      'Finite captured source contracts only; arbitrary em sizing, inline baseline placement, Font Awesome and forced-colour or print rendering remain unverified.',
      'SVG mask geometry and original multicolour paint are source candidates; native raster parity, reusable-instance rendering and publication are not accepted.',
    ],
  };
  variables.splice(0, variables.length, ...vars);
  return [family];
}
module.exports = { buildStandaloneIconRecipes, preserveOriginalPaint };
