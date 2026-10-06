'use strict';
/** Finite authored Arabic source candidate. Native acceptance remains open. */
const fs = require('fs'),
  path = require('path'),
  zlib = require('zlib'),
  crypto = require('crypto'),
  assert = require('assert/strict');
const clone = x => JSON.parse(JSON.stringify(x)),
  sha = b => crypto.createHash('sha256').update(b).digest('hex');
function buildArabicLandingRecipes({ root, modes, variables, styles }) {
  const fail = m => {
      throw Error('Arabic landing source recipe needs updating: ' + m);
    },
    read = f =>
      fs.readFileSync(
        path.join(
          root,
          'examples/figma-plugin/holistic/assets/arabic-landing',
          f
        )
      ),
    audit = JSON.parse(read('source-audit.json'));
  for (const [f, h] of Object.entries(audit.sourcePins))
    if (sha(fs.readFileSync(path.join(root, f))) !== h) fail('source ' + f);
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('five exact modes');
  const captures = new Map();
  for (const [f, pin] of Object.entries(audit.sourceDerivedPins)) {
    const compressed = read('source-derived/' + f + '.gz'),
      gzPin = audit.portableDerivedArchivePins[f];
    if (
      !gzPin ||
      compressed.length !== gzPin.bytes ||
      sha(compressed) !== gzPin.sha256
    )
      fail('compressed capture ' + f);
    const b = zlib.gunzipSync(compressed);
    if (sha(b) !== pin.sha256 || b.length !== pin.bytes) fail('capture ' + f);
    const c = JSON.parse(b);
    if (
      c.fontStatus !== 'loaded' ||
      !c.derivedBeforeAfterSourceNodesExact ||
      c.nodes[0].dir !== 'rtl' ||
      c.nodes[0].lang !== 'ar' ||
      !c.pseudoDiagnostic.originalMarkupRestored ||
      !c.caretDiagnostic.originalMarkupRestored ||
      c.maskDiagnostic.masks.some(x => !x.sourceOwnerMirrorExact)
    )
      fail('source derivation ' + f);
    captures.set(f, c);
  }
  if (captures.size !== 30) fail('exact thirty source contexts');
  const contextBytes = read('source-contexts.json');
  if (
    contextBytes.length !== audit.contextProjection.bytes ||
    sha(contextBytes) !== audit.contextProjection.sha256
  )
    fail('context projection drift');
  const contexts = JSON.parse(contextBytes);
  if (contexts.familyCount !== 15 || contexts.variantCount !== 72)
    fail('full closure');
  const prepared = { variables: clone(variables), styles: clone(styles) },
    families = Object.entries(contexts.families).map(([id, rows]) => ({
      id,
      name: 'Mangrove source / ' + id,
      kind: 'component-set',
      sourceRef: { file: 'stories/Patterns/LandingPages/LandingPages.jsx' },
      review: { genericLabels: false, preserveVariantSizing: true },
      variants: [],
      limitations: [
        'Actual authored Arabic caller and finite390/1164 source allocations across five brands; no English copy translation or mirrored geometry.',
        'Whole logical copy and contextual native INSTANCE dependencies; arbitrary edited-copy reflow and bidi/glyph/inline caret relocation remain open.',
        'Captured per-role literals do not establish public semantic alias identity or live maintenance.',
        'Native source fields, fonts/axes/glyphs, images/crops/SVG/pixels, live modes, behavior, collection capacity, publication and novice handoff remain open.',
      ],
    }));
  let scope;
  const vals = fn => Object.fromEntries(modes.map(m => [m.id, fn(m.id)])),
    modeBrand = m => (m === 'mcr' ? 'mcr2030' : m);
  function upsert(list, entry, kind) {
    const hits = list.filter(x => x.id === entry.id || x.name === entry.name);
    if (
      hits.length > 1 ||
      hits.some(
        x =>
          x.id !== entry.id ||
          x.name !== entry.name ||
          (kind === 'VARIABLE'
            ? x.type !== entry.type
            : x.type !== undefined && x.type !== kind)
      )
    )
      fail('foreign identity/kind ' + entry.id);
    if (kind !== 'VARIABLE')
      for (const [k, other] of Object.entries(prepared.styles))
        if (
          other !== list &&
          Array.isArray(other) &&
          other.some(x => x.id === entry.id || x.name === entry.name)
        )
          fail('cross style kind ' + entry.id);
    for (const hit of hits) {
      if (
        kind === 'EFFECT' &&
        Object.values(hit.values || {}).some(
          v =>
            !Array.isArray(v) ||
            v.some(
              e =>
                !e ||
                typeof e !== 'object' ||
                !e.effect ||
                typeof e.effect !== 'object'
            )
        )
      )
        fail('existing effect shape');
      if (
        !hit.values ||
        Array.isArray(hit.values) ||
        Object.keys(hit.values).sort().join(',') !==
          'delta,irp,mcr,preventionweb,undrr'
      )
        fail('existing mode shape');
      if (kind === 'TEXT')
        for (const value of Object.values(hit.values))
          if (
            !value ||
            Array.isArray(value) ||
            !value.fontName ||
            typeof value.fontName !== 'object' ||
            Array.isArray(value.fontName) ||
            typeof value.fontName.family !== 'string' ||
            !value.fontName.family.trim() ||
            typeof value.fontName.style !== 'string' ||
            !value.fontName.style.trim()
          )
            fail('existing font shape');
    }
    if (hits.length) list[list.indexOf(hits[0])] = entry;
    else list.push(entry);
  }
  function role(key, type, values) {
    for (const v of Object.values(values))
      if (
        type === 'FLOAT'
          ? !Number.isFinite(v)
          : type === 'STRING'
            ? typeof v !== 'string' || !v.trim()
            : type === 'COLOR'
              ? !v ||
                ['r', 'g', 'b', 'a'].some(
                  k => !Number.isFinite(v[k]) || v[k] < 0 || v[k] > 1
                )
              : true
      )
        fail('role value ' + key);
    const name = 'component/' + scope + '/' + key;
    upsert(
      prepared.variables,
      {
        id: name.replaceAll('/', '.'),
        name,
        type,
        values,
        scopes:
          type === 'COLOR'
            ? ['ALL_FILLS', 'STROKE_COLOR']
            : type === 'STRING'
              ? ['FONT_FAMILY']
              : ['ALL_SCOPES'],
        sourceRef: { file: 'stories/Patterns/LandingPages/LandingPages.jsx' },
        description:
          'Immutable measured source role; no equality-based public alias or responsive native maintenance claim.',
      },
      'VARIABLE'
    );
    return name;
  }
  const number = (key, v) => role(key, 'FLOAT', v),
    rgba = raw => {
      const m = /^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/.exec(raw);
      if (!m) fail('captured RGBA ' + raw);
      return {
        r: +m[1] / 255,
        g: +m[2] / 255,
        b: +m[3] / 255,
        a: m[4] === undefined ? 1 : +m[4],
      };
    };
  const color = (key, v) =>
    role(
      key,
      'COLOR',
      Object.fromEntries(Object.entries(v).map(([m, s]) => [m, rgba(s)]))
    );
  function font(key, nodes) {
    const values = vals(m => {
      const s = nodes[m].style,
        match = /^"(Noto Sans Arabic|Noto Kufi Arabic)", sans-serif$/.exec(
          s.fontFamily
        );
      if (
        !match ||
        !['400', '600', '700'].includes(s.fontWeight) ||
        s.fontStyle !== 'normal' ||
        s.fontVariationSettings !== 'normal' ||
        !s.fontSize.endsWith('px') ||
        !s.lineHeight.endsWith('px')
      )
        fail('source font ' + key);
      return {
        fontName: {
          family: match[1],
          style: s.fontWeight === '400' ? 'Regular' : 'Bold',
        },
        fontSize: parseFloat(s.fontSize),
        lineHeight: { unit: 'PIXELS', value: parseFloat(s.lineHeight) },
        letterSpacing: {
          unit: 'PIXELS',
          value: s.letterSpacing === 'normal' ? 0 : parseFloat(s.letterSpacing),
        },
        paragraphSpacing: 0,
        textDecoration: 'NONE',
      };
    });
    const id = 'component.' + scope + '.' + key + '.text';
    upsert(
      prepared.styles.text,
      {
        id,
        name: 'Mangrove source / ' + id,
        values,
        bindings: {
          fontFamily: role(
            key + '-family',
            'STRING',
            vals(m => values[m].fontName.family)
          ),
          fontSize: number(
            key + '-size',
            vals(m => values[m].fontSize)
          ),
        },
        description:
          'Actual Noto CSS400/700; requested600 uses the available Bold700 matching candidate. Native font bytes/axes/glyph/flow equivalence remains open.',
        sourceRef: { file: 'stories/assets/scss/_fonts.scss' },
      },
      'TEXT'
    );
    return id;
  }
  const logos = JSON.parse(
      fs.readFileSync(
        path.join(
          root,
          'examples/figma-plugin/holistic/assets/page-header/normalised-logos.json'
        )
      )
    ),
    logo = logos['undrr-logo-ar-white.svg'];
  function imageAsset(file, hash, assetId, fit) {
    const b = read('actual-response-bodies/' + file);
    if (sha(b) !== hash) fail('asset body ' + file);
    return { assetId, base64: b.toString('base64'), scaleMode: fit };
  }
  const photo = imageAsset(
      'resilient-infrastructure-pikoso-kz-shutterstock.jpg',
      '99974686a4568ec28531c06344c4c79d19db52d0da2df1c27d05f19825690449',
      'arabic-landing-resilient-infrastructure',
      'FILL'
    ),
    texture = imageAsset(
      'toolbar-background.png',
      'ac3941b2f9647c6d037b7eefa1ed80fc77b5f194f3d718d2f4b2902f55303c81',
      'arabic-landing-toolbar',
      'FILL'
    );
  const byFamily = new Map(families.map(f => [f.id, f]));
  for (const family of families)
    for (const row of contexts.families[family.id]) {
      scope = family.id + '/' + row.preset + '/' + row.viewport;
      const cases = Object.fromEntries(
          modes.map(m => [
            m.id,
            captures.get(
              modeBrand(m.id) +
                '-' +
                row.archetype +
                '-' +
                row.viewport +
                '.json'
            ),
          ])
        ),
        maps = Object.fromEntries(
          modes.map(m => [m.id, new Map(cases[m.id].nodes.map(n => [n.id, n]))])
        ),
        sample = cases.undrr;
      const all = id =>
          Object.fromEntries(
            modes.map(m => {
              const n = maps[m.id].get(id);
              if (!n) fail('missing source node ' + id);
              return [m.id, n];
            })
          ),
        children = id => sample.nodes.filter(n => n.parentId === id),
        px = s => {
          if (!/^-?[\d.]+px$/.test(s)) fail('nonpixel source ' + s);
          return parseFloat(s);
        },
        fill = (key, nodes, field) =>
          color(
            key,
            vals(m => nodes[m].style[field])
          );
      const placements = id => {
        const ns = all(id),
          p = all(ns.undrr.parentId);
        return {
          horizontal: 'START',
          vertical: 'START',
          offsetX: number(
            id + '-x',
            vals(m => ns[m].rect.x - p[m].rect.x)
          ),
          offsetY: number(
            id + '-y',
            vals(m => ns[m].rect.y - p[m].rect.y)
          ),
        };
      };
      const refs = new Map();
      for (const [fid, rows] of Object.entries(contexts.families))
        for (const q of rows)
          if (
            q.viewport === row.viewport &&
            q.archetype === row.archetype &&
            q.sourceRootId !== row.sourceRootId
          )
            refs.set(q.sourceRootId, {
              family: fid,
              variant: { Preset: q.preset, SourceViewport: String(q.viewport) },
            });
      // Common caller chrome uses identical recorded fields with only the JSX idPrefix differing.
      if (family.id.endsWith('-page'))
        for (const fid of [
          'arabic-landing-header',
          'arabic-landing-navigation',
        ]) {
          const q = contexts.families[fid].find(
            q => q.viewport === row.viewport
          );
          refs.set(q.sourceRootId, {
            family: fid,
            variant: { Preset: q.preset, SourceViewport: String(q.viewport) },
          });
        }
      function pseudo(id, which, ns) {
        const ds = Object.fromEntries(
          modes.map(m => [
            m.id,
            cases[m.id].pseudoDiagnostic.diagnostics.find(
              d => d.ownerId === id && d.pseudo === which
            ),
          ])
        );
        if (Object.values(ds).some(d => !d))
          fail('missing exact pseudo ' + id + '/' + which);
        if (
          Object.values(ds).every(
            d => d.rect.width === 0 || d.rect.height === 0
          )
        )
          return null;
        const d = ds.undrr,
          s = d.style,
          geom = {
            width: number(
              id + '-' + which + '-width',
              vals(m => ds[m].rect.width)
            ),
            height: number(
              id + '-' + which + '-height',
              vals(m => ds[m].rect.height)
            ),
          },
          absolute = {
            horizontal: 'START',
            vertical: 'START',
            offsetX: number(
              id + '-' + which + '-x',
              vals(m => ds[m].rect.x - ns[m].rect.x)
            ),
            offsetY: number(
              id + '-' + which + '-y',
              vals(m => ds[m].rect.y - ns[m].rect.y)
            ),
          };
        const edges = ['top', 'right', 'bottom', 'left'],
          widths = edges.map(e => px(s['border-' + e + '-width']));
        if (widths.some(v => v > 0)) {
          const rotation =
            s.transform ===
            'matrix(0.707107, -0.707107, 0.707107, 0.707107, 0, 0)'
              ? -45
              : s.transform ===
                  'matrix(-0.707107, -0.707107, 0.707107, -0.707107, 0, 0)'
                ? -135
                : null;
          if (
            rotation === null ||
            d.untransformedRect.width !== d.untransformedRect.height ||
            s['background-image'] !== 'none' ||
            s['box-shadow'] !== 'none'
          )
            fail('unmapped source caret');
          for (const m of modes)
            if (
              ds[m.id].style.transform !== s.transform ||
              edges.some(
                e =>
                  ds[m.id].style['border-' + e + '-width'] !==
                  s['border-' + e + '-width']
              ) ||
              ds[m.id].untransformedRect.width !== d.untransformedRect.width
            )
              fail('caret topology/size drift');
          const side = d.untransformedRect.width,
            angle = (rotation * Math.PI) / 180,
            c = Math.cos(angle),
            sn = Math.sin(angle),
            corners = [
              [0, 0],
              [side, 0],
              [side, side],
              [0, side],
            ].map(([x, y]) => [x * c - y * sn, x * sn + y * c]),
            minX = Math.min(...corners.map(p => p[0])),
            minY = Math.min(...corners.map(p => p[1])),
            v = side * Math.SQRT2;
          const polygons = [
            [
              [0, 0],
              [side, 0],
              [side, widths[0]],
              [0, widths[0]],
            ],
            [
              [side - widths[1], 0],
              [side, 0],
              [side, side],
              [side - widths[1], side],
            ],
            [
              [0, side - widths[2]],
              [side, side - widths[2]],
              [side, side],
              [0, side],
            ],
            [
              [0, 0],
              [widths[3], 0],
              [widths[3], side],
              [0, side],
            ],
          ];
          const markup =
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
              v +
              ' ' +
              v +
              '">' +
              polygons
                .filter((_, i) => widths[i] > 0)
                .map(
                  ps =>
                    '<polygon fill="#000" points="' +
                    ps
                      .map(([x, y]) =>
                        [x * c - y * sn - minX, x * sn + y * c - minY].join(',')
                      )
                      .join(' ') +
                    '"/>'
                )
                .join('') +
              '</svg>',
            edge = edges[widths.findIndex(v => v > 0)];
          return {
            id: 'source-' + id + '-' + which,
            type: 'FRAME',
            name: 'Actual RTL ' + rotation + 'deg source caret allocation',
            layout: { mode: 'NONE', ...geom },
            absolute,
            children: [
              {
                id: 'source-' + id + '-' + which + '-caret-ink',
                type: 'SVG',
                layout: { width: v, height: v },
                svg: {
                  assetId:
                    'arabic-caret-' +
                    rotation +
                    '-' +
                    side +
                    '-' +
                    widths.join('-'),
                  markup,
                  monochrome: {
                    fills: color(
                      id + '-' + which + '-color',
                      vals(m => ds[m].style['border-' + edge + '-color'])
                    ),
                  },
                },
              },
            ],
            sourcePseudo: {
              ownerId: id,
              pseudo: which,
              rotation,
              nativeContoursAccepted: false,
            },
          };
        }
        if (
          s.transform !== 'none' ||
          s['background-image'] !== 'none' ||
          s['box-shadow'] !== 'none'
        )
          fail('unmapped source pseudo ' + id);
        const raw = vals(m => ds[m].style['background-color']);
        if (Object.values(raw).every(v => rgba(v).a === 0)) return null;
        return {
          id: 'source-' + id + '-' + which,
          type: 'FRAME',
          name: 'Measured source pseudo surface',
          layout: { mode: 'VERTICAL', ...geom },
          absolute,
          fill: color(id + '-' + which + '-fill', raw),
          children: [],
          sourcePseudo: {
            ownerId: id,
            pseudo: which,
            nativePixelsAccepted: false,
          },
        };
      }
      function text(id, ns, mixed) {
        const n = ns.undrr,
          s = n.style,
          atoms = n.texts,
          link = mixed
            ? children(id).find(n => n.tag === 'A')
            : n.tag === 'A'
              ? n
              : null;
        const direct = atoms.map(t => t.characters).join(''),
          chars = mixed
            ? direct + link.texts.map(t => t.characters).join('')
            : direct;
        if (!chars.trim()) return null;
        if (
          mixed &&
          (!link ||
            children(id).length !== 1 ||
            atoms.length !== 2 ||
            atoms[1].characters !== ' ')
        )
          fail('source mixed whole paragraph shape');
        for (const m of modes) {
          const a = ns[m.id].texts.map(t => t.characters).join('');
          if (a !== direct) fail('allmode logical copy');
          if (
            mixed &&
            maps[m.id]
              .get(link.id)
              .texts.map(t => t.characters)
              .join('') !== link.texts.map(t => t.characters).join('')
          )
            fail('allmode inline copy');
        }
        const owner = n.tag === 'A' ? all(n.parentId) : ns,
          left = vals(
            m => px(ns[m].style.paddingLeft) + px(ns[m].style.borderLeftWidth)
          ),
          right = vals(
            m => px(ns[m].style.paddingRight) + px(ns[m].style.borderRightWidth)
          ),
          top = vals(
            m => px(ns[m].style.paddingTop) + px(ns[m].style.borderTopWidth)
          );
        // Inline anchors occupy the owner's entire content capacity, with source fragments retained as evidence.
        if (n.tag === 'A')
          for (const m of modes) {
            left[m.id] =
              owner[m.id].rect.x +
              px(owner[m.id].style.paddingLeft) +
              px(owner[m.id].style.borderLeftWidth) -
              ns[m.id].rect.x;
            top[m.id] =
              owner[m.id].rect.y +
              px(owner[m.id].style.paddingTop) +
              px(owner[m.id].style.borderTopWidth) -
              ns[m.id].rect.y;
          }
        const cap = vals(
          m =>
            owner[m].rect.width -
            px(owner[m].style.paddingLeft) -
            px(owner[m].style.borderLeftWidth) -
            px(owner[m].style.paddingRight) -
            px(owner[m].style.borderRightWidth)
        );
        if (Object.values(cap).some(x => !(x > 0))) fail('whole text capacity');
        const style = font(id + '-text', ns),
          paint = fill(id + '-text-fill', ns, 'color'),
          t = {
            id: 'source-' + id + '-text',
            type: 'TEXT',
            name: 'Whole authored Arabic ' + n.tag,
            characters: chars,
            textStyle: style,
            fill: paint,
            textAlign:
              s.textAlign === 'center'
                ? 'CENTER'
                : s.textAlign === 'left'
                  ? 'LEFT'
                  : 'RIGHT',
            textWrap:
              s.textWrapStyle === 'balance'
                ? 'BALANCE'
                : s.textWrapStyle === 'pretty'
                  ? 'PRETTY'
                  : 'AUTO',
            layout: { width: 'FILL', height: 'HUG' },
            textProperty: scope + ' ' + id,
            sourceText: {
              sourceId: id,
              logicalCopy: chars,
              direction: s.direction,
              fragments: n.texts.map(t => t.rects),
              reflowAccepted: false,
            },
          };
        const run = (node, start, end, st, paint) => {
          const ss = node.style,
            r = {
              id: 'source-' + node.id + '-run',
              start,
              end,
              textStyle: st,
              fill: paint,
              textDecoration:
                ss.textDecorationLine === 'underline' ? 'UNDERLINE' : 'NONE',
            };
          if (node.href) {
            if (/^https:\/\/[^\s]+$/.test(node.href))
              r.hyperlink = { type: 'URL', value: node.href };
          }
          if (
            r.textDecoration === 'UNDERLINE' &&
            ss.textUnderlineOffset !== 'auto'
          )
            r.textDecorationOffset = {
              unit: 'PIXELS',
              value: px(ss.textUnderlineOffset),
            };
          if (ss.textDecorationThickness !== 'auto')
            fail('unsupported underline thickness');
          return r;
        };
        if (mixed) {
          const ln = all(link.id);
          delete t.sourceText;
          t.textRuns = [
            run(n, 0, direct.length, style, paint),
            run(
              link,
              direct.length,
              chars.length,
              font(link.id + '-inline', ln),
              fill(link.id + '-inline-fill', ln, 'color')
            ),
          ];
          delete t.textStyle;
          delete t.fill;
          delete t.textProperty;
        } else if (n.tag === 'A' && /^https:\/\/[^\s]+$/.test(n.href)) {
          t.textRuns = [run(n, 0, chars.length, style, paint)];
          delete t.sourceText;
          delete t.textStyle;
          delete t.fill;
          delete t.textProperty;
        } else if (s.textDecorationLine === 'underline') {
          t.textDecoration = 'UNDERLINE';
          if (s.textUnderlineOffset !== 'auto')
            t.textDecorationOffset = {
              unit: 'PIXELS',
              value: px(s.textUnderlineOffset),
            };
        }
        return {
          id: 'source-' + id + '-flow',
          type: 'FRAME',
          name: 'Whole source owning content capacity',
          layout: {
            mode: 'VERTICAL',
            width: number(id + '-text-capacity', cap),
            height: number(
              id + '-text-flow-height',
              vals(
                m =>
                  owner[m].rect.height -
                  px(owner[m].style.paddingTop) -
                  px(owner[m].style.borderTopWidth) -
                  px(owner[m].style.paddingBottom) -
                  px(owner[m].style.borderBottomWidth)
              )
            ),
            clipsContent: false,
          },
          absolute: {
            horizontal: 'START',
            vertical: 'START',
            offsetX: number(id + '-text-x', left),
            offsetY: number(id + '-text-y', top),
          },
          children: [t],
          sourceLogicalText: {
            ownerId: n.tag === 'A' ? n.parentId : id,
            sourceTextId: id,
            capacityOrigin: 'source owning CSS content box, not ink',
            sourceDirection: s.direction,
            sourceLogicalCharacters: chars,
            sourceFragments: n.texts.map(t => t.rects),
            sourceHref: link?.href || n.href,
            nativeMetricsAccepted: false,
          },
        };
      }
      function convert(id) {
        const ns = all(id),
          n = ns.undrr,
          s = n.style;
        if (
          s.display === 'none' ||
          s.visibility === 'hidden' ||
          Number(s.opacity) === 0 ||
          !n.rect.width ||
          !n.rect.height ||
          ['SELECT', 'OPTION', 'FORM', 'LABEL', 'NOSCRIPT'].includes(n.tag) ||
          n.classes.includes('sr-only') ||
          n.classes.split(' ').includes('mg-skip-link')
        )
          return null;
        const ref = refs.get(id);
        if (ref)
          return {
            id: 'source-' + id,
            type: 'FRAME',
            name: 'Actual contextual ' + ref.family + ' allocation',
            layout: {
              mode: 'VERTICAL',
              width: number(
                id + '-instance-width',
                vals(m => ns[m].rect.width)
              ),
              height: number(
                id + '-instance-height',
                vals(m => ns[m].rect.height)
              ),
              clipsContent: false,
            },
            absolute: placements(id),
            children: [
              {
                id: 'source-' + id + '-context-instance',
                type: 'INSTANCE',
                name: ref.family,
                ...ref,
                layout: { width: 'FILL', height: 'FILL' },
                expose: true,
              },
            ],
            sourceLandingNode: {
              id,
              tag: n.tag,
              classes: n.classes,
              instance: true,
            },
          };
        if (
          ![
            'DIV',
            'MAIN',
            'NAV',
            'UL',
            'LI',
            'SECTION',
            'ARTICLE',
            'P',
            'H1',
            'H2',
            'H3',
            'H4',
            'HEADER',
            'A',
            'SPAN',
            'IMG',
            'BUTTON',
          ].includes(n.tag) ||
          s.clipPath !== 'none' ||
          s.backdropFilter !== 'none' ||
          s.maskImage !== 'none' ||
          s.writingMode !== 'horizontal-tb' ||
          (s.transform !== 'none' &&
            !n.classes.includes('mg-page-header__language-icon'))
        )
          fail('unmapped source primitive ' + id + '/' + n.tag);
        const r = {
          id: 'source-' + id,
          type: 'FRAME',
          name: n.classes || n.tag,
          layout: {
            mode: 'VERTICAL',
            width: number(
              id + '-width',
              vals(m => ns[m].rect.width)
            ),
            height: number(
              id + '-height',
              vals(m => ns[m].rect.height)
            ),
            clipsContent:
              s.overflowX !== 'visible' || s.overflowY !== 'visible',
          },
          fill: fill(id + '-fill', ns, 'backgroundColor'),
          bindings: {
            opacity: number(
              id + '-opacity',
              vals(m => +ns[m].style.opacity * 100)
            ),
          },
          children: [],
          sourceLandingNode: {
            id,
            tag: n.tag,
            classes: n.classes,
            sourceHref: n.href,
            sourceTranslation: s.transform,
          },
        };
        if (id !== row.sourceRootId) r.absolute = placements(id);
        for (const [field, css] of [
          ['topLeftRadius', 'borderTopLeftRadius'],
          ['topRightRadius', 'borderTopRightRadius'],
          ['bottomLeftRadius', 'borderBottomLeftRadius'],
          ['bottomRightRadius', 'borderBottomRightRadius'],
        ])
          r.bindings[field] = number(
            id + '-' + field,
            vals(m => px(ns[m].style[css]))
          );
        const es = ['Top', 'Right', 'Bottom', 'Left'],
          visible = es.filter(e => px(s['border' + e + 'Width']) > 0);
        if (visible.length) {
          for (const m of modes)
            if (
              new Set(visible.map(e => ns[m.id].style['border' + e + 'Color']))
                .size !== 1
            )
              fail('multicolor edges');
          r.stroke = fill(id + '-stroke', ns, 'border' + visible[0] + 'Color');
          r.strokeAlign = 'INSIDE';
          r.bindings.strokeWeight = number(
            id + '-base-stroke',
            vals(() => 0)
          );
          for (const e of es)
            r.bindings['stroke' + e + 'Weight'] = number(
              id + '-stroke-' + e,
              vals(m => px(ns[m].style['border' + e + 'Width']))
            );
        }
        if (s.boxShadow !== 'none') {
          const values = vals(m => {
            const a =
              /^(rgba?\([^)]+\)) (-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px ([\d.]+)px( inset)?$/.exec(
                ns[m].style.boxShadow
              );
            if (!a) fail('source shadow');
            return [
              {
                effect: {
                  type: a[6] ? 'INNER_SHADOW' : 'DROP_SHADOW',
                  color: rgba(a[1]),
                  offset: { x: +a[2], y: +a[3] },
                  radius: +a[4],
                  spread: +a[5],
                  visible: true,
                  blendMode: 'NORMAL',
                },
              },
            ];
          });
          const eid = 'component.' + scope + '.' + id + '.effect';
          upsert(
            prepared.styles.effect,
            {
              id: eid,
              name: 'Mangrove source / ' + eid,
              values,
              sourceRef: {
                file: 'stories/Patterns/LandingPages/LandingPages.jsx',
              },
            },
            'EFFECT'
          );
          r.effectStyle = eid;
        }
        if (n.image) {
          if (Object.values(ns).some(n => !n.image?.complete))
            fail('source image loaded');
          if (n.image.authoredSrc.endsWith('undrr-logo-ar-white.svg')) {
            if (
              logo.sourceSha256 !== audit.normalizedLogoReuse.rawSHA256 ||
              logo.wholePaths !== 18 ||
              Object.values(ns).some(
                n =>
                  n.image.authoredSrc !== ns.undrr.image.authoredSrc ||
                  n.style.objectFit !== 'contain' ||
                  n.style.objectPosition !== '50% 50%'
              )
            )
              fail('source logo contract');
            r.layout.clipsContent = true;
            logo.chunks.forEach((markup, j) =>
              r.children.push({
                id: 'logo-chunk-' + j,
                type: 'SVG',
                layout: {
                  width: number(
                    id + '-logo-width',
                    vals(
                      m =>
                        logo.viewBox[2] *
                        Math.min(
                          ns[m].rect.width / logo.viewBox[2],
                          ns[m].rect.height / logo.viewBox[3]
                        )
                    )
                  ),
                  height: number(
                    id + '-logo-height',
                    vals(
                      m =>
                        logo.viewBox[3] *
                        Math.min(
                          ns[m].rect.width / logo.viewBox[2],
                          ns[m].rect.height / logo.viewBox[3]
                        )
                    )
                  ),
                },
                absolute: {
                  horizontal: 'START',
                  vertical: 'START',
                  offsetX: number(
                    id + '-logo-x',
                    vals(
                      m =>
                        (ns[m].rect.width -
                          logo.viewBox[2] *
                            Math.min(
                              ns[m].rect.width / logo.viewBox[2],
                              ns[m].rect.height / logo.viewBox[3]
                            )) /
                        2
                    )
                  ),
                  offsetY: number(
                    id + '-logo-y',
                    vals(
                      m =>
                        (ns[m].rect.height -
                          logo.viewBox[3] *
                            Math.min(
                              ns[m].rect.width / logo.viewBox[2],
                              ns[m].rect.height / logo.viewBox[3]
                            )) /
                        2
                    )
                  ),
                },
                svg: { assetId: 'arabic-landing-ar-white-' + j, markup },
              })
            );
            return r;
          }
          if (
            n.image.authoredSrc !==
              'https://www.undrr.org/sites/default/files/2023-11/resilient-infrastructure-pikoso-kz-shutterstock.jpg' ||
            Object.values(ns).some(
              n =>
                n.image.naturalWidth !== 1200 ||
                n.image.naturalHeight !== 892 ||
                n.style.objectFit !== 'cover' ||
                n.style.objectPosition !== '50% 50%'
            )
          )
            fail('source image/fit');
          delete r.fill;
          r.image = photo;
          return r;
        }
        if (s.backgroundImage !== 'none') {
          if (s.backgroundImage.includes('toolbar-background.png')) {
            r.layout.clipsContent = true;
            r.children.push({
              id: 'source-' + id + '-toolbar-texture',
              type: 'FRAME',
              name: 'Actual centered source toolbar texture',
              layout: { mode: 'NONE', width: 427, height: 96 },
              absolute: {
                horizontal: 'START',
                vertical: 'START',
                offsetX: number(
                  id + '-texture-x',
                  vals(m => (ns[m].rect.width - 427) / 2)
                ),
                offsetY: number(
                  id + '-texture-y',
                  vals(
                    m =>
                      (ns[m].rect.height -
                        px(ns[m].style.borderBottomWidth) -
                        96) /
                      2
                  )
                ),
              },
              image: texture,
              children: [],
            });
          } else {
            const washes = vals(m => {
                const a = /^linear-gradient\((rgba\([^)]+\)), \1\)$/.exec(
                  ns[m].style.backgroundImage
                );
                if (!a) fail('source background image ' + id);
                return a[1];
              }),
              tint = color(id + '-wash', washes),
              base = r.fill;
            delete r.fill;
            r.children.push({
              id: 'source-' + id + '-gradient',
              type: 'FRAME',
              name: 'Actual layered source wash',
              layout: {
                mode: 'NONE',
                width: r.layout.width,
                height: r.layout.height,
              },
              position: { x: 0, y: 0 },
              children: [],
              gradient: {
                layers: [
                  {
                    stops: [
                      { position: 0, color: tint },
                      { position: 1, color: tint },
                    ],
                    transform: [
                      [1, 0, 0],
                      [0, 1, 0],
                    ],
                  },
                  {
                    stops: [
                      { position: 0, color: base },
                      { position: 1, color: base },
                    ],
                    transform: [
                      [1, 0, 0],
                      [0, 1, 0],
                    ],
                  },
                ],
              },
            });
          }
        }
        for (const which of ['before', 'after'])
          if (
            !['none', 'normal'].includes(n[which].content) &&
            n[which].display !== 'none' &&
            n[which].maskImage === 'none'
          ) {
            const p = pseudo(id, which, ns);
            if (p) r.children.push(p);
          }
        if (n.classes.split(' ').includes('mg-icon')) {
          const index = sample.nodes
              .filter(n => n.classes.split(' ').includes('mg-icon'))
              .findIndex(n => n.id === id),
            ms = Object.fromEntries(
              modes.map(m => [m.id, cases[m.id].maskDiagnostic.masks[index]])
            ),
            d = ms.undrr;
          if (!d || d.hidden || !d.sourceOwnerMirrorExact)
            fail('source icon mirror');
          for (const m of modes)
            if (
              ms[m.id].sourceSvg !== d.sourceSvg ||
              ms[m.id].className !== n.classes
            )
              fail('source glyph definition');
          const paint = color(
              id + '-glyph-fill',
              vals(m => ns[m].before.backgroundColor)
            ),
            g = d.glyphBox;
          r.children.push({
            id: 'source-' + id + '-glyph',
            type: 'SVG',
            name: 'Actual source mask glyph',
            layout: {
              width: number(
                id + '-glyph-width',
                vals(m => ms[m].glyphBox.width)
              ),
              height: number(
                id + '-glyph-height',
                vals(m => ms[m].glyphBox.height)
              ),
            },
            absolute: {
              horizontal: 'START',
              vertical: 'START',
              offsetX: number(
                id + '-glyph-x',
                vals(m => ms[m].glyphBox.x - ns[m].rect.x)
              ),
              offsetY: number(
                id + '-glyph-y',
                vals(m => ms[m].glyphBox.y - ns[m].rect.y)
              ),
            },
            svg: {
              assetId:
                'arabic-landing-' + n.classes.match(/mg-icon-([\w-]+)/)[1],
              markup: d.sourceSvg.replaceAll('currentColor', '#000'),
              monochrome: {
                strokes: paint,
                ...(d.sourceSvg.includes("fill='currentColor'") ||
                d.sourceSvg.includes('fill="currentColor"')
                  ? { fills: paint }
                  : {}),
              },
            },
          });
          return r;
        }
        const mixed =
          n.texts.some(t => t.characters.trim()) &&
          children(id).some(
            c => c.rect.width && c.rect.height && c.style.display !== 'none'
          );
        if (mixed && id !== 'root/node3/node1/node1/node1/node3/node1')
          fail('unhandled mixed logical owner ' + id);
        if (!mixed)
          for (const c of children(id)) {
            const projected = convert(c.id);
            if (projected) r.children.push(projected);
          }
        const t = text(id, ns, mixed);
        if (t) r.children.unshift(t);
        return r;
      }
      const tree = convert(row.sourceRootId);
      function wrapSvg(n) {
        if (n.type === 'SVG')
          for (const field of ['width', 'height'])
            if (typeof n.layout[field] === 'string') {
              const roleValue = prepared.variables.find(
                v => v.name === n.layout[field]
              );
              if (
                !roleValue ||
                new Set(Object.values(roleValue.values)).size !== 1
              )
                fail('source SVG viewport varies by mode');
              n.layout[field] = roleValue.values.undrr;
            }
        if (!n.children) return;
        n.children = n.children.map(c => {
          wrapSvg(c);
          if (c.type !== 'SVG' || !c.absolute) return c;
          const abs = c.absolute;
          delete c.absolute;
          const outer = {
            id: c.id + '-allocation',
            type: 'FRAME',
            name: 'Exact source SVG allocation',
            layout: { mode: 'VERTICAL', ...c.layout, clipsContent: false },
            absolute: abs,
            children: [c],
          };
          return outer;
        });
      }
      if (tree) wrapSvg(tree);
      if (!tree) fail('missing source master');
      const properties = {
          Preset: row.preset,
          SourceViewport: String(row.viewport),
        },
        variant = {
          id: family.id + '.' + row.preset + '.' + row.viewport,
          name: 'Preset=' + row.preset + ', SourceViewport=' + row.viewport,
          properties,
          tree,
          sourceContext: {
            archetype: row.archetype,
            viewport: row.viewport,
            preset: row.preset,
            sourceRootId: row.sourceRootId,
            actualArabic: true,
            nativeAccepted: false,
          },
        };
      variant.sourceSemantics = sample.nodes
        .filter(
          n =>
            n.id === row.sourceRootId || n.id.startsWith(row.sourceRootId + '/')
        )
        .filter(
          n =>
            ['SELECT', 'OPTION', 'FORM', 'LABEL'].includes(n.tag) ||
            n.classes.split(' ').includes('mg-skip-link')
        )
        .map(n => ({
          id: n.id,
          tag: n.tag,
          classes: n.classes,
          select: n.select,
          characters: n.texts.map(t => t.characters).join(''),
          href: n.href,
          display: n.style.display,
          opacity: n.style.opacity,
          nativeBehaviorImplemented: false,
        }));
      family.variants.push(variant);
    }
  if (families.reduce((n, f) => n + f.variants.length, 0) !== 72)
    fail('complete variant closure');
  variables.splice(0, variables.length, ...prepared.variables);
  styles.text.splice(0, styles.text.length, ...prepared.styles.text);
  styles.effect.splice(0, styles.effect.length, ...prepared.styles.effect);
  return families;
}
module.exports = { buildArabicLandingRecipes };
