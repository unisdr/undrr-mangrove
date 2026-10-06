/** Actual PreviewAccess static/live source drawings. No unlock, security or native caret claim. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const BASE = 'examples/figma-plugin/holistic/assets/preview-access/';
const copy = x => JSON.parse(JSON.stringify(x));
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const fail = x => {
  throw Error('PreviewAccess source recipe needs updating: ' + x);
};
function inspectPreviewAccessSource({ root }) {
  const read = p => fs.readFileSync(path.join(root, p));
  const bytes = read(BASE + 'source-audit.json');
  if (
    hash(bytes) !==
    '207622769fc458ed3b4d6cd05ccff4baae2a471d136c9878e6a61c752274300d'
  )
    fail('Source audit drift');
  const audit = JSON.parse(bytes);
  for (const [p, h] of Object.entries(audit.sourcePins))
    if (hash(read(p)) !== h) fail('Source drift ' + p);
  for (const [p, h] of Object.entries(audit.evidencePins))
    if (hash(read(BASE + p)) !== h) fail('Evidence drift ' + p);
  const source = JSON.parse(read(BASE + 'source-footprints.json'));
  if (source.captures.length !== 60) fail('Exact60 source scenes required');
  return {
    source,
    audit,
    foundations: JSON.parse(read(BASE + 'measured-foundations.json')),
  };
}
function buildPreviewAccessRecipes({ root, modes, variables, styles }) {
  const { source, foundations } = inspectPreviewAccessSource({ root });
  let familyId;
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
  const sourceRef = {
    file: 'stories/Components/PreviewAccess/PreviewAccess.jsx',
    line: 1,
  };
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
        'Actual finite PreviewAccess allocation. Native metrics/render/behavior/security remain open.',
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
        !['none', 'underline'].includes(s.textDecorationLine) ||
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

  const families = [];
  const scenes = new Map(source.captures.map(c => [c.file, c.capture]));
  const brand = m => (m === 'mcr' ? 'mcr2030' : m);
  for (const kind of ['static', 'live']) {
    familyId = 'preview-access-' + kind;
    const contexts = source.captures.filter(
      c =>
        c.capture.contract.brand === 'undrr' &&
        (kind === 'static'
          ? ['default', 'product-branded'].includes(c.capture.contract.story)
          : c.capture.contract.story === 'live-demo' &&
            c.capture.contract.state !== 'unarmed')
    );
    if (contexts.length !== (kind === 'static' ? 4 : 6))
      fail('Exact source contexts required');
    const variants = [];
    for (const { capture: sample } of contexts) {
      const { story, state, viewport } = sample.contract;
      context = story + '-' + state + '-' + viewport;
      const captures = vals(m =>
        scenes.get(`${brand(m)}-${story}-${viewport}-${state}.json`)
      );
      if (
        Object.values(captures).some(
          c =>
            !c ||
            c.fontStatus !== 'loaded' ||
            Object.values(c.aliases).some(v => !v)
        )
      )
        fail('Missing settled source mode');
      const maps = vals(m => new Map(captures[m].nodes.map(n => [n.id, n])));
      const lookup = id => vals(m => maps[m].get(id));
      for (const m of modes)
        if (
          JSON.stringify(
            captures[m.id].nodes.map(n => [
              n.id,
              n.parentId,
              n.tag,
              n.classes,
              n.text,
              n.input?.value,
            ])
          ) !==
          JSON.stringify(
            sample.nodes.map(n => [
              n.id,
              n.parentId,
              n.tag,
              n.classes,
              n.text,
              n.input?.value,
            ])
          )
        )
          fail('Cross-mode source anatomy/copy');
      function convert(id) {
        const all = lookup(id),
          n = all.undrr,
          s = n.style,
          parent = n.parentId ? lookup(n.parentId) : null;
        if (
          !['DIV', 'P', 'H2', 'FORM', 'LABEL', 'INPUT', 'BUTTON', 'A'].includes(
            n.tag
          ) ||
          s.backgroundImage !== 'none' ||
          s.backdropFilter !== 'none' ||
          s.transform !== 'none'
        )
          fail('Unsupported source primitive ' + id);
        const r = {
          id: 'preview-' + id,
          type: 'FRAME',
          name: n.classes || n.tag,
          layout: {
            mode: 'VERTICAL',
            width: number(
              id + '-width',
              vals(m => all[m].rect.width)
            ),
            height: number(
              id + '-height',
              vals(m => all[m].rect.height)
            ),
            clipsContent:
              s.overflowX !== 'visible' || s.overflowY !== 'visible',
          },
          bindings: {
            opacity: number(
              id + '-opacity',
              vals(m => Number(all[m].style.opacity) * 100)
            ),
          },
          children: [],
          sourcePreviewNode: {
            id,
            tag: n.tag,
            input: n.input,
            focused: n.focused,
            focusVisible: n.focusVisible,
            role: n.role,
          },
        };
        if (parent)
          r.absolute = {
            horizontal: 'START',
            vertical: 'START',
            offsetX: number(
              id + '-x',
              vals(m => all[m].rect.x - parent[m].rect.x)
            ),
            offsetY: number(
              id + '-y',
              vals(m => all[m].rect.y - parent[m].rect.y)
            ),
          };
        const bg =
          n.classes === 'mg-preview-access__overlay'
            ? 'color/modal-scrim'
            : n.classes === 'mg-preview-access__modal' || n.tag === 'INPUT'
              ? 'color/white'
              : n.tag === 'BUTTON'
                ? 'color/interactive'
                : null;
        r.fill = color(
          id + '-fill',
          vals(m => all[m].style.backgroundColor),
          bg
        );
        for (const [field, css] of [
          ['topLeftRadius', 'borderTopLeftRadius'],
          ['topRightRadius', 'borderTopRightRadius'],
          ['bottomLeftRadius', 'borderBottomLeftRadius'],
          ['bottomRightRadius', 'borderBottomRightRadius'],
        ])
          r.bindings[field] = number(
            id + '-' + field,
            vals(m => parseFloat(all[m].style[css]))
          );
        const edges = ['Top', 'Right', 'Bottom', 'Left'];
        const visible = edges.filter(
          e => parseFloat(s['border' + e + 'Width']) > 0
        );
        if (visible.length) {
          const alias =
            n.classes === 'mg-preview-access__modal'
              ? 'color/interactive'
              : n.tag === 'INPUT'
                ? n.focused
                  ? 'color/form-focus'
                  : 'color/neutral-200'
                : n.classes === 'mg-preview-access__contact'
                  ? 'color/neutral-100'
                  : null;
          r.stroke = color(
            id + '-border',
            vals(m => all[m].style['border' + visible[0] + 'Color']),
            alias
          );
          r.bindings.strokeWeight = number(
            id + '-base-stroke',
            vals(() => 0)
          );
          for (const edge of edges)
            r.bindings['stroke' + edge + 'Weight'] = number(
              id + '-stroke-' + edge,
              vals(m => parseFloat(all[m].style['border' + edge + 'Width']))
            );
        }
        if (s.boxShadow !== 'none') {
          const modal = n.classes === 'mg-preview-access__modal';
          const expected = modal
            ? 'rgba(0, 0, 0, 0.25) 0px 8px 32px 0px'
            : 'rgb(255, 255, 255) 0px 0px 0px 2px';
          if (
            (!modal && (n.tag !== 'INPUT' || !n.focused)) ||
            modes.some(m => all[m.id].style.boxShadow !== expected)
          )
            fail('Source shadow profile changed');
          const effectId =
            'component.' +
            familyId +
            '.' +
            context +
            '.' +
            (modal ? 'modal-shadow' : 'input-focus-gap');
          upsert(prepared.styles.effect, {
            id: effectId,
            name: 'Mangrove draft / ' + effectId,
            values: vals(() => [
              {
                effect: {
                  type: 'DROP_SHADOW',
                  color: modal
                    ? { r: 0, g: 0, b: 0, a: 0.25 }
                    : { r: 1, g: 1, b: 1, a: 1 },
                  offset: modal ? { x: 0, y: 8 } : { x: 0, y: 0 },
                  radius: modal ? 32 : 0,
                  spread: modal ? 0 : 2,
                  visible: true,
                  blendMode: 'NORMAL',
                },
              },
            ]),
            sourceRef,
          });
          r.effectStyle = effectId;
        }
        for (const child of sample.nodes.filter(k => k.parentId === id)) {
          const converted = convert(child.id);
          const outline = converted.sourceFocusOutline;
          delete converted.sourceFocusOutline;
          r.children.push(converted);
          if (outline) r.children.push(outline);
        }
        if (n.texts.length || n.tag === 'INPUT') {
          if (n.texts.length > 1 || r.children.length)
            fail('Unsupported mixed inline text ' + id);
          const chars =
            n.tag === 'INPUT' ? n.input.value : n.texts[0].characters;
          const cls = n.classes;
          const size =
            cls === 'mg-preview-access__eyebrow' ||
            cls === 'mg-preview-access__error' ||
            n.tag === 'A'
              ? 'font-size/250'
              : cls === 'mg-preview-access__title'
                ? 'font-size/500'
                : 'font-size/300';
          const styleId = font(all, id + '-text', size);
          const fillAlias =
            cls === 'mg-preview-access__title' || n.tag === 'INPUT'
              ? 'color/neutral-800'
              : n.tag === 'BUTTON'
                ? 'color/white'
                : cls === 'mg-preview-access__error'
                  ? 'color/red-900'
                  : n.tag === 'A'
                    ? 'color/interactive'
                    : 'color/neutral-700';
          const field =
            n.tag === 'INPUT'
              ? 'PIN value'
              : cls === 'mg-preview-access__eyebrow'
                ? 'Eyebrow'
                : cls === 'mg-preview-access__title'
                  ? 'Heading'
                  : cls === 'mg-preview-access__body'
                    ? 'Message'
                    : cls === 'mg-preview-access__label'
                      ? 'PIN label'
                      : n.tag === 'BUTTON'
                        ? 'Submit label'
                        : cls === 'mg-preview-access__error'
                          ? 'Error'
                          : 'Contact';
          const padding = side =>
            vals(
              m =>
                parseFloat(all[m].style['padding' + side]) +
                parseFloat(all[m].style['border' + side + 'Width'])
            );
          const left = padding('Left'),
            right = padding('Right'),
            top = padding('Top');
          const text = {
            id: 'preview-' + id + '-text',
            type: 'TEXT',
            name: 'Actual source ' + field,
            characters: chars,
            textStyle: styleId,
            fill: color(
              id + '-text-fill',
              vals(m => all[m].style.color),
              fillAlias
            ),
            textAlign: s.textAlign === 'center' ? 'CENTER' : 'LEFT',
            textWrap: 'AUTO',
            layout: {
              width: number(
                id + '-text-capacity',
                vals(m => all[m].rect.width - left[m] - right[m])
              ),
              height: 'HUG',
            },
            textProperty: context + ' ' + field,
          };
          if (n.tag === 'INPUT' || n.tag === 'BUTTON') {
            text.layout.height = number(
              id + '-linebox',
              vals(m => parseFloat(all[m].style.lineHeight))
            );
            text.absolute = {
              horizontal: 'START',
              vertical: 'START',
              offsetX: number(id + '-text-x', left),
              offsetY: number(id + '-text-y', top),
            };
          }
          if (n.tag === 'A') {
            if (
              n.href !== 'https://www.undrr.org/contact-us' ||
              modes.some(
                m =>
                  all[m.id].style.textDecorationLine !== 'underline' ||
                  all[m.id].style.textUnderlineOffset !== 'auto' ||
                  all[m.id].style.textDecorationThickness !== 'auto'
              )
            )
              fail('Contact source link profile changed');
            delete text.textStyle;
            delete text.fill;
            delete text.textProperty;
            text.textRuns = [
              {
                id: 'preview-' + id + '-contact-link',
                start: 0,
                end: chars.length,
                textStyle: styleId,
                fill: color(
                  id + '-link-fill',
                  vals(m => all[m].style.color),
                  'color/interactive'
                ),
                hyperlink: { type: 'URL', value: n.href },
                textDecoration: 'UNDERLINE',
              },
            ];
          }
          r.children.push(text);
        }
        if (n.tag === 'INPUT' && s.outlineStyle === 'solid') {
          for (const m of modes)
            if (
              parseFloat(all[m.id].style.outlineWidth) !==
                resolve('focus-ring/width', m.id, 'FLOAT') ||
              parseFloat(all[m.id].style.outlineOffset) !==
                resolve('focus-ring/offset', m.id, 'FLOAT')
            )
              fail('Source focus roles changed');
          const offset = vals(m => parseFloat(all[m].style.outlineOffset));
          if (!parent) fail('Focused input requires actual parent');
          r.sourceFocusOutline = {
            id: 'preview-' + id + '-focus-ring',
            type: 'FRAME',
            name: 'Actual source focus outline candidate',
            layout: {
              mode: 'VERTICAL',
              width: number(
                id + '-ring-width',
                vals(m => all[m].rect.width + 2 * offset[m])
              ),
              height: number(
                id + '-ring-height',
                vals(m => all[m].rect.height + 2 * offset[m])
              ),
            },
            absolute: {
              horizontal: 'START',
              vertical: 'START',
              offsetX: number(
                id + '-ring-x',
                vals(m => all[m].rect.x - parent[m].rect.x - offset[m])
              ),
              offsetY: number(
                id + '-ring-y',
                vals(m => all[m].rect.y - parent[m].rect.y - offset[m])
              ),
            },
            fill: color(
              id + '-ring-transparent',
              vals(() => 'rgba(0, 0, 0, 0)')
            ),
            stroke: color(
              id + '-focus-color',
              vals(m => all[m].style.outlineColor),
              'color/focus-ring'
            ),
            strokeAlign: 'OUTSIDE',
            bindings: {
              strokeWeight: role(
                id + '-ring-weight',
                'FLOAT',
                vals(() => ({ alias: 'focus-ring/width' }))
              ),
            },
            children: [],
          };
        }
        return r;
      }
      variants.push({
        id: familyId + '.' + context,
        name: `Configuration=${story}, State=${state}, Viewport=${viewport}`,
        properties: {
          Configuration: story,
          State: state,
          Viewport: String(viewport),
        },
        sourceRef,
        tree: convert('root'),
        sourceContract: {
          story,
          state,
          viewport,
          actualSourceState: true,
          successfulUnlockNotPerformed: true,
          inputCaretSelectionIMEAccepted: false,
        },
      });
    }
    families.push({
      id: familyId,
      name: 'Mangrove source / Preview access ' + kind,
      kind: 'component-set',
      sourceRef,
      review: { genericLabels: false, preserveVariantSizing: true },
      variantProperties: {
        Configuration: [
          ...new Set(variants.map(v => v.properties.Configuration)),
        ],
        State: [...new Set(variants.map(v => v.properties.State))],
        Viewport: ['390', '1164'],
      },
      variants,
      limitations: [
        'Static submit is source no-op; wrong-PIN alert is actual LiveDemo only. No successful unlock or security enforcement acceptance.',
        'Whole logical source copy and custom input/submit/contact anatomy; no generic Button/Input substitution.',
        'Actual focus border/outline and input value metadata retained; native caret, selected range, IME, arbitrary copy/reflow, accessibility and source behavior remain open.',
        'RGBA live scrim retained without preflattened source pixels. Native pixels/fonts/shadows/live modes/ordinary plugin/publication remain open.',
        'One PreviewAccess source component; authored story configurations and viewport states are finite source candidates.',
      ],
    });
  }
  variables.splice(0, variables.length, ...prepared.variables);
  styles.text.splice(0, styles.text.length, ...prepared.styles.text);
  styles.effect.splice(0, styles.effect.length, ...prepared.styles.effect);
  return families;
}
module.exports = { inspectPreviewAccessSource, buildPreviewAccessRecipes };
