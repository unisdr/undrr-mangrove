#!/usr/bin/env node
/** Source and native API contracts. This mock does not render glyphs or wrapping. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const { buildChipRecipes } = require('../../../scripts/figma-chip-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = value => JSON.parse(JSON.stringify(value));
const identity = node =>
  node.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  const families = buildChipRecipes({
    root,
    modes: doc.modes,
    variables: doc.variables,
    styles: doc.styles,
  });
  doc.components.families = [
    ...doc.components.families.filter(f => f.id !== 'chips'),
    ...families,
  ];
  return doc;
}
function changed(file, before, after, check) {
  const read = fs.readFileSync;
  let matched = false;
  fs.readFileSync = function (filename, ...args) {
    const value = read.call(this, filename, ...args);
    if (typeof filename !== 'string' || !filename.endsWith(file)) return value;
    const next = value.replace(before, after);
    matched = next !== value;
    return next;
  };
  try {
    check();
    assert(matched, `Mutation did not match ${file}`);
  } finally {
    fs.readFileSync = read;
  }
}
function owned(env) {
  return [...env.state.nodes.values()]
    .filter(identity)
    .map(n => [identity(n), n.id])
    .sort((a, b) => a[0].localeCompare(b[0]));
}
function property(node, name) {
  const key = Object.keys(node.componentProperties).find(
    k => k.replace(/#[^#]+$/, '') === name
  );
  assert(key, `Missing ${name}`);
  return key;
}
async function build(doc, brand = 'undrr') {
  const env = environment(doc);
  await importFoundation(env, doc, brand);
  const result = await env.call('buildMangroveComponents', doc, brand, [
    'chips',
  ]);
  assert.strictEqual(result.errors.length, 0, result.errors.join('\n'));
  return { env, result };
}
async function main() {
  const doc = document(),
    family = doc.components.families.find(f => f.id === 'chips');
  assert.strictEqual(family.variants.length, 16);
  assert.strictEqual(family.review.preserveVariantSizing, true);
  const counts = [
    doc.variables.length,
    doc.styles.text.length,
    doc.styles.effect.length,
  ];
  assert.deepStrictEqual(
    buildChipRecipes({
      root,
      modes: doc.modes,
      variables: doc.variables,
      styles: doc.styles,
    }),
    [family]
  );
  assert.deepStrictEqual(counts, [
    doc.variables.length,
    doc.styles.text.length,
    doc.styles.effect.length,
  ]);
  assert.strictEqual(
    doc.variables.filter(v => v.name.startsWith('component/chips/')).length,
    9
  );
  assert.strictEqual(
    doc.styles.text.filter(v => v.id.startsWith('component.chips.')).length,
    2
  );
  const file = '/stories/Components/Buttons/Chips/chips.scss';
  for (const [before, after] of [
    ['font-weight: 500;', 'font-weight: 400;'],
    ['line-height: 1.25;', 'line-height: 1.2;'],
    ['min-height: mg-rem(40);', 'min-height: mg-rem(44);'],
    ['border-radius: 999px;', 'border-radius: 4px;'],
    ['box-shadow: var(--mg-shadow-raised);', 'box-shadow: none;'],
    [
      'background: rgb(var(--mg-color-neutral-50));',
      'background: rgb(var(--mg-color-neutral-100));',
    ],
    [
      'background-color: rgb(var(--mg-color-neutral-300));',
      'background-color: rgb(var(--mg-color-neutral-400));',
    ],
    [
      'padding: var(--mg-spacing-50) var(--mg-spacing-150);',
      'padding: var(--mg-spacing-50) var(--mg-spacing-200);',
    ],
    ['scale: 0.96;', 'scale: 0.9;'],
    ['@include mg-focus-ring;', '@include mg-focus-ring-inset;'],
    ['content: "×";', 'content: "x";'],
    ['flex: 0 0 mg-rem(20);', 'flex: 0 1 mg-rem(20);'],
    ['font-size: mg-rem(18);', 'font-size: mg-rem(20);'],
    ['font-weight: 400;', 'font-weight: 500;'],
    [
      'margin-inline-end: calc(-1 * var(--mg-spacing-50));',
      'margin-inline-end: 0;',
    ],
    [
      'text-decoration: none;',
      'text-decoration: none; overflow-wrap: anywhere;',
    ],
    ['&:hover {', '&:disabled { background: white; } &:hover {'],
  ])
    changed(file, before, after, () =>
      assert.throws(document, /Chips recipe needs updating/)
    );
  for (const [target, before, after] of [
    [
      '/stories/Components/Buttons/Chips/Chips.jsx',
      "Type === 'With X' && 'mg-chip__cross'",
      "Type === 'Default' && 'mg-chip__cross'",
    ],
    [
      '/stories/Components/Buttons/Chips/Chips.jsx',
      'type="button"',
      'type="submit"',
    ],
    [
      '/stories/Components/Buttons/Chips/Chips.stories.jsx',
      'Réduction des risques de catastrophe',
      'Shorter source text',
    ],
    [
      '/stories/assets/fonts/roboto/sass/_Medium.scss',
      'font-weight: 500;',
      'font-weight: 600;',
    ],
    ['/stories/assets/fonts/roboto/roboto.scss', '@import "sass/Medium";', ''],
    [
      '/stories/assets/scss/_mixins.scss',
      'outline-offset: var(--mg-focus-ring-offset);',
      'outline-offset: 0;',
    ],
  ])
    changed(target, before, after, () =>
      assert.throws(document, /Chips recipe needs updating/)
    );
  console.log(
    'ok  idempotent 16-variant source exporter and drift guards for real anatomy, Medium500, glyph400, state paints, intrinsic wrap, focus replacement and margin geometry'
  );
  const byName = new Map(doc.variables.map(v => [v.name, v]));
  function value(name, mode) {
    const v = byName.get(name).values[mode];
    return v.alias ? value(v.alias, mode) : v;
  }
  for (const mode of doc.modes) {
    assert.strictEqual(
      value('component/chips/dismiss-padding-end', mode.id),
      value('spacing/150', mode.id) - value('spacing/50', mode.id)
    );
    assert.strictEqual(
      value('component/chips/focus-outer-radius', mode.id),
      999 + value('focus-ring/offset', mode.id)
    );
    for (const role of ['label', 'dismiss-glyph']) {
      const style = doc.styles.text.find(
          s => s.id === `component.chips.${role}`
        ),
        v = style.values[mode.id];
      assert.strictEqual(v.fontName.family, 'Roboto');
      assert.strictEqual(
        v.fontName.style,
        role === 'label' ? 'Medium' : 'Regular'
      );
      assert.strictEqual(v.fontSize, role === 'label' ? 14 : 18);
      assert.deepStrictEqual(v.lineHeight, {
        unit: 'PERCENT',
        value: role === 'label' ? 125 : 100,
      });
      assert.strictEqual(v.textDecoration, 'NONE');
      assert.strictEqual(
        style.typography.fontWeightRequested,
        role === 'label' ? 500 : 400
      );
    }
  }
  for (const spec of family.variants) {
    const { Type, State, Content } = spec.properties,
      dismiss = Type === 'With X';
    assert.strictEqual(
      spec.tree.fill,
      State === 'Hover' ? 'color/neutral-300' : 'color/neutral-50'
    );
    assert.strictEqual(
      spec.tree.effectStyle,
      State === 'Focus' ? null : 'shadow.raised'
    );
    assert.strictEqual(Boolean(spec.tree.focusRing), State === 'Focus');
    assert.strictEqual(spec.tree.children.length, dismiss ? 2 : 1);
    assert.strictEqual(
      spec.tree.children[0].textStyle,
      'component.chips.label'
    );
    assert.strictEqual(spec.tree.children[0].textDecoration, 'NONE');
    assert.strictEqual(
      spec.tree.children[0].layout.width,
      Content === 'Short' ? 'HUG' : 'FILL'
    );
    if (dismiss)
      assert.strictEqual(spec.tree.children[1].children[0].characters, '×');
    if (State === 'Disabled') assert(dismiss);
    if (Content === 'Narrow') assert.strictEqual(State, 'Default');
  }
  assert.strictEqual(family.review.specimens.length, 4);
  assert(
    family.review.specimens
      .filter(s => s.variant.Content === 'Narrow')
      .every(s => s.width === 80)
  );
  console.log(
    'ok  all-mode roles, exact Medium/Regular shared typography, bounded tree matrix and truthful80px overflowing review consumers'
  );
  const { env, result } = await build(doc);
  for (const entry of result.families[0].variantIds) {
    const component = env.state.nodes.get(entry.nodeId),
      spec = family.variants.find(v => v.id === entry.id),
      dismiss = spec.properties.Type === 'With X',
      label = component.children.find(n => n.name === 'mg-chip / label');
    assert.strictEqual(component.minHeight, 40);
    assert.strictEqual(component.cornerRadius, 999);
    assert.strictEqual(component.paddingTop, 5);
    assert.strictEqual(component.paddingBottom, 5);
    assert.strictEqual(component.paddingLeft, 15);
    assert.strictEqual(component.paddingRight, dismiss ? 10 : 15);
    assert.strictEqual(component.itemSpacing, dismiss ? 5 : 0);
    assert.strictEqual(component.opacity, 1);
    assert.strictEqual(
      component.fills[0].boundVariables.color.id,
      env.state.variables.find(v => v.name === spec.tree.fill).id
    );
    assert.strictEqual(label.fontName.style, 'Medium');
    assert.strictEqual(label.fontSize, 14);
    assert.deepStrictEqual(label.lineHeight, { unit: 'PERCENT', value: 125 });
    assert.strictEqual(label.textDecoration, 'NONE');
    if (dismiss) {
      const mark = component.children.find(
        n => n.name === 'mg-chip / dismiss mark'
      );
      assert.strictEqual(mark.width, 20);
      assert.strictEqual(mark.height, 20);
      assert.strictEqual(mark.children[0].characters, '×');
      assert.strictEqual(mark.children[0].fontName.style, 'Regular');
      assert.strictEqual(mark.children[0].fontSize, 18);
    }
    if (spec.properties.State === 'Focus') {
      assert.strictEqual(component.effectStyleId, '');
      assert.strictEqual(component.effects.length, 0);
    } else assert(component.effectStyleId);
  }
  for (const entry of result.families[0].variantIds) {
    const master = env.state.nodes.get(entry.nodeId);
    const instance = [...env.state.nodes.values()].find(
      n => identity(n) === `review/chips/specimen/${entry.id}/instance`
    );
    assert(instance);
    assert.strictEqual(
      instance.layoutSizingHorizontal,
      master.layoutSizingHorizontal,
      'Generic variant instances retain HUG/FIXED source sizing instead of filling a caption row'
    );
    assert.strictEqual(instance.layoutSizingVertical, 'HUG');
    if (master.layoutSizingHorizontal === 'FIXED')
      assert.strictEqual(instance.width, master.width);
  }
  for (const specimen of family.review.specimens) {
    const instance = [...env.state.nodes.values()].find(
      n => identity(n) === `review/chips/specimen/${specimen.id}/instance`
    );
    assert(instance);
    assert.strictEqual(instance.width, value(specimen.instanceWidth, 'undrr'));
    assert.strictEqual(
      instance.componentProperties[property(instance, 'Label')].value,
      specimen.properties.Label
    );
  }
  console.log(
    'ok  scoped native mock builds16states, proper focus-versus-raised effects, margin transform, explicit source glyph and seeded finite/narrow geometry'
  );
  const review = [...env.state.nodes.values()].find(
    n => identity(n) === 'review/chips/specimen/dismiss-long/instance'
  );
  review.setProperties({
    [property(review, 'Label')]: 'Keep my edited filter label',
  });
  const ids = owned(env);
  const repeated = await env.call('buildMangroveComponents', doc, 'undrr', [
    'chips',
  ]);
  assert.strictEqual(repeated.errors.length, 0, repeated.errors.join('\n'));
  assert.strictEqual(repeated.createdNodeIds.length, 0);
  assert.deepStrictEqual(owned(env), ids);
  assert.strictEqual(
    review.componentProperties[property(review, 'Label')].value,
    'Keep my edited filter label'
  );
  console.log(
    'ok  repeated build creates zero identities and preserves edited instance Label'
  );
  const genericReviews = result.families[0].variantIds.map(entry => ({
    entry,
    master: env.state.nodes.get(entry.nodeId),
    instance: [...env.state.nodes.values()].find(
      n => identity(n) === `review/chips/specimen/${entry.id}/instance`
    ),
  }));
  for (const { instance } of genericReviews) {
    instance.setBoundVariable('width', null);
    instance.resize(177, instance.height);
    instance.layoutSizingHorizontal = 'FILL';
    instance.setProperties({
      [property(instance, 'Label')]: 'Keep this edited variant chip',
    });
  }
  const preserve = await env.call('buildMangroveComponents', doc, 'undrr', [
    'chips',
  ]);
  assert.strictEqual(preserve.errors.length, 0, preserve.errors.join('\n'));
  for (const { instance } of genericReviews) {
    assert.strictEqual(instance.width, 177);
    assert.strictEqual(
      instance.layoutSizingHorizontal,
      'FILL',
      'Ordinary repeat preserves designer consumer geometry'
    );
  }
  const beforeRefreshIds = owned(env);
  const explicitWidth = review.width;
  const refreshed = await env.call(
    'buildMangroveComponents',
    doc,
    'undrr',
    ['chips'],
    { refreshNarrowReview: true }
  );
  assert.strictEqual(refreshed.errors.length, 0, refreshed.errors.join('\n'));
  assert.strictEqual(refreshed.createdNodeIds.length, 0);
  assert.deepStrictEqual(owned(env), beforeRefreshIds);
  for (const { instance, master } of genericReviews) {
    assert.strictEqual(
      instance.layoutSizingHorizontal,
      master.layoutSizingHorizontal
    );
    assert.strictEqual(instance.layoutSizingVertical, 'HUG');
    if (master.layoutSizingHorizontal === 'FIXED')
      assert.strictEqual(instance.width, master.width);
    assert.strictEqual(
      instance.componentProperties[property(instance, 'Label')].value,
      'Keep this edited variant chip'
    );
  }
  assert.strictEqual(
    review.width,
    explicitWidth,
    'Explicit specimen geometry retains its own declared width'
  );
  assert.strictEqual(
    review.componentProperties[property(review, 'Label')].value,
    'Keep my edited filter label'
  );
  assert.strictEqual(
    refreshed.audit.filter(
      a => a.status === 'variant-review-geometry-refreshed'
    ).length,
    16
  );
  console.log(
    'ok  opt-in generic variant sizing keeps HUG/fixed masters; normal repeat preserves consumer widths and explicit refresh preserves exact IDs/Label edits and explicit specimen widths'
  );
  const missing = environment(doc, { rejectedFonts: ['Roboto Medium'] });
  await importFoundation(missing, doc);
  const before = missing.state.nodes.size,
    styleCount = missing.state.styles.length;
  const blocked = await missing.call('buildMangroveComponents', doc, 'undrr', [
    'chips',
  ]);
  assert(blocked.errors.length);
  assert.strictEqual(missing.state.nodes.size, before);
  assert.strictEqual(missing.state.styles.length, styleCount);
  const drift = copy(doc);
  drift.variables.find(v => v.name === 'font-size/250').values.undrr = 15;
  assert.throws(
    () =>
      buildChipRecipes({
        root,
        modes: drift.modes,
        variables: drift.variables,
        styles: drift.styles,
      }),
    /Measured narrow Chips typography/
  );
  console.log(
    'ok  missing exact Medium blocks before partial native nodes/styles; typography drift rejects stale measured narrow geometry'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { document };
