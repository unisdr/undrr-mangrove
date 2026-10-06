'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto'),
  zlib = require('zlib');
const ASSET = 'examples/figma-plugin/holistic/assets/layout-foundations/';
const PROVENANCE =
  '7c1a8a2b3ae1e134ffe4eda79c6f127db8e7dc255e8fe9654f56d04192373e87';
function buildLayoutFoundationsRecipes({ root, modes, variables, styles }) {
  const target = { variables, styles };
  variables = structuredClone(variables);
  styles = structuredClone(styles);
  const fail = s => {
      throw Error('Layout foundations source changed: ' + s);
    },
    read = f => fs.readFileSync(path.join(root, f)),
    sha = b => crypto.createHash('sha256').update(b).digest('hex');
  if (sha(read(ASSET + 'provenance.json')) !== PROVENANCE) fail('provenance');
  const provenance = JSON.parse(read(ASSET + 'provenance.json'));
  for (const [f, h] of Object.entries(provenance.sourceHashes))
    if (sha(read(f)) !== h) fail(f);
  for (const [f, h] of Object.entries(provenance.assets))
    if (sha(read(ASSET + f)) !== h) fail(f);
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('five modes');
  const per = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  function resolve(name, m, type, seen = new Set()) {
    if (seen.has(name)) fail('alias cycle');
    seen.add(name);
    const v = variables.find(v => v.name === name);
    if (!v || v.type !== type || v.values[m.id] === undefined)
      fail('typed foundation ' + name);
    const x = v.values[m.id];
    return x?.alias ? resolve(x.alias, m, type, seen) : x;
  }
  function upsert(list, e) {
    const hits = list.filter(v => v.id === e.id || v.name === e.name);
    if (hits.length > 1 || hits.some(v => v.id !== e.id || v.name !== e.name))
      fail('foreign identity');
    if (list === variables) {
      if (hits.some(v => v.type !== e.type)) fail('variable type');
    } else {
      if (styles.effect.some(v => v.id === e.id || v.name === e.name))
        fail('cross style kind');
      for (const v of hits) {
        if (v.type !== undefined && v.type !== 'TEXT') fail('style kind');
        if (
          !v.values ||
          Object.keys(v.values).sort().join(',') !==
            modes
              .map(m => m.id)
              .sort()
              .join(',')
        )
          fail('style modes');
        for (const x of Object.values(v.values))
          if (
            !x ||
            Array.isArray(x) ||
            !x.fontName ||
            Array.isArray(x.fontName) ||
            typeof x.fontName.family !== 'string' ||
            !x.fontName.family.trim() ||
            typeof x.fontName.style !== 'string' ||
            !x.fontName.style.trim()
          )
            fail('font object');
      }
    }
    if (hits.length) list[list.indexOf(hits[0])] = e;
    else list.push(e);
  }
  function role(key, type, fn, scopes = ['ALL_SCOPES']) {
    const name = 'component/layout-foundations/' + key,
      values = per(fn);
    for (const m of modes) {
      const x = values[m.id]?.alias
        ? resolve(values[m.id].alias, m, type)
        : values[m.id];
      if (type === 'FLOAT' && !Number.isFinite(x)) fail('finite scalar');
      if (type === 'STRING' && (typeof x !== 'string' || !x.trim()))
        fail('font family');
      if (
        type === 'COLOR' &&
        (!x ||
          ['r', 'g', 'b'].some(
            k => !Number.isFinite(x[k]) || x[k] < 0 || x[k] > 1
          ) ||
          !Number.isFinite(x.a ?? 1) ||
          (x.a ?? 1) < 0 ||
          (x.a ?? 1) > 1)
      )
        fail('paint');
    }
    upsert(variables, {
      id: name.replaceAll('/', '.'),
      name,
      type,
      values,
      scopes,
    });
    return name;
  }
  const archive = JSON.parse(
    zlib.gunzipSync(read(ASSET + 'source-footprints.json.gz'))
  );
  function restore(x) {
    if (Array.isArray(x)) return x.map(restore);
    if (x && typeof x === 'object') {
      if (Object.keys(x).join(',') === '$sourceStyle') {
        if (!archive.styles[x.$sourceStyle]) fail('CSS reference');
        return archive.styles[x.$sourceStyle];
      }
      return Object.fromEntries(
        Object.entries(x).map(([k, v]) => [k, restore(v)])
      );
    }
    return x;
  }
  if (archive.format !== 'lossless-css-intern-v1') fail('archive');
  const cases = restore(archive.data).cases,
    paintProof = JSON.parse(read(ASSET + 'full-width-paint-proof.json'));
  if (Object.keys(cases).length !== 155 || paintProof.rows.length !== 20)
    fail('source census');
  const families = [];
  for (const kind of ['container', 'grid-specimen', 'full-width-background']) {
    const variants = [],
      contexts =
        kind === 'container'
          ? ['default', 'padded']
          : kind === 'grid-specimen'
            ? ['authored']
            : ['default', 'opaque', 'transparent', 'isolated'];
    for (const context of contexts)
      for (const locale of ['english', 'arabic'])
        for (const width of [390, 1164]) {
          const familyId =
              kind === 'container'
                ? 'layout-container'
                : kind === 'grid-specimen'
                  ? 'layout-grid-specimen'
                  : kind,
            key = [familyId, context, locale, width].join('-'),
            story =
              kind === 'container'
                ? 'design-decisions-container--' +
                  (context === 'padded' ? 'padded-variant' : 'default')
                : kind === 'grid-specimen'
                  ? 'design-decisions-grid-layout--default-grid'
                  : 'components-fullwidth--' +
                    (context === 'default'
                      ? 'default-full-width'
                      : 'blocked-by-ancestor-background'),
            get = m => cases[m.id + '-' + locale + '-' + story + '-' + width],
            sample = get(modes[0]),
            at = (m, i) => get(m).tree[i];
          const scopedRoot =
            kind === 'container'
              ? 1
              : kind === 'grid-specimen'
                ? 0
                : context === 'default'
                  ? sample.tree.find(
                      n => n.classes === 'mg-container-full-width'
                    ).index
                  : sample.tree[
                      sample.tree.filter(
                        n => n.classes === 'mg-container-full-width'
                      )[{ opaque: 0, transparent: 1, isolated: 2 }[context]]
                        .parentIndex
                    ].parentIndex;
          function sourceScope(n) {
            if (n.index === scopedRoot) return true;
            let p = n.parentIndex;
            while (p >= 0) {
              if (p === scopedRoot) return true;
              p = sample.tree[p].parentIndex;
            }
            return false;
          }
          for (const m of modes) {
            const c = get(m);
            if (
              !c ||
              c.viewport.width !== width ||
              c.rootLanguage.lang !== (locale === 'arabic' ? 'ar' : 'en') ||
              c.tree.length !== sample.tree.length
            )
              fail('actual source context');
            for (const n of sample.tree) {
              const a = at(m, n.index);
              if (
                a.tag !== n.tag ||
                a.classes !== n.classes ||
                a.parentIndex !== n.parentIndex ||
                a.text !== n.text
              )
                fail('source anatomy/copy');
              if (
                sourceScope(n) &&
                (+a.style.opacity !== 1 ||
                  a.style['box-shadow'] !== 'none' ||
                  a.style['background-image'] !== 'none')
              )
                fail('source effects');
              if (
                ['x', 'y', 'width', 'height'].some(
                  k => !Number.isFinite(a.rect[k])
                )
              )
                fail('source finite owner');
            }
          }
          const number = (label, fn, positive = false) => {
              const values = modes.map(fn);
              if (values.some(x => !Number.isFinite(x) || (positive && x <= 0)))
                fail('finite allocation');
              return values.every(x => x === values[0])
                ? values[0]
                : role(key + '/' + label, 'FLOAT', fn);
            },
            offset = (label, fn) => role(key + '/' + label, 'FLOAT', fn),
            position = (label, rect, parent) => ({
              horizontal: 'START',
              vertical: 'START',
              offsetX: offset(label + '/x', m => rect(m).x - parent(m).x),
              offsetY: offset(label + '/y', m => rect(m).y - parent(m).y),
            });
          function rgba(s) {
            const a = /^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/.exec(s);
            if (!a) fail('RGBA source');
            return {
              r: +a[1] / 255,
              g: +a[2] / 255,
              b: +a[3] / 255,
              a: a[4] === undefined ? 1 : +a[4],
            };
          }
          const literalPaint = (label, css) =>
            role(key + '/' + label, 'COLOR', m => rgba(css(m)), [
              'ALL_FILLS',
              'STROKE_COLOR',
            ]);
          function frame(id, rect, parent, css) {
            let fill = null;
            if (css) {
              const values = modes.map(m => rgba(css(m)['background-color']));
              if (values.some(v => v.a !== 0))
                fill = literalPaint(
                  id + '/background',
                  m => css(m)['background-color']
                );
            }
            const t = {
              id,
              type: 'FRAME',
              fill,
              layout: {
                mode: 'VERTICAL',
                width: number(id + '/width', m => rect(m).width, true),
                height: number(id + '/height', m => rect(m).height, true),
                clipsContent: false,
              },
              ...(parent ? { absolute: position(id, rect, parent) } : {}),
              children: [],
            };
            if (css)
              for (const e of ['top', 'right', 'bottom', 'left']) {
                const v = m => parseFloat(css(m)['padding-' + e]);
                if (modes.some(m => v(m) !== 0))
                  (t.bindings ??= {})[
                    'padding' + e[0].toUpperCase() + e.slice(1)
                  ] = role(key + '/' + id + '/padding-' + e, 'FLOAT', v);
              }
            return t;
          }
          function text(
            id,
            characters,
            rect,
            parent,
            css,
            tag = 'P',
            literalInk = false
          ) {
            const t = frame(id, rect, parent);
            delete t.children;
            t.type = 'TEXT';
            t.characters = characters;
            t.textProperty = 'Layout ' + key + ' ' + id;
            t.textAlign = locale === 'arabic' ? 'RIGHT' : 'LEFT';
            t.textWrap = { auto: 'AUTO', balance: 'BALANCE', pretty: 'PRETTY' }[
              css(modes[0])['text-wrap-style']
            ];
            if (
              !t.textWrap ||
              modes.some(
                m =>
                  css(m)['text-wrap-style'] !== css(modes[0])['text-wrap-style']
              )
            )
              fail('source wrap');
            const heading = ['H2', 'H3'].includes(tag),
              familyRole =
                locale === 'arabic'
                  ? role(
                      'arabic-' + (heading ? 'heading' : 'text') + '-family',
                      'STRING',
                      m => {
                        const family = heading
                          ? 'Noto Kufi Arabic'
                          : 'Noto Sans Arabic';
                        if (!css(m)['font-family'].includes(family))
                          fail('actual Arabic script route');
                        return family;
                      },
                      ['FONT_FAMILY']
                    )
                  : 'font-family/text',
              sizeToken =
                'font-size/' +
                (tag === 'H2' ? '500' : tag === 'H3' ? '400' : '300'),
              fontSize = role(
                key + '/' + id + '/font-size',
                'FLOAT',
                m => {
                  if (
                    resolve(sizeToken, m, 'FLOAT') !==
                    parseFloat(css(m)['font-size'])
                  )
                    fail('authored size token');
                  return { alias: sizeToken };
                },
                ['FONT_SIZE']
              ),
              styleId =
                'component.layout-foundations.' + key + '.' + id + '.text',
              factor = tag === 'H2' ? 1.1 : tag === 'H3' ? 1.15 : 1.5;
            upsert(styles.text, {
              id: styleId,
              name: 'Mangrove/Source Layout/' + key + '/' + id + '/text',
              bindings: { fontFamily: familyRole, fontSize },
              values: per(m => {
                const c = css(m),
                  family = resolve(familyRole, m, 'STRING'),
                  requested =
                    tag === 'H2'
                      ? '700'
                      : tag === 'H3'
                        ? locale === 'arabic'
                          ? '700'
                          : '600'
                        : '400';
                if (
                  !c['font-family'].includes(family) ||
                  c['font-weight'] !== requested ||
                  c['font-style'] !== 'normal' ||
                  Math.abs(
                    parseFloat(c['line-height']) -
                      parseFloat(c['font-size']) * factor
                  ) > 1e-7 ||
                  (c['letter-spacing'] !== 'normal' &&
                    parseFloat(c['letter-spacing']) !== 0)
                )
                  fail(
                    'source face/line factor ' +
                      key +
                      '/' +
                      id +
                      ' ' +
                      JSON.stringify({
                        family: c['font-family'],
                        weight: c['font-weight'],
                        size: c['font-size'],
                        line: c['line-height'],
                        spacing: c['letter-spacing'],
                      })
                  );
                return {
                  fontName: { family, style: heading ? 'Bold' : 'Regular' },
                  fontSize: parseFloat(c['font-size']),
                  lineHeight: {
                    unit: 'PERCENT',
                    value: tag === 'H2' ? 110 : tag === 'H3' ? 115 : 150,
                  },
                  letterSpacing: { unit: 'PIXELS', value: 0 },
                  paragraphSpacing: 0,
                };
              }),
            });
            t.textStyle = styleId;
            t.fill = literalInk
              ? literalPaint(id + '/ink', m => css(m).color)
              : role(
                  key + '/' + id + '/ink',
                  'COLOR',
                  m => {
                    const v = resolve('color/text', m, 'COLOR'),
                      actual = rgba(css(m).color);
                    if (
                      ['r', 'g', 'b'].some(
                        k =>
                          Math.round(v[k] * 255) !== Math.round(actual[k] * 255)
                      ) ||
                      (v.a ?? 1) !== actual.a
                    )
                      fail('authored inherited text ink');
                    return { alias: 'color/text' };
                  },
                  ['ALL_FILLS', 'STROKE_COLOR']
                );
            return t;
          }
          function dashed(t, index) {
            const cs = m => at(m, index).style,
              edges = ['top', 'right', 'bottom', 'left'],
              active = m =>
                edges.some(
                  e => parseFloat(cs(m)['border-' + e + '-width']) !== 0
                );
            if (!modes.some(active)) return;
            for (const m of modes)
              for (const e of edges)
                if (
                  cs(m)['border-' + e + '-width'] !== '1px' ||
                  cs(m)['border-' + e + '-style'] !== 'dashed' ||
                  cs(m)['border-' + e + '-color'] !== 'rgb(0, 0, 0)'
                )
                  fail('actual uniform1px dashed source border');
            const r = at(modes[0], index).rect;
            if (
              modes.some(
                m =>
                  at(m, index).rect.width !== r.width ||
                  at(m, index).rect.height !== r.height
              )
            )
              fail('literal SVG viewport equality');
            const markup =
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
              r.width +
              ' ' +
              r.height +
              '" fill="none"><path d="M.5 .5H' +
              (r.width - 0.5) +
              'V' +
              (r.height - 0.5) +
              'H.5Z" fill="none" stroke="#000" stroke-width="1" stroke-dasharray="3 3"/></svg>';
            t.children.push({
              id: t.id + '-dashed-border',
              type: 'FRAME',
              fill: null,
              layout: { mode: 'VERTICAL', width: r.width, height: r.height },
              absolute: {
                horizontal: 'START',
                vertical: 'START',
                offsetX: offset(t.id + '/border-x', () => 0),
                offsetY: offset(t.id + '/border-y', () => 0),
              },
              children: [
                {
                  id: t.id + '-border-ink',
                  type: 'SVG',
                  svg: {
                    assetId: key + '.node-' + index + '.border-candidate',
                    markup,
                    monochrome: {
                      strokes: literalPaint(
                        t.id + '/border-ink',
                        m => cs(m)['border-top-color']
                      ),
                    },
                  },
                  layout: { width: r.width, height: r.height },
                },
              ],
              sourceBorder: {
                authoredStyle: 'dashed',
                authoredWidth: 1,
                cadenceCandidate: [3, 3],
                nativeRasterAccepted: false,
              },
            });
          }
          const omitted = [];
          let tree, sourceRoot;
          if (kind !== 'full-width-background') {
            sourceRoot = kind === 'grid-specimen' ? 0 : 1;
            const projected = new Map(),
              rootRect = m => at(m, sourceRoot).rect;
            tree = frame('root', rootRect, null, m => at(m, sourceRoot).style);
            tree.sourceElementIndex = sourceRoot;
            projected.set(sourceRoot, tree);
            dashed(tree, sourceRoot);
            for (const n of sample.tree) {
              if (n.index <= sourceRoot) continue;
              let parent = n.parentIndex,
                inside = false;
              while (parent >= 0) {
                if (parent === sourceRoot) {
                  inside = true;
                  break;
                }
                parent = sample.tree[parent].parentIndex;
              }
              if (!inside) continue;
              if (n.rect.height === 0 || n.rect.width === 0) {
                if (
                  modes.some(
                    m => at(m, n.index).rect.height !== 0 || at(m, n.index).text
                  )
                )
                  fail('genuine empty source grid');
                omitted.push({
                  index: n.index,
                  classes: n.classes,
                  reason:
                    'genuine zero-height empty grid, no rendered fake component',
                });
                continue;
              }
              const owner = projected.get(n.parentIndex);
              if (!owner) fail('actual parent projection');
              let t;
              if (['H2', 'H3', 'P'].includes(n.tag)) {
                if (sample.tree.some(a => a.parentIndex === n.index))
                  fail('unhandled mixed source text');
                t = text(
                  'node-' + n.index,
                  n.text,
                  m => at(m, n.index).rect,
                  m => at(m, n.parentIndex).rect,
                  m => at(m, n.index).style,
                  n.tag
                );
              } else {
                if (n.tag !== 'DIV') fail('unhandled source element');
                t = frame(
                  'node-' + n.index,
                  m => at(m, n.index).rect,
                  m => at(m, n.parentIndex).rect,
                  m => at(m, n.index).style
                );
                projected.set(n.index, t);
                dashed(t, n.index);
              }
              t.sourceElementIndex = n.index;
              owner.children.push(t);
            }
          } else if (context === 'default') {
            sourceRoot = sample.tree.find(
              n => n.classes === 'mg-container-full-width'
            ).index;
            const r = m => at(m, sourceRoot).rect,
              css = m => at(m, sourceRoot).style;
            for (const m of modes) {
              if (
                css(m)['background-color'] !== 'rgba(0, 0, 0, 0)' ||
                at(m, sourceRoot).pseudoBefore['background-color'] !==
                  'rgba(0, 0, 0, 0)'
              )
                fail('actual transparent default pseudo');
            }
            tree = frame('root', r, null, css);
            tree.sourceElementIndex = sourceRoot;
            tree.children.push(
              text('content', sample.tree[sourceRoot].text, r, r, css)
            );
          } else {
            const band = sample.tree.filter(
                n => n.classes === 'mg-container-full-width'
              )[{ opaque: 0, transparent: 1, isolated: 2 }[context]],
              container = sample.tree[band.parentIndex],
              wrapper = sample.tree[container.parentIndex],
              wr = m => at(m, wrapper.index).rect,
              br = m => at(m, band.index).rect,
              css = m => at(m, band.index).style;
            sourceRoot = wrapper.index;
            tree = frame('root', wr);
            tree.layout.clipsContent = true;
            tree.sourceCaptureViewportClip = true;
            const outer = frame(
                'wrapper',
                wr,
                wr,
                m => at(m, wrapper.index).style
              ),
              row = frame(
                'container',
                m => at(m, container.index).rect,
                wr,
                m => at(m, container.index).style
              ),
              body = frame('band', br, m => at(m, container.index).rect, css);
            outer.sourceElementIndex = wrapper.index;
            row.sourceElementIndex = container.index;
            body.sourceElementIndex = band.index;
            for (const m of modes) {
              const proof = paintProof.rows.find(
                  p => p.key === m.id + '-' + locale + '-' + story + '-' + width
                ),
                p =
                  proof?.checks[
                    { opaque: 0, transparent: 1, isolated: 2 }[context]
                  ],
                pseudo = at(m, band.index).pseudoBefore;
              if (
                !p ||
                p.greenMinX !== p.expectedVisibleGreenMinX ||
                p.greenMaxX !== p.expectedVisibleGreenMaxX ||
                pseudo.content !== '""' ||
                pseudo.width !== width + 'px' ||
                pseudo.height !== br(m).height + 'px' ||
                pseudo['z-index'] !== '-1' ||
                pseudo['background-color'] !== css(m)['background-color'] ||
                css(m)['background-color'] !== 'rgb(46, 125, 50)' ||
                at(m, wrapper.index).style['background-color'] !==
                  (context === 'transparent'
                    ? 'rgba(0, 0, 0, 0)'
                    : 'rgb(255, 255, 255)') ||
                css(m).isolation !==
                  (context === 'isolated' ? 'isolate' : 'auto')
              )
                fail('actual pseudo/ancestor paint state');
            }
            if (context !== 'opaque') {
              const pseudo = m => at(m, band.index).pseudoBefore,
                r = m => ({
                  x:
                    br(m).x +
                    parseFloat(pseudo(m).left) +
                    parseFloat(pseudo(m)['margin-left']),
                  y: br(m).y + parseFloat(pseudo(m).top),
                  width: parseFloat(pseudo(m).width),
                  height: parseFloat(pseudo(m).height),
                }),
                background = frame('source-pseudo-background', r, wr);
              background.fill = literalPaint(
                'pseudo-background',
                m => pseudo(m)['background-color']
              );
              delete background.children;
              background.sourcePseudoOf = band.index;
              outer.children.push(background);
            } else
              omitted.push({
                sourcePseudoOf: band.index,
                reason:
                  'pseudo covered by actual opaque ancestor outside the band; identical inside-band ink already supplied by source band background',
              });
            const contentRect = m => {
              const r = br(m),
                s = css(m),
                left = parseFloat(s['padding-left']),
                right = parseFloat(s['padding-right']),
                top = parseFloat(s['padding-top']),
                bottom = parseFloat(s['padding-bottom']);
              return {
                x: r.x + left,
                y: r.y + top,
                width: r.width - left - right,
                height: r.height - top - bottom,
              };
            };
            body.children.push(
              text('content', band.text, contentRect, br, css, 'P', true)
            );
            row.children.push(body);
            outer.children.push(row);
            tree.children.push(outer);
          }
          variants.push({
            id: familyId + '.' + [context, locale, width].join('-'),
            name:
              'Context=' +
              context +
              ', RootLocale=' +
              locale +
              ', SourceViewport=' +
              width,
            properties: {
              Context: context,
              RootLocale: locale,
              SourceViewport: String(width),
            },
            tree,
            sourceContract: {
              sourceStory: story,
              sourceElementRoot: sourceRoot,
              sourceViewport: width,
              rootLocale: locale,
              copyLocale:
                'actual hard-coded English story, not an invented translation',
              sourceOwnedNodeIndexes: sample.tree
                .filter(
                  n => n.index === sourceRoot || walkParent(n, sourceRoot)
                )
                .map(n => n.index),
              sourceMetadataOnly: omitted,
              ...(kind === 'full-width-background'
                ? {
                    scaffoldExcluded:
                      'system-ui labels and inline isolation code are external tutorial scaffolding, outside selected utility owner/ancestor states',
                    nativePseudoProjection:
                      'finite source-visible background primitive. No automatic CSS inheritance, negative-z stacking or viewport solver.',
                  }
                : {}),
            },
          });
          function walkParent(n, i) {
            let p = n.parentIndex;
            while (p >= 0) {
              if (p === i) return true;
              p = sample.tree[p].parentIndex;
            }
            return false;
          }
        }
    const id =
      kind === 'container'
        ? 'layout-container'
        : kind === 'grid-specimen'
          ? 'layout-grid-specimen'
          : kind;
    families.push({
      id,
      name: 'Mangrove/Source Layout/' + kind,
      kind: 'component-set',
      sourceRef: {
        file:
          kind === 'container'
            ? 'stories/Atom/Layout/Container/Container.jsx'
            : kind === 'grid-specimen'
              ? 'stories/Atom/Layout/Grid/Grid.jsx'
              : 'stories/Utilities/FullWidth/FullWidth.jsx',
        line: 1,
      },
      review: { preserveVariantSizing: true, genericLabels: false },
      variants,
      limitations: [
        'Finite actual authored source callers and initial allocations only; module exports absent package entry. No general responsive/child-reflow/CSS-grid/viewport solver. RootLocale records the actual source root script routing around hard-coded English copy, not translated story content.',
        'Exact source paint declarations retained. Native font bytes/axes/glyph/bidi/line metrics, source pixels, arbitrary edited reflow, runtime styling and publication are independent gates.',
        'Container1px dashed source borders use explicit3/3 SVG cadence candidate, not authored dash values or native/source raster acceptance. Source Latin H3 requested600 maps to published Bold700 provisionally; Arabic source H3 requests700 directly. Empty zero-height grid remains source metadata.',
        'FullWidth retains actual padded source LTR bleed x16 versus RTLx0, opaque ancestor coverage and isolated/transparent source contexts. Native finite paint projection does not implement automatic negative-z inheritance; source capture host clipping is explicit. Tutorial system-ui labels/inline code are excluded at the recorded utility boundary.',
      ],
    });
  }
  target.variables.splice(0, target.variables.length, ...variables);
  target.styles.text.splice(0, target.styles.text.length, ...styles.text);
  target.styles.effect.splice(0, target.styles.effect.length, ...styles.effect);
  return families;
}
module.exports = { buildLayoutFoundationsRecipes };
