/** Finite authored Topic and Index compositions. Native pixels and navigation remain open. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const BASE = 'examples/figma-plugin/holistic/assets/landing-topic-index/';
const copy = x => JSON.parse(JSON.stringify(x));
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const fail = x => {
  throw Error('LandingTopicIndex source recipe needs updating: ' + x);
};
function inspectLandingTopicIndexSource({ root }) {
  const read = p => fs.readFileSync(path.join(root, p));
  const bytes = read(BASE + 'source-audit.json');
  if (
    hash(bytes) !==
    'c6a3b2f563c57fc2547e0088efa6d4733d58e678764bb2b5e455f9f3d8dbe9e6'
  )
    fail('Source audit drift');
  const audit = JSON.parse(bytes);
  for (const [p, h] of Object.entries(audit.sourcePins))
    if (hash(read(p)) !== h) fail('Source drift ' + p);
  for (const [p, h] of Object.entries(audit.evidencePins))
    if (hash(read(BASE + p)) !== h) fail('Evidence drift ' + p);
  const source = JSON.parse(read(BASE + 'source-footprints.json'));
  if (source.captures.length !== 20) fail('Exact20 source scenes required');
  return {
    source,
    audit,
    foundations: JSON.parse(read(BASE + 'measured-foundations.json')),
  };
}
function buildLandingTopicIndexRecipes({ root, modes, variables, styles }) {
  const {
    source,
    foundations,
    audit: sourceAudit,
  } = inspectLandingTopicIndexSource({ root });
  let familyId;
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Five exact source modes required');
  const prepared = { variables: copy(variables), styles: copy(styles) };
  const byName = new Map();
  for (const v of prepared.variables) {
    if (byName.has(v.name)) fail('Duplicate role ' + v.name);
    byName.set(v.name, v);
  }
  function resolve(name, mode, type, seen = new Set()) {
    const v = byName.get(name);
    if (!v || v.type !== type || seen.has(name))
      fail('Missing/wrong-type/cyclic role ' + name);
    seen.add(name);
    const value = v.values?.[mode];
    if (value === undefined) fail('Missing mode ' + name);
    if (value && typeof value === 'object' && 'alias' in value) {
      if (Object.keys(value).length !== 1) fail('Malformed alias ' + name);
      return resolve(value.alias, mode, type, seen);
    }
    return value;
  }
  for (const v of foundations)
    for (const mode of modes)
      if (
        byName.get(v.name)?.id !== v.id ||
        JSON.stringify(resolve(v.name, mode.id, v.type)) !==
          JSON.stringify(
            v.values[mode.id]?.alias
              ? (() => {
                  const original = new Map(foundations.map(f => [f.name, f]));
                  function r(n, seen = new Set()) {
                    if (seen.has(n)) fail('Archived alias cycle');
                    seen.add(n);
                    const value = original.get(n)?.values[mode.id];
                    return value?.alias ? r(value.alias, seen) : value;
                  }
                  return r(v.name);
                })()
              : v.values[mode.id]
          )
      )
        fail('Measured foundation changed ' + v.name + '/' + mode.id);
  function upsert(list, entry) {
    const kind =
      list === prepared.variables
        ? 'VARIABLE'
        : list === prepared.styles.text
          ? 'TEXT'
          : 'EFFECT';
    if (kind !== 'VARIABLE')
      for (const other of Object.values(prepared.styles))
        if (
          Array.isArray(other) &&
          other !== list &&
          other.some(v => v.id === entry.id || v.name === entry.name)
        )
          fail('Foreign style kind ' + entry.id);
    const hits = list.filter(v => v.id === entry.id || v.name === entry.name);
    if (
      hits.length > 1 ||
      (hits.length &&
        (hits[0].id !== entry.id ||
          hits[0].name !== entry.name ||
          (kind === 'VARIABLE'
            ? hits[0].type !== entry.type
            : hits[0].type !== undefined && hits[0].type !== kind)))
    )
      fail('Foreign identity ' + entry.id);
    if (
      kind !== 'VARIABLE' &&
      hits.length &&
      (Object.keys(hits[0].values || {})
        .sort()
        .join(',') !==
        modes
          .map(m => m.id)
          .sort()
          .join(',') ||
        modes.some(m =>
          kind === 'TEXT'
            ? !hits[0].values?.[m.id] ||
              typeof hits[0].values[m.id] !== 'object' ||
              Array.isArray(hits[0].values[m.id]) ||
              !hits[0].values[m.id].fontName ||
              typeof hits[0].values[m.id].fontName !== 'object' ||
              Array.isArray(hits[0].values[m.id].fontName) ||
              typeof hits[0].values[m.id].fontName.family !== 'string' ||
              !hits[0].values[m.id].fontName.family.trim() ||
              typeof hits[0].values[m.id].fontName.style !== 'string' ||
              !hits[0].values[m.id].fontName.style.trim()
            : !Array.isArray(hits[0].values?.[m.id])
        ))
    )
      fail('Foreign style values ' + entry.id);
    if (hits.length) list[list.indexOf(hits[0])] = entry;
    else list.push(entry);
    if (kind === 'VARIABLE') byName.set(entry.name, entry);
  }

  const vals = fn => Object.fromEntries(modes.map(m => [m.id, fn(m.id)]));
  const sourceRef = {
    file: 'stories/Patterns/LandingPages/LandingPages.jsx',
    line: 1,
  };
  let context;
  function role(field, type, values) {
    const name = 'component/' + familyId + '/' + context + '/' + field;
    upsert(prepared.variables, {
      id: name,
      name,
      type,
      scopes: ['ALL_SCOPES'],
      values,
      sourceRef,
      description:
        type === 'COLOR'
          ? 'Actual finite source-computed LandingTopicIndex paint. Independent captured owner/context, not an inferred public token alias or live maintenance relationship. Native rendering/publication remain open.'
          : 'Actual finite LandingTopicIndex allocation. Native metrics/render/behavior/publication remain open.',
    });
    return name;
  }
  function number(field, values) {
    if (Object.values(values).some(v => !Number.isFinite(v)))
      fail('Nonfinite allocation ' + field);
    return role(field, 'FLOAT', values);
  }
  function rgba(raw) {
    const match = /^rgba?\(([^)]+)\)$/.exec(raw);
    if (!match) fail('Unsupported source color ' + raw);
    const v = match[1].split(',').map(Number);
    if (![3, 4].includes(v.length) || v.some(n => !Number.isFinite(n)))
      fail('Malformed source color');
    return { r: v[0] / 255, g: v[1] / 255, b: v[2] / 255, a: v[3] ?? 1 };
  }
  function color(field, values) {
    // Computed source paint proves a finite captured value, not a public token identity.
    // Keep each authored owner/context role independent even when profiles are equal.
    return role(
      field,
      'COLOR',
      vals(m => rgba(values[m]))
    );
  }
  function font(all, field, sizeAlias) {
    const values = vals(m => {
      const s = all[m].style;
      const family = s.fontFamily.includes('Roboto Condensed')
        ? 'Roboto Condensed'
        : s.fontFamily.startsWith('Roboto,')
          ? 'Roboto'
          : null;
      if (
        !family ||
        ![400, 600, 700].includes(Number(s.fontWeight)) ||
        s.fontStyle !== 'normal' ||
        !['none', 'underline'].includes(s.textDecorationLine) ||
        !Number.isFinite(parseFloat(s.lineHeight))
      )
        fail('Unsupported source font ' + field);
      const familyRole =
        family === 'Roboto' ? 'font-family/text' : 'font-family/ui';
      if (resolve(familyRole, m, 'STRING') !== family)
        fail('Source font role changed');
      if (
        sizeAlias &&
        resolve(sizeAlias, m, 'FLOAT') !== parseFloat(s.fontSize)
      )
        fail('Source font size alias changed ' + sizeAlias);
      return {
        fontName: {
          family,
          style: Number(s.fontWeight) >= 600 ? 'Bold' : 'Regular',
        },
        fontSize: parseFloat(s.fontSize),
        lineHeight: { unit: 'PIXELS', value: parseFloat(s.lineHeight) },
        letterSpacing: {
          unit: 'PIXELS',
          value: s.letterSpacing === 'normal' ? 0 : parseFloat(s.letterSpacing),
        },
        paragraphSpacing: 0,
        paragraphIndent: 0,
        textDecoration: 'NONE',
        textWrapStyle:
          s.textWrapStyle === 'balance'
            ? 'BALANCE'
            : s.textWrapStyle === 'pretty'
              ? 'PRETTY'
              : 'AUTO',
      };
    });
    const id = 'component.' + familyId + '.' + context + '.' + field;
    upsert(prepared.styles.text, {
      id,
      name: 'Mangrove draft / ' + id,
      values,
      bindings: {
        fontFamily:
          values.undrr.fontName.family === 'Roboto'
            ? 'font-family/text'
            : 'font-family/ui',
        fontSize: role(
          field + '-size',
          'FLOAT',
          sizeAlias
            ? vals(() => ({ alias: sizeAlias }))
            : vals(m => values[m].fontSize)
        ),
      },
      sourceRef,
      description:
        'Source Regular400/Bold700; requested source600 uses browser-metric/inventory CSS matching candidateBold700. Native font-byte/glyph/reflow equivalence not established.',
    });
    return id;
  }

  const familySpecs = [
    [
      'landing-topic-index-breadcrumb',
      'Actual authored Topic/Index breadcrumbs',
    ],
    ['landing-topic-hero', 'Actual authored Topic split2/3 Hero'],
    ['landing-topic-icon-card', 'Actual authored Topic route/fact IconCards'],
    [
      'landing-topic-related-card',
      'Actual authored Topic no-image related VerticalCards',
    ],
    [
      'landing-topic-soft-cta',
      'Actual authored Topic left-aligned soft TextCta',
    ],
    [
      'landing-index-book-card',
      'Actual authored Index BookCard collection items',
    ],
    ['landing-topic-page', 'Actual authored Topic landing composition'],
    ['landing-index-page', 'Actual authored Index landing composition'],
  ];
  const families = familySpecs.map(([id, name]) => ({
    id,
    name: 'Mangrove source / ' + name,
    kind: 'component-set',
    sourceRef,
    review: { genericLabels: false, preserveVariantSizing: true },
    variantProperties: {},
    variants: [],
    limitations: [
      'Actual finite English authored source at390/1164 across five brands. Arabic/RTL and other caller data remain open.',
      'Whole logical text capacities and source initial inline caret allocations; arbitrary edited-copy reflow and edited inline caret layout remain open.',
      'Genuine contextual source masters and nested INSTANCE composition. No generic replacement or full-page raster.',
      'Native font bytes/glyphs, images/crops, gradients, field and pixel fidelity, live mode changes, behavior, ordinary installed plugin, publication and novice handoff remain open.',
    ],
  }));
  const byFamily = new Map(families.map(f => [f.id, f]));
  const photoPath =
    'examples/figma-plugin/holistic/assets/content-hub/resilient-infrastructure.jpg';
  const photo = {
    assetId: 'content-hub-resilient-infrastructure',
    base64: fs.readFileSync(path.join(root, photoPath)).toString('base64'),
    scaleMode: 'FILL',
  };
  const brand = m => (m === 'mcr' ? 'mcr2030' : m);
  const scenes = new Map(source.captures.map(c => [c.file, c.capture]));
  const pendingPages = [];
  function addVariant(f, properties, tree, metadata) {
    const id = f.id + '.' + Object.values(properties).join('.');
    for (const [k, v] of Object.entries(properties)) {
      f.variantProperties[k] ||= [];
      if (!f.variantProperties[k].includes(v)) f.variantProperties[k].push(v);
    }
    const variant = {
      id,
      name: Object.entries(properties)
        .map(([k, v]) => k + '=' + v)
        .join(', '),
      properties,
      tree,
      sourceRef,
      sourceContract: metadata,
    };
    f.variants.push(variant);
    return variant;
  }
  for (const archetype of ['topic', 'index'])
    for (const viewport of [390, 1164]) {
      const captures = vals(m =>
        scenes.get(`${brand(m)}-${archetype}-${viewport}.json`)
      );
      if (
        Object.values(captures).some(
          c =>
            !c ||
            c.fontStatus !== 'loaded' ||
            Object.values(c.aliases).some(v => !v) ||
            !c.pseudoDiagnostic.originalMarkupRestored
        )
      )
        fail('Missing settled actual source scene');
      const maps = vals(m => new Map(captures[m].nodes.map(n => [n.id, n])));
      const sample = captures.undrr,
        all = id => vals(m => maps[m].get(id));
      for (const m of modes)
        if (
          JSON.stringify(
            captures[m.id].nodes.map(n => [
              n.id,
              n.parentId,
              n.tag,
              n.classes,
              n.text,
            ])
          ) !==
          JSON.stringify(
            sample.nodes.map(n => [n.id, n.parentId, n.tag, n.classes, n.text])
          )
        )
          fail('Cross-mode source anatomy/copy changed');
      const nativeInstances = new Map();
      const actions = sample.nodes.filter(
        n =>
          n.classes === 'mg-button mg-button-primary' &&
          n.id.startsWith('root/node3') &&
          n.rect.width > 0
      );
      if (actions.length !== (archetype === 'topic' ? 1 : 0))
        fail('Exact authored CTA action required');
      for (const action of actions) {
        const nodes = all(action.id);
        for (const m of modes) {
          const a = nodes[m.id],
            st = a.style;
          if (
            parseFloat(st.fontSize) !==
              resolve('font-size/button', m.id, 'FLOAT') ||
            parseFloat(st.lineHeight) !==
              resolve('font-size/button', m.id, 'FLOAT') ||
            st.fontWeight !== '600' ||
            st.textDecorationLine !== 'none' ||
            a.text !== 'Open the Monitor'
          )
            fail('Normal Button action typography/copy changed');
          for (const [css, roleName] of [
            ['paddingTop', 'padding/button/block'],
            ['paddingBottom', 'padding/button/block'],
            ['paddingLeft', 'padding/button/inline'],
            ['paddingRight', 'padding/button/inline'],
            ...['Top', 'Right', 'Bottom', 'Left'].map(edge => [
              'border' + edge + 'Width',
              'border-width/button',
            ]),
            ...['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'].map(
              corner => ['border' + corner + 'Radius', 'radius/button']
            ),
            ['gap', 'spacing/50'],
          ])
            if (parseFloat(st[css]) !== resolve(roleName, m.id, 'FLOAT'))
              fail('Source normal Button allocation alias changed');
          if (
            st.fontFamily !== 'Roboto, sans-serif' ||
            st.fontStyle !== 'normal' ||
            st.backgroundImage !== 'none' ||
            st.boxShadow !== 'none'
          )
            fail('Source normal Button font/appearance changed');
          for (const [css, roleName] of [
            ['color', 'color/button'],
            ['backgroundColor', 'color/button-background'],
            ...['Top', 'Right', 'Bottom', 'Left'].map(edge => [
              'border' + edge + 'Color',
              'border-color/button-primary',
            ]),
          ]) {
            const actual = rgba(st[css]),
              expected = resolve(roleName, m.id, 'COLOR');
            if (
              ['r', 'g', 'b'].some(
                k =>
                  Math.round(actual[k] * 255) !== Math.round(expected[k] * 255)
              ) ||
              actual.a !== (expected.a ?? 1)
            )
              fail('Source normal Button paint alias changed');
          }
        }
        nativeInstances.set(action.id, {
          family: 'page-chrome-button',
          variant: {
            Emphasis: 'Primary',
            Treatment: 'Filled',
            State: 'Default',
          },
          overrides: { Label: action.text },
        });
      }

      function styleFill(field, nodes, styleField) {
        return color(
          field,
          vals(m => nodes[m].style[styleField])
        );
      }
      function pseudoNode(id, pseudo, nodes) {
        const diagnostics = vals(m =>
          captures[m].pseudoDiagnostic.diagnostics.find(
            d => d.ownerId === id && d.pseudo === pseudo
          )
        );
        if (Object.values(diagnostics).some(d => !d))
          fail('Missing measured source pseudo');
        const diag = diagnostics.undrr,
          style = diag.style;
        const geometry = {
          width: number(
            id + '-' + pseudo + '-width',
            vals(m => diagnostics[m].rect.width)
          ),
          height: number(
            id + '-' + pseudo + '-height',
            vals(m => diagnostics[m].rect.height)
          ),
        };
        const absolute = {
          horizontal: 'START',
          vertical: 'START',
          offsetX: number(
            id + '-' + pseudo + '-x',
            vals(m => diagnostics[m].rect.x - nodes[m].rect.x)
          ),
          offsetY: number(
            id + '-' + pseudo + '-y',
            vals(m => diagnostics[m].rect.y - nodes[m].rect.y)
          ),
        };
        if (
          style['border-top-width'] !== '0px' ||
          style['border-right-width'] !== '0px'
        ) {
          const side = diag.untransformedRect.width,
            border = parseFloat(style['border-top-width']);
          if (
            style['border-right-width'] !== style['border-top-width'] ||
            style['border-bottom-width'] !== '0px' ||
            style['border-left-width'] !== '0px' ||
            style.transform !==
              'matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 0)'
          )
            fail('Source caret border/rotation changed');
          for (const m of modes)
            if (
              diagnostics[m.id].untransformedRect.width !== side ||
              diagnostics[m.id].style['border-top-width'] !==
                style['border-top-width']
            )
              fail('Source caret requires additional mode sizing');
          const v = side * Math.SQRT2,
            rotate = ([x, y]) => [
              (x - y + side) / Math.SQRT2,
              (x + y) / Math.SQRT2,
            ],
            polygon = points =>
              `<polygon fill="#000000" points="${points.map(p => rotate(p).join(',')).join(' ')}"/>`;
          const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${v} ${v}">${polygon(
            [
              [0, 0],
              [side, 0],
              [side, border],
              [0, border],
            ]
          )}${polygon([
            [side - border, border],
            [side, border],
            [side, side],
            [side - border, side],
          ])}</svg>`;
          return {
            id: 'source-' + id + '-' + pseudo + '-caret',
            type: 'FRAME',
            name: 'Actual initial source ' + pseudo + ' caret allocation',
            layout: { mode: 'NONE', ...geometry },
            absolute,
            children: [
              {
                id: 'source-' + id + '-' + pseudo + '-caret-ink',
                type: 'SVG',
                name: 'Source quantized CSS border chevron',
                layout: { width: v, height: v },
                svg: {
                  assetId: 'landing-source-caret-' + side + '-' + border,
                  markup,
                  monochrome: {
                    fills: color(
                      id + '-' + pseudo + '-color',
                      vals(m => diagnostics[m].style['border-top-color'])
                    ),
                  },
                },
              },
            ],
            sourcePseudo: {
              ownerId: id,
              pseudo,
              method: captures.undrr.pseudoDiagnostic.method,
              nativeContoursAccepted: false,
              editedInlineLayoutAccepted: false,
            },
          };
        }
        if (
          style['background-image'] !== 'none' ||
          style['box-shadow'] !== 'none' ||
          style.transform !== 'none'
        )
          fail('Unsupported visual source pseudo');
        const raw = vals(m => diagnostics[m].style['background-color']);
        if (Object.values(raw).every(c => rgba(c).a === 0)) return null;
        return {
          id: 'source-' + id + '-' + pseudo + '-surface',
          type: 'FRAME',
          name: 'Actual full-width source pseudo surface',
          layout: { mode: 'VERTICAL', ...geometry },
          absolute,
          fill: color(id + '-' + pseudo + '-surface', raw),
          children: [],
          sourcePseudo: {
            ownerId: id,
            pseudo,
            method: captures.undrr.pseudoDiagnostic.method,
            nativePixelsAccepted: false,
          },
        };
      }
      function convert(id, rootId, ignoreInstances = false) {
        const nodes = all(id),
          n = nodes.undrr,
          s = n.style;
        if (!nodes || Object.values(nodes).some(n => !n))
          fail('Missing source node ' + id);
        if (id !== rootId && nativeInstances.has(id)) {
          const ref = nativeInstances.get(id),
            parent = all(n.parentId);
          return {
            id: 'source-' + id,
            type: 'FRAME',
            name: 'Actual ' + ref.family + ' allocation',
            layout: {
              mode: 'VERTICAL',
              width: number(
                id + '-instance-width',
                vals(m => nodes[m].rect.width)
              ),
              height: number(
                id + '-instance-height',
                vals(m => nodes[m].rect.height)
              ),
              clipsContent: false,
            },
            absolute: {
              horizontal: 'START',
              vertical: 'START',
              offsetX: number(
                id + '-instance-x',
                vals(m => nodes[m].rect.x - parent[m].rect.x)
              ),
              offsetY: number(
                id + '-instance-y',
                vals(m => nodes[m].rect.y - parent[m].rect.y)
              ),
            },
            children: [
              {
                id: 'source-' + id + '-instance',
                type: 'INSTANCE',
                name: 'Actual ' + ref.family,
                family: ref.family,
                variant: ref.variant,
                ...(ref.overrides ? { overrides: ref.overrides } : {}),
                expose: true,
                layout: { width: 'FILL', height: 'FILL' },
                sourceHref: n.href,
              },
            ],
            sourceLandingNode: {
              id,
              tag: n.tag,
              classes: n.classes,
              instance: true,
            },
          };
        }
        if (
          s.display === 'none' ||
          s.visibility === 'hidden' ||
          n.rect.width === 0 ||
          n.rect.height === 0
        )
          return null;
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
            'HEADER',
            'A',
            'SPAN',
            'IMG',
          ].includes(n.tag) ||
          s.transform !== 'none' ||
          s.clipPath !== 'none' ||
          s.backdropFilter !== 'none'
        )
          fail('Unsupported actual source primitive ' + n.tag + '/' + id);
        const r = {
          id: 'source-' + id,
          type: 'FRAME',
          name: n.classes || n.tag,
          layout: {
            mode: 'VERTICAL',
            width: number(
              id + '-width',
              vals(m => nodes[m].rect.width)
            ),
            height: number(
              id + '-height',
              vals(m => nodes[m].rect.height)
            ),
            clipsContent:
              s.overflowX !== 'visible' || s.overflowY !== 'visible',
          },
          fill: styleFill(id + '-fill', nodes, 'backgroundColor'),
          bindings: {
            opacity: number(
              id + '-opacity',
              vals(m => Number(nodes[m].style.opacity) * 100)
            ),
          },
          children: [],
          sourceLandingNode: { id, tag: n.tag, classes: n.classes },
        };
        if (id !== rootId) {
          const parent = all(n.parentId);
          r.absolute = {
            horizontal: 'START',
            vertical: 'START',
            offsetX: number(
              id + '-x',
              vals(m => nodes[m].rect.x - parent[m].rect.x)
            ),
            offsetY: number(
              id + '-y',
              vals(m => nodes[m].rect.y - parent[m].rect.y)
            ),
          };
        }
        for (const [field, css] of [
          ['topLeftRadius', 'borderTopLeftRadius'],
          ['topRightRadius', 'borderTopRightRadius'],
          ['bottomLeftRadius', 'borderBottomLeftRadius'],
          ['bottomRightRadius', 'borderBottomRightRadius'],
        ]) {
          if (modes.some(m => /%/.test(nodes[m.id].style[css])))
            fail('Unresolved percentage source radius');
          r.bindings[field] = number(
            id + '-' + field,
            vals(m => parseFloat(nodes[m].style[css]))
          );
        }
        const edges = ['Top', 'Right', 'Bottom', 'Left'],
          visible = edges.filter(
            e => parseFloat(s['border' + e + 'Width']) > 0
          );
        if (visible.length) {
          for (const m of modes)
            if (
              new Set(
                visible.map(e => nodes[m.id].style['border' + e + 'Color'])
              ).size !== 1
            )
              fail('Different source border paints');
          r.stroke = styleFill(
            id + '-border',
            nodes,
            'border' + visible[0] + 'Color'
          );
          r.strokeAlign = 'INSIDE';
          r.bindings.strokeWeight = number(
            id + '-base-stroke',
            vals(() => 0)
          );
          for (const edge of edges)
            r.bindings['stroke' + edge + 'Weight'] = number(
              id + '-stroke-' + edge,
              vals(m => parseFloat(nodes[m].style['border' + edge + 'Width']))
            );
        }
        if (s.boxShadow !== 'none') {
          const values = vals(m => {
            const match =
              /^(rgba?\([^)]+\)) (-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px ([\d.]+)px( inset)?$/.exec(
                nodes[m].style.boxShadow
              );
            if (!match) fail('Unsupported source shadow');
            return [
              {
                effect: {
                  type: match[6] ? 'INNER_SHADOW' : 'DROP_SHADOW',
                  color: rgba(match[1]),
                  offset: { x: +match[2], y: +match[3] },
                  radius: +match[4],
                  spread: +match[5],
                  visible: true,
                  blendMode: 'NORMAL',
                },
              },
            ];
          });
          const styleId =
            'component.' + familyId + '.' + context + '.' + id + '.effect';
          upsert(prepared.styles.effect, {
            id: styleId,
            name: 'Mangrove draft / ' + styleId,
            values,
            sourceRef,
          });
          r.effectStyle = styleId;
        }
        if (s.backgroundImage !== 'none') {
          const washes = vals(m => {
            const match = /^linear-gradient\((rgba\([^)]+\)), \1\)$/.exec(
              nodes[m].style.backgroundImage
            );
            if (!match) fail('Unsupported source gradient');
            return match[1];
          });
          const tint = color(id + '-gradient-wash', washes),
            base = r.fill;
          delete r.fill;
          r.children.push({
            id: r.id + '-source-gradient',
            type: 'FRAME',
            name: 'Actual source layered gradient leaf',
            layout: {
              mode: 'NONE',
              width: r.layout.width,
              height: r.layout.height,
            },
            absolute: {
              horizontal: 'START',
              vertical: 'START',
              offsetX: number(
                id + '-gradient-x',
                vals(() => 0)
              ),
              offsetY: number(
                id + '-gradient-y',
                vals(() => 0)
              ),
            },
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
            sourcePseudo: {
              ownerId: id,
              pseudo: 'own-gradient',
              nativePixelsAccepted: false,
            },
          });
        }
        for (const pseudo of ['before', 'after']) {
          const ps = n[pseudo];
          if (
            !['none', 'normal'].includes(ps.content) &&
            ps.display !== 'none' &&
            ps.maskImage === 'none'
          ) {
            const layer = pseudoNode(id, pseudo, nodes);
            if (layer) r.children.push(layer);
          }
        }
        if (n.tag === 'IMG') {
          if (
            Object.values(nodes).some(
              n =>
                !n.image?.complete ||
                n.image.naturalWidth !== 1200 ||
                n.image.naturalHeight !== 892 ||
                n.image.authoredSrc !== sourceAudit.image.sourceURL ||
                n.style.objectFit !== 'cover' ||
                n.style.objectPosition !== '50% 50%'
            )
          )
            fail('Exact authored source image/fit changed');
          delete r.fill;
          r.image = photo;
          r.sourceImage = sourceAudit.image;
          return r;
        }
        if (s.maskImage !== 'none') fail('Unexpected element source mask');
        if (n.classes.split(' ').includes('mg-icon')) {
          const before = nodes.undrr.before,
            markup = /^url\("data:image\/svg\+xml,(.*)"\)$/.exec(
              before.maskImage
            )?.[1];
          if (!markup) fail('Missing source icon mask');
          for (const m of modes)
            if (
              nodes[m.id].before.maskImage !== before.maskImage ||
              nodes[m.id].before.width !== before.width ||
              nodes[m.id].before.height !== before.height
            )
              fail('Source icon viewports require explicit sizing capability');
          const decoded = decodeURIComponent(markup),
            glyph = n.classes.match(/mg-icon-([\w-]+)/)?.[1];
          const css = fs.readFileSync(
            path.join(root, 'stories/Atom/Icons/_icon-definitions.scss'),
            'utf8'
          );
          const expected = new RegExp(
            String.raw`\.mg-icon-${glyph}::before \{[\s\S]*?data:image/svg\+xml,([^"\n]+)`
          ).exec(css)?.[1];
          if (decoded !== expected) fail('Source icon definition mismatch');
          const fill = color(
            id + '-glyph-color',
            vals(m => nodes[m].before.backgroundColor)
          );
          const ink = {
            id: r.id + '-glyph',
            type: 'SVG',
            name: 'Actual source ' + glyph + ' mask',
            layout: {
              width: parseFloat(before.width),
              height: parseFloat(before.height),
            },
            svg: {
              assetId: 'landing-topic-' + glyph,
              markup: decoded,
              monochrome: {
                strokes: fill,
                ...(decoded.includes("fill='currentColor'")
                  ? { fills: fill }
                  : {}),
              },
            },
            sourceIcon: {
              glyph,
              sourceMask: before.maskImage,
              sourceLinebox: { width: n.rect.width, height: n.rect.height },
              sourceViewport: {
                width: parseFloat(before.width),
                height: parseFloat(before.height),
              },
              nativeContoursAccepted: false,
            },
          };
          r.sourceIcon = ink.sourceIcon;
          delete ink.sourceIcon;
          r.children.push(ink);
          return r;
        }
        for (const child of sample.nodes.filter(k => k.parentId === id)) {
          const p = convert(child.id, rootId, ignoreInstances);
          if (p) r.children.push(p);
        }
        const textNodes = n.texts.filter(t => t.characters.trim());
        if (textNodes.length) {
          if (textNodes.length !== 1 || r.children.some(c => !c.sourcePseudo))
            fail('Mixed logical source text requires explicit runs ' + id);
          const chars = textNodes[0].characters,
            left = vals(
              m =>
                parseFloat(nodes[m].style.paddingLeft) +
                parseFloat(nodes[m].style.borderLeftWidth)
            ),
            right = vals(
              m =>
                parseFloat(nodes[m].style.paddingRight) +
                parseFloat(nodes[m].style.borderRightWidth)
            ),
            top = vals(
              m =>
                parseFloat(nodes[m].style.paddingTop) +
                parseFloat(nodes[m].style.borderTopWidth)
            );
          const owner = n.tag === 'A' && n.parentId ? all(n.parentId) : nodes;
          if (
            n.tag === 'LI' &&
            !['none', 'normal'].includes(
              s.before?.content || n.before.content
            ) &&
            n.before.position !== 'absolute'
          )
            for (const m of modes)
              left[m.id] =
                nodes[m.id].texts.find(t => t.characters.trim()).rects[0].x -
                nodes[m.id].rect.x;
          const capacity = vals(
            m =>
              owner[m].rect.width -
              (n.tag === 'A'
                ? Math.max(
                    nodes[m].rect.x - owner[m].rect.x,
                    parseFloat(owner[m].style.paddingLeft) +
                      parseFloat(owner[m].style.borderLeftWidth)
                  )
                : left[m]) -
              parseFloat(owner[m].style.paddingRight) -
              parseFloat(owner[m].style.borderRightWidth)
          );
          const text = {
            id: r.id + '-text',
            type: 'TEXT',
            name: 'Actual whole logical source ' + n.tag,
            characters: chars,
            textStyle: font(nodes, id + '-text', null),
            fill: styleFill(id + '-text-color', nodes, 'color'),
            textAlign: s.textAlign === 'center' ? 'CENTER' : 'LEFT',
            textWrap:
              s.textWrapStyle === 'balance'
                ? 'BALANCE'
                : s.textWrapStyle === 'pretty'
                  ? 'PRETTY'
                  : 'AUTO',
            layout: {
              width: number(id + '-text-capacity', capacity),
              height: 'HUG',
            },
            absolute: {
              horizontal: 'START',
              vertical: 'START',
              offsetX: number(id + '-text-x', left),
              offsetY: number(id + '-text-y', top),
            },
            textProperty: context + ' ' + id,
          };
          if (n.tag === 'A') {
            r.sourceHref = n.href;
            if (/^https:\/\/[^\s]+$/.test(n.href)) {
              const run = {
                id: r.id + '-link',
                start: 0,
                end: chars.length,
                textStyle: text.textStyle,
                fill: text.fill,
                hyperlink: { type: 'URL', value: n.href },
                textDecoration:
                  s.textDecorationLine === 'underline' ? 'UNDERLINE' : 'NONE',
              };
              if (
                run.textDecoration === 'UNDERLINE' &&
                s.textUnderlineOffset !== 'auto'
              ) {
                const offset = parseFloat(s.textUnderlineOffset);
                if (
                  !s.textUnderlineOffset.endsWith('px') ||
                  !Number.isFinite(offset)
                )
                  fail('Unsupported source underline offset');
                run.textDecorationOffset = { unit: 'PIXELS', value: offset };
              }
              text.textRuns = [run];
              delete text.textStyle;
              delete text.fill;
              delete text.textProperty;
            }
          }
          const flowHeight = vals(
            m =>
              owner[m].rect.height -
              parseFloat(owner[m].style.paddingTop) -
              parseFloat(owner[m].style.borderTopWidth) -
              parseFloat(owner[m].style.paddingBottom) -
              parseFloat(owner[m].style.borderBottomWidth)
          );
          const flow = {
            id: r.id + '-logical-flow',
            type: 'FRAME',
            name: 'Actual logical source text capacity',
            layout: {
              mode: 'VERTICAL',
              width: text.layout.width,
              height: number(id + '-text-flow-height', flowHeight),
              clipsContent: false,
            },
            absolute: text.absolute,
            children: [text],
            sourceLogicalText: {
              ownerId: n.tag === 'A' ? n.parentId : id,
              sourceTextId: id,
              capacityOrigin:
                'actual owning CSS content box, not inline ink range',
              nativeMetricsAccepted: false,
            },
          };
          delete text.absolute;
          text.layout.width = 'FILL';
          r.children.unshift(flow);
        }
        return r;
      }
      function masterFor(family, node, preset) {
        familyId = family;
        context = archetype + '-' + preset + '-' + viewport;
        const tree = convert(node.id, node.id, true);
        if (!tree) fail('Missing genuine source master');
        const dependencyFamilies = [
          ...new Set(
            (function walk(t) {
              return [t, ...(t.children || []).flatMap(walk)];
            })(tree)
              .filter(n => n.type === 'INSTANCE')
              .map(n => n.family)
          ),
        ];
        const variant = addVariant(
          byFamily.get(family),
          { Preset: preset, SourceViewport: String(viewport) },
          tree,
          {
            archetype,
            viewport,
            preset,
            sourceRootId: node.id,
            dependencies: dependencyFamilies,
            actualSourceUnmodified: true,
          }
        );
        nativeInstances.set(node.id, { family, variant: variant.properties });
        return variant;
      }
      const breadcrumb = sample.nodes.find(
        n => n.tag === 'NAV' && n.classes.startsWith('mg-breadcrumb')
      );
      if (!breadcrumb) fail('Missing actual breadcrumb');
      masterFor('landing-topic-index-breadcrumb', breadcrumb, archetype);
      const main = sample.nodes.find(n => n.tag === 'MAIN');
      if (!main) fail('Missing actual main');
      if (archetype === 'topic') {
        const hero = sample.nodes.find(
          n => n.classes === 'mg-hero mg-hero--split mg-hero--split-2-3'
        );
        if (!hero) fail('Exact source split Hero required');
        masterFor('landing-topic-hero', hero, 'SplitTwoThirds');
        const icons = sample.nodes.filter(
          n =>
            n.tag === 'ARTICLE' &&
            n.classes === 'mg-card mg-card__icon mg-card__icon--horizontal'
        );
        if (icons.length !== 7) fail('Exact three routes/four facts required');
        icons.forEach((n, i) =>
          masterFor(
            'landing-topic-icon-card',
            n,
            i < 3 ? 'Route' + (i + 1) : 'Fact' + (i - 2)
          )
        );
        const related = sample.nodes.filter(
          n =>
            n.tag === 'ARTICLE' &&
            n.classes === 'mg-card mg-card__vc' &&
            n.rect.width > 0
        );
        if (related.length !== 3) fail('Exact three related items required');
        related.forEach((n, i) =>
          masterFor('landing-topic-related-card', n, 'Related' + (i + 1))
        );
        const cta = sample.nodes.find(
          n => n.classes === 'mg-cta mg-cta--primary mg-cta--soft'
        );
        if (!cta) fail('Exact soft CTA required');
        masterFor('landing-topic-soft-cta', cta, 'SoftLeft');
      } else {
        const books = sample.nodes.filter(
          n =>
            n.tag === 'ARTICLE' &&
            n.classes === 'mg-card mg-card__vc mg-card__book'
        );
        if (books.length !== 9)
          fail('Three genuine three-book groups required');
        books.forEach((n, i) =>
          masterFor(
            'landing-index-book-card',
            n,
            'Group' + (Math.floor(i / 3) + 1) + 'Book' + ((i % 3) + 1)
          )
        );
      }
      pendingPages.push({
        archetype,
        viewport,
        sample,
        captures,
        all,
        convert,
        nativeInstances,
      });
    }
  for (const p of pendingPages) {
    const { archetype, viewport, sample, captures, all, convert } = p;
    familyId = 'landing-' + archetype + '-page';
    context = archetype + '-scene-' + viewport;
    const shell = sample.nodes.find(
      n => n.classes === 'mg-demo-shell | mg-container'
    );
    if (!shell) fail('Genuine landing shell required');
    const rootNodes = all('root'),
      tree = {
        id: 'landing-page-root',
        type: 'FRAME',
        name: 'Actual ' + archetype + ' landing page',
        layout: {
          mode: 'VERTICAL',
          width: viewport,
          height: number(
            'page-height',
            vals(m => rootNodes[m].rect.height)
          ),
          clipsContent: false,
        },
        fill: role(
          'page-transparent',
          'COLOR',
          vals(() => ({ r: 0, g: 0, b: 0, a: 0 }))
        ),
        children: [],
      };
    const chromeHeight = viewport === 390 ? 118 : 131;
    tree.children.push({
      id: 'actual-site-chrome',
      type: 'INSTANCE',
      name: 'Actual closed English source chrome',
      family: 'page-chrome',
      variant: { Viewport: String(viewport), State: 'Closed' },
      expose: true,
      layout: { width: viewport, height: chromeHeight },
    });
    const body = convert(shell.id, 'root');
    if (!body) fail('Missing source body');
    tree.children.push(body);
    const metadata = {
      archetype,
      viewport,
      sourceRoot: 'root',
      sourcePageHeight: vals(m => rootNodes[m].rect.height),
      sourceDocumentMinimumViewport: 1000,
      dependencies: [
        ...new Set(
          ['page-chrome', ...p.nativeInstances.values()].map(x =>
            typeof x === 'string' ? x : x.family
          )
        ),
      ],
      sourceLocale: 'english',
      nativeAccepted: false,
    };
    addVariant(
      byFamily.get(familyId),
      { SourceViewport: String(viewport) },
      tree,
      metadata
    );
  }
  for (const family of families)
    if (!family.variants.length) fail('Empty source cohort');
  variables.splice(0, variables.length, ...prepared.variables);
  styles.text.splice(0, styles.text.length, ...prepared.styles.text);
  styles.effect.splice(0, styles.effect.length, ...prepared.styles.effect);
  return families;
}
module.exports = {
  inspectLandingTopicIndexSource,
  buildLandingTopicIndexRecipes,
};
