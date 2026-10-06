'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
function buildStandaloneLinkRecipes({ root, modes, variables, styles }) {
  const original = { variables, styles };
  variables = structuredClone(variables);
  styles = structuredClone(styles);
  const fail = s => {
    throw Error('Standalone Link source: ' + s);
  };
  const keys = modes
    .map(m => m.id)
    .sort()
    .join(',');
  if (keys !== 'delta,irp,mcr,preventionweb,undrr') fail('all five modes');
  const bytes = fs.readFileSync(
    path.join(
      root,
      'examples/figma-plugin/holistic/assets/standalone-link/profiles.json'
    )
  );
  if (sha(bytes) !== PROFILE_SHA) fail('profile provenance changed');
  const source = JSON.parse(bytes);
  for (const [name, pin] of Object.entries(source.sourcePins)) {
    const b = fs.readFileSync(path.join(root, name));
    if (b.length !== pin.bytes || sha(b) !== pin.sha256)
      fail('source/font ' + name);
  }
  for (const [name, pin] of Object.entries(source.rawPins)) {
    const b = require('zlib').gunzipSync(
      fs.readFileSync(
        path.join(
          root,
          'examples/figma-plugin/holistic/assets/standalone-link',
          name
        )
      )
    );
    if (b.length !== pin.bytes || sha(b) !== pin.sha256)
      fail('raw capture ' + name);
  }
  for (const [kind, expected] of [
    ['text', 'TEXT'],
    ['effect', 'EFFECT'],
  ]) {
    if (!Array.isArray(styles[kind])) fail('style array');
    for (const s of styles[kind]) {
      if (s.type !== undefined && s.type !== expected) fail('style kind');
      if (!s.values || Object.keys(s.values).sort().join(',') !== keys)
        fail('style modes');
      for (const value of Object.values(s.values)) {
        if (
          kind === 'effect'
            ? !Array.isArray(value)
            : !value ||
              !value.fontName ||
              Array.isArray(value.fontName) ||
              typeof value.fontName.family !== 'string' ||
              !value.fontName.family.trim() ||
              typeof value.fontName.style !== 'string' ||
              !value.fontName.style.trim()
        )
          fail('style shape');
      }
    }
  }
  const per = fn => Object.fromEntries(modes.map(m => [m.id, fn(m.id)]));
  function resolve(name, mode, type, seen = new Set()) {
    if (seen.has(name)) fail('alias cycle');
    seen.add(name);
    const hits = variables.filter(v => v.name === name);
    if (hits.length !== 1 || hits[0].type !== type) fail('typed role ' + name);
    const value = hits[0].values?.[mode];
    if (value && value.alias) return resolve(value.alias, mode, type, seen);
    if (type === 'STRING' && (typeof value !== 'string' || !value.trim()))
      fail('font terminal');
    if (type === 'FLOAT' && !Number.isFinite(value)) fail('finite terminal');
    if (
      type === 'COLOR' &&
      (!value ||
        ['r', 'g', 'b', 'a'].some(
          k => !Number.isFinite(value[k]) || value[k] < 0 || value[k] > 1
        ))
    )
      fail('paint terminal');
    return value;
  }
  function upsert(list, item) {
    const all = [...variables, ...styles.text, ...styles.effect],
      hits = all.filter(v => v.id === item.id || v.name === item.name);
    if (
      hits.length > 1 ||
      hits.some(
        v =>
          !list.includes(v) ||
          v.id !== item.id ||
          v.name !== item.name ||
          v.type !== item.type
      )
    )
      fail('foreign identity/kind');
    if (hits.length) list[list.indexOf(hits[0])] = item;
    else list.push(item);
  }
  function role(id, type, fn) {
    const name = 'component/standalone-link/' + id,
      values = per(fn);
    for (const value of Object.values(values)) {
      if (type === 'FLOAT' && !Number.isFinite(value))
        fail('finite source role');
      if (type === 'STRING' && (typeof value !== 'string' || !value.trim()))
        fail('source font role');
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
  function paintEquals(roleName, mode, css) {
    const match = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(css);
    if (!match) fail('source RGB');
    const v = resolve(roleName, mode, 'COLOR');
    if (
      v.a !== 1 ||
      ['r', 'g', 'b'].some((k, i) => Math.round(v[k] * 255) !== +match[i + 1])
    )
      fail('authored paint alias ' + roleName);
  }
  const variants = [];
  for (const p of source.profiles) {
    const base = p.locale + '-' + p.viewport + '-' + p.state,
      row = m => p.modes[m],
      rect = m => row(m).rect;
    const characters = row('undrr').text;
    if (!characters || modes.some(m => row(m.id).text !== characters))
      fail('logical copy');
    const family =
      p.locale === 'arabic'
        ? role(base + '/font-family', 'STRING', () => 'Noto Sans Arabic')
        : 'font-family/text';
    const size = role(base + '/font-size', 'FLOAT', m =>
      parseFloat(row(m).style['font-size'])
    );
    const color =
      p.state === 'hover' ? 'color/interactive-active' : 'color/interactive';
    for (const mode of modes) {
      const r = row(mode.id),
        s = r.style;
      if (
        s.direction !== (p.locale === 'arabic' ? 'rtl' : 'ltr') ||
        s['text-align'] !== 'start' ||
        s['unicode-bidi'] !== 'normal'
      )
        fail('source direction/start alignment');
      if (
        !s['font-family'].includes(resolve(family, mode.id, 'STRING')) ||
        s['font-weight'] !== '400' ||
        s['font-style'] !== 'normal' ||
        s['line-height'] !== '24px' ||
        s.opacity !== '1' ||
        s['letter-spacing'] !== 'normal'
      )
        fail('font/source semantics');
      if (
        !Number.isFinite(r.rect.width) ||
        r.rect.width <= 0 ||
        !Number.isFinite(r.rect.height) ||
        r.rect.height <= 0
      )
        fail('source owner capacity');
      if (
        r.attributes.find(a => a[0] === 'href')?.[1] !== '#' ||
        r.attributes.find(a => a[0] === 'title')?.[1] !== characters
      )
        fail('source href/title');
      if (
        s['text-decoration-line'] !==
          (p.state === 'idle' ? 'none' : 'underline') ||
        s['text-decoration-style'] !== 'solid' ||
        s['text-underline-offset'] !== 'auto' ||
        s['text-decoration-thickness'] !== 'auto'
      )
        fail('decoration semantics');
      paintEquals(color, mode.id, s.color);
      if (p.state === 'focusVisible') {
        paintEquals('color/focus-ring', mode.id, s['outline-color']);
        paintEquals('color/neutral-0', mode.id, 'rgb(255, 255, 255)');
        if (
          s['outline-style'] !== 'solid' ||
          parseFloat(s['outline-width']) !==
            resolve('focus-ring/width', mode.id, 'FLOAT') ||
          parseFloat(s['outline-offset']) !==
            resolve('focus-ring/offset', mode.id, 'FLOAT') ||
          s['box-shadow'] !== 'rgb(255, 255, 255) 0px 0px 0px 2px' ||
          resolve('focus-ring/offset', mode.id, 'FLOAT') !== 2
        )
          fail('two-band focus ring');
      } else if (s['box-shadow'] !== 'none' || s['outline-style'] !== 'none')
        fail('unexpected focus ink');
    }
    const sid = 'component.standalone-link.' + base + '.text';
    upsert(styles.text, {
      id: sid,
      name: 'Mangrove/Standalone Link/' + base + '/text',
      type: 'TEXT',
      bindings: { fontFamily: family, fontSize: size },
      values: per(m => ({
        fontName: { family: resolve(family, m, 'STRING'), style: 'Regular' },
        fontSize: resolve(size, m, 'FLOAT'),
        lineHeight: { unit: 'PIXELS', value: 24 },
        letterSpacing: { unit: 'PIXELS', value: 0 },
        paragraphSpacing: 0,
      })),
    });
    const width = role(base + '/owner-width', 'FLOAT', m => rect(m).width),
      height = role(base + '/owner-height', 'FLOAT', m => rect(m).height);
    const run = {
      id: 'logical-label',
      start: 0,
      end: characters.length,
      textStyle: sid,
      fill: color,
      textDecoration: p.state === 'idle' ? 'NONE' : 'UNDERLINE',
    };
    if (p.state !== 'idle') run.textDecorationOffset = { unit: 'AUTO' };
    const tree = {
      id: 'link-owner',
      type: 'FRAME',
      layout: {
        mode: 'HORIZONTAL',
        width,
        height,
        clipsContent: false,
        gap: 0,
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0,
      },
      children: [
        {
          id: 'label',
          type: 'TEXT',
          characters,
          textAlign: p.locale === 'arabic' ? 'RIGHT' : 'LEFT',
          layout: { width: 'HUG', height: 'HUG' },
          textWrap: 'AUTO',
          textRuns: [run],
          sourceLine: {
            paragraphId: 'standalone-link/' + base,
            paragraphCharacters: characters,
            start: 0,
            end: characters.length,
            lineIndex: 0,
            lineCount: 1,
          },
        },
      ],
    };
    if (p.state === 'focusVisible') {
      const zero = role(base + '/zero-radius', 'FLOAT', () => 0);
      tree.focusRing = {
        color: 'color/focus-ring',
        separatorColor: 'color/neutral-0',
        width: 'focus-ring/width',
        offset: 'focus-ring/offset',
        radius: zero,
        outerRadius: zero,
      };
    }
    variants.push({
      id: 'standalone-link.' + base,
      name:
        'Locale=' +
        p.locale +
        ',SourceViewport=' +
        p.viewport +
        ',State=' +
        p.state,
      properties: {
        Locale: p.locale,
        SourceViewport: String(p.viewport),
        State: p.state,
      },
      tree,
      sourceContract: {
        href: '#',
        title: characters,
        logicalCharacters: characters,
        sourceModes: per(m => ({
          ownerRect: rect(m),
          lineHeight: row(m).style['line-height'],
          attributes: row(m).attributes,
          language: row(m).language,
          direction: row(m).style.direction,
          textAlign: row(m).style['text-align'],
          rangeRects: row(m).rangeRects,
          characterRanges: row(m).characters,
        })),
        placeholderNativeHyperlinkOmitted: true,
        editedCopyReflowRefused: true,
      },
    });
  }
  if (variants.length !== 18) fail('complete source states');
  const family = {
    id: 'standalone-link',
    name: 'Standalone Link',
    kind: 'component-set',
    review: { genericLabels: false, preserveVariantSizing: true },
    description:
      'Genuine authored standalone Link story across locales, widths and recorded interaction states.',
    properties: [
      { name: 'Locale', values: ['english', 'arabic', 'japanese'] },
      { name: 'SourceViewport', values: ['390', '1164'] },
      { name: 'State', values: ['idle', 'hover', 'focusVisible'] },
    ],
    variants,
    limitations: [
      'Fixed source-owning capacities, not arbitrary inline reflow. Current-page edited main/linked logical labels require reflow and refuse rebuild before permanent writes.',
      'One whole logical editable TEXT per source label; native baseline/glyph/bidi/CJK/font byte and focus raster acceptance remain open.',
      'Actual source href# retained as placeholder metadata; no invented HTTPS URL, tooltip or runtime interaction.',
      'Source focus retains both genuine white separator and colored outline; native effect/outline raster acceptance remains open.',
    ],
  };
  original.variables.splice(0, original.variables.length, ...variables);
  original.styles.text.splice(0, original.styles.text.length, ...styles.text);
  original.styles.effect.splice(
    0,
    original.styles.effect.length,
    ...styles.effect
  );
  return [family];
}
const PROFILE_SHA =
  'affd08d82ba7706b8861e7cd83cd336f0cae7da417f0ecf2baa97fd63c94269a';
module.exports = { buildStandaloneLinkRecipes };
