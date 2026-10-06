/** Actual authored notification states. Source candidates, no native acceptance. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const base = 'examples/figma-plugin/holistic/assets/notification-states/';
const copy = x => JSON.parse(JSON.stringify(x));
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const fail = x => {
  throw Error('Notification source recipe needs updating: ' + x);
};
function inspectNotificationSource({ root }) {
  const read = p => fs.readFileSync(path.join(root, p));
  const auditBytes = read(base + 'source-audit.json');
  if (
    hash(auditBytes) !==
    '9328ac926cf66982d9866eed0bb694f8cba1ade42db1faf35e3b7f01a23ad69c'
  )
    fail('Source audit drift');
  const audit = JSON.parse(auditBytes);
  for (const [p, expected] of Object.entries(audit.sourcePins))
    if (hash(read(p)) !== expected) fail('Source drift ' + p);
  for (const [p, expected] of Object.entries(audit.evidencePins))
    if (hash(read(base + p)) !== expected) fail('Evidence drift ' + p);
  return {
    audit,
    source: JSON.parse(read(base + 'source-footprints.json')),
    overlay: JSON.parse(read(base + 'overlay-host-footprints.json')),
    foundations: JSON.parse(read(base + 'measured-foundations.json')),
  };
}
function buildNotificationRecipes(
  { root, modes, variables, styles },
  familyId
) {
  const { source, overlay, foundations } = inspectNotificationSource({ root });
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
  const ref = {
    file:
      familyId === 'service-notice'
        ? 'stories/Components/ServiceNotice/ServiceNotice.jsx'
        : familyId === 'snackbar'
          ? 'stories/Components/Snackbar/Snackbar.jsx'
          : 'stories/Components/UserFeedback/UserFeedback.jsx',
    line: 1,
  };
  let context, currentMaps;
  function role(field, type, values) {
    const name = `component/${familyId}/${context}/${field}`;
    upsert(prepared.variables, {
      id: name,
      name,
      type,
      scopes: ['ALL_SCOPES'],
      values,
      sourceRef: ref,
      description:
        'Measured finite authored source allocation. Rebuild per mode, no live CSS behavior claim.',
    });
    return name;
  }
  const number = (field, values) => {
    if (
      Object.values(values).some(
        x => typeof x !== 'number' || !Number.isFinite(x)
      )
    )
      fail('Nonfinite allocation ' + field);
    return role(field, 'FLOAT', values);
  };
  function rgba(css) {
    const m = /^rgba?\(([^)]+)\)$/.exec(css);
    if (!m) fail('Unsupported color ' + css);
    const v = m[1].split(',').map(Number);
    if (![3, 4].includes(v.length) || v.some(x => !Number.isFinite(x)))
      fail('Malformed color');
    return { r: v[0] / 255, g: v[1] / 255, b: v[2] / 255, a: v[3] ?? 1 };
  }
  const color = (field, values) =>
    role(
      field,
      'COLOR',
      vals(m => rgba(values[m]))
    );
  function textStyle(all, field) {
    const values = vals(m => {
      const s = all[m].style;
      const family = s.fontFamily.includes('Roboto Condensed')
        ? 'Roboto Condensed'
        : s.fontFamily.startsWith('Roboto,')
          ? 'Roboto'
          : null;
      if (
        !family ||
        ![400, 600, 700].includes(Number(s.fontWeight)) ||
        s.fontStyle !== 'normal' ||
        s.textDecorationLine !== 'none'
      )
        fail('Unsupported font/decoration ' + s.fontFamily);
      if (
        resolve(
          family === 'Roboto' ? 'font-family/text' : 'font-family/ui',
          m,
          'STRING'
        ) !== family
      )
        fail('Source font role mismatch');
      return {
        fontName: {
          family,
          style: Number(s.fontWeight) === 400 ? 'Regular' : 'Bold',
        },
        fontSize: parseFloat(s.fontSize),
        lineHeight: { unit: 'PIXELS', value: parseFloat(s.lineHeight) },
        letterSpacing: {
          unit: 'PIXELS',
          value: s.letterSpacing === 'normal' ? 0 : parseFloat(s.letterSpacing),
        },
        textDecoration: 'NONE',
        paragraphSpacing: 0,
        paragraphIndent: 0,
      };
    });
    const id = `component.${familyId}.${context}.${field}`;
    const sample = all.undrr,
      parent = currentMaps?.undrr.get(sample.parentId);
    const fontSizeRole = sample.classes?.includes('mg-notice__title')
      ? 'font-size/300'
      : sample.classes?.includes('mg-button')
        ? 'font-size/button'
        : sample.classes?.includes('mg-notice__meta') || sample.tag === 'STRONG'
          ? 'font-size/200'
          : sample.classes?.includes('mg-notice__description') ||
              parent?.classes?.includes('mg-notice__description')
            ? 'font-size/250'
            : null;
    if (
      fontSizeRole &&
      modes.some(
        m => resolve(fontSizeRole, m.id, 'FLOAT') !== values[m.id].fontSize
      )
    )
      fail('Authored semantic font size changed ' + fontSizeRole);
    const sizeBinding = fontSizeRole
      ? role(
          field + '-font-size',
          'FLOAT',
          vals(() => ({ alias: fontSizeRole }))
        )
      : number(
          field + '-font-size',
          vals(m => values[m].fontSize)
        );
    upsert(prepared.styles.text, {
      id,
      name: 'Mangrove draft / ' + id,
      values,
      bindings: {
        fontFamily:
          values.undrr.fontName.family === 'Roboto'
            ? 'font-family/text'
            : 'font-family/ui',
        fontSize: sizeBinding,
      },
      sourceRef: ref,
      description:
        'Named source face candidate. Requested600 versus Bold700 remains inferred from bundled source font inventory, not native font-byte equivalence.',
    });
    return id;
  }
  const presets =
    familyId === 'service-notice'
      ? ['service-degraded', 'service-offline', 'service-overlay']
      : familyId === 'snackbar'
        ? [
            'snackbar-error',
            'snackbar-warning',
            'snackbar-info',
            'snackbar-success',
          ]
        : ['feedback-confirmation-pointer', 'feedback-confirmation-keyboard'];
  const variants = [];
  for (const preset of presets)
    for (const viewport of [390, 1164]) {
      context = preset + '-' + viewport;
      const captures = vals(
        m =>
          source.captures.find(
            c => c.file === `${m}-${viewport}-${preset}.json`
          )?.capture
      );
      if (
        Object.values(captures).some(
          c =>
            !c ||
            c.fontStatus !== 'loaded' ||
            Object.values(c.aliases).some(x => !x)
        )
      )
        fail('Missing settled source capture ' + context);
      const maps = vals(m => new Map(captures[m].nodes.map(n => [n.id, n])));
      currentMaps = maps;
      const lookup = id =>
        vals(m => {
          const n = maps[m].get(id);
          if (!n) fail('Cross-mode anatomy ' + id);
          return n;
        });
      function geometry(all, parent) {
        return {
          layout: {
            mode: 'VERTICAL',
            width: number(
              all.undrr.id + '-width',
              vals(m => all[m].rect.width)
            ),
            height: number(
              all.undrr.id + '-height',
              vals(m => all[m].rect.height)
            ),
            clipsContent: all.undrr.style.overflow === 'hidden',
          },
          ...(parent
            ? {
                absolute: {
                  horizontal: 'START',
                  vertical: 'START',
                  offsetX: number(
                    all.undrr.id + '-x',
                    vals(m => all[m].rect.x - parent[m].rect.x)
                  ),
                  offsetY: number(
                    all.undrr.id + '-y',
                    vals(m => all[m].rect.y - parent[m].rect.y)
                  ),
                },
              }
            : {}),
        };
      }
      function text(all, field, characters, pieces = null, hug = false) {
        if (
          modes.some(
            m =>
              (pieces
                ? pieces(m.id)
                    .map(p => p.characters)
                    .join('')
                : characters(m.id)) !== characters('undrr')
          )
        )
          fail('Cross-mode source copy ' + field);
        const n = all.undrr;
        const spec = {
          id: field,
          type: 'TEXT',
          name: 'Actual whole source text',
          characters: characters('undrr'),
          textAlign:
            n.style.textAlign === 'center'
              ? 'CENTER'
              : ['right', 'end'].includes(n.style.textAlign)
                ? 'RIGHT'
                : 'LEFT',
          textWrap:
            n.style.textWrapStyle === 'balance'
              ? 'BALANCE'
              : n.style.textWrapStyle === 'pretty'
                ? 'PRETTY'
                : 'AUTO',
          layout: {
            width: hug
              ? 'HUG'
              : number(
                  field + '-capacity',
                  vals(m => all[m].rect.width)
                ),
            height: 'HUG',
          },
        };
        if (pieces) {
          let offset = 0;
          spec.textRuns = pieces('undrr').map((p, index) => {
            const each = vals(m => pieces(m)[index].node);
            const result = {
              id: field + '-run-' + index,
              start: offset,
              end: offset + p.characters.length,
              textStyle: textStyle(each, field + '-run-' + index),
              fill: color(
                field + '-paint-' + index,
                vals(m => each[m].style.color)
              ),
              textDecoration: 'NONE',
              ...(p.href ? { hyperlink: { type: 'URL', value: p.href } } : {}),
            };
            offset = result.end;
            return result;
          });
        } else {
          spec.textStyle = textStyle(all, field);
          spec.fill = color(
            field + '-paint',
            vals(m => all[m].style.color)
          );
          spec.textProperty = 'Text ' + context + ' ' + field;
        }
        return spec;
      }
      function project(id, parent = null) {
        const all = lookup(id),
          n = all.undrr,
          s = n.style;
        if (n.classes.includes('mg-u-sr-only') || s.display === 'none')
          return null;
        if (n.classes.split(' ').includes('mg-status-label')) {
          const g = geometry(all, parent);
          return {
            id,
            type: 'FRAME',
            name: 'Actual service status allocation',
            ...g,
            children: [
              {
                id: id + '-instance',
                name: 'Actual service status',
                type: 'INSTANCE',
                family: 'notification-status-label',
                variant: {
                  Status: n.classes.includes('--negative')
                    ? 'Negative'
                    : 'Warning',
                },
                overrides: { Label: n.text },
                expose: true,
                layout: g.layout,
              },
            ],
          };
        }
        if (n.href && modes.some(m => all[m.id].href !== n.href))
          fail('Cross-mode source action URL');
        const spec = {
          id,
          type: 'FRAME',
          name: n.classes || n.tag,
          ...geometry(all, parent),
          bindings: {
            opacity: number(
              id + '-opacity',
              vals(m => Number(all[m].style.opacity) * 100)
            ),
          },
          children: [],
          ...(n.href
            ? {
                sourceHref: n.href,
                sourceTarget: n.outerHtml.includes('target="_blank"')
                  ? '_blank'
                  : null,
                sourceRel: n.outerHtml.includes('rel="noopener noreferrer"')
                  ? 'noopener noreferrer'
                  : null,
              }
            : {}),
        };
        for (const [field, css] of [
          ['topLeftRadius', 'borderTopLeftRadius'],
          ['topRightRadius', 'borderTopRightRadius'],
          ['bottomLeftRadius', 'borderBottomLeftRadius'],
          ['bottomRightRadius', 'borderBottomRightRadius'],
        ])
          spec.bindings[field] = number(
            id + '-' + field,
            vals(m => parseFloat(all[m].style[css]))
          );
        if (s.backgroundColor !== 'rgba(0, 0, 0, 0)')
          spec.fill = color(
            id + '-background',
            vals(m => all[m].style.backgroundColor)
          );
        const edges = ['Top', 'Right', 'Bottom', 'Left'],
          visible = edges.filter(
            e => parseFloat(s['border' + e + 'Width']) > 0
          );
        if (visible.length) {
          const e = visible[0];
          if (
            modes.some(m =>
              edges
                .filter(
                  k => parseFloat(all[m.id].style['border' + k + 'Width']) > 0
                )
                .some(
                  k =>
                    all[m.id].style['border' + k + 'Color'] !==
                    all[m.id].style['border' + e + 'Color']
                )
            )
          )
            fail('Unsupported mixed border paints');
          spec.stroke = color(
            id + '-border',
            vals(m => all[m].style['border' + e + 'Color'])
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
        if (s.backgroundImage !== 'none') {
          const colors = vals(m => {
            const g = all[m].style.backgroundImage;
            const match =
              /^linear-gradient\((rgba?\([^)]+\)), \1\), none$/.exec(g);
            if (!match) fail('Unsupported background ' + g);
            return match[1];
          });
          const paint = color(id + '-tint', colors);
          spec.gradient = {
            layers: [
              {
                transform: [
                  [1, 0, 0],
                  [0, 1, 0],
                ],
                stops: [
                  { position: 0, color: paint },
                  { position: 1, color: paint },
                ],
              },
            ],
          };
          // Gradient and opaque surface must both remain visible.
          spec.children.push({
            id: id + '-tint',
            type: 'FRAME',
            name: 'Source uniform severity tint',
            layout: {
              mode: 'VERTICAL',
              width: spec.layout.width,
              height: spec.layout.height,
            },
            bindings: Object.fromEntries(
              Object.entries(spec.bindings).filter(([k]) =>
                k.endsWith('Radius')
              )
            ),
            gradient: spec.gradient,
            absolute: {
              horizontal: 'START',
              vertical: 'START',
              offsetX: number(
                id + '-tint-x',
                vals(() => 0)
              ),
              offsetY: number(
                id + '-tint-y',
                vals(() => 0)
              ),
            },
          });
          delete spec.gradient;
        }
        if (s.boxShadow !== 'none' || s.backdropFilter !== 'none') {
          const values = vals(m => {
            const a = all[m].style,
              effects = [];
            if (a.boxShadow !== 'none') {
              const match =
                /^(rgba?\([^)]+\)) (-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px ([\d.]+)px$/.exec(
                  a.boxShadow
                );
              if (!match) fail('Unsupported shadow ' + a.boxShadow);
              effects.push({
                effect: {
                  type: 'DROP_SHADOW',
                  color: rgba(match[1]),
                  offset: { x: +match[2], y: +match[3] },
                  radius: +match[4],
                  spread: +match[5],
                  visible: true,
                  blendMode: 'NORMAL',
                },
              });
            }
            if (a.backdropFilter !== 'none') {
              const match = /^blur\(([\d.]+)px\)$/.exec(a.backdropFilter);
              if (!match) fail('Unsupported backdrop');
              effects.push({
                effect: {
                  type: 'BACKGROUND_BLUR',
                  radius: +match[1],
                  visible: true,
                },
              });
            }
            return effects;
          });
          const effectId = `component.${familyId}.${context}.${id}.effect`;
          upsert(prepared.styles.effect, {
            id: effectId,
            name: 'Mangrove draft / ' + effectId,
            values,
            sourceRef: ref,
          });
          spec.effectStyle = effectId;
        }
        if (
          n.classes.includes('mg-user-feedback__confirmation') &&
          n.focusVisible
        ) {
          for (const mode of modes) {
            const actual = all[mode.id].style;
            const outline = /^(rgba?\([^)]+\)) solid ([\d.]+)px$/.exec(
              actual.outline
            );
            const separator = /^(rgba?\([^)]+\)) 0px 0px 0px ([\d.]+)px$/.exec(
              actual.boxShadow
            );
            if (
              !outline ||
              !separator ||
              Number(outline[2]) !==
                resolve('focus-ring/width', mode.id, 'FLOAT') ||
              Number(separator[2]) !==
                resolve('focus-ring/offset', mode.id, 'FLOAT') ||
              parseFloat(actual.borderTopLeftRadius) !==
                resolve('radius/button', mode.id, 'FLOAT')
            )
              fail('Actual focus allocation differs from public roles');
            for (const [sourceColor, roleName] of [
              [outline[1], 'color/focus-ring'],
              [separator[1], 'color/neutral-0'],
            ]) {
              const paint = rgba(sourceColor),
                roleValue = resolve(roleName, mode.id, 'COLOR');
              if (
                ['r', 'g', 'b'].some(
                  k =>
                    Math.round(paint[k] * 255) !==
                    Math.round(roleValue[k] * 255)
                ) ||
                paint.a !== (roleValue.a ?? 1)
              )
                fail('Actual focus paint differs from public role ' + roleName);
            }
          }
          delete spec.effectStyle;
          spec.focusRing = {
            color: 'color/focus-ring',
            separatorColor: 'color/neutral-0',
            offset: 'focus-ring/offset',
            width: 'focus-ring/width',
            radius: 'radius/button',
          };
        }
        const mask = n.before?.maskImage;
        if (n.svg || (mask && mask !== 'none')) {
          let markup =
            n.svg ||
            decodeURIComponent(
              /^url\("data:image\/svg\+xml,(.*)"\)$/.exec(mask)?.[1] || ''
            );
          if (!markup.startsWith('<svg')) fail('Missing exact source glyph');
          markup = markup
            .replaceAll("'", '"')
            .replaceAll('currentColor', '#000000')
            .replace(/ (?:class|aria-hidden|focusable)="[^"]*"/g, '');
          const square = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(markup);
          if (!square || square[1] !== square[2])
            fail('Unsupported glyph viewport');
          const filled = !markup.includes('fill="none"'),
            size = Number(square[1]);
          const sizes = vals(m =>
            n.svg ? all[m].rect.width : parseFloat(all[m].before.fontSize)
          );
          const dynamic = modes.some(m => sizes[m.id] !== sizes.undrr);
          if (dynamic && filled)
            fail('Dynamic filled source glyph unsupported');
          const paint = color(
            id + '-icon',
            vals(m => (n.svg ? all[m].style.color : all[m].before.color))
          );
          const svg = {
            assetId: 'notification-source-' + hash(markup).slice(0, 16),
            markup,
            monochrome: filled ? { fills: paint } : { strokes: paint },
          };
          if (dynamic)
            svg.sizing = {
              size: number(id + '-icon-size', sizes),
              strokeWidth: number(
                id + '-icon-stroke',
                vals(m => (2 * sizes[m]) / size)
              ),
            };
          spec.children.push({
            id: id + '-glyph',
            type: 'SVG',
            name: 'Exact authored source glyph',
            svg,
            layout: {
              width: dynamic ? size : sizes.undrr,
              height: dynamic ? size : sizes.undrr,
            },
            position: { x: 0, y: 0 },
          });
          return spec;
        }
        const children = captures.undrr.nodes.filter(c => c.parentId === id);
        const richOwner =
          n.tag === 'P' &&
          children.some(c => !c.classes.includes('mg-u-sr-only'));
        if (richOwner) {
          function pieces(mode) {
            const owner = all[mode];
            let ti = 0;
            return owner.childOrder.flatMap(c => {
              if ('text' in c) {
                const p = owner.texts[ti++];
                return p?.characters
                  ? [{ characters: p.characters, node: owner }]
                  : [];
              }
              const child = maps[mode].get(
                children.find(n => n.tag === c.tag)?.id
              );
              if (!child || child.classes.includes('mg-u-sr-only')) return [];
              if (child.href && !child.href.startsWith('https://'))
                fail('Unsupported rich destination');
              return [
                { characters: child.text, node: child, href: child.href },
              ];
            });
          }
          spec.children.push(
            text(
              all,
              id + '-logical',
              m =>
                pieces(m)
                  .map(p => p.characters)
                  .join(''),
              pieces
            )
          );
          return spec;
        }
        for (const child of children) {
          const p = project(child.id, all);
          if (p) spec.children.push(p);
        }
        const direct = n.texts.map(t => t.characters).join('');
        if (direct) {
          const inline = ['BUTTON', 'A'].includes(n.tag);
          const t = text(
            all,
            id + '-logical',
            m => all[m].texts.map(t => t.characters).join(''),
            null,
            inline
          );
          if (n.tag === 'A' && n.href) {
            if (!/^https:\/\/[^\s]+$/.test(n.href))
              fail('Unsupported source action destination');
            t.textRuns = [
              {
                id: t.id + '-source-link',
                start: 0,
                end: t.characters.length,
                textStyle: t.textStyle,
                fill: t.fill,
                textDecoration: 'NONE',
                hyperlink: { type: 'URL', value: n.href },
              },
            ];
            delete t.textStyle;
            delete t.fill;
            delete t.textProperty;
          }
          if (inline) {
            t.absolute = {
              horizontal: 'START',
              vertical: 'START',
              offsetX: number(
                id + '-text-x',
                vals(m => all[m].texts[0].rect.x - all[m].rect.x)
              ),
              offsetY: number(
                id + '-text-y',
                vals(
                  m =>
                    (all[m].rect.height - parseFloat(all[m].style.lineHeight)) /
                    2
                )
              ),
            };
          }
          if (t.absolute) {
            const absolute = t.absolute;
            delete t.absolute;
            spec.children.push({
              id: t.id + '-slot',
              type: 'FRAME',
              name: 'Actual source anonymous text flow slot',
              layout: {
                mode: 'VERTICAL',
                width: spec.layout.width,
                height: number(
                  id + '-text-slot-height',
                  vals(m => parseFloat(all[m].style.lineHeight))
                ),
              },
              absolute,
              children: [t],
            });
          } else spec.children.push(t);
        }
        return spec;
      }
      let tree = project('root');
      if (preset === 'service-overlay') {
        const hosts = vals(
          m =>
            overlay.captures.find(c => c.file === `${m}-${viewport}.json`)
              ?.capture.host
        );
        const original = tree;
        tree = {
          id: 'host',
          name: 'Actual authored embedded map host',
          type: 'FRAME',
          layout: {
            mode: 'VERTICAL',
            width: original.layout.width,
            height: original.layout.height,
            clipsContent: true,
          },
          fill: color(
            'host-bg',
            vals(m => hosts[m].style.backgroundColor)
          ),
          bindings: {
            cornerRadius: number(
              'host-radius',
              vals(m => parseFloat(hosts[m].style.borderTopLeftRadius))
            ),
          },
          children: [],
        };
        const all = vals(m => {
          const n = hosts[m].siblings.find(
            n => n.text === '[Embedded Map Canvas]'
          );
          if (!n) fail('Actual host placeholder absent');
          return { ...n, id: 'host-placeholder' };
        });
        const placeholder = text(
          all,
          'host-placeholder',
          m => all[m].text,
          null,
          true
        );
        placeholder.absolute = {
          horizontal: 'START',
          vertical: 'START',
          offsetX: number(
            'host-placeholder-x',
            vals(m => all[m].rect.x - hosts[m].rect.x)
          ),
          offsetY: number(
            'host-placeholder-y',
            vals(m => all[m].rect.y - hosts[m].rect.y)
          ),
        };
        const absolute = placeholder.absolute;
        delete placeholder.absolute;
        tree.children.push({
          id: 'host-placeholder-slot',
          type: 'FRAME',
          name: 'Actual authored placeholder flow allocation',
          layout: {
            mode: 'VERTICAL',
            width: number(
              'host-placeholder-width',
              vals(m => all[m].rect.width)
            ),
            height: number(
              'host-placeholder-height',
              vals(m => all[m].rect.height)
            ),
          },
          absolute,
          children: [placeholder],
        });
        original.absolute = {
          horizontal: 'START',
          vertical: 'START',
          offsetX: number(
            'overlay-x',
            vals(() => 0)
          ),
          offsetY: number(
            'overlay-y',
            vals(() => 0)
          ),
        };
        tree.children.push(original);
      }
      variants.push({
        id: familyId + '.' + context,
        name: `Preset=${preset}, Viewport=${viewport}`,
        properties: { Preset: preset, Viewport: String(viewport) },
        sourceRef: ref,
        tree,
      });
    }
  const family = {
    id: familyId,
    name: 'Mangrove draft / ' + familyId,
    kind: 'component-set',
    sourceRef: ref,
    review: { genericLabels: false, preserveVariantSizing: true },
    description:
      'Genuine authored source states with whole logical editable text at source owning capacities.',
    limitations: [
      'Finite English authored presets at390/1164 only; additional callers, locale/RTL and later retry phases remain open.',
      'Source geometry and paints are selected-mode initial allocations, not live responsive reflow or interaction.',
      'Requested600/Bold700 source font match is inferred; native font bytes, wrapping, glyphs and pixels remain separate gates.',
      'Actual timer, retry, navigation, focus transfer, close/escape/animation and accessibility behavior are not implemented.',
      'No ordinary plugin, consumer migration, library publication or full component acceptance.',
    ],
    variants,
  };
  variables.splice(0, variables.length, ...prepared.variables);
  styles.text.splice(0, styles.text.length, ...prepared.styles.text);
  styles.effect.splice(0, styles.effect.length, ...prepared.styles.effect);
  return [family];
}
function buildNotificationStatusDependency(options) {
  const prepared = {
    ...options,
    variables: copy(options.variables),
    styles: copy(options.styles),
  };
  const family =
    require('./figma-status-label-recipes.cjs').buildStatusLabelRecipes(
      prepared
    )[0];
  family.id = 'notification-status-label';
  family.name = 'Mangrove draft / Notification status';
  for (const v of family.variants)
    v.id = v.id.replace(/^status-label\./, 'notification-status-label.');
  options.variables.splice(0, options.variables.length, ...prepared.variables);
  options.styles.text.splice(
    0,
    options.styles.text.length,
    ...prepared.styles.text
  );
  options.styles.effect.splice(
    0,
    options.styles.effect.length,
    ...prepared.styles.effect
  );
  return family;
}
module.exports = {
  inspectNotificationSource,
  buildNotificationStatusDependency,
  buildServiceNoticeRecipes: o => buildNotificationRecipes(o, 'service-notice'),
  buildSnackbarRecipes: o => buildNotificationRecipes(o, 'snackbar'),
  buildUserFeedbackConfirmationRecipes: o =>
    buildNotificationRecipes(o, 'user-feedback-confirmation'),
};
