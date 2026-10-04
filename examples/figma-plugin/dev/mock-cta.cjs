#!/usr/bin/env node
/** Source and native identity checks for the bounded text CTA. No rendering claim. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildTextCtaRecipes,
} = require('../../../scripts/figma-cta-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const seed = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
);
const copy = value => JSON.parse(JSON.stringify(value));
const identity = node =>
  node.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const doc = copy(seed);
  const families = buildTextCtaRecipes({
    root,
    modes: doc.modes,
    variables: doc.variables,
    styles: doc.styles,
  });
  doc.components.families = [
    ...doc.components.families.filter(family => family.id !== 'text-cta'),
    ...families,
  ];
  return doc;
}
const find = (node, name) => node.findAll(child => child.name === name)[0];
function ownedIds(env) {
  return [...env.state.nodes.values()]
    .filter(node => identity(node))
    .map(node => [identity(node), node.id])
    .sort((a, b) => a[0].localeCompare(b[0]));
}
function property(node, name) {
  const key = Object.keys(node.componentProperties).find(
    key => key.replace(/#[^#]+$/, '') === name
  );
  assert(key, `Missing ${name} on ${node.name}`);
  return key;
}
function changedSource(file, replace, check) {
  const original = fs.readFileSync;
  fs.readFileSync = function (filename, ...args) {
    const result = original.call(this, filename, ...args);
    return typeof filename === 'string' && filename.endsWith(file)
      ? replace(result)
      : result;
  };
  try {
    check();
  } finally {
    fs.readFileSync = original;
  }
}
function blockNestedGeometry(env) {
  const ignored = [];
  const prototype = Object.getPrototypeOf(env.figma.currentPage);
  const nested = node => {
    for (let parent = node.parent; parent; parent = parent.parent)
      if (parent.type === 'INSTANCE') return true;
    return false;
  };
  const resize = prototype.resize;
  prototype.resize = function (...args) {
    if (nested(this)) {
      ignored.push([this.id, 'resize']);
      return;
    }
    return resize.apply(this, args);
  };
  const bind = prototype.setBoundVariable;
  prototype.setBoundVariable = function (field, ...args) {
    if (['width', 'height'].includes(field) && nested(this)) {
      ignored.push([this.id, field]);
      return;
    }
    return bind.call(this, field, ...args);
  };
  return ignored;
}
async function main() {
  const doc = document();
  const counts = [doc.variables.length, doc.styles.text.length];
  const sourceStyleIds = doc.styles.text.map(style => style.id);
  buildTextCtaRecipes({
    root,
    modes: doc.modes,
    variables: doc.variables,
    styles: doc.styles,
  });
  assert.deepStrictEqual(counts, [
    doc.variables.length,
    doc.styles.text.length,
  ]);
  assert.deepStrictEqual(
    doc.styles.text.map(style => style.id),
    sourceStyleIds,
    'Repeated export must update the existing heading roles in place'
  );
  const headingRoles = [
    'component.text-cta.heading.desktop',
    'component.text-cta.heading.mobile',
  ];
  for (const id of headingRoles) {
    const style = doc.styles.text.find(style => style.id === id);
    assert(style, `Missing existing heading role ${id}`);
    for (const mode of doc.modes)
      assert.strictEqual(style.values[mode.id].textWrapStyle, 'BALANCE');
  }
  assert.strictEqual(
    doc.components.families.find(family => family.id === 'text-cta').variants
      .length,
    6
  );
  const labelWidth = doc.variables.find(
    variable => variable.name === 'component/text-cta/review-label-width-320'
  );
  assert.strictEqual(labelWidth.values.undrr, 168);
  assert.strictEqual(labelWidth.values.delta, 158);
  assert.strictEqual(labelWidth.values.mcr, 136);
  changedSource(
    '/stories/Components/TextCta/text-cta.scss',
    source => source.replace('flex-wrap: wrap;', 'flex-wrap: nowrap;'),
    () => assert.throws(document, /no longer matches/)
  );
  changedSource(
    '/stories/assets/scss/_utility.scss',
    source =>
      source.replace(
        /(\.mg-u-font-size-600\s*\{\s*font-size: var\()--mg-font-size-500/,
        '$1--mg-font-size-400'
      ),
    () => assert.throws(document, /no longer matches/)
  );
  changedSource(
    '/tokens/mangrove.yaml',
    source => source.replace("$value: '1.25em'", "$value: '1.3em'"),
    () => {
      const changed = document().styles.text.find(
        style => style.id === 'component.text-cta.heading.desktop'
      );
      assert.strictEqual(changed.values.undrr.lineHeight.value, 130);
    }
  );
  console.log(
    'ok  CTA source guards, public heading line-height derivation and repeat exporter counts'
  );
  const env = environment(doc, {
    rejectedFonts: ['Roboto Condensed Regular', 'Roboto Condensed Bold'],
  });
  const ignoredGeometry = blockNestedGeometry(env);
  await importFoundation(env, doc);
  const first = await env.call('buildMangroveComponents', doc, 'undrr', [
    'text-cta',
  ]);
  assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
  const nativeHeadingIds = env.state.styles
    .filter(style =>
      headingRoles.includes(
        style.getSharedPluginData('orgundrrmangrove', 'mgStyleId')
      )
    )
    .map(style => style.id);
  assert.strictEqual(nativeHeadingIds.length, 2);
  const family = first.families.find(family => family.id === 'text-cta');
  assert.strictEqual(family.variantIds.length, 6);
  const variables = new Map(
    env.state.variables.map(variable => [variable.name, variable])
  );
  const paint = (node, field, name) =>
    assert.strictEqual(
      node[field][0].boundVariables.color.id,
      variables.get(name).id
    );
  for (const variant of family.variantIds) {
    const component = env.state.nodes.get(variant.nodeId);
    const strong = variant.id.includes('.strong.');
    const desktop = variant.id.endsWith('.desktop');
    const long = variant.id.endsWith('.long');
    const narrow = variant.id.includes('.narrow.');
    const headline = find(component, 'mg-cta__headline');
    assert.strictEqual(component.width, desktop ? 720 : narrow ? 240 : 320);
    assert.strictEqual(component.paddingTop, 50);
    assert.strictEqual(component.paddingLeft, 50);
    assert.strictEqual(headline.fontName.family, 'Roboto');
    assert.strictEqual(headline.fontName.style, 'Bold');
    assert.strictEqual(headline.fontSize, desktop ? 32 : 23);
    const headingStyle = env.state.styles.find(
      style => style.id === headline.textStyleId
    );
    assert.strictEqual(
      headingStyle.getSharedPluginData('orgundrrmangrove', 'mgStyleId'),
      `component.text-cta.heading.${desktop ? 'desktop' : 'mobile'}`
    );
    assert.strictEqual(headingStyle.textWrapStyle, 'BALANCE');
    assert.strictEqual(
      headingStyle.boundVariables.fontFamily.id,
      variables.get('font-family/text').id
    );
    assert.strictEqual(
      headingStyle.boundVariables.fontSize.id,
      variables.get(`font-size/${desktop ? '600' : '500'}`).id
    );
    assert.strictEqual(headline.lineHeight.value, 125);
    assert.strictEqual(headline.textWrapStyle, 'BALANCE');
    assert.strictEqual(headline.layoutSizingHorizontal, 'FILL');
    const actions = find(component, 'mg-cta__actions');
    assert.strictEqual(actions.layoutMode, 'HORIZONTAL');
    assert.strictEqual(actions.layoutWrap, 'WRAP');
    assert.strictEqual(actions.itemSpacing, 10);
    assert.strictEqual(actions.counterAxisSpacing, 10);
    assert.strictEqual(
      actions.boundVariables.counterAxisSpacing.id,
      variables.get('spacing/100').id
    );
    const action = find(component, 'mg-cta__action');
    assert.strictEqual(action.type, 'INSTANCE');
    const main = await action.getMainComponentAsync();
    assert.strictEqual(main.type, 'COMPONENT');
    assert(identity(main).startsWith('family/button/variant/button.'));
    assert.strictEqual(action.isExposedInstance, true);
    const label = find(action, 'mg-button__label');
    assert.strictEqual(label.layoutSizingHorizontal, long ? 'FILL' : 'HUG');
    if (long) {
      assert.strictEqual(label.textAutoResize, 'HEIGHT');
      assert.strictEqual(label.layoutSizingVertical, 'HUG');
      assert.strictEqual(action.width, narrow ? 120 : 200);
      assert.strictEqual(
        action.boundVariables.width.id,
        variables.get(
          `component/text-cta/review-action-width-${narrow ? 240 : 320}`
        ).id
      );
      assert.strictEqual(label.boundVariables.width, undefined);
    }
    if (strong) {
      paint(component, 'fills', 'color/hero');
      paint(action, 'fills', 'color/neutral-0');
      paint(action, 'strokes', 'component/text-cta/strong-action-border');
      paint(label, 'fills', 'color/hero');
      paint(
        find(component, 'mg-cta__text'),
        'fills',
        'component/text-cta/strong-body'
      );
    } else {
      paint(component, 'fills', 'component/text-cta/primary-soft-surface');
      paint(action, 'fills', 'color/button-background');
      paint(action, 'strokes', 'border-color/button-primary');
      paint(label, 'fills', 'color/button');
    }
  }
  console.log(
    'ok  six CTA variants retain native Button instances, finite-width action masters, fill Label policy, bound contextual paints and wrap row gaps'
  );
  const review = [...env.state.nodes.values()].find(
    node =>
      identity(node) === 'review/text-cta/specimen/long-action-320/instance'
  );
  const narrow = [...env.state.nodes.values()].find(
    node =>
      identity(node) === 'review/text-cta/specimen/long-action-240/instance'
  );
  for (const [instance, rootWidth, actionWidth] of [
    [review, 320, 200],
    [narrow, 240, 120],
  ]) {
    assert.strictEqual(instance.width, rootWidth);
    const action = find(instance, 'mg-cta__action');
    assert.strictEqual(action.width, actionWidth);
    const label = find(action, 'mg-button__label');
    assert.strictEqual(label.textAutoResize, 'HEIGHT');
    assert.strictEqual(label.layoutSizingHorizontal, 'FILL');
    assert.strictEqual(label.boundVariables.width, undefined);
    assert.strictEqual(
      action.componentProperties[property(action, 'Label')].value,
      'A longer Mangrove action label to check resizing and wrapping'
    );
  }
  const editedAction = find(review, 'mg-cta__action');
  review.setProperties({
    [property(review, 'Headline')]: 'Keep the designer headline',
  });
  editedAction.setProperties({
    [property(editedAction, 'Label')]: 'Keep the designer action',
  });
  review.resize(333, review.height);
  const ids = ownedIds(env);
  const definitions = copy(
    env.state.nodes.get(family.setId).componentPropertyDefinitions
  );
  const second = await env.call('buildMangroveComponents', doc, 'undrr', [
    'text-cta',
  ]);
  assert.strictEqual(second.errors.length, 0, second.errors.join('\n'));
  assert.strictEqual(second.createdNodeIds.length, 0);
  assert.deepStrictEqual(
    env.state.styles
      .filter(style =>
        headingRoles.includes(
          style.getSharedPluginData('orgundrrmangrove', 'mgStyleId')
        )
      )
      .map(style => style.id),
    nativeHeadingIds,
    'Ordinary repeat must retain both native heading style IDs'
  );
  assert.deepStrictEqual(ownedIds(env), ids);
  assert.deepStrictEqual(
    env.state.nodes.get(family.setId).componentPropertyDefinitions,
    definitions
  );
  assert.strictEqual(
    review.componentProperties[property(review, 'Headline')].value,
    'Keep the designer headline'
  );
  assert.strictEqual(
    editedAction.componentProperties[property(editedAction, 'Label')].value,
    'Keep the designer action'
  );
  assert.strictEqual(review.width, 333);
  assert.strictEqual(editedAction.width, 200);
  assert.deepStrictEqual(
    ignoredGeometry,
    [],
    'CTA must not attempt geometry writes below consumer instances'
  );
  console.log(
    'ok  long review inherits bounded master geometry without ignored nested writes, preserving designer headline/action and root width edits'
  );
  const branded = environment(doc);
  const imported = await branded.call(
    'importVariables',
    doc,
    ['mcr'],
    false,
    [],
    false
  );
  assert.strictEqual(imported.errors.length, 0, imported.errors.join('\n'));
  const mcr = await branded.call('buildMangroveComponents', doc, 'mcr', [
    'text-cta',
  ]);
  assert.strictEqual(mcr.errors.length, 0, mcr.errors.join('\n'));
  const mcrReview = [...branded.state.nodes.values()].find(
    node =>
      identity(node) === 'review/text-cta/specimen/long-action-320/instance'
  );
  const mcrAction = find(mcrReview, 'mg-cta__action');
  assert.strictEqual(mcrAction.width, 200);
  assert.strictEqual(mcrAction.paddingLeft, 30);
  assert.strictEqual((await mcrAction.getMainComponentAsync()).strokeWeight, 2);
  assert.strictEqual(
    find(mcrAction, 'mg-button__label').layoutSizingHorizontal,
    'FILL'
  );
  assert.strictEqual(
    find(mcrAction, 'mg-button__label').boundVariables.width,
    undefined
  );
  console.log(
    'ok  finite-width Label helper resolves MCR2030 source padding and thicker border, avoiding stale UNDRR geometry'
  );
  const legacy = copy(doc);
  const oldRecipe = legacy.components.families.find(
    family => family.id === 'text-cta'
  );
  oldRecipe.variants = oldRecipe.variants.filter(
    variant => variant.properties.Content === 'Short'
  );
  for (const variant of oldRecipe.variants) {
    delete variant.properties.Content;
    variant.name = `Tone=${variant.properties.Tone}, Viewport=${variant.properties.Viewport}`;
  }
  oldRecipe.review.specimens = [];
  const migration = environment(legacy);
  await importFoundation(migration, legacy);
  const previous = await migration.call(
    'buildMangroveComponents',
    legacy,
    'undrr',
    ['text-cta']
  );
  assert.strictEqual(previous.errors.length, 0, previous.errors.join('\n'));
  const oldFamily = previous.families.find(family => family.id === 'text-cta');
  const oldProperties = copy(
    migration.state.nodes.get(oldFamily.setId).componentPropertyDefinitions
  );
  const oldVariants = new Map(
    oldFamily.variantIds.map(variant => [variant.id, variant.nodeId])
  );
  const upgraded = await migration.call(
    'buildMangroveComponents',
    doc,
    'undrr',
    ['text-cta']
  );
  assert.strictEqual(upgraded.errors.length, 0, upgraded.errors.join('\n'));
  const upgradedFamily = upgraded.families.find(
    family => family.id === 'text-cta'
  );
  assert.strictEqual(upgradedFamily.setId, oldFamily.setId);
  assert.strictEqual(upgradedFamily.variantIds.length, 6);
  for (const [id, nodeId] of oldVariants)
    assert.strictEqual(
      upgradedFamily.variantIds.find(variant => variant.id === id).nodeId,
      nodeId
    );
  const upgradedProperties = migration.state.nodes.get(
    oldFamily.setId
  ).componentPropertyDefinitions;
  for (const [key, definition] of Object.entries(oldProperties))
    if (definition.type === 'TEXT')
      assert.deepStrictEqual(upgradedProperties[key], definition);
  console.log(
    'ok  upgrading four existing CTA masters adds bounded long presets without replacing their set, variant IDs or text property IDs'
  );
  const missing = environment(doc);
  await importFoundation(missing, doc);
  missing.state.rejectedFonts.add('Roboto Bold');
  const before = missing.state.nodes.size;
  const blocked = await missing.call('buildMangroveComponents', doc, 'undrr', [
    'text-cta',
  ]);
  assert(blocked.errors.some(error => error.includes('Roboto Bold')));
  assert.strictEqual(blocked.families.length, 0);
  assert.strictEqual(missing.state.nodes.size, before);
  console.log(
    'ok  unavailable exact Roboto Bold blocks CTA before node mutation, unavailable Condensed does not block its Latin recipes'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
module.exports = { main };
