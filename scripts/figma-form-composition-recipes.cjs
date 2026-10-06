/** Actual authored FormGroup, joined FormAction and Newsletter caller source scenes. Native acceptance open. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const ASSET = 'examples/figma-plugin/holistic/assets/form-compositions/';
const PROVENANCE_HASH =
  '96007cbb402009d4dd3602adb3e6931147db0ae75bde7727c7bebc55e3a9915a';
function buildFormCompositionRecipes({ root, modes, variables, styles }) {
  const targets = { variables, styles };
  variables = JSON.parse(JSON.stringify(variables));
  styles = JSON.parse(JSON.stringify(styles));
  const fail = m => {
    throw Error('Figma Form compositions recipe needs updating: ' + m);
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
  const source = JSON.parse(read(ASSET + 'source-footprints.json'));
  const foundations = JSON.parse(read(ASSET + 'foundation-contract.json'));
  for (const expected of foundations.variables) {
    const actual = variables.find(v => v.name === expected.name);
    if (
      !actual ||
      ['id', 'name', 'type', 'values'].some(
        k => JSON.stringify(actual[k]) !== JSON.stringify(expected[k])
      )
    )
      fail('Captured foundation changed ' + expected.name);
  }
  for (const expected of foundations.styles) {
    const actual = styles.text.find(v => v.id === expected.id);
    if (
      !actual ||
      ['id', 'name', 'values', 'bindings'].some(
        k => JSON.stringify(actual[k]) !== JSON.stringify(expected[k])
      )
    )
      fail('Normal leaf text style changed ' + expected.id);
  }
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
  const ref = {
    file: 'stories/Components/Forms/FormAction/form-action.scss',
    line: 9,
  };
  function role(key, type, fn, scopes = []) {
    const name = 'component/form-composition/' + key.replaceAll('.', '/');
    upsert(variables, {
      id: name.replaceAll('/', '.'),
      name,
      type,
      values: per(fn),
      scopes,
      sourceRef: key.startsWith('form-group')
        ? {
            file: 'stories/Components/Forms/FormGroup/form-group.scss',
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
      v =>
        v.type === 'COLOR' && !v.name.startsWith('component/form-composition/')
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
    if (!alias) return role(key, 'COLOR', m => values[m.id], [scope]); // Exact captured UA paint, never a nearest palette substitution.
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
      id = 'component.form-composition.' + key + '.shadow';
    upsert(styles.effect, {
      id,
      name: 'Mangrove/component/form-composition/' + key + '/shadow',
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
  function textStyle(key, css) {
    const family = m =>
      css[m.id].fontFamily.includes('Condensed')
        ? 'font-family/ui'
        : 'font-family/text';
    const fontFamily = family(modes[0]);
    if (
      modes.some(
        m =>
          resolve(fontFamily, m, 'STRING') !==
          (fontFamily === 'font-family/ui' ? 'Roboto Condensed' : 'Roboto')
      )
    )
      fail('Source font family changed');
    if (modes.some(m => family(m) !== fontFamily))
      fail('Mode-specific font routing');
    const size = number(key + '/size', m => parseFloat(css[m.id].fontSize), [
        'FONT_SIZE',
      ]),
      id = 'component.form-composition.' + key + '.type';
    upsert(styles.text, {
      id,
      name: 'Mangrove/component/form-composition/' + key + '/type',
      source: key.startsWith('form-group')
        ? {
            file: 'stories/Components/Forms/FormGroup/form-group.scss',
            line: 9,
          }
        : ref,
      component: true,
      recommended: false,
      description:
        'Exact captured CSS size/line height. Bundled Regular/Bold face routing follows source font imports; CSS600 maps to Bold700 as explicit candidate; native input/value/placeholder baseline is a finite source-browser candidate. Native font/pixel matching remains open.',
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
  for (const m of modes) {
    const scenes = source.scenes.filter(s => s.mode === m.id);
    for (const scene of scenes) {
      for (const n of walk(scene.tree).filter(n =>
        n.class.includes('mg-button-primary')
      )) {
        for (const [roleName, field] of [
          ['color/button-background', 'backgroundColor'],
          ['color/button', 'color'],
        ]) {
          const live = resolve(roleName, m, 'COLOR'),
            observed = rgba(css(n)[field]);
          if (
            ['r', 'g', 'b'].some(
              k => Math.round(live[k] * 255) !== Math.round(observed[k] * 255)
            ) ||
            live.a !== observed.a
          )
            fail('Actual primary action paint changed ' + roleName);
        }
      }
    }
  }
  function convert(key, id, all, origin) {
    const n = all.undrr;
    if (
      !n.rect.width ||
      !n.rect.height ||
      n.hidden ||
      css(n).display === 'none' ||
      n.class.includes('mg-u-sr-only')
    )
      return null;
    const out = frame(key, id, all, origin);
    if (n.class === 'mg-form-check') {
      const family = n.children[0].class.includes('--radio')
        ? 'radio'
        : 'checkbox';
      for (const m of modes) {
        const row = all[m.id],
          input = row.children[0];
        if (
          row.rect.height !==
            resolve(
              'component/' + family + '/minimum-row-height',
              m,
              'FLOAT'
            ) ||
          input.rect.width !==
            resolve('component/' + family + '/control-size', m, 'FLOAT') ||
          input.rect.height !== input.rect.width
        )
          fail('Normal leaf allocation differs');
        if (
          parseFloat(css(input).borderTopWidth) !==
            resolve('component/' + family + '/border-width', m, 'FLOAT') ||
          (family === 'checkbox' &&
            parseFloat(css(input).borderTopLeftRadius) !==
              resolve('radius/form-input', m, 'FLOAT'))
        )
          fail('Normal leaf border/radius differs');
        const expected = resolve('color/form-check', m, 'COLOR'),
          captured = rgba(css(input).borderTopColor);
        if (
          ['r', 'g', 'b'].some(
            k => Math.round(expected[k] * 255) !== Math.round(captured[k] * 255)
          ) ||
          expected.a !== captured.a
        )
          fail('Normal Default leaf paint differs');
      }
      out.children.push({
        id: id + '-source-leaf',
        type: 'INSTANCE',
        family,
        variant: {
          Checked: 'False',
          State: 'Default',
          LabelPosition: 'After',
          Content: 'Short',
        },
        overrides: { Label: n.children[1].text[0].characters },
        expose: true,
        layout: {
          width: number(key + '/leaf-width', m => all[m.id].rect.width),
          height: number(key + '/leaf-height', m => all[m.id].rect.height),
        },
      });
      return out;
    }
    if (n.tag === 'INPUT' || n.tag === 'SELECT') {
      const candidates = nodes(all, x => {
        const c = css(x),
          pL = parseFloat(c.paddingLeft) + parseFloat(c.borderLeftWidth),
          pR = parseFloat(c.paddingRight) + parseFloat(c.borderRightWidth),
          h = parseFloat(c.lineHeight);
        return {
          characters: x.value || x.placeholder || '',
          rect: {
            x: x.rect.x + pL,
            y: x.rect.y + (x.rect.height - h) / 2,
            width: Math.max(0.001, x.rect.width - pL - pR),
            height: h,
          },
        };
      });
      const inputCss = nodes(all, x => ({
        ...css(x),
        color:
          x.value || !x.placeholder
            ? css(x).color
            : source.styles[x.placeholderCss].color,
      }));
      if (candidates.undrr.characters)
        out.children.push(
          text(
            key + '/value',
            id + '-value',
            candidates,
            inputCss,
            all,
            key + '/Value'
          )
        );
      if (n.tag === 'SELECT') {
        const dto = JSON.parse(
          read('examples/figma-plugin/mangrove-variables.json')
        );
        const leaf = dto.components.families.find(f => f.id === 'select')
          .variants[0].tree;
        const todo = [leaf];
        let svg;
        while (todo.length) {
          const x = todo.pop();
          if (x.type === 'SVG') svg = x;
          todo.push(...(x.children || []));
        }
        if (!svg) fail('Exact native Select chevron missing');
        svg = structuredClone(svg);
        delete svg.position;
        delete svg.absolute;
        out.children.push({
          id: id + '-chevron-slot',
          type: 'FRAME',
          layout: { mode: 'NONE', width: 12, height: 8 },
          absolute: {
            horizontal: 'END',
            vertical: 'CENTER',
            offsetX: number(key + '/chevron-inset', m => {
              const bg = all[m.id].selectBackground;
              if (
                !bg ||
                bg.backgroundOrigin !== 'padding-box' ||
                bg.backgroundPositionX !== 'calc(100% - 6.25px)' ||
                bg.backgroundPositionY !== '50%' ||
                bg.backgroundSize !== 'auto'
              )
                fail('Actual source Select background contract changed');
              return -(6.25 + parseFloat(bg.borderRightWidth));
            }),
            offsetY: number('zero', () => 0),
          },
          children: [{ ...svg, id: id + '-chevron', position: { x: 0, y: 0 } }],
        });
      }
      return out;
    }
    for (let i = 0; i < n.children.length; i++) {
      const child = convert(
        key + '/child' + i,
        id + '-' + i,
        nodes(all, x => x.children[i]),
        all
      );
      if (child) out.children.push(child);
    }
    for (let i = 0; i < n.text.length; i++) {
      const texts = nodes(all, x => x.text[i]);
      if (!texts.undrr.characters.trim() || !texts.undrr.rect.width) continue;
      const lines = texts.undrr.lines;
      for (let l = 0; l < lines.length; l++) {
        const slots = nodes(texts, x => {
          const a = x.lines[l];
          if (!a) fail('Source lines vary across modes');
          return {
            characters: a.characters,
            rect: { x: a.x, y: a.y, width: a.width, height: a.height },
          };
        });
        out.children.push(
          text(
            key + '/text' + i + '/line' + l,
            id + '-text-' + i + '-line-' + l,
            slots,
            nodes(all, x => css(x)),
            all,
            key + '/Text' + i + '/Line' + l
          )
        );
      }
    }
    return out;
  }
  const groups = [],
    actions = [],
    newsletter = [];
  for (const width of [390, 1164]) {
    for (const name of [
      'checkbox-group-story',
      'radio-group-story',
      'disabled',
      'error-state',
      'hidden-legend',
      'newsletter-optional',
    ]) {
      const all = scene('group-' + name, 'initial', width),
        rootNodes = nodes(all, x => x.tree),
        key = 'form-group.' + name + '.' + width;
      const tree = convert(key, 'root', rootNodes, null);
      // Native fieldset top border is centred within its legend line box. This finite surrounding-surface projection paints its gap explicitly; it is not a portable fieldset algorithm.
      if (name !== 'hidden-legend') {
        const legend = nodes(rootNodes, x => x.children[0]),
          top = nodes(rootNodes, (x, m) => ({
            ...x,
            rect: {
              ...x.rect,
              y: x.rect.y + legend[m.id].rect.height / 2,
              height: x.rect.height - legend[m.id].rect.height / 2,
            },
          }));
        const background = frame(
          key + '/fieldset-border',
          'fieldset-border',
          top,
          rootNodes,
          []
        );
        delete tree.fill;
        delete tree.stroke;
        tree.bindings = {};
        delete tree.effectStyle;
        const surface = color(
          key + '/surrounding-surface',
          m => all[m.id].surroundingSurface || 'rgb(255, 255, 255)'
        );
        tree.fill = surface;
        tree.children.unshift(background);
        const legendTree = tree.children.find(x => x.id === 'root-0');
        if (!legendTree) fail('Missing visible legend');
        legendTree.fill = surface;
      }
      groups.push({
        id: key,
        name: 'Source=' + name + ', SourceViewport=' + width,
        properties: { Source: name, SourceViewport: String(width) },
        tree,
        sourceGeometry: {
          recorded: per(m => rootNodes[m.id].rect),
          fieldsetSemanticDisabled: name === 'disabled',
          legendCutout:
            'Finite captured parent-surface gap projection, native corner/gap pixels pending',
        },
      });
    }
    for (const name of [
      'search',
      'subscribe',
      'select-and-continue',
      'stacked-on-mobile',
    ]) {
      const all = scene('action-' + name, 'initial', width),
        key = 'form-action.' + name + '.' + width;
      actions.push({
        id: key,
        name: 'Source=' + name + ', SourceViewport=' + width,
        properties: { Source: name, SourceViewport: String(width) },
        tree: convert(
          key,
          'root',
          nodes(all, x => x.tree),
          null
        ),
        sourceGeometry: {
          recorded: per(m => all[m.id].tree.rect),
          onePixelSeam:
            'Actual source -1px margin projected through signed START offsets',
        },
      });
    }
    for (const state of ['idle', 'invalid', 'sending', 'service-error']) {
      const all = scene('action-newsletter', state, width),
        key = 'form-action-newsletter.' + state + '.' + width;
      newsletter.push({
        id: key,
        name: 'State=' + state + ', SourceViewport=' + width,
        properties: { State: state, SourceViewport: String(width) },
        tree: convert(
          key,
          'root',
          nodes(all, x => x.tree),
          null
        ),
        sourceGeometry: {
          recorded: per(m => all[m.id].tree.rect),
          requiredInput: true,
          requiredVisibleStar: false,
          sendingFixture: state === 'sending' ? 60000 : null,
        },
      });
    }
  }
  const limitations = [
    'Actual finite English source story/caller appearances only. Required native input validation, fieldset semantics, native submit/providers, keyboard/focus and locale behavior remain source-only metadata.',
    'Absolute source layout, native input/placeholder baseline, select arrow pixels, legend border-gap/corners and font wrapping remain candidate/native gates. This is not arbitrary responsive CSS or edited-content reflow.',
    'FormGroup does not own required/help/loading. Its disabled fieldset children retain Default visual leaf CSS. No authored joined icon action was found; there is no invented icon or loading branch.',
  ];
  const families = [
    ['form-group', groups],
    ['form-action', actions],
    ['form-action-newsletter', newsletter],
  ].map(([id, variants]) => ({
    id,
    name: 'Mangrove/Source forms/' + id,
    kind: 'component-set',
    sourceRef:
      id === 'form-group'
        ? { file: 'stories/Components/Forms/FormGroup/FormGroup.jsx', line: 12 }
        : id === 'form-action'
          ? {
              file: 'stories/Components/Forms/FormAction/FormAction.jsx',
              line: 11,
            }
          : {
              file: 'stories/Patterns/NewsletterPromotion/NewsletterPromotion.stories.jsx',
              line: 178,
            },
    review: { genericLabels: false, preserveVariantSizing: true },
    limitations,
    variants,
  }));
  targets.variables.splice(0, targets.variables.length, ...variables);
  targets.styles.text.splice(0, targets.styles.text.length, ...styles.text);
  targets.styles.effect.splice(
    0,
    targets.styles.effect.length,
    ...styles.effect
  );
  return families;
}
module.exports = { buildFormCompositionRecipes };
