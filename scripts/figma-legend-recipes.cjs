/** Actual authored Legend source appearances. Native rendering and responsive reflow remain open. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const ASSET = 'examples/figma-plugin/holistic/assets/legend/';
const PROVENANCE_HASH =
  '4725a00e5ed2d7f6ba750315d6eb1bd3ee47d1c476f1091c7a239f1e6e7f429d';
function buildLegendRecipes({ root, modes, variables, styles }) {
  const targets = { variables, styles };
  variables = JSON.parse(JSON.stringify(variables));
  styles = JSON.parse(JSON.stringify(styles));
  const fail = m => {
    throw Error('Figma Legend recipe needs updating: ' + m);
  };
  const read = f => fs.readFileSync(path.join(root, f)),
    sha = b => crypto.createHash('sha256').update(b).digest('hex');
  if (sha(read(ASSET + 'provenance.json')) !== PROVENANCE_HASH)
    fail('Provenance changed');
  for (const [f, h] of Object.entries(
    JSON.parse(read(ASSET + 'provenance.json')).sourceHashes
  ))
    if (sha(read(f)) !== h) fail(f + ' source changed');
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Expected five modes');
  const source = JSON.parse(read(ASSET + 'source-footprints.json'));
  const capturedFoundation = JSON.parse(
    read(ASSET + 'foundation-contract.json')
  );
  for (const expected of capturedFoundation) {
    const v = variables.find(v => v.name === expected.name);
    if (
      !v ||
      ['id', 'name', 'type', 'values'].some(
        k => JSON.stringify(v[k]) !== JSON.stringify(expected[k])
      )
    )
      fail('Captured foundation changed ' + expected.name);
  }
  const per = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  const resolve = (name, m, type, seen = new Set()) => {
    if (seen.has(name)) fail('Alias cycle ' + name);
    seen.add(name);
    const v = variables.find(v => v.name === name);
    if (!v || v.type !== type) fail('Missing ' + type + ' ' + name);
    const x = v.values[m.id];
    return x?.alias ? resolve(x.alias, m, type, seen) : x;
  };
  const upsert = (list, e) => {
    const found = list.filter(x => x.id === e.id || x.name === e.name);
    if (
      found.length > 1 ||
      (found.length && (found[0].id !== e.id || found[0].name !== e.name))
    )
      fail('Foreign identity ' + e.id);
    if (
      found.length &&
      ((e.type && found[0].type !== e.type) ||
        (!e.type &&
          modes.some(
            m =>
              Array.isArray(found[0].values?.[m.id]) !==
              Array.isArray(e.values[m.id])
          )))
    )
      fail('Foreign identity type ' + e.id);
    if (
      found.length &&
      !e.type &&
      (Object.keys(found[0].values || {})
        .sort()
        .join(',') !==
        modes
          .map(m => m.id)
          .sort()
          .join(',') ||
        modes.some(m => {
          const v = found[0].values?.[m.id];
          return list === styles.text
            ? !v ||
                Array.isArray(v) ||
                typeof v !== 'object' ||
                !v.fontName ||
                typeof v.fontName !== 'object' ||
                Array.isArray(v.fontName) ||
                typeof v.fontName.family !== 'string' ||
                !v.fontName.family.trim() ||
                typeof v.fontName.style !== 'string' ||
                !v.fontName.style.trim()
            : !Array.isArray(v);
        }))
    )
      fail('Foreign style shape ' + e.id);
    if (list === styles.text || list === styles.effect) {
      if (
        found.length &&
        found[0].type &&
        found[0].type !== (list === styles.text ? 'TEXT' : 'EFFECT')
      )
        fail('Foreign explicit style kind ' + e.id);
      const other = list === styles.text ? styles.effect : styles.text;
      if (other.some(x => x.id === e.id || x.name === e.name))
        fail('Foreign style kind ' + e.id);
    }
    if (found.length) list[list.indexOf(found[0])] = e;
    else list.push(e);
  };
  const ref = {
    file: 'stories/Components/DataViz/Legend/legend.scss',
    line: 9,
  };
  function role(key, type, fn, scopes = []) {
    const name = 'component/legend/' + key.replaceAll('.', '/');
    upsert(variables, {
      id: name.replaceAll('/', '.'),
      name,
      type,
      values: per(fn),
      scopes,
      sourceRef: ref,
      hiddenFromPublishing: false,
      description:
        'Finite actual source allocation/paint. Native and arbitrary edited reflow remain open.',
      codeSyntax: {},
    });
    return name;
  }
  const number = (key, fn, scopes = ['WIDTH_HEIGHT']) =>
    role(
      key,
      'FLOAT',
      m => {
        const x = fn(m);
        if (!Number.isFinite(x)) fail('Nonfinite ' + key);
        return x;
      },
      scopes
    );
  const rgba = s => {
    const match = /^rgba?\(([^)]+)\)$/.exec(s);
    if (!match) fail('Unsupported paint ' + s);
    const a = match[1].split(',').map(Number);
    return {
      r: a[0] / 255,
      g: a[1] / 255,
      b: a[2] / 255,
      a: a.length === 4 ? a[3] : 1,
    };
  };
  const normalColors = variables
    .filter(
      v =>
        v.type === 'COLOR' &&
        v.name.startsWith('color/') &&
        capturedFoundation.some(
          expected => expected.type === 'COLOR' && expected.name === v.name
        )
    )
    .map(v => v.name);
  const color = (key, fn, scope = 'ALL_FILLS') => {
    const values = per(m => rgba(fn(m)));
    const alias = normalColors.find(n =>
      modes.every(m => {
        const c = resolve(n, m, 'COLOR'),
          v = values[m.id];
        return ['r', 'g', 'b'].every(
          k => Math.round(c[k] * 255) === Math.round(v[k] * 255)
        );
      })
    );
    if (!alias) return role(key, 'COLOR', m => values[m.id], [scope]); // Exact captured UA paint, never a nearest palette substitution.
    return role(
      key,
      'COLOR',
      m => {
        const c = resolve(alias, m, 'COLOR'),
          v = values[m.id];
        return c.a === v.a ? { alias } : { ...c, a: v.a };
      },
      [scope]
    );
  };
  function textStyle(key, css) {
    const family = m =>
      css[m.id].fontFamily.includes('Condensed')
        ? 'font-family/ui'
        : 'font-family/text';
    const fontFamily = family(modes[0]);
    if (
      modes.some(
        m =>
          resolve(fontFamily, m, 'STRING') !==
          (fontFamily === 'font-family/ui' ? 'Roboto Condensed' : 'Roboto')
      )
    )
      fail('Source font family changed');
    if (modes.some(m => family(m) !== fontFamily))
      fail('Mode-specific font routing');
    const size = number(key + '/size', m => parseFloat(css[m.id].fontSize), [
        'FONT_SIZE',
      ]),
      id = 'component.legend.' + key + '.type';
    upsert(styles.text, {
      id,
      name: 'Mangrove/component/legend/' + key + '/type',
      source: ref,
      component: true,
      recommended: false,
      description:
        'Exact captured CSS size/line height. Bundled Regular/Bold face routing follows source font imports; CSS600 maps to Bold700 as explicit candidate; native title/label/tick baseline is a finite source-browser candidate. Native font/pixel matching remains open.',
      bindings: { fontFamily, fontSize: size },
      values: per(m => {
        const c = css[m.id];
        if (
          c.fontStyle !== 'normal' ||
          ![400, 500, 600, 700].includes(+c.fontWeight)
        )
          fail('Unsupported source font');
        const h = parseFloat(c.lineHeight);
        if (!Number.isFinite(h))
          fail('Source normal line-height needs measurement');
        return {
          fontName: {
            family: resolve(fontFamily, m, 'STRING'),
            style: +c.fontWeight >= 600 ? 'Bold' : 'Regular',
          },
          fontSize: parseFloat(c.fontSize),
          lineHeight: { unit: 'PIXELS', value: h },
        };
      }),
    });
    return id;
  }

  const css = n => source.styles[n.css],
    nodes = (all, fn) => per(m => fn(all[m.id], m));
  const zero = number('zero', () => 0),
    variants = [];
  function projection(key, id, all, origin) {
    const n = all.undrr,
      cs = nodes(all, css);
    if (
      n.class === 'mg-u-sr-only' ||
      !n.rect.width ||
      !n.rect.height ||
      cs.undrr.display === 'none'
    )
      return null;
    if (modes.some(m => cs[m.id].opacity !== '1'))
      fail('Unexpected source scalar opacity ' + key);
    const swatch = n.class === 'mg-legend__swatch';
    const out = {
      id,
      type: swatch ? 'ELLIPSE' : 'FRAME',
      name: n.class || n.tag,
      layout: {
        mode: 'VERTICAL',
        width: number(key + '/width', m => all[m.id].rect.width),
        height: number(key + '/height', m => all[m.id].rect.height),
        gap: zero,
        clipsContent: false,
      },
    };
    if (swatch)
      out.layout = { width: out.layout.width, height: out.layout.height };
    if (origin)
      out.absolute = {
        horizontal: 'START',
        vertical: 'START',
        offsetX: number(
          key + '/x',
          m => all[m.id].rect.x - origin[m.id].rect.x
        ),
        offsetY: number(
          key + '/y',
          m => all[m.id].rect.y - origin[m.id].rect.y
        ),
      };
    if (!swatch) {
      out.children = [];
      out.bindings = {};
      for (const [field, prop] of [
        ['topLeftRadius', 'borderTopLeftRadius'],
        ['topRightRadius', 'borderTopRightRadius'],
        ['bottomLeftRadius', 'borderBottomLeftRadius'],
        ['bottomRightRadius', 'borderBottomRightRadius'],
      ])
        out.bindings[field] = number(
          key + '/' + field,
          m => parseFloat(cs[m.id][prop]),
          ['CORNER_RADIUS']
        );
    }
    if (rgba(cs.undrr.backgroundColor).a)
      out.fill = color(key + '/background', m => cs[m.id].backgroundColor);
    if (cs.undrr.backgroundImage !== 'none') {
      const vertical = key.includes('vertical-continuous'),
        expected = vertical
          ? 'linear-gradient(rgb(255, 0, 0), rgb(255, 255, 0), rgb(0, 255, 0), rgb(0, 255, 255), rgb(0, 0, 255))'
          : 'linear-gradient(to right, rgb(0, 0, 255), rgb(0, 255, 255), rgb(0, 255, 0), rgb(255, 255, 0), rgb(255, 0, 0))';
      if (modes.some(m => cs[m.id].backgroundImage !== expected))
        fail('Authored gradient changed ' + key);
      const colors = expected.match(/rgb\([^)]+\)/g);
      delete out.fill;
      out.gradient = {
        layers: [
          {
            stops: colors.map((c, i) => ({
              position: i / 4,
              color: color(
                'gradient/' + (vertical ? 'vertical' : 'horizontal') + '/' + i,
                () => c
              ),
            })),
            transform: vertical
              ? [
                  [0, 1, 0],
                  [-1, 0, 1],
                ]
              : [
                  [1, 0, 0],
                  [0, 1, 0],
                ],
          },
        ],
      };
    }
    if (n.text.length) {
      if (
        n.text.length !== 1 ||
        modes.some(
          m =>
            all[m.id].text.length !== 1 ||
            all[m.id].text[0].characters !== n.text[0].characters
        )
      )
        fail('Different source copy ' + key);
      if (swatch) fail('Swatch text');
      const child = {
        id: id + '-text',
        type: 'TEXT',
        characters: n.text[0].characters,
        textProperty: 'Legend/' + key,
        textStyle: textStyle(key, cs),
        fill: color(key + '/ink', m => cs[m.id].color),
        textWrap: cs.undrr.textWrapStyle === 'pretty' ? 'PRETTY' : 'AUTO',
        layout: { width: 'FILL', height: 'HUG' },
      };
      out.children.push(child);
    }
    if (!swatch)
      for (let i = 0; i < n.children.length; i++) {
        if (
          modes.some(
            m =>
              all[m.id].children.length !== n.children.length ||
              all[m.id].children[i].class !== n.children[i].class
          )
        )
          fail('Different source anatomy');
        const child = projection(
          key + '/node-' + i,
          id + '-' + i,
          nodes(all, x => x.children[i]),
          all
        );
        if (child) out.children.push(child);
      }
    return out;
  }
  for (const preset of [
    'continuous',
    'categorical',
    'stepped',
    'vertical-continuous',
    'categorical-grid',
  ])
    for (const width of [390, 1164]) {
      const all = per(m => {
          const s = source.scenes.find(
            s =>
              s.mode === m.id && s.case === preset && s.viewport.width === width
          );
          if (!s) fail('Missing source scene');
          if (!s.controlAlias.trim())
            fail('Current generated source stylesheet aliases absent');
          return s.tree;
        }),
        key = 'legend.' + preset + '.' + width;
      variants.push({
        id: key,
        name: 'Preset=' + preset + ', SourceViewport=' + width,
        properties: { Preset: preset, SourceViewport: String(width) },
        tree: projection(key, 'root', all, null),
        sourceGeometry: {
          recorded: per(m => all[m.id].rect),
          browserObserved: true,
          nativeAccepted: false,
        },
      });
    }
  const families = [
    {
      id: 'legend',
      name: 'Mangrove/Source data/Legend',
      kind: 'component-set',
      sourceRef: {
        file: 'stories/Components/DataViz/Legend/Legend.jsx',
        line: 16,
      },
      review: { genericLabels: false, preserveVariantSizing: true },
      limitations: [
        'Five actual English source stories at390/1164 only. Source inline/grid wrap and tick overflow are fixed initial allocations, not arbitrary responsive CSS or edited-width anchoring.',
        'Whole logical editable source labels retain observed owning capacity. CSS600 source value text routes bundled Bold700 as a candidate; native fonts, glyph baselines, line wrapping and gradient/radius pixels remain unverified.',
        'Group/list semantics, sr-only step labels, RTL, arbitrary custom ramps/items/ticks and additional unauthored prop combinations remain source/runtime gates. Root source outer page margin is excluded from the component.',
      ],
      variants,
    },
  ];
  targets.variables.splice(0, targets.variables.length, ...variables);
  targets.styles.text.splice(0, targets.styles.text.length, ...styles.text);
  targets.styles.effect.splice(
    0,
    targets.styles.effect.length,
    ...styles.effect
  );
  return families;
}
module.exports = { buildLegendRecipes };
