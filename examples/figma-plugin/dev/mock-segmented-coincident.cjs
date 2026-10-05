#!/usr/bin/env node
/** Source/preflight/identity contract only. No SCALE layout, raster or native propagation proof. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const {
  buildSegmentedRecipes,
} = require('../../../scripts/figma-segmented-recipes.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const familyId = 'segmented-control.segment';
const identity = (node, key = 'mgKitId') =>
  node.getSharedPluginData('orgundrrmangrove', key);
const familyOf = doc =>
  doc.components.families.find(value => value.id === familyId);
const canonicalNodes = env =>
  [...env.state.nodes.values()].filter(node => {
    if (!identity(node)) return false;
    for (let parent = node.parent; parent; parent = parent.parent)
      if (parent.type === 'INSTANCE') return false;
    return true;
  });
const ids = env =>
  canonicalNodes(env)
    .map(node => [identity(node), node.id])
    .sort((a, b) => a[0].localeCompare(b[0]));
const snapshot = env =>
  copy({
    nodes: canonicalNodes(env).map(node => ({
      id: node.id,
      key: identity(node),
      parentId: node.parent?.id,
      children: node.children.map(child => child.id),
      fills: node.fills,
      strokes: node.strokes,
      bindings: node.boundVariables,
      name: node.name,
    })),
    styles: env.state.styles.map(style => ({
      id: style.id,
      key: identity(style, 'mgStyleId'),
      fontName: style.fontName,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      bindings: style.boundVariables,
    })),
    variables: env.state.variables.map(variable => ({
      id: variable.id,
      key: identity(variable, 'mgId'),
      name: variable.name,
      values: variable.valuesByMode,
    })),
  });
// The shared mock does not copy native style aliases onto TEXT, or all rectangle
// fields onto instance descendants. These scoped copies model those API contracts
// only; they do not simulate native SCALE geometry or property/style coupling.
function modelStyleAndClone(env) {
  const createText = env.figma.createText;
  env.figma.createText = () => {
    const node = createText();
    const apply = node.setTextStyleIdAsync;
    node.setTextStyleIdAsync = async function (styleId) {
      await apply.call(this, styleId);
      const style = env.state.styles.find(value => value.id === styleId);
      if (style)
        for (const [field, alias] of Object.entries(style.boundVariables || {}))
          this.boundVariables[field] = copy(alias);
    };
    return node;
  };
  const create = env.figma.createComponent;
  env.figma.createComponent = () => {
    const main = create();
    const instantiate = main.createInstance;
    main.createInstance = function () {
      const instance = instantiate.call(this);
      const finish = (source, target) => {
        for (const field of [
          'boundVariables',
          'topLeftRadius',
          'topRightRadius',
          'bottomLeftRadius',
          'bottomRightRadius',
          'itemReverseZIndex',
          '_strokesIncludedInLayout',
        ])
          if (source[field] !== undefined) target[field] = copy(source[field]);
        source.children.forEach((child, index) =>
          finish(child, target.children[index])
        );
      };
      finish(this, instance);
      return instance;
    };
    return main;
  };
}
async function build(env, doc) {
  return env.call('buildMangroveComponents', doc, 'undrr', [familyId]);
}
async function main() {
  // Exercise the actual full registry and normalized anatomy, not raw replacement trees.
  const doc = buildFigmaVariables();
  const family = familyOf(doc);
  assert.strictEqual(family.variants.length, 30);
  assert.strictEqual(
    new Set(family.variants.map(variant => variant.id)).size,
    30
  );
  assert.strictEqual(
    family.variants.filter(variant => variant.tree.focusRing).length,
    12
  );
  assert(
    family.variants.every(
      variant =>
        variant.tree.children[0].id ===
        'mg-segmented-control__label/Segment label'
    )
  );
  // Fixed accepted three-recipe snapshot. It must survive this expansion being committed.
  const baselineFamily = {
    variants: [
      {
        id: 'segmented-control.segment.false.default.first',
        name: 'Selected=False, State=Default, Position=First',
        properties: { Selected: 'False', State: 'Default', Position: 'First' },
        tree: {
          type: 'FRAME',
          id: 'mg-segmented-control__label',
          name: 'mg-segmented-control__label',
          fill: null,
          stroke: 'color/button-outline-primary',
          effectStyle: null,
          clipsContent: false,
          strokesIncludedInLayout: true,
          layout: {
            mode: 'HORIZONTAL',
            width: 'HUG',
            height: 'HUG',
            minHeight: 'component/segmented-control/minimum-height',
            align: 'CENTER',
            justify: 'CENTER',
            gap: 'spacing/0',
          },
          bindings: {
            strokeWeight: 'border-width/button',
            topLeftRadius: 'radius/button',
            bottomLeftRadius: 'radius/button',
            topRightRadius: 'spacing/0',
            bottomRightRadius: 'spacing/0',
            paddingTop: 'padding/button/block',
            paddingBottom: 'padding/button/block',
            paddingLeft: 'padding/button/inline',
            paddingRight: 'padding/button/inline',
          },
          children: [
            {
              type: 'TEXT',
              id: 'mg-segmented-control__label/Segment label',
              name: 'Segment label',
              characters: 'Depth',
              textProperty: 'Label',
              textStyle: 'component.segmented-control.segment',
              textDecoration: 'NONE',
              textWrap: 'AUTO',
              fill: 'color/button-outline-primary',
              stroke: null,
              textAlign: 'CENTER',
              layout: { width: 'HUG', height: 'HUG' },
            },
          ],
        },
      },
      {
        id: 'segmented-control.segment.true.default.first',
        name: 'Selected=True, State=Default, Position=First',
        properties: { Selected: 'True', State: 'Default', Position: 'First' },
        tree: {
          type: 'FRAME',
          id: 'mg-segmented-control__label',
          name: 'mg-segmented-control__label',
          fill: 'color/button-background',
          stroke: 'color/button-background',
          effectStyle: null,
          clipsContent: false,
          strokesIncludedInLayout: true,
          layout: {
            mode: 'HORIZONTAL',
            width: 'HUG',
            height: 'HUG',
            minHeight: 'component/segmented-control/minimum-height',
            align: 'CENTER',
            justify: 'CENTER',
            gap: 'spacing/0',
          },
          bindings: {
            strokeWeight: 'border-width/button',
            topLeftRadius: 'radius/button',
            bottomLeftRadius: 'radius/button',
            topRightRadius: 'spacing/0',
            bottomRightRadius: 'spacing/0',
            paddingTop: 'padding/button/block',
            paddingBottom: 'padding/button/block',
            paddingLeft: 'padding/button/inline',
            paddingRight: 'padding/button/inline',
          },
          children: [
            {
              type: 'TEXT',
              id: 'mg-segmented-control__label/Segment label',
              name: 'Segment label',
              characters: 'Depth',
              textProperty: 'Label',
              textStyle: 'component.segmented-control.segment',
              textDecoration: 'NONE',
              textWrap: 'AUTO',
              fill: 'color/button',
              stroke: null,
              textAlign: 'CENTER',
              layout: { width: 'HUG', height: 'HUG' },
            },
          ],
        },
      },
      {
        id: 'segmented-control.segment.false.hover.first',
        name: 'Selected=False, State=Hover, Position=First',
        properties: { Selected: 'False', State: 'Hover', Position: 'First' },
        tree: {
          type: 'FRAME',
          id: 'mg-segmented-control__label',
          name: 'mg-segmented-control__label',
          fill: 'color/button-outline-primary--hover',
          stroke: 'color/button-outline-primary--hover',
          effectStyle: null,
          clipsContent: false,
          strokesIncludedInLayout: true,
          layout: {
            mode: 'HORIZONTAL',
            width: 'HUG',
            height: 'HUG',
            minHeight: 'component/segmented-control/minimum-height',
            align: 'CENTER',
            justify: 'CENTER',
            gap: 'spacing/0',
          },
          bindings: {
            strokeWeight: 'border-width/button',
            topLeftRadius: 'radius/button',
            bottomLeftRadius: 'radius/button',
            topRightRadius: 'spacing/0',
            bottomRightRadius: 'spacing/0',
            paddingTop: 'padding/button/block',
            paddingBottom: 'padding/button/block',
            paddingLeft: 'padding/button/inline',
            paddingRight: 'padding/button/inline',
          },
          children: [
            {
              type: 'TEXT',
              id: 'mg-segmented-control__label/Segment label',
              name: 'Segment label',
              characters: 'Depth',
              textProperty: 'Label',
              textStyle: 'component.segmented-control.segment',
              textDecoration: 'NONE',
              textWrap: 'AUTO',
              fill: 'color/button',
              stroke: null,
              textAlign: 'CENTER',
              layout: { width: 'HUG', height: 'HUG' },
            },
          ],
        },
      },
    ],
  };
  assert.strictEqual(baselineFamily.variants.length, 3);
  assert.deepStrictEqual(family.variants.slice(0, 3), baselineFamily.variants);
  const raw = buildSegmentedRecipes({
    root: path.resolve(__dirname, '../../..'),
    ...copy(doc),
  })[0];
  assert.strictEqual(raw.variants.length, 30);
  const badSource = copy(doc);
  badSource.variables.find(
    value => value.name === 'effect-size/focus-ring/outer-spread'
  ).values.undrr = 99;
  const foundations = copy({
    variables: badSource.variables,
    styles: badSource.styles,
  });
  assert.throws(
    () =>
      buildSegmentedRecipes({
        root: path.resolve(__dirname, '../../..'),
        ...badSource,
      }),
    /outer-spread/
  );
  assert.deepStrictEqual(
    { variables: badSource.variables, styles: badSource.styles },
    foundations
  );
  console.log(
    'ok  normalized Default30 source axes,12 focused endpoints, original3 recipe equality and mutation-free source sum rejection'
  );

  const env = environment(doc);
  modelStyleAndClone(env);
  await importFoundation(env, doc);
  const old = copy(doc);
  familyOf(old).variants = copy(baselineFamily.variants);
  const first = await build(env, old);
  assert.deepStrictEqual(copy(first.errors), []);
  const preserved = ids(env);
  const set = env.state.nodes.get(first.families[0].setId);
  const propertyKey = Object.keys(set.componentPropertyDefinitions).find(key =>
    key.startsWith('Label#')
  );
  const oldDefinitions = copy(set.componentPropertyDefinitions);
  const expanded = await build(env, doc);
  assert.deepStrictEqual(copy(expanded.errors), []);
  assert.strictEqual(expanded.families[0].variantIds.length, 30);
  const newIds = new Map(ids(env));
  for (const [key, nativeId] of preserved)
    assert.strictEqual(newIds.get(key), nativeId);
  assert.deepStrictEqual(
    copy(set.componentPropertyDefinitions),
    oldDefinitions
  );
  const roles = new Map(
    env.state.variables.map(variable => [variable.name, variable])
  );
  const style = env.state.styles.find(
    value =>
      identity(value, 'mgStyleId') === 'component.segmented-control.segment'
  );
  assert(style);
  const allMains = expanded.families[0].variantIds.map(value =>
    env.state.nodes.get(value.nodeId)
  );
  const check = () => {
    for (const [index, variant] of family.variants.entries()) {
      const main = allMains[index],
        label = main.findAll(node => node.type === 'TEXT')[0];
      assert.strictEqual(label.textStyleId, style.id);
      assert.strictEqual(
        label.componentPropertyReferences.characters,
        propertyKey
      );
      assert.strictEqual(
        label.boundVariables.fontFamily.id,
        roles.get('font-family/text').id
      );
      assert.strictEqual(
        label.boundVariables.fontSize.id,
        roles.get('font-size/button').id
      );
      assert.deepStrictEqual(
        copy(label.getRangeFills(0, label.characters.length)),
        copy(label.fills)
      );
      assert.strictEqual(
        label.fills[0].boundVariables.color.id,
        roles.get(variant.tree.children[0].fill).id
      );
      assert.strictEqual(main.strokeAlign, 'INSIDE');
      assert.strictEqual(main.strokesIncludedInLayout, true);
      for (const [field, name] of Object.entries(variant.tree.bindings))
        assert.strictEqual(main.boundVariables[field].id, roles.get(name).id);
      const rectangles = main.children.filter(
        node => node.type === 'RECTANGLE'
      );
      if (!variant.tree.focusRing) {
        assert.strictEqual(rectangles.length, 0);
        continue;
      }
      assert.strictEqual(rectangles.length, 2);
      assert.strictEqual(main.itemReverseZIndex, false);
      assert.strictEqual(main.children[0], rectangles[0]);
      assert.strictEqual(main.children[1], rectangles[1]);
      for (const [i, ring] of rectangles.entries()) {
        assert.strictEqual(
          identity(ring),
          `family/${familyId}/variant/${variant.id}/focus/${i === 0 ? 'outer' : 'separator'}`
        );
        assert.strictEqual(ring.parent, main);
        assert.strictEqual(ring.visible, true);
        assert.strictEqual(ring.opacity, 1);
        assert.strictEqual(ring.x, 0);
        assert.strictEqual(ring.y, 0);
        assert.strictEqual(ring.width, main.width);
        assert.strictEqual(ring.height, main.height);
        assert.deepStrictEqual(copy(ring.constraints), {
          horizontal: 'SCALE',
          vertical: 'SCALE',
        });
        assert.strictEqual(ring.layoutPositioning, 'ABSOLUTE');
        assert.strictEqual(ring.strokeAlign, 'OUTSIDE');
        assert.strictEqual(ring.strokeJoin, 'MITER');
        assert.strictEqual(ring.strokeWeight, i === 0 ? 4 : 2);
        assert.strictEqual(
          ring.boundVariables.strokeWeight.id,
          roles.get(
            i === 0
              ? 'effect-size/focus-ring/outer-spread'
              : 'focus-ring/offset'
          ).id
        );
        assert.strictEqual(
          ring.strokes[0].boundVariables.color.id,
          roles.get(i === 0 ? 'color/focus-ring' : 'color/neutral-0').id
        );
        assert.deepStrictEqual(copy(ring.fills), []);
        assert.deepStrictEqual(copy(ring.effects), []);
        assert.strictEqual(ring.boundVariables.cornerRadius, undefined);
        for (const [field, name] of Object.entries(
          variant.tree.focusRing.cornerBindings
        ))
          assert.strictEqual(ring.boundVariables[field].id, roles.get(name).id);
      }
    }
  };
  check();
  assert.strictEqual(
    expanded.audit.filter(value => value.renderer === 'COINCIDENT_SCALE')
      .length,
    12
  );
  console.log(
    'ok  native3-to30 mock expansion preserves SET/COMPONENT/TEXT identities and Label key; source paints/style/aliases/per-corner4+2 SCALE renderer'
  );

  const consumer =
    allMains[
      family.variants.findIndex(variant => variant.properties.State === 'Focus')
    ].createInstance();
  env.figma.currentPage.appendChild(consumer);
  consumer.setSharedPluginData(
    'orgundrrmangrove',
    'mgKitId',
    'mock-segmented-coincident/consumer'
  );
  consumer.setPluginData('mgKitId', 'mock-segmented-coincident/consumer');
  consumer.setProperties({ [propertyKey]: 'Edited finite label' });
  const text = consumer.findAll(node => node.type === 'TEXT')[0];
  // This base mock records native component property overrides but does not mirror
  // character inheritance. Explicit mirroring here is limited to this edit fixture.
  text.characters = 'Edited finite label';
  text.textAlignHorizontal = 'RIGHT';
  consumer.resize(240, consumer.height);
  const outlineBefore = copy(
    consumer.children
      .filter(node => node.type === 'RECTANGLE')
      .map(node => ({
        id: node.id,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        constraints: node.constraints,
        strokes: node.strokes,
        bindings: node.boundVariables,
      }))
  );
  for (const rectangle of consumer.children.filter(
    node => node.type === 'RECTANGLE'
  )) {
    for (const field of ['x', 'y', 'width', 'height', 'constraints']) {
      const retained = rectangle[field];
      Object.defineProperty(rectangle, field, {
        configurable: true,
        get: () => retained,
        set: () => {
          throw new Error(`Consumer outline ${field} mutation forbidden`);
        },
      });
    }
  }
  const stableIds = ids(env);
  for (let pass = 0; pass < 2; pass++) {
    const repeat = await build(env, doc);
    assert.deepStrictEqual(copy(repeat.errors), []);
    assert.strictEqual(repeat.createdNodeIds.length, 0);
    assert.deepStrictEqual(ids(env), stableIds);
    assert.deepStrictEqual(
      copy(set.componentPropertyDefinitions),
      oldDefinitions
    );
    assert.strictEqual(
      consumer.componentProperties[propertyKey].value,
      'Edited finite label'
    );
    assert.strictEqual(text.characters, 'Edited finite label');
    assert.strictEqual(text.textAlignHorizontal, 'RIGHT');
    assert.strictEqual(consumer.width, 240);
    assert.deepStrictEqual(
      copy(
        consumer.children
          .filter(node => node.type === 'RECTANGLE')
          .map(node => ({
            id: node.id,
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            constraints: node.constraints,
            strokes: node.strokes,
            bindings: node.boundVariables,
          }))
      ),
      outlineBefore
    );
    check();
  }
  console.log(
    'ok  two ordinary mock repeats retain canonical IDs/Label, edited consumer width/content and never write inherited outline geometry'
  );

  const mutateCases = [
    [
      'unknown renderer',
      variant => {
        variant.tree.focusRing.renderer = 'OTHER';
      },
    ],
    [
      'wrong source style',
      (variant, bad) => {
        bad.styles.text.find(
          value => value.id === 'component.segmented-control.segment'
        ).values.undrr.lineHeight.value = 100;
      },
    ],
    [
      'wrong state paint',
      variant => {
        variant.tree.fill = 'color/button-background';
      },
    ],
    [
      'wrong family',
      (variant, bad) => {
        familyOf(bad).id = 'other-family';
      },
    ],
    [
      'inconsistent state',
      variant => {
        variant.properties.State = 'Default';
      },
    ],
    [
      'wrong corner alias',
      variant => {
        variant.tree.focusRing.cornerBindings.topLeftRadius = 'spacing/0';
      },
    ],
    [
      'unknown corner',
      variant => {
        variant.tree.focusRing.cornerBindings.extra = 'spacing/0';
      },
    ],
    [
      'wrong anatomy',
      variant => {
        variant.tree.children[0].id = 'label';
      },
    ],
    [
      'missing focus ring',
      variant => {
        delete variant.tree.focusRing;
      },
    ],
    [
      'wrong sum',
      (variant, bad) => {
        bad.variables.find(
          value => value.name === 'effect-size/focus-ring/outer-spread'
        ).values.undrr = 3;
      },
    ],
    [
      'duplicate source role',
      (variant, bad) => {
        bad.variables.push(
          copy(bad.variables.find(value => value.name === 'color/focus-ring'))
        );
      },
    ],
    [
      'wrong source type',
      (variant, bad) => {
        bad.variables.find(value => value.name === 'color/focus-ring').type =
          'FLOAT';
      },
    ],
  ];
  for (const [name, mutate] of mutateCases) {
    const bad = copy(doc),
      variant = familyOf(bad).variants.find(value => value.tree.focusRing);
    mutate(variant, bad);
    const before = snapshot(env);
    const result = await env.call('buildMangroveComponents', bad, 'undrr', [
      name === 'wrong family' ? 'other-family' : familyId,
    ]);
    assert(
      result.errors.some(error => error.includes('COINCIDENT_SCALE')),
      `${name}: ${result.errors.join('\n')}`
    );
    assert.deepStrictEqual(snapshot(env), before, name);
    assert.strictEqual(result.createdNodeIds.length, 0);
  }
  const sum = roles.get('effect-size/focus-ring/outer-spread');
  const originalType = sum.resolvedType;
  sum.resolvedType = 'STRING';
  const before = snapshot(env),
    badType = await build(env, doc);
  assert(badType.errors.some(error => error.includes('COINCIDENT_SCALE')));
  assert.deepStrictEqual(snapshot(env), before);
  sum.resolvedType = originalType;
  console.log(
    'ok  renderer/family/state/anatomy/corner/source-sum/duplicate/type refusals precede style and canvas mutations'
  );

  for (const brand of doc.modes.filter(value => value.id !== 'undrr')) {
    const branded = environment(doc);
    modelStyleAndClone(branded);
    const imported = await branded.call(
      'importVariables',
      doc,
      [brand.id],
      false,
      [],
      true
    );
    assert.deepStrictEqual(copy(imported.errors), []);
    const result = await branded.call(
      'buildMangroveComponents',
      doc,
      brand.id,
      [familyId]
    );
    assert.deepStrictEqual(copy(result.errors), [], brand.id);
    assert.strictEqual(result.families[0].variantIds.length, 30);
    assert.strictEqual(
      result.audit.filter(value => value.renderer === 'COINCIDENT_SCALE')
        .length,
      12
    );
  }
  console.log(
    'ok  all five source brands build the same30 endpoints with selected native modes and typed focus aliases'
  );

  const runtime = fs.readFileSync(
    path.join(__dirname, '../kit-builder.js'),
    'utf8'
  );
  const disabled = await env.runCode(
    `const MG_CONNECTOR_COINCIDENT_FOCUS=false; ${runtime}; return buildMangroveComponents(${JSON.stringify(doc)},'undrr',['${familyId}']);`
  );
  assert(disabled.errors.some(error => error.includes('unavailable')));
  // Native role identities remain exact even when their colour literals use
  // documented float32 storage. No tolerance is applied to repeat snapshots.
  const focusColor = roles.get('color/focus-ring');
  const modeId = env.state.collections[0].modes[0].modeId;
  const originalColor = copy(focusColor.valuesByMode[modeId]);
  if (originalColor.type !== 'VARIABLE_ALIAS') {
    focusColor.valuesByMode[modeId] = Object.fromEntries(
      Object.entries(originalColor).map(([field, value]) => [
        field,
        Math.fround(value),
      ])
    );
    assert.deepStrictEqual(copy((await build(env, doc)).errors), []);
    focusColor.valuesByMode[modeId] = originalColor;
  }
  const originalIdentity = identity(sum, 'mgId');
  sum.setSharedPluginData('orgundrrmangrove', 'mgId', 'wrong-role');
  sum.setPluginData('mgId', 'wrong-role');
  const wrongIdentity = await build(env, doc);
  assert(
    wrongIdentity.errors.some(error => error.includes('COINCIDENT_SCALE'))
  );
  sum.setSharedPluginData('orgundrrmangrove', 'mgId', originalIdentity);
  sum.setPluginData('mgId', originalIdentity);
  const legacy = await env.call('buildMangroveComponents', doc, 'undrr', [
    'button',
  ]);
  assert.deepStrictEqual(copy(legacy.errors), []);
  const legacyFocus = legacy.families[0].variantIds.find(
    value => value.id === 'button.primary.outline.focus'
  );
  const legacyBody = env.state.nodes.get(legacyFocus.nodeId);
  const legacyRings = legacyBody.children.filter(
    node => node.type === 'RECTANGLE'
  );
  assert.strictEqual(legacyRings.length, 2);
  assert.deepStrictEqual(copy(legacyRings[0].constraints), {
    horizontal: 'STRETCH',
    vertical: 'STRETCH',
  });
  assert.strictEqual(legacyRings[0].x, -2);
  assert.strictEqual(legacyRings[0].width, legacyBody.width + 4);
  assert.strictEqual(legacyRings[0].strokeWeight, 2);
  assert.strictEqual(legacyRings[1].strokeWeight, 2);
  assert.strictEqual(
    legacyRings[0].boundVariables.cornerRadius.id,
    roles.get('focus-ring/outer-radius-button').id
  );
  console.log(
    'ok  typed native role identity guard, float32 COLOR representation and unchanged legacy STRETCH focus renderer'
  );
  console.log(
    'ok  explicitly disabled connector capability fails closed; native SCALE/raster/middle occlusion and shared-property propagation remain separate acceptance'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { main };
