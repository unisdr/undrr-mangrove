/** Genuine finite public Drawer stories. Source geometry is not native pixel acceptance. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const ASSET = 'examples/figma-plugin/holistic/assets/drawer/';
const PROVENANCE =
  '0e804e96c99faa4379eb95859640cf84f04a98807063f80e86b38c058eeaace2';
const clone = x => JSON.parse(JSON.stringify(x));
function buildDrawerCheckboxDependency({ root }) {
  const read = f => fs.readFileSync(path.join(root, f)),
    sha = b => crypto.createHash('sha256').update(b).digest('hex');
  if (sha(read(ASSET + 'provenance.json')) !== PROVENANCE)
    throw Error('Drawer source changed: provenance');
  const provenance = JSON.parse(read(ASSET + 'provenance.json'));
  for (const [f, h] of Object.entries(provenance.sourceHashes))
    if (sha(read(f)) !== h) throw Error('Drawer source changed: ' + f);
  const donor = JSON.parse(read(ASSET + 'dependency-contract.json')).checkbox,
    family = clone(donor);
  family.id = 'drawer-checkbox';
  family.name = 'Mangrove draft / Drawer contextual Checkbox dependency';
  family.review = { genericLabels: false, specimens: [] };
  family.variants = family.variants.filter(
    v =>
      v.properties.State === 'Default' &&
      v.properties.LabelPosition === 'After' &&
      v.properties.Content === 'Short'
  );
  if (family.variants.length !== 2)
    throw Error('Drawer source changed: Checkbox donor states');
  for (const v of family.variants) {
    v.id = v.id.replace(/^checkbox\./, 'drawer-checkbox.');
    const walk = n => {
      if (n.type === 'TEXT' && n.textProperty === 'Label') {
        if (n.fill !== 'color/text' || n.textStyle !== 'component.body')
          throw Error('Drawer source changed: Checkbox donor Label');
        n.fill = 'color/neutral-900';
      }
      (n.children || []).forEach(walk);
    };
    walk(v.tree);
  }
  family.description =
    'Exact normal Checkbox Default/After/Short Checked and Unchecked anatomy, with the authored Drawer-inherited neutral-900 Label paint. Other normal Checkbox states are not Drawer source coverage.';
  family.limitations = [
    ...(family.limitations || []),
    'Native Drawer contextual Label glyph/paint equivalence remains open.',
  ];
  return family;
}
function buildDrawerRecipes({ root, modes, variables, styles }) {
  const target = { variables, styles };
  variables = clone(variables);
  styles = clone(styles);
  const fail = m => {
      throw Error('Drawer source changed: ' + m);
    },
    read = f => fs.readFileSync(path.join(root, f)),
    sha = b => crypto.createHash('sha256').update(b).digest('hex');
  if (sha(read(ASSET + 'provenance.json')) !== PROVENANCE) fail('provenance');
  const provenance = JSON.parse(read(ASSET + 'provenance.json'));
  for (const [f, h] of Object.entries(provenance.sourceHashes))
    if (sha(read(f)) !== h) fail(f);
  const modeKey = modes
    .map(m => m.id)
    .sort()
    .join(',');
  if (modeKey !== 'delta,irp,mcr,preventionweb,undrr')
    fail('five source modes');
  const foundations = JSON.parse(read(ASSET + 'foundation-contract.json'));
  for (const [k, list] of [
    ['variables', variables],
    ['textStyles', styles.text],
    ['effectStyles', styles.effect],
  ])
    for (const expected of foundations[k]) {
      const found = list.filter(
        v => v.id === expected.id || v.name === expected.name
      );
      if (
        found.length !== 1 ||
        [
          'id',
          'name',
          ...(k === 'variables' ? ['type'] : []),
          'values',
          ...(expected.bindings ? ['bindings'] : []),
        ].some(k => JSON.stringify(found[0][k]) !== JSON.stringify(expected[k]))
      )
        fail('foundation ' + expected.id);
    }
  const source = JSON.parse(read(ASSET + 'source-footprints.json'));
  const scenes = source.captures.map(({ capture }) => {
    const c = clone(capture);
    for (const n of c.nodes)
      for (const k of ['style', 'before', 'after']) n[k] = source.styles[n[k]];
    if (c.backdrop) c.backdrop.style = source.styles[c.backdrop.style];
    c.bodyStyle = source.styles[c.bodyStyle];
    return c;
  });
  if (scenes.length !== 200) fail('source200');
  const per = fn => Object.fromEntries(modes.map(m => [m.id, fn(m.id)]));
  const resolve = (name, m, type, seen = new Set()) => {
    if (seen.has(name)) fail('alias cycle ' + name);
    seen.add(name);
    const v = variables.find(v => v.name === name);
    if (!v || v.type !== type) fail('missing/wrong ' + name);
    const x = v.values[m];
    if (x == null) fail('mode ' + name);
    return x.alias ? resolve(x.alias, m, type, seen) : x;
  };
  const upsert = (list, e) => {
    const found = list.filter(v => v.id === e.id || v.name === e.name);
    if (found.length > 1 || found.some(v => v.id !== e.id || v.name !== e.name))
      fail('foreign identity ' + e.id);
    if (list === variables) {
      if (found.some(v => v.type !== e.type)) fail('foreign variable type');
    } else {
      const kind = list === styles.text ? 'TEXT' : 'EFFECT',
        other = list === styles.text ? styles.effect : styles.text;
      if (other.some(v => v.id === e.id || v.name === e.name))
        fail('foreign style kind');
      for (const v of found) {
        if (v.type !== undefined && v.type !== kind)
          fail('foreign explicit style kind');
        if (
          Object.keys(v.values || {})
            .sort()
            .join(',') !== modeKey
        )
          fail('foreign style modes');
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
    if (found.length) list[list.indexOf(found[0])] = e;
    else list.push(e);
  };
  const ref = {
    file: 'stories/Components/Navigation/Drawer/drawer.scss',
    line: 11,
  };
  const role = (type, values) => {
    if (
      type === 'FLOAT' &&
      Object.values(values).some(v => !Number.isFinite(v))
    )
      fail('nonfinite allocation');
    const name =
      'component/drawer/value-' +
      sha(Buffer.from(JSON.stringify([type, values]))).slice(0, 20);
    upsert(variables, {
      id: name.replaceAll('/', '.'),
      name,
      type,
      values,
      scopes: ['ALL_SCOPES'],
      sourceRef: ref,
      hiddenFromPublishing: false,
      description:
        'Immutable captured value-profile candidate, not mutable semantic maintenance identity. Explicit authored token aliases remain distinct. Native metrics/pixels and arbitrary caller reflow remain open.',
      codeSyntax: {},
    });
    return name;
  };
  const number = fn => role('FLOAT', per(fn));
  const rgba = s => {
    const hit = /^rgba?\(([^)]+)\)$/.exec(s);
    if (!hit) fail('paint ' + s);
    const a = hit[1].split(',').map(Number);
    if (a.some(x => !Number.isFinite(x)) || a.length < 3 || a.length > 4)
      fail('paint shape');
    return {
      r: a[0] / 255,
      g: a[1] / 255,
      b: a[2] / 255,
      a: a.length === 4 ? a[3] : 1,
    };
  };
  const color = (fn, alias = null) => {
    const values = per(m => rgba(fn(m)));
    if (
      alias &&
      !modes.every(m => {
        const c = resolve(alias, m.id, 'COLOR'),
          v = values[m.id];
        return (
          ['r', 'g', 'b'].every(
            k => Math.round(c[k] * 255) === Math.round(v[k] * 255)
          ) && (c.a ?? 1) === v.a
        );
      })
    )
      fail('Authored source paint alias ' + alias);
    return role('COLOR', alias ? per(() => ({ alias })) : values);
  };
  const font = all => {
    const values = per(m => {
      const s = all[m].style,
        family = s.fontFamily.split(',')[0].replaceAll('"', '').trim();
      if (
        !['Roboto', 'Roboto Condensed'].includes(family) ||
        !['400', '600', '700'].includes(s.fontWeight) ||
        s.fontStyle !== 'normal' ||
        !Number.isFinite(parseFloat(s.lineHeight))
      )
        fail('font ' + family);
      return {
        fontName: { family, style: +s.fontWeight >= 600 ? 'Bold' : 'Regular' },
        fontSize: parseFloat(s.fontSize),
        lineHeight: { unit: 'PIXELS', value: parseFloat(s.lineHeight) },
        letterSpacing: {
          unit: 'PIXELS',
          value: s.letterSpacing === 'normal' ? 0 : parseFloat(s.letterSpacing),
        },
        paragraphSpacing: 0,
        textDecoration: 'NONE',
      };
    });
    const id =
        'component.drawer.text-' +
        sha(Buffer.from(JSON.stringify(values))).slice(0, 20),
      familyRole =
        values.undrr.fontName.family === 'Roboto'
          ? 'font-family/text'
          : 'font-family/ui';
    for (const m of modes)
      if (resolve(familyRole, m.id, 'STRING') !== values[m.id].fontName.family)
        fail('source font family alias');
    upsert(styles.text, {
      id,
      name: 'Mangrove draft / ' + id,
      values,
      bindings: {
        fontFamily: familyRole,
        fontSize: number(m => values[m].fontSize),
      },
      sourceRef: ref,
      description:
        'Actual source Regular400/Bold700; CSS600 uses existing source Button bundled Bold candidate. Native font-file/glyph equivalence remains open.',
    });
    return id;
  };
  const shadow = all => {
    if (modes.every(m => all[m.id].style.boxShadow === 'none')) return null;
    const values = per(m => {
      const hit =
        /^(rgba?\([^)]+\)) (-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px (-?[\d.]+)px$/.exec(
          all[m].style.boxShadow
        );
      if (!hit) fail('shadow');
      return [
        {
          effect: {
            type: 'DROP_SHADOW',
            color: rgba(hit[1]),
            offset: { x: +hit[2], y: +hit[3] },
            radius: +hit[4],
            spread: +hit[5],
            visible: true,
            blendMode: 'NORMAL',
          },
        },
      ];
    });
    const id =
      'component.drawer.effect-' +
      sha(Buffer.from(JSON.stringify(values))).slice(0, 20);
    upsert(styles.effect, {
      id,
      name: 'Mangrove draft / ' + id,
      values,
      sourceRef: ref,
    });
    return id;
  };
  const contexts = scenes.filter(
    c => c.contract.mode === 'undrr' && !c.contract.state.startsWith('closed')
  );
  if (contexts.length !== 20) fail('finite20');
  const variants = [];
  for (const sample of contexts) {
    const { story, width, state } = sample.contract,
      context = story + '-' + width + '-' + state;
    const captures = per(m =>
      scenes.find(
        c =>
          c.contract.mode === m &&
          c.contract.story === story &&
          c.contract.width === width &&
          c.contract.state === state
      )
    );
    for (const m of modes) {
      const c = captures[m.id];
      if (
        !c ||
        c.fontStatus !== 'loaded' ||
        c.nodes[0].style.transform !== 'none' ||
        c.nodes[0].style.visibility !== 'visible' ||
        c.nodes[0].style.display !== 'flex' ||
        !c.aliases['--mg-control-border'] ||
        c.viewport.height !== 1000
      )
        fail('settled source ' + context);
      if (
        JSON.stringify(
          c.nodes.map(n => [
            n.id,
            n.parentId,
            n.tag,
            n.classes,
            n.texts.map(t => t.characters),
            n.checked,
          ])
        ) !==
        JSON.stringify(
          sample.nodes.map(n => [
            n.id,
            n.parentId,
            n.tag,
            n.classes,
            n.texts.map(t => t.characters),
            n.checked,
          ])
        )
      )
        fail('source anatomy/copy');
    }
    const maps = per(m => new Map(captures[m].nodes.map(n => [n.id, n]))),
      lookup = id => per(m => maps[m].get(id));
    const frame = (id, all, parent) => {
      const n = all.undrr,
        s = n.style;
      if (
        s.transform !== 'none' ||
        s.backgroundImage !== 'none' ||
        s.fontStyle !== 'normal'
      )
        fail('unsupported source frame ' + id);
      const f = {
        id: 'drawer-' + id,
        type: 'FRAME',
        name: n.classes || n.tag,
        layout: {
          mode: 'VERTICAL',
          width: number(m => all[m].rect.width),
          height: number(m => all[m].rect.height),
          clipsContent: s.overflowX !== 'visible' || s.overflowY !== 'visible',
        },
        children: [],
        bindings: { opacity: number(m => +all[m].style.opacity * 100) },
        sourceDrawerNode: {
          id,
          tag: n.tag,
          classes: n.classes,
          href: n.href,
          ariaLabel: n.ariaLabel,
          role: n.role,
          focused: n.focused,
          focusVisible: n.focusVisible,
          scrollTop: n.scrollTop,
          scrollHeight: n.scrollHeight,
          clientHeight: n.clientHeight,
        },
      };
      if (parent)
        f.absolute = {
          horizontal: 'START',
          vertical: 'START',
          offsetX: number(m => all[m].rect.x - parent[m].rect.x),
          offsetY: number(m => all[m].rect.y - parent[m].rect.y),
        };
      if (modes.some(m => rgba(all[m.id].style.backgroundColor).a))
        f.fill = color(
          m => all[m].style.backgroundColor,
          id === 'root' ? 'surface/raised' : null
        );
      for (const [field, css] of [
        ['topLeftRadius', 'borderTopLeftRadius'],
        ['topRightRadius', 'borderTopRightRadius'],
        ['bottomLeftRadius', 'borderBottomLeftRadius'],
        ['bottomRightRadius', 'borderBottomRightRadius'],
      ])
        f.bindings[field] = number(m => parseFloat(all[m].style[css]));
      const edges = ['Top', 'Right', 'Bottom', 'Left'],
        visible = edges.filter(e =>
          modes.some(
            m => parseFloat(all[m.id].style['border' + e + 'Width']) > 0
          )
        );
      if (visible.length) {
        const e = visible[0];
        if (
          modes.some(m =>
            visible.some(
              k =>
                all[m.id].style['border' + k + 'Color'] !==
                all[m.id].style['border' + e + 'Color']
            )
          )
        )
          fail('border paint split');
        f.stroke = color(
          m => all[m].style['border' + e + 'Color'],
          /__(header|footer)$/.test(n.classes) ? 'color/neutral-200' : null
        );
        f.strokeAlign = 'INSIDE';
        f.bindings.strokeWeight = number(() => 0);
        for (const e of edges)
          f.bindings['stroke' + e + 'Weight'] = number(m =>
            parseFloat(all[m].style['border' + e + 'Width'])
          );
        if (n.tag === 'FIELDSET') {
          if (
            modes.some(m =>
              edges.some(
                e => all[m.id].style['border' + e + 'Style'] !== 'groove'
              )
            )
          )
            fail('UA fieldset');
          f.sourceUaBorderCandidate = {
            sourceStyle: 'groove',
            sourceLegendNotch: true,
            projection:
              'Solid captured edge-paint/width on owning box. UA groove shading and legend notch remain native raster fidelity gates.',
          };
        }
      }
      const effect = shadow(all);
      if (effect) f.effectStyle = effect;
      return f;
    };
    function convert(id) {
      const all = lookup(id),
        n = all.undrr,
        parent = n.parentId ? lookup(n.parentId) : null;
      if (n.classes === 'mg-form-check') {
        const inputId = sample.nodes.find(
            x => x.parentId === id && x.tag === 'INPUT'
          ).id,
          labelId = sample.nodes.find(
            x => x.parentId === id && x.tag === 'LABEL'
          ).id,
          input = lookup(inputId),
          label = lookup(labelId),
          checked = input.undrr.checked;
        for (const m of modes) {
          const body = styles.text.find(v => v.id === 'component.body').values[
              m.id
            ],
            ink = resolve('color/neutral-900', m.id, 'COLOR'),
            sourceInk = rgba(label[m.id].style.color),
            labelStyle = label[m.id].style,
            sourceLineHeight =
              body.lineHeight.unit === 'PIXELS'
                ? body.lineHeight.value
                : body.lineHeight.unit === 'PERCENT'
                  ? (body.fontSize * body.lineHeight.value) / 100
                  : NaN;
          if (
            labelStyle.fontFamily.split(',')[0] !== body.fontName.family ||
            labelStyle.fontWeight !== '400' ||
            parseFloat(labelStyle.fontSize) !== body.fontSize ||
            parseFloat(labelStyle.lineHeight) !== sourceLineHeight ||
            ['r', 'g', 'b'].some(
              k => Math.round(ink[k] * 255) !== Math.round(sourceInk[k] * 255)
            ) ||
            (ink.a ?? 1) !== sourceInk.a
          )
            fail('Exact Checkbox contextual label differs');
          const i = input[m.id],
            l = label[m.id],
            s = i.style,
            c = resolve(
              checked ? 'color/form-check--checked' : 'color/form-check',
              m.id,
              'COLOR'
            ),
            v = rgba(s.borderTopColor);
          if (
            i.rect.width !== 24 ||
            i.rect.height !== 24 ||
            all[m.id].rect.height !== 40 ||
            parseFloat(s.borderTopWidth) !== 2 ||
            parseFloat(s.borderTopLeftRadius) !==
              resolve('radius/form-input', m.id, 'FLOAT') ||
            l.style.paddingLeft !== '7px' ||
            l.style.paddingRight !== '7px' ||
            ['r', 'g', 'b'].some(
              k => Math.round(c[k] * 255) !== Math.round(v[k] * 255)
            ) ||
            (c.a ?? 1) !== v.a ||
            i.focusVisible ||
            s.boxShadow !== 'none'
          )
            fail('exact Checkbox source leaf');
        }
        const out = frame(id, all, parent);
        out.children = [
          {
            id: 'drawer-' + id + '-checkbox',
            type: 'INSTANCE',
            family: 'drawer-checkbox',
            variant: {
              Checked: checked ? 'True' : 'False',
              State: 'Default',
              LabelPosition: 'After',
              Content: 'Short',
            },
            overrides: { Label: label.undrr.texts[0].characters },
            expose: true,
            layout: {
              width: number(m => all[m].rect.width),
              height: number(m => all[m].rect.height),
            },
          },
        ];
        out.sourceDrawerNode.normalLeaf = 'drawer-checkbox';
        return out;
      }
      if (n.tag === 'BUTTON' && n.classes.includes('mg-button-')) {
        const emphasis = n.classes.includes('mg-button-primary')
          ? 'Primary'
          : 'Secondary';
        for (const m of modes) {
          const s = all[m.id].style,
            button = styles.text.find(x => x.id === 'component.button'),
            v = button.values[m.id];
          if (
            s.fontFamily.split(',')[0] !== v.fontName.family ||
            s.fontWeight !== '600' ||
            parseFloat(s.fontSize) !== v.fontSize ||
            parseFloat(s.lineHeight) !== v.fontSize ||
            s.paddingTop !==
              resolve('padding/button/block', m.id, 'FLOAT') + 'px'
          )
            fail('exact Button source font/padding');
          for (const [roleName, field] of [
            [
              emphasis === 'Primary'
                ? 'color/button-background'
                : 'color/button-secondary-background',
              'backgroundColor',
            ],
            ['color/button', 'color'],
            [
              emphasis === 'Primary'
                ? 'border-color/button-primary'
                : 'border-color/button-secondary',
              'borderTopColor',
            ],
          ]) {
            const c = resolve(roleName, m.id, 'COLOR'),
              v = rgba(s[field]);
            if (
              ['r', 'g', 'b'].some(
                k => Math.round(c[k] * 255) !== Math.round(v[k] * 255)
              ) ||
              (c.a ?? 1) !== v.a
            )
              fail('exact Button source paint ' + roleName);
          }
          if (
            parseFloat(s.paddingBottom) !==
              resolve('padding/button/block', m.id, 'FLOAT') ||
            ['Left', 'Right'].some(
              e =>
                parseFloat(s['padding' + e]) !==
                resolve('padding/button/inline', m.id, 'FLOAT')
            )
          )
            fail('Button full authored padding');
          for (const e of ['Top', 'Right', 'Bottom', 'Left'])
            if (
              parseFloat(s['border' + e + 'Width']) !==
              resolve('border-width/button', m.id, 'FLOAT')
            )
              fail('Button border');
          for (const c of ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'])
            if (
              parseFloat(s['border' + c + 'Radius']) !==
              resolve('radius/button', m.id, 'FLOAT')
            )
              fail('Button radius');
        }
        const out = frame(id, all, parent);
        delete out.fill;
        delete out.stroke;
        delete out.effectStyle;
        delete out.bindings.strokeWeight;
        for (const e of ['Top', 'Right', 'Bottom', 'Left'])
          delete out.bindings['stroke' + e + 'Weight'];
        out.children = [
          {
            id: 'drawer-' + id + '-button',
            type: 'INSTANCE',
            family: 'page-chrome-button',
            variant: {
              Emphasis: emphasis,
              Treatment: 'Filled',
              State: 'Default',
            },
            overrides: { Label: n.texts[0].characters },
            expose: true,
            layout: {
              width: number(m => all[m].rect.width),
              height: number(m => all[m].rect.height),
            },
          },
        ];
        out.sourceDrawerNode.normalLeaf = 'page-chrome-button';
        return out;
      }
      const out = frame(id, all, parent);
      if (n.classes === 'mg-icon mg-icon-close') {
        const markup = read(ASSET + 'close-source-mask.svg')
          .toString()
          .trim();
        for (const m of modes)
          if (
            decodeURIComponent(
              all[m.id].before.maskImage.slice(5, -2).split(',')[1]
            ) !== markup ||
            all[m.id].before.width !== '18px' ||
            all[m.id].before.height !== '18px' ||
            all[m.id].before.display !== 'block'
          )
            fail('exact close mask');
        out.children = [
          {
            id: 'drawer-' + id + '-mask',
            type: 'SVG',
            name: 'Actual source close CSS mask',
            svg: {
              assetId: 'drawer-close-source-mask',
              markup: markup.replaceAll('currentColor', '#000'),
              monochrome: {
                strokes: color(
                  m => all[m].style.color,
                  state === 'close-hover'
                    ? 'color/neutral-900'
                    : 'color/neutral-600'
                ),
              },
            },
            layout: { width: 18, height: 18 },
          },
        ];
        return out;
      }
      for (const child of sample.nodes.filter(x => x.parentId === id))
        out.children.push(convert(child.id));
      if (n.texts.length) {
        if (n.texts.length !== 1 || out.children.length)
          fail('mixed text ' + id);
        const chars = n.texts[0].characters,
          left = m =>
            parseFloat(all[m].style.paddingLeft) +
            parseFloat(all[m].style.borderLeftWidth),
          top = m =>
            parseFloat(all[m].style.paddingTop) +
            parseFloat(all[m].style.borderTopWidth);
        const t = {
          id: 'drawer-' + id + '-text',
          type: 'TEXT',
          name: 'Actual source ' + n.tag,
          characters: chars,
          textStyle: font(all),
          fill: color(
            m => all[m].style.color,
            n.tag === 'A' ? 'color/interactive' : 'color/neutral-900'
          ),
          textProperty: context + ' ' + id + ' text',
          textWrap:
            n.style.textWrapStyle === 'pretty'
              ? 'PRETTY'
              : n.style.textWrapStyle === 'balance'
                ? 'BALANCE'
                : 'AUTO',
          layout: {
            width: number(m =>
              Math.max(
                0.001,
                all[m].rect.width -
                  left(m) -
                  parseFloat(all[m].style.paddingRight) -
                  parseFloat(all[m].style.borderRightWidth)
              )
            ),
            height: 'HUG',
          },
          absolute: {
            horizontal: 'START',
            vertical: 'START',
            offsetX: number(left),
            offsetY: number(top),
          },
        };
        if (n.style.textDecorationLine === 'underline') {
          if (
            modes.some(m => all[m.id].style.textDecorationLine !== 'underline')
          )
            fail('link decoration');
          t.textDecoration = 'UNDERLINE';
          if (n.style.textUnderlineOffset !== 'auto')
            t.textUnderlineOffset = {
              unit: 'PIXELS',
              value: parseFloat(n.style.textUnderlineOffset),
            };
          t.sourceHref = n.href;
        }
        const slot = {
          id: 'drawer-' + id + '-text-slot',
          type: 'FRAME',
          name: 'Actual source logical text capacity',
          layout: {
            mode: 'VERTICAL',
            width: t.layout.width,
            height: number(m =>
              Math.max(
                0.001,
                all[m].rect.height -
                  top(m) -
                  parseFloat(all[m].style.paddingBottom) -
                  parseFloat(all[m].style.borderBottomWidth)
              )
            ),
            clipsContent: false,
          },
          absolute: t.absolute,
          children: [t],
        };
        delete t.absolute;
        t.layout.width = 'FILL';
        out.children.push(slot);
      }
      if (n.tag === 'BUTTON' && n.style.outlineStyle === 'solid') {
        for (const m of modes) {
          const s = all[m.id].style;
          if (
            parseFloat(s.outlineWidth) !==
              resolve('focus-ring/width', m.id, 'FLOAT') ||
            parseFloat(s.outlineOffset) !==
              resolve('focus-ring/offset', m.id, 'FLOAT')
          )
            fail('focus source width/offset');
        }
        out.focusRing = {
          color: color(m => all[m].style.outlineColor),
          separatorColor: 'color/neutral-0',
          width: 'focus-ring/width',
          offset: 'focus-ring/offset',
          radius: number(m => parseFloat(all[m].style.borderTopLeftRadius)),
          outerRadius: number(
            m => Math.min(parseFloat(all[m].style.borderTopLeftRadius), 14) + 4
          ),
        };
        delete out.effectStyle;
      }
      return out;
    }
    const rootAll = per(m => ({
      id: 'scene',
      tag: 'DIV',
      classes: 'Source finite Drawer viewport',
      rect: { x: 0, y: 0, width, height: 1000 },
      style: {
        ...captures[m].bodyStyle,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        backgroundImage: 'none',
        borderTopWidth: '0px',
        borderRightWidth: '0px',
        borderBottomWidth: '0px',
        borderLeftWidth: '0px',
        boxShadow: 'none',
        transform: 'none',
        overflowX: 'visible',
        overflowY: 'visible',
      },
    }));
    const tree = frame('scene', rootAll, null);
    tree.layout.clipsContent = true;
    if (sample.backdrop) {
      const all = per(m => ({
        ...captures[m].backdrop,
        id: 'backdrop',
        tag: 'DIV',
        classes: 'Source modal backdrop',
      }));
      tree.children.push(frame('backdrop', all, rootAll));
    }
    const panel = convert('root');
    panel.absolute = {
      horizontal: 'START',
      vertical: 'START',
      offsetX: number(m => captures[m].nodes[0].rect.x),
      offsetY: number(m => captures[m].nodes[0].rect.y),
    };
    tree.children.push(panel);
    variants.push({
      id: 'drawer.' + context,
      name: 'Caller=' + story + ', Viewport=' + width + ', State=' + state,
      properties: { Caller: story, Viewport: String(width), State: state },
      tree,
      sourceContract: {
        story,
        width,
        state,
        sourceModeRects: per(m => captures[m].nodes[0].rect),
        sourceBackdrops: per(m => captures[m].backdrop?.rect || null),
        modal: !!sample.backdrop,
        closedReferenceCount: 100,
        sourceScrollTop: per(
          m =>
            captures[m].nodes.find(n => n.classes.endsWith('__body')).scrollTop
        ),
        nativeAccepted: false,
      },
    });
  }
  const families = [
    {
      id: 'drawer',
      name: 'Mangrove draft / Public Drawer',
      kind: 'component-set',
      review: { genericLabels: false, specimens: [] },
      source: {
        file: 'stories/Components/Navigation/Drawer/Drawer.jsx',
        line: 14,
      },
      description:
        'Actual public source start/end/bottom/floating/vanilla finite stories with nested source Checkbox and Button instances. Closed source references are invisible and not emitted as fake visible panels.',
      limitations: [
        'Finite Chromium source390/1164 viewport1000. Native typography/baseline/painting, responsive widths and source RTL/locales remain open.',
        'Source UA groove fieldset/legend notch projects captured borders as a solid edge candidate; exact UA raster remains open.',
        'Actual source masks, Checkbox background tiling, focus ring corners and linked leaf font/glyph equivalence require native rendering acceptance.',
        'Source bottom scroll-end is a static translated editable body within a real clipped owner; no live scrolling, modal focus/escape/clipboard/route/sanitization semantics are claimed.',
        'Inline source local anchors retain href metadata and decoration, not invented native destinations.',
        'Source trigger outside overlay, arbitrary children/footer content and hydration lifecycle are not native behaviour.',
      ],
      variants,
    },
  ];
  for (const f of families) {
    const ids = new Set();
    for (const v of f.variants) {
      const walk = n => {
        if (!n.id || ids.has(v.id + '/' + n.id)) fail('anatomy id');
        ids.add(v.id + '/' + n.id);
        (n.children || []).forEach(walk);
      };
      walk(v.tree);
    }
  }
  target.variables.splice(0, target.variables.length, ...variables);
  target.styles.text.splice(0, target.styles.text.length, ...styles.text);
  target.styles.effect.splice(0, target.styles.effect.length, ...styles.effect);
  return families;
}
module.exports = { buildDrawerRecipes, buildDrawerCheckboxDependency };
