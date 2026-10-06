/** Genuine authored Gallery image scenes. Native drawing and behavior acceptance remain open. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const BASE = 'examples/figma-plugin/holistic/assets/gallery-html/';
const PHOTO_BASE = 'examples/figma-plugin/holistic/assets/gallery/';
const copy = x => JSON.parse(JSON.stringify(x));
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const fail = x => {
  throw Error('Gallery source recipe needs updating: ' + x);
};
function inspectGalleryHtmlSource({ root }) {
  const accepted =
    require('./figma-gallery-recipes.cjs').inspectGalleryImageSource({ root });
  const bytes = fs.readFileSync(path.join(root, BASE, 'source-audit.json'));
  if (
    hash(bytes) !==
    'b35e674d859b42713285760c7c12373153e9bbd6b9be4e464e25aadfc705efbe'
  )
    fail('HTML source audit drift');
  const audit = JSON.parse(bytes);
  for (const [p, h] of Object.entries(audit.evidencePins))
    if (hash(fs.readFileSync(path.join(root, BASE, p))) !== h)
      fail('HTML source evidence drift ' + p);
  const source = JSON.parse(
    fs.readFileSync(path.join(root, BASE, 'source-footprints.json'))
  );
  if (source.captures.length !== 60)
    fail('Exact60 HTML/mixed-image source captures required');
  return { ...accepted, source, audit, acceptedAudit: accepted.audit };
}
function buildGallerySourceRecipes({ root, modes, variables, styles }, cohort) {
  const { source, foundations, photos } = inspectGalleryHtmlSource({ root });
  const familyId =
    cohort === 'html' ? 'gallery-html' : 'gallery-mixed-media-image';
  if (
    modes
      .map(m => m.id)
      .sort()
      .join(',') !== 'delta,irp,mcr,preventionweb,undrr'
  )
    fail('Five exact source modes required');
  const prepared = { variables: copy(variables), styles: copy(styles) };
  const byName = new Map();
  for (const v of prepared.variables) {
    if (byName.has(v.name)) fail('Duplicate role ' + v.name);
    byName.set(v.name, v);
  }
  function resolve(name, mode, type, seen = new Set()) {
    const v = byName.get(name);
    if (!v || v.type !== type || seen.has(name))
      fail('Missing/wrong-type/cyclic role ' + name);
    seen.add(name);
    const value = v.values?.[mode];
    if (value === undefined) fail('Missing mode ' + name);
    if (value && typeof value === 'object' && 'alias' in value) {
      if (Object.keys(value).length !== 1) fail('Malformed alias ' + name);
      return resolve(value.alias, mode, type, seen);
    }
    return value;
  }
  for (const v of foundations)
    for (const mode of modes)
      if (
        byName.get(v.name)?.id !== v.id ||
        JSON.stringify(resolve(v.name, mode.id, v.type)) !==
          JSON.stringify(
            v.values[mode.id]?.alias
              ? (() => {
                  const original = new Map(foundations.map(f => [f.name, f]));
                  function r(n, seen = new Set()) {
                    if (seen.has(n)) fail('Archived alias cycle');
                    seen.add(n);
                    const value = original.get(n)?.values[mode.id];
                    return value?.alias ? r(value.alias, seen) : value;
                  }
                  return r(v.name);
                })()
              : v.values[mode.id]
          )
      )
        fail('Measured foundation changed ' + v.name + '/' + mode.id);
  function upsert(list, entry) {
    const kind =
      list === prepared.variables
        ? 'VARIABLE'
        : list === prepared.styles.text
          ? 'TEXT'
          : 'EFFECT';
    if (kind !== 'VARIABLE')
      for (const other of Object.values(prepared.styles))
        if (
          Array.isArray(other) &&
          other !== list &&
          other.some(v => v.id === entry.id || v.name === entry.name)
        )
          fail('Foreign style kind ' + entry.id);
    const hits = list.filter(v => v.id === entry.id || v.name === entry.name);
    if (
      hits.length > 1 ||
      (hits.length &&
        (hits[0].id !== entry.id ||
          hits[0].name !== entry.name ||
          (kind === 'VARIABLE'
            ? hits[0].type !== entry.type
            : hits[0].type !== undefined && hits[0].type !== kind)))
    )
      fail('Foreign identity ' + entry.id);
    if (
      kind !== 'VARIABLE' &&
      hits.length &&
      (Object.keys(hits[0].values || {})
        .sort()
        .join(',') !==
        modes
          .map(m => m.id)
          .sort()
          .join(',') ||
        modes.some(m =>
          kind === 'TEXT'
            ? !hits[0].values?.[m.id] ||
              typeof hits[0].values[m.id] !== 'object' ||
              Array.isArray(hits[0].values[m.id]) ||
              !hits[0].values[m.id].fontName ||
              typeof hits[0].values[m.id].fontName !== 'object' ||
              Array.isArray(hits[0].values[m.id].fontName) ||
              typeof hits[0].values[m.id].fontName.family !== 'string' ||
              !hits[0].values[m.id].fontName.family.trim() ||
              typeof hits[0].values[m.id].fontName.style !== 'string' ||
              !hits[0].values[m.id].fontName.style.trim()
            : !Array.isArray(hits[0].values?.[m.id])
        ))
    )
      fail('Foreign style values ' + entry.id);
    if (hits.length) list[list.indexOf(hits[0])] = entry;
    else list.push(entry);
    if (kind === 'VARIABLE') byName.set(entry.name, entry);
  }

  const vals = fn => Object.fromEntries(modes.map(m => [m.id, fn(m.id)]));
  const sourceRef = { file: 'stories/Components/Gallery/Gallery.jsx', line: 1 };
  let context;
  function role(field, type, values) {
    const name = 'component/' + familyId + '/' + context + '/' + field;
    upsert(prepared.variables, {
      id: name,
      name,
      type,
      scopes: ['ALL_SCOPES'],
      values,
      sourceRef,
      description:
        'Actual finite source Gallery allocation. Media-response fixture, native metrics/render/behavior remain open.',
    });
    return name;
  }
  function number(field, values) {
    if (Object.values(values).some(v => !Number.isFinite(v)))
      fail('Nonfinite allocation ' + field);
    return role(field, 'FLOAT', values);
  }
  function rgba(raw) {
    const match = /^rgba?\(([^)]+)\)$/.exec(raw);
    if (!match) fail('Unsupported source color ' + raw);
    const v = match[1].split(',').map(Number);
    if (![3, 4].includes(v.length) || v.some(n => !Number.isFinite(n)))
      fail('Malformed source color');
    return { r: v[0] / 255, g: v[1] / 255, b: v[2] / 255, a: v[3] ?? 1 };
  }
  function color(field, values, alias = null) {
    const resolved = vals(m => rgba(values[m]));
    if (alias) {
      for (const m of modes) {
        const v = resolve(alias, m.id, 'COLOR'),
          e = resolved[m.id];
        if (
          !v ||
          ['r', 'g', 'b'].some(
            k => Math.round(v[k] * 255) !== Math.round(e[k] * 255)
          ) ||
          (v.a ?? 1) !== e.a
        )
          fail('Source paint alias changed ' + alias);
      }
      return role(
        field,
        'COLOR',
        vals(() => ({ alias }))
      );
    }
    return role(field, 'COLOR', resolved);
  }
  function font(all, field, sizeAlias) {
    const values = vals(m => {
      const s = all[m].style;
      const family = s.fontFamily.includes('Roboto Condensed')
        ? 'Roboto Condensed'
        : s.fontFamily.startsWith('Roboto,')
          ? 'Roboto'
          : null;
      if (
        !family ||
        (Number(s.fontWeight) === 600 && family !== 'Roboto') ||
        ![400, 600, 700].includes(Number(s.fontWeight)) ||
        s.fontStyle !== 'normal' ||
        s.textDecorationLine !== 'none' ||
        !Number.isFinite(parseFloat(s.lineHeight))
      )
        fail('Unsupported source font ' + field);
      const familyRole =
        family === 'Roboto' ? 'font-family/text' : 'font-family/ui';
      if (resolve(familyRole, m, 'STRING') !== family)
        fail('Source font role changed');
      if (
        sizeAlias &&
        resolve(sizeAlias, m, 'FLOAT') !== parseFloat(s.fontSize)
      )
        fail('Source font size alias changed ' + sizeAlias);
      return {
        fontName: {
          family,
          style: Number(s.fontWeight) >= 600 ? 'Bold' : 'Regular',
        },
        fontSize: parseFloat(s.fontSize),
        lineHeight: { unit: 'PIXELS', value: parseFloat(s.lineHeight) },
        letterSpacing: {
          unit: 'PIXELS',
          value: s.letterSpacing === 'normal' ? 0 : parseFloat(s.letterSpacing),
        },
        paragraphSpacing: 0,
        paragraphIndent: 0,
        textDecoration: 'NONE',
        textWrapStyle: 'AUTO',
      };
    });
    const id = 'component.' + familyId + '.' + context + '.' + field;
    upsert(prepared.styles.text, {
      id,
      name: 'Mangrove draft / ' + id,
      values,
      bindings: {
        fontFamily:
          values.undrr.fontName.family === 'Roboto'
            ? 'font-family/text'
            : 'font-family/ui',
        fontSize: role(
          field + '-size',
          'FLOAT',
          sizeAlias
            ? vals(() => ({ alias: sizeAlias }))
            : vals(m => values[m].fontSize)
        ),
      },
      sourceRef,
      description:
        'Source Regular400/Bold700; requestedRoboto600 uses browser-metric/inventory CSS matching candidateBold700. Native font-byte/glyph/reflow equivalence not established.',
    });
    return id;
  }
  const variants = [];
  const brand = m => (m === 'mcr' ? 'mcr2030' : m);
  const scenes = new Map(source.captures.map(c => [c.file, c.capture]));
  const contexts = source.captures.filter(
    c =>
      c.capture.contract.brand === 'undrr' &&
      c.capture.contract.story ===
        (cohort === 'html' ? 'with-html-content' : 'mixed-media')
  );
  if (contexts.length !== (cohort === 'html' ? 8 : 4))
    fail('Exact finite authored Gallery contexts required');
  for (const { capture: sample } of contexts) {
    const { story, viewport, selectedIndex } = sample.contract;
    context = story + '-' + selectedIndex + '-' + viewport;
    const captures = vals(m =>
      scenes.get(
        brand(m) + '-' + story + '-' + viewport + '-' + selectedIndex + '.json'
      )
    );
    if (
      Object.values(captures).some(
        c =>
          !c ||
          c.fontStatus !== 'loaded' ||
          Object.values(c.aliases).some(v => !v)
      )
    )
      fail('Missing settled source context');
    const maps = vals(m => new Map(captures[m].nodes.map(n => [n.id, n])));
    if (
      modes.some(
        m =>
          JSON.stringify(
            captures[m.id].nodes.map(n => [
              n.id,
              n.parentId,
              n.tag,
              n.classes,
              n.text,
            ])
          ) !==
          JSON.stringify(
            sample.nodes.map(n => [n.id, n.parentId, n.tag, n.classes, n.text])
          )
      )
    )
      fail('Cross-mode source anatomy/copy');
    const lookup = id => vals(m => maps[m].get(id));
    function geometry(all, parent, field) {
      return {
        layout: {
          mode: 'VERTICAL',
          width: number(
            field + '-width',
            vals(m => all[m].rect.width)
          ),
          height: number(
            field + '-height',
            vals(m => all[m].rect.height)
          ),
          clipsContent:
            all.undrr.style.overflowX !== 'visible' ||
            all.undrr.style.overflowY !== 'visible',
        },
        ...(parent
          ? {
              absolute: {
                horizontal: 'START',
                vertical: 'START',
                offsetX: number(
                  field + '-x',
                  vals(m => all[m].rect.x - parent[m].rect.x)
                ),
                offsetY: number(
                  field + '-y',
                  vals(m => all[m].rect.y - parent[m].rect.y)
                ),
              },
            }
          : {}),
      };
    }
    function sourceScale(id, mode) {
      let n = maps[mode].get(id),
        scale = 1;
      while (n) {
        if (n.classes === 'mg-gallery__thumbnail-html-content') {
          if (n.style.transform !== 'matrix(0.12, 0, 0, 0.12, 0, 0)')
            fail('Actual HTML thumbnail scale changed');
          scale *= 0.12;
        }
        n = n.parentId ? maps[mode].get(n.parentId) : null;
      }
      return scale;
    }
    function convert(id) {
      const all = lookup(id),
        n = all.undrr,
        s = n.style,
        parent = n.parentId ? lookup(n.parentId) : null;
      if (
        !['DIV', 'P', 'BUTTON', 'IMG', 'H2', 'H3', 'A', 'SPAN'].includes(
          n.tag
        ) ||
        (n.tag === 'SPAN' &&
          (n.classes !== 'mg-gallery__thumbnail-indicator' ||
            n.text !== '▶')) ||
        s.backgroundImage !== 'none' ||
        s.boxShadow !== 'none' ||
        s.backdropFilter !== 'none' ||
        s.clipPath !== 'none' ||
        s.maskImage !== 'none'
      )
        fail('Unsupported actual source primitive ' + id);
      const spec = {
        id: 'gallery-' + id,
        type: 'FRAME',
        name: n.classes || n.tag,
        ...geometry(all, parent, id),
        bindings: {
          opacity: number(
            id + '-opacity',
            vals(m => Number(all[m].style.opacity) * 100)
          ),
        },
        children: [],
        sourceGalleryNode: {
          id,
          tag: n.tag,
          disabled: n.disabled,
          ariaSelected: n.ariaSelected,
          scroll: n.scroll,
        },
      };
      if (n.classes === 'mg-gallery__thumbnail-indicator') {
        for (const m of modes) {
          const expected = resolve('spacing/200', m.id, 'FLOAT');
          if (
            all[m.id].rect.width !== expected ||
            all[m.id].rect.height !== expected ||
            all[m.id].style.paddingLeft !== '2px' ||
            all[m.id].style.alignItems !== 'center' ||
            all[m.id].style.justifyContent !== 'center'
          )
            fail('Actual play indicator source allocation changed');
        }
        spec.layout.width = role(
          id + '-width',
          'FLOAT',
          vals(() => ({ alias: 'spacing/200' }))
        );
        spec.layout.height = role(
          id + '-height',
          'FLOAT',
          vals(() => ({ alias: 'spacing/200' }))
        );
      }
      const backgroundAlias =
        n.classes === 'mg-gallery__main'
          ? 'color/white'
          : n.classes === 'mg-gallery__image-wrapper'
            ? 'color/neutral-50'
            : n.classes === 'mg-gallery__thumbnail-html-preview'
              ? 'color/neutral-50'
              : n.classes.split(' ').includes('mg-gallery__thumbnail--html')
                ? 'color/neutral-200'
                : n.classes.split(' ').includes('mg-gallery__thumbnail')
                  ? 'color/neutral-100'
                  : n.classes
                        .split(' ')
                        .some(c =>
                          [
                            'mg-gallery__arrow',
                            'mg-gallery__arrow-button',
                          ].includes(c)
                        )
                    ? n.disabled
                      ? 'color/neutral-300'
                      : 'color/neutral-700'
                    : null;
      spec.fill = color(
        id + '-background',
        vals(m => all[m].style.backgroundColor),
        backgroundAlias
      );
      for (const [field, css] of [
        ['topLeftRadius', 'borderTopLeftRadius'],
        ['topRightRadius', 'borderTopRightRadius'],
        ['bottomLeftRadius', 'borderBottomLeftRadius'],
        ['bottomRightRadius', 'borderBottomRightRadius'],
      ])
        spec.bindings[field] = number(
          id + '-' + field,
          vals(m => {
            const v = all[m].style[css];
            if (v.endsWith('%')) {
              if (v !== '50%') fail('Unsupported percent radius');
              return Math.min(all[m].rect.width, all[m].rect.height) / 2;
            }
            return parseFloat(v) * sourceScale(id, m);
          })
        );
      const edges = ['Top', 'Right', 'Bottom', 'Left'],
        visible = edges.filter(e => parseFloat(s['border' + e + 'Width']) > 0);
      if (visible.length) {
        const edge = visible[0];
        if (visible.length !== 1) fail('Unsupported mixed source border');
        const active = n.classes.includes('--active');
        spec.stroke = color(
          id + '-border',
          vals(m => all[m].style['border' + edge + 'Color']),
          active ? 'color/interactive' : null
        );
        spec.bindings.strokeWeight = number(
          id + '-stroke',
          vals(() => 0)
        );
        for (const e of edges)
          spec.bindings['stroke' + e + 'Weight'] = number(
            id + '-stroke-' + e,
            vals(m => parseFloat(all[m].style['border' + e + 'Width']))
          );
      }
      if (n.tag === 'IMG') {
        if (
          modes.some(
            m =>
              !all[m.id].image.complete ||
              all[m.id].image.fixtureSha256 !== n.image.fixtureSha256 ||
              all[m.id].image.naturalWidth !== n.image.naturalWidth ||
              all[m.id].image.naturalHeight !== n.image.naturalHeight
          )
        )
          fail('Source response fixture differs');
        const photo = photos.find(p => p.authoredUrl === n.image.authoredSrc);
        if (!photo || photo.sha256 !== n.image.fixtureSha256)
          fail('Missing actual response photo');
        if (
          modes.some(
            m =>
              all[m.id].style.objectPosition !== '50% 50%' ||
              all[m.id].style.objectFit !== s.objectFit ||
              all[m.id].style.transform !== 'none' ||
              ['Top', 'Right', 'Bottom', 'Left'].some(
                side =>
                  parseFloat(all[m.id].style['padding' + side]) !== 0 ||
                  parseFloat(all[m.id].style['border' + side + 'Width']) !== 0
              )
          )
        )
          fail('Unsupported source image content box/object-fit/position');
        const image = {
          assetId: 'gallery-photo-' + photo.sha256,
          base64: fs
            .readFileSync(path.join(root, PHOTO_BASE, photo.file))
            .toString('base64'),
          scaleMode: 'FILL',
        };
        const provenance = {
          authoredUrl: photo.authoredUrl,
          resolvedUrl: photo.resolvedUrl,
          sha256: photo.sha256,
          naturalWidth: photo.width,
          naturalHeight: photo.height,
        };
        if (s.objectFit === 'contain') {
          // CSS Images object-fit:contain uses the minimum uniform scale inside
          // the exact IMG content box. Quantized DOM boxes can leave a fraction
          // of a pixel uncovered. Do not crop/stretch the whole owner as FILL.
          const draw = vals(m => {
            const r = all[m].rect;
            const k = Math.min(r.width / photo.width, r.height / photo.height);
            return {
              width: photo.width * k,
              height: photo.height * k,
              x: (r.width - photo.width * k) / 2,
              y: (r.height - photo.height * k) / 2,
            };
          });
          spec.sourceContainOwner = {
            ...provenance,
            sourceNodeId: id,
            objectFit: 'contain',
            objectPosition: '50% 50%',
          };
          spec.children.push({
            id: 'gallery-' + id + '-contained-image',
            type: 'FRAME',
            name: 'Actual CSS contained natural-aspect image',
            layout: {
              mode: 'VERTICAL',
              width: number(
                id + '-draw-width',
                vals(m => draw[m].width)
              ),
              height: number(
                id + '-draw-height',
                vals(m => draw[m].height)
              ),
            },
            absolute: {
              horizontal: 'START',
              vertical: 'START',
              offsetX: number(
                id + '-draw-x',
                vals(m => draw[m].x)
              ),
              offsetY: number(
                id + '-draw-y',
                vals(m => draw[m].y)
              ),
            },
            image,
            sourceImage: {
              ...provenance,
              sourceFit: 'contain natural-aspect inner drawing',
              sourceOwnerNodeId: id,
            },
            children: [],
          });
        } else if (s.objectFit === 'cover') {
          spec.image = image;
          delete spec.fill;
          spec.sourceImage = { ...provenance, sourceFit: 'cover' };
        } else fail('Unsupported source image fit');
        return spec;
      }
      for (const child of sample.nodes.filter(
        k => k.parentId === id && k.tag !== 'BR'
      ))
        spec.children.push(convert(child.id));
      if (n.texts.length) {
        if (spec.children.length) fail('Unsupported mixed source HTML text');
        const breaks = sample.nodes.filter(
          k => k.parentId === id && k.tag === 'BR'
        );
        if (
          n.texts.length !== 1 &&
          !(
            n.tag === 'P' &&
            n.texts.length === 2 &&
            breaks.length === 1 &&
            n.outerHtml.includes('<br>')
          )
        )
          fail('Unsupported authored HTML text/BR anatomy');
        const arrow =
            n.tag === 'BUTTON' ||
            n.classes === 'mg-gallery__thumbnail-indicator',
          padding = side =>
            vals(
              m =>
                (parseFloat(all[m].style['padding' + side]) +
                  parseFloat(all[m].style['border' + side + 'Width'])) *
                sourceScale(id, m)
            ),
          left = padding('Left'),
          right = padding('Right');
        const capacity = vals(m => all[m].rect.width - left[m] - right[m]);
        const sizeAlias =
          n.classes === 'mg-gallery__thumbnail-indicator'
            ? 'font-size/100'
            : n.classes === 'mg-gallery__title'
              ? 'font-size/400'
              : arrow &&
                  (!n.classes.includes('mg-gallery__arrow--') ||
                    viewport >= 768)
                ? 'font-size/400'
                : 'font-size/300';
        const isHtml =
          !['mg-gallery__title', 'mg-gallery__caption'].includes(n.classes) &&
          !arrow;
        const stylesForText = isHtml
          ? vals(m => ({
              ...all[m],
              style: {
                ...all[m].style,
                fontSize:
                  parseFloat(all[m].style.fontSize) * sourceScale(id, m) + 'px',
                lineHeight:
                  parseFloat(all[m].style.lineHeight) * sourceScale(id, m) +
                  'px',
              },
            }))
          : all;
        const semanticAlias = isHtml ? null : sizeAlias;
        const style = font(stylesForText, id + '-text', semanticAlias);
        const fillAlias =
          n.classes === 'mg-gallery__title'
            ? 'color/text'
            : n.classes === 'mg-gallery__caption'
              ? 'color/neutral-800'
              : arrow
                ? 'color/white'
                : null;
        spec.children.push({
          id: 'gallery-' + id + '-text',
          type: 'TEXT',
          name: 'Actual whole Gallery source text',
          characters: n.texts
            .map(t => t.characters)
            .join(n.texts.length === 2 ? '\n' : ''),
          ...(n.tag === 'A'
            ? {
                sourceHref: n.href,
                sourceLinkBehavior:
                  'Authored fragment href preserved as metadata; native activation unverified',
              }
            : {}),
          ...(arrow || isHtml
            ? {}
            : {
                textProperty:
                  context +
                  ' ' +
                  (n.classes === 'mg-gallery__title' ? 'Title' : 'Caption'),
              }),
          textStyle: style,
          fill: color(
            id + '-text-color',
            vals(m => all[m].style.color),
            fillAlias
          ),
          textAlign: s.textAlign === 'center' ? 'CENTER' : 'LEFT',
          textWrap: 'AUTO',
          layout: {
            width: number(id + '-text-capacity', capacity),
            height: arrow
              ? number(
                  id + '-glyph-linebox-height',
                  vals(m => parseFloat(all[m].style.lineHeight))
                )
              : 'HUG',
          },
          ...(arrow
            ? {
                absolute: {
                  horizontal: 'START',
                  vertical: 'START',
                  offsetX: number(id + '-text-x', left),
                  offsetY: number(
                    id + '-text-y',
                    vals(
                      m =>
                        (all[m].rect.height -
                          parseFloat(all[m].style.lineHeight)) /
                        2
                    )
                  ),
                },
              }
            : {}),
        });
      }
      if (n.after.content !== 'none') {
        if (
          n.after.content !== '""' ||
          n.after.position !== 'absolute' ||
          n.after.backgroundImage !== 'none'
        )
          fail('Unsupported actual pseudo anatomy');
        const after = vals(m => all[m].after);
        spec.children.push({
          id: 'gallery-' + id + '-active-edge',
          type: 'FRAME',
          name: 'Actual source active thumbnail white edge',
          layout: {
            mode: 'VERTICAL',
            width: number(
              id + '-after-width',
              vals(m => parseFloat(after[m].width))
            ),
            height: number(
              id + '-after-height',
              vals(m => parseFloat(after[m].height))
            ),
          },
          fill: color(
            id + '-after-color',
            vals(m => after[m].backgroundColor),
            'color/white'
          ),
          bindings: {
            opacity: number(
              id + '-after-opacity',
              vals(m => Number(after[m].opacity) * 100)
            ),
          },
          absolute: {
            horizontal: 'START',
            vertical: 'START',
            offsetX: number(
              id + '-after-x',
              vals(
                m =>
                  parseFloat(after[m].left) +
                  parseFloat(all[m].style.borderLeftWidth)
              )
            ),
            offsetY: number(
              id + '-after-y',
              vals(
                m =>
                  parseFloat(after[m].top) +
                  parseFloat(all[m].style.borderTopWidth)
              )
            ),
          },
          children: [],
        });
      }
      return spec;
    }
    variants.push({
      id: familyId + '.' + context,
      name:
        'Configuration=' +
        story +
        ', Image=' +
        (selectedIndex + 1) +
        ', Viewport=' +
        viewport,
      properties: {
        Configuration: story,
        Image: String(selectedIndex + 1),
        Viewport: String(viewport),
      },
      sourceRef,
      tree: convert('root'),
      sourceContract: {
        story,
        viewport,
        selectedIndex,
        fixtureMediaOverrides: ['pinned actual response src', 'loading eager'],
        mainMediaType:
          story === 'with-html-content' && [1, 3].includes(selectedIndex)
            ? 'html'
            : 'image',
        sourceComponentCount: 1,
      },
    });
  }
  const family = {
    id: familyId,
    name:
      cohort === 'html'
        ? 'Mangrove source / Gallery authored HTML'
        : 'Mangrove source / Gallery mixed-media image states',
    kind: 'component-set',
    review: { genericLabels: false, preserveVariantSizing: true },
    sourceRef,
    variantProperties: {
      Configuration: [
        ...new Set(variants.map(v => v.properties.Configuration)),
      ],
      Image: [...new Set(variants.map(v => v.properties.Image))],
      Viewport: ['390', '1164'],
    },
    limitations: [
      cohort === 'html'
        ? 'One Gallery source component, eight actual WithHtmlContent states; video/embed/loading, arbitrary author HTML and focus remain open.'
        : 'One Gallery source component, four actual MixedMedia IMAGE selections with genuine poster thumbnails and Unicode play indicators. No video, iframe, UA controls or loading implementation.',
      'Actual source response fixture replaces random remote media src and eager-loads pinned images; remote content stability and original lazy loading behavior are not proved.',
      'Source whole title/caption/BR paragraph and exact authored HTML/scaled preview boxes. HTML content edits, preview synchronization, reflow, arbitrary author markup and fragment-link activation remain unverified.',
      'Native image contain/cover, glyph/font bytes, clip/border/corner/pseudo-edge pixels and live variable modes remain separate acceptance gates.',
      'No lightbox branch exists in owning source. No behavior/locales/RTL/ordinary plugin/publication acceptance.',
    ],
    variants,
  };
  variables.splice(0, variables.length, ...prepared.variables);
  styles.text.splice(0, styles.text.length, ...prepared.styles.text);
  styles.effect.splice(0, styles.effect.length, ...prepared.styles.effect);
  return [family];
}
function buildGalleryHtmlRecipes(args) {
  return buildGallerySourceRecipes(args, 'html');
}
function buildGalleryMixedImageRecipes(args) {
  return buildGallerySourceRecipes(args, 'mixed');
}
module.exports = {
  inspectGalleryHtmlSource,
  buildGalleryHtmlRecipes,
  buildGalleryMixedImageRecipes,
};
