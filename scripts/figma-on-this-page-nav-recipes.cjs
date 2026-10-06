'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const ASSET = 'examples/figma-plugin/holistic/assets/on-this-page-nav/';
const PROVENANCE =
  '640e264f5c9009c0d2a5f2a328eb9166c3e68de3d2fbb3463653164b435c36e0';
function sourcePaths(scene) {
  const paths = new Map(),
    counters = new Map();
  for (const n of scene.tree) {
    let p;
    if (n.index === 0) p = 'root';
    else if (n.classes.includes('__scroll-btn--prev')) p = 'prev';
    else if (n.classes.includes('__scroll-btn--next')) p = 'next';
    else if (n.classes === 'mg-on-this-page-nav__list') p = 'list';
    else if (n.classes === 'mg-on-this-page-nav__cta') p = 'cta';
    else if (n.classes === 'mg-on-this-page-nav__item') {
      const i = counters.get('item') || 0;
      counters.set('item', i + 1);
      p = 'list/item-' + i;
    } else if (n.classes.includes('mg-on-this-page-nav__link'))
      p = paths.get(n.parentIndex) + '/link';
    else if (n.tag.toLowerCase() === 'svg')
      p = paths.get(n.parentIndex) + '/icon';
    else if (n.tag.toLowerCase() === 'path')
      p = paths.get(n.parentIndex) + '/path';
    else throw Error('Unknown OnThisPageNav source anatomy ' + n.tag);
    paths.set(n.index, p);
  }
  return new Map(scene.tree.map(n => [paths.get(n.index), n]));
}
function buildOnThisPageNavRecipes({ root, modes, variables, styles }) {
  const target = { variables, styles };
  variables = structuredClone(variables);
  styles = structuredClone(styles);
  const fail = s => {
      throw Error('OnThisPageNav source changed: ' + s);
    },
    sha = b => crypto.createHash('sha256').update(b).digest('hex'),
    read = f => fs.readFileSync(path.join(root, f));
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
  const archive = JSON.parse(read(ASSET + 'source-footprints.json'));
  function restore(x) {
    if (Array.isArray(x)) return x.map(restore);
    if (x && typeof x === 'object') {
      if (Object.keys(x).join(',') === '$sourceStyle') {
        if (!archive.styles[x.$sourceStyle]) fail('archive style');
        return archive.styles[x.$sourceStyle];
      }
      return Object.fromEntries(
        Object.entries(x).map(([k, v]) => [k, restore(v)])
      );
    }
    return x;
  }
  if (archive.format !== 'lossless-css-intern-v1') fail('archive format');
  const scenes = restore(archive.data).cases;
  const per = fn => Object.fromEntries(modes.map(m => [m.id, fn(m)]));
  function resolve(name, m, type, seen = new Set()) {
    if (seen.has(name)) fail('alias cycle');
    seen.add(name);
    const v = variables.find(v => v.name === name);
    if (!v || v.type !== type || v.values[m.id] === undefined)
      fail('typed foundation ' + name);
    const value = v.values[m.id];
    return value?.alias ? resolve(value.alias, m, type, seen) : value;
  }
  function upsert(list, e) {
    const hits = list.filter(v => v.id === e.id || v.name === e.name);
    if (hits.length > 1 || hits.some(v => v.id !== e.id || v.name !== e.name))
      fail('foreign identity');
    if (list === variables) {
      if (hits.some(v => v.type !== e.type)) fail('variable type');
    } else {
      const kind = list === styles.text ? 'TEXT' : 'EFFECT',
        other = list === styles.text ? styles.effect : styles.text;
      if (other.some(v => v.id === e.id || v.name === e.name))
        fail('cross style identity');
      for (const v of hits) {
        if (v.type !== undefined && v.type !== kind) fail('style kind');
        if (
          Object.keys(v.values || {})
            .sort()
            .join(',') !==
          modes
            .map(m => m.id)
            .sort()
            .join(',')
        )
          fail('style modes');
        for (const m of modes) {
          const x = v.values[m.id];
          if (
            kind === 'EFFECT'
              ? !Array.isArray(x)
              : !x ||
                typeof x !== 'object' ||
                Array.isArray(x) ||
                !x.fontName ||
                typeof x.fontName !== 'object' ||
                Array.isArray(x.fontName) ||
                typeof x.fontName.family !== 'string' ||
                !x.fontName.family.trim() ||
                typeof x.fontName.style !== 'string' ||
                !x.fontName.style.trim()
          )
            fail('style shape');
        }
      }
    }
    if (hits.length) list[list.indexOf(hits[0])] = e;
    else list.push(e);
  }
  function role(key, type, values) {
    const name = 'component/on-this-page-nav/' + key;
    upsert(variables, {
      id: name.replaceAll('/', '.'),
      name,
      type,
      scopes: ['ALL_SCOPES'],
      values,
    });
    return name;
  }
  function number(key, values) {
    if (Object.values(values).some(v => !Number.isFinite(v)))
      fail('finite allocation');
    const a = Object.values(values);
    return a.every(v => v === a[0]) ? a[0] : role(key, 'FLOAT', values);
  }
  function color(raw) {
    const match = /^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/.exec(raw);
    if (!match) fail('source color ' + raw);
    return {
      r: +match[1] / 255,
      g: +match[2] / 255,
      b: +match[3] / 255,
      a: match[4] === undefined ? 1 : +match[4],
    };
  }
  function paint(key, fn, semantic) {
    return role(
      key,
      'COLOR',
      per(m => {
        const x = color(fn(m));
        if (semantic) {
          const value = resolve(semantic(m), m, 'COLOR');
          if (
            ['r', 'g', 'b'].some(
              k => Math.round(value[k] * 255) !== Math.round(x[k] * 255)
            ) ||
            (value.a ?? 1) !== x.a
          )
            fail('authored paint ' + semantic(m));
          return { alias: semantic(m) };
        }
        return x;
      })
    );
  }
  const contracts = Object.keys(scenes)
    .filter(k => k.startsWith('undrr-'))
    .map(k => k.slice(6));
  if (contracts.length !== 42 || Object.keys(scenes).length !== 210)
    fail('42 finite contracts /210 source scenes');
  const variants = [];
  for (const entry of contracts.flatMap(key =>
    key === 'rtl-390-initial'
      ? modes.map(m => ({ key, capture: m.id }))
      : [{ key, capture: null }]
  )) {
    const contract =
      entry.key + (entry.capture ? '-capture-' + entry.capture : '');
    const all = Object.fromEntries(
      modes.map(m => {
        const s = scenes[m.id + '-' + entry.key];
        if (!s || !s.navHTML.includes('data-mg-on-this-page-nav-initialized'))
          fail('hydrated source');
        return [m.id, sourcePaths(s)];
      })
    );
    if (entry.capture) {
      const captured = sourcePaths(scenes[entry.capture + '-' + entry.key]);
      for (const m of modes) {
        const actual = all[m.id];
        all[m.id] = new Map(
          [...captured].map(([p, n]) => [
            p,
            { ...n, style: actual.get(p)?.style || n.style },
          ])
        );
      }
    }
    const paths = [
      ...new Set(modes.flatMap(m => [...all[m.id].keys()])),
    ].filter(p => !p.endsWith('/path'));
    const sample = p => modes.map(m => all[m.id].get(p)).find(Boolean),
      at = (m, p) => all[m.id].get(p) || sample(p),
      css = (m, p) => at(m, p).style;
    for (const p of paths) {
      const n = sample(p);
      for (const m of modes) {
        const actual = all[m.id].get(p);
        if (
          actual &&
          (actual.tag !== n.tag ||
            actual.text !== n.text ||
            actual.href !== n.href ||
            +actual.style.opacity !== 1)
        )
          fail('anatomy/copy/opacity');
      }
    }
    const prefix = contract + '/',
      num = (p, key, fn) =>
        number(
          prefix + p + '/' + key,
          per(m => fn(m))
        ),
      width = p => num(p, 'width', m => at(m, p).rect.width),
      height = p => num(p, 'height', m => at(m, p).rect.height),
      offset = (p, axis, parent) =>
        role(
          prefix + p + '/' + axis,
          'FLOAT',
          per(m => at(m, p).rect[axis] - at(m, parent).rect[axis])
        );
    const projection = new Map();
    function frame(p, parent) {
      const n = sample(p),
        spec = {
          id: p === 'root' ? 'root' : p.replaceAll('/', '-'),
          type: 'FRAME',
          fill: null,
          layout: {
            mode: 'VERTICAL',
            width: width(p),
            height: height(p),
            clipsContent: false,
          },
          children: [],
        };
      if (parent)
        spec.absolute = {
          horizontal: 'START',
          vertical: 'START',
          offsetX: offset(p, 'x', parent),
          offsetY: offset(p, 'y', parent),
        };
      if (modes.some(m => !all[m.id].has(p)))
        spec.bindings = {
          visible: role(
            prefix + p + '/visible',
            'BOOLEAN',
            per(m => all[m.id].has(p))
          ),
        };
      return spec;
    }
    function effect(p, spec) {
      const shadows = per(m => css(m, p)['box-shadow']);
      if (Object.values(shadows).every(v => v === 'none')) return;
      const id =
        'component.on-this-page-nav.' +
        contract +
        '.' +
        p.replaceAll('/', '.') +
        '.effect';
      const byMode = {};
      for (const m of modes) {
        const s = shadows[m.id];
        const matches = [
          ...s.matchAll(
            /(rgba?\([^)]+\)) (-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px (-?[\d.]+)px( inset)?/g
          ),
        ];
        if (!matches.length) fail('shadow parser');
        byMode[m.id] = matches.map(x => ({
          effect: {
            type: x[6] ? 'INNER_SHADOW' : 'DROP_SHADOW',
            color: color(x[1]),
            offset: { x: +x[2], y: +x[3] },
            radius: +x[4],
            spread: +x[5],
            visible: true,
            blendMode: 'NORMAL',
          },
        }));
      }
      upsert(styles.effect, {
        id,
        name: 'Mangrove/Source OnThisPageNav/' + contract + '/' + p + '/effect',
        values: byMode,
      });
      spec.effectStyle = id;
    }
    const rootSpec = frame('root');
    rootSpec.fill = paint(
      prefix + 'root/surface',
      m => css(m, 'root')['background-color'],
      () => 'color/neutral-0'
    );
    effect('root', rootSpec);
    if (
      modes.some(m => parseFloat(css(m, 'root')['border-bottom-width']) > 0)
    ) {
      rootSpec.stroke = paint(
        prefix + 'root/border',
        m => css(m, 'root')['border-bottom-color'],
        () => 'color/neutral-50'
      );
      rootSpec.strokeAlign = 'INSIDE';
      rootSpec.bindings = Object.fromEntries(
        ['Top', 'Right', 'Bottom', 'Left'].map(side => [
          'stroke' + side + 'Weight',
          role(
            prefix + 'root/stroke-' + side.toLowerCase(),
            'FLOAT',
            per(m =>
              parseFloat(
                css(m, 'root')['border-' + side.toLowerCase() + '-width']
              )
            )
          ),
        ])
      );
    }
    projection.set('root', rootSpec);
    for (const p of paths.filter(p => p !== 'root')) {
      const n = sample(p);
      let parent = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : 'root';
      if (parent === 'list') parent = 'list-content';
      const owner = projection.get(parent);
      if (!owner) fail('parent ' + parent);
      const logicalParent = parent === 'list-content' ? 'list' : parent;
      if (p === 'list') {
        const list = frame(p, 'root');
        list.id = 'list';
        list.layout.clipsContent = true;
        const zero = role(
            prefix + 'list/mask-zero',
            'FLOAT',
            per(() => 0)
          ),
          mask = {
            id: 'list-mask',
            type: 'FRAME',
            alphaMask: { type: 'ALPHA' },
            layout: { mode: 'NONE', width: width(p), height: height(p) },
            absolute: {
              horizontal: 'START',
              vertical: 'START',
              offsetX: zero,
              offsetY: zero,
            },
          };
        const alpha1 = role(
            prefix + 'list/mask-opaque',
            'COLOR',
            per(() => ({ r: 0, g: 0, b: 0, a: 1 }))
          ),
          alpha0 = role(
            prefix + 'list/mask-transparent',
            'COLOR',
            per(() => ({ r: 0, g: 0, b: 0, a: 0 }))
          );
        const both = css(modes[0], p)['mask-image'].startsWith(
          'linear-gradient(to right, rgba'
        );
        if (
          modes.some(
            m =>
              css(m, p)['mask-image'].startsWith(
                'linear-gradient(to right, rgba'
              ) !== both
          )
        )
          fail('mask topology differs');
        const fade = per(m => resolve('spacing/500', m, 'FLOAT'));
        for (const m of modes) {
          if (
            css(m, p)['mask-image'] !==
            (both
              ? 'linear-gradient(to right, rgba(0, 0, 0, 0), rgb(0, 0, 0) ' +
                fade[m.id] +
                'px, rgb(0, 0, 0) calc(100% - ' +
                fade[m.id] +
                'px), rgba(0, 0, 0, 0))'
              : 'linear-gradient(to right, rgb(0, 0, 0) calc(100% - ' +
                fade[m.id] +
                'px), rgba(0, 0, 0, 0))')
          )
            fail('source mask');
          if (at(m, p).rect.width < fade[m.id])
            fail('unsupported short mask extent');
        }
        const first = num(
            p,
            'mask-first-stop',
            m =>
              (both ? fade[m.id] : at(m, p).rect.width - fade[m.id]) /
              at(m, p).rect.width
          ),
          second = both
            ? num(
                p,
                'mask-second-stop',
                m =>
                  Math.max(fade[m.id], at(m, p).rect.width - fade[m.id]) /
                  at(m, p).rect.width
              )
            : null;
        mask.gradient = {
          layers: [
            {
              transform: [
                [1, 0, 0],
                [0, 1, 0],
              ],
              stops: [
                { position: 0, color: both ? alpha0 : alpha1 },
                { position: first, color: alpha1 },
                ...(both ? [{ position: second, color: alpha1 }] : []),
                { position: 1, color: alpha0 },
              ],
            },
          ],
        };
        const content = {
          id: 'list-content',
          type: 'FRAME',
          fill: null,
          layout: {
            mode: 'VERTICAL',
            width: width(p),
            height: height(p),
            clipsContent: false,
          },
          children: [],
        };
        list.children = [mask, content];
        owner.children.push(list);
        projection.set('list', list);
        projection.set('list-content', content);
        continue;
      }
      if (n.tag.toLowerCase() === 'svg') {
        const markup = n.svg
          .replace(/ (?:aria-hidden|focusable)="[^"]*"/g, '')
          .replaceAll('currentColor', '#000000');
        const flipped =
          css(modes[0], p).transform === 'matrix(-1, 0, 0, 1, 0, 0)';
        if (
          modes.some(
            m =>
              css(m, p).transform !== css(modes[0], p).transform ||
              at(m, p).rect.width !== 16 ||
              at(m, p).rect.height !== 16
          )
        )
          fail('source arrow SVG transform/viewport');
        const transformed = flipped
          ? markup.replace(
              /(<svg[^>]*>)([\s\S]*)(<\/svg>)/,
              '$1<g transform="matrix(-1 0 0 1 16 0)">$2</g>$3'
            )
          : markup;
        const slot = frame(p, logicalParent);
        slot.id = p.replaceAll('/', '-') + '-slot';
        slot.children = [
          {
            id: p.replaceAll('/', '-') + '-source-vector',
            type: 'SVG',
            svg: {
              assetId:
                'on-this-page-nav-' +
                p.replaceAll('/', '-') +
                (flipped ? '-rtl' : ''),
              markup: transformed,
              monochrome: {
                strokes: paint(
                  prefix + p + '/stroke',
                  m => css(m, p).color,
                  m =>
                    css(m, parent).color === css(m, 'root').color
                      ? 'color/neutral-600'
                      : all[m.id].get(parent)?.hover
                        ? 'color/interactive-active'
                        : 'color/neutral-600'
                ),
              },
            },
            layout: { width: 16, height: 16 },
          },
        ];
        owner.children.push(slot);
        continue;
      }
      const spec = frame(p, logicalParent);
      effect(p, spec);
      if (n.tag === 'BUTTON' || p === 'cta')
        spec.fill = paint(
          prefix + p + '/surface',
          m => css(m, p)['background-color'],
          m =>
            p === 'cta'
              ? all[m.id].get(p)?.hover
                ? 'color/interactive-active'
                : 'color/interactive'
              : 'color/neutral-0'
        );
      if (n.tag === 'A') {
        const arabic = contract.startsWith('rtl-'),
          fontRole = arabic
            ? role(
                prefix + p + '/source-ui-family',
                'STRING',
                per(() => 'Noto Sans Arabic')
              )
            : 'font-family/ui';
        for (const m of modes) {
          const s = css(m, p);
          if (
            s['text-wrap-mode'] !== 'nowrap' ||
            s['white-space-collapse'] !== 'collapse' ||
            s['font-weight'] !== '600' ||
            s['font-style'] !== 'normal'
          )
            fail('source nowrap600');
          if (
            parseFloat(s['font-size']) !==
              resolve('font-size/300', m, 'FLOAT') ||
            !s['font-family'].includes(resolve(fontRole, m, 'STRING'))
          )
            fail('source font aliases');
        }
        const ink = paint(
          prefix + p + '/ink',
          m => css(m, p).color,
          m =>
            p === 'cta'
              ? 'color/neutral-0'
              : all[m.id].get(p)?.classes.includes('__link--active')
                ? 'color/interactive'
                : all[m.id].get(p)?.hover
                  ? 'color/interactive-active'
                  : 'color/neutral-600'
        );
        const styleId =
          'component.on-this-page-nav.' +
          contract +
          '.' +
          p.replaceAll('/', '.') +
          '.text';
        upsert(styles.text, {
          id: styleId,
          name: 'Mangrove/Source OnThisPageNav/' + contract + '/' + p + '/text',
          bindings: { fontFamily: fontRole, fontSize: 'font-size/300' },
          values: per(m => ({
            fontName: { family: resolve(fontRole, m, 'STRING'), style: 'Bold' },
            fontSize: parseFloat(css(m, p)['font-size']),
            lineHeight: {
              unit: 'PIXELS',
              value: parseFloat(css(m, p)['line-height']),
            },
            letterSpacing: { unit: 'PIXELS', value: 0 },
            paragraphSpacing: 0,
          })),
        });
        const pad = (m, side) => parseFloat(css(m, p)['padding-' + side]),
          border = (m, side) =>
            parseFloat(css(m, p)['border-' + side + '-width']);
        spec.sourceHref = n.href;
        spec.children.push({
          id: p.replaceAll('/', '-') + '-label',
          type: 'TEXT',
          characters: n.text,
          textStyle: styleId,
          fill: ink,
          textProperty: 'OnThisPageNav ' + contract + ' ' + p + ' label',
          textAlign: n.style.direction === 'rtl' ? 'RIGHT' : 'LEFT',
          textWrap: 'AUTO',
          layout: {
            width: num(
              p,
              'content-width',
              m =>
                at(m, p).rect.width -
                pad(m, 'left') -
                pad(m, 'right') -
                border(m, 'left') -
                border(m, 'right')
            ),
            height: num(
              p,
              'content-height',
              m =>
                at(m, p).rect.height -
                pad(m, 'top') -
                pad(m, 'bottom') -
                border(m, 'top') -
                border(m, 'bottom')
            ),
          },
          absolute: {
            horizontal: 'START',
            vertical: 'START',
            offsetX: role(
              prefix + p + '/content-x',
              'FLOAT',
              per(m => pad(m, 'left') + border(m, 'left'))
            ),
            offsetY: role(
              prefix + p + '/content-y',
              'FLOAT',
              per(m => pad(m, 'top') + border(m, 'top'))
            ),
          },
        });
        if (p !== 'cta') {
          spec.stroke = paint(
            prefix + p + '/border',
            m => css(m, p)['border-bottom-color']
          );
          spec.strokeAlign = 'INSIDE';
          spec.bindings = {
            ...spec.bindings,
            strokeTopWeight: role(
              prefix + p + '/stroke-top',
              'FLOAT',
              per(() => 0)
            ),
            strokeLeftWeight: role(
              prefix + p + '/stroke-left',
              'FLOAT',
              per(() => 0)
            ),
            strokeRightWeight: role(
              prefix + p + '/stroke-right',
              'FLOAT',
              per(() => 0)
            ),
            strokeBottomWeight: role(
              prefix + p + '/stroke-bottom',
              'FLOAT',
              per(m => border(m, 'bottom'))
            ),
          };
        }
        if (n.focusVisible) {
          if (modes.some(m => !at(m, p).focusVisible)) fail('focus topology');
          const ow = parseFloat(n.style['outline-width']),
            oo = parseFloat(n.style['outline-offset']);
          if (n.style['outline-style'] !== 'solid' || ow !== 2 || oo !== 2)
            fail('focus outline');
          spec.children.unshift({
            id: p.replaceAll('/', '-') + '-focus-outline',
            type: 'FRAME',
            fill: null,
            stroke: paint(
              prefix + p + '/focus-outline',
              m => css(m, p)['outline-color'],
              () => 'color/focus-ring'
            ),
            strokeAlign: 'INSIDE',
            bindings: {
              strokeWeight: role(
                prefix + p + '/focus-width',
                'FLOAT',
                per(m => parseFloat(css(m, p)['outline-width']))
              ),
            },
            layout: {
              mode: 'NONE',
              width: num(
                p,
                'focus-width',
                m =>
                  at(m, p).rect.width +
                  2 *
                    (parseFloat(css(m, p)['outline-width']) +
                      parseFloat(css(m, p)['outline-offset']))
              ),
              height: num(
                p,
                'focus-height',
                m =>
                  at(m, p).rect.height +
                  2 *
                    (parseFloat(css(m, p)['outline-width']) +
                      parseFloat(css(m, p)['outline-offset']))
              ),
            },
            absolute: {
              horizontal: 'START',
              vertical: 'START',
              offsetX: role(
                prefix + p + '/focus-offset-x',
                'FLOAT',
                per(() => -4)
              ),
              offsetY: role(
                prefix + p + '/focus-offset-y',
                'FLOAT',
                per(() => -4)
              ),
            },
          });
        }
      }
      owner.children.push(spec);
      projection.set(p, spec);
    }
    variants.push({
      id: 'on-this-page-nav.' + contract,
      name:
        'SourceContext=' +
        entry.key +
        ', CaptureTheme=' +
        (entry.capture || 'All'),
      properties: {
        SourceContext: entry.key,
        CaptureTheme: entry.capture || 'All',
      },
      tree: rootSpec,
      sourceContract: {
        sourceStory: contract.replace(/-(390|1164)-.*$/, ''),
        sourceViewport: scenes['undrr-' + entry.key].viewport,
        sourceCaseContract: entry.key,
        sourceCaptureTheme: entry.capture || 'All',
        sourceCaptureThemes: modes.map(m => m.id),
        sourceState: contract,
        sourceRuntime:
          'Actual hydrated source nav only; scrollspy, sticky docking, click/tab integration, keyboard and live horizontal scrolling remain runtime gates',
        rtlMask:
          'Actual physical to-right gradient retained including documented RTL correction gap',
        maskNativeRenderingAccepted: false,
      },
    });
  }
  const family = {
    id: 'on-this-page-nav',
    name: 'Mangrove/Source OnThisPageNav',
    kind: 'component-set',
    review: { preserveVariantSizing: true, genericLabels: false },
    variants,
    sourceRef: {
      file: 'stories/Components/OnThisPageNav/OnThisPageNav.jsx',
      line: 35,
    },
    limitations: [
      '46 finite hydrated nine-story and interaction appearances only. Internal href metadata is preserved without invented native URLs or scrollspy/navigation behavior.',
      'Source horizontal alpha masks enclose actual editable list subtrees. Native masks retained flags but failed isolated fade exports; native rendering remains failed/open, and no opaque wash substitutes.',
      'Source font600 is provisional Bold700; Arabic system fallback/glyph shaping, native fonts/baselines/pixels and arbitrary edited label flow remain open.',
      'Five RTL390 initial CaptureTheme variants freeze genuine observed geometry and arrow visibility; source geometry is accepted only for matching build theme. Other41 contracts preserve all-mode geometry. Captured geometry and helper roles are immutable allocation candidates. Sticky/page scroll, list scroll and Tabs control integration are source-observed runtime states rather than native behaviors.',
      'Inset bottom effect and focus outline/white gap are declared source primitive projections, with native clipping/raster gates open.',
    ],
  };
  target.variables.splice(0, target.variables.length, ...variables);
  target.styles.text.splice(0, target.styles.text.length, ...styles.text);
  target.styles.effect.splice(0, target.styles.effect.length, ...styles.effect);
  return [family];
}
module.exports = { buildOnThisPageNavRecipes, sourcePaths };
