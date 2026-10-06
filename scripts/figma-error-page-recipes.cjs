'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const ASSET = 'examples/figma-plugin/holistic/assets/error-page/';
const PROVENANCE =
  '261591178d16f726ebfb7ee93228f426e84e4d04f762aead90d3f7567e92d8f3';
function buildErrorPageRecipes({ root, modes, variables, styles }) {
  const target = { variables, styles };
  variables = structuredClone(variables);
  styles = structuredClone(styles);
  const fail = s => {
      throw Error('ErrorPage source changed: ' + s);
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
  for (const expected of JSON.parse(read(ASSET + 'foundation-contract.json'))) {
    const hits = variables.filter(
      v => v.id === expected.id || v.name === expected.name
    );
    if (
      hits.length !== 1 ||
      ['id', 'name', 'type', 'values'].some(
        k => JSON.stringify(hits[0][k]) !== JSON.stringify(expected[k])
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
    const name = 'component/error-page/' + slug,
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
  const source = JSON.parse(read(ASSET + 'source-footprints.json')).cases;
  if (Object.keys(source).length !== 100) fail('100 actual source captures');
  const rawLogo = read(ASSET + 'undrr-logo-blue.svg').toString(),
    logoPaths = [...rawLogo.matchAll(/<path d="([^"]+)" class="st0"\/>/g)].map(
      m => m[1]
    );
  if (
    !logoPaths.length ||
    !rawLogo.includes('.st0{fill:#004f91}') ||
    logoPaths.length !== [...rawLogo.matchAll(/<path /g)].length
  )
    fail('logo path/paint normalization');
  const logoMarkup =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 424.6 63.8">' +
    logoPaths.map(d => '<path d="' + d + '" fill="#000000"/>').join('') +
    '</svg>';
  const contexts = Object.keys(source)
    .filter(k => k.startsWith('undrr-'))
    .map(k => k.slice(6));
  const mono = role('mono-candidate-family', 'STRING', () => 'Menlo');
  const families = [];
  const number = (key, fn) => role(key, 'FLOAT', fn);
  const paint = (key, fn) => {
    const all = per(m => cssColor(fn(m)));
    const alias = variables
      .filter(v => v.type === 'COLOR' && v.name.startsWith('color/'))
      .find(v =>
        modes.every(m => {
          let b = resolve(v.name, m, 'COLOR'),
            a = all[m.id];
          return sameRGB(a, b) && a.a === (b.a ?? 1);
        })
      );
    return role(key, 'COLOR', m => (alias ? { alias: alias.name } : all[m.id]));
  };
  const family = (id, variants, dependencies = []) => ({
    id,
    name: 'Mangrove/Source ' + id,
    kind: 'component-set',
    dependencies,
    review: { preserveVariantSizing: true, genericLabels: false },
    sourceRef: {
      file: 'stories/Components/ErrorPages/ErrorPage.jsx',
      line: 39,
    },
    limitations: [
      'Finite authored React source allocations at390/1164 and1000px viewport height, not responsive behavior.',
      'Source system monospace stack maps only to a finite Menlo advance candidate; native Menlo currently absent, no font substitute or glyph/raster proof.',
      'Recovery links preserve logical rich paragraphs and source2.4px underline offsets; relative href remains metadata, native navigation and source/native reflow remain open.',
      'Challenge is authored literal CAPTCHA sample, no real Cloudflare widget, challenge completion or server/security behavior.',
      'Challenge dashed SVG6/6 cadence is a projection candidate, not authored CSS dash geometry or native/browser raster acceptance.',
      'Regular inherited Roboto headings and source600 to Bold700 named-face mapping are provisional native font matches; logo contains source blue SVG without new licensing claim.',
      'Standalone HTML critical-CSS action templates, RTL, interaction, publication and human handoff are separate gates.',
    ],
    variants,
  });
  for (const key of contexts) {
    const get = m => source[m.id + '-' + key],
      sample = get(modes[0]),
      at = (m, i) => get(m).tree[i],
      S = i => m => at(m, i),
      R = i => m => at(m, i).rect;
    for (const m of modes) {
      let a = get(m);
      if (
        !a ||
        a.tree.length !== sample.tree.length ||
        !a.controlAlias ||
        a.monoProbes.some(p => p.sourceStack !== p.Menlo)
      )
        fail('source capture structure/font');
      for (let i = 0; i < a.tree.length; i++) {
        const n = a.tree[i],
          x = sample.tree[i];
        if (
          n.tag !== x.tag ||
          n.classes !== x.classes ||
          n.text !== x.text ||
          n.style.opacity !== '1'
        )
          fail('source anatomy/copy/opacity');
        if (
          ['width', 'height', 'x', 'y'].some(k => !Number.isFinite(n.rect[k]))
        )
          fail('source geometry');
      }
      if (
        a.paragraphs.some(
          p => p.logicalText !== p.atoms.map(a => a.text).join('')
        )
      )
        fail('logical paragraph');
    }
    const dim = (slug, rect) => ({
      width: number(key + '/' + slug + '/width', m => rect(m).width),
      height: number(key + '/' + slug + '/height', m => rect(m).height),
    });
    const abs = (slug, rect, parent) => ({
      horizontal: 'START',
      vertical: 'START',
      offsetX: number(key + '/' + slug + '/x', m => rect(m).x - parent(m).x),
      offsetY: number(key + '/' + slug + '/y', m => rect(m).y - parent(m).y),
    });
    const frame = (id, rect, parent, roleSlug = id) => ({
      id,
      type: 'FRAME',
      fill: null,
      layout: { mode: 'VERTICAL', ...dim(roleSlug, rect) },
      ...(parent ? { absolute: abs(id, rect, parent) } : {}),
      children: [],
    });
    const style = (slug, fn) => {
      const id = 'component.error-page.' + key + '.' + slug,
        all = per(m => fn(m)),
        isMono = all[modes[0].id].fontFamily.startsWith('ui-monospace'),
        fontFamily = isMono ? mono : 'font-family/text',
        size = number(key + '/' + slug + '/font-size', m =>
          parseFloat(all[m.id].fontSize)
        );
      for (const m of modes) {
        let c = all[m.id];
        if (
          c.fontStyle !== 'normal' ||
          !['400', '500', '600', '700'].includes(c.fontWeight) ||
          (!isMono && !c.fontFamily.includes(resolve(fontFamily, m, 'STRING')))
        )
          fail('source font role');
      }
      upsert(styles.text, {
        id,
        name: 'Mangrove/Source ErrorPage/' + key + '/' + slug,
        bindings: { fontFamily, fontSize: size },
        values: per(m => ({
          fontName: {
            family: resolve(fontFamily, m, 'STRING'),
            style: ['600', '700'].includes(all[m.id].fontWeight)
              ? 'Bold'
              : 'Regular',
          },
          fontSize: parseFloat(all[m.id].fontSize),
          lineHeight: {
            unit: 'PIXELS',
            value: parseFloat(all[m.id].lineHeight),
          },
          letterSpacing: {
            unit: 'PIXELS',
            value:
              all[m.id].letterSpacing === 'normal'
                ? 0
                : parseFloat(all[m.id].letterSpacing),
          },
        })),
      });
      return id;
    };
    const surface = (node, i, roleSlug = node.id) => {
      const ss = m => at(m, i).style;
      if (sample.tree[i].style.backgroundColor !== 'rgba(0, 0, 0, 0)')
        node.fill = paint(
          key + '/' + roleSlug + '/surface',
          m => ss(m).backgroundColor
        );
      node.bindings = {
        cornerRadius: number(key + '/' + roleSlug + '/radius', m =>
          parseFloat(ss(m).borderRadius)
        ),
      };
      if (
        sample.tree[i].style.borderTopStyle === 'solid' &&
        parseFloat(sample.tree[i].style.borderTopWidth) > 0
      ) {
        node.stroke = paint(
          key + '/' + roleSlug + '/border',
          m => ss(m).borderTopColor
        );
        node.bindings.strokeWeight = number(
          key + '/' + roleSlug + '/border-width',
          m => parseFloat(ss(m).borderTopWidth)
        );
      }
      if (sample.tree[i].style.boxShadow !== 'none') {
        const eid = 'component.error-page.' + key + '.' + roleSlug + '.effect',
          binding = paint(key + '/' + roleSlug + '/shadow', m => {
            let x = /^(rgba?\([^)]+\))/.exec(ss(m).boxShadow);
            if (!x) fail('source shadow');
            return x[1];
          });
        upsert(styles.effect, {
          id: eid,
          name: 'Mangrove/Source ErrorPage/' + key + '/' + roleSlug + '/effect',
          values: per(m => {
            let x =
              /^(rgba?\([^)]+\)) (-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px (-?[\d.]+)px( inset)?$/.exec(
                ss(m).boxShadow
              );
            if (!x) fail('source shadow geometry');
            return [
              {
                effect: {
                  type: x[6] ? 'INNER_SHADOW' : 'DROP_SHADOW',
                  color: cssColor(x[1]),
                  offset: { x: +x[2], y: +x[3] },
                  radius: +x[4],
                  spread: +x[5],
                  visible: true,
                  blendMode: 'NORMAL',
                },
                bindings: { color: binding },
              },
            ];
          }),
        });
        node.effectStyle = eid;
      }
    };
    const txt = (i, parent, overrideRect) => {
      const n = sample.tree[i],
        rect = overrideRect || R(i),
        p = sample.paragraphs.find(p => p.index === i),
        t = {
          id: 'text-' + i,
          type: 'TEXT',
          characters: p ? p.logicalText : n.text,
          layout: dim('text-' + i, rect),
          absolute: abs('text-' + i, rect, parent),
          textAlign: n.style.textAlign === 'center' ? 'CENTER' : 'LEFT',
        };
      if (p && p.atoms.length > 1) {
        const groups = [];
        for (let j = 0; j < p.atoms.length; j++) {
          let a = p.atoms[j],
            signature = JSON.stringify([
              a.parent.style.fontFamily,
              a.parent.style.fontWeight,
              a.parent.style.color,
              a.parent.style.textDecorationLine,
              a.parent.style.textUnderlineOffset,
              a.href,
            ]);
          let last = groups.at(-1);
          if (last && last.signature === signature) {
            last.end = a.end;
            last.atoms.push(j);
          } else
            groups.push({ start: a.start, end: a.end, signature, atoms: [j] });
        }
        t.textRuns = groups.map((g, j) => {
          let a = p.atoms[g.atoms[0]],
            ss = m =>
              get(m).paragraphs.find(p => p.index === i).atoms[g.atoms[0]]
                .parent.style;
          let run = {
            id: 'run-' + j,
            start: g.start,
            end: g.end,
            textStyle: style('text-' + i + '-run-' + j, ss),
            fill: paint(
              key + '/text-' + i + '-run-' + j + '/ink',
              m => ss(m).color
            ),
            textDecoration:
              a.parent.style.textDecorationLine === 'underline'
                ? 'UNDERLINE'
                : 'NONE',
          };
          if (run.textDecoration === 'UNDERLINE') {
            for (const m of modes)
              if (ss(m).textUnderlineOffset !== '2.4px')
                fail('source link offset');
            run.textDecorationOffset = { unit: 'PIXELS', value: 2.4 };
          }
          if (a.href?.startsWith('https://'))
            run.hyperlink = { type: 'URL', value: a.href };
          return run;
        });
      } else {
        t.textStyle = style('text-' + i, m => at(m, i).style);
        t.fill = paint(key + '/text-' + i + '/ink', m => at(m, i).style.color);
        t.textProperty = 'ErrorPage/' + key + '/Text' + i;
      }
      return t;
    };
    const rootFrame = frame('root', R(0), null),
      nodes = new Map([[0, rootFrame]]),
      skip = new Set();
    surface(rootFrame, 0);
    for (let i = 1; i < sample.tree.length; i++) {
      if (skip.has(i)) continue;
      let n = sample.tree[i];
      if (n.classes === 'mg-u-sr-only' || ['A', 'BR', 'LABEL'].includes(n.tag))
        continue;
      let parentIndex = n.parentIndex;
      while (!nodes.has(parentIndex))
        parentIndex = sample.tree[parentIndex].parentIndex;
      let parent = nodes.get(parentIndex),
        parentRect = R(parentIndex);
      if (n.tag === 'FORM') {
        const form = frame('root', R(i), null, 'search-form'),
          inputIndex = sample.tree.find(
            n => n.parentIndex === i && n.tag === 'INPUT'
          ).index,
          buttonIndex = sample.tree.find(
            n => n.parentIndex === i && n.tag === 'BUTTON'
          ).index,
          props = {
            SourceViewport: key.endsWith('390') ? '390' : '1164',
            Locale: 'English',
          };
        for (const [index, kind] of [
          [inputIndex, 'input'],
          [buttonIndex, 'action'],
        ]) {
          let control = frame('root', R(index), null, 'search-' + kind);
          surface(control, index, 'search-' + kind);
          if (kind === 'input') {
            const content = m => {
              let r = at(m, index).rect,
                c = at(m, index).style,
                p = at(m, index).placeholderStyle;
              return {
                x:
                  r.x +
                  parseFloat(c.borderLeftWidth) +
                  parseFloat(c.paddingLeft),
                y:
                  r.y + parseFloat(c.borderTopWidth) + parseFloat(c.paddingTop),
                width: parseFloat(p.width),
                height:
                  r.height -
                  parseFloat(c.borderTopWidth) -
                  parseFloat(c.borderBottomWidth) -
                  parseFloat(c.paddingTop) -
                  parseFloat(c.paddingBottom),
              };
            };
            const placeholder = txt(index, R(index), content);
            placeholder.characters = nothingPlaceholder(sample.tree[index]);
            placeholder.textProperty =
              'ErrorPage/' + key + '/SearchPlaceholder';
            placeholder.fill = paint(
              key + '/input-placeholder/ink',
              m => at(m, index).placeholderStyle.color
            );
            control.children.push(placeholder);
          }
          if (kind === 'action') {
            const content = m => {
              let r = at(m, index).rect,
                c = at(m, index).style;
              return {
                x:
                  r.x +
                  parseFloat(c.paddingLeft) +
                  parseFloat(c.borderLeftWidth),
                y:
                  r.y + parseFloat(c.paddingTop) + parseFloat(c.borderTopWidth),
                width:
                  r.width -
                  parseFloat(c.paddingLeft) -
                  parseFloat(c.paddingRight) -
                  parseFloat(c.borderLeftWidth) -
                  parseFloat(c.borderRightWidth),
                height: parseFloat(c.lineHeight),
              };
            };
            control.children.push(txt(index, R(index), content));
          }
          let fid = 'error-page-search-' + kind,
            vid = fid + '.' + props.SourceViewport,
            found = families.find(f => f.id === fid);
          if (!found) {
            found = family(fid, []);
            families.push(found);
          }
          found.variants.push({
            id: vid,
            name: 'SourceViewport=' + props.SourceViewport + ', Locale=English',
            properties: props,
            tree: control,
          });
          form.children.push({
            id: kind,
            type: 'INSTANCE',
            family: fid,
            variant: props,
            expose: true,
            layout: dim(kind, R(index)),
            absolute: abs(kind, R(index), R(i)),
          });
          skip.add(index);
        }
        const fid = 'error-page-search-form',
          vid = fid + '.' + props.SourceViewport;
        let found = families.find(f => f.id === fid);
        if (!found) {
          found = family(
            fid,
            [],
            ['error-page-search-input', 'error-page-search-action']
          );
          families.push(found);
        }
        found.variants.push({
          id: vid,
          name: 'SourceViewport=' + props.SourceViewport + ', Locale=English',
          properties: props,
          tree: form,
        });
        parent.children.push({
          id: 'search',
          type: 'INSTANCE',
          family: fid,
          variant: props,
          expose: true,
          layout: dim('search', R(i)),
          absolute: abs('search', R(i), parentRect),
        });
        continue;
      }
      if (['H1', 'H2', 'P', 'CODE', 'SMALL'].includes(n.tag)) {
        const text = txt(i, parentRect);
        if ((n.tag === 'P' && n.classes === 'mg-code') || n.tag === 'CODE') {
          let box = frame(
            n.tag === 'CODE' ? 'captcha-sample' : 'details',
            R(i),
            parentRect
          );
          surface(box, i);
          let inner = m => {
            let r = at(m, i).rect,
              c = at(m, i).style;
            return {
              x: r.x + parseFloat(c.paddingLeft),
              y: r.y + parseFloat(c.paddingTop),
              width:
                r.width -
                parseFloat(c.paddingLeft) -
                parseFloat(c.paddingRight),
              height:
                r.height -
                parseFloat(c.paddingTop) -
                parseFloat(c.paddingBottom),
            };
          };
          box.children.push(txt(i, R(i), inner));
          parent.children.push(box);
        } else parent.children.push(text);
        for (const e of sample.tree) if (e.parentIndex === i) skip.add(e.index);
        continue;
      }
      if (n.tag === 'HR') {
        let hr = frame('divider', R(i), parentRect);
        hr.fill = paint(
          key + '/divider/ink',
          m => at(m, i).style.borderTopColor
        );
        parent.children.push(hr);
        continue;
      }
      if (n.classes === 'undrr-logo') {
        let box = frame('logo-' + i, R(i), parentRect),
          ratio = 424.6 / 63.8,
          svgRect = m => {
            let r = at(m, i).rect,
              h = Math.min(r.height, r.width / ratio),
              w = h * ratio;
            return {
              x:
                r.x +
                (at(m, i).style.backgroundPosition === '50% 50%'
                  ? (r.width - w) / 2
                  : 0),
              y:
                r.y +
                (at(m, i).style.backgroundPosition === '50% 50%'
                  ? (r.height - h) / 2
                  : 0),
              width: w,
              height: h,
            };
          },
          r = svgRect(modes[0]);
        box.children.push({
          id: 'viewport',
          type: 'FRAME',
          fill: null,
          layout: {
            mode: 'VERTICAL',
            ...dim('logo-' + i + '/viewport', svgRect),
          },
          absolute: abs('logo-' + i + '/viewport', svgRect, R(i)),
          children: [
            {
              id: 'ink',
              type: 'SVG',
              svg: {
                assetId: 'error-page.undrr-logo-blue',
                markup: logoMarkup,
                monochrome: {
                  fills: paint(key + '/logo-blue', () => 'rgb(0, 79, 145)'),
                },
              },
              layout: { width: r.width, height: r.height },
            },
          ],
        });
        parent.children.push(box);
        continue;
      }
      if (n.tag === 'DIV') {
        let box = frame('box-' + i, R(i), parentRect);
        surface(box, i);
        if (n.style.borderTopStyle === 'dashed') {
          let r = n.rect,
            markup =
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
              r.width +
              ' ' +
              r.height +
              '"><path d="M8 1H' +
              (r.width - 8) +
              'A7 7 0 0 1 ' +
              (r.width - 1) +
              ' 8V' +
              (r.height - 8) +
              'A7 7 0 0 1 ' +
              (r.width - 8) +
              ' ' +
              (r.height - 1) +
              'H8A7 7 0 0 1 1 ' +
              (r.height - 8) +
              'V8A7 7 0 0 1 8 1Z" fill="none" stroke="#000000" stroke-width="2" stroke-dasharray="6 6"/></svg>';
          box.children.push({
            id: 'dashed-border',
            type: 'SVG',
            svg: {
              assetId: 'error-page.' + key + '.challenge-border-candidate',
              markup,
              monochrome: {
                strokes: paint(
                  key + '/challenge-border',
                  m => at(m, i).style.borderTopColor
                ),
              },
            },
            layout: { width: r.width, height: r.height },
          });
        }
        parent.children.push(box);
        nodes.set(i, box);
      }
    }
    let found = families.find(f => f.id === 'error-page');
    if (!found) {
      found = family('error-page', [], ['error-page-search-form']);
      families.push(found);
    }
    found.variants.push({
      id: 'error-page.' + key,
      name:
        'Story=' +
        key.replace(/-(390|1164)$/, '') +
        ', SourceViewport=' +
        key.match(/(390|1164)$/)[0] +
        ', Locale=English',
      properties: {
        Story: key.replace(/-(390|1164)$/, ''),
        SourceViewport: key.match(/(390|1164)$/)[0],
        Locale: 'English',
      },
      sourceContract: {
        viewportHeight: 1000,
        sourceHref: sample.tree
          .filter(n => n.href)
          .map(n => ({ index: n.index, href: n.href })),
        challenge: nIsChallenge(sample),
        monoAdvanceCandidateOnly: true,
      },
      tree: rootFrame,
    });
  }
  for (const family of families)
    for (const v of family.variants) {
      const wrap = n => {
        if (n.children)
          n.children = n.children.map(c => {
            wrap(c);
            if (c.type !== 'INSTANCE' || !c.absolute) return c;
            let a = c.absolute;
            delete c.absolute;
            return {
              id: c.id + '-slot',
              type: 'FRAME',
              fill: null,
              layout: { mode: 'VERTICAL', ...c.layout },
              absolute: a,
              children: [c],
            };
          });
      };
      wrap(v.tree);
    }
  target.variables.splice(0, target.variables.length, ...variables);
  for (const kind of ['text', 'effect'])
    target.styles[kind].splice(0, target.styles[kind].length, ...styles[kind]);
  return families;
}
function nothingPlaceholder(n) {
  if (n.placeholder !== 'Search')
    throw Error('ErrorPage source changed: placeholder');
  return n.placeholder;
}
function nIsChallenge(sample) {
  return sample.tree[0].classes.includes('--challenge');
}
module.exports = { buildErrorPageRecipes };
