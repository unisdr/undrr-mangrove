'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const ASSET = 'examples/figma-plugin/holistic/assets/tree/';
const PROVENANCE =
  '16bc6a8cfb8feffb340ae28dc77b1e8f89258b072fc3f55ee5f708b7c121f33b';
const CONTEXTS = [
  'default',
  'default-collapsed',
  'default-expanded',
  'with-links',
  'with-links-hover',
  'custom-toggle-icon',
  'hydrated-from-html',
];
function buildTreeRecipes({ root, modes, variables, styles }) {
  const target = { variables, styles };
  variables = structuredClone(variables);
  styles = structuredClone(styles);
  const fail = s => {
      throw Error('Tree source changed: ' + s);
    },
    read = f => fs.readFileSync(path.join(root, f)),
    sha = b => crypto.createHash('sha256').update(b).digest('hex');
  if (sha(read(ASSET + 'provenance.json')) !== PROVENANCE) fail('provenance');
  const prov = JSON.parse(read(ASSET + 'provenance.json'));
  for (const [f, h] of Object.entries(prov.sourceHashes))
    if (sha(read(f)) !== h) fail(f);
  for (const [f, h] of Object.entries(prov.assets))
    if (sha(read(ASSET + f)) !== h) fail(f);
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('five modes');
  for (const expected of JSON.parse(read(ASSET + 'foundation-contract.json'))) {
    const matches = variables.filter(
      v => v.id === expected.id || v.name === expected.name
    );
    const v = matches[0];
    if (
      matches.length !== 1 ||
      !v ||
      ['id', 'name', 'type', 'values'].some(
        k => JSON.stringify(v[k]) !== JSON.stringify(expected[k])
      )
    )
      fail('foundation ' + expected.name);
  }
  const resolve = (name, m, type, seen = new Set()) => {
    if (seen.has(name)) fail('cycle ' + name);
    seen.add(name);
    const v = variables.find(v => v.name === name);
    if (!v || v.type !== type) fail('missing/wrong ' + name);
    const x = v.values[m.id];
    if (x == null) fail('mode ' + name);
    return x.alias ? resolve(x.alias, m, type, seen) : x;
  };
  const per = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  const upsert = (list, e) => {
    const hits = list.filter(v => v.id === e.id || v.name === e.name);
    if (hits.length > 1 || hits.some(v => v.id !== e.id || v.name !== e.name))
      fail('foreign identity ' + e.id);
    if (list === variables) {
      if (hits.some(v => v.type !== e.type)) fail('foreign variable type');
    } else {
      const kind = list === styles.text ? 'TEXT' : 'EFFECT',
        other = list === styles.text ? styles.effect : styles.text;
      if (other.some(v => v.id === e.id || v.name === e.name))
        fail('foreign style kind');
      for (const v of hits) {
        if (v.type !== undefined && v.type !== kind)
          fail('foreign explicit style kind');
        if (
          !v.values ||
          Object.keys(v.values).sort().join(',') !==
            modes
              .map(m => m.id)
              .sort()
              .join(',')
        )
          fail('foreign mode shape');
        for (const m of modes) {
          const x = v.values[m.id];
          if (
            kind === 'TEXT'
              ? !x ||
                typeof x !== 'object' ||
                Array.isArray(x) ||
                !x.fontName ||
                typeof x.fontName !== 'object' ||
                Array.isArray(x.fontName) ||
                typeof x.fontName.family !== 'string' ||
                !x.fontName.family.trim() ||
                typeof x.fontName.style !== 'string' ||
                !x.fontName.style.trim()
              : !Array.isArray(x)
          )
            fail('foreign style shape');
        }
      }
    }
    if (hits.length) list[list.indexOf(hits[0])] = e;
    else list.push(e);
  };
  const role = (slug, type, fn) => {
    const name = 'component/tree/' + slug,
      values = per(fn);
    for (const x of Object.values(values))
      if (type === 'FLOAT' && !Number.isFinite(x)) fail('finite role ' + slug);
    upsert(variables, {
      id: name.replaceAll('/', '.'),
      name,
      type,
      values,
      scopes: ['ALL_SCOPES'],
    });
    return name;
  };
  const cssColor = s => {
    const a = /^rgba?\(([^)]+)\)$/.exec(s);
    if (!a) fail('source paint ' + s);
    const n = a[1].split(',').map(Number);
    if (n.some(v => !Number.isFinite(v))) fail('source paint channels');
    return { r: n[0] / 255, g: n[1] / 255, b: n[2] / 255, a: n[3] ?? 1 };
  };
  const sameRGB = (a, b) =>
    ['r', 'g', 'b'].every(
      k => Math.round(a[k] * 255) === Math.round(b[k] * 255)
    );
  const cases = JSON.parse(read(ASSET + 'source-footprints.json')).cases,
    variants = [];
  if (Object.keys(cases).length !== 70) fail('70 actual source cases');
  for (const context of CONTEXTS)
    for (const viewport of [390, 1164]) {
      const key = context + '-' + viewport,
        source = m => cases[m.id + '-' + key],
        sample = source(modes[0]);
      if (!sample || sample.viewport.width !== viewport) fail('source context');
      for (const m of modes) {
        const s = source(m);
        if (
          !s ||
          s.items.map(i => i.id).join(',') !==
            sample.items.map(i => i.id).join(',')
        )
          fail('source anatomy');
        for (const i of s.items) {
          if (
            i.label.style.opacity !== '1' ||
            i.container.style.opacity !== '1'
          )
            fail('source opacity');
          if (
            parseFloat(i.label.style.fontSize) !==
              resolve('font-size/300', m, 'FLOAT') ||
            !i.label.style.fontFamily.includes(
              resolve('font-family/ui', m, 'STRING')
            )
          )
            fail('source label font');
          if (
            !sameRGB(
              cssColor(i.label.style.color),
              resolve('color/text', m, 'COLOR')
            )
          )
            fail('source label color');
          if (
            parseFloat(i.container.style.borderRadius) !==
            resolve('radius/button', m, 'FLOAT')
          )
            fail('source radius');
        }
      }
      const children = [],
        links = [];
      const absolute = (slug, rect, origin) => ({
        horizontal: 'START',
        vertical: 'START',
        offsetX: role(
          key + '/' + slug + '/x',
          'FLOAT',
          m => rect(m).x - origin(m).x
        ),
        offsetY: role(
          key + '/' + slug + '/y',
          'FLOAT',
          m => rect(m).y - origin(m).y
        ),
      });
      const dimensions = (slug, rect) => ({
        width: role(key + '/' + slug + '/width', 'FLOAT', m => rect(m).width),
        height: role(
          key + '/' + slug + '/height',
          'FLOAT',
          m => rect(m).height
        ),
      });
      const byId = (m, id) => source(m).items.find(i => i.id === id),
        origin = m => source(m).root.rect;
      for (const item of sample.items) {
        const get = m => byId(m, item.id),
          r = m => get(m).container.rect,
          slug = 'item-' + item.id;
        const paint = role(key + '/' + slug + '/surface', 'COLOR', m => {
          const i = get(m),
            c = cssColor(i.container.style.backgroundColor),
            interactive = resolve('color/interactive', m, 'COLOR');
          if (c.a !== 0) {
            const expected = i.selected === 'true' ? 0.12 : 0.06;
            if (Math.abs(c.a - expected) > 1e-9 || !sameRGB(c, interactive))
              fail('source state tint');
            return { ...interactive, a: expected };
          }
          return { r: 0, g: 0, b: 0, a: 0 };
        });
        const labelRect = m => get(m).label.rect,
          styleId = 'component.tree.' + key + '.' + item.id + '.label';
        upsert(styles.text, {
          id: styleId,
          name: 'Mangrove/Source Tree/' + key + '/' + item.id,
          bindings: { fontFamily: 'font-family/ui', fontSize: 'font-size/300' },
          values: per(m => ({
            fontName: {
              family: resolve('font-family/ui', m, 'STRING'),
              style:
                get(m).label.style.fontWeight === '700' ? 'Bold' : 'Regular',
            },
            fontSize: resolve('font-size/300', m, 'FLOAT'),
            lineHeight: {
              unit: 'PIXELS',
              value: parseFloat(get(m).label.style.lineHeight),
            },
          })),
        });
        const label = {
          id: slug + '-label',
          type: 'TEXT',
          characters: item.label.text,
          textProperty: 'Tree/' + context + '/' + viewport + '/' + item.id,
          textStyle: styleId,
          fill: 'color/text',
          layout: dimensions(slug + '/label', labelRect),
          absolute: absolute(slug + '/label', labelRect, r),
        };
        if (item.href) {
          label.textDecoration = 'UNDERLINE';
          const offsets = m =>
            parseFloat(get(m).label.style.textUnderlineOffset);
          if (modes.some(m => Math.abs(offsets(m) - 2.4) > 0.001))
            fail('source link offset');
          label.textDecorationOffset = { unit: 'PIXELS', value: 2.4 };
          const t = item.label.style.textDecorationThickness;
          if (t !== 'auto') {
            if (parseFloat(t) !== 2) fail('source hovered thickness');
            label.textDecorationThickness = { unit: 'PIXELS', value: 2 };
          }
          links.push({
            itemId: item.id,
            sourceHref: item.href,
            editableNativeHyperlink: false,
          });
        }
        const row = {
          id: slug,
          type: 'FRAME',
          fill: paint,
          bindings: { cornerRadius: 'radius/button' },
          layout: {
            mode: 'VERTICAL',
            ...dimensions(slug, r),
            clipsContent: false,
          },
          absolute: absolute(slug, r, origin),
          children: [label],
        };
        children.push(row);
        if (item.icon) {
          const getMirror = m => source(m).pseudoMirrors[item.id];
          let markup = decodeURIComponent(
            item.icon.pseudo.maskImage.match(/data:image\/svg\+xml,(.*)"\)$/)[1]
          )
            .replaceAll("'", '"')
            .replaceAll('currentColor', '#000000');
          if (!markup.includes('d="M5 12h14M12 5l7 7-7 7"'))
            fail('source arrow bytes');
          const expanded = item.expanded === 'true';
          if (expanded)
            markup = markup
              .replace('<path', '<g transform="rotate(90 12 12)"><path')
              .replace('</svg>', '</g></svg>');
          for (const m of modes) {
            const mirror = getMirror(m);
            if (
              !mirror ||
              mirror.pseudo.width !== 12 ||
              mirror.pseudo.height !== 12 ||
              get(m).icon.style.transform !==
                (expanded ? 'matrix(0, 1, -1, 0, 0, 0)' : 'none')
            )
              fail('source mask viewport/rotation');
          }
          const glyphRect = m => {
            const i = get(m).icon.rect,
              p = getMirror(m);
            return {
              x: i.x + p.offset.x,
              y: i.y + p.offset.y,
              width: 12,
              height: 12,
            };
          };
          row.children.push({
            id: slug + '-toggle-arrow-slot',
            type: 'FRAME',
            fill: null,
            layout: { mode: 'VERTICAL', width: 12, height: 12 },
            absolute: absolute(slug + '/toggle-arrow', glyphRect, r),
            children: [
              {
                id: slug + '-toggle-arrow',
                type: 'SVG',
                svg: {
                  assetId:
                    'tree.arrow.' + (expanded ? 'expanded' : 'collapsed'),
                  markup,
                  monochrome: { strokes: 'color/text' },
                },
                layout: { width: 12, height: 12 },
              },
            ],
          });
        }
        if (item.group) {
          const gr = m => get(m).group.rect,
            groupHeight = item.group.rect.height;
          if (
            modes.some(
              m =>
                get(m).group.rect.height !== groupHeight ||
                get(m).group.style.borderLeftWidth !== '1px' ||
                get(m).group.style.borderLeftStyle !== 'dashed' ||
                !sameRGB(
                  cssColor(get(m).group.style.borderLeftColor),
                  resolve('color/neutral-300', m, 'COLOR')
                )
            )
          )
            fail('source dashed guide');
          const guide = m => ({ ...gr(m), width: 1 });
          children.push({
            id: slug + '-guide-slot',
            type: 'FRAME',
            fill: null,
            layout: { mode: 'VERTICAL', width: 1, height: groupHeight },
            absolute: absolute(slug + '/guide', guide, origin),
            children: [
              {
                id: slug + '-guide',
                type: 'SVG',
                svg: {
                  assetId: 'tree.guide.candidate.' + groupHeight,
                  markup:
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 ' +
                    groupHeight +
                    '" fill="none" stroke="#000000" stroke-width="1"><path d="M.5 0V' +
                    groupHeight +
                    '" stroke-dasharray="3 3"/></svg>',
                  monochrome: { strokes: 'color/neutral-300' },
                },
                layout: { width: 1, height: groupHeight },
              },
            ],
          });
        }
      }
      variants.push({
        id: 'tree.' + key,
        name: 'Context=' + context + ', SourceViewport=' + viewport,
        properties: {
          Context: context,
          SourceViewport: String(viewport),
          Locale: 'English',
        },
        sourceLinks: links,
        sourceItemIds: sample.items.map(i => i.id),
        tree: {
          id: 'root',
          type: 'FRAME',
          fill: null,
          layout: {
            mode: 'VERTICAL',
            ...dimensions('root', m => source(m).root.rect),
            clipsContent: false,
          },
          children,
        },
      });
    }
  target.variables.splice(0, target.variables.length, ...variables);
  for (const kind of ['text', 'effect'])
    target.styles[kind].splice(0, target.styles[kind].length, ...styles[kind]);
  return [
    {
      id: 'tree',
      name: 'Mangrove/Source Tree',
      kind: 'component-set',
      review: { preserveVariantSizing: true, genericLabels: false },
      sourceRef: {
        file: 'stories/Components/Navigation/Tree/Tree.jsx',
        line: 128,
      },
      limitations: [
        'Finite authored English source stories and captured toggled/hovered states, not generic arbitrary hierarchy or responsive reflow.',
        'Source relative/hash links retained as metadata; native hyperlink navigation is unverified.',
        'Exact CSS-mask arrow path and measured pseudo viewport; dashed-guide 3/3 SVG cadence is a candidate, not source-authored dash lengths or browser/native raster acceptance.',
        'Short label edits retain content without arbitrary hierarchy/wrapping or RTL anchoring claims. Keyboard/focus/selection callbacks, hydration, navigation and reduced motion remain runtime gates.',
      ],
      variants,
    },
  ];
}
module.exports = { buildTreeRecipes };
