/** Actual authored CopyButton and citation finite source scenes. Native acceptance open. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const ASSET = 'examples/figma-plugin/holistic/assets/copy-cite/';
const PROVENANCE_HASH =
  '88452d920c15a3cacec33b3298cca6ce47692e5f5257c7d4244c7dc8a089eb6c';
function buildCopyCiteRecipes({ root, modes, variables, styles }) {
  const targets = { variables, styles };
  variables = JSON.parse(JSON.stringify(variables));
  styles = JSON.parse(JSON.stringify(styles));
  const fail = m => {
    throw Error('Figma Copy/Cite recipe needs updating: ' + m);
  };
  const read = f => fs.readFileSync(path.join(root, f));
  const sha = b => crypto.createHash('sha256').update(b).digest('hex');
  if (sha(read(ASSET + 'provenance.json')) !== PROVENANCE_HASH)
    fail('Provenance changed');
  const provenance = JSON.parse(read(ASSET + 'provenance.json'));
  for (const [f, h] of Object.entries(provenance.sourceHashes))
    if (sha(read(f)) !== h) fail(f + ' source changed');
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Expected five modes');
  const source = JSON.parse(read(ASSET + 'source-footprints.json')),
    scrims = JSON.parse(read(ASSET + 'scrim-source.json'));
  const per = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  const resolve = (name, m, type, seen = new Set()) => {
    if (seen.has(name)) fail('Alias cycle ' + name);
    seen.add(name);
    const v = variables.find(v => v.name === name);
    if (!v || v.type !== type) fail('Missing ' + type + ' ' + name);
    const x = v.values[m.id];
    return x?.alias ? resolve(x.alias, m, type, seen) : x;
  };
  const upsert = (list, e) => {
    const found = list.filter(x => x.id === e.id || x.name === e.name);
    if (
      found.length > 1 ||
      (found.length && (found[0].id !== e.id || found[0].name !== e.name))
    )
      fail('Foreign identity ' + e.id);
    if (
      found.length &&
      ((e.type && found[0].type !== e.type) ||
        (!e.type &&
          modes.some(
            m =>
              Array.isArray(found[0].values?.[m.id]) !==
              Array.isArray(e.values[m.id])
          )))
    )
      fail('Foreign identity type ' + e.id);
    if (list === styles.text || list === styles.effect) {
      const other = list === styles.text ? styles.effect : styles.text;
      if (other.some(x => x.id === e.id || x.name === e.name))
        fail('Foreign style kind ' + e.id);
    }
    if (found.length) list[list.indexOf(found[0])] = e;
    else list.push(e);
  };
  const ref = { file: 'stories/Components/CiteThis/cite-this.scss', line: 9 };
  function role(key, type, fn, scopes = []) {
    const name = 'component/copy-cite/' + key;
    upsert(variables, {
      id: name.replaceAll('/', '.'),
      name,
      type,
      values: per(fn),
      scopes,
      sourceRef: key.startsWith('copy-button/')
        ? {
            file: 'stories/Components/Buttons/CopyButton/copy-button.scss',
            line: 9,
          }
        : ref,
      hiddenFromPublishing: false,
      description:
        'Finite actual source allocation/paint. Native and arbitrary edited reflow remain open.',
      codeSyntax: {},
    });
    return name;
  }
  const number = (key, fn, scopes = ['WIDTH_HEIGHT']) =>
    role(
      key,
      'FLOAT',
      m => {
        const x = fn(m);
        if (!Number.isFinite(x)) fail('Nonfinite ' + key);
        return x;
      },
      scopes
    );
  const rgba = s => {
    const match = /^rgba?\(([^)]+)\)$/.exec(s);
    if (!match) fail('Unsupported paint ' + s);
    const a = match[1].split(',').map(Number);
    return {
      r: a[0] / 255,
      g: a[1] / 255,
      b: a[2] / 255,
      a: a.length === 4 ? a[3] : 1,
    };
  };
  const normalColors = variables
    .filter(
      v => v.type === 'COLOR' && !v.name.startsWith('component/copy-cite/')
    )
    .map(v => v.name);
  const color = (key, fn, scope = 'ALL_FILLS') => {
    const values = per(m => rgba(fn(m)));
    const alias = normalColors.find(n =>
      modes.every(m => {
        const c = resolve(n, m, 'COLOR'),
          v = values[m.id];
        return ['r', 'g', 'b'].every(
          k => Math.round(c[k] * 255) === Math.round(v[k] * 255)
        );
      })
    );
    if (!alias) fail('No exact source RGB alias ' + key);
    return role(
      key,
      'COLOR',
      m => {
        const c = resolve(alias, m, 'COLOR'),
          v = values[m.id];
        return c.a === v.a ? { alias } : { ...c, a: v.a };
      },
      [scope]
    );
  };
  function effect(key, all) {
    const parsed = per(m => {
      const value = all[m.id].boxShadow;
      if (value === 'none') return null;
      const hit =
        /^(rgba?\([^)]+\)) (-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px (-?[\d.]+)px( inset)?$/.exec(
          value
        );
      if (!hit) fail('Unsupported source shadow ' + value);
      return {
        color: hit[1],
        x: +hit[2],
        y: +hit[3],
        radius: +hit[4],
        spread: +hit[5],
        inset: !!hit[6],
      };
    });
    if (!parsed.undrr) {
      if (modes.some(m => parsed[m.id])) fail('Mode-specific shadow absence');
      return null;
    }
    const paint = color(
        key + '/shadow',
        m => parsed[m.id].color,
        'EFFECT_COLOR'
      ),
      id = 'component.copy-cite.' + key + '.shadow';
    upsert(styles.effect, {
      id,
      name: 'Mangrove/component/copy-cite/' + key + '/shadow',
      description:
        'Source CSS shadow parameters. Native raster equivalence remains open.',
      values: per(m => {
        const p = parsed[m.id];
        if (!p) fail('Mode-specific shadow absence');
        return [
          {
            effect: {
              type: p.inset ? 'INNER_SHADOW' : 'DROP_SHADOW',
              color: resolve(paint, m, 'COLOR'),
              offset: { x: p.x, y: p.y },
              radius: p.radius,
              spread: p.spread,
              visible: true,
              blendMode: 'NORMAL',
            },
            bindings: { color: paint },
          },
        ];
      }),
    });
    return id;
  }
  const codeFont = role('code-font', 'STRING', () => 'Menlo');
  for (const m of modes) {
    const capture = source.scenes.find(
      s =>
        s.mode === m.id &&
        s.case === 'cite-metadata' &&
        s.state === 'closed' &&
        s.viewport.width === 390
    );
    const todo = [capture.tree];
    let trigger;
    while (todo.length) {
      const n = todo.pop();
      if (n.class === 'mg-cite-this__trigger') {
        trigger = n;
        break;
      }
      todo.push(...n.children);
    }
    if (!trigger) fail('Missing interactive source guard');
    const observed = rgba(source.styles[trigger.css].backgroundColor),
      live = resolve('color/interactive', m, 'COLOR');
    if (
      ['r', 'g', 'b'].some(
        k => Math.round(live[k] * 255) !== Math.round(observed[k] * 255)
      ) ||
      live.a !== observed.a
    )
      fail('Source interactive paint changed');
  }

  function textStyle(key, css) {
    const family = m =>
      css[m.id].fontFamily.includes('Condensed')
        ? 'font-family/ui'
        : css[m.id].fontFamily.startsWith('ui-monospace')
          ? codeFont
          : 'font-family/text';
    const fontFamily = family(modes[0]);
    if (
      modes.some(
        m =>
          resolve(fontFamily, m, 'STRING') !==
          (fontFamily === codeFont
            ? 'Menlo'
            : fontFamily === 'font-family/ui'
              ? 'Roboto Condensed'
              : 'Roboto')
      )
    )
      fail('Source font family changed');
    if (modes.some(m => family(m) !== fontFamily))
      fail('Mode-specific font routing');
    const size = number(key + '/size', m => parseFloat(css[m.id].fontSize), [
        'FONT_SIZE',
      ]),
      id = 'component.copy-cite.' + key + '.type';
    upsert(styles.text, {
      id,
      name: 'Mangrove/component/copy-cite/' + key + '/type',
      source: key.startsWith('copy-button/')
        ? {
            file: 'stories/Components/Buttons/CopyButton/copy-button.scss',
            line: 9,
          }
        : ref,
      component: true,
      recommended: false,
      description:
        'Exact captured CSS size/line height. Bundled Regular/Bold face routing follows source font imports; system code face is measured Menlo candidate, unavailable in current cloud inventory. Native font/pixel matching remains open.',
      bindings: { fontFamily, fontSize: size },
      values: per(m => {
        const c = css[m.id];
        if (
          c.fontStyle !== 'normal' ||
          ![400, 500, 600, 700].includes(+c.fontWeight)
        )
          fail('Unsupported source font');
        const h = parseFloat(c.lineHeight);
        if (!Number.isFinite(h))
          fail('Source normal line-height needs measurement');
        return {
          fontName: {
            family: resolve(fontFamily, m, 'STRING'),
            style: +c.fontWeight >= 600 ? 'Bold' : 'Regular',
          },
          fontSize: parseFloat(c.fontSize),
          lineHeight: { unit: 'PIXELS', value: h },
        };
      }),
    });
    return id;
  }
  const css = n => source.styles[n.css],
    pseudo = (n, k) => source.styles[n[k]];
  const scene = (key, state, w) =>
    Object.fromEntries(
      modes.map(m => {
        const s = source.scenes.find(
          s =>
            s.mode === m.id &&
            s.case === key &&
            s.state === state &&
            s.viewport.width === w
        );
        if (!s)
          fail('Missing scene ' + key + '/' + state + '/' + w + '/' + m.id);
        return [m.id, s];
      })
    );
  const nodes = (all, fn) =>
    Object.fromEntries(modes.map(m => [m.id, fn(all[m.id], m)]));
  const walk = n => [n, ...n.children.flatMap(walk)];
  const locate = (all, cls) =>
    nodes(all, s => {
      const found = walk(s.tree).filter(
        n =>
          n.class === cls &&
          n.rect.width > 0 &&
          n.rect.height > 0 &&
          !n.hidden &&
          css(n).display !== 'none'
      );
      if (found.length !== 1) fail('Ambiguous visible ' + cls);
      return found[0];
    });
  function frame(key, id, all, origin, children = []) {
    const cs = nodes(all, n => css(n)),
      first = all.undrr;
    const out = {
      id,
      type: 'FRAME',
      name: first.class || first.tag,
      layout: {
        mode: 'VERTICAL',
        width: number(key + '/width', m => all[m.id].rect.width),
        height: number(key + '/height', m => all[m.id].rect.height),
        gap: number('zero', () => 0),
        clipsContent: false,
      },
      children,
    };
    if (origin)
      out.absolute = {
        horizontal: 'START',
        vertical: 'START',
        offsetX: number(
          key + '/x',
          m => all[m.id].rect.x - origin[m.id].rect.x
        ),
        offsetY: number(
          key + '/y',
          m => all[m.id].rect.y - origin[m.id].rect.y
        ),
      };
    if (rgba(cs.undrr.backgroundColor).a)
      out.fill = color(key + '/background', m => cs[m.id].backgroundColor);
    out.bindings = {};
    for (const [field, c] of [
      ['topLeftRadius', 'borderTopLeftRadius'],
      ['topRightRadius', 'borderTopRightRadius'],
      ['bottomLeftRadius', 'borderBottomLeftRadius'],
      ['bottomRightRadius', 'borderBottomRightRadius'],
    ])
      out.bindings[field] = number(
        key + '/' + field,
        m => parseFloat(cs[m.id][c]),
        ['CORNER_RADIUS']
      );
    const edges = ['Top', 'Right', 'Bottom', 'Left'];
    const visible = edges.filter(e =>
      modes.some(m => parseFloat(cs[m.id]['border' + e + 'Width']) > 0)
    );
    if (visible.length) {
      const c = visible[0];
      if (
        modes.some(m =>
          visible.some(
            e =>
              cs[m.id]['border' + e + 'Color'] !==
              cs[m.id]['border' + c + 'Color']
          )
        )
      )
        fail('Different edge paints');
      out.stroke = color(
        key + '/border',
        m => cs[m.id]['border' + c + 'Color'],
        'STROKE_COLOR'
      );
      out.strokesIncludedInLayout = true;
      out.bindings.strokeWeight = number('zero', () => 0, ['STROKE_FLOAT']);
      for (const e of edges)
        out.bindings['stroke' + e + 'Weight'] = number(
          key + '/stroke' + e,
          m => parseFloat(cs[m.id]['border' + e + 'Width']),
          ['STROKE_FLOAT']
        );
    }
    const e = effect(key, cs);
    if (e) out.effectStyle = e;
    return out;
  }
  function text(key, id, all, cssAll, origin, property, wrap = 'AUTO') {
    if (modes.some(m => all[m.id].characters !== all.undrr.characters))
      fail('Different mode source copy ' + key);
    const cs = cssAll,
      style = textStyle(key, cs),
      fill = color(key + '/ink', m => cs[m.id].color),
      slotAll = nodes(all, n => ({
        rect: n.rect,
        class: 'Source text allocation',
        tag: 'TEXT',
        css: source.styles.findIndex(s => s === cs.undrr),
      })); // allocation styling is transparent, independent from owning box
    const slot = {
      id: id + '-slot',
      type: 'FRAME',
      name: 'Source rendered text allocation',
      layout: {
        mode: 'VERTICAL',
        width: number(key + '/text-width', m =>
          Math.max(all[m.id].rect.width, 0.001)
        ),
        height: number(key + '/text-height', m =>
          Math.max(all[m.id].rect.height, 0.001)
        ),
        gap: number('zero', () => 0),
        clipsContent: false,
      },
      absolute: {
        horizontal: 'START',
        vertical: 'START',
        offsetX: number(
          key + '/text-x',
          m => all[m.id].rect.x - origin[m.id].rect.x
        ),
        offsetY: number(
          key + '/text-y',
          m => all[m.id].rect.y - origin[m.id].rect.y
        ),
      },
      children: [
        {
          id,
          type: 'TEXT',
          characters: all.undrr.characters,
          textStyle: style,
          fill,
          textWrap: wrap,
          textProperty: property,
          layout: { width: 'FILL', height: 'HUG' },
        },
      ],
    };
    return slot;
  }
  function convert(key, id, all, origin) {
    const first = all.undrr;
    if (
      !first.rect.width ||
      !first.rect.height ||
      first.hidden ||
      css(first).display === 'none' ||
      css(first).visibility === 'hidden' ||
      +css(first).opacity === 0
    )
      return null;
    if (
      modes.some(
        m =>
          !all[m.id].rect.width ||
          !all[m.id].rect.height ||
          all[m.id].hidden ||
          css(all[m.id]).visibility === 'hidden'
      )
    )
      fail('Mode-specific visible anatomy');
    const output = frame(key, id, all, origin);
    for (let i = 0; i < first.children.length; i++) {
      const child = convert(
        key + '/child' + i,
        id + '-' + i,
        nodes(all, n => n.children[i]),
        all
      );
      if (child) output.children.push(child);
    }
    for (let i = 0; i < first.text.length; i++) {
      const t = nodes(all, n => n.text[i]);
      if (
        !t.undrr.characters.trim() ||
        !t.undrr.rect.width ||
        !t.undrr.rect.height
      )
        continue;
      const lines = t.undrr.lines?.length
        ? t.undrr.lines
        : [{ characters: t.undrr.characters, ...t.undrr.rect }];
      for (let l = 0; l < lines.length; l++) {
        const line = nodes(t, n => {
          const a = n.lines?.length
            ? n.lines[l]
            : { characters: n.characters, ...n.rect };
          if (!a) fail('Mode-specific source line count');
          return {
            characters: a.characters,
            rect: { x: a.x, y: a.y, width: a.width, height: a.height },
          };
        });
        output.children.push(
          text(
            key + '/text' + i + '/line' + l,
            id + '-text' + i + '-line' + l,
            line,
            nodes(all, n => css(n)),
            all,
            key + ' Text' + i + 'Line' + l,
            first.class.split(' ').includes('mg-cite-this__text')
              ? 'PRETTY'
              : first.class.split(' ').includes('mg-cite-this__title')
                ? 'BALANCE'
                : 'AUTO'
          )
        );
      }
    }
    const before = pseudo(first, 'before');
    if (before.maskImage !== 'none') {
      const markup = decodeURIComponent(
        before.maskImage.slice(5, -2).replace(/^data:image\/svg\+xml,/, '')
      );
      const name = first.class.includes('copy') ? 'copy' : 'close';
      if (
        modes.some(
          m =>
            pseudo(all[m.id], 'before').width !== before.width ||
            pseudo(all[m.id], 'before').height !== before.height
        )
      )
        fail('Mode-specific mask viewport needs explicit capability');
      if (
        markup !==
        read(ASSET + name + '-source-mask.svg')
          .toString()
          .trim()
      )
        fail('Source mask changed');
      const ps = nodes(all, n => pseudo(n, 'before')),
        w = number(key + '/mask-width', m => parseFloat(ps[m.id].width)),
        h = number(key + '/mask-height', m => parseFloat(ps[m.id].height)),
        paint = color(key + '/mask-ink', m => ps[m.id].backgroundColor);
      output.children.push({
        id: id + '-mask-slot',
        type: 'FRAME',
        name: 'Authored block pseudo mask viewport',
        layout: { mode: 'NONE', width: w, height: h, clipsContent: false },
        absolute: {
          horizontal: 'START',
          vertical: 'START',
          offsetX: number('zero', () => 0),
          offsetY: number('zero', () => 0),
        },
        children: [
          {
            id: id + '-mask',
            type: 'SVG',
            layout: {
              width: parseFloat(before.width),
              height: parseFloat(before.height),
            },
            svg: {
              assetId: 'copy-cite-' + name,
              markup,
              monochrome: { strokes: paint },
            },
          },
        ],
      });
    }
    const after = pseudo(first, 'after');
    if (after.content === '""' && first.class.includes('feedback')) {
      const ps = nodes(all, n => pseudo(n, 'after'));
      if (
        modes.some(
          m =>
            parseFloat(ps[m.id].borderTopWidth) !== 4 ||
            parseFloat(ps[m.id].borderRightWidth) !== 4 ||
            parseFloat(ps[m.id].borderBottomWidth) !== 4 ||
            parseFloat(ps[m.id].borderLeftWidth) !== 4
        )
      )
        fail('Tooltip triangle changed');
      const eight = number('triangle-eight', () => 8),
        paint = color(key + '/triangle', m => ps[m.id].borderTopColor);
      output.children.push({
        id: id + '-triangle-slot',
        type: 'FRAME',
        name: 'Source feedback border triangle',
        layout: {
          mode: 'NONE',
          width: eight,
          height: eight,
          clipsContent: false,
        },
        absolute: {
          horizontal: 'START',
          vertical: 'START',
          offsetX: number(
            key + '/triangle-x',
            m => all[m.id].rect.width / 2 - 4
          ),
          offsetY: number(key + '/triangle-y', m => all[m.id].rect.height),
        },
        children: [
          {
            id: id + '-triangle',
            type: 'SVG',
            layout: { width: 8, height: 8 },
            svg: {
              assetId: 'copy-cite-feedback-triangle',
              markup:
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><polygon points="0,0 8,0 4,4" fill="#000"/></svg>',
              monochrome: { fills: paint },
            },
          },
        ],
      });
    }
    if (['"+"', '"−"'].includes(after.content)) {
      const ps = nodes(all, n => pseudo(n, 'after')),
        glyph = nodes(all, (n, m) => ({
          characters: pseudo(n, 'after').content.slice(1, -1),
          rect: {
            x:
              n.rect.x +
              n.rect.width -
              parseFloat(css(n).paddingRight) -
              parseFloat(pseudo(n, 'after').width),
            y:
              n.rect.y +
              (n.rect.height - parseFloat(pseudo(n, 'after').height)) / 2,
            width: parseFloat(pseudo(n, 'after').width),
            height: parseFloat(pseudo(n, 'after').height),
          },
        }));
      output.children.push(
        text(
          key + '/disclosure',
          'disclosure-glyph',
          glyph,
          ps,
          all,
          key + ' Disclosure'
        )
      );
    }
    return output;
  }
  const limitations = [
    'Finite initial authored source scenes and rendered line allocations, source CSS semantics and clipboard/native-dialog behavior remain in code. No copying/download state exists in current source.',
    'Signed absolute token allocations project the captured viewport; arbitrary edits/reflow, transition, pseudo-mask baseline and native pixel equivalence remain open.',
    'Citation code uses a dedicated measured Menlo candidate. Current isolated cloud native font inventory lacks this family; no substitute font or native acceptance claimed. Legacy property migration, locale/RTL and unpublished/published consumer gates remain separate.',
  ];
  const family = id => ({
    id,
    name: id,
    description: 'Actual Copy/Cite finite authored source appearance.',
    kind: 'component-set',
    review: { genericLabels: false, preserveVariantSizing: true },
    sourceRef: ref,
    limitations: [...limitations],
    variants: [],
    dependencies: [],
  });
  const copy = family('copy-button'),
    trigger = family('cite-trigger'),
    dialog = family('cite-dialog'),
    fallback = family('cite-fallback');
  copy.sourceRef = {
    file: 'stories/Components/Buttons/CopyButton/CopyButton.jsx',
    line: 15,
  };
  function add(f, key, state, w, tree) {
    f.variants.push({
      id: f.id + '.' + key + '.' + state + '.' + w,
      name: 'Preset=' + key + ', State=' + state + ', SourceViewport=' + w,
      properties: { Preset: key, State: state, SourceViewport: String(w) },
      sourceCase: { key, state, width: w },
      tree,
    });
  }
  for (const w of [390, 1164]) {
    for (const config of [
      'outline',
      'primary',
      'secondary',
      'small',
      'large',
      'vanilla-custom',
    ])
      for (const state of ['idle', 'copied', 'failed']) {
        const key = 'copy-' + config,
          all = scene(key, state, w);
        add(
          copy,
          config,
          state,
          w,
          convert(
            'copy-button/' + config + '/' + state + '/' + w,
            'copy-root',
            nodes(all, s => s.tree),
            null
          )
        );
      }
    const closed = scene('cite-metadata', 'closed', w),
      triggerNodes = locate(closed, 'mg-cite-this__trigger');
    add(
      trigger,
      'default',
      'closed',
      w,
      convert('cite-trigger/' + w, 'trigger-root', triggerNodes, null)
    );
    for (const preset of [
      'bare-page-fallback',
      'page-with-overrides',
      'metadata',
      'schema-metadata',
      'publisher-citation',
      'long-citation',
      'matching-schema-host',
    ])
      for (const state of preset === 'metadata'
        ? ['open', 'copied', 'failed']
        : ['open']) {
        const key = 'cite-' + preset,
          all = scene(key, state, w),
          rootAll = nodes(all, () => ({
            rect: { x: 0, y: 0, width: w, height: 1000 },
            tag: 'VIEWPORT',
            class: 'Recorded source modal viewport',
            css: source.styles.findIndex(
              s =>
                s.backgroundColor === 'rgb(255, 255, 255)' &&
                s.boxShadow === 'none'
            ),
          })),
          rootTree = {
            id: 'dialog-scene',
            type: 'FRAME',
            layout: {
              mode: 'VERTICAL',
              width: number('viewport/' + w, () => w),
              height: number('viewport-height', () => 1000),
              clipsContent: false,
            },
            fill: 'color/white',
            children: [],
          };
        const top = frame(
          'cite-dialog/' + preset + '/' + state + '/' + w + '/trigger-slot',
          'trigger-slot',
          locate(all, 'mg-cite-this__trigger'),
          rootAll
        );
        delete top.fill;
        delete top.stroke;
        delete top.bindings;
        delete top.effectStyle;
        top.children = [
          {
            id: 'trigger-instance',
            type: 'INSTANCE',
            family: 'cite-trigger',
            variant: {
              Preset: 'default',
              State: 'closed',
              SourceViewport: String(w),
            },
          },
        ];
        rootTree.children.push(top);
        rootTree.children.push({
          id: 'modal-scrim',
          type: 'FRAME',
          layout: {
            mode: 'NONE',
            width: number('viewport/' + w, () => w),
            height: number('viewport-height', () => 1000),
          },
          absolute: {
            horizontal: 'START',
            vertical: 'START',
            offsetX: number('zero', () => 0),
            offsetY: number('zero', () => 0),
          },
          fill: color(
            'modal-scrim',
            m => scrims.find(s => s.mode === m.id).scrim
          ),
          children: [],
        });
        rootTree.children.push(
          convert(
            'cite-dialog/' + preset + '/' + state + '/' + w,
            'dialog-root',
            locate(all, 'mg-cite-this__dialog'),
            rootAll
          )
        );
        add(dialog, preset, state, w, rootTree);
      }
    for (const state of ['fallback-closed', 'fallback-open']) {
      const all = scene('cite-metadata', state, w);
      add(
        fallback,
        'metadata',
        state,
        w,
        convert(
          'cite-fallback/' + state + '/' + w,
          'fallback-root',
          locate(all, 'mg-cite-this__fallback'),
          null
        )
      );
    }
  }
  dialog.dependencies = ['cite-trigger'];
  targets.variables.splice(0, targets.variables.length, ...variables);
  for (const kind of ['text', 'effect'])
    targets.styles[kind].splice(
      0,
      targets.styles[kind].length,
      ...styles[kind]
    );
  return [copy, trigger, dialog, fallback];
}
module.exports = { buildCopyCiteRecipes };
