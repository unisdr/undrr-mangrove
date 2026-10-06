'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto'),
  zlib = require('zlib');
const ASSET = 'examples/figma-plugin/holistic/assets/image-figure/';
const PROVENANCE =
  '17010b5c33bbb95a43d488b2f7843207d641c66b33ccfdf02a3981807d4772e8';
function buildImageFigureRecipes({ root, modes, variables, styles }) {
  const target = { variables, styles };
  variables = structuredClone(variables);
  styles = structuredClone(styles);
  const fail = s => {
      throw Error('Image figure source changed: ' + s);
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
    const name = 'component/image-figure/' + key,
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
        if (!archive.styles[x.$sourceStyle]) fail('source style reference');
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
    proof = JSON.parse(read(ASSET + 'credit-flex-proof.json')).cases;
  if (Object.keys(cases).length !== 360 || Object.keys(proof).length !== 90)
    fail('source census');
  const variants = [];
  for (const locale of ['english', 'arabic', 'japanese'])
    for (const size of ['wide', 'medium', 'portrait'])
      for (const content of ['both', 'caption', 'credit', 'media-only'])
        for (const width of [390, 1164]) {
          const key = [locale, size, content, width].join('-'),
            get = m => cases[m.id + '-' + key],
            sample = get(modes[0]),
            at = (m, i) => get(m).tree[i],
            hasCaption = ['both', 'caption'].includes(content),
            hasCredit = ['both', 'credit'].includes(content),
            suffix = { wide: 'lg', medium: 'md', portrait: 'sm' }[size];
          for (const m of modes) {
            const c = get(m);
            if (
              !c ||
              c.viewport.width !== width ||
              c.tree.length !== sample.tree.length ||
              c.rootLanguage.html !==
                { english: 'en', arabic: 'ar', japanese: 'ja' }[locale] ||
              c.context.sourceArgs.size !== size ||
              c.context.sourceArgs.caption !== hasCaption ||
              c.context.sourceArgs.credit !== hasCredit
            )
              fail('actual source controls/locale');
            for (const n of sample.tree) {
              const a = at(m, n.index),
                css = a.style;
              if (
                a.tag !== n.tag ||
                a.classes !== n.classes ||
                a.text !== n.text ||
                a.parentIndex !== n.parentIndex
              )
                fail('source anatomy/copy');
              if (
                css['background-color'] !== 'rgba(0, 0, 0, 0)' ||
                css['background-image'] !== 'none' ||
                css['box-shadow'] !== 'none' ||
                +css.opacity !== 1
              )
                fail('source surfaces');
              if (
                !Number.isFinite(a.rect.width) ||
                !Number.isFinite(a.rect.height)
              )
                fail('source geometry');
            }
            const im = c.tree.find(n => n.image)?.image;
            if (
              !im?.complete ||
              !im.currentSrc.endsWith('sample_image-' + suffix + '.jpg') ||
              im.alt !== 'farmland' ||
              im.naturalWidth !== { lg: 1392, md: 802, sm: 450 }[suffix] ||
              im.naturalHeight !== 615
            )
              fail('real bundled media');
          }
          const number = (label, fn, positive = false) => {
            const values = modes.map(fn);
            if (values.some(x => !Number.isFinite(x) || (positive && x <= 0)))
              fail('finite source allocation');
            return values.every(x => x === values[0])
              ? values[0]
              : role(key + '/' + label, 'FLOAT', fn);
          };
          const offset = (label, fn) => role(key + '/' + label, 'FLOAT', fn);
          const position = (label, rect, parent) => ({
            horizontal: 'START',
            vertical: 'START',
            offsetX: offset(label + '/x', m => rect(m).x - parent(m).x),
            offsetY: offset(label + '/y', m => rect(m).y - parent(m).y),
          });
          const frame = (id, rect, parent) => ({
            id,
            type: 'FRAME',
            fill: null,
            layout: {
              mode: 'VERTICAL',
              width: number(id + '/width', m => rect(m).width, true),
              height: number(id + '/height', m => rect(m).height, true),
              clipsContent: false,
            },
            ...(parent ? { absolute: position(id, rect, parent) } : {}),
            children: [],
          });
          function paint(label, css, token) {
            return role(
              key + '/' + label,
              'COLOR',
              m => {
                const match = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(css(m)),
                  v = resolve(token, m, 'COLOR');
                if (
                  !match ||
                  ['r', 'g', 'b'].some(
                    (k, i) => Math.round(v[k] * 255) !== +match[i + 1]
                  ) ||
                  (v.a ?? 1) !== 1
                )
                  fail('authored paint ' + token);
                return { alias: token };
              },
              ['ALL_FILLS', 'STROKE_COLOR']
            );
          }
          function style(label, css, bold = false) {
            const id = 'component.image-figure.' + key + '.' + label,
              familyRole =
                locale === 'arabic'
                  ? role(
                      'arabic-text-family',
                      'STRING',
                      m => {
                        if (!css(m)['font-family'].includes('Noto Sans Arabic'))
                          fail('Arabic source font');
                        return 'Noto Sans Arabic';
                      },
                      ['FONT_FAMILY']
                    )
                  : 'font-family/text',
              sizeRole = role(
                key + '/' + label + '/font-size',
                'FLOAT',
                m => {
                  const n = parseFloat(css(m)['font-size']),
                    token = 'font-size/' + (n === 12.5 ? '200' : '300');
                  if (resolve(token, m, 'FLOAT') !== n)
                    fail('source font-size');
                  return { alias: token };
                },
                ['FONT_SIZE']
              );
            upsert(styles.text, {
              id,
              name: 'Mangrove/Source Images/' + key + '/' + label,
              bindings: { fontFamily: familyRole, fontSize: sizeRole },
              values: per(m => {
                const c = css(m),
                  family = resolve(familyRole, m, 'STRING');
                if (
                  !c['font-family'].includes(family) ||
                  c['font-style'] !== 'normal' ||
                  c['font-weight'] !== (bold ? '700' : '400') ||
                  !/^\d+(\.\d+)?px$/.test(c['line-height']) ||
                  (parseFloat(c['letter-spacing']) !== 0 &&
                    c['letter-spacing'] !== 'normal')
                )
                  fail('source face/line height');
                return {
                  fontName: { family, style: bold ? 'Bold' : 'Regular' },
                  fontSize: parseFloat(c['font-size']),
                  lineHeight: {
                    unit: 'PIXELS',
                    value: parseFloat(c['line-height']),
                  },
                  letterSpacing: { unit: 'PIXELS', value: 0 },
                  paragraphSpacing: 0,
                };
              }),
            });
            return id;
          }
          function plain(id, text, rect, parent, css, token, bold = false) {
            const t = frame(id, rect, parent);
            delete t.children;
            t.type = 'TEXT';
            t.characters = text;
            t.textStyle = style(id, css, bold);
            t.fill = paint(id + '/ink', m => css(m).color, token);
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
              fail('text wrap');
            t.textAlign = locale === 'arabic' ? 'RIGHT' : 'LEFT';
            t.textProperty = 'Images ' + key + ' ' + id;
            return t;
          }
          const rootRect = m => at(m, 0).rect,
            tree = frame('root', rootRect),
            cart = sample.tree.find(
              n => n.classes === 'mg-image-figcaption__cart'
            ),
            media = sample.tree.find(n => n.image),
            cartRect = m => at(m, cart.index).rect,
            cartTree = frame('media-cart', cartRect, rootRect),
            mediaTree = frame('media', m => at(m, media.index).rect, cartRect);
          mediaTree.layout.mode = 'NONE';
          mediaTree.layout.clipsContent = true;
          mediaTree.image = {
            assetId: 'image-figure-source-' + suffix,
            base64: read(
              ASSET + 'images/sample_image-' + suffix + '.jpg'
            ).toString('base64'),
            scaleMode: 'FILL',
          };
          mediaTree.sourceAlt = 'farmland';
          delete mediaTree.children;
          cartTree.children.push(mediaTree);
          tree.children.push(cartTree);
          function borders(owner, index) {
            for (const edge of ['top', 'right', 'bottom', 'left']) {
              const css = m => at(m, index).style,
                thick = m => parseFloat(css(m)['border-' + edge + '-width']);
              if (modes.every(m => thick(m) === 0)) continue;
              if (
                modes.some(
                  m =>
                    ![1, 2].includes(thick(m)) ||
                    css(m)['border-' + edge + '-style'] !== 'solid'
                )
              )
                fail('actual source border');
              const token =
                  index === sample.tree.find(n => n.tag === 'FIGCAPTION')?.index
                    ? 'color/black'
                    : 'color/neutral-500',
                r = m => at(m, index).rect,
                vertical = ['left', 'right'].includes(edge),
                rect = m => ({
                  x: r(m).x + (edge === 'right' ? r(m).width - thick(m) : 0),
                  y: r(m).y + (edge === 'bottom' ? r(m).height - thick(m) : 0),
                  width: vertical ? thick(m) : r(m).width,
                  height: vertical ? r(m).height : thick(m),
                }),
                b = frame(owner.id + '-border-' + edge, rect, r);
              b.fill = paint(
                b.id + '/ink',
                m => css(m)['border-' + edge + '-color'],
                token
              );
              delete b.children;
              owner.children.push(b);
            }
          }
          if (hasCaption || hasCredit) {
            const caption = sample.tree.find(n => n.tag === 'FIGCAPTION'),
              capRect = m => at(m, caption.index).rect,
              cap = frame('caption', capRect, rootRect);
            borders(cap, caption.index);
            if (hasCaption) {
              const p = sample.tree.find(n => n.tag === 'P');
              cap.children.push(
                plain(
                  'caption-text',
                  p.text,
                  m => at(m, p.index).rect,
                  capRect,
                  m => at(m, p.index).style,
                  'color/neutral-600'
                )
              );
            }
            if (hasCredit) {
              const credit = sample.tree.find(n => n.classes === 'mg-credits'),
                strong = sample.tree.find(n => n.tag === 'STRONG'),
                org = sample.text.find(
                  a => a.kind === 'text' && a.parentIndex === credit.index
                ),
                cRect = m => at(m, credit.index).rect,
                c = frame('credit', cRect, capRect);
              borders(c, credit.index);
              if (
                !org ||
                !strong ||
                sample.text.filter(a => a.kind === 'source-BR').length !== 1
              )
                fail('actual credit source BR/Strong');
              if (width === 390) {
                const p = m => proof[m.id + '-' + key];
                for (const m of modes) {
                  const a = p(m);
                  if (
                    !a ||
                    a.organization.text !== org.text ||
                    a.author.text !== strong.text ||
                    a.geometryBefore.length !== sample.tree.length ||
                    !a.geometryBefore.every((r, i) =>
                      ['x', 'y', 'width', 'height'].every(
                        k => r[k] === at(m, i).rect[k]
                      )
                    ) ||
                    !a.existingAfterWrapper.every((r, i) =>
                      ['x', 'y', 'width', 'height'].every(
                        k => r[k] === a.geometryBefore[i][k]
                      )
                    )
                  )
                    fail('anonymous actual flex-item capacity proof');
                }
                c.children.push(
                  plain(
                    'organization',
                    org.text,
                    m => p(m).organization.rect,
                    cRect,
                    m => p(m).organization.style,
                    'color/text'
                  )
                );
                c.children.push(
                  plain(
                    'author',
                    strong.text,
                    m => at(m, strong.index).rect,
                    cRect,
                    m => at(m, strong.index).style,
                    'color/text',
                    true
                  )
                );
              } else {
                if (
                  modes.some(m => at(m, credit.index).style.display !== 'block')
                )
                  fail('actual desktop block credits');
                const css = m => at(m, credit.index).style,
                  rect = m => {
                    const r = cRect(m),
                      s = css(m),
                      left =
                        parseFloat(s['padding-left']) +
                        parseFloat(s['border-left-width']),
                      right =
                        parseFloat(s['padding-right']) +
                        parseFloat(s['border-right-width']),
                      top =
                        parseFloat(s['padding-top']) +
                        parseFloat(s['border-top-width']),
                      bottom =
                        parseFloat(s['padding-bottom']) +
                        parseFloat(s['border-bottom-width']);
                    return {
                      x: r.x + left,
                      y: r.y + top,
                      width: r.width - left - right,
                      height: r.height - top - bottom,
                    };
                  },
                  t = frame('credit-text', rect, cRect);
                delete t.children;
                t.type = 'TEXT';
                delete t.fill;
                t.characters = org.text + '\n' + strong.text;
                t.textAlign = locale === 'arabic' ? 'RIGHT' : 'LEFT';
                t.textWrap = 'AUTO';
                const regular = style('credit-regular', css),
                  bold = style(
                    'credit-bold',
                    m => at(m, strong.index).style,
                    true
                  ),
                  ink = paint('credit-ink', m => css(m).color, 'color/text');
                t.textRuns = [
                  {
                    id: 'organization',
                    start: 0,
                    end: org.text.length + 1,
                    textStyle: regular,
                    fill: ink,
                  },
                  {
                    id: 'author',
                    start: org.text.length + 1,
                    end: t.characters.length,
                    textStyle: bold,
                    fill: ink,
                  },
                ];
                c.children.push(t);
              }
              cap.children.push(c);
            }
            tree.children.push(cap);
          }
          variants.push({
            id: 'image-figure.' + key,
            name:
              'Size=' +
              size +
              ', Content=' +
              content +
              ', Locale=' +
              locale +
              ', SourceViewport=' +
              width,
            properties: {
              Size: size,
              Content: content,
              Locale: locale,
              SourceViewport: String(width),
            },
            tree,
            sourceContract: {
              sourceViewport: width,
              sourceLocale: locale,
              sourceAlt: 'farmland',
              sourceImage: 'sample_image-' + suffix + '.jpg',
              sourceModule: 'Images -> Imagecaption -> P/Imagecredit',
              sourceCreditLayout: hasCredit
                ? width === 390
                  ? 'genuine anonymous organization and Strong flex items; source BR has no newline ink'
                  : 'one logical rich credit with authored BR and Strong'
                : 'absent',
            },
          });
        }
  const families = [
    {
      id: 'image-figure',
      name: 'Mangrove/Source Images figure',
      kind: 'component-set',
      sourceRef: {
        file: 'stories/Atom/Images/ImageCaptionCredit/ImageCaptionCredit.jsx',
        line: 5,
      },
      review: { preserveVariantSizing: true, genericLabels: false },
      variants,
      limitations: [
        '72 finite actual control-selected source profiles captured across five brands. Module exports only, not package-entry exports. No orphan standalone Image revival.',
        'Actual mobile credit flex items retain measured source ownership; desktop credit is one rich TEXT with authored BR and Bold author. Plain short copy and supported formatted rich edits are editable within initial capacities. Arbitrary changed copy/reflow, native bidi/CJK fallback, font-byte/glyph/line metrics and source pixels remain open.',
        'Bundled source JPG bytes and actual COVER boxes preserved. Source photograph licence, native image crop/raster, responsive runtime and consumer publication remain independent gates. No lazy image/PICTURE or arbitrary caller ReactNode coverage.',
      ],
    },
  ];
  target.variables.splice(0, target.variables.length, ...variables);
  target.styles.text.splice(0, target.styles.text.length, ...styles.text);
  target.styles.effect.splice(0, target.styles.effect.length, ...styles.effect);
  return families;
}
module.exports = { buildImageFigureRecipes };
