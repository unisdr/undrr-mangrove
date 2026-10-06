'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const ASSET = 'examples/figma-plugin/holistic/assets/page-header/';
const PROVENANCE =
  '2136709e2e5c0f2064ad0f6dd2a4bf07596024cb3492f935523321871d710f0b';
function buildPageHeaderRecipes({ root, modes, variables, styles }) {
  const target = { variables, styles };
  variables = structuredClone(variables);
  styles = structuredClone(styles);
  const fail = message => {
    throw Error('PageHeader source changed: ' + message);
  };
  const read = file => fs.readFileSync(path.join(root, file));
  const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
  if (sha(read(ASSET + 'provenance.json')) !== PROVENANCE) fail('provenance');
  const provenance = JSON.parse(read(ASSET + 'provenance.json'));
  for (const [file, hash] of Object.entries(provenance.sourceHashes))
    if (sha(read(file)) !== hash) fail(file);
  for (const [file, hash] of Object.entries(provenance.assets))
    if (sha(read(ASSET + file)) !== hash) fail(file);
  const modeKeys = modes
    .map(m => m.id)
    .sort()
    .join(',');
  if (modeKeys !== 'delta,irp,mcr,preventionweb,undrr') fail('five modes');
  const per = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  const modeShape = value =>
    value &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join(',') === modeKeys;
  function resolve(name, mode, type, seen = new Set()) {
    if (seen.has(name)) fail('alias cycle');
    seen.add(name);
    const v = variables.find(v => v.name === name);
    if (!v || v.type !== type || !modeShape(v.values))
      fail('typed foundation ' + name);
    const value = v.values[mode.id];
    return value?.alias ? resolve(value.alias, mode, type, seen) : value;
  }
  function upsert(list, entry, kind) {
    const hits = list.filter(v => v.id === entry.id || v.name === entry.name);
    if (
      hits.length > 1 ||
      hits.some(v => v.id !== entry.id || v.name !== entry.name)
    )
      fail('foreign identity');
    if (kind === 'VARIABLE') {
      if (hits.some(v => v.type !== entry.type)) fail('wrong variable type');
    } else {
      if (styles.effect.some(v => v.id === entry.id || v.name === entry.name))
        fail('cross style kind');
      for (const hit of hits) {
        if (
          (hit.type !== undefined && hit.type !== 'TEXT') ||
          !modeShape(hit.values)
        )
          fail('wrong style kind/modes');
        for (const value of Object.values(hit.values))
          if (
            !value ||
            Array.isArray(value) ||
            !value.fontName ||
            Array.isArray(value.fontName) ||
            typeof value.fontName.family !== 'string' ||
            !value.fontName.family.trim() ||
            typeof value.fontName.style !== 'string' ||
            !value.fontName.style.trim()
          )
            fail('font object');
      }
    }
    if (hits.length) list[list.indexOf(hits[0])] = entry;
    else list.push(entry);
  }
  function role(key, type, fn) {
    const name = 'component/page-header/' + key,
      values = per(fn);
    for (const m of modes) {
      const v = values[m.id]?.alias
        ? resolve(values[m.id].alias, m, type)
        : values[m.id];
      if (type === 'FLOAT' && !Number.isFinite(v)) fail('finite FLOAT');
      if (
        type === 'COLOR' &&
        (!v ||
          ['r', 'g', 'b', 'a'].some(
            k => !Number.isFinite(v[k]) || v[k] < 0 || v[k] > 1
          ))
      )
        fail('COLOR');
    }
    upsert(
      variables,
      {
        id: name.replaceAll('/', '.'),
        name,
        type,
        values,
        scopes:
          type === 'COLOR' ? ['ALL_FILLS', 'STROKE_COLOR'] : ['ALL_SCOPES'],
      },
      'VARIABLE'
    );
    return name;
  }
  function rgba(raw) {
    const match = /^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/.exec(raw);
    if (!match) fail('captured RGBA');
    return {
      r: +match[1] / 255,
      g: +match[2] / 255,
      b: +match[3] / 255,
      a: match[4] === undefined ? 1 : +match[4],
    };
  }
  const archive = JSON.parse(
    zlib.gunzipSync(read(ASSET + 'source-footprints.json.gz'))
  );
  function restore(value) {
    if (Array.isArray(value)) return value.map(restore);
    if (value && typeof value === 'object') {
      if (Object.keys(value).join(',') === '$sourceStyle') {
        if (!archive.styles[value.$sourceStyle]) fail('CSS reference');
        return archive.styles[value.$sourceStyle];
      }
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, restore(v)])
      );
    }
    return value;
  }
  if (archive.format !== 'lossless-css-intern-v1') fail('archive format');
  const { source, mirrors } = restore(archive.data);
  if (
    Object.keys(source.cases).length !== 230 ||
    Object.keys(mirrors.cases).length !== 230
  )
    fail('230 source and mirror cases');
  const logos = JSON.parse(read(ASSET + 'normalised-logos.json'));
  const logoProof = JSON.parse(read(ASSET + 'logo-img-chunk-equivalence.json'));
  if (
    logoProof.cases.length !== 8 ||
    logoProof.cases.some(
      c =>
        c.pixelDifferences !== 0 ||
        c.maxChannelDifference !== 0 ||
        c.originalGeometryExact !== true
    )
  )
    fail('actual source IMG chunk pixel proof');
  for (const [name, l] of Object.entries(logos)) {
    if (
      sha(read(ASSET + 'http-bodies/' + name)) !== l.sourceSha256 ||
      l.source !==
        read(ASSET + 'http-bodies/' + name)
          .toString()
          .replace(/\r\n?/g, '\n')
    )
      fail('raw logo');
    if (
      l.wholePaths !== 18 ||
      !l.chunks.length ||
      l.chunks.some(c => c.length > 32768)
    )
      fail('whole-path chunks');
    // Producer normalization is accepted only for the pinned exact artifacts.
    if ((l.chunks.join('').match(/<path\b/g) || []).length !== 18)
      fail('whole-path count');
  }
  // Source URLs use escaped globals. Keys, not incidental URL encoding, select the actual source profile.
  const selected = Object.keys(source.cases)
    .filter(
      k => k.startsWith('undrr-') && !k.startsWith('undrr-controls-only-')
    )
    .map(k => k.slice(6));
  if (selected.length !== 44)
    fail('44 distinct authored/prop/boundary profiles');
  const textureBytes = read(ASSET + 'http-bodies/toolbar-background.png');
  if (
    textureBytes.readUInt32BE(16) !== 427 ||
    textureBytes.readUInt32BE(20) !== 96
  )
    fail('source PNG intrinsic dimensions');
  const variants = [],
    paintDeclarations = new Map();
  for (const context of selected) {
    const get = m => source.cases[m.id + '-' + context],
      sample = get(modes[0]);
    const at = (m, i) => get(m).tree[i];
    for (const m of modes) {
      const c = get(m);
      if (
        !c ||
        c.tree.length !== sample.tree.length ||
        c.viewport.width !== sample.viewport.width
      )
        fail('source structure');
      for (const n of sample.tree) {
        const actual = at(m, n.index);
        if (
          actual.tag !== n.tag ||
          actual.classes !== n.classes ||
          actual.text !== n.text ||
          actual.href !== n.href ||
          actual.style.opacity !== n.style.opacity ||
          ['x', 'y', 'width', 'height'].some(k => actual.rect[k] !== n.rect[k])
        )
          fail('source fixed geometry/anatomy');
      }
    }
    const frame = (id, n, parent, children = []) => ({
      id,
      type: 'FRAME',
      name: n.classes || n.tag,
      fill: null,
      layout: {
        mode: 'NONE',
        width: n.rect.width,
        height: n.rect.height,
        clipsContent: false,
      },
      ...(parent
        ? {
            position: {
              x: n.rect.x - parent.rect.x,
              y: n.rect.y - parent.rect.y,
            },
          }
        : {}),
      children,
    });
    const tree = frame('root', sample.tree[0]);
    const projected = new Map([[0, tree]]),
      semantics = [];
    const paint = (i, field, alias) => {
      const values = per(m => rgba(at(m, i).style[field]));
      if (alias) {
        for (const m of modes) {
          const expected = resolve(alias, m, 'COLOR');
          if (
            ['r', 'g', 'b', 'a'].some(
              k => (expected[k] ?? 1) !== values[m.id][k]
            )
          )
            fail('authored paint alias ' + alias);
        }
        return alias;
      }
      const n = sample.tree[i],
        parent = sample.tree[n.parentIndex];
      let declaration;
      if (
        field === 'border-bottom-color' &&
        n.classes === 'mg-page-header__toolbar-wrapper'
      )
        declaration = 'toolbar/border';
      else if (
        field === 'background-color' &&
        parent?.classes === 'mg-page-header__decoration'
      ) {
        const siblings = sample.tree.filter(
          x => x.parentIndex === n.parentIndex
        );
        if (siblings.length !== 4 || siblings.some(x => x.tag !== 'DIV'))
          fail('four authored Sendai stripe owners');
        declaration =
          'decoration/stripe-' + siblings.findIndex(x => x.index === i);
      } else fail('unproven paint expression');
      if (
        paintDeclarations.has(declaration) &&
        JSON.stringify(paintDeclarations.get(declaration)) !==
          JSON.stringify(values)
      )
        fail('shared authored CSS declaration changed between source contexts');
      paintDeclarations.set(declaration, values);
      return role(declaration, 'COLOR', m => values[m.id]);
    };
    for (const n of sample.tree.slice(1)) {
      if (
        n.style.display === 'none' ||
        n.rect.width <= 0 ||
        n.rect.height <= 0 ||
        n.classes.includes('mg-u-sr-only') ||
        ['FORM', 'LABEL', 'SELECT', 'OPTION', 'NOSCRIPT'].includes(n.tag) ||
        +n.style.opacity === 0
      ) {
        if (n.select || n.classes.includes('mg-u-sr-only'))
          semantics.push({
            sourceIndex: n.index,
            tag: n.tag,
            text: n.text,
            select: n.select || null,
            opacity: n.style.opacity,
            display: n.style.display,
          });
        continue;
      }
      const parent = projected.get(n.parentIndex);
      if (!parent) continue;
      if (n.tag === 'A')
        semantics.push({
          sourceIndex: n.index,
          sourceTag: 'A',
          sourceHref: n.href,
          nativeNavigationAccepted: false,
        });
      const f = frame('node-' + n.index, n, sample.tree[n.parentIndex]);
      parent.children.push(f);
      projected.set(n.index, f);
      if (n.style['background-color'] !== 'rgba(0, 0, 0, 0)')
        f.fill = paint(
          n.index,
          'background-color',
          n.classes === 'mg-page-header__toolbar-wrapper'
            ? 'color/neutral-700'
            : undefined
        );
      if (n.classes === 'mg-page-header__toolbar-wrapper') {
        if (
          n.style['background-repeat'] !== 'no-repeat' ||
          n.style['background-position'] !== '50% 50%' ||
          !n.style['background-image'].includes('toolbar-background.png') ||
          parseFloat(n.style['border-bottom-width']) !== 1
        )
          fail('source toolbar texture/border');
        f.layout.clipsContent = true;
        f.children.push({
          id: 'source-texture',
          type: 'FRAME',
          fill: null,
          position: {
            x: (n.rect.width - 427) / 2,
            y: (n.rect.height - 1 - 96) / 2,
          },
          layout: { mode: 'NONE', width: 427, height: 96 },
          image: {
            assetId: 'page-header-toolbar-texture',
            base64: textureBytes.toString('base64'),
            scaleMode: 'FILL',
          },
          children: [],
        });
        f.children.push({
          id: 'source-bottom-border',
          type: 'FRAME',
          fill: paint(n.index, 'border-bottom-color'),
          position: { x: 0, y: n.rect.height - 1 },
          layout: { mode: 'NONE', width: n.rect.width, height: 1 },
          children: [],
        });
      }
      if (n.image) {
        if (
          !n.image.complete ||
          !(n.image.naturalWidth > 0 && n.image.naturalHeight > 0)
        )
          fail('source image not loaded');
        const name = n.image.src.split('/').pop(),
          logo = logos[name];
        if (!logo) fail('actual source logo');
        if (!['contain', 'cover'].includes(n.style['object-fit']))
          fail('object fit');
        const vb = logo.viewBox,
          s =
            n.style['object-fit'] === 'cover'
              ? Math.max(n.rect.width / vb[2], n.rect.height / vb[3])
              : Math.min(n.rect.width / vb[2], n.rect.height / vb[3]),
          w = vb[2] * s,
          h = vb[3] * s,
          pos = n.style['object-position'].split(' ').map(parseFloat);
        if (pos.length !== 2 || pos.some(x => !Number.isFinite(x)))
          fail('object position');
        f.layout.clipsContent = true;
        logo.chunks.forEach((markup, j) =>
          f.children.push({
            id: 'artwork-chunk-' + j,
            type: 'SVG',
            layout: { width: w, height: h },
            position: {
              x: ((n.rect.width - w) * pos[0]) / 100,
              y: ((n.rect.height - h) * pos[1]) / 100,
            },
            svg: {
              assetId:
                'page-header-' + name.replace('.svg', '') + '-chunk-' + j,
              markup,
            },
          })
        );
        semantics.push({
          sourceIndex: n.index,
          image: n.image,
          sourceObjectFit: n.style['object-fit'],
          sourceObjectPosition: n.style['object-position'],
          nativeVectorPixelMatch: false,
        });
      }
      if (n.classes.includes('mg-icon ')) {
        const mirror = mirrors.cases[modes[0].id + '-' + context].masks.find(
          x => x.className === n.classes
        );
        if (!mirror || mirror.hidden || mirror.sourceOwnerMirrorExact !== true)
          fail('source mask mirror');
        for (const m of modes) {
          const actual = mirrors.cases[m.id + '-' + context].masks.find(
            x => x.className === n.classes
          );
          if (
            !actual ||
            actual.sourceSvg !== mirror.sourceSvg ||
            JSON.stringify(actual.glyphBox) !==
              JSON.stringify(mirror.glyphBox) ||
            actual.sourceOwnerMirrorExact !== true
          )
            fail('all-mode source glyph');
          const css = at(m, n.index).style,
            color = rgba(css.color),
            expected = resolve('color/neutral-0', m, 'COLOR');
          if (['r', 'g', 'b', 'a'].some(k => color[k] !== (expected[k] ?? 1)))
            fail('source currentColor white alias');
        }
        const glyph = mirror.glyphBox;
        f.children.push({
          id: 'source-mask-vector-' + n.index,
          type: 'SVG',
          layout: { width: glyph.width, height: glyph.height },
          position: { x: glyph.x - n.rect.x, y: glyph.y - n.rect.y },
          svg: {
            assetId:
              'page-header-' +
              (n.classes.includes('mg-icon-user') ? 'user' : 'languages'),
            markup: mirror.sourceSvg.replaceAll('currentColor', '#000'),
            monochrome: { strokes: 'color/neutral-0' },
          },
        });
      }
      if (n.tag === 'BUTTON') {
        const atoms = sample.text.filter(
          t => t.parentIndex === n.index && t.text.trim()
        );
        if (
          atoms.length !== 1 ||
          atoms[0].text !== n.text ||
          atoms[0].rects.length !== 1
        )
          fail('one logical source label');
        for (const m of modes) {
          const actual = get(m).text.filter(
            t => t.parentIndex === n.index && t.text.trim()
          );
          if (
            actual.length !== 1 ||
            actual[0].text !== n.text ||
            actual[0].rects.length !== 1 ||
            ['x', 'y', 'width', 'height'].some(
              k => actual[0].rects[0][k] !== atoms[0].rects[0][k]
            )
          )
            fail('all-mode source logical text capacity');
        }
        f.layout.mode = 'VERTICAL';
        const t = atoms[0],
          rect = t.rects[0],
          id =
            'component.page-header.' + context + '.node-' + n.index + '.label';
        const familyRole = 'font-family/text';
        upsert(
          styles.text,
          {
            id,
            name:
              'Mangrove/Source PageHeader/' +
              context +
              '/node-' +
              n.index +
              '/label',
            bindings: { fontFamily: familyRole, fontSize: 'font-size/250' },
            values: per(m => {
              const css = at(m, n.index).style,
                family = resolve(familyRole, m, 'STRING');
              if (
                !css['font-family'].includes(family) ||
                parseFloat(css['font-size']) !==
                  resolve('font-size/250', m, 'FLOAT') ||
                !['400', '700'].includes(css['font-weight']) ||
                css['font-style'] !== 'normal'
              )
                fail('authored button body14 font');
              return {
                fontName: {
                  family,
                  style: css['font-weight'] === '700' ? 'Bold' : 'Regular',
                },
                fontSize: parseFloat(css['font-size']),
                lineHeight: {
                  unit: 'PIXELS',
                  value: parseFloat(css['line-height']),
                },
                letterSpacing: { unit: 'PIXELS', value: 0 },
                paragraphSpacing: 0,
              };
            }),
          },
          'TEXT'
        );
        f.children.push({
          id: 'label-' + n.index,
          type: 'TEXT',
          characters: n.text,
          textStyle: id,
          fill: paint(n.index, 'color', 'color/neutral-0'),
          textProperty: 'PageHeader ' + context + ' node ' + n.index + ' Label',
          absolute: {
            horizontal: 'START',
            vertical: 'START',
            offsetX: role(
              context + '/node-' + n.index + '/label-x',
              'FLOAT',
              () => rect.x - n.rect.x
            ),
            offsetY: role(
              context + '/node-' + n.index + '/label-y',
              'FLOAT',
              () => rect.y - n.rect.y
            ),
          },
          layout: { width: rect.width, height: rect.height },
          textWrap: 'AUTO',
        });
        const radius = parseFloat(n.style['border-top-left-radius']);
        if (radius > 0) {
          for (const m of modes)
            if (
              parseFloat(at(m, n.index).style['border-top-left-radius']) !==
              resolve('radius/button', m, 'FLOAT')
            )
              fail('authored button radius');
          f.radius = 'radius/button';
        }
        semantics.push({
          sourceIndex: n.index,
          sourceTag: 'BUTTON',
          ariaCurrent: n.aria.current,
          languageText: n.text,
          nativeSubmission: false,
        });
      }
    }
    // Native z-order must place border above the source background and preserved toolbar children.
    for (const f of projected.values())
      if (f.children.some(x => x.id === 'source-bottom-border')) {
        const border = f.children.find(x => x.id === 'source-bottom-border');
        f.children = f.children.filter(x => x !== border);
        f.children.push(border);
      }
    variants.push({
      id: 'page-header.' + context,
      name:
        'Context=' +
        context +
        ', SourceViewport=' +
        sample.viewport.width +
        ', Locale=' +
        sample.context.locale,
      properties: {
        Context: context,
        SourceViewport: String(sample.viewport.width),
        Locale: sample.context.locale,
      },
      tree,
      sourceContract: {
        sourceStory: sample.context.story,
        sourceArgs: sample.context.args,
        sourceLocale: sample.rootLanguage,
        sourceViewport: sample.viewport,
        semanticControls: semantics,
        sourceOwningBox:
          'actual standalone PageHeader root; measured fixed initial allocation',
        sourceOriginalContexts: context.startsWith('no-logo-')
          ? ['no-logo', 'controls-only']
          : undefined,
        sourceSVGWholePathEquivalence: true,
        nativeVectorPixelEquivalence: false,
        interactiveRuntimeAccepted: false,
      },
    });
  }
  const families = [
    {
      id: 'page-header',
      name: 'Mangrove/Source PageHeader',
      kind: 'component-set',
      review: { preserveVariantSizing: true, genericLabels: false },
      sourceRef: {
        file: 'stories/Components/PageHeader/PageHeader.jsx',
        line: 1,
      },
      variants,
      limitations: [
        'Finite source initial layouts include actual RTL, translated logo assets, branch visibility and exact source-owner icon geometry. No invented visible select label, fallback translation or normal Button surrogate.',
        'Whole-path logo chunks are source IMG-pixel equivalent in Chromium; proportional inline SVG differs and native vector/crop/font/glyph/pixel gates remain open.',
        'Invisible native select/options, submission, language changes, account navigation, focus, hover, noscript and optional SkipLink are semantic/runtime gates. Label properties support short edited copy only, not arbitrary reflow.',
        'Captured literal allocations are finite source presets, not responsive runtime or cross-theme native layout acceptance. Arabic/Chinese system fallback glyph selection is not proven as native Roboto coverage.',
      ],
    },
  ];
  target.variables.splice(0, target.variables.length, ...variables);
  target.styles.text.splice(0, target.styles.text.length, ...styles.text);
  target.styles.effect.splice(0, target.styles.effect.length, ...styles.effect);
  return families;
}
module.exports = { buildPageHeaderRecipes };
