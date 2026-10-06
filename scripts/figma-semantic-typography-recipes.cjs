'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto'),
  zlib = require('zlib');
const ASSET = 'examples/figma-plugin/holistic/assets/semantic-typography/';
const PROVENANCE =
  'f28f6b540c567e20269ef722d041adca1a9a3adf85f3c1ea797012a2dd6555f4';
function buildSemanticTypographyRecipes({ root, modes, variables, styles }) {
  const target = { variables, styles };
  variables = structuredClone(variables);
  styles = structuredClone(styles);
  const fail = s => {
      throw Error('Semantic typography source changed: ' + s);
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
    const hits = variables.filter(v => v.name === name),
      v = hits[0];
    if (
      hits.length !== 1 ||
      !v ||
      v.type !== type ||
      v.values?.[m.id] === undefined
    )
      fail('typed foundation ' + name);
    const x = v.values[m.id];
    if (x?.alias) return resolve(x.alias, m, type, seen);
    if (type === 'FLOAT' && !Number.isFinite(x))
      fail('finite typed foundation ' + name);
    if (type === 'STRING' && (typeof x !== 'string' || !x.trim()))
      fail('string typed foundation ' + name);
    if (
      type === 'COLOR' &&
      (!x ||
        ['r', 'g', 'b', 'a'].some(
          k => !Number.isFinite(x[k]) || x[k] < 0 || x[k] > 1
        ))
    )
      fail('color typed foundation ' + name);
    return x;
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
    const name = 'component/semantic-typography/' + key,
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
  const cases = restore(archive.data).cases;
  if (Object.keys(cases).length !== 660) fail('source census');
  const perModeConstant = (label, fn) => {
    const values = modes.map(fn);
    if (values.some(x => !Number.isFinite(x))) fail('finite ' + label);
    return values.every(x => x === values[0])
      ? values[0]
      : role(label, 'FLOAT', fn);
  };
  function rgba(css) {
    const m = /^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/.exec(css);
    if (!m) fail('source RGBA');
    return {
      r: +m[1] / 255,
      g: +m[2] / 255,
      b: +m[3] / 255,
      a: m[4] === undefined ? 1 : +m[4],
    };
  }
  const groups = [
      ['semantic-heading-specimen', ['heading']],
      [
        'semantic-paragraph',
        [
          'paragraph-size-default',
          'paragraph-size-150',
          'paragraph-size-200',
          'paragraph-size-250',
          'paragraph-size-300',
          'paragraph-size-400',
          'paragraph-size-500',
          'paragraph-size-600',
          'paragraph-size-800',
          'paragraph-size-900',
        ],
      ],
      ['semantic-copy-separators', ['small', 'hr']],
      ['semantic-description-list', ['list-description']],
      ['semantic-figcaption', ['figcaption']],
      ['semantic-inline-emphasis', ['mark']],
    ],
    families = [];
  for (const [familyId, treatments] of groups) {
    const variants = [];
    for (const treatment of treatments)
      for (const locale of ['english', 'arabic', 'japanese'])
        for (const width of [390, 1164]) {
          const key = [familyId, treatment, locale, width].join('-'),
            get = m =>
              cases[m.id + '-' + locale + '-' + treatment + '-' + width],
            sample = get(modes[0]),
            at = (m, i) => get(m).tree[i],
            rootRect = m => at(m, 0).rect;
          for (const m of modes) {
            const c = get(m);
            if (
              !c ||
              c.tree.length !== sample.tree.length ||
              c.viewport.width !== width ||
              c.rootLanguage.lang !==
                { english: 'en', arabic: 'ar', japanese: 'ja' }[locale] ||
              c.rootLanguage.dir !== (locale === 'arabic' ? 'rtl' : 'ltr')
            )
              fail('actual source context');
            for (const n of sample.tree) {
              const a = at(m, n.index),
                s = a.style;
              if (
                a.tag !== n.tag ||
                a.classes !== n.classes ||
                a.parentIndex !== n.parentIndex ||
                a.text !== n.text
              )
                fail('source anatomy/copy');
              if (
                ['x', 'y', 'width', 'height'].some(
                  k => !Number.isFinite(a.rect[k])
                ) ||
                a.rect.width <= 0 ||
                a.rect.height <= 0
              )
                fail('source capacity');
              if (
                +s.opacity !== 1 ||
                s['box-shadow'] !== 'none' ||
                s['background-image'] !== 'none' ||
                s['font-style'] !== 'normal'
              )
                fail('unsupported source effects/style');
            }
          }
          const positive = (id, fn) => {
              if (modes.some(m => fn(m) <= 0)) fail('positive allocation');
              return perModeConstant(key + '/' + id, fn);
            },
            position = (id, r, parent) => ({
              horizontal: 'START',
              vertical: 'START',
              offsetX: role(
                key + '/' + id + '/x',
                'FLOAT',
                m => r(m).x - parent(m).x
              ),
              offsetY: role(
                key + '/' + id + '/y',
                'FLOAT',
                m => r(m).y - parent(m).y
              ),
            });
          function paint(id, css, alias) {
            return role(
              key + '/' + id,
              'COLOR',
              m => {
                const color = rgba(css(m));
                if (!alias) return color;
                const actual = resolve(alias, m, 'COLOR');
                if (
                  ['r', 'g', 'b'].some(
                    k =>
                      Math.round(actual[k] * 255) !== Math.round(color[k] * 255)
                  ) ||
                  (actual.a ?? 1) !== color.a
                )
                  fail('authored source paint ' + alias);
                return { alias };
              },
              ['ALL_FILLS', 'STROKE_COLOR']
            );
          }
          function frame(id, r, parent, css) {
            const f = {
              id,
              type: 'FRAME',
              fill: null,
              layout: {
                mode: 'VERTICAL',
                width: positive(id + '/width', m => r(m).width),
                height: positive(id + '/height', m => r(m).height),
                clipsContent: false,
              },
              ...(parent ? { absolute: position(id, r, parent) } : {}),
              children: [],
            };
            if (
              css &&
              modes.some(m => rgba(css(m)['background-color']).a !== 0)
            )
              f.fill = paint(
                id + '/background',
                m => css(m)['background-color']
              );
            if (css)
              for (const e of ['top', 'right', 'bottom', 'left'])
                if (modes.some(m => parseFloat(css(m)['padding-' + e]) !== 0))
                  (f.bindings ??= {})[
                    'padding' + e[0].toUpperCase() + e.slice(1)
                  ] = role(key + '/' + id + '/padding-' + e, 'FLOAT', m =>
                    parseFloat(css(m)['padding-' + e])
                  );
            return f;
          }
          function text(id, characters, r, parent, css, tag) {
            const f = frame(id, r, parent);
            delete f.children;
            f.type = 'TEXT';
            f.characters = characters;
            f.textProperty = 'Typography ' + key + ' ' + id;
            f.textAlign = locale === 'arabic' ? 'RIGHT' : 'LEFT';
            const wrap = { auto: 'AUTO', balance: 'BALANCE', pretty: 'PRETTY' }[
              css(modes[0])['text-wrap-style']
            ];
            if (
              !wrap ||
              modes.some(
                m =>
                  css(m)['text-wrap-style'] !== css(modes[0])['text-wrap-style']
              )
            )
              fail('source text wrap');
            f.textWrap = wrap;
            const heading = /^H[1-6]$/.test(tag),
              arabicHeading =
                locale === 'arabic' && ['H1', 'H2', 'H3'].includes(tag),
              familyRole =
                locale === 'arabic'
                  ? role(
                      'arabic-' +
                        (arabicHeading ? 'heading' : 'text') +
                        '-family',
                      'STRING',
                      () =>
                        arabicHeading ? 'Noto Kufi Arabic' : 'Noto Sans Arabic',
                      ['FONT_FAMILY']
                    )
                  : 'font-family/text';
            let token = 'font-size/300';
            if (heading)
              token =
                'font-size/' +
                {
                  H1: '600',
                  H2: '500',
                  H3: '400',
                  H4: '300',
                  H5: '300',
                  H6: '200',
                }[tag];
            else if (tag === 'FIGCAPTION')
              token = 'font-size/' + (width >= 900 ? '300' : '200');
            else if (tag === 'MARK')
              token = 'font-size/' + (width >= 900 ? '300' : '200');
            else if (
              treatment.startsWith('paragraph-size-') &&
              !treatment.endsWith('default')
            ) {
              let size = treatment.split('-').at(-1);
              if (width < 900)
                size =
                  {
                    400: '300',
                    500: '400',
                    600: '500',
                    800: '600',
                    900: '800',
                  }[size] || size;
              token = 'font-size/' + size;
            }
            const fontSize = role(
              key + '/' + id + '/font-size',
              'FLOAT',
              m => {
                const actual = parseFloat(css(m)['font-size']),
                  basis = resolve(token, m, 'FLOAT');
                if (tag === 'SMALL') {
                  if (actual !== basis * 0.8)
                    fail('actual Normalize80percent Small');
                  return actual;
                }
                if (actual !== basis) fail('authored source size ' + token);
                return { alias: token };
              },
              ['FONT_SIZE']
            );
            if (tag === 'SMALL')
              f.sourceDerivation = {
                fontSize: {
                  sourceExpression:
                    'Normalize small80percent inherited body font size; later cascade wins Sass placeholder',
                  basis: token,
                  factor: 0.8,
                  liveArithmetic: false,
                },
                lineHeight:
                  'actual inherited body PIXELS, no relative-to-small percentage reinterpretation',
              };
            const styleId =
              'component.semantic-typography.' + key + '.' + id + '.text';
            upsert(styles.text, {
              id: styleId,
              name: 'Mangrove/Source Semantic Typography/' + key + '/' + id,
              bindings: { fontFamily: familyRole, fontSize },
              values: per(m => {
                const s = css(m),
                  family = resolve(familyRole, m, 'STRING'),
                  size = parseFloat(s['font-size']),
                  line = parseFloat(s['line-height']),
                  weight = s['font-weight'],
                  spacing =
                    s['letter-spacing'] === 'normal'
                      ? 0
                      : parseFloat(s['letter-spacing']);
                if (
                  !s['font-family'].includes(family) ||
                  !['400', '600', '700'].includes(weight) ||
                  !Number.isFinite(line) ||
                  line <= 0 ||
                  !Number.isFinite(spacing)
                )
                  fail('actual source face/metrics');
                let letterSpacing = { unit: 'PIXELS', value: spacing };
                if ((tag === 'H1' || tag === 'H6') && locale !== 'arabic') {
                  const factor = tag === 'H1' ? 0.02 : 0.024;
                  if (Math.abs(spacing - size * factor) > 1e-7)
                    fail('authored heading letter spacing');
                  letterSpacing = {
                    unit: 'PERCENT',
                    value: tag === 'H1' ? 2 : 2.4,
                  };
                }
                const percent = [108, 110, 115, 125, 137, 140, 150].find(
                  p => Math.abs(line - (size * p) / 100) < 1e-7
                );
                if (tag !== 'SMALL' && tag !== 'MARK' && !percent)
                  fail('authored line-height factor');
                if (locale === 'arabic' && spacing !== 0)
                  fail('actual Arabic letter spacing reset');
                return {
                  fontName: {
                    family,
                    style: weight === '400' ? 'Regular' : 'Bold',
                  },
                  fontSize: size,
                  lineHeight:
                    tag === 'SMALL' || tag === 'MARK'
                      ? { unit: 'PIXELS', value: line }
                      : { unit: 'PERCENT', value: percent },
                  letterSpacing,
                  paragraphSpacing: 0,
                  textWrapStyle: wrap,
                };
              }),
            });
            f.textStyle = styleId;
            f.fill = paint(
              id + '/ink',
              m => css(m).color,
              tag === 'MARK' ? null : 'color/text'
            );
            return f;
          }
          const tree = frame('root', rootRect),
            projected = new Map([[0, tree]]);
          for (const n of sample.tree) {
            if (n.index === 0) continue;
            const id = 'node-' + n.index + '-' + n.tag.toLowerCase(),
              r = m => at(m, n.index).rect,
              parent = m => at(m, n.parentIndex).rect,
              css = m => at(m, n.index).style,
              owner = projected.get(n.parentIndex);
            if (!owner) fail('source owning ancestry');
            let f;
            if (
              [
                'H1',
                'H2',
                'H3',
                'H4',
                'H5',
                'H6',
                'DT',
                'DD',
                'FIGCAPTION',
              ].includes(n.tag) ||
              (n.tag === 'P' &&
                !sample.tree.some(t => t.parentIndex === n.index))
            ) {
              f = text(id, n.text, r, parent, css, n.tag);
            } else if (n.tag === 'SMALL') {
              f = text(id, n.text, r, parent, css, n.tag);
            } else if (n.tag === 'MARK') {
              f = frame(id, r, parent, css);
              const atom = m =>
                get(m).text.find(
                  a => a.parentIndex === n.index && a.text === n.text
                );
              for (const m of modes)
                if (
                  !atom(m) ||
                  atom(m).rects.length !== 1 ||
                  css(m)['padding-top'] !== '2.5px' ||
                  css(m)['padding-right'] !== '2.5px' ||
                  css(m)['padding-bottom'] !== '2.5px' ||
                  css(m)['padding-left'] !== '2.5px' ||
                  css(m).color !== 'rgb(0, 0, 0)' ||
                  css(m)['background-color'] !== 'rgb(255, 255, 224)'
                )
                  fail('actual whole Mark span');
              f.children.push(
                text(
                  id + '-logical-text',
                  n.text,
                  m => atom(m).rects[0],
                  r,
                  css,
                  n.tag
                )
              );
              f.sourceDerivation = {
                background:
                  'guarded authored --mg-color-yellow-light:lightyellow literal, not equality-derived token alias',
                ink: 'actual UA black',
                padding: 2.5,
                editedHighlightFitAccepted: false,
              };
            } else if (n.tag === 'HR') {
              for (const m of modes) {
                const s = css(m);
                if (
                  s['border-top-width'] !== '2px' ||
                  s['border-top-style'] !== 'solid' ||
                  s['border-right-width'] !== '0px' ||
                  s['border-bottom-width'] !== '0px' ||
                  s['border-left-width'] !== '0px' ||
                  r(m).height !== 2
                )
                  fail('authored HR block-start2px');
              }
              f = frame(id, r, parent);
              f.fill = paint(
                id + '/rule',
                m => css(m)['border-top-color'],
                'color/neutral-400'
              );
              delete f.children;
            } else if (n.tag === 'IMG') {
              for (const m of modes) {
                const im = at(m, n.index).image,
                  s = css(m);
                if (
                  !im?.complete ||
                  im.naturalWidth !== 320 ||
                  im.naturalHeight !== 44 ||
                  !im.currentSrc.endsWith('/figcaption.jpg') ||
                  im.alt !== 'icon' ||
                  r(m).width !== 320 ||
                  r(m).height !== 52.75 ||
                  s['padding-bottom'] !== '8.75px' ||
                  s['padding-top'] !== '0px' ||
                  s['padding-left'] !== '0px' ||
                  s['padding-right'] !== '0px'
                )
                  fail('real bundled figcaption media/box');
              }
              f = frame(id, r, parent, css);
              const image = frame(
                id + '-original-image',
                m => ({ ...r(m), height: 44 }),
                r
              );
              image.layout.mode = 'NONE';
              image.image = {
                assetId: 'semantic-typography-original-figcaption',
                base64: read(ASSET + 'images/figcaption.jpg').toString(
                  'base64'
                ),
                scaleMode: 'FILL',
              };
              delete image.children;
              f.children.push(image);
              f.sourceAlt = 'icon';
              f.sourceMedia = {
                naturalWidth: 320,
                naturalHeight: 44,
                bottomPadding: 8.75,
                licenceAccepted: false,
              };
            } else {
              if (!['DIV', 'P', 'DL', 'FIGURE'].includes(n.tag))
                fail('unsupported source tag');
              f = frame(id, r, parent, css);
              projected.set(n.index, f);
            }
            f.sourceElementIndex = n.index;
            owner.children.push(f);
          }
          const kind = treatment.startsWith('paragraph-size-')
              ? 'paragraph'
              : treatment,
            variantId = familyId + '.' + [treatment, locale, width].join('-');
          variants.push({
            id: variantId,
            name:
              'Treatment=' +
              treatment +
              ', Locale=' +
              locale +
              ', SourceViewport=' +
              width,
            properties: {
              Treatment: treatment,
              Locale: locale,
              SourceViewport: String(width),
            },
            tree,
            sourceContract: {
              sourceStory: sample.sourceContext.sourceManagerURL,
              sourceElementRoot: 0,
              locale,
              sourceViewport: width,
              copy: 'exact actual authored locale story copy',
              sourceControl: sample.sourceContext.paragraphSize,
              fontCandidate:
                locale === 'japanese'
                  ? 'computed Roboto family with real browser/platform glyph fallback; native selected fallback unaccepted'
                  : locale === 'arabic'
                    ? 'source exact Sans/Kufi script routing, h1..h3 only use Kufi'
                    : 'Roboto source published Regular400/Bold700; requested600 maps provisionally to availableBold700',
              kind,
              initialSourceOnly: true,
            },
          });
        }
    const file = {
      'semantic-heading-specimen':
        'stories/Atom/Typography/Heading/Heading.jsx',
      'semantic-paragraph':
        'stories/Atom/BaseTypography/Paragraph/Paragraph.jsx',
      'semantic-copy-separators':
        'stories/Atom/BaseTypography/BaseTypography.stories.jsx',
      'semantic-description-list':
        'stories/Atom/Typography/Lists/Descriptionlist.jsx',
      'semantic-figcaption':
        'stories/Atom/ReachElement/Figcaption/Figcaption.jsx',
      'semantic-inline-emphasis': 'stories/Atom/BaseTypography/Mark/Mark.jsx',
    }[familyId];
    families.push({
      id: familyId,
      name: 'Mangrove/Source Semantic Typography/' + familyId,
      kind: 'component-set',
      sourceRef: { file, line: 1 },
      review: { preserveVariantSizing: true, genericLabels: false },
      variants,
      limitations: [
        'Initial finite actual source callers only. Module exports absent package entry. No general HTML/inline/paragraph reflow engine or semantic runtime acceptance.',
        'Whole exposed TEXT properties retain measured capacity, source-context defaults and owning consumer edits. Short edits do not establish source/native baseline or arbitrary layout/background fit.',
        'Native font bytes/axes/family-specific weight/glyph/bidi/CJK/platform fallback, source pixel/positions, live modes and consumer/library publication remain separate gates. Requested600-to-publishedBold700 remains provisional.',
        'Small retains actual Normalize80percent cascade and inherited PIXELS line height with finite derived font-size role, not live arithmetic. Mark retains whole logical span and literal lightyellow/UA black, not a generic mixed-inline formatter.',
        'Required measured follow-on: standalone Cite with synthesized Arabic italic, Quotation UA glyphs, OL/UL Strong rich with UA markers, mixed Code fragment backgrounds/inset and Abbr dashed borders. No false group completion.',
      ],
    });
  }
  target.variables.splice(0, target.variables.length, ...variables);
  target.styles.text.splice(0, target.styles.text.length, ...styles.text);
  target.styles.effect.splice(0, target.styles.effect.length, ...styles.effect);
  return families;
}
module.exports = { buildSemanticTypographyRecipes };
