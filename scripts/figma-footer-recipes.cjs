'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const ASSET = 'examples/figma-plugin/holistic/assets/footer/';
const PROVENANCE =
  '9a9f53d3b2927f271ec99ac5b08ba301e96d2f22828264627fc3e33ff207de9d';
function buildFooterRecipes({ root, modes, variables, styles }) {
  const target = { variables, styles };
  variables = structuredClone(variables);
  styles = structuredClone(styles);
  const fail = s => {
      throw Error('Footer source changed: ' + s);
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
      fail('foreign identity ' + e.id);
    if (list === variables) {
      if (hits.some(v => v.type !== e.type)) fail('foreign variable type');
    } else {
      if (styles.effect.some(v => v.id === e.id || v.name === e.name))
        fail('cross style kind');
      for (const v of hits) {
        if (v.type !== undefined && v.type !== 'TEXT') fail('wrong style kind');
        if (
          !v.values ||
          Object.keys(v.values).sort().join(',') !==
            modes
              .map(m => m.id)
              .sort()
              .join(',')
        )
          fail('style modes');
        for (const m of modes) {
          const x = v.values[m.id];
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
    }
    if (hits.length) list[list.indexOf(hits[0])] = e;
    else list.push(e);
  }
  function role(key, type, fn, scopes = ['ALL_SCOPES']) {
    const name = 'component/footer/' + key,
      values = per(fn);
    for (const [id, v] of Object.entries(values))
      if (
        type === 'FLOAT' &&
        !Number.isFinite(v?.alias ? resolve(v.alias, { id }, 'FLOAT') : v)
      )
        fail('finite role');
    upsert(variables, {
      id: name.replaceAll('/', '.'),
      name,
      type,
      values,
      scopes,
    });
    return name;
  }
  const archive = JSON.parse(read(ASSET + 'source-footprints.json'));
  function restore(x) {
    if (Array.isArray(x)) return x.map(restore);
    if (x && typeof x === 'object') {
      if (Object.keys(x).join(',') === '$sourceStyle') {
        if (!archive.styles[x.$sourceStyle]) fail('style reference');
        return structuredClone(archive.styles[x.$sourceStyle]);
      }
      return Object.fromEntries(
        Object.entries(x).map(([k, v]) => [k, restore(v)])
      );
    }
    return x;
  }
  if (archive.format !== 'lossless-css-intern-v1') fail('archive');
  const source = restore(archive.data);
  if (Object.keys(source.cases).length !== 50) fail('50 source contexts');
  const variants = [];
  for (const context of [
    'default',
    'with-complementary-content',
    'no-syndication',
    'custom-syndication-config',
    'script-load-error',
  ])
    for (const width of [390, 1164]) {
      const key = context + '-' + width,
        get = m => source.cases[m.id + '-' + key],
        sample = get(modes[0]),
        at = (m, i) => get(m).tree[i];
      for (const m of modes) {
        const c = get(m);
        if (
          !c ||
          c.viewport.width !== width ||
          c.tree[0].classes !== 'mg-footer' ||
          c.tree.length !== sample.tree.length
        )
          fail('source footer structure');
        if (
          context === 'script-load-error' &&
          !c.tree[0].text.includes('Unable to load syndicated footer content.')
        )
          fail('genuine JSX script error');
        if (
          context !== 'script-load-error' &&
          context !== 'no-syndication' &&
          !c.tree[0].text.includes('Loading UNDRR footer content…')
        )
          fail('actual pending remote boundary');
        for (const n of sample.tree) {
          const actual = at(m, n.index);
          if (
            actual.tag !== n.tag ||
            actual.classes !== n.classes ||
            actual.text !== n.text ||
            actual.href !== n.href
          )
            fail('source anatomy/copy');
          const css = actual.style;
          if (
            css['background-color'] !== 'rgba(0, 0, 0, 0)' ||
            css['background-image'] !== 'none' ||
            css['box-shadow'] !== 'none' ||
            +css.opacity !== 1
          )
            fail('captured transparent surface/opacity');
          if (
            ['top', 'right', 'bottom', 'left'].some(
              e => parseFloat(css['border-' + e + '-width']) !== 0
            )
          )
            fail('unexpected border');
          if (!(actual.rect.width > 0 && actual.rect.height > 0))
            fail('positive source owner');
        }
      }
      const dimension = (i, k) => {
        const values = modes.map(m => at(m, i).rect[k]);
        if (values.some(x => !Number.isFinite(x) || x <= 0))
          fail('positive allocation');
        return values.every(x => x === values[0])
          ? values[0]
          : role(key + '/node-' + i + '/' + k, 'FLOAT', m => at(m, i).rect[k]);
      };
      const position = (i, k) =>
        role(
          key + '/node-' + i + '/' + k,
          'FLOAT',
          m => at(m, i).rect[k] - at(m, at(m, i).parentIndex).rect[k]
        );
      const frame = i => ({
        id: i === 0 ? 'root' : 'node-' + i,
        type: 'FRAME',
        fill: null,
        layout: {
          mode: 'VERTICAL',
          width: dimension(i, 'width'),
          height: dimension(i, 'height'),
          clipsContent: false,
        },
        ...(i
          ? {
              absolute: {
                horizontal: 'START',
                vertical: 'START',
                offsetX: position(i, 'x'),
                offsetY: position(i, 'y'),
              },
            }
          : {}),
        children: [],
      });
      function style(i, sourceCss) {
        let ancestor = i,
          sourceWhite = false,
          social = false,
          description = false;
        while (ancestor >= 0) {
          const classes = sample.tree[ancestor].classes;
          if (classes.includes('mg-footer--about-footer |')) sourceWhite = true;
          if (classes === 'mg-footer--about-footer--links') social = true;
          if (classes === 'mg-footer--about-footer--description')
            description = true;
          ancestor = sample.tree[ancestor].parentIndex;
        }
        const id = 'component.footer.' + key + '.node-' + i + '.text',
          familyRole = social ? 'font-family/ui' : 'font-family/text',
          paintRole = sourceWhite ? 'color/white' : 'color/text';
        const color = role(key + '/node-' + i + '/ink', 'COLOR', m => {
          const raw = at(m, i).style.color,
            match = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(raw),
            value = resolve(paintRole, m, 'COLOR');
          if (
            !match ||
            ['r', 'g', 'b'].some(
              (k, j) => Math.round(value[k] * 255) !== +match[j + 1]
            ) ||
            (value.a ?? 1) !== 1
          )
            fail('authored text/white paint alias');
          return { alias: paintRole };
        });
        const size = role(
          key + '/node-' + i + '/font-size',
          'FLOAT',
          m => {
            const css = at(m, i).style,
              n = parseFloat(css['font-size']);
            if (!Number.isFinite(n) || n <= 0) fail('font size');
            const token = social
              ? 'font-size/500'
              : description || sample.tree[i].tag === 'H3'
                ? 'font-size/400'
                : 'font-size/300';
            if (resolve(token, m, 'FLOAT') !== n)
              fail('authored source size token');
            return { alias: token };
          },
          ['FONT_SIZE']
        );
        upsert(styles.text, {
          id,
          name: 'Mangrove/Source Footer/' + key + '/node-' + i + '/text',
          bindings: { fontFamily: familyRole, fontSize: size },
          values: per(m => {
            const css = at(m, i).style,
              family = resolve(familyRole, m, 'STRING');
            if (
              !css['font-family'].includes(family) ||
              !['400', '600', '700'].includes(css['font-weight']) ||
              css['font-style'] !== 'normal'
            )
              fail('source font');
            const line = /^([\d.]+)px$/.exec(css['line-height']);
            if (!line) fail('source line height');
            return {
              fontName: {
                family,
                style: css['font-weight'] === '400' ? 'Regular' : 'Bold',
              },
              fontSize: parseFloat(css['font-size']),
              lineHeight: { unit: 'PIXELS', value: +line[1] },
              letterSpacing: { unit: 'PIXELS', value: 0 },
              paragraphSpacing: 0,
            };
          }),
        });
        return { id, color };
      }
      const projected = new Map([[0, frame(0)]]),
        skip = new Set();
      function descendants(i) {
        for (const n of sample.tree) {
          let p = n.parentIndex;
          while (p >= 0) {
            if (p === i) {
              skip.add(n.index);
              break;
            }
            p = sample.tree[p].parentIndex;
          }
        }
      }
      for (const n of sample.tree.slice(1)) {
        if (skip.has(n.index)) continue;
        const parent = projected.get(n.parentIndex);
        if (!parent) fail('owning parent');
        const isText =
          ['P', 'H3', 'A'].includes(n.tag) ||
          (n.tag === 'DIV' &&
            sample.tree.every(x => x.parentIndex !== n.index) &&
            n.text.trim());
        if (isText && n.style.display !== 'inline-flex') {
          const { id, color } = style(n.index, n.style),
            rectFrame = frame(n.index);
          let t = {
            ...rectFrame,
            type: 'TEXT',
            characters: n.text,
            textStyle: id,
            fill: color,
            textWrap: {
              auto: 'AUTO',
              balance: 'BALANCE',
              pretty: 'PRETTY',
            }[n.style['text-wrap-style']],
          };
          delete t.children;
          if (!t.textWrap) fail('text wrap');
          const atoms = sample.text.filter(a => {
            let p = a.parentIndex;
            while (p >= 0) {
              if (p === n.index) return true;
              p = sample.tree[p].parentIndex;
            }
            return false;
          });
          if (atoms.map(a => a.text).join('') !== n.text)
            fail('logical source text atoms');
          let offset = 0;
          const runs = atoms.map(a => {
            const start = offset;
            offset += a.text.length;
            if (a.style['text-decoration-line'] !== 'none')
              fail('unexpected link decoration');
            if (
              a.style.color !== n.style.color ||
              a.style['font-family'] !== n.style['font-family'] ||
              a.style['font-size'] !== n.style['font-size'] ||
              a.style['font-weight'] !== n.style['font-weight']
            )
              fail('mixed atom formatting requires distinct style');
            return {
              id: 'atom-' + start,
              start,
              end: offset,
              textStyle: id,
              fill: color,
              ...(a.href ? { hyperlink: { type: 'URL', value: a.href } } : {}),
            };
          });
          if (runs.some(r => r.hyperlink)) {
            for (const r of runs)
              if (r.hyperlink && !/^https:\/\//.test(r.hyperlink.value))
                fail('actual HTTPS');
            t.textRuns = runs;
            delete t.fill;
            delete t.textStyle;
          } else
            t.textProperty =
              'Footer ' + context + ' ' + width + ' node ' + n.index;
          parent.children.push(t);
          descendants(n.index);
        } else {
          const f = frame(n.index);
          parent.children.push(f);
          projected.set(n.index, f);
        }
      }
      const tree = projected.get(0);
      variants.push({
        id: 'footer.' + key,
        name:
          'Context=' +
          context +
          ', SourceViewport=' +
          width +
          ', Locale=English',
        properties: {
          Context: context,
          SourceViewport: String(width),
          Locale: 'English',
        },
        tree,
        sourceContract: {
          sourceStory: context === 'script-load-error' ? 'default' : context,
          sourceOwningBox: 'actual mg-footer',
          sourceViewport: width,
          sourceCapturedThemes: modes.map(m => m.id),
          remoteBoundary:
            context === 'no-syndication'
              ? 'disabled'
              : context === 'script-load-error'
                ? 'controlled actual JSX script.onerror'
                : 'actual script HTTP200, template fetch failed; source loading copy remains',
          resolvedPayloadAccepted: false,
        },
      });
    }
  const families = [
    {
      id: 'footer',
      name: 'Mangrove/Source Footer',
      kind: 'component-set',
      review: { preserveVariantSizing: true, genericLabels: false },
      sourceRef: { file: 'stories/Components/Footer/Footer.jsx', line: 112 },
      variants,
      limitations: [
        'Finite actual local/complementary/loading/script-error source states only. No fetched resolved global content or historical FooterNavigation surrogate.',
        'Social links preserve individual source inline-flex owner boxes; logical description links remain editable rich TEXT. Short edited copy is supported; arbitrary wrapping/reflow and link click behavior remain native gates.',
        'Actual complementary white text sits on captured transparent background; no guessed turquoise surface is added.',
        'Source weight600 requests native Bold700 provisionally. Source fonts, native pixels, cross-mode flow, runtime widget/CDN/storage and consumer publication remain open.',
      ],
    },
  ];
  target.variables.splice(0, target.variables.length, ...variables);
  target.styles.text.splice(0, target.styles.text.length, ...styles.text);
  target.styles.effect.splice(0, target.styles.effect.length, ...styles.effect);
  return families;
}
module.exports = { buildFooterRecipes };
