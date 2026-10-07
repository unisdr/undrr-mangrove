'use strict';
const assert = require('node:assert/strict');
const path = require('path');
const {
  sourcePlan,
} = require('../examples/figma-plugin/holistic/assets/menu-items/source-plan.cjs');
const copy = x => structuredClone(x);
function buildMenuItemsRecipes(document, options = {}) {
  const plan = sourcePlan({
    ...options,
    repositoryRoot:
      options.repositoryRoot || document.root || path.resolve(__dirname, '..'),
  });
  const { modes } = document;
  assert(Array.isArray(modes) && modes.length === 5);
  assert.deepEqual(
    [...modes.map(m => m.id)].sort(),
    Object.keys(plan.sourceAppearances[0].modes).sort()
  );
  assert.equal(new Set(modes.map(m => m.id)).size, 5);
  assert(
    Array.isArray(document.variables) &&
      Array.isArray(document.styles?.text) &&
      Array.isArray(document.styles.effect)
  );
  const variables = copy(document.variables),
    styles = copy(document.styles),
    byName = new Map(variables.map(v => [v.name, v]));
  assert.equal(byName.size, variables.length);
  assert.equal(new Set(variables.map(v => v.id)).size, variables.length);
  const per = fn => Object.fromEntries(modes.map(m => [m.id, fn(m.id)]));
  function resolve(name, mode, type, path = []) {
    const v = byName.get(name);
    assert(v && v.type === type, 'Menu source role type ' + name);
    assert(!path.includes(name), 'Menu source alias cycle');
    assert.deepEqual(Object.keys(v.values).sort(), modes.map(m => m.id).sort());
    const x = v.values[mode];
    if (x && typeof x === 'object' && Object.hasOwn(x, 'alias'))
      return resolve(x.alias, mode, type, [...path, name]);
    if (type === 'FLOAT') assert(typeof x === 'number' && Number.isFinite(x));
    if (type === 'STRING') assert(typeof x === 'string' && x.trim());
    if (type === 'BOOLEAN') assert.equal(typeof x, 'boolean');
    if (type === 'COLOR')
      assert(
        x &&
          !Array.isArray(x) &&
          ['r', 'g', 'b', 'a'].every(
            k =>
              typeof x[k] === 'number' &&
              Number.isFinite(x[k]) &&
              x[k] >= 0 &&
              x[k] <= 1
          )
      );
    return x;
  }
  for (const v of variables) {
    assert(['FLOAT', 'STRING', 'COLOR', 'BOOLEAN'].includes(v.type));
    for (const m of modes) resolve(v.name, m.id, v.type);
  }
  for (const [kind, type] of [
    ['text', 'TEXT'],
    ['effect', 'EFFECT'],
  ]) {
    assert.equal(
      new Set(styles[kind].map(s => s.id)).size,
      styles[kind].length
    );
    for (const s of styles[kind]) {
      assert(s.type === undefined || s.type === type);
      assert.deepEqual(
        Object.keys(s.values).sort(),
        modes.map(m => m.id).sort()
      );
      for (const m of modes) {
        const x = s.values[m.id];
        if (type === 'TEXT')
          assert(
            x &&
              !Array.isArray(x) &&
              x.fontName &&
              !Array.isArray(x.fontName) &&
              typeof x.fontName.family === 'string' &&
              x.fontName.family.trim() &&
              typeof x.fontName.style === 'string' &&
              x.fontName.style.trim()
          );
        else assert(Array.isArray(x));
      }
    }
  }
  function addRole(id, type, fn) {
    const name = 'component/menu-items-controlled/' + id.replaceAll('.', '-');
    assert(!byName.has(name), 'Duplicate Menu role');
    const v = { id: name, name, type, scopes: ['ALL_SCOPES'], values: per(fn) };
    variables.push(v);
    byName.set(name, v);
    for (const m of modes) resolve(name, m.id, type);
    return name;
  }
  const rgba = s => {
    const p = s.match(/^rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)$/);
    assert(p, 'Menu source color ' + s);
    return {
      r: Number(p[1]) / 255,
      g: Number(p[2]) / 255,
      b: Number(p[3]) / 255,
      a: p[4] === undefined ? 1 : Number(p[4]),
    };
  };
  const variants = [];
  for (const appearance of plan.sourceAppearances) {
    const id = appearance.id,
      row = m => appearance.modes[m],
      css = m => row(m).computed,
      number = (suffix, fn) => addRole(id + '/' + suffix, 'FLOAT', fn),
      color = (suffix, fn) =>
        addRole(id + '/' + suffix, 'COLOR', m => rgba(fn(m)));
    const family = addRole(id + '/font-family', 'STRING', m =>
        css(m).fontFamily.split(',')[0].replaceAll('"', '').trim()
      ),
      size = number('font-size', m => parseFloat(css(m).fontSize)),
      sid = 'component.menu-items-controlled.' + id + '.label';
    assert(!styles.text.some(s => s.id === sid));
    styles.text.push({
      id: sid,
      name: 'Mangrove/Controlled MenuItems/' + id + '/label',
      type: 'TEXT',
      bindings: { fontFamily: family, fontSize: size },
      values: per(m => ({
        fontName: { family: resolve(family, m, 'STRING'), style: 'Regular' },
        fontSize: resolve(size, m, 'FLOAT'),
        lineHeight: { unit: 'PIXELS', value: 24 },
        letterSpacing: {
          unit: 'PIXELS',
          value:
            css(m).letterSpacing === 'normal'
              ? 0
              : parseFloat(css(m).letterSpacing),
        },
        paragraphSpacing: 0,
        textDecoration:
          css(m).textDecorationLine === 'none' ? 'NONE' : 'UNDERLINE',
      })),
    });
    const width = number('anchor-envelope-width', m => row(m).ownerSize.width),
      height = number('anchor-envelope-height', m => row(m).ownerSize.height),
      ink = color('captured-ink', m => css(m).color);
    const characters = row(modes[0].id).characters,
      children = [
        {
          id: 'label',
          type: 'TEXT',
          name: 'Whole actual anchor logical copy',
          characters,
          textProperty:
            appearance.script + ' ' + appearance.copyKind + ' Label',
          textStyle: sid,
          fill: ink,
          textAlign: appearance.script === 'arabic' ? 'RIGHT' : 'LEFT',
          textWrap: 'AUTO',
          layout: { width: 'FILL', height: 'HUG' },
        },
      ];
    const fragmentCount = row(modes[0].id).inlineFragments.length;
    for (let i = 0; i < fragmentCount; i++) {
      const fragment = m => row(m).inlineFragments[i],
        fw = number('fragment-' + i + '-width', m => fragment(m).width),
        fh = number('fragment-' + i + '-height', m => fragment(m).height),
        fx = number('fragment-' + i + '-x', m => fragment(m).x),
        fy = number('fragment-' + i + '-y', m => fragment(m).y);
      if (appearance.active === 'selected') {
        const border = color(
            'fragment-' + i + '-border',
            m => css(m).borderBottomColor
          ),
          borderTop = number(
            'fragment-' + i + '-border-y',
            m => fragment(m).y + fragment(m).height - 2
          );
        children.push({
          id: 'selected-border-' + i,
          type: 'FRAME',
          name: 'Captured inline fragment bottom border',
          layout: { width: fw, height: 2, clipsContent: false },
          fill: border,
          absolute: {
            horizontal: 'START',
            vertical: 'START',
            offsetX: fx,
            offsetY: borderTop,
          },
        });
      }
      if (appearance.state === 'focus') {
        const ring = color(
            'fragment-' + i + '-focus-color',
            m => css(m).outlineColor
          ),
          separator = addRole(
            id + '/fragment-' + i + '-white-separator',
            'COLOR',
            () => ({ r: 1, g: 1, b: 1, a: 1 })
          );
        children.push({
          id: 'focus-fragment-' + i,
          type: 'FRAME',
          name: 'Captured inline fragment focus candidate',
          layout: {
            mode: 'VERTICAL',
            width: fw,
            height: fh,
            clipsContent: false,
          },
          fill: null,
          absolute: {
            horizontal: 'START',
            vertical: 'START',
            offsetX: fx,
            offsetY: fy,
          },
          focusRing: {
            color: ring,
            separatorColor: separator,
            width: number('fragment-' + i + '-focus-width', m =>
              parseFloat(css(m).outlineWidth)
            ),
            offset: number('fragment-' + i + '-focus-offset', m =>
              parseFloat(css(m).outlineOffset)
            ),
            radius: number('fragment-' + i + '-zero-radius-candidate', () => 0),
            outerRadius: number(
              'fragment-' + i + '-zero-outer-radius-candidate',
              () => 0
            ),
          },
        });
      }
    }
    variants.push({
      id: 'menu-items-controlled.' + id,
      name:
        'Script=' +
        appearance.script +
        ',SourceViewport=' +
        appearance.viewport +
        ',Active=' +
        appearance.active +
        ',Interaction=' +
        appearance.state +
        ',Copy=' +
        appearance.copyKind,
      properties: {
        Script: appearance.script,
        SourceViewport: String(appearance.viewport),
        Active: appearance.active,
        Interaction: appearance.state,
        Copy: appearance.copyKind,
      },
      sourceContract: {
        ...copy(appearance),
        element: 'A',
        fixtureContext:
          'External UL.menu > LI; UA bullets and wrappers excluded from atom drawing',
        authoredStory: false,
        packageExport: false,
        sourceOnly: true,
        nativeAccepted: false,
        textPlacement:
          'Whole native editable TEXT source-candidate at START; no inline baseline/glyph-box equivalence asserted. Source glyph envelope and24px line-height retained independently.',
        fragmentPlacement:
          'Finite captured fragment border/focus positions; no arbitrary-copy native inline reflow solver or consumer border/focus repositioning claimed.',
      },
      tree: {
        id: 'anchor-envelope',
        type: 'FRAME',
        name: 'Controlled actual MenuItems anchor appearance',
        layout: {
          mode: 'VERTICAL',
          width,
          height,
          clipsContent: false,
          gap: 0,
          paddingTop: 0,
          paddingRight: 0,
          paddingBottom: 0,
          paddingLeft: 0,
        },
        fill: null,
        sourceHref: '#',
        sourceTabIndex: '0',
        children,
      },
    });
  }
  const family = {
    id: 'menu-items-controlled-source-candidate',
    kind: 'component-set',
    name: 'Controlled retained MenuItems source candidate',
    defaultVariant: variants[0].id,
    review: { preserveVariantSizing: true, genericLabels: false },
    variants,
    limitations: [
      'Controlled retained UL.menu anchor appearances only; this source has no authored story or public package export. Wrapper and user-agent bullet geometry are excluded.',
      'Border and focus fragments retain captured source positions; arbitrary edited-copy native glyph reflow and fragment repositioning are unverified.',
      'Modeled property and consumer preservation do not establish native rendering, publication or consumer update acceptance.',
    ],
  };
  // Complete source proof before caller mutation. Each mode's style resolves to the exact captured source family/size.
  for (const s of styles.text.filter(s =>
    s.id.startsWith('component.menu-items-controlled.')
  ))
    for (const m of modes) {
      assert.equal(
        resolve(s.bindings.fontFamily, m.id, 'STRING'),
        s.values[m.id].fontName.family
      );
      assert.equal(
        resolve(s.bindings.fontSize, m.id, 'FLOAT'),
        s.values[m.id].fontSize
      );
    }
  document.variables.splice(0, document.variables.length, ...variables);
  document.styles.text.splice(0, document.styles.text.length, ...styles.text);
  return [family];
}
module.exports = { buildMenuItemsRecipes };
