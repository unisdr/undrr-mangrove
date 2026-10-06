'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const here = path.join(
    __dirname,
    '../examples/figma-plugin/holistic/assets/semantic-code'
  ),
  sha = b => crypto.createHash('sha256').update(b).digest('hex');
const PROFILE_SHA =
  'a081412517cc46db009c8d814a31eb104be34c543ae6424df30cf578a4aea269';
const GUARD_SHA =
  'ed7e66e7c50c012c3dbd47c8bbbf8e17a5917271ab41b2809dd1bc7a1e76180d';
function buildFiniteCodeRecipes({ root, modes, variables, styles }) {
  const original = { variables, styles };
  variables = structuredClone(variables);
  styles = structuredClone(styles);
  const fail = s => {
      throw Error('Finite Code source contract: ' + s);
    },
    read = f => fs.readFileSync(f);
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('all five modes');
  if (sha(read(path.join(here, 'profiles.json'))) !== PROFILE_SHA)
    fail('profiles changed');
  if (sha(read(path.join(here, 'source-guards.json'))) !== GUARD_SHA)
    fail('source guard manifest');
  const guard = JSON.parse(read(path.join(here, 'source-guards.json')));
  for (const [f, h] of Object.entries(guard.sourceHashes))
    if (sha(read(path.join(root, f))) !== h) fail('current source ' + f);
  for (const [f, h] of Object.entries(guard.fontAndSourceAssets))
    if (sha(read(path.join(root, f))) !== h) fail('font/source asset ' + f);
  for (const kind of ['text', 'effect'])
    for (const s of styles[kind]) {
      if (
        s.type !== undefined &&
        s.type !== (kind === 'text' ? 'TEXT' : 'EFFECT')
      )
        fail('style kind');
      if (
        !s.values ||
        Object.keys(s.values).sort().join(',') !==
          modes
            .map(m => m.id)
            .sort()
            .join(',')
      )
        fail('style all modes');
      for (const v of Object.values(s.values)) {
        if (
          kind === 'effect'
            ? !Array.isArray(v)
            : !v ||
              !v.fontName ||
              typeof v.fontName !== 'object' ||
              Array.isArray(v.fontName) ||
              typeof v.fontName.family !== 'string' ||
              !v.fontName.family.trim() ||
              typeof v.fontName.style !== 'string' ||
              !v.fontName.style.trim()
        )
          fail('style shape');
      }
    }
  const source = JSON.parse(read(path.join(here, 'profiles.json')));
  for (const [f, p] of Object.entries(source.rawPins)) {
    const b = require('zlib').gunzipSync(read(path.join(here, f)));
    if (b.length !== p.bytes || sha(b) !== p.sha256)
      fail('actual source pin ' + f);
  }
  const per = fn => Object.fromEntries(modes.map(m => [m.id, fn(m.id)]));
  const modeKeys = modes
    .map(m => m.id)
    .sort()
    .join(',');
  function resolve(name, mode, type, seen = new Set()) {
    if (seen.has(name)) fail('alias cycle');
    seen.add(name);
    const hits = variables.filter(v => v.name === name);
    if (hits.length !== 1 || hits[0].type !== type)
      fail('typed foundation ' + name);
    const v = hits[0].values?.[mode];
    if (v?.alias) return resolve(v.alias, mode, type, seen);
    if (type === 'STRING' && (typeof v !== 'string' || !v.trim()))
      fail('font family');
    if (
      type === 'COLOR' &&
      (!v ||
        ['r', 'g', 'b', 'a'].some(
          k => !Number.isFinite(v[k]) || v[k] < 0 || v[k] > 1
        ))
    )
      fail('typed color terminal');
    if (type === 'FLOAT' && !Number.isFinite(v)) fail('finite value');
    return v;
  }
  function upsert(list, e) {
    if (
      (list === styles.text &&
        styles.effect.some(v => v.id === e.id || v.name === e.name)) ||
      (list === styles.effect &&
        styles.text.some(v => v.id === e.id || v.name === e.name))
    )
      fail('cross-kind identity');
    const hits = list.filter(v => v.id === e.id || v.name === e.name);
    if (
      hits.length > 1 ||
      hits.some(
        v =>
          v.id !== e.id ||
          v.name !== e.name ||
          ('type' in e && v.type !== e.type)
      )
    )
      fail('foreign identity/kind');
    for (const v of list) {
      if (!v.values || Object.keys(v.values).sort().join(',') !== modeKeys)
        fail('all-mode values');
    }
    if (hits.length) list[list.indexOf(hits[0])] = e;
    else list.push(e);
  }
  function role(key, type, fn) {
    const name = 'component/semantic-code-finite/' + key;
    const values = per(fn);
    for (const mode of modes) {
      const v = values[mode.id];
      if (
        type === 'COLOR' &&
        (!v ||
          ['r', 'g', 'b', 'a'].some(
            k => !Number.isFinite(v[k]) || v[k] < 0 || v[k] > 1
          ))
      )
        fail('typed color terminal');
      if (type === 'FLOAT' && !Number.isFinite(v)) fail('finite field');
      if (type === 'STRING' && (typeof v !== 'string' || !v.trim()))
        fail('font field');
      if (
        type === 'COLOR' &&
        (!v ||
          ['r', 'g', 'b', 'a'].some(
            k => !Number.isFinite(v[k]) || v[k] < 0 || v[k] > 1
          ))
      )
        fail('paint field');
    }
    upsert(variables, {
      id: name.replaceAll('/', '.'),
      name,
      type,
      scopes:
        type === 'COLOR'
          ? ['ALL_FILLS', 'STROKE_COLOR']
          : type === 'STRING'
            ? ['FONT_FAMILY']
            : ['ALL_SCOPES'],
      values,
    });
    return name;
  }
  function rgba(s) {
    const v = /^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/.exec(s);
    if (!v) fail('source paint');
    return {
      r: +v[1] / 255,
      g: +v[2] / 255,
      b: +v[3] / 255,
      a: v[4] === undefined ? 1 : +v[4],
    };
  }
  function size(key, fn) {
    const xs = modes.map(m => fn(m.id));
    if (xs.some(v => !Number.isFinite(v) || v <= 0)) fail('source capacity');
    return xs.every(v => v === xs[0]) ? xs[0] : role(key, 'FLOAT', fn);
  }
  const variants = source.profiles.map(p => {
    const base = p.id,
      children = [],
      owner = m => p.owners[m];
    function box(id, rect) {
      return {
        id,
        type: 'FRAME',
        fill: null,
        layout: {
          mode: 'VERTICAL',
          width: size(base + '/' + id + '/width', m =>
            Math.max(rect(m).width, 1)
          ),
          height: size(base + '/' + id + '/height', m =>
            Math.max(rect(m).height, 1)
          ),
          gap: 0,
          clipsContent: false,
        },
        absolute: {
          horizontal: 'START',
          vertical: 'START',
          offsetX: role(
            base + '/' + id + '/x',
            'FLOAT',
            m => rect(m).x - owner(m).x
          ),
          offsetY: role(
            base + '/' + id + '/y',
            'FLOAT',
            m => rect(m).y - owner(m).y
          ),
        },
        children: [],
      };
    }
    for (let i = 0; i < p.boxes.length; i++) {
      const b = p.boxes[i],
        node = box('code-box-' + i, m => b.modes[m].rect);
      for (const m of modes) {
        const st = b.modes[m.id].style;
        if (
          st.opacity !== '1' ||
          parseFloat(st['padding-left']) !== 5 ||
          parseFloat(st['padding-right']) !== 5 ||
          parseFloat(st['padding-top']) !== 2.5 ||
          parseFloat(st['padding-bottom']) !== 2.5
        )
          fail('actual Code box padding/effects');
      }
      node.fill = role(base + '/box-' + i + '/paint', 'COLOR', m =>
        rgba(b.modes[m].style['background-color'])
      );
      node.layout.radius = size(base + '/box-' + i + '/radius', m =>
        parseFloat(b.modes[m].style['border-top-left-radius'])
      );
      const effectId =
        'component.semantic-code-finite.' + base + '.box-' + i + '.inset';
      const effectColor = role(
        base + '/box-' + i + '/inset-color',
        'COLOR',
        m => {
          const v = /^(rgba?\([^)]*\)) 0px 0px 0px 1px inset$/.exec(
            b.modes[m].style['box-shadow']
          );
          if (!v) fail('exact source inset outline');
          return rgba(v[1]);
        }
      );
      upsert(styles.effect, {
        id: effectId,
        name: 'Mangrove/Finite Source Code/' + base + '/box-' + i + '/inset',
        values: per(m => [
          {
            effect: {
              type: 'INNER_SHADOW',
              color: resolve(effectColor, m, 'COLOR'),
              offset: { x: 0, y: 0 },
              radius: 0,
              spread: 1,
              visible: true,
              blendMode: 'NORMAL',
            },
            bindings: { color: effectColor },
          },
        ]),
      });
      node.effectStyle = effectId;
      node.sourceInlineBox = {
        start: b.start,
        end: b.end,
        empty: b.characters.length === 0,
        sourcePadding: { inline: 5, block: 2.5 },
      };
      children.push(node);
    }
    for (let i = 0; i < p.parts.length; i++) {
      const part = p.parts[i],
        node = box('fragment-' + i, m => part.modes[m].rect),
        styleId = 'component.semantic-code-finite.' + base + '.fragment-' + i;
      const isCode = part.modes.undrr.parentTag === 'CODE';
      const fontRole = isCode
        ? role(base + '/fragment-' + i + '/family', 'STRING', () => 'Menlo')
        : p.locale === 'arabic'
          ? role(
              base + '/fragment-' + i + '/family',
              'STRING',
              () => 'Noto Sans Arabic'
            )
          : 'font-family/text';
      const fontSize = role(base + '/fragment-' + i + '/size', 'FLOAT', m =>
        parseFloat(part.modes[m].style['font-size'])
      );
      const values = per(m => {
        const s = part.modes[m].style,
          code = part.modes[m].parentTag === 'CODE';
        if (!code && !s['font-family'].includes(resolve(fontRole, m, 'STRING')))
          fail('source body family alias');
        if (
          s['font-style'] !== 'normal' ||
          s['text-transform'] !== 'none' ||
          s['letter-spacing'] !== 'normal' ||
          s['font-weight'] !== (code ? '500' : '400')
        )
          fail('source face semantics');
        return {
          fontName: {
            family: resolve(fontRole, m, 'STRING'),
            style: 'Regular',
          },
          fontSize: parseFloat(s['font-size']),
          lineHeight: { unit: 'PIXELS', value: parseFloat(s['line-height']) },
          letterSpacing: { unit: 'PIXELS', value: 0 },
          paragraphSpacing: 0,
        };
      });
      upsert(styles.text, {
        id: styleId,
        name: 'Mangrove/Finite Source Code/' + base + '/fragment-' + i,
        bindings: { fontFamily: fontRole, fontSize },
        values,
      });
      const paint = role(base + '/fragment-' + i + '/ink', 'COLOR', m =>
        rgba(part.modes[m].style.color)
      );
      node.children = [
        {
          id: 'fragment-text-' + i,
          type: 'TEXT',
          characters: part.characters,
          layout: { width: 'HUG', height: 'HUG' },
          textWrap: 'AUTO',
          textRuns: [
            {
              id: 'source-run',
              start: 0,
              end: part.characters.length,
              textStyle: styleId,
              fill: paint,
              textDecoration: 'NONE',
            },
          ],
          sourceLine: {
            paragraphId: 'semantic-code/' + base,
            paragraphCharacters: p.characters,
            start: part.start,
            end: part.end,
            lineIndex: i,
            lineCount: p.parts.length,
          },
        },
      ];
      node.sourceFragment = {
        start: part.start,
        end: part.end,
        sourceCollapsedWhitespace: !!part.sourceCollapsedWhitespace,
        capacityMinOneConstructionOnly: true,
        sourceFontWeight: part.modes.undrr.style['font-weight'],
        nativeCodeRegularFaceCandidate: part.modes.undrr.parentTag === 'CODE',
      };
      children.push(node);
    }
    return {
      id: 'semantic-code-finite.' + base,
      name: 'Locale=' + p.locale + ',SourceViewport=' + p.viewport,
      properties: { Locale: p.locale, SourceViewport: String(p.viewport) },
      sourceLogicalParagraph: {
        characters: p.characters,
        cuts: p.cuts,
        frozenCopy: true,
        fragmentLayout: true,
        arbitraryEditedReflow: false,
      },
      tree: {
        id: 'root',
        type: 'FRAME',
        fill: null,
        layout: {
          mode: 'VERTICAL',
          width: size(base + '/owner-width', m => owner(m).width),
          height: size(base + '/owner-height', m => owner(m).height),
          gap: 0,
          clipsContent: false,
        },
        children,
      },
    };
  });
  original.variables.splice(0, original.variables.length, ...variables);
  for (const k of ['text', 'effect'])
    original.styles[k].splice(0, original.styles[k].length, ...styles[k]);
  return [
    {
      id: 'semantic-code-finite',
      kind: 'component-set',
      review: { genericLabels: false, preserveVariantSizing: true },
      name: 'Semantic Code finite source fragments',
      properties: [
        { name: 'Locale', values: ['english', 'arabic', 'japanese'] },
        { name: 'SourceViewport', values: ['390', '1164'] },
      ],
      variants,
      limitations: [
        'Finite source fragment layout, not a reusable inline flow solver.',
        'Whole logical source paragraph preserved through contiguous UTF16 frozen-copy groups; changed copy requires reflow and refuses rebuild.',
        'Menlo Regular is an explicit requested-face candidate for authored system stack weight500; no face, weight500, font-byte or glyph matching acceptance.',
        'Collapsed whitespace with no Range box and zero-width spaces use a one-pixel construction owner only, with no ink or source box equivalence claim.',
        'Bidi/CJK baseline and native fragment capacity/raster remain unverified.',
      ],
    },
  ];
}
module.exports = { buildFiniteCodeRecipes };
