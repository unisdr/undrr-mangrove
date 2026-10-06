/** Actual StatsCard source contexts. Numeric OpenType projection remains unverified. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const BASE = 'examples/figma-plugin/holistic/assets/stats-card/';
const PROVENANCE =
  '21d85a07c5ab74b9d63ace422a409d28c1a0c5e2c7831faeb553f7897462df53';
const copy = x => structuredClone(x);
function buildStatsCardRecipes({ root, modes, variables, styles }) {
  const original = { variables, styles };
  variables = copy(variables);
  styles = copy(styles);
  const fail = s => {
    throw Error('StatsCard source recipe needs updating: ' + s);
  };
  const read = f => fs.readFileSync(path.join(root, f)),
    sha = b => crypto.createHash('sha256').update(b).digest('hex');
  const provenance = read(BASE + 'provenance.json');
  if (sha(provenance) !== PROVENANCE) fail('provenance');
  for (const [f, h] of Object.entries(JSON.parse(provenance).sourceHashes))
    if (sha(read(f)) !== h) fail(f);
  const modeKeys = modes
    .map(m => m.id)
    .sort()
    .join(',');
  if (modeKeys !== 'delta,irp,mcr,preventionweb,undrr')
    fail('five source modes');
  for (const expected of JSON.parse(read(BASE + 'foundation-contract.json'))) {
    const hits = variables.filter(
      v => v.name === expected.name || v.id === expected.id
    );
    if (
      hits.length !== 1 ||
      ['id', 'name', 'type', 'values'].some(
        k => JSON.stringify(hits[0][k]) !== JSON.stringify(expected[k])
      )
    )
      fail('captured source foundation ' + expected.name);
  }
  const source = JSON.parse(read(BASE + 'source-footprints.json')),
    mirror = JSON.parse(read(BASE + 'mask-mirror-readout.json'));
  const per = fn => Object.fromEntries(modes.map(m => [m.id, fn(m.id)])),
    css = n => source.styles[n.css];
  const resolve = (name, m, type, seen = new Set()) => {
    if (seen.has(name)) fail('alias cycle ' + name);
    seen.add(name);
    const v = variables.find(v => v.name === name);
    if (!v || v.type !== type || v.values?.[m] === undefined)
      fail('source role ' + name);
    const x = v.values[m];
    return x?.alias ? resolve(x.alias, m, type, seen) : x;
  };
  function shape(e, kind) {
    if (e.type !== undefined && e.type !== kind) return false;
    if (
      Object.keys(e.values || {})
        .sort()
        .join(',') !== modeKeys
    )
      return false;
    return modes.every(m => {
      const v = e.values[m.id];
      return kind === 'EFFECT'
        ? Array.isArray(v)
        : v &&
            typeof v === 'object' &&
            !Array.isArray(v) &&
            v.fontName &&
            typeof v.fontName === 'object' &&
            !Array.isArray(v.fontName) &&
            typeof v.fontName.family === 'string' &&
            v.fontName.family.trim() &&
            typeof v.fontName.style === 'string' &&
            v.fontName.style.trim();
    });
  }
  function upsert(list, e) {
    const variable = list === variables,
      kind = list === styles.text ? 'TEXT' : 'EFFECT',
      hits = list.filter(x => x.id === e.id || x.name === e.name);
    if (
      hits.length > 1 ||
      hits.some(
        x =>
          x.id !== e.id ||
          x.name !== e.name ||
          (variable ? x.type !== e.type : !shape(x, kind))
      )
    )
      fail('foreign helper identity ' + e.id);
    if (
      !variable &&
      Object.values(styles).some(
        other =>
          Array.isArray(other) &&
          other !== list &&
          other.some(x => x.id === e.id || x.name === e.name)
      )
    )
      fail('foreign style kind');
    if (hits.length) list[list.indexOf(hits[0])] = e;
    else list.push(e);
  }
  const ref = {
    file: 'stories/Components/Cards/StatsCard/StatsCardItem.jsx',
    line: 1,
  };
  function role(key, type, values, scopes = ['ALL_SCOPES']) {
    const name = 'component/stats-card/' + key;
    upsert(variables, {
      id: name.replaceAll('/', '.'),
      name,
      type,
      values,
      scopes,
      sourceRef: ref,
      description:
        'Finite actual source context allocation; no arbitrary edited reflow or native pixel equivalence.',
    });
    return name;
  }
  const number = (key, fn) =>
    role(
      key,
      'FLOAT',
      per(m => {
        const n = fn(m);
        if (!Number.isFinite(n)) fail('nonfinite ' + key);
        return n;
      })
    );
  const rgba = s => {
    const a = /^rgba?\(([^)]+)\)$/.exec(s)?.[1].split(',').map(Number);
    if (!a || ![3, 4].includes(a.length) || a.some(x => !Number.isFinite(x)))
      fail('source paint ' + s);
    return { r: a[0] / 255, g: a[1] / 255, b: a[2] / 255, a: a[3] ?? 1 };
  };
  const publicColors = variables
    .filter(v => v.type === 'COLOR' && !v.name.startsWith('component/'))
    .map(v => v.name);
  function paint(key, fn) {
    const values = per(m => rgba(fn(m)));
    const alias = publicColors.find(n =>
      modes.every(m => {
        const a = resolve(n, m.id, 'COLOR'),
          b = values[m.id];
        return (
          ['r', 'g', 'b'].every(
            k => Math.round(a[k] * 255) === Math.round(b[k] * 255)
          ) && (a.a ?? 1) === b.a
        );
      })
    );
    return role(key, 'COLOR', alias ? per(() => ({ alias })) : values);
  }
  function typeStyle(key, all) {
    const id = 'component.stats-card.' + key.replaceAll('/', '.') + '.type',
      values = per(m => {
        const c = css(all[m]),
          family = c.fontFamily.includes('Roboto Condensed')
            ? 'Roboto Condensed'
            : c.fontFamily.startsWith('Roboto,')
              ? 'Roboto'
              : null;
        if (
          !family ||
          c.fontStyle !== 'normal' ||
          ![400, 600, 700].includes(+c.fontWeight) ||
          !['none', 'uppercase'].includes(c.textTransform)
        )
          fail('source font ' + key);
        const roleName =
          family === 'Roboto Condensed' ? 'font-family/ui' : 'font-family/text';
        if (resolve(roleName, m, 'STRING') !== family) fail('source font role');
        return {
          fontName: {
            family,
            style: +c.fontWeight >= 600 ? 'Bold' : 'Regular',
          },
          fontSize: parseFloat(c.fontSize),
          lineHeight: { unit: 'PIXELS', value: parseFloat(c.lineHeight) },
          letterSpacing: {
            unit: 'PIXELS',
            value:
              c.letterSpacing === 'normal' ? 0 : parseFloat(c.letterSpacing),
          },
          textCase: c.textTransform === 'uppercase' ? 'UPPER' : 'ORIGINAL',
        };
      });
    if (
      Object.values(values).some(
        v =>
          !Number.isFinite(v.fontSize) ||
          !Number.isFinite(v.lineHeight.value) ||
          !Number.isFinite(v.letterSpacing.value)
      )
    )
      fail('font allocation');
    if (new Set(Object.values(values).map(v => v.textCase)).size !== 1)
      fail('mode case');
    const family =
      values.undrr.fontName.family === 'Roboto Condensed'
        ? 'font-family/ui'
        : 'font-family/text';
    const size = number(key + '/font-size', m => values[m].fontSize);
    upsert(styles.text, {
      id,
      name: 'Mangrove draft/' + id,
      values,
      bindings: { fontFamily: family, fontSize: size },
      sourceRef: ref,
      description:
        'Actual CSS face/size/line/case candidate; CSS600 maps to source Bold700 inventory. Native font bytes, numeric features and pixels remain open.',
    });
    return id;
  }
  const zero = number('zero', () => 0);
  function frame(key, id, all, parent) {
    return {
      id,
      type: 'FRAME',
      name: all.undrr.class || all.undrr.tag,
      layout: {
        mode: 'VERTICAL',
        width: number(key + '/width', m => all[m].rect.width),
        height: number(key + '/height', m => all[m].rect.height),
        gap: zero,
        clipsContent: css(all.undrr).overflow === 'hidden',
      },
      ...(parent
        ? {
            absolute: {
              horizontal: 'START',
              vertical: 'START',
              offsetX: number(
                key + '/x',
                m => all[m].rect.x - parent[m].rect.x
              ),
              offsetY: number(
                key + '/y',
                m => all[m].rect.y - parent[m].rect.y
              ),
            },
          }
        : {}),
      children: [],
    };
  }
  function decorate(key, out, all) {
    const c = css(all.undrr);
    out.bindings = {
      opacity: number(key + '/opacity', m => +css(all[m]).opacity * 100),
    };
    if (rgba(c.backgroundColor).a)
      out.fill = paint(key + '/surface', m => css(all[m]).backgroundColor);
    for (const [field, prop] of [
      ['topLeftRadius', 'borderTopLeftRadius'],
      ['topRightRadius', 'borderTopRightRadius'],
      ['bottomLeftRadius', 'borderBottomLeftRadius'],
      ['bottomRightRadius', 'borderBottomRightRadius'],
    ])
      out.bindings[field] = number(key + '/' + field, m =>
        parseFloat(css(all[m])[prop])
      );
    const edges = ['Top', 'Right', 'Bottom', 'Left'],
      visible = edges.find(e => parseFloat(c['border' + e + 'Width']));
    if (visible) {
      const accent = modes.some(
        m =>
          css(all[m.id]).borderLeftColor !==
          css(all[m.id])['border' + visible + 'Color']
      );
      if (accent) {
        if (
          modes.some(
            m =>
              css(all[m.id]).borderLeftWidth !== '4px' ||
              !all[m.id].class.includes('mg-stats-card-item')
          )
        )
          fail('unsupported mixed border');
        out.children.push({
          id: 'source-accent',
          type: 'FRAME',
          name: 'Actual highlighted4px left border paint',
          fill: paint(key + '/left-accent', m => css(all[m]).borderLeftColor),
          layout: {
            mode: 'VERTICAL',
            width: number(key + '/left-accent-width', m =>
              parseFloat(css(all[m]).borderLeftWidth)
            ),
            height: out.layout.height,
          },
          absolute: {
            horizontal: 'START',
            vertical: 'START',
            offsetX: zero,
            offsetY: zero,
          },
        });
      }
      out.stroke = paint(
        key + '/border',
        m => css(all[m])['border' + visible + 'Color']
      );
      out.bindings.strokeWeight = zero;
      for (const e of edges)
        out.bindings['stroke' + e + 'Weight'] = number(
          key + '/stroke' + e,
          m =>
            e === 'Left' && accent
              ? 0
              : parseFloat(css(all[m])['border' + e + 'Width'])
        );
    }
    if (c.boxShadow !== 'none') {
      const style = styles.effect.find(s => s.id === 'shadow.raised');
      if (!style || !shape(style, 'EFFECT')) fail('raised style');
      for (const m of modes) {
        const match = /^(rgba?\([^)]+\)) 0px 0px 0px 1px inset$/.exec(
            css(all[m.id]).boxShadow
          ),
          e = style.values[m.id];
        if (
          !match ||
          e.length !== 1 ||
          e[0].effect.type !== 'INNER_SHADOW' ||
          e[0].effect.offset.x !== 0 ||
          e[0].effect.offset.y !== 0 ||
          e[0].effect.radius !== 0 ||
          e[0].effect.spread !== 1 ||
          !e[0].bindings?.color
        )
          fail('source raised effect');
        const a = rgba(match[1]),
          b = resolve(e[0].bindings.color, m.id, 'COLOR');
        if (
          ['r', 'g', 'b'].some(
            k => Math.round(a[k] * 255) !== Math.round(b[k] * 255)
          ) ||
          a.a !== b.a
        )
          fail('source raised effect paint');
      }
      out.effectStyle = 'shadow.raised';
    }
  }
  function logical(key, id, all) {
    const n = all.undrr;
    if (modes.some(m => all[m.id].fullText !== n.fullText)) fail('source copy');
    const t = {
      id,
      type: 'TEXT',
      name: n.class || n.tag,
      characters: n.fullText,
      textWrap:
        css(n).textWrapStyle === 'pretty'
          ? 'PRETTY'
          : css(n).textWrapStyle === 'balance'
            ? 'BALANCE'
            : 'AUTO',
      layout: { width: 'FILL', height: 'HUG' },
    };
    const linked = n.children.length || n.href;
    if (linked) {
      const pieces = [];
      if (n.href) pieces.push({ n, characters: n.fullText, path: 'value' });
      else
        for (const [i, p] of n.childOrder.entries()) {
          if ('text' in p) {
            if (p.text)
              pieces.push({ n, characters: p.text, path: 'direct' + i });
          } else {
            const child = n.children[p.index];
            pieces.push({
              n: child,
              characters: child.fullText,
              path: 'child' + p.index,
            });
          }
        }
      let offset = 0;
      t.textRuns = pieces
        .filter(p => p.characters)
        .map(p => {
          const each = per(m =>
              p.n === n ? all[m] : all[m].children[n.children.indexOf(p.n)]
            ),
            run = {
              id: id + '-' + p.path,
              start: offset,
              end: offset + p.characters.length,
              textStyle: typeStyle(key + '/' + p.path, each),
              fill: paint(key + '/' + p.path + '/ink', m => css(each[m]).color),
              textDecoration: css(p.n).textDecoration.includes('underline')
                ? 'UNDERLINE'
                : 'NONE',
              ...(p.n.href?.startsWith('https://')
                ? { hyperlink: { type: 'URL', value: p.n.href } }
                : {}),
            };
          offset = run.end;
          return run;
        });
      if (
        t.textRuns.map(r => n.fullText.slice(r.start, r.end)).join('') !==
        n.fullText
      )
        fail('rich order');
      t.sourceLinks = pieces
        .filter(p => p.n.href)
        .map(p => ({
          sourceHref: p.n.href,
          relativeRouteUnmapped: !p.n.href.startsWith('https://'),
        }));
    } else {
      t.textStyle = typeStyle(key, all);
      t.fill = paint(key + '/ink', m => css(all[m]).color);
      t.textProperty = 'Stats/' + key;
    }
    return t;
  }
  const items = [],
    groups = [];
  for (const preset of [
    'default',
    'with-icons',
    'compact',
    'highlighted',
    'negative',
    'linked',
    'mixed-content',
  ])
    for (const width of [390, 1164]) {
      const key = preset + '/' + width,
        scenes = per(m => {
          const s = source.scenes.find(
            s => s.mode === m && s.case === preset && s.viewport.width === width
          );
          if (!s || !s.controlAlias) fail('source case');
          return s;
        }),
        roots = per(m => scenes[m].tree),
        cards = per(m => roots[m].children[1].children);
      if (modes.some(m => cards[m.id].length !== cards.undrr.length))
        fail('source grid anatomy');
      for (let index = 0; index < cards.undrr.length; index++) {
        const all = per(m => cards[m][index]),
          ik = key + '/item' + index,
          out = frame(ik, 'root', all);
        decorate(ik, out, all);
        for (let ci = 0; ci < all.undrr.children.length; ci++) {
          const each = per(m => all[m].children[ci]),
            n = each.undrr,
            slot = frame(ik + '/field' + ci, 'field' + ci, each, all);
          if (n.class === 'mg-stats-card-item__icon') {
            const lookup = per(m =>
              mirror
                .find(
                  c =>
                    c.mode === m &&
                    c.preset === preset &&
                    c.viewport.width === width
                )
                ?.items.find(
                  i =>
                    i.original.card.x === all[m].rect.x &&
                    i.original.card.y === all[m].rect.y
                )
            );
            if (Object.values(lookup).some(x => !x)) fail('source icon mirror');
            if (!lookup.undrr.maskAbsent) {
              if (
                modes.some(
                  m =>
                    lookup[m.id].maskAbsent ||
                    !lookup[m.id].ownerAndAncestorsUnchanged
                )
              )
                fail('source mask');
              const iconClass = n.children[0].class.split(' ').at(-1),
                markup = read(BASE + iconClass + '.svg').toString(),
                size = number(
                  ik + '/glyph-size',
                  m => lookup[m].projected.pseudo.width
                ),
                color = paint(ik + '/glyph-paint', m => css(each[m]).color);
              slot.children.push({
                id: 'glyph' + ci,
                type: 'FRAME',
                layout: { mode: 'VERTICAL', width: size, height: size },
                absolute: {
                  horizontal: 'START',
                  vertical: 'START',
                  offsetX: number(
                    ik + '/glyph-x',
                    m => lookup[m].projected.pseudo.x - each[m].rect.x
                  ),
                  offsetY: number(
                    ik + '/glyph-y',
                    m => lookup[m].projected.pseudo.y - each[m].rect.y
                  ),
                },
                children: [
                  {
                    id: 'glyph' + ci + '-svg',
                    type: 'SVG',
                    svg: {
                      assetId: 'stats-source-' + iconClass,
                      markup: markup
                        .replaceAll("'", '"')
                        .replaceAll('currentColor', '#000000'),
                      monochrome: { strokes: color },
                      sizing: {
                        size,
                        strokeWidth: number(
                          ik + '/glyph-stroke',
                          m => (2 * lookup[m].projected.pseudo.width) / 24
                        ),
                      },
                    },
                    layout: { width: 24, height: 24 },
                  },
                ],
              });
            } else {
              if (
                modes.some(
                  m =>
                    each[m.id].rect.width !== 0 ||
                    lookup[m.id].original.owner.width !== 0 ||
                    lookup[m.id].original.owner.height !== 0
                )
              )
                fail('source missing legacy glyph');
              out.sourceDefects = [
                ...(out.sourceDefects || []),
                {
                  anatomyId: 'field' + ci,
                  sourceClass: n.children[0].class,
                  recordedAllocation: per(m => each[m].rect),
                  visibleProjection:
                    'No ink and zero width; omit unsupported zero-width absolute FRAME, preserve following source positions and captured flow gap.',
                },
              ];
              continue;
            }
          } else {
            const text = logical(
              ik + '/field' + ci,
              'field' + ci + '-logical',
              each
            );
            if (text.sourceLinks) {
              slot.sourceLinks = text.sourceLinks;
              delete text.sourceLinks;
            }
            slot.children.push(text);
          }
          out.children.push(slot);
        }
        items.push({
          id: 'stats-card-item.' + preset + '.' + width + '.' + index,
          name: `Preset=${preset}, Viewport=${width}, Item=${index}`,
          properties: {
            Preset: preset,
            Viewport: String(width),
            Item: String(index),
          },
          sourceRef: ref,
          sourceGeometry: { recorded: per(m => all[m].rect) },
          tree: out,
        });
      }
      const rootBox = frame(key + '/group', 'root', roots),
        head = per(m => roots[m].children[0]),
        headSlot = frame(key + '/heading', 'heading', head, roots);
      headSlot.children.push(
        logical(key + '/heading', 'heading-logical', head)
      );
      rootBox.children.push(headSlot);
      const grids = per(m => roots[m].children[1]),
        grid = frame(key + '/grid', 'grid', grids, roots);
      for (let i = 0; i < cards.undrr.length; i++) {
        const all = per(m => cards[m][i]),
          slot = frame(key + '/grid' + i, 'item' + i, all, grids);
        slot.children.push({
          id: 'item' + i + '-instance',
          type: 'INSTANCE',
          family: 'stats-card-item',
          variant: { Preset: preset, Viewport: String(width), Item: String(i) },
          expose: true,
          layout: { width: 'FILL', height: 'FILL' },
        });
        grid.children.push(slot);
      }
      rootBox.children.push(grid);
      let tree = rootBox;
      if (preset === 'negative') {
        const parents = per(m => scenes[m].ancestors[0]);
        tree = frame(key + '/authored-dark-caller', 'root', parents);
        decorate(key + '/authored-dark-caller', tree, parents);
        rootBox.id = 'source-section';
        rootBox.absolute = {
          horizontal: 'START',
          vertical: 'START',
          offsetX: number(
            key + '/section-x',
            m => roots[m].rect.x - parents[m].rect.x
          ),
          offsetY: number(
            key + '/section-y',
            m => roots[m].rect.y - parents[m].rect.y
          ),
        };
        tree.children.push(rootBox);
      }
      groups.push({
        id: 'stats-card.' + preset + '.' + width,
        name: `Preset=${preset}, Viewport=${width}`,
        properties: { Preset: preset, Viewport: String(width) },
        sourceRef: {
          file: 'stories/Components/Cards/StatsCard/StatsCard.jsx',
          line: 1,
        },
        sourceGeometry: {
          recorded: per(m =>
            preset === 'negative' ? scenes[m].ancestors[0].rect : roots[m].rect
          ),
        },
        tree,
      });
    }
  const limitations = [
    'Finite seven English authored contexts at390/1164, all five source themes; custom stats counts, locale/RTL, hover/focus/click behavior and arbitrary edited flow remain open.',
    'Source numeric CSS requests tabular-nums lining-nums; documented Figma OpenType features are read-only. Source220 values had equal measured advance widths with normal features, but actual pinned glyph substitutions differ. No numeric glyph/native feature equivalence accepted.',
    'CSS600 is routed to source Bold700 as a candidate; native font bytes, uppercase glyphs, baseline/wrapping/raster remain open.',
    'Actual source legacy handshake/map glyphs are absent; preserve source empty allocation, not intended repaired artwork.',
    'Exact source mask pseudo viewports measured with ephemeral mirrors; native mask/SVG contour and stroke equivalence remain open.',
    'Whole logical source text remains editable within finite initial capacities; relative fragments/stretched card-link overlay/target semantics/native reflow are not implemented.',
    'Negative scene includes actual authored dark decorator; item is transparent and no generic dark component paint is substituted.',
    'No native full component, ordinary plugin recovery, migration, consumer publication or library acceptance.',
  ];
  const families = [
    {
      id: 'stats-card-item',
      name: 'Mangrove draft/StatsCardItem source contexts',
      kind: 'component-set',
      review: { genericLabels: false, preserveVariantSizing: true },
      sourceRef: ref,
      limitations,
      variants: items,
    },
    {
      id: 'stats-card',
      name: 'Mangrove draft/StatsCard authored source scenes',
      kind: 'component-set',
      review: { genericLabels: false, preserveVariantSizing: true },
      sourceRef: {
        file: 'stories/Components/Cards/StatsCard/StatsCard.jsx',
        line: 1,
      },
      limitations,
      variants: groups,
    },
  ];
  original.variables.splice(0, original.variables.length, ...variables);
  original.styles.text.splice(0, original.styles.text.length, ...styles.text);
  original.styles.effect.splice(
    0,
    original.styles.effect.length,
    ...styles.effect
  );
  return families;
}
module.exports = { buildStatsCardRecipes };
