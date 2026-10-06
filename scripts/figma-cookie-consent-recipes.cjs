'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const ASSET = 'examples/figma-plugin/holistic/assets/cookie-consent/';
const PROVENANCE =
  '9ece4841bf38029cb50d708994e4857947ce03cd1c59b1e47074b1ce5ddfe5e5';
function buildCookieConsentRecipes({ root, modes, variables, styles }) {
  const target = { variables, styles };
  variables = structuredClone(variables);
  styles = structuredClone(styles);
  const fail = s => {
      throw Error('CookieConsent source changed: ' + s);
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
    const name = 'component/cookie-consent/' + slug,
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
  const archive = JSON.parse(read(ASSET + 'source-footprints.json'));
  function restore(x) {
    if (Array.isArray(x)) return x.map(restore);
    if (x && typeof x === 'object') {
      if (Object.keys(x).join(',') === '$sourceStyle') {
        if (
          !Number.isInteger(x.$sourceStyle) ||
          !archive.styles[x.$sourceStyle]
        )
          fail('source CSS reference');
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
  if (Object.keys(source.cases).length !== 110 || source.errors.length !== 10)
    fail('110 source cases and ten custom preferences failures');
  const contexts = Object.keys(source.cases)
    .filter(k => k.startsWith('undrr-'))
    .map(k => k.slice(6));
  const number = (key, fn) => role(key, 'FLOAT', fn);
  // Captured paint is a source snapshot role. Equal RGBA is not proof of
  // authored CSS inheritance, so never select a global token by its value.
  // A future explicit vendor/local-bridge cascade mapping is a separate gate.
  const paint = (key, fn) => role(key, 'COLOR', m => cssColor(fn(m)));
  const variants = { consent: [], preferences: [] };
  for (const key of contexts) {
    const get = m => source.cases[m.id + '-' + key],
      sample = get(modes[0]),
      at = (m, i) => get(m).tree[i],
      R = i => m => at(m, i).rect;
    for (const m of modes) {
      const c = get(m);
      if (
        !c ||
        c.tree.length !== sample.tree.length ||
        !c.libraryLoaded ||
        !c.configScriptLoaded
      )
        fail('source live vendor structure');
      if (
        c.configuration !== 'cdn' &&
        JSON.stringify(c.visualProxyOverride) !==
          JSON.stringify({ hideFromBots: false })
      )
        fail('sole visual proxy override');
      for (let i = 0; i < c.tree.length; i++) {
        const n = c.tree[i];
        if (
          n.index !== i ||
          n.parentIndex !== sample.tree[i].parentIndex ||
          n.tag !== sample.tree[i].tag ||
          n.classes !== sample.tree[i].classes ||
          n.text !== sample.tree[i].text ||
          ['x', 'y', 'width', 'height'].some(k => !Number.isFinite(n.rect[k]))
        )
          fail('source identity/content/geometry');
        if (n.style.boxShadow.includes('inset'))
          fail('unreviewed inset source owner');
      }
      for (const p of c.paragraphs)
        if (
          p.text !== p.atoms.map(a => a.text).join('') ||
          p.atoms.some(
            (a, i) =>
              a.start !== (i ? p.atoms[i - 1].end : 0) ||
              a.end - a.start !== a.text.length
          )
        )
          fail('logical source text');
    }
    const isConsent = sample.state === 'consent',
      familyId = isConsent
        ? 'cookie-consent-banner'
        : 'cookie-consent-preferences';
    const rootIndex = isConsent
      ? sample.tree.find(n => n.classes.split(' ').includes('cm')).index
      : -1;
    const rootRect = isConsent
      ? R(rootIndex)
      : m => ({
          x: 0,
          y: 0,
          width: get(m).viewport.width,
          height: get(m).viewport.height,
        });
    // These are finite captured owner constraints, not editable design-token roles.
    // Literal allocation requires exact all-five equality; varying mode dimensions retain roles.
    const allocation = (slug, rect, field) => {
      const all = per(m => rect(m)[field]),
        first = all[modes[0].id];
      return modes.every(m => all[m.id] === first)
        ? first
        : number(key + '/' + slug + '/' + field, m => all[m.id]);
    };
    const dim = (slug, rect) => ({
      width: allocation(slug, rect, 'width'),
      height: allocation(slug, rect, 'height'),
    });
    const absolute = (slug, rect, parent) => ({
      horizontal: 'START',
      vertical: 'START',
      offsetX: number(key + '/' + slug + '/x', m => rect(m).x - parent(m).x),
      offsetY: number(key + '/' + slug + '/y', m => rect(m).y - parent(m).y),
    });
    const frame = (id, rect, parent) => ({
      id,
      type: 'FRAME',
      fill: null,
      layout: { mode: 'VERTICAL', ...dim(id, rect) },
      ...(parent ? { absolute: absolute(id, rect, parent) } : {}),
      children: [],
    });
    const style = (slug, fn) => {
      const id = 'component.cookie-consent.' + key + '.' + slug,
        all = per(fn),
        size = number(key + '/' + slug + '/font-size', m =>
          parseFloat(all[m.id].fontSize)
        );
      for (const m of modes) {
        const c = all[m.id];
        if (
          c.fontFamily !== 'Roboto, sans-serif' ||
          !['400', '600'].includes(c.fontWeight) ||
          c.fontStyle !== 'normal' ||
          (c.lineHeight !== 'normal' &&
            !Number.isFinite(parseFloat(c.lineHeight)))
        )
          fail('source Roboto font contract');
      }
      upsert(styles.text, {
        id,
        name: 'Mangrove/Source CookieConsent/' + key + '/' + slug,
        bindings: { fontFamily: 'font-family/text', fontSize: size },
        values: per(m => ({
          fontName: {
            family: resolve('font-family/text', m, 'STRING'),
            style: all[m.id].fontWeight === '600' ? 'Bold' : 'Regular',
          },
          fontSize: parseFloat(all[m.id].fontSize),
          lineHeight:
            all[m.id].lineHeight === 'normal'
              ? { unit: 'AUTO' }
              : { unit: 'PIXELS', value: parseFloat(all[m.id].lineHeight) },
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
    const surface = (node, i) => {
      const css = m => at(m, i).style;
      // Actual zero-ink source backgrounds use the existing explicit no-fill contract.
      // Authored/theme paints continue through independently named live roles.
      node.fill = modes.every(
        m => css(m).backgroundColor === 'rgba(0, 0, 0, 0)'
      )
        ? null
        : paint(key + '/' + node.id + '/surface', m => css(m).backgroundColor);
      node.bindings = {
        opacity: number(
          key + '/' + node.id + '/opacity',
          m => +css(m).opacity * 100
        ),
      };
      const corners = [
        ['topLeftRadius', 'TopLeft'],
        ['topRightRadius', 'TopRight'],
        ['bottomLeftRadius', 'BottomLeft'],
        ['bottomRightRadius', 'BottomRight'],
      ];
      const uniformShorthand = modes.every(
        m =>
          /^[\d.]+px$/.test(css(m).borderRadius) &&
          corners.every(
            ([, edge]) =>
              css(m)['border' + edge + 'Radius'] === css(m).borderRadius
          )
      );
      if (uniformShorthand)
        node.bindings.cornerRadius = number(
          key + '/' + node.id + '/radius',
          m => parseFloat(css(m).borderRadius)
        );
      else
        for (const [field, edge] of corners)
          node.bindings[field] = number(key + '/' + node.id + '/' + field, m =>
            parseFloat(css(m)['border' + edge + 'Radius'])
          );
      const active = ['Top', 'Right', 'Bottom', 'Left'].filter(
        e => parseFloat(css(modes[0])['border' + e + 'Width']) > 0
      );
      if (active.length) {
        const e = active[0];
        for (const m of modes)
          for (const edge of active)
            if (
              css(m)['border' + edge + 'Style'] !== 'solid' ||
              css(m)['border' + edge + 'Color'] !==
                css(m)['border' + e + 'Color']
            )
              fail('uniform visible source solid-border paint');
        node.stroke = paint(
          key + '/' + node.id + '/border',
          m => css(m)['border' + e + 'Color']
        );
        node.strokeAlign = 'INSIDE';
        for (const [field, edge] of [
          ['strokeTopWeight', 'Top'],
          ['strokeRightWeight', 'Right'],
          ['strokeBottomWeight', 'Bottom'],
          ['strokeLeftWeight', 'Left'],
        ])
          node.bindings[field] = number(key + '/' + node.id + '/' + field, m =>
            parseFloat(css(m)['border' + edge + 'Width'])
          );
      }
      if (css(modes[0]).boxShadow !== 'none') {
        const id =
            'component.cookie-consent.' + key + '.' + node.id + '.effect',
          color = paint(
            key + '/' + node.id + '/shadow',
            m => /^(rgba?\([^)]+\))/.exec(css(m).boxShadow)?.[1]
          );
        upsert(styles.effect, {
          id,
          name:
            'Mangrove/Source CookieConsent/' + key + '/' + node.id + '/effect',
          values: per(m => {
            const s =
              /^(rgba?\([^)]+\)) (-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px (-?[\d.]+)px$/.exec(
                css(m).boxShadow
              );
            if (!s) fail('source outer shadow');
            return [
              {
                effect: {
                  type: 'DROP_SHADOW',
                  color: cssColor(s[1]),
                  offset: { x: +s[2], y: +s[3] },
                  radius: +s[4],
                  spread: +s[5],
                  visible: true,
                  blendMode: 'NORMAL',
                },
                bindings: { color },
              },
            ];
          }),
        });
        node.effectStyle = id;
      }
      node.layout.clipsContent =
        ['hidden', 'auto', 'scroll'].includes(css(modes[0]).overflowX) ||
        ['hidden', 'auto', 'scroll'].includes(css(modes[0]).overflowY);
    };
    if (!isConsent) {
      const fingerprint = c => {
        const root = c.tree.find(n => n.classes.split(' ').includes('cm'));
        return c.tree
          .filter(n => {
            let i = n.index;
            while (i >= 0 && i !== root.index) i = c.tree[i].parentIndex;
            return i === root.index;
          })
          .map(n =>
            Object.fromEntries(
              [
                'tag',
                'classes',
                'text',
                'rect',
                'style',
                'before',
                'after',
                'svg',
                'checked',
                'disabled',
              ].map(k => [k, n[k]])
            )
          );
      };
      for (const m of modes) {
        const reference =
          source.cases[
            m.id +
              '-' +
              sample.configuration +
              '-consent-' +
              sample.viewport.width
          ];
        if (
          !reference ||
          JSON.stringify(fingerprint(get(m))) !==
            JSON.stringify(fingerprint(reference))
        )
          fail('actual reusable consent underlay differs');
      }
    }
    const rootNode = frame('root', rootRect, null),
      nodes = new Map([[rootIndex, rootNode]]),
      skipped = new Set();
    if (isConsent) surface(rootNode, rootIndex);
    const belongs = i => {
      while (i >= 0) {
        if (i === rootIndex) return true;
        i = sample.tree[i].parentIndex;
      }
      return !isConsent;
    };
    const visible = i => {
      while (i >= 0) {
        const s = sample.tree[i].style;
        if (
          s.display === 'none' ||
          s.visibility === 'hidden' ||
          +s.opacity === 0
        )
          return false;
        i = sample.tree[i].parentIndex;
      }
      return true;
    };
    const skipDesc = (i, keep = []) => {
      for (const n of sample.tree) {
        let p = n.parentIndex;
        while (p >= 0) {
          if (p === i) {
            if (!keep.includes(n.index)) skipped.add(n.index);
            break;
          }
          p = sample.tree[p].parentIndex;
        }
      }
    };
    for (let i = 0; i < sample.tree.length; i++) {
      if (i === rootIndex || skipped.has(i) || !belongs(i) || !visible(i))
        continue;
      const n = sample.tree[i];
      if (
        n.rect.width <= 0 ||
        n.rect.height <= 0 ||
        ['path', 'INPUT'].includes(n.tag)
      )
        continue;
      let parentIndex = n.parentIndex;
      while (!nodes.has(parentIndex) && parentIndex >= 0)
        parentIndex = sample.tree[parentIndex].parentIndex;
      const parent = nodes.get(parentIndex) || rootNode,
        parentRect = parentIndex >= 0 ? R(parentIndex) : rootRect;
      if (!isConsent && n.classes.split(' ').includes('cm')) {
        const wrapper = frame('node-' + i, R(i), parentRect);
        wrapper.sourceConsentUnderlay = {
          verifiedAllModeSubtree: true,
          sourceConfiguration: sample.configuration,
        };
        wrapper.children = [
          {
            id: 'actual-consent',
            type: 'INSTANCE',
            family: 'cookie-consent-banner',
            variant: {
              Configuration: sample.configuration,
              State: 'consent',
              SourceViewport: String(sample.viewport.width),
              Locale: 'English',
            },
            expose: true,
            layout: { width: 'FILL', height: 'FILL' },
          },
        ];
        parent.children.push(wrapper);
        skipDesc(i);
        continue;
      }
      if (n.tag === 'svg') {
        let d = /<path d="([^"]+)"/.exec(n.svg)?.[1],
          stroke = +/stroke-width="([^"]+)"/.exec(n.svg)?.[1];
        if (
          !d ||
          !Number.isFinite(stroke) ||
          !n.svg.startsWith('<svg viewBox="0 0 24 24"') ||
          n.style.fill !== 'none'
        )
          fail('source SVG anatomy');
        const inverted = n.style.transform.startsWith(
          'matrix(-0.5, 0, 0, -0.5'
        );
        if (inverted)
          d = d.replace(
            /([ML])\s*(-?[\d.]+)\s+(-?[\d.]+)/g,
            (_, cmd, x, y) => cmd + ' ' + (24 - +x) + ' ' + (24 - +y)
          );
        if (
          modes.some(
            m =>
              at(m, i).svg !== n.svg ||
              at(m, i).rect.width !== n.rect.width ||
              at(m, i).rect.height !== n.rect.height ||
              at(m, i).style.transform !== n.style.transform
          )
        )
          fail('source equal SVG viewport/transform');
        // Preserve the exact measured owning slot. Axis-aligned uniform CSS
        // scale defines the authored glyph viewport independently of browser
        // clientRect float arithmetic, which can differ between width/height.
        const counterRotatedToggle =
          sample.tree[n.parentIndex].classes === 'toggle__icon-on';
        if (
          counterRotatedToggle &&
          (!read(ASSET + 'cookieconsent.css')
            .toString()
            .includes(
              '#cc-main .toggle__icon-on svg{stroke:var(--cc-toggle-on-bg);transform:scale(.55) rotate(-45deg)}'
            ) ||
            n.style.transform !==
              'matrix(0.388909, -0.388909, 0.388909, 0.388909, 0, 0)')
        )
          fail('exact vendor toggle authored uniform scale/counter rotation');
        const matrix = /^matrix\(([-\d.]+), 0, 0, ([-\d.]+), 0, 0\)$/.exec(
            n.style.transform
          ),
          cssWidth = /^([\d.]+)px$/.exec(n.style.width),
          cssHeight = /^([\d.]+)px$/.exec(n.style.height),
          authoredViewport =
            counterRotatedToggle && cssWidth && cssHeight
              ? { width: +cssWidth[1] * 0.55, height: +cssHeight[1] * 0.55 }
              : matrix &&
                  cssWidth &&
                  cssHeight &&
                  Math.abs(+matrix[1]) === Math.abs(+matrix[2])
                ? {
                    width: +cssWidth[1] * Math.abs(+matrix[1]),
                    height: +cssHeight[1] * Math.abs(+matrix[2]),
                  }
                : { width: n.rect.width, height: n.rect.height };
        if (
          !Number.isFinite(authoredViewport.width) ||
          authoredViewport.width <= 0 ||
          !Number.isFinite(authoredViewport.height) ||
          authoredViewport.height <= 0
        )
          fail('source authored SVG viewport');
        parent.children.push({
          id: 'svg-slot-' + i,
          type: 'FRAME',
          fill: null,
          layout: {
            mode: 'VERTICAL',
            width: n.rect.width,
            height: n.rect.height,
          },
          absolute: absolute('svg-' + i, R(i), parentRect),
          sourceSvg: {
            sourceMarkup: n.svg,
            measuredOwningSlot: { width: n.rect.width, height: n.rect.height },
            authoredViewport,
            rotation: inverted ? 180 : 0,
            sourceCandidate: true,
          },
          children: [
            {
              id: 'svg-' + i,
              type: 'SVG',
              svg: {
                assetId: 'cookie-consent-' + key + '-svg-' + i,
                markup:
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="' +
                  d +
                  '" fill="none" stroke="#000000" stroke-width="' +
                  stroke +
                  '" stroke-linecap="' +
                  n.style.strokeLinecap +
                  '" stroke-linejoin="' +
                  n.style.strokeLinejoin +
                  '"/></svg>',
                monochrome: {
                  strokes: paint(
                    key + '/svg-' + i + '/ink',
                    m => at(m, i).style.stroke
                  ),
                },
              },
              layout: authoredViewport,
            },
          ],
        });
        skipDesc(i);
        continue;
      }
      const node = frame('node-' + i, R(i), parentRect);
      surface(node, i);
      parent.children.push(node);
      nodes.set(i, node);
      const p = sample.paragraphs.find(p => p.index === i),
        badge = sample.tree.find(
          c => c.parentIndex === i && c.classes === 'pm__badge'
        );
      const leaf =
        n.text.trim() &&
        !sample.tree.some(c => c.parentIndex === i) &&
        !['svg', 'path'].includes(n.tag);
      if (
        (p &&
          p.atoms.some(
            a =>
              a.range.length &&
              a.style.display !== 'none' &&
              a.style.visibility !== 'hidden' &&
              +a.style.opacity !== 0
          )) ||
        leaf
      ) {
        const content = m => {
          const r = at(m, i).rect,
            s = at(m, i).style;
          const left =
              parseFloat(s.paddingLeft) + parseFloat(s.borderLeftWidth),
            right = parseFloat(s.paddingRight) + parseFloat(s.borderRightWidth),
            top = parseFloat(s.paddingTop) + parseFloat(s.borderTopWidth),
            bottom =
              parseFloat(s.paddingBottom) + parseFloat(s.borderBottomWidth);
          return {
            x: r.x + left,
            y: r.y + top,
            width: r.width - left - right,
            height: r.height - top - bottom,
          };
        };
        if (modes.some(m => content(m).width <= 0 || content(m).height <= 0))
          fail('positive source text capacity');
        const t = {
          id: 'text-' + i,
          type: 'TEXT',
          characters: n.text,
          layout: dim('text-' + i, content),
          absolute: absolute('text-' + i, content, R(i)),
          textAlign:
            n.style.textAlign === 'center'
              ? 'CENTER'
              : n.style.textAlign === 'right'
                ? 'RIGHT'
                : 'LEFT',
        };
        const atoms = p
            ? p.atoms
                .map((a, index) => ({ ...a, sourceAtom: index }))
                .filter(
                  a => a.range.length && (!badge || a.text !== badge.text)
                )
            : [
                {
                  start: 0,
                  end: n.text.length,
                  text: n.text,
                  style: n.style,
                  href: n.href,
                },
              ],
          groups = [];
        let offset = 0;
        for (const a of atoms) {
          a.start = offset;
          offset += a.text.length;
          a.end = offset;
        }
        t.characters = atoms.map(a => a.text).join('');
        node.sourceTextContract = {
          sourceHref: n.href,
          capacity:
            'Captured owning content box; edited wrapping/baseline remains open',
          ...(t.characters !== n.text ? { sourceHiddenText: n.text } : {}),
        };
        for (let j = 0; j < atoms.length; j++) {
          const a = atoms[j],
            signature = JSON.stringify([
              a.style.fontFamily,
              a.style.fontSize,
              a.style.fontStyle,
              a.style.lineHeight,
              a.style.letterSpacing,
              a.style.fontWeight,
              a.style.color,
              a.style.textDecorationLine,
              a.style.textUnderlineOffset,
              a.href,
            ]);
          const last = groups.at(-1);
          if (last?.signature === signature) last.end = a.end;
          else groups.push({ start: a.start, end: a.end, atom: j, signature });
        }
        if (
          groups.length > 1 ||
          atoms.some(a => a.href?.startsWith('https://'))
        ) {
          t.textRuns = groups.map((g, j) => {
            const ss = m =>
                get(m).paragraphs.find(p => p.index === i).atoms[
                  atoms[g.atom].sourceAtom
                ].style,
              a = atoms[g.atom];
            if (
              modes.some(
                m => !['none', 'underline'].includes(ss(m).textDecorationLine)
              )
            )
              fail('source link decoration');
            const run = {
              id: 'run-' + j,
              start: g.start,
              end: g.end,
              textStyle: style('text-' + i + '-run-' + j, ss),
              fill: paint(
                key + '/text-' + i + '-run-' + j + '/ink',
                m => ss(m).color
              ),
              textDecoration:
                a.style.textDecorationLine === 'underline'
                  ? 'UNDERLINE'
                  : 'NONE',
            };
            if (run.textDecoration === 'UNDERLINE') {
              const value = parseFloat(a.style.textUnderlineOffset);
              if (
                !Number.isFinite(value) ||
                modes.some(m => parseFloat(ss(m).textUnderlineOffset) !== value)
              )
                fail('source exact underline offset');
              run.textDecorationOffset = { unit: 'PIXELS', value };
            }
            if (a.href?.startsWith('https://'))
              run.hyperlink = { type: 'URL', value: a.href };
            return run;
          });
        } else {
          t.textStyle = style('text-' + i, m => at(m, i).style);
          t.fill = paint(
            key + '/text-' + i + '/ink',
            m => at(m, i).style.color
          );
          t.textProperty = 'CookieConsent/' + key + '/Text' + i;
        }
        node.children.push(t);
        skipDesc(i, badge ? [badge.index] : []);
      }
    }
    variants[isConsent ? 'consent' : 'preferences'].push({
      id: familyId + '.' + key,
      name:
        'Configuration=' +
        sample.configuration +
        ', State=' +
        sample.state +
        ', SourceViewport=' +
        sample.viewport.width,
      properties: {
        Configuration: sample.configuration,
        State: sample.state,
        SourceViewport: String(sample.viewport.width),
        Locale: 'English',
      },
      tree: rootNode,
      sourceContract: {
        timestamps: per(m => get(m).timestamp),
        sourceConfig: sample.sourceConfig,
        visualProxyOverride: sample.visualProxyOverride,
        viewport: sample.viewport,
        sourceOwningRoot: isConsent
          ? '.cm'
          : 'explicit captured viewport containing actual overlay/dialog, not zero-sized pm-wrapper',
        runtimeBehaviorAccepted: false,
      },
    });
  }
  const families = Object.entries(variants).map(([kind, list]) => ({
    id:
      kind === 'consent'
        ? 'cookie-consent-banner'
        : 'cookie-consent-preferences',
    name: 'Mangrove/Source CookieConsent ' + kind,
    kind: 'component-set',
    ...(kind === 'preferences'
      ? { dependencies: ['cookie-consent-banner'] }
      : {}),
    review: { preserveVariantSizing: true, genericLabels: false },
    sourceRef: {
      file: 'stories/Components/CookieConsentBanner/CookieConsentBanner.jsx',
      line: 1,
    },
    variants: list,
    limitations: [
      'Actual initialized CDN RenderingCheck and sole hideFromBots:false local/custom config visual proxies, not authored production initialization under automation.',
      'Finite source-owned geometry at390/1164×1000, not responsive scrolling or consent runtime.',
      'Whole logical text with source initial nonunderlined links; source custom preferences fails in all ten contexts and is not projected.',
      'Roboto600 projects to named Bold700 provisionally; native fonts, SVG transforms/strokes, shadows/clipping, pixels, edited reflow, publication and human handoff remain open.',
    ],
  }));
  // Reuse only exact all-mode visible source subtrees. Preserve separate profiles
  // when transformed browser bounding boxes differ, rather than rounding them.
  const toggleVariants = [],
    toggleBySignature = new Map(),
    toggleProof = [];
  const renderingFields = [
    'display',
    'visibility',
    'opacity',
    'backgroundColor',
    'boxShadow',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderTopStyle',
    'borderRightStyle',
    'borderBottomStyle',
    'borderLeftStyle',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'borderTopLeftRadius',
    'borderTopRightRadius',
    'borderBottomLeftRadius',
    'borderBottomRightRadius',
    'overflowX',
    'overflowY',
    'fill',
    'stroke',
    'strokeWidth',
    'strokeLinecap',
    'strokeLinejoin',
    'transform',
  ];
  const expressionByAppearance = new Map();
  function renderedToggle(c, index, geometry) {
    const root = c.tree[index];
    return c.tree
      .filter(n => {
        let i = n.index;
        while (i >= 0 && i !== index) i = c.tree[i].parentIndex;
        if (i !== index || n.tag === 'INPUT') return false;
        i = n.index;
        while (i >= index) {
          const css = c.tree[i].style;
          if (
            css.display === 'none' ||
            css.visibility === 'hidden' ||
            +css.opacity === 0
          )
            return false;
          i = c.tree[i].parentIndex;
        }
        return true;
      })
      .map(n => [
        n.tag,
        n.classes,
        Object.fromEntries(renderingFields.map(k => [k, n.style[k]])),
        n.svg,
        ...(geometry
          ? [
              {
                x: n.rect.x - root.rect.x,
                y: n.rect.y - root.rect.y,
                width: n.rect.width,
                height: n.rect.height,
              },
            ]
          : []),
      ]);
  }
  for (const variant of families.find(
    f => f.id === 'cookie-consent-preferences'
  ).variants) {
    const context = variant.id.slice('cookie-consent-preferences.'.length),
      base = source.cases['undrr-' + context];
    for (const label of base.tree.filter(
      n => n.tag === 'LABEL' && n.classes === 'section__toggle-wrapper'
    )) {
      const input = base.tree.find(
        n => n.parentIndex === label.index && n.tag === 'INPUT'
      );
      if (!input || input.type !== 'checkbox')
        fail('actual vendor checkbox source');
      const appearance = input.disabled
        ? 'ReadonlyChecked'
        : input.checked
          ? 'PendingChecked'
          : 'Unchecked';
      if (input.disabled && !input.checked)
        fail('uncaptured readonly source appearance');
      const expressions = per(m =>
          renderedToggle(source.cases[m.id + '-' + context], label.index, false)
        ),
        expression = JSON.stringify(expressions);
      const existingExpression = expressionByAppearance.get(appearance);
      if (existingExpression && existingExpression !== expression)
        fail('vendor toggle expression reuse mismatch');
      expressionByAppearance.set(appearance, expression);
      const signature = JSON.stringify(
        per(m =>
          renderedToggle(source.cases[m.id + '-' + context], label.index, true)
        )
      );
      let chosen = toggleBySignature.get(signature);
      function replace(tree) {
        for (let j = 0; j < (tree.children || []).length; j++) {
          const child = tree.children[j];
          if (child.id === 'node-' + label.index) {
            if (!chosen) {
              const id =
                  'cookie-consent-toggle.' +
                  appearance.toLowerCase() +
                  '-' +
                  context +
                  '-label-' +
                  label.index,
                clone = structuredClone(child);
              clone.id = 'root';
              delete clone.absolute;
              chosen = {
                id,
                name:
                  'Appearance=' +
                  appearance +
                  ', GeometryPreset=' +
                  context +
                  '-label-' +
                  label.index,
                properties: {
                  Appearance: appearance,
                  GeometryPreset: context + '-label-' + label.index,
                },
                tree: clone,
                sourceContract: {
                  sourceContext: context,
                  sourceIndex: label.index,
                  normalizedRenderedSourceEquality: true,
                  exactAllModeRenderedFingerprint: sha(signature),
                  sourceExpressionFingerprint: sha(expression),
                  runtimeCheckboxAccepted: false,
                },
              };
              toggleVariants.push(chosen);
              toggleBySignature.set(signature, chosen);
            }
            const wrapper = {
              id: child.id,
              type: 'FRAME',
              fill: null,
              layout: structuredClone(child.layout),
              absolute: structuredClone(child.absolute),
              sourceCategory: {
                text: label.text,
                checked: input.checked,
                readOnly: input.disabled,
                sourceInputType: input.type,
                runtimeAriaAccepted: false,
              },
              children: [
                {
                  id: 'actual-vendor-toggle-' + label.index,
                  type: 'INSTANCE',
                  family: 'cookie-consent-toggle',
                  variant: chosen.properties,
                  layout: { width: 'FILL', height: 'FILL' },
                  expose: true,
                },
              ],
            };
            tree.children[j] = wrapper;
            toggleProof.push({
              context,
              labelIndex: label.index,
              appearance,
              geometryPreset: chosen.id,
              exactAllModeRenderedFingerprint: sha(signature),
            });
            return true;
          }
          if (replace(child)) return true;
        }
        return false;
      }
      if (!replace(variant.tree))
        fail('actual source toggle owning node missing');
    }
  }
  if (toggleProof.length !== 40 || toggleVariants.length !== 12)
    fail('exact40 source toggle slots/twelve unrounded geometry profiles');
  families.unshift({
    id: 'cookie-consent-toggle',
    name: 'Mangrove/Source CookieConsent vendor toggle',
    kind: 'component-set',
    review: { preserveVariantSizing: true, genericLabels: false },
    sourceRef: { file: ASSET + 'cookieconsent.css', line: 1 },
    variants: toggleVariants,
    limitations: [
      'Actual vendor visual checkbox subtrees only, with readonly/unchecked/unsubmitted-pending appearances and twelve exact normalized source geometry profiles.',
      'Each instance retains owning category/hidden-label metadata. No native checkbox, ARIA, stored-consent or interaction contract is claimed.',
      'Source transformed bounding differences are preserved without rounding. Native SVG/font/shadow pixels and source reflow remain open.',
    ],
  });
  families.find(f => f.id === 'cookie-consent-preferences').dependencies = [
    'cookie-consent-banner',
    'cookie-consent-toggle',
  ];
  // Prune only unused source intermediates created by this invocation, never
  // caller entries or native variables/styles. This is not asset deletion/migration.
  const variableNames = new Map(variables.map(v => [v.name, v])),
    needed = new Set(),
    textIds = new Set(),
    effectIds = new Set();
  function dependencies(x) {
    if (typeof x === 'string' && variableNames.has(x)) {
      const v = variableNames.get(x);
      if (needed.has(v.id)) return;
      needed.add(v.id);
      for (const value of Object.values(v.values))
        if (value?.alias) dependencies(value.alias);
    } else if (Array.isArray(x)) x.forEach(dependencies);
    else if (x && typeof x === 'object') {
      if (x.textStyle) textIds.add(x.textStyle);
      if (x.effectStyle) effectIds.add(x.effectStyle);
      Object.values(x).forEach(dependencies);
    }
  }
  families.forEach(f => f.variants.forEach(v => dependencies(v.tree)));
  styles.text.filter(s => textIds.has(s.id)).forEach(dependencies);
  styles.effect.filter(s => effectIds.has(s.id)).forEach(dependencies);
  const originalVariables = new Set(target.variables.map(v => v.id)),
    originalText = new Set(target.styles.text.map(v => v.id)),
    originalEffect = new Set(target.styles.effect.map(v => v.id));
  variables = variables.filter(
    v => originalVariables.has(v.id) || needed.has(v.id)
  );
  styles.text = styles.text.filter(
    s => originalText.has(s.id) || textIds.has(s.id)
  );
  styles.effect = styles.effect.filter(
    s => originalEffect.has(s.id) || effectIds.has(s.id)
  );
  target.variables.splice(0, target.variables.length, ...variables);
  target.styles.text.splice(0, target.styles.text.length, ...styles.text);
  target.styles.effect.splice(0, target.styles.effect.length, ...styles.effect);
  return families;
}
module.exports = { buildCookieConsentRecipes };
