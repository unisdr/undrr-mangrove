'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const ASSET = 'examples/figma-plugin/holistic/assets/code-block/';
const PROVENANCE =
  '369eb6ac55fb2dcadb25dcbde4daadfb7f735b8627c955b24c0e7f9861180f67';
function buildCodeBlockRecipes({ root, modes, variables, styles }) {
  const target = { variables, styles };
  variables = structuredClone(variables);
  styles = structuredClone(styles);
  const fail = s => {
      throw Error('CodeBlock source changed: ' + s);
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
    const name = 'component/code-block/' + slug,
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
  const source = JSON.parse(read(ASSET + 'source-footprints.json')).cases,
    variants = [];
  if (Object.keys(source).length !== 80) fail('80 actual source captures');
  const contexts = Object.keys(source)
    .filter(k => k.startsWith('undrr-'))
    .map(k => k.slice(6));
  const mono = role('mono-candidate-font-family', 'STRING', () => 'Menlo');
  const number = (key, fn) => role(key, 'FLOAT', fn),
    paint = (key, fn) => {
      const values = per(m => cssColor(fn(m)));
      const alias = [
        'color/neutral-0',
        'color/neutral-100',
        'color/neutral-300',
        'color/blue-100',
        'color/blue-200',
        'color/blue-300',
        'color/orange-400',
      ].find(
        name =>
          variables.some(v => v.name === name) &&
          modes.every(m => {
            const actual = values[m.id],
              expected = resolve(name, m, 'COLOR');
            return sameRGB(actual, expected) && actual.a === expected.a;
          })
      );
      return role(key, 'COLOR', m => (alias ? { alias } : values[m.id]));
    };
  for (const key of contexts) {
    const get = m => source[m.id + '-' + key],
      sample = get(modes[0]),
      story = key.replace(/-(390|1164)(-scroll-end)?$/, ''),
      view = key.endsWith('-scroll-end') ? 'HorizontalEnd' : 'Initial';
    for (const m of modes) {
      const s = get(m);
      if (
        !s ||
        s.characters !== sample.characters ||
        s.lineNumbers.length !== sample.lineNumbers.length
      )
        fail('source anatomy/copy');
      if (
        !s.controlAlias ||
        s.code.style.fontFamily !==
          'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace' ||
        s.code.style.fontVariantLigatures !== 'none' ||
        s.code.style.whiteSpace !== 'pre' ||
        s.code.style.fontWeight !== '500'
      )
        fail('source code font/whitespace');
      if (s.fontProbe.some(p => p.sourceStack !== p.Menlo))
        fail('finite Menlo advance candidate');
      if (s.scroll.top !== 0 || s.pre.style.overflowX !== 'auto')
        fail('source overflow');
      if (
        view === 'HorizontalEnd' &&
        (s.scroll.left <= 0 ||
          s.scroll.left !== s.scroll.width - s.scroll.clientWidth)
      )
        fail('source scroll end');
    }
    const dimensions = (slug, rect) => ({
        width: number(key + '/' + slug + '/width', m => rect(m).width),
        height: number(key + '/' + slug + '/height', m => rect(m).height),
      }),
      absolute = (slug, rect, parent) => ({
        horizontal: 'START',
        vertical: 'START',
        offsetX: number(key + '/' + slug + '/x', m => rect(m).x - parent(m).x),
        offsetY: number(key + '/' + slug + '/y', m => rect(m).y - parent(m).y),
      });
    const frame = (id, rect, parent, clips = false) => ({
      id,
      type: 'FRAME',
      fill: null,
      layout: {
        mode: 'VERTICAL',
        ...dimensions(id, rect),
        clipsContent: clips,
      },
      ...(parent ? { absolute: absolute(id, rect, parent) } : {}),
      children: [],
    });
    const typography = (slug, fn, isMono = false) => {
      const id = 'component.code-block.' + key + '.' + slug,
        all = per(m => fn(m)),
        fontFamily = isMono ? mono : 'font-family/text';
      for (const m of modes) {
        const c = all[m.id];
        if (
          c.fontStyle !== 'normal' ||
          !['400', '500', '600'].includes(c.fontWeight) ||
          !['none', 'uppercase'].includes(c.textTransform) ||
          c.opacity !== '1'
        )
          fail('source font profile');
        if (
          !isMono &&
          !c.fontFamily.includes(resolve('font-family/text', m, 'STRING'))
        )
          fail('source text font role');
      }
      const size = number(key + '/' + slug + '/font-size', m =>
        parseFloat(all[m.id].fontSize)
      );
      upsert(styles.text, {
        id,
        name: 'Mangrove/Source CodeBlock/' + key + '/' + slug,
        bindings: { fontFamily, fontSize: size },
        values: per(m => ({
          fontName: {
            family: resolve(fontFamily, m, 'STRING'),
            style: all[m.id].fontWeight === '600' ? 'Bold' : 'Regular',
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
          textCase:
            all[m.id].textTransform === 'uppercase' ? 'UPPER' : 'ORIGINAL',
        })),
      });
      return id;
    };
    const rootFrame = frame(
        'root',
        m => get(m).root.rect,
        null,
        Boolean(sample.caption)
      ),
      preFrame = frame(
        'pre-viewport',
        m => get(m).pre.rect,
        m => get(m).root.rect,
        true
      ),
      codeFrame = frame(
        'code-surface',
        m => get(m).code.rect,
        m => get(m).pre.rect,
        false
      );
    rootFrame.children.push(preFrame);
    preFrame.children.push(codeFrame);
    codeFrame.fill = 'color/neutral-800';
    const radius = number(key + '/code-radius', m =>
      parseFloat(get(m).code.style.borderRadius)
    );
    codeFrame.bindings = { cornerRadius: radius };
    for (const m of modes) {
      if (
        !sameRGB(
          cssColor(get(m).code.style.backgroundColor),
          resolve('color/neutral-800', m, 'COLOR')
        )
      )
        fail('source code surface');
      const match = /^(rgba?\([^)]+\)) 0px 0px 0px 1px inset$/.exec(
        get(m).code.style.boxShadow
      );
      if (
        !match ||
        Math.abs(cssColor(match[1]).a - 0.2) > 1e-9 ||
        !sameRGB(cssColor(match[1]), resolve('color/interactive', m, 'COLOR'))
      )
        fail('source code inset effect');
    }
    const shadowColor = role(key + '/code-shadow-color', 'COLOR', m => ({
        ...resolve('color/interactive', m, 'COLOR'),
        a: 0.2,
      })),
      shadowId = 'component.code-block.' + key + '.code-shadow';
    upsert(styles.effect, {
      id: shadowId,
      name: 'Mangrove/Source CodeBlock/' + key + '/inset',
      values: per(m => [
        {
          effect: {
            type: 'INNER_SHADOW',
            color: { ...resolve('color/interactive', m, 'COLOR'), a: 0.2 },
            offset: { x: 0, y: 0 },
            radius: 0,
            spread: 1,
            visible: true,
            blendMode: 'NORMAL',
          },
          bindings: { color: shadowColor },
        },
      ]),
    });
    codeFrame.effectStyle = shadowId;
    const textRects = m =>
        get(m)
          .textNodes.flatMap(n => n.range)
          .filter(r => r.height > 0),
      bodyRect = m => {
        const s = get(m),
          r = textRects(m),
          x = Math.min(...r.map(r => r.x));
        return {
          x,
          y: s.code.rect.y + parseFloat(s.code.style.paddingTop),
          width: Math.max(...r.map(r => r.right)) - x,
          height:
            s.code.rect.height -
            parseFloat(s.code.style.paddingTop) -
            parseFloat(s.code.style.paddingBottom),
        };
      };
    const body = {
      id: 'code',
      type: 'TEXT',
      characters: sample.characters,
      layout: dimensions('code', bodyRect),
      absolute: absolute('code', bodyRect, m => get(m).code.rect),
    };
    if (sample.textNodes.length === 1) {
      body.textStyle = typography('plain-code', m => get(m).code.style, true);
      body.fill = 'color/neutral-0';
      body.textProperty = 'CodeBlock/' + key + '/Code';
    } else {
      for (const m of modes) {
        const s = get(m);
        if (
          s.textNodes.length !== sample.textNodes.length ||
          s.textNodes.map(n => n.text).join('') !== s.characters
        )
          fail('Prism source ordering');
      }
      body.textRuns = sample.textNodes.map((n, i) => {
        for (const m of modes) {
          const e = get(m).textNodes[i];
          if (e.start !== n.start || e.end !== n.end || e.text !== n.text)
            fail('source token boundaries');
        }
        return {
          id: 'token' + i,
          start: n.start,
          end: n.end,
          textStyle: typography(
            'token' + i,
            m => get(m).textNodes[i].parent.style,
            true
          ),
          fill: paint(
            key + '/token' + i + '/ink',
            m => get(m).textNodes[i].parent.style.color
          ),
          textDecoration: 'NONE',
        };
      });
    }
    codeFrame.children.push(body);
    if (sample.lineNumbers.length) {
      const gutterRect = m => {
        const numbers = get(m).lineNumbers,
          first = numbers[0].rect,
          last = numbers.at(-1).rect;
        return {
          x: first.x,
          y: first.y,
          width: first.width - parseFloat(numbers[0].style.paddingRight),
          height: last.bottom - first.y,
        };
      };
      codeFrame.children.push({
        id: 'line-numbers',
        type: 'TEXT',
        characters: sample.lineNumbers.map(n => n.text).join('\n'),
        textStyle: typography(
          'line-numbers',
          m => get(m).lineNumbers[0].style,
          true
        ),
        fill: 'color/neutral-300',
        textAlign: 'RIGHT',
        layout: dimensions('line-numbers', gutterRect),
        absolute: absolute('line-numbers', gutterRect, m => get(m).code.rect),
      });
    }
    if (sample.badge) {
      if (modes.some(m => !get(m).badge?.sourceRestored))
        fail('badge restored mirror');
      const badge = {
        id: 'language-badge',
        type: 'TEXT',
        characters: sample.badge.text,
        textStyle: typography('badge', m => get(m).badge.style),
        fill: 'color/neutral-300',
        layout: dimensions('badge', m => get(m).badge.rect),
        absolute: absolute(
          'badge',
          m => get(m).badge.rect,
          m => get(m).pre.rect
        ),
      };
      preFrame.children.push(badge);
    }
    if (sample.caption) {
      const cap = frame(
        'filename-header',
        m => get(m).caption.rect,
        m => get(m).root.rect
      );
      cap.fill = 'color/neutral-700';
      const captionRect = m => {
        const c = get(m).caption;
        return {
          x: c.rect.x + parseFloat(c.style.paddingLeft),
          y: c.rect.y + parseFloat(c.style.paddingTop),
          width:
            c.rect.width -
            parseFloat(c.style.paddingLeft) -
            parseFloat(c.style.paddingRight),
          height:
            c.rect.height -
            parseFloat(c.style.paddingTop) -
            parseFloat(c.style.paddingBottom),
        };
      };
      cap.children.push({
        id: 'filename',
        type: 'TEXT',
        characters: sample.caption.text,
        textProperty: 'CodeBlock/' + key + '/Filename',
        textStyle: typography('filename', m => get(m).caption.style),
        fill: 'color/neutral-200',
        layout: dimensions('filename', captionRect),
        absolute: absolute('filename', captionRect, m => get(m).caption.rect),
      });
      rootFrame.children.push(cap);
      rootFrame.bindings = {
        cornerRadius: number(key + '/figure-radius', m =>
          parseFloat(get(m).root.style.borderRadius)
        ),
      };
      if (sample.badge) fail('filename suppresses badge');
    }
    variants.push({
      id: 'code-block.' + key,
      name:
        'Story=' +
        story +
        ', SourceViewport=' +
        sample.viewport.width +
        ', View=' +
        view,
      properties: {
        Story: story,
        SourceViewport: String(sample.viewport.width),
        View: view,
        Locale: 'English',
      },
      sourceCode: {
        characters: sample.characters,
        language: sample.code.className || null,
        lineNumbers: sample.lineNumbers.map(n => n.text),
        scroll: per(m => get(m).scroll),
        fontCandidate: 'Menlo',
        nativeFontAvailable: false,
      },
      tree: rootFrame,
    });
  }
  target.variables.splice(0, target.variables.length, ...variables);
  for (const kind of ['text', 'effect'])
    target.styles[kind].splice(0, target.styles[kind].length, ...styles[kind]);
  return [
    {
      id: 'code-block',
      name: 'Mangrove/Source CodeBlock',
      kind: 'component-set',
      review: { preserveVariantSizing: true, genericLabels: false },
      sourceRef: {
        file: 'stories/Components/CodeBlock/CodeBlock.jsx',
        line: 23,
      },
      limitations: [
        'Finite six authored stories and actual narrow scroll-end states. No invented Copy control or generic editor.',
        'System-stack Menlo advance candidate only; actual native Menlo absent, glyph/ligature/font-byte and source/native raster gates open. No font substitute.',
        'Prism rich runs retain supported edits and formatting, without runtime retokenization, arbitrary wrapping, gutter renumbering or scroll interaction claims.',
        'Filename/badge/body/effect and code-background scroll geometry preserve actual source allocations; CSS fractional line-height/native baseline, RTL and parent background remain unverified.',
      ],
      variants,
    },
  ];
}
module.exports = { buildCodeBlockRecipes };
