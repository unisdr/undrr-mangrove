#!/usr/bin/env node
/** Bounded runtime contracts, not native text reflow/rendering acceptance. */
'use strict';
const assert = require('assert');
const { environment, importFoundation } = require('./mock-kit.cjs');
const { document } = require('./mock-editorial-cta.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const id = node => node.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function fixture() {
  const doc = document();
  const family = doc.components.families.find(f => f.id === 'editorial-cta');
  const variant = family.variants.find(
    v =>
      v.properties.Context === 'Base' &&
      v.properties.State === 'Hover' &&
      v.properties.Content === 'Short' &&
      v.properties.Motion === 'NoPreference'
  );
  assert(variant);
  family.variants = [variant];
  delete family.review;
  variant.tree.layout.width = 300;
  variant.tree.layout.height = 48;
  variant.tree.children[0].textDecoration = 'UNDERLINE';
  return { doc, family, tree: variant.tree };
}
async function build(doc) {
  const env = environment(doc);
  await importFoundation(env, doc);
  const result = await env.call('buildMangroveComponents', doc, 'undrr', [
    'editorial-cta',
  ]);
  assert.strictEqual(result.errors.length, 0, result.errors.join('\n'));
  return { env, result };
}
function stateSnapshot(env) {
  return JSON.stringify({
    nodes: [...env.state.nodes.values()].map(node => [
      node.id,
      node.name,
      node.width,
      node.height,
      node.x,
      node.y,
      node.sharedData,
    ]),
    styles: env.state.styles,
    variables: env.state.variables,
  });
}
async function reject(change, pattern) {
  const { doc, tree } = fixture();
  change(tree, doc);
  const env = environment(doc);
  await importFoundation(env, doc);
  const before = stateSnapshot(env);
  const result = await env.call('buildMangroveComponents', doc, 'undrr', [
    'editorial-cta',
  ]);
  assert(
    result.errors.some(error => pattern.test(error)),
    result.errors.join('\n')
  );
  assert.strictEqual(
    stateSnapshot(env),
    before,
    'Rejected contract must not mutate canvas, styles or variables'
  );
}
async function main() {
  const { doc, tree } = fixture();
  const { env, result } = await build(doc);
  const main = env.state.nodes.get(result.families[0].variantIds[0].nodeId);
  const badge = main.children.find(node => node.name === tree.children[1].name);
  const label = main.children.find(node => node.type === 'TEXT');
  assert.strictEqual(main.width, 300);
  assert.strictEqual(main.height, 48);
  assert.strictEqual(badge.layoutPositioning, 'ABSOLUTE');
  assert.deepStrictEqual(copy(badge.constraints), {
    horizontal: 'MAX',
    vertical: 'CENTER',
  });
  const offset = env.state.variables
    .find(v => v.name === tree.children[1].absolute.offsetX)
    .resolveForConsumer(badge).value;
  assert.strictEqual(badge.x, main.width - badge.width + offset);
  assert.strictEqual(badge.y, (main.height - badge.height) / 2);
  assert.deepStrictEqual(copy(label.textDecorationOffset), {
    unit: 'PERCENT',
    value: 20,
  });
  assert.strictEqual(label.textDecoration, 'UNDERLINE');
  const inspected = await env.call('inspectMangroveKit');
  const inspectedBadge = inspected.nodes.find(node => node.id === badge.id);
  assert.strictEqual(inspectedBadge.layoutPositioning, 'ABSOLUTE');
  assert.deepStrictEqual(
    copy(inspectedBadge.constraints),
    copy(badge.constraints)
  );
  assert.deepStrictEqual(
    copy(
      inspected.nodes.find(node => node.id === label.id).textDecorationOffset
    ),
    copy(label.textDecorationOffset)
  );
  console.log(
    'ok  absolute endpoint geometry/MAX-CENTER constraints and native underline offset appear in read-only inspection'
  );

  const review = [...env.state.nodes.values()].find(
    node =>
      node.type === 'INSTANCE' && id(node).startsWith('review/editorial-cta/')
  );
  assert(review);
  const property = Object.keys(review.componentProperties).find(
    key => key.replace(/#[^#]+$/, '') === 'Label'
  );
  review.setProperties({ [property]: 'Preserve my edited editorial title' });
  const editedLabel = review.findAll(
    node =>
      node.type === 'TEXT' &&
      node.componentPropertyReferences?.characters === property
  )[0];
  assert(editedLabel);
  editedLabel.textDecorationOffset = { unit: 'PIXELS', value: 7 };
  const identities = [...env.state.nodes.values()]
    .filter(node => id(node))
    .map(node => [node.id, id(node)]);
  const repeat = await env.call('buildMangroveComponents', doc, 'undrr', [
    'editorial-cta',
  ]);
  assert.strictEqual(repeat.errors.length, 0, repeat.errors.join('\n'));
  assert.strictEqual(repeat.createdNodeIds.length, 0);
  assert.deepStrictEqual(
    [...env.state.nodes.values()]
      .filter(node => id(node))
      .map(node => [node.id, id(node)]),
    identities
  );
  assert.strictEqual(
    review.componentProperties[property].value,
    'Preserve my edited editorial title'
  );
  assert.deepStrictEqual(copy(editedLabel.textDecorationOffset), {
    unit: 'PIXELS',
    value: 7,
  });
  console.log(
    'ok  repeat preserves component/layer/review/property identities and edited review text/offset'
  );

  for (const offset of [
    { unit: 'AUTO' },
    { unit: 'PIXELS', value: -2 },
    { unit: 'PERCENT', value: 20 },
  ]) {
    tree.children[0].textDecorationOffset = offset;
    const changed = await env.call('buildMangroveComponents', doc, 'undrr', [
      'editorial-cta',
    ]);
    assert.strictEqual(changed.errors.length, 0, changed.errors.join('\n'));
    assert.deepStrictEqual(copy(label.textDecorationOffset), offset);
  }
  tree.children[0].textDecoration = 'NONE';
  const none = await env.call('buildMangroveComponents', doc, 'undrr', [
    'editorial-cta',
  ]);
  assert.strictEqual(none.errors.length, 0, none.errors.join('\n'));
  assert.strictEqual(
    label.textDecorationOffset,
    null,
    'Native NONE has null decoration offset'
  );
  console.log(
    'ok  AUTO/PIXELS/PERCENT offsets accepted and non-underlined native readback is null'
  );

  for (const change of [
    tree => {
      tree.children[1].absolute.horizontal = 'START';
    },
    tree => {
      tree.children[1].absolute.vertical = 'END';
    },
    tree => {
      tree.children[1].absolute.extra = 1;
    },
    tree => {
      tree.children[1].absolute.offsetX = 2;
    },
    tree => {
      tree.children[1].position = { x: 0, y: 0 };
    },
    tree => {
      tree.children[1].layout.width = 'FILL';
    },
    tree => {
      tree.layout.mode = 'NONE';
    },
  ])
    await reject(change, /Absolute recipes require/);
  await reject(tree => {
    tree.children[1].absolute.offsetX = 'color/text';
  }, /Missing FLOAT/);
  await reject(tree => {
    tree.children[1].absolute.offsetY = 'missing/offset';
  }, /Missing FLOAT/);
  for (const offset of [
    { unit: 'AUTO', value: 1 },
    { unit: 'PERCENT' },
    { unit: 'EM', value: 2 },
    { unit: 'PIXELS', value: 1, extra: true },
    [],
  ])
    await reject(tree => {
      tree.children[0].textDecorationOffset = offset;
    }, /textDecorationOffset requires/);
  await reject(tree => {
    tree.textDecorationOffset = { unit: 'AUTO' };
  }, /textDecorationOffset requires/);
  console.log(
    'ok  malformed alignment/shape/parent/sizing/token/decoration contracts reject before canvas/style/variable writes'
  );

  const invalid = fixture();
  const guarded = environment(invalid.doc);
  await importFoundation(guarded, invalid.doc);
  const offsetVariable = guarded.state.variables.find(
    v => v.name === invalid.tree.children[1].absolute.offsetX
  );
  offsetVariable.valuesByMode[Object.keys(offsetVariable.valuesByMode)[0]] =
    Infinity;
  const before = stateSnapshot(guarded);
  const blocked = await guarded.call(
    'buildMangroveComponents',
    invalid.doc,
    'undrr',
    ['editorial-cta']
  );
  assert(blocked.errors.some(error => /must be finite/.test(error)));
  assert.strictEqual(stateSnapshot(guarded), before);
  console.log('ok  nonfinite imported FLOAT offsets block before mutation');

  // Opt-in source context surrounds the instance, not its transparent master or
  // diagnostic caption. Moving an existing owned instance preserves its ID/text.
  const family = doc.components.families.find(f => f.id === 'editorial-cta');
  family.review = {
    variantSurfaces: { [family.variants[0].id]: 'color/hero' },
    specimens: [
      {
        id: 'dark-context',
        name: 'Explicit source context',
        variant: copy(family.variants[0].properties),
        width: 300,
        properties: { Label: 'Seed this context only once' },
        surface: 'color/neutral-900',
      },
    ],
  };
  const surfaced = await env.call('buildMangroveComponents', doc, 'undrr', [
    'editorial-cta',
  ]);
  assert.strictEqual(surfaced.errors.length, 0, surfaced.errors.join('\n'));
  const originalParent = review.parent.parent;
  assert(id(review.parent).endsWith('/surface'));
  assert.strictEqual(review.parent.paddingLeft, 8);
  assert.strictEqual(
    review.parent.width -
      review.parent.paddingLeft -
      review.parent.paddingRight,
    300
  );
  assert.strictEqual(
    review.parent.fills[0].boundVariables.color.id,
    env.state.variables.find(v => v.name === 'color/hero').id
  );
  assert.strictEqual(
    originalParent.children.find(n => n.type === 'TEXT').fills[0].boundVariables
      .color.id,
    env.state.variables.find(v => v.name === 'color/neutral-900').id
  );
  assert.deepStrictEqual(copy(main.fills), [], 'Master stays transparent');
  const explicit = [...env.state.nodes.values()].find(
    n => id(n) === 'review/editorial-cta/specimen/dark-context/surface'
  );
  assert.strictEqual(
    explicit.fills[0].boundVariables.color.id,
    env.state.variables.find(v => v.name === 'color/neutral-900').id
  );
  const surfacedIds = [...env.state.nodes.values()]
    .filter(n => id(n))
    .map(n => [n.id, id(n)]);
  const surfaceRepeat = await env.call(
    'buildMangroveComponents',
    doc,
    'undrr',
    ['editorial-cta']
  );
  assert.strictEqual(
    surfaceRepeat.errors.length,
    0,
    surfaceRepeat.errors.join('\n')
  );
  assert.strictEqual(surfaceRepeat.createdNodeIds.length, 0);
  assert.deepStrictEqual(
    [...env.state.nodes.values()].filter(n => id(n)).map(n => [n.id, id(n)]),
    surfacedIds
  );
  assert.strictEqual(
    review.componentProperties[property].value,
    'Preserve my edited editorial title'
  );
  delete family.review.variantSurfaces;
  const removedSurface = review.parent;
  const unsurfaced = await env.call('buildMangroveComponents', doc, 'undrr', [
    'editorial-cta',
  ]);
  assert.strictEqual(unsurfaced.errors.length, 0, unsurfaced.errors.join('\n'));
  assert.strictEqual(review.parent.id, originalParent.id);
  assert.strictEqual(removedSurface.visible, false);
  assert.strictEqual(
    removedSurface.removed,
    false,
    'Obsolete owned surface is retained'
  );
  assert.strictEqual(
    review.componentProperties[property].value,
    'Preserve my edited editorial title'
  );
  await reject((tree, doc) => {
    doc.components.families.find(f => f.id === 'editorial-cta').review = {
      variantSurfaces: { 'unknown-variant': 'color/hero' },
    };
  }, /Unknown review surface variant/);
  await reject((tree, doc) => {
    const family = doc.components.families.find(f => f.id === 'editorial-cta');
    family.review = {
      variantSurfaces: { [family.variants[0].id]: 'spacing/0' },
    };
  }, /Missing COLOR/);
  console.log(
    'ok  review-only bound source surfaces preserve transparent masters, readable captions, exact consumer widths and edited instance identities'
  );

  const silent = fixture();
  const noResize = environment(silent.doc);
  await importFoundation(noResize, silent.doc);
  const prototype = Object.getPrototypeOf(noResize.figma.currentPage);
  const resize = prototype.resize;
  prototype.resize = function (width, height) {
    if (this.name === 'mg-button-cta / badge') return;
    return resize.call(this, width, height);
  };
  const failed = await noResize.call(
    'buildMangroveComponents',
    silent.doc,
    'undrr',
    ['editorial-cta']
  );
  assert(
    failed.errors.some(error =>
      /absolute width did not retain requested sizing/.test(error)
    ),
    failed.errors.join('\n')
  );
  assert.strictEqual(failed.families.length, 0);
  console.log(
    'ok  silent native resize refusal is reported before a wrongly-sized absolute component is accepted'
  );

  await reject((tree, doc) => {
    doc.components.families.find(f => f.id === 'editorial-cta').review = {
      preserveVariantSizing: 'true',
    };
  }, /preserveVariantSizing must be a boolean/);
  const intrinsic = fixture();
  intrinsic.family.review = {
    genericLabels: false,
    preserveVariantSizing: true,
    width: 320,
  };
  const intrinsicBuilt = await build(intrinsic.doc);
  const intrinsicEntry = intrinsicBuilt.result.families[0].variantIds[0];
  const intrinsicMaster = intrinsicBuilt.env.state.nodes.get(
    intrinsicEntry.nodeId
  );
  const intrinsicInstance = [...intrinsicBuilt.env.state.nodes.values()].find(
    n => id(n) === `review/editorial-cta/specimen/${intrinsicEntry.id}/instance`
  );
  assert.strictEqual(intrinsicInstance.width, intrinsicMaster.width);
  assert.strictEqual(intrinsicInstance.layoutSizingHorizontal, 'FIXED');
  const intrinsicLabel = intrinsicInstance.children.find(
    n => n.type === 'TEXT'
  );
  intrinsicLabel.textAlignHorizontal = 'RIGHT';
  const intrinsicLabelKey = Object.keys(
    intrinsicInstance.componentProperties
  ).find(k => k.replace(/#[^#]+$/, '') === 'Label');
  intrinsicInstance.setProperties({
    [intrinsicLabelKey]: 'Keep source-sized variant label edit',
  });
  intrinsicInstance.resize(173, intrinsicInstance.height);
  const untouched = await intrinsicBuilt.env.call(
    'buildMangroveComponents',
    intrinsic.doc,
    'undrr',
    ['editorial-cta']
  );
  assert.strictEqual(untouched.errors.length, 0, untouched.errors.join('\n'));
  assert.strictEqual(
    intrinsicInstance.width,
    173,
    'Ordinary repeat preserves edited consumer width'
  );
  assert.strictEqual(intrinsicLabel.textAlignHorizontal, 'RIGHT');
  const sourceIds = [...intrinsicBuilt.env.state.nodes.values()]
    .filter(n => id(n))
    .map(n => [n.id, id(n)]);
  const restore = await intrinsicBuilt.env.call(
    'buildMangroveComponents',
    intrinsic.doc,
    'undrr',
    ['editorial-cta'],
    { refreshNarrowReview: true }
  );
  assert.strictEqual(restore.errors.length, 0, restore.errors.join('\n'));
  assert.strictEqual(intrinsicInstance.width, intrinsicMaster.width);
  assert.strictEqual(intrinsicInstance.layoutSizingVertical, 'HUG');
  assert.strictEqual(
    intrinsicInstance.componentProperties[intrinsicLabelKey].value,
    'Keep source-sized variant label edit'
  );
  assert.strictEqual(
    intrinsicLabel.textAlignHorizontal,
    'RIGHT',
    'Geometry-only refresh preserves direct text formatting'
  );
  assert.deepStrictEqual(
    [...intrinsicBuilt.env.state.nodes.values()]
      .filter(n => id(n))
      .map(n => [n.id, id(n)]),
    sourceIds
  );
  intrinsicInstance.resize(171, intrinsicInstance.height);
  const intrinsicProto = Object.getPrototypeOf(intrinsicInstance);
  const intrinsicResize = intrinsicProto.resize;
  intrinsicProto.resize = function (width, height) {
    if (this.id === intrinsicInstance.id) return;
    intrinsicResize.call(this, width, height);
  };
  const resizeRefused = await intrinsicBuilt.env.call(
    'buildMangroveComponents',
    intrinsic.doc,
    'undrr',
    ['editorial-cta'],
    { refreshNarrowReview: true }
  );
  assert(
    resizeRefused.errors.some(e =>
      e.includes('Native variant review sizing did not retain')
    )
  );
  assert.strictEqual(
    intrinsicInstance.width,
    171,
    'Silent native refusal remains observable'
  );
  assert.strictEqual(
    intrinsicInstance.componentProperties[intrinsicLabelKey].value,
    'Keep source-sized variant label edit'
  );
  console.log(
    'ok  intrinsic-review boolean validates before writes; normal repeat preserves edited width and explicit geometry refresh keeps IDs/content/direct formatting while reporting native refusal'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
