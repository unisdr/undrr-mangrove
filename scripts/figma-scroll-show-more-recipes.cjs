/** Actual ScrollContainer/ShowMore source. ALPHA mask drawing is a native-open source candidate. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const BASE = 'examples/figma-plugin/holistic/assets/scroll-show-more/';
const PROVENANCE =
  'ce1c92ff287f9c25525a97b0c10501b92b2b4fdb1c2a61b4dfbcfe8576663c45';
const clone = x => JSON.parse(JSON.stringify(x));
function buildSourceRecipes({ root, modes, variables, styles }, familyId) {
  const photo = familyId === 'scroll-container-photo';
  const targets = { variables, styles };
  variables = clone(variables);
  styles = clone(styles);
  const fail = x => {
    throw Error('Scroll/ShowMore source recipe needs updating: ' + x);
  };
  const read = p => fs.readFileSync(path.join(root, p));
  const hash = x => crypto.createHash('sha256').update(x).digest('hex');
  if (hash(read(BASE + 'provenance.json')) !== PROVENANCE)
    fail('Provenance drift');
  const provenance = JSON.parse(read(BASE + 'provenance.json'));
  for (const [p, h] of Object.entries(provenance.sourceHashes))
    if (hash(read(p)) !== h) fail('Source drift ' + p);
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Five exact modes required');
  const source = JSON.parse(read(BASE + 'source-footprints.json'));
  if (source.scenes.length !== 230)
    fail('Exact230 captured source records required');
  for (const e of JSON.parse(read(BASE + 'foundation-contract.json'))) {
    const v = variables.find(v => v.name === e.name);
    if (
      !v ||
      ['id', 'name', 'type', 'values'].some(
        k => JSON.stringify(v[k]) !== JSON.stringify(e[k])
      )
    )
      fail('Captured foundation changed ' + e.name);
  }
  const per = fn => Object.fromEntries(modes.map(m => [m.id, fn(m.id)]));
  const resolve = (name, m, type, seen = new Set()) => {
    const v = variables.find(v => v.name === name);
    if (!v || v.type !== type || seen.has(name))
      fail('Missing/wrong/cyclic ' + name);
    seen.add(name);
    const x = v.values?.[m];
    if (x === undefined) fail('Missing mode ' + name);
    if (x && typeof x === 'object' && 'alias' in x) {
      if (Object.keys(x).length !== 1) fail('Malformed alias ' + name);
      return resolve(x.alias, m, type, seen);
    }
    return x;
  };
  function upsert(list, e) {
    const kind =
      list === variables
        ? 'VARIABLE'
        : list === styles.text
          ? 'TEXT'
          : 'EFFECT';
    const found = list.filter(v => v.id === e.id || v.name === e.name);
    if (
      found.length > 1 ||
      (found.length &&
        (found[0].id !== e.id ||
          found[0].name !== e.name ||
          (kind === 'VARIABLE'
            ? found[0].type !== e.type
            : found[0].type !== undefined && found[0].type !== kind)))
    )
      fail('Foreign identity ' + e.id);
    if (kind !== 'VARIABLE') {
      if (
        Object.values(styles).some(
          other =>
            Array.isArray(other) &&
            other !== list &&
            other.some(v => v.id === e.id || v.name === e.name)
        )
      )
        fail('Foreign style kind ' + e.id);
      if (
        found.length &&
        (Object.keys(found[0].values || {})
          .sort()
          .join(',') !==
          modes
            .map(m => m.id)
            .sort()
            .join(',') ||
          modes.some(m => {
            const v = found[0].values[m.id];
            return kind === 'TEXT'
              ? !v ||
                  typeof v !== 'object' ||
                  Array.isArray(v) ||
                  !v.fontName ||
                  typeof v.fontName !== 'object' ||
                  Array.isArray(v.fontName) ||
                  typeof v.fontName.family !== 'string' ||
                  !v.fontName.family.trim() ||
                  typeof v.fontName.style !== 'string' ||
                  !v.fontName.style.trim()
              : !Array.isArray(v);
          }))
      )
        fail('Foreign style shape ' + e.id);
    }
    if (found.length) list[list.indexOf(found[0])] = e;
    else list.push(e);
  }
  const ref = {
    file:
      familyId === 'show-more'
        ? 'stories/Utilities/ShowMore/ShowMore.jsx'
        : 'stories/Components/ScrollContainer/ScrollContainerExamples.jsx',
    line: 1,
  };
  let context;
  const role = (key, type, values) => {
    const name =
      'component/' + familyId + '/' + context.replaceAll('.', '/') + '/' + key;
    upsert(variables, {
      id: name.replaceAll('/', '.'),
      name,
      type,
      scopes: ['ALL_SCOPES'],
      values,
      sourceRef: ref,
      description:
        'Finite actual source allocation. Native masks, fonts and reflow remain open.',
    });
    return name;
  };
  const number = (key, values) => {
    if (Object.values(values).some(v => !Number.isFinite(v)))
      fail('Nonfinite ' + key);
    return role(key, 'FLOAT', values);
  };
  const rgba = s => {
    const match = /^rgba?\(([^)]+)\)$/.exec(s);
    if (!match) fail('Unsupported source color ' + s);
    const v = match[1].split(',').map(Number);
    if (![3, 4].includes(v.length) || v.some(n => !Number.isFinite(n)))
      fail('Malformed source color');
    return { r: v[0] / 255, g: v[1] / 255, b: v[2] / 255, a: v[3] ?? 1 };
  };
  const color = (key, values) =>
    role(
      key,
      'COLOR',
      per(m => rgba(values[m]))
    );
  const css = n => source.styles[n.css];
  const font = (key, all) => {
    const values = per(m => {
      const s = css(all[m]);
      const mono =
        s.fontFamily.startsWith('ui-monospace') ||
        s.fontFamily.startsWith('SFMono-Regular');
      const family = mono
        ? 'Menlo'
        : s.fontFamily.includes('Roboto Condensed')
          ? 'Roboto Condensed'
          : s.fontFamily.startsWith('Roboto,')
            ? 'Roboto'
            : null;
      if (
        !family ||
        ![400, 500, 600, 700].includes(+s.fontWeight) ||
        !['normal', 'italic'].includes(s.fontStyle) ||
        !Number.isFinite(parseFloat(s.lineHeight))
      )
        fail('Unsupported source font ' + key);
      if (
        !mono &&
        resolve(
          family === 'Roboto' ? 'font-family/text' : 'font-family/ui',
          m,
          'STRING'
        ) !== family
      )
        fail('Source font family changed');
      return {
        fontName: {
          family,
          style:
            (+s.fontWeight >= 600 ? 'Bold' : 'Regular').replace(
              'Regular',
              s.fontStyle === 'italic' ? 'Italic' : 'Regular'
            ) +
            (+s.fontWeight >= 600 && s.fontStyle === 'italic' ? ' Italic' : ''),
        },
        fontSize: parseFloat(s.fontSize),
        lineHeight: { unit: 'PIXELS', value: parseFloat(s.lineHeight) },
        letterSpacing: {
          unit: 'PIXELS',
          value: s.letterSpacing === 'normal' ? 0 : parseFloat(s.letterSpacing),
        },
        paragraphSpacing: 0,
        paragraphIndent: 0,
      };
    });
    const familyRole = role(
      key + '-family',
      'STRING',
      per(m => values[m].fontName.family)
    );
    const size = number(
      key + '-size',
      per(m => values[m].fontSize)
    );
    const id = 'component.' + familyId + '.' + context + '.' + key;
    upsert(styles.text, {
      id,
      name: 'Mangrove source / ' + id,
      sourceRef: ref,
      bindings: { fontFamily: familyRole, fontSize: size },
      values,
      description:
        'Captured source font/line allocation. Source600 routes to bundled Bold700; system Menlo is a finite browser measurement candidate and native unavailable gate.',
    });
    return id;
  };
  const walk = n => [n, ...n.children.flatMap(walk)];
  const paths = n => {
    const out = new Map();
    function visit(n, id) {
      out.set(id, n);
      n.children.forEach((c, i) => visit(c, id + '-' + i));
    }
    visit(n, 'root');
    return out;
  };
  let photoMirrors, photoImages, photoOutlines;
  if (photo) {
    const base = BASE + 'photo-source/';
    if (
      hash(read(base + 'provenance.json')) !==
      'e67ddf70202b692629ea6ff5891e36d41965925a15ea3b18ce4fd6b66387aa34'
    )
      fail('Photo provenance drift');
    for (const [p, h] of Object.entries(
      JSON.parse(read(base + 'provenance.json')).sourceHashes
    ))
      if (hash(read(p)) !== h) fail('Photo source drift ' + p);
    const raised = styles.effect.filter(
      s => s.id === 'shadow.raised' || s.name === 'Mangrove/shadow/raised'
    );
    if (
      raised.length !== 1 ||
      JSON.stringify(raised[0]) !==
        JSON.stringify(JSON.parse(read(base + 'raised-style-contract.json')))
    )
      fail('Exact raised source effect changed');
    require('./figma-editorial-cta-recipes.cjs').buildEditorialCtaRecipes({
      root,
      modes,
      variables,
      styles,
    });
    photoMirrors = JSON.parse(read(BASE + 'scroll-card-caret-mirror.json'));
    photoImages = JSON.parse(read(BASE + 'image-provenance.json'));
    photoOutlines = JSON.parse(read(base + 'outline-source.json'));
    if (photoMirrors.length !== 10 || photoOutlines.length !== 10)
      fail('Exact photo source mirror/outline cases required');
  }

  const contexts = source.scenes.filter(
    s =>
      s.mode === 'undrr' &&
      (familyId === 'show-more'
        ? s.case.startsWith('show-')
        : photo
          ? s.case.startsWith('scroll-') &&
            s.case !== 'scroll-two-hydrated-on-one-page'
          : s.case === 'scroll-two-hydrated-on-one-page')
  );
  if (contexts.length !== (familyId === 'show-more' ? 18 : photo ? 22 : 6))
    fail('Exact finite source scene count required');
  const variants = [],
    cardVariants = [],
    cardFingerprints = new Map();
  for (const sample of contexts) {
    context = sample.case + '.' + sample.state + '.' + sample.viewport.width;
    const captures = per(m =>
      source.scenes.find(
        s =>
          s.mode === m &&
          s.case === sample.case &&
          s.state === sample.state &&
          s.viewport.width === sample.viewport.width
      )
    );
    if (Object.values(captures).some(s => !s)) fail('Missing scene ' + context);
    const maps = per(m => paths(captures[m].tree));
    if (
      modes.some(
        m =>
          JSON.stringify(
            [...maps[m.id]].map(([p, n]) => [p, n.tag, n.class, n.fullText])
          ) !==
          JSON.stringify(
            [...maps.undrr].map(([p, n]) => [p, n.tag, n.class, n.fullText])
          )
      )
    )
      fail('Mode anatomy/copy changed');
    const lookup = p => per(m => maps[m].get(p));
    function geom(key, all, parent) {
      if (
        modes.some(m => all[m.id].rect.width <= 0 || all[m.id].rect.height <= 0)
      )
        fail('Nonpositive source box ' + key);
      return {
        layout: {
          mode: 'VERTICAL',
          width: number(
            key + '-width',
            per(m => all[m].rect.width)
          ),
          height: number(
            key + '-height',
            per(m => all[m].rect.height)
          ),
          gap: 0,
          ...(familyId === 'scroll-container-hydrated' || photo
            ? {
                clipsContent:
                  ['hidden', 'auto', 'scroll', 'clip'].includes(
                    css(all.undrr).overflowX
                  ) ||
                  ['hidden', 'auto', 'scroll', 'clip'].includes(
                    css(all.undrr).overflowY
                  ),
              }
            : {}),
        },
        ...(parent
          ? {
              absolute: {
                horizontal: 'START',
                vertical: 'START',
                offsetX: number(
                  key + '-x',
                  per(m => all[m].rect.x - parent[m].rect.x)
                ),
                offsetY: number(
                  key + '-y',
                  per(m => all[m].rect.y - parent[m].rect.y)
                ),
              },
            }
          : {}),
      };
    }
    function paint(spec, key, all) {
      const raised = photo && all.undrr.tag === 'ARTICLE';
      const focused =
        photo &&
        all.undrr.tag === 'BUTTON' &&
        css(all.undrr).outlineStyle === 'solid';
      if (
        modes.some(
          m =>
            css(all[m.id]).backgroundImage !== 'none' ||
            (css(all[m.id]).boxShadow !== 'none' && !raised && !focused)
        )
      )
        fail('Unsupported background/effect ' + key);
      if (raised) {
        if (
          modes.some(
            m =>
              css(all[m.id]).boxShadow !==
              'rgba(77, 77, 77, 0.24) 0px 0px 0px 1px inset'
          )
        )
          fail('Raised source paint changed');
        spec.effectStyle = 'shadow.raised';
      }
      if (focused) {
        for (const m of modes) {
          const actual = css(all[m.id]);
          const a = rgba(actual.outlineColor),
            b = resolve('color/focus-ring', m.id, 'COLOR');
          if (
            actual.outlineWidth !== '2px' ||
            actual.outlineOffset !== '2px' ||
            actual.boxShadow !== 'rgb(255, 255, 255) 0px 0px 0px 2px' ||
            ['r', 'g', 'b'].some(
              k => Math.round(a[k] * 255) !== Math.round(b[k] * 255)
            ) ||
            a.a !== (b.a ?? 1)
          )
            fail('Captured circular focus role changed');
        }
        spec.focusRing = {
          color: 'color/focus-ring',
          separatorColor: 'color/neutral-0',
          width: 'focus-ring/width',
          offset: 'focus-ring/offset',
          radius: number(
            key + '-focus-radius',
            per(m => all[m].rect.width / 2)
          ),
        };
      }
      if (photo && all.undrr.class === 'mg-card__visual') {
        spec.stroke = color(
          key + '-image-outline',
          per(() => 'rgba(0, 0, 0, 0.1)')
        );
        spec.strokeAlign = 'OUTSIDE';
        spec.bindings = {};
      }
      spec.fill = color(
        key + '-background',
        per(m => css(all[m]).backgroundColor)
      );
      spec.bindings = {
        opacity: number(
          key + '-opacity',
          per(m => +css(all[m]).opacity * 100)
        ),
      };
      if (photo && all.undrr.class === 'mg-card__visual') {
        spec.bindings.strokeWeight = number(
          key + '-image-outline-width',
          per(() => 1)
        );
      }
      for (const [field, side] of [
        ['topLeftRadius', 'TopLeft'],
        ['topRightRadius', 'TopRight'],
        ['bottomLeftRadius', 'BottomLeft'],
        ['bottomRightRadius', 'BottomRight'],
      ])
        spec.bindings[field] = number(
          key + '-' + field,
          per(m => {
            const v = css(all[m])['border' + side + 'Radius'];
            return photo && v.endsWith('%')
              ? (parseFloat(v) * all[m].rect.width) / 100
              : parseFloat(v);
          })
        );
      const edges = ['Top', 'Right', 'Bottom', 'Left'];
      if (
        edges.some(e => parseFloat(css(all.undrr)['border' + e + 'Width']) > 0)
      ) {
        const active = edges.find(
          e => parseFloat(css(all.undrr)['border' + e + 'Width']) > 0
        );
        spec.stroke = color(
          key + '-stroke',
          per(m => css(all[m])['border' + active + 'Color'])
        );
        spec.bindings.strokeWeight = number(
          key + '-stroke-zero',
          per(() => 0)
        );
        for (const e of edges)
          spec.bindings['stroke' + e + 'Weight'] = number(
            key + '-stroke-' + e,
            per(m => parseFloat(css(all[m])['border' + e + 'Width']))
          );
      }
    }
    function text(all, key) {
      const n = all.undrr;
      const pieces = [];
      function collect(n, id) {
        for (const item of n.childOrder) {
          if ('text' in item && item.text)
            pieces.push({ characters: item.text, path: id });
          else if ('index' in item)
            collect(n.children[item.index], id + '-' + item.index);
        }
      }
      const sourcePath = [...maps.undrr].find(([, x]) => x === n)[0];
      collect(n, sourcePath);
      if (!pieces.length) return null;
      const chars = pieces.map(p => p.characters).join('');
      if (chars !== n.fullText)
        fail('Whole logical source text changed ' + key);
      const left = per(
          m =>
            parseFloat(css(all[m]).paddingLeft) +
            parseFloat(css(all[m]).borderLeftWidth)
        ),
        right = per(
          m =>
            parseFloat(css(all[m]).paddingRight) +
            parseFloat(css(all[m]).borderRightWidth)
        );
      const out = {
        id: key + '-text',
        type: 'TEXT',
        name:
          familyId === 'show-more'
            ? 'Actual whole ShowMore source text'
            : photo
              ? 'Actual whole photo Scroll source text'
              : 'Actual whole hydrated source text',
        characters: chars,
        layout: {
          width: number(
            key + '-text-capacity',
            per(m => all[m].rect.width - left[m] - right[m])
          ),
          height: 'HUG',
        },
        textAlign: css(n).textAlign === 'center' ? 'CENTER' : 'LEFT',
        textWrap: css(n).textWrapStyle.toUpperCase(),
      };
      if (
        !['AUTO', 'BALANCE', 'PRETTY'].includes(out.textWrap) ||
        modes.some(m => css(all[m.id]).textWrapStyle !== css(n).textWrapStyle)
      )
        fail('Unsupported/mode-specific source text wrap');
      if (pieces.length === 1) {
        const leaf = lookup(pieces[0].path);
        out.textStyle = font(key + '-type', leaf);
        out.fill = color(
          key + '-text-color',
          per(m => css(leaf[m]).color)
        );
        out.textProperty = context + ' ' + key + ' Text';
      } else {
        let end = 0;
        out.textRuns = pieces.map((p, i) => {
          const a = lookup(p.path),
            start = end;
          end += p.characters.length;
          return {
            id: 'source-run-' + i,
            start,
            end,
            textStyle: font(key + '-run-' + i, a),
            fill: color(
              key + '-run-' + i + '-paint',
              per(m => css(a[m]).color)
            ),
          };
        });
        // Plain adjacent nodes inherit one exact style signature. Their source
        // logical characters remain contiguous in one editable native TEXT.
        const merged = [];
        for (const r of out.textRuns) {
          const prior = merged.at(-1),
            s = styles.text.find(s => s.id === r.textStyle),
            v = variables.find(v => v.name === r.fill);
          const signature = JSON.stringify([s.values, v.values]);
          if (prior && prior.signature === signature) prior.run.end = r.end;
          else merged.push({ run: r, signature });
        }
        out.textRuns = merged.map(x => x.run);
      }
      const slot = {
        id: key + '-text-slot',
        type: 'FRAME',
        layout: {
          mode: 'VERTICAL',
          width: out.layout.width,
          height: number(
            key + '-text-allocation',
            per(m =>
              Math.max(
                1,
                all[m].rect.height -
                  parseFloat(css(all[m]).paddingTop) -
                  parseFloat(css(all[m]).paddingBottom)
              )
            )
          ),
        },
        absolute: {
          horizontal: 'START',
          vertical: 'START',
          offsetX: number(key + '-text-left', left),
          offsetY: number(
            key + '-text-top',
            per(
              m =>
                parseFloat(css(all[m]).paddingTop) +
                parseFloat(css(all[m]).borderTopWidth)
            )
          ),
        },
        children: [out],
      };
      if (photo && n.tag === 'BUTTON') {
        slot.layout.height = number(
          key + '-centered-linebox',
          per(m => parseFloat(css(all[m]).lineHeight))
        );
        slot.absolute.offsetY = number(
          key + '-centered-y',
          per(
            m => (all[m].rect.height - parseFloat(css(all[m]).lineHeight)) / 2
          )
        );
      }
      return slot;
    }
    function convert(p, parent) {
      const all = lookup(p),
        n = all.undrr;
      if (
        ![
          'DIV',
          'P',
          'H3',
          'SECTION',
          'BUTTON',
          'NAV',
          ...(photo ? ['ARTICLE', 'HEADER', 'A', 'IMG'] : []),
        ].includes(n.tag)
      )
        fail('Unsupported source node ' + n.tag);
      const spec = {
        id: p,
        type: 'FRAME',
        name: n.class || n.tag,
        ...geom(p, all, parent),
        children: [],
        sourceNode: {
          path: p,
          tag: n.tag,
          class: n.class,
          rect: per(m => all[m].rect),
        },
      };
      if (
        familyId === 'scroll-container-hydrated' &&
        n.class === 'mg-scroll__item-wrapper'
      ) {
        const index = +p.split('-').at(-1) + 1;
        const rowIndex = p.split('-')[2];
        if (!['1', '3'].includes(rowIndex)) fail('Hydrated source row anatomy');
        const row = rowIndex === '1' ? 'First' : 'Second';
        if (!n.fullText.includes(row + ' row card ' + index))
          fail('Hydrated source row/item copy');
        if (index < 1 || index > 6) fail('Hydrated card source item index');
        const cardId =
          'scroll-hydrated-card.' + row.toLowerCase() + '.' + index;
        const child = lookup(p + '-0');
        function relativeFingerprint(n, origin) {
          return [
            n.tag,
            n.class,
            n.fullText,
            { ...n.rect, x: n.rect.x - origin.x, y: n.rect.y - origin.y },
            css(n),
            n.children.map(c => relativeFingerprint(c, origin)),
          ];
        }
        const fingerprint = JSON.stringify(
          per(m => relativeFingerprint(child[m], child[m].rect))
        );
        if (cardFingerprints.has(cardId)) {
          if (cardFingerprints.get(cardId) !== fingerprint)
            fail('Reusable hydrated source card context mismatch ' + cardId);
        } else {
          const cardTree = convert(p + '-0', null);
          delete cardTree.absolute;
          cardVariants.push({
            id: cardId,
            name: 'Row=' + row + ', Item=' + index,
            properties: { Row: row, Item: String(index) },
            tree: cardTree,
            sourceContract: {
              sourceRect: per(m => child[m].rect),
              owningStory: sample.case,
              normalizedSourceGeometry: true,
            },
          });
          cardFingerprints.set(cardId, fingerprint);
        }
        paint(spec, p, all);
        spec.children = [
          {
            id: p + '-card',
            type: 'INSTANCE',
            family: 'scroll-hydrated-card',
            variant: { Row: row, Item: String(index) },
            expose: true,
            layout: { width: spec.layout.width, height: spec.layout.height },
          },
        ];
        return spec;
      }
      if (photo && n.class === 'mg-scroll__item-wrapper') {
        const sourceIndex = +p.split('-').at(-1),
          item = (sourceIndex % 5) + 1;
        if (
          sourceIndex < 0 ||
          sourceIndex > 7 ||
          n.children.length !== 1 ||
          n.children[0].tag !== 'ARTICLE'
        )
          fail('Photo source card anatomy');
        const cardId = 'scroll-source-photo-card.item-' + item,
          child = lookup(p + '-0');
        function fingerprint(n, origin) {
          const style = Object.fromEntries(
            Object.entries(css(n)).filter(([k]) => !k.startsWith('outline'))
          );
          if (
            css(n).outlineStyle &&
            css(n).outlineStyle !== 'none' &&
            !(
              n.class === 'mg-card__visual' &&
              css(n).outline === 'rgba(0, 0, 0, 0.1) solid 1px'
            )
          )
            fail('Unexpected in-card outline');
          return [
            n.tag,
            n.class,
            n.fullText,
            { ...n.rect, x: n.rect.x - origin.x, y: n.rect.y - origin.y },
            style,
            n.children.map(c => fingerprint(c, origin)),
          ];
        }
        const signature = JSON.stringify(
          per(m => fingerprint(child[m], child[m].rect))
        );
        if (cardFingerprints.has(cardId)) {
          if (cardFingerprints.get(cardId) !== signature)
            fail('Reusable photo source card mismatch ' + cardId);
        } else {
          cardVariants.push({
            id: cardId,
            name: 'Item=' + item,
            properties: { Item: String(item) },
            tree: convert(p + '-0', null),
            sourceContract: {
              sourceRect: per(m => child[m].rect),
              initialSourceIndex: sourceIndex,
              initialSourceViewport: sample.viewport.width,
              caretReflowAccepted: false,
            },
          });
          cardFingerprints.set(cardId, signature);
        }
        paint(spec, p, all);
        spec.children = [
          {
            id: p + '-photo-card',
            type: 'INSTANCE',
            family: 'scroll-source-photo-card',
            variant: { Item: String(item) },
            expose: true,
            layout: { width: 'FILL', height: 'FILL' },
            sourceHref: n.children[0].children[1].children[0].children[0].href,
          },
        ];
        return spec;
      }
      if (photo && n.tag === 'IMG') {
        const image = photoImages.find(
          a =>
            a.sourceUrl === n.src ||
            (a.source && /author[^/]*\.png$/.test(n.src || ''))
        );
        if (
          !image ||
          modes.some(
            m =>
              all[m.id].naturalWidth !== image.dimensions[0] ||
              all[m.id].naturalHeight !== image.dimensions[1] ||
              all[m.id].src !== n.src
          )
        )
          fail('Exact authored image source/dimensions');
        paint(spec, p, all);
        delete spec.fill;
        spec.image = {
          assetId: 'scroll-source-photo-' + image.sha256,
          base64: read(image.file).toString('base64'),
          scaleMode: 'FILL',
        };
        spec.sourceImage = {
          src: n.src,
          sha256: image.sha256,
          objectFit: 'cover',
          objectPosition: '50% 50%',
          naturalWidth: image.dimensions[0],
          naturalHeight: image.dimensions[1],
        };
        return spec;
      }
      if (photo && n.tag === 'A' && n.class.includes('mg-button-cta')) {
        if (n.href !== 'https://www.undrr.org')
          fail('Authored CTA URL changed');
        for (const m of modes) {
          const s = css(all[m.id]),
            a = rgba(s.color),
            b = resolve('color/text', m.id, 'COLOR');
          if (
            ['r', 'g', 'b'].some(
              k => Math.round(a[k] * 255) !== Math.round(b[k] * 255)
            ) ||
            a.a !== (b.a ?? 1) ||
            ['Top', 'Right', 'Bottom', 'Left'].some(
              edge =>
                parseFloat(s['border' + edge + 'Width']) !==
                  resolve('border-width/button', m.id, 'FLOAT') ||
                rgba(s['border' + edge + 'Color']).a !== 0
            ) ||
            ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'].some(
              c =>
                parseFloat(s['border' + c + 'Radius']) !==
                resolve('radius/button', m.id, 'FLOAT')
            )
          )
            fail('Exact source CTA paint/corners/borders changed');
        }
        const type = styles.text.find(
          s => s.id === 'component.editorial-cta.label'
        );
        for (const m of modes) {
          const s = css(all[m.id]),
            t = type?.values[m.id];
          if (
            !t ||
            s.fontFamily !== t.fontName.family + ', sans-serif' ||
            +s.fontWeight !== 600 ||
            parseFloat(s.fontSize) !== t.fontSize ||
            parseFloat(s.lineHeight) !==
              (t.lineHeight.unit === 'PERCENT'
                ? (t.lineHeight.value * t.fontSize) / 100
                : t.lineHeight.value) ||
            s.paddingTop !== '5px' ||
            s.paddingBottom !== '5px' ||
            s.paddingLeft !== '0px' ||
            s.paddingRight !== '27px' ||
            parseFloat(s.borderTopWidth) !==
              resolve('border-width/button', m.id, 'FLOAT') ||
            parseFloat(s.borderTopLeftRadius) !==
              resolve('radius/button', m.id, 'FLOAT') ||
            s.backgroundColor !== 'rgba(0, 0, 0, 0)'
          )
            fail('Exact contextual CTA contract changed');
        }
        spec.sourceHref = n.href;
        spec.children = [
          {
            id: p + '-cta',
            type: 'INSTANCE',
            family: 'editorial-cta',
            variant: {
              Context: 'Base',
              State: 'Default',
              Content: 'Short',
              Motion: 'NoPreference',
            },
            overrides: { Label: n.fullText },
            expose: true,
            layout: { width: 'FILL', height: 'FILL' },
          },
        ];
        return spec;
      }
      if (photo && n.tag === 'HEADER') {
        if (n.children.length !== 1 || n.children[0].tag !== 'A')
          fail('Source linked title anatomy');
        const a = lookup(p + '-0'),
          slot = text(a, p + '-title'),
          out = slot.children[0];
        out.layout.width = number(
          p + '-title-capacity',
          per(m => all[m].rect.width)
        );
        slot.layout.width = out.layout.width;
        slot.layout.height = number(
          p + '-title-line-allocation',
          per(m => a[m].rect.height)
        );
        slot.absolute.offsetX = number(
          p + '-title-x',
          per(m => a[m].rect.x - all[m].rect.x)
        );
        slot.absolute.offsetY = number(
          p + '-title-y',
          per(m => a[m].rect.y - all[m].rect.y)
        );
        out.textDecoration = 'UNDERLINE';
        out.textDecorationOffset = { unit: 'PIXELS', value: 3 };
        out.sourceHref = a.undrr.href;
        if (
          modes.some(
            m =>
              css(a[m.id]).textDecoration !== 'underline' ||
              css(a[m.id]).textUnderlineOffset !== '3px'
          )
        )
          fail('Source linked title decoration changed');
        const index = +p.split('-').at(-4),
          cardParents = lookup(p.split('-').slice(0, -2).join('-')),
          mirrors = per(
            m =>
              photoMirrors.find(
                s => s.mode === m && s.viewport.width === sample.viewport.width
              )?.cards[index]
          );
        if (Object.values(mirrors).some(x => !x))
          fail('Source title caret mirror missing');
        for (const m of modes) {
          const c = mirrors[m.id];
          if (
            JSON.stringify(c.anchorFragments) !==
              JSON.stringify(c.mirrorFragments) ||
            c.after.borderTopWidth !== '3px' ||
            c.after.borderRightWidth !== '3px' ||
            c.after.width !== '8.04688px' ||
            c.after.height !== '8.04688px' ||
            c.after.transform !==
              'matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 0)' ||
            c.imageStyle.objectFit !== 'cover' ||
            c.imageStyle.objectPosition !== '50% 50%'
          )
            fail('Exact CSS caret/image mirror changed');
        }
        const side = 8.046875,
          b = 3,
          v = side * Math.SQRT2,
          rotate = ([x, y]) => [
            (x - y + side) / Math.SQRT2,
            (x + y) / Math.SQRT2,
          ];
        const poly = ps =>
          '<polygon fill="#000000" points="' +
          ps.map(x => rotate(x).join(',')).join(' ') +
          '"/>';
        const markup =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
          v +
          ' ' +
          v +
          '">' +
          poly([
            [0, 0],
            [side, 0],
            [side, b],
            [0, b],
          ]) +
          poly([
            [side - b, b],
            [side, b],
            [side, side],
            [side - b, side],
          ]) +
          '</svg>';
        paint(spec, p, all);
        spec.children = [
          slot,
          {
            id: p + '-initial-caret',
            type: 'FRAME',
            name: 'Measured initial CSS caret, edited-title reflow unsupported',
            layout: {
              mode: 'NONE',
              width: number(
                p + '-caret-width',
                per(m => mirrors[m].mirrorCaret.width)
              ),
              height: number(
                p + '-caret-height',
                per(m => mirrors[m].mirrorCaret.height)
              ),
            },
            absolute: {
              horizontal: 'START',
              vertical: 'START',
              offsetX: number(
                p + '-caret-x',
                per(
                  m =>
                    mirrors[m].mirrorCaret.x -
                    mirrors[m].card.x -
                    (all[m].rect.x - cardParents[m].rect.x)
                )
              ),
              offsetY: number(
                p + '-caret-y',
                per(
                  m =>
                    mirrors[m].mirrorCaret.y -
                    mirrors[m].card.y -
                    (all[m].rect.y - cardParents[m].rect.y)
                )
              ),
            },
            children: [
              {
                id: p + '-caret-ink',
                type: 'SVG',
                svg: {
                  assetId: 'scroll-source-title-caret23',
                  markup,
                  monochrome: { fills: out.fill },
                },
                layout: { width: v, height: v },
              },
            ],
          },
        ];
        return spec;
      }

      const target = n.class
        .split(' ')
        .some(c =>
          [
            'show-more-wrapper-class',
            'detached-content',
            'mg-show-more--container',
          ].includes(c)
        );
      if (target) {
        const active = css(n).maskImage !== 'none';
        if (modes.some(m => css(all[m.id]).maskImage !== css(n).maskImage))
          fail('Mode mask mismatch');
        if (
          active &&
          css(n).maskImage !==
            'linear-gradient(rgb(0, 0, 0) 120px, rgba(0, 0, 0, 0) 200px)'
        )
          fail('Source fade changed');
        spec.layout.clipsContent = true;
        const expanded = per(m => {
          let height = all[m].rect.height;
          for (const s of source.scenes.filter(
            s =>
              s.mode === m &&
              s.case === sample.case &&
              s.viewport.width === sample.viewport.width
          ))
            height = Math.max(height, paths(s.tree).get(p)?.rect.height || 0);
          return height;
        });
        const zero = number(
          p + '-mask-zero',
          per(() => 0)
        );
        const mask = {
          id: p + '-mask',
          type: 'FRAME',
          alphaMask: { type: active ? 'ALPHA' : 'NONE' },
          layout: {
            mode: 'NONE',
            width: spec.layout.width,
            height: number(
              p + '-mask-height',
              per(() => 200)
            ),
          },
          absolute: {
            horizontal: 'START',
            vertical: 'START',
            offsetX: zero,
            offsetY: zero,
          },
        };
        if (active)
          mask.gradient = {
            layers: [
              {
                transform: [
                  [0, 1, 0],
                  [-1, 0, 1],
                ],
                stops: [
                  {
                    position: 0,
                    color: role(
                      p + '-mask-opaque',
                      'COLOR',
                      per(() => ({ r: 0, g: 0, b: 0, a: 1 }))
                    ),
                  },
                  {
                    position: 0.6,
                    color:
                      'component/show-more/' +
                      context.replaceAll('.', '/') +
                      '/' +
                      p +
                      '-mask-opaque',
                  },
                  {
                    position: 1,
                    color: role(
                      p + '-mask-transparent',
                      'COLOR',
                      per(() => ({ r: 0, g: 0, b: 0, a: 0 }))
                    ),
                  },
                ],
              },
            ],
          };
        const content = {
          id: p + '-content',
          type: 'FRAME',
          layout: {
            mode: 'VERTICAL',
            width: spec.layout.width,
            height: number(p + '-content-height', expanded),
            gap: 0,
          },
          absolute: {
            horizontal: 'START',
            vertical: 'START',
            offsetX: zero,
            offsetY: zero,
          },
          children: [],
        };
        paint(content, p + '-content', all);
        const inline =
          !n.children.length ||
          n.children.every(c => ['CODE', 'STRONG', 'EM'].includes(c.tag))
            ? text(all, p)
            : null;
        if (inline) content.children.push(inline);
        else
          n.children.forEach((c, i) =>
            content.children.push(convert(p + '-' + i, all))
          );
        spec.children = [mask, content];
        spec.sourceMask = {
          active,
          sourceCss: per(m => css(all[m]).maskImage),
          extent: 200,
          contentAllocation: expanded,
          nativeRenderingAccepted: false,
        };
      } else {
        paint(spec, p, all);
        const inline =
          !n.children.length ||
          n.children.every(c => ['CODE', 'STRONG', 'EM'].includes(c.tag))
            ? text(all, p)
            : null;
        if (inline) spec.children.push(inline);
        else
          n.children.forEach((c, i) =>
            spec.children.push(convert(p + '-' + i, all))
          );
      }
      if (
        photo &&
        sample.case === 'scroll-with-min-width' &&
        n.tag === 'DIV' &&
        n.rect.width === 240 &&
        css(n).overflowX === 'auto'
      ) {
        const outlines = per(m =>
          photoOutlines.find(
            s => s.mode === m && s.viewport === sample.viewport.width
          )
        );
        for (const m of modes) {
          const o = outlines[m.id];
          if (
            !o ||
            JSON.stringify(o.rect) !== JSON.stringify(all[m.id].rect) ||
            o.style.outlineWidth !== '2px' ||
            o.style.outlineOffset !== '2px' ||
            o.style.outlineColor !== 'rgb(118, 118, 118)' ||
            o.style.outlineStyle !== 'dashed'
          )
            fail('Actual MinWidth outline source changed');
        }
        if (
          !parent ||
          modes.some(
            m => all[m.id].rect.width !== 240 || all[m.id].rect.height !== 493
          )
        )
          fail('Finite outline viewport differs');
        const markup =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 248 501"><path d="M1 1H247V500H1Z" fill="none" stroke="#000000" stroke-width="2" stroke-dasharray="6 6"/></svg>';
        spec.sourcePhotoOutline = {
          id: p + '-outside-outline',
          type: 'FRAME',
          name: 'Actual2px dashed outline,6/6 cadence candidate',
          layout: {
            mode: 'NONE',
            width: number(
              p + '-outline-width',
              per(() => 248)
            ),
            height: number(
              p + '-outline-height',
              per(() => 501)
            ),
          },
          absolute: {
            horizontal: 'START',
            vertical: 'START',
            offsetX: number(
              p + '-outline-x',
              per(m => all[m].rect.x - parent[m].rect.x - 4)
            ),
            offsetY: number(
              p + '-outline-y',
              per(m => all[m].rect.y - parent[m].rect.y - 4)
            ),
          },
          children: [
            {
              id: p + '-outline-ink',
              type: 'SVG',
              svg: {
                assetId: 'scroll-minwidth-outline-240x493-candidate',
                markup,
                monochrome: {
                  strokes: color(
                    p + '-outline-paint',
                    per(() => 'rgb(118, 118, 118)')
                  ),
                },
              },
              layout: { width: 248, height: 501 },
            },
          ],
        };
      }
      if (photo) {
        const children = [];
        for (const child of spec.children) {
          const outline = child.sourcePhotoOutline;
          delete child.sourcePhotoOutline;
          children.push(child);
          if (outline) children.push(outline);
        }
        spec.children = children;
      }
      return spec;
    }
    const tree = convert('root', null);
    variants.push({
      id: familyId + '.' + context,
      name:
        'Configuration=' +
        sample.case +
        ', State=' +
        sample.state +
        ', Viewport=' +
        sample.viewport.width,
      properties: {
        Configuration: sample.case,
        State: sample.state,
        Viewport: String(sample.viewport.width),
      },
      tree,
      sourceContract: {
        case: sample.case,
        state: sample.state,
        viewport: sample.viewport.width,
        sourceRect: per(m => captures[m].tree.rect),
        logicalCopyEditable: true,
        ...(photo
          ? { nativeScrollBehaviourAccepted: false }
          : { nativeMaskDrawingAccepted: false }),
      },
    });
  }
  const family = {
    id: familyId,
    ...(familyId === 'scroll-container-hydrated'
      ? { dependencies: ['scroll-hydrated-card'] }
      : photo
        ? { dependencies: ['scroll-source-photo-card'] }
        : {}),
    name:
      familyId === 'show-more'
        ? 'Mangrove source / ShowMore'
        : photo
          ? 'Mangrove source / Photo scroll scenes'
          : 'Mangrove source / Hydrated scroll scenes',
    kind: 'component-set',
    sourceRef: ref,
    review: { genericLabels: false, preserveVariantSizing: true },
    variantProperties: {
      Configuration: [
        ...new Set(variants.map(v => v.properties.Configuration)),
      ],
      State: [...new Set(variants.map(v => v.properties.State))],
      Viewport: ['390', '1164'],
    },
    limitations: photo
      ? [
          'Actual22 finite source scene appearances with eight genuine instances of five source card identities and exact contextual EditorialCTA dependency.',
          'Initial title CSS-border caret and2px dashed MinWidth outline retain measured source allocations. Six/six dash cadence is a candidate, not authored CSS or raster proof. Edited-title caret reflow is unsupported.',
          'Whole logical title/summary text capacities, actual source images and paints are retained. Source600 to Bold700 remains a font matching candidate; native fonts/baselines/crop/outline/effects/raster/RTL/reflow/publication remain open.',
          'Source scrolling/snapping/keyboard/touch/disabled/focus/hover states are finite recorded appearances, not live native interaction.',
        ]
      : familyId === 'scroll-container-hydrated'
        ? [
            'Actual two-row hydrated source: twelve genuine nested card identities and six settled finite source viewport/state scenes. Other five-photo authored Scroll contexts remain pending.',
            'Native scrolling/hydration/snapping/arrows/disabled/focus/RTL/touch/scrollbars are not implemented. Actual source recorded scroll positions project through fixed child allocations.',
            'Source logical copy/box/paint/font bindings and nested instance ownership only; native glyphs/pixels, arbitrary edited reflow and ordinary plugin/publication remain open.',
          ]
        : [
            'Finite actual 18 source scenes; independent target states and logical editable content retained, no runtime target resolution/aria/localization equivalence.',
            'ALPHA mask is a guarded source candidate: three native prototypes failed the visual fade check, full connector exceeds unchanged transport ceiling. No wash/screenshot substitute.',
            'Source Roboto600 to bundled Bold700 and system Menlo mapping are candidates; native glyphs/inline baseline/pixels, arbitrary edited reflow and mask consumer overrides remain open.',
          ],
    variants,
  };
  targets.variables.splice(0, targets.variables.length, ...variables);
  targets.styles.text.splice(0, targets.styles.text.length, ...styles.text);
  targets.styles.effect.splice(
    0,
    targets.styles.effect.length,
    ...styles.effect
  );
  return [
    ...(cardVariants.length
      ? [
          {
            id: photo ? 'scroll-source-photo-card' : 'scroll-hydrated-card',
            ...(photo ? { dependencies: ['editorial-cta'] } : {}),
            name: photo
              ? 'Mangrove source / Photo scroll card'
              : 'Mangrove source / Hydrated scroll card',
            kind: 'component-set',
            sourceRef: ref,
            review: { genericLabels: false, preserveVariantSizing: true },
            variantProperties: photo
              ? { Item: ['1', '2', '3', '4', '5'] }
              : {
                  Row: ['First', 'Second'],
                  Item: ['1', '2', '3', '4', '5', '6'],
                },
            limitations: photo
              ? [
                  'Five authored source image/title/summary/CTA cards with source initial linked caret. Native hyperlink/caret reflow, font/raster/crop and nested CTA glyph matching remain open.',
                ]
              : [
                  'Exact source hydrated server-card anatomy and copy; native source font/raster/edit reflow and hydration behavior remain open.',
                ],
            variants: cardVariants,
          },
        ]
      : []),
    family,
  ];
}
function buildShowMoreRecipes(args) {
  return buildSourceRecipes(args, 'show-more');
}
function buildScrollHydratedRecipes(args) {
  return buildSourceRecipes(args, 'scroll-container-hydrated');
}
function buildScrollPhotoRecipes(args) {
  return buildSourceRecipes(args, 'scroll-container-photo');
}
function buildScrollShowMoreRecipes(args) {
  const staged = {
    ...args,
    variables: clone(args.variables),
    styles: clone(args.styles),
  };
  const families = [
    ...buildShowMoreRecipes(staged),
    ...buildScrollHydratedRecipes(staged),
  ];
  args.variables.splice(0, args.variables.length, ...staged.variables);
  args.styles.text.splice(0, args.styles.text.length, ...staged.styles.text);
  args.styles.effect.splice(
    0,
    args.styles.effect.length,
    ...staged.styles.effect
  );
  return families;
}
module.exports = {
  buildShowMoreRecipes,
  buildScrollHydratedRecipes,
  buildScrollShowMoreRecipes,
  buildScrollPhotoRecipes,
};
