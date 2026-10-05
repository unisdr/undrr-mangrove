#!/usr/bin/env node
/** Switch source and native contract checks. This mock does not render/composite. */
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildSwitchRecipes,
} = require('../../../scripts/figma-switch-recipes.cjs');
const root = path.resolve(__dirname, '../../..'),
  copy = v => JSON.parse(JSON.stringify(v));
const identity = (node, key = 'mgKitId') =>
  node.getSharedPluginData('orgundrrmangrove', key);
function document() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  const families = buildSwitchRecipes({
    root,
    modes: d.modes,
    variables: d.variables,
    styles: d.styles,
  });
  const ids = new Set(families.map(f => f.id));
  d.components.families = [
    ...d.components.families.filter(f => !ids.has(f.id)),
    ...families,
  ];
  return d;
}
function changed(file, before, after, run) {
  const read = fs.readFileSync;
  let changed = false;
  fs.readFileSync = function (filename, ...args) {
    const v = read.call(this, filename, ...args);
    if (typeof filename !== 'string' || !filename.endsWith(file)) return v;
    const next = v.replace(before, after);
    changed = next !== v;
    return next;
  };
  try {
    run();
    assert(changed, `Mutation failed ${before}`);
  } finally {
    fs.readFileSync = read;
  }
}
function property(node, name) {
  const key = Object.keys(node.componentProperties).find(
    key => key.replace(/#[^#]+$/, '') === name
  );
  assert(key);
  return key;
}
function nodes(env) {
  return [...env.state.nodes.values()]
    .filter(n => identity(n))
    .map(n => [identity(n), n.id])
    .sort((a, b) => a[0].localeCompare(b[0]));
}
function installVisibilitySideEffect(env) {
  const prototype = Object.getPrototypeOf(env.figma.currentPage);
  const writes = [];
  const definition = node => {
    const key = node.componentPropertyReferences?.visible;
    if (!key) return null;
    for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
      if (ancestor.type === 'INSTANCE') return { instance: ancestor, key };
      if (ancestor.type === 'COMPONENT') {
        const owner =
          ancestor.parent?.type === 'COMPONENT_SET'
            ? ancestor.parent
            : ancestor;
        return { owner, key };
      }
    }
    return null;
  };
  for (const node of env.state.nodes.values()) {
    node._mockVisible = node.visible;
    delete node.visible;
  }
  Object.defineProperty(prototype, 'visible', {
    configurable: true,
    get() {
      const target = definition(this);
      if (target?.instance) {
        const property = target.instance.componentProperties[target.key];
        if (property) return property.value;
      }
      if (target?.owner?._definitions[target.key]?.type === 'BOOLEAN')
        return target.owner._definitions[target.key].defaultValue;
      return this._mockVisible;
    },
    set(value) {
      const target = definition(this);
      if (target?.owner?._definitions[target.key]?.type === 'BOOLEAN') {
        target.owner._definitions[target.key].defaultValue = value;
        writes.push({ nodeId: this.id, key: target.key, value });
      }
      this._mockVisible = value;
    },
  });
  return writes;
}
async function build(doc, brand = 'undrr') {
  const env = environment(doc);
  installVisibilitySideEffect(env);
  const imported = await env.call(
    'importVariables',
    doc,
    [brand],
    false,
    [],
    false
  );
  assert.strictEqual(imported.errors.length, 0, imported.errors.join('\n'));
  const result = await env.call('buildMangroveComponents', doc, brand, [
    'switch',
    'switch-small',
  ]);
  assert.strictEqual(result.errors.length, 0, result.errors.join('\n'));
  return { env, result };
}
async function main() {
  const doc = document(),
    families = doc.components.families.filter(f =>
      ['switch', 'switch-small'].includes(f.id)
    );
  assert.deepStrictEqual(
    families.map(f => f.variants.length),
    [22, 20]
  );
  const counts = [
    doc.variables.length,
    doc.styles.text.length,
    doc.styles.effect.length,
  ];
  assert.deepStrictEqual(
    buildSwitchRecipes({
      root,
      modes: doc.modes,
      variables: doc.variables,
      styles: doc.styles,
    }),
    families
  );
  assert.deepStrictEqual(counts, [
    doc.variables.length,
    doc.styles.text.length,
    doc.styles.effect.length,
  ]);
  const form = '/stories/Components/Forms/_form-base.scss';
  for (const [before, after] of [
    ['$mg-switch-disabled-opacity: 0.45;', '$mg-switch-disabled-opacity: 0.5;'],
    [
      'calc(#{$mg-switch-track-block} * 1.75)',
      'calc(#{$mg-switch-track-block} * 2)',
    ],
    [
      'calc(#{$mg-switch-track-block} / 12)',
      'calc(#{$mg-switch-track-block} / 10)',
    ],
    ['--mg-switch-size: #{mg-rem(18)};', '--mg-switch-size: #{mg-rem(20)};'],
    [
      'flex-shrink: 0;\n    inline-size: $mg-switch-track-inline;',
      'flex-shrink: 1;\n    inline-size: $mg-switch-track-inline;',
    ],
    ['0 1px 3px rgb(0 0 0 / 0.25)', '0 1px 6px rgb(0 0 0 / 0.25)'],
    [
      '#{0.25 * $mg-switch-disabled-opacity}',
      '#{0.5 * $mg-switch-disabled-opacity}',
    ],
    [
      'border-color: $mg-switch-error;',
      'border-color: $mg-switch-track-checked;',
    ],
  ])
    changed(form, before, after, () =>
      assert.throws(document, /needs updating/)
    );
  changed(
    '/stories/Components/Forms/Checkbox/Checkbox.stories.jsx',
    "className: 'mg-switch mg-switch--small'",
    "className: 'mg-switch small'",
    () => assert.throws(document, /needs updating/)
  );
  console.log(
    'ok  source geometry, no-shrink track, opacity/wash, thumb shadow, invalid boundary and actual HTML story guards'
  );
  const { env, result } = await build(doc),
    variables = new Map(env.state.variables.map(v => [v.name, v]));
  const paint = (node, field, name) =>
    assert.strictEqual(
      node[field][0].boundVariables.color.id,
      variables.get(name).id
    );
  for (const built of result.families) {
    const family = families.find(f => f.id === built.id),
      small = built.id === 'switch-small',
      definitions = env.state.nodes.get(
        built.setId
      ).componentPropertyDefinitions,
      showError = Object.keys(definitions).find(
        key => key.replace(/#[^#]+$/, '') === 'Show error'
      );
    assert(showError);
    assert.strictEqual(definitions[showError].type, 'BOOLEAN');
    assert.strictEqual(definitions[showError].defaultValue, true);
    assert.strictEqual(built.variantIds.length, small ? 20 : 22);
    for (const entry of built.variantIds) {
      const spec = family.variants.find(v => v.id === entry.id),
        p = spec.properties,
        c = env.state.nodes.get(entry.nodeId),
        checked = p.Checked === 'True',
        invalid = p.State.startsWith('Invalid'),
        aria = p.State.includes('AriaDisabled'),
        disabled = p.State.includes('Disabled') && !aria,
        focus = p.State.includes('Focus'),
        narrow = p.Content === 'LongNarrow';
      assert.strictEqual(c.width, narrow ? 240 : 320);
      assert.strictEqual(c.layoutMode, 'VERTICAL');
      const row = c.children.find(n => n.name === 'mg-switch'),
        track = row.children.find(n => n.name === 'mg-switch__track'),
        label = row.children.find(n => n.name === 'mg-switch__label'),
        thumb = track.children.find(n => n.type === 'ELLIPSE'),
        travel = track.children.find(n => n.name === 'mg-switch__travel');
      assert.strictEqual(row.minHeight, 36);
      assert.strictEqual(row.itemSpacing, small ? 5 : 7.5);
      assert.strictEqual(row.counterAxisAlignItems, 'CENTER');
      assert.strictEqual(track.width, small ? 31.5 : 42);
      assert.strictEqual(track.height, small ? 18 : 24);
      assert.strictEqual(track.cornerRadius, small ? 9 : 12);
      assert.strictEqual(track.paddingLeft, small ? 1 : 2);
      assert.strictEqual(track.paddingRight, small ? 1 : 2);
      assert.strictEqual(track.strokeWeight, small ? 1 : 2);
      assert.strictEqual(track.strokesIncludedInLayout, false);
      assert.strictEqual(track.opacity, disabled ? 0.45 : 1);
      assert.strictEqual(c.opacity, 1);
      assert.strictEqual(thumb.width, small ? 15 : 20);
      assert.strictEqual(thumb.height, small ? 15 : 20);
      if (checked) assert.strictEqual(travel.width, small ? 13.5 : 18);
      else assert.strictEqual(travel, undefined);
      assert.strictEqual(track.primaryAxisAlignItems, 'MIN');
      assert.strictEqual(track.counterAxisAlignItems, 'CENTER');
      paint(
        track,
        'fills',
        aria
          ? `component/switch/aria-disabled-${checked ? 'on' : 'off'}-surface`
          : checked
            ? 'color/interactive'
            : 'color/neutral-400'
      );
      paint(
        track,
        'strokes',
        invalid ? 'color/red-900' : 'component/color/transparent'
      );
      paint(thumb, 'fills', 'color/neutral-0');
      paint(
        label,
        'fills',
        disabled || aria ? 'color/neutral-400' : 'color/neutral-900'
      );
      assert.strictEqual(label.fontName.style, 'Regular');
      assert.strictEqual(label.fontSize, 16);
      assert.strictEqual(label.lineHeight.value, 24);
      assert.strictEqual(label.layoutSizingHorizontal, narrow ? 'FILL' : 'HUG');
      const effect = env.state.styles.find(s => s.id === thumb.effectStyleId);
      assert.strictEqual(
        identity(effect, 'mgStyleId'),
        `component.switch.thumb-shadow${aria ? '.aria-disabled' : ''}`
      );
      assert.strictEqual(thumb.effects[0].type, 'DROP_SHADOW');
      assert.deepStrictEqual(thumb.effects[0].offset, { x: 0, y: 1 });
      assert.strictEqual(thumb.effects[0].radius, 3);
      assert.strictEqual(thumb.effects[0].color.a, aria ? 0.1125 : 0.25);
      const error = c.children.find(n => n.name === 'mg-switch__error-wrapper'),
        help = c.children.find(n => n.name === 'mg-switch__help-wrapper');
      assert.strictEqual(error.visible, invalid);
      assert.strictEqual(error.componentPropertyReferences?.visible, undefined);
      assert.strictEqual(
        error.children[0].componentPropertyReferences?.visible,
        showError
      );
      assert.strictEqual(error.children[0].visible, true);
      assert.strictEqual(help.visible, false);
      assert.strictEqual(error.paddingTop, 2.5);
      assert.strictEqual(help.paddingTop, 2.5);
      assert.strictEqual(error.children[0].fontSize, 16);
      assert.strictEqual(help.children[0].fontSize, 12.5);
      assert.strictEqual(help.children[0].lineHeight.value, 24);
      const rings = track.children.filter(
        n => n.name.startsWith('mg-focus-ring /') && n.visible
      );
      assert.strictEqual(rings.length, focus ? 2 : 0);
      if (focus) {
        assert.strictEqual(track.opacity, 1);
        assert.strictEqual(track.clipsContent, false);
        const gold = rings.find(n => n.name.endsWith('coloured outline'));
        paint(gold, 'strokes', 'color/focus-ring');
        assert.strictEqual(gold.cornerRadius, small ? 11 : 14);
      }
      assert(!c.findAll(n => /spinner|pending-ring/.test(n.name)).length);
    }
  }
  const defaultVars = doc.variables.filter(v =>
    v.name.startsWith('component/switch/')
  );
  assert.strictEqual(
    defaultVars.find(v => v.name.endsWith('small/authored-inset')).values.undrr,
    1.5
  );
  assert.strictEqual(
    defaultVars.find(v => v.name.endsWith('small/browser-used-border')).values
      .undrr,
    1
  );
  console.log(
    'ok  all42 basic states, source checked/invalid cascade, Small authored-versus-used inset, independent track dimming, reduced shadow and opaque aria-disabled focus'
  );
  const review = [...env.state.nodes.values()].find(
    n =>
      n.type === 'INSTANCE' &&
      identity(n).startsWith('review/switch/specimen/long-narrow-on')
  );
  assert(review);
  assert.strictEqual(review.width, 240);
  assert.strictEqual(
    review.componentProperties[property(review, 'Label')].value,
    families[0].review.specimens[1].properties.Label
  );
  review.setProperties({
    [property(review, 'Label')]: 'Keep edited label',
    [property(review, 'Help')]: 'Keep edited help',
    [property(review, 'Error')]: 'Keep edited error',
    [property(review, 'Show help')]: true,
    [property(review, 'Show label')]: false,
    [property(review, 'Show error')]: false,
  });
  const ids = nodes(env),
    definitions = result.families.map(f =>
      copy(env.state.nodes.get(f.setId).componentPropertyDefinitions)
    );
  // Earlier imports bound the wrapper itself, overriding its state visibility.
  // Updating owned masters must clear that obsolete reference without replacing nodes.
  for (const built of result.families)
    for (const entry of built.variantIds) {
      const wrapper = env.state.nodes
        .get(entry.nodeId)
        .children.find(n => n.name === 'mg-switch__error-wrapper');
      wrapper.componentPropertyReferences = {
        visible: wrapper.children[0].componentPropertyReferences.visible,
      };
    }
  const repeat = await env.call('buildMangroveComponents', doc, 'undrr', [
    'switch',
    'switch-small',
  ]);
  assert.strictEqual(repeat.errors.length, 0, repeat.errors.join('\n'));
  assert.strictEqual(repeat.createdNodeIds.length, 0);
  assert.deepStrictEqual(nodes(env), ids);
  for (const built of result.families)
    for (const entry of built.variantIds) {
      const wrapper = env.state.nodes
          .get(entry.nodeId)
          .children.find(n => n.name === 'mg-switch__error-wrapper'),
        spec = families
          .find(f => f.id === built.id)
          .variants.find(v => v.id === entry.id);
      assert.strictEqual(
        wrapper.componentPropertyReferences?.visible,
        undefined
      );
      assert.strictEqual(
        wrapper.visible,
        spec.properties.State.startsWith('Invalid')
      );
      assert(wrapper.children[0].componentPropertyReferences.visible);
    }
  assert.deepStrictEqual(
    result.families.map(
      f => env.state.nodes.get(f.setId).componentPropertyDefinitions
    ),
    definitions
  );
  for (const [name, value] of [
    ['Label', 'Keep edited label'],
    ['Help', 'Keep edited help'],
    ['Error', 'Keep edited error'],
    ['Show help', true],
    ['Show label', false],
    ['Show error', false],
  ])
    assert.strictEqual(
      review.componentProperties[property(review, name)].value,
      value
    );
  console.log(
    'ok  fresh-only long label seeds, unchanged set/variant/layer/property IDs and preserved label/help/error/visibility edits'
  );
  {
    const linkedWrites = installVisibilitySideEffect(env);
    const owners = result.families.map(f => env.state.nodes.get(f.setId));
    const errorText = env.state.nodes
      .get(result.families[0].variantIds[0].nodeId)
      .children.find(n => n.name === 'mg-switch__error-wrapper').children[0];
    const key = errorText.componentPropertyReferences.visible;
    errorText.visible = false;
    assert.strictEqual(
      owners[0].componentPropertyDefinitions[key].defaultValue,
      false,
      'Mock reproduces the observed referenced-master setter side effect'
    );
    for (const owner of owners) {
      const map = JSON.parse(identity(owner, 'mgKitProperties'));
      owner._definitions[map['Show error']].defaultValue = false;
      owner._definitions[map['Show label']].defaultValue = false;
      owner._definitions[map['Show help']].defaultValue = true;
    }
    review.setProperties({ [property(review, 'Show label')]: true });
    const preservedDefinitions = owners.map(owner =>
      copy(owner.componentPropertyDefinitions)
    );
    linkedWrites.length = 0;
    const repeated = await env.call('buildMangroveComponents', doc, 'undrr', [
      'switch',
      'switch-small',
    ]);
    assert.deepStrictEqual(copy(repeated.errors), []);
    assert.strictEqual(repeated.createdNodeIds.length, 0);
    assert.deepStrictEqual(
      owners.map(owner => owner.componentPropertyDefinitions),
      preservedDefinitions,
      'Ordinary repeat preserves designer-edited BOOLEAN defaults'
    );
    assert.strictEqual(
      linkedWrites.length,
      0,
      'Compatible referenced layers receive no literal visibility writes'
    );
    assert.strictEqual(
      review.componentProperties[property(review, 'Show label')].value,
      true
    );
    assert.strictEqual(
      review.componentProperties[property(review, 'Show error')].value,
      false
    );
    const reviewLabel = review.findAll(n => n.name === 'mg-switch__label')[0];
    assert.strictEqual(
      reviewLabel.visible,
      true,
      'Consumer override still wins over the false master default'
    );
    const changedRecipe = copy(doc);
    const first = changedRecipe.components.families.find(f => f.id === 'switch')
      .variants[0];
    const removeBinding = node => {
      if (node.name === 'mg-form-error') delete node.visibilityProperty;
      for (const child of node.children || []) removeBinding(child);
    };
    removeBinding(first.tree);
    const charactersKey = errorText.componentPropertyReferences.characters;
    const migrated = await env.call(
      'buildMangroveComponents',
      changedRecipe,
      'undrr',
      ['switch']
    );
    assert.deepStrictEqual(copy(migrated.errors), []);
    assert.strictEqual(
      errorText.componentPropertyReferences.visible,
      undefined
    );
    assert.strictEqual(
      errorText.componentPropertyReferences.characters,
      charactersKey,
      'Detach only obsolete visible reference, retain TEXT reference'
    );
    assert.strictEqual(
      errorText.visible,
      true,
      'Unreferenced source node receives its literal visibility'
    );
    assert.strictEqual(
      owners[0].componentPropertyDefinitions[key].defaultValue,
      false,
      'Detaching before the literal write preserves the shared default'
    );
    console.log(
      'ok  native visible setter reproduces shared-default mutation; compatible defaults and consumer edits survive repeat, obsolete refs detach before source flags and other refs survive'
    );
  }
  {
    const { svgEnvironment } = require('./mock-svg.cjs');
    const fixture = copy(doc);
    fixture.components.families = [
      {
        id: 'visibility-svg',
        name: 'Mangrove/Visibility SVG fixture',
        kind: 'component-set',
        review: { genericLabels: false },
        optionalProperties: { 'Show artwork': { defaultValue: true } },
        variants: [
          {
            id: 'visibility-svg.default',
            name: 'State=Default',
            properties: { State: 'Default' },
            tree: {
              type: 'FRAME',
              id: 'root',
              name: 'Fixture',
              layout: { mode: 'NONE', width: 24, height: 24 },
              children: [
                {
                  type: 'SVG',
                  id: 'art',
                  name: 'Artwork',
                  visibilityProperty: 'Show artwork',
                  svg: {
                    assetId: 'visibility-test',
                    markup:
                      '<svg viewBox="0 0 16 16" fill="none" stroke="#fff"><path d="M0 0L16 16"/></svg>',
                  },
                  layout: { width: 16, height: 16 },
                },
              ],
            },
          },
        ],
      },
    ];
    const svgEnv = svgEnvironment(fixture);
    const linkedWrites = installVisibilitySideEffect(svgEnv);
    await importFoundation(svgEnv, fixture);
    const fresh = await svgEnv.call(
      'buildMangroveComponents',
      fixture,
      'undrr',
      ['visibility-svg']
    );
    assert.deepStrictEqual(copy(fresh.errors), []);
    const owner = svgEnv.state.nodes.get(fresh.families[0].setId);
    const component = svgEnv.state.nodes.get(
      fresh.families[0].variantIds[0].nodeId
    );
    const artwork = component.children[0];
    const key = artwork.componentPropertyReferences.visible;
    owner._definitions[key].defaultValue = false;
    linkedWrites.length = 0;
    const repeated = await svgEnv.call(
      'buildMangroveComponents',
      fixture,
      'undrr',
      ['visibility-svg']
    );
    assert.deepStrictEqual(copy(repeated.errors), []);
    assert.strictEqual(repeated.createdNodeIds.length, 0);
    assert.strictEqual(
      owner.componentPropertyDefinitions[key].defaultValue,
      false
    );
    assert.strictEqual(artwork.visible, false);
    assert.strictEqual(
      linkedWrites.length,
      0,
      'SVG compatible BOOLEAN reference skips literal visibility'
    );
    const moved = copy(fixture);
    delete moved.components.families[0].variants[0].tree.children[0]
      .visibilityProperty;
    const unbound = await svgEnv.call(
      'buildMangroveComponents',
      moved,
      'undrr',
      ['visibility-svg']
    );
    assert.deepStrictEqual(copy(unbound.errors), []);
    assert.strictEqual(artwork.componentPropertyReferences.visible, undefined);
    assert.strictEqual(artwork.visible, true);
    assert.strictEqual(
      owner.componentPropertyDefinitions[key].defaultValue,
      false
    );
    console.log(
      'ok  native SVG wrappers preserve compatible BOOLEAN defaults and clear obsolete refs before source visibility without replacing IDs'
    );
  }
  {
    for (const kind of ['dual-native', 'dual-svg', 'foreign-reference']) {
      const changedDoc = copy(doc);
      const selected = changedDoc.components.families.find(
        f => f.id === 'switch'
      );
      const target = selected.variants[0].tree;
      const bad = environment(changedDoc);
      await importFoundation(bad, changedDoc);
      if (kind === 'foreign-reference') {
        const built = await bad.call(
          'buildMangroveComponents',
          changedDoc,
          'undrr',
          ['switch']
        );
        assert.deepStrictEqual(copy(built.errors), []);
        const owner = bad.state.nodes.get(built.families[0].setId);
        const component = bad.state.nodes.get(
          built.families[0].variantIds[0].nodeId
        );
        const wrapper = component.children.find(
          n => n.name === 'mg-switch__error-wrapper'
        );
        const foreign = owner.addComponentProperty(
          'Designer visibility',
          'BOOLEAN',
          false
        );
        wrapper.componentPropertyReferences = { visible: foreign };
      } else {
        const dual =
          kind === 'dual-svg'
            ? {
                type: 'SVG',
                id: 'bad-svg',
                name: 'Bad',
                visibilityProperty: 'Show error',
                bindings: { visible: 'anything' },
              }
            : target;
        dual.visibilityProperty = 'Show error';
        dual.bindings = { ...(dual.bindings || {}), visible: 'anything' };
        if (kind === 'dual-svg') target.children.push(dual);
      }
      const before = {
        nodes: nodes(bad),
        styles: copy(bad.state.styles),
        variables: copy(bad.state.variables),
      };
      const failure = await bad.call(
        'buildMangroveComponents',
        changedDoc,
        'undrr',
        ['switch']
      );
      assert(
        failure.errors.some(error =>
          error.includes(
            kind === 'foreign-reference'
              ? 'not an owned BOOLEAN'
              : 'cannot control the same node'
          )
        ),
        failure.errors.join('\n')
      );
      assert.deepStrictEqual(nodes(bad), before.nodes);
      assert.deepStrictEqual(copy(bad.state.styles), before.styles);
      assert.deepStrictEqual(copy(bad.state.variables), before.variables);
    }
    console.log(
      'ok  dual variable/BOOLEAN native and SVG contracts and foreign references reject before asset writes'
    );
  }
  const irp = await build(doc, 'irp');
  assert.strictEqual(irp.result.families.length, 2);
  const wash = doc.variables.find(
    v => v.name === 'component/switch/aria-disabled-on-surface'
  );
  const resolve = (name, mode) => {
    const v = doc.variables.find(v => v.name === name).values[mode];
    return v.alias ? resolve(v.alias, mode) : v;
  };
  for (const mode of doc.modes) {
    const base = resolve('color/interactive', mode.id),
      white = resolve('color/neutral-0', mode.id);
    for (const axis of ['r', 'g', 'b'])
      assert(
        Math.abs(
          wash.values[mode.id][axis] - (base[axis] * 0.45 + white[axis] * 0.55)
        ) < 1e-12
      );
    assert.strictEqual(wash.values[mode.id].a, 1);
  }
  console.log(
    'ok  IRP scoped construction and all-mode alias-resolved uniform aria-disabled wash values'
  );
  for (const [kind, mutate, needle] of [
    [
      'type',
      e => {
        e.state.variables.find(
          v => v.name === 'component/switch/small/thumb-travel'
        ).resolvedType = 'COLOR';
      },
      'FLOAT',
    ],
    [
      'font',
      e => e.state.rejectedFonts.add('Roboto Regular'),
      'Roboto Regular',
    ],
  ]) {
    const bad = environment(doc);
    await importFoundation(bad, doc);
    mutate(bad);
    const before = {
      nodes: bad.state.nodes.size,
      styles: bad.state.styles.length,
    };
    const failure = await bad.call('buildMangroveComponents', doc, 'undrr', [
      'switch-small',
    ]);
    assert(
      failure.errors.some(e => e.includes(needle)),
      `${kind}: ${failure.errors.join('\n')}`
    );
    assert.strictEqual(failure.families.length, 0);
    assert.strictEqual(bad.state.nodes.size, before.nodes);
    assert.strictEqual(bad.state.styles.length, before.styles);
  }
  console.log(
    'ok  required font and wrong-type thumb geometry reject before partial canvas/style writes'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e.stack || e);
    process.exitCode = 1;
  });
module.exports = { main };
