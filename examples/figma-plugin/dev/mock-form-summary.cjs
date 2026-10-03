#!/usr/bin/env node
/** Source, native contract and identity checks. This harness does not render text or markers. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildFormSummaryRecipes,
} = require('../../../scripts/figma-form-summary-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = value => JSON.parse(JSON.stringify(value));
const identity = (node, key = 'mgKitId') =>
  node.getSharedPluginData('orgundrrmangrove', key);
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  const families = buildFormSummaryRecipes({
    root,
    modes: doc.modes,
    variables: doc.variables,
    styles: doc.styles,
  });
  const ids = new Set(families.map(family => family.id));
  doc.components.families = [
    ...doc.components.families.filter(family => !ids.has(family.id)),
    ...families,
  ];
  return doc;
}
const recipe = doc =>
  doc.components.families.find(family => family.id === 'form-error-summary');
function changedSource(file, change, check) {
  const read = fs.readFileSync;
  let changed = false;
  fs.readFileSync = function (filename, ...args) {
    const value = read.call(this, filename, ...args);
    if (typeof filename !== 'string' || !filename.endsWith(file)) return value;
    const result = change(value);
    changed = result !== value;
    return result;
  };
  try {
    check();
    assert(changed, `Source mutation did not match ${file}`);
  } finally {
    fs.readFileSync = read;
  }
}
function walk(node, visit) {
  visit(node);
  for (const child of node.children || []) walk(child, visit);
}
function property(node, name) {
  const key = Object.keys(node.componentProperties).find(
    key => key.replace(/#[^#]+$/, '') === name
  );
  assert(key, `Missing ${name}`);
  return key;
}
function owned(env) {
  return [...env.state.nodes.values()]
    .filter(node => identity(node))
    .map(node => [identity(node), node.id])
    .sort((a, b) => a[0].localeCompare(b[0]));
}
async function build(doc, brand = 'undrr') {
  const env = environment(doc);
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
    'form-error-summary',
  ]);
  assert.strictEqual(result.errors.length, 0, result.errors.join('\n'));
  return { env, result };
}
async function main() {
  const doc = document(),
    family = recipe(doc);
  assert.strictEqual(family.variants.length, 6);
  const counts = [
    doc.variables.length,
    doc.styles.text.length,
    doc.styles.effect.length,
  ];
  assert.deepStrictEqual(
    buildFormSummaryRecipes({
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
  for (const [role, textDecoration, textWrapStyle] of [
    ['link', 'UNDERLINE', 'AUTO'],
    ['title', 'NONE', 'BALANCE'],
  ]) {
    const style = doc.styles.text.find(
      spec => spec.id === `component.form-error-summary.${role}`
    );
    assert(style, `Exported Summary ${role} style is missing`);
    for (const mode of doc.modes) {
      assert.strictEqual(style.values[mode.id].textDecoration, textDecoration);
      assert.strictEqual(style.values[mode.id].textWrapStyle, textWrapStyle);
    }
  }
  const form = '/stories/Components/Forms/_form-base.scss';
  for (const [before, after] of [
    [
      'border-inline-start: 4px solid rgb(var(--mg-color-red-900));',
      'border-inline-start: 6px solid rgb(var(--mg-color-red-900));',
    ],
    [
      '  padding: var(--mg-spacing-150);\n\n  // blue-800',
      '  padding: var(--mg-spacing-200);\n\n  // blue-800',
    ],
    [
      '  &__title {\n    color: rgb(var(--mg-color-red-900));\n    font-size: var(--mg-font-size-300);\n    font-weight: 700;',
      '  &__title {\n    color: rgb(var(--mg-color-red-900));\n    font-size: var(--mg-font-size-300);\n    font-weight: 600;',
    ],
    [
      '      font-weight: 600;\n      text-decoration: underline;',
      '      font-weight: 700;\n      text-decoration: underline;',
    ],
    ['      text-decoration: underline;', '      text-decoration: none;'],
    [
      '      margin-bottom: var(--mg-spacing-50);\n\n      &:last-child',
      '      margin-bottom: var(--mg-spacing-100);\n\n      &:last-child',
    ],
  ])
    changedSource(
      form,
      text => text.replace(before, after),
      () => assert.throws(document, /needs updating/)
    );
  changedSource(
    form,
    text =>
      text.replace(
        '  &__list {\n    margin: 0;',
        '  &__list {\n    list-style-type: none;\n    margin: 0;'
      ),
    () => assert.throws(document, /marker\/body typography/)
  );
  changedSource(
    '/stories/assets/scss/_mixins.scss',
    text =>
      text.replace(
        'outline-offset: var(--mg-focus-ring-offset);',
        'outline-offset: var(--mg-focus-ring-width);'
      ),
    () => assert.throws(document, /focus separator\/outline changed/)
  );
  changedSource(
    '/stories/assets/scss/_foundational.scss',
    text =>
      text.replace(
        'h2 {\n  font-size: var(--mg-font-size-500);\n  font-weight: 700;\n  line-height: 1.1;',
        'h2 {\n  font-size: var(--mg-font-size-500);\n  font-weight: 700;\n  line-height: 1.3;'
      ),
    () => assert.throws(document, /h2 line height changed/)
  );
  for (const [before, after] of [
    ['if (!errors || errors.length === 0)', 'if (!errors)'],
    [
      '<h2 className="mg-form-error-summary__title">',
      '<p className="mg-form-error-summary__title">',
    ],
    ['<a href={`#${error.id}`}>', '<a href="/errors">'],
    ['containerRef.current.focus();', 'containerRef.current.scrollIntoView();'],
  ])
    changedSource(
      '/stories/Components/Forms/FormErrorSummary/FormErrorSummary.jsx',
      text => text.replace(before, after),
      () => assert.throws(document, /needs updating/)
    );
  console.log(
    'ok  source accent, spacing, h2 inheritance, link weight/underline, empty/error-link JSX and initial-focus guards'
  );
  const { env, result } = await build(doc);
  const built = result.families.find(
    family => family.id === 'form-error-summary'
  );
  assert.strictEqual(built.variantIds.length, 6);
  const variables = new Map(
    env.state.variables.map(variable => [variable.name, variable])
  );
  const nativeStyles = new Map(
    env.state.styles
      .filter(style => style.type === 'TEXT')
      .map(style => [identity(style, 'mgStyleId'), style])
  );
  for (const role of ['link', 'title']) {
    const spec = doc.styles.text.find(
      style => style.id === `component.form-error-summary.${role}`
    );
    const imported = nativeStyles.get(spec.id);
    assert(imported, `Summary ${role} style did not import`);
    assert.strictEqual(
      imported.textDecoration,
      spec.values.undrr.textDecoration
    );
    assert.strictEqual(imported.textWrapStyle, spec.values.undrr.textWrapStyle);
    for (const [field, name] of Object.entries(spec.bindings))
      assert.strictEqual(
        imported.boundVariables[field].id,
        variables.get(name).id
      );
  }
  function paint(node, field, name) {
    assert.strictEqual(
      node[field][0].boundVariables.color.id,
      variables.get(name).id,
      `${node.name} ${field} must bind ${name}`
    );
  }
  const specs = new Map(family.variants.map(variant => [variant.id, variant]));
  for (const variant of built.variantIds) {
    const spec = specs.get(variant.id),
      component = env.state.nodes.get(variant.nodeId);
    assert.strictEqual(component.layoutMode, 'HORIZONTAL');
    assert.strictEqual(
      component.width,
      spec.properties.Content === 'LongNarrow' ? 240 : 320
    );
    paint(component, 'fills', 'color/red-50');
    const accent = component.children.find(
      node => node.name === 'mg-form-error-summary__accent'
    );
    assert.strictEqual(accent.width, 4);
    assert.strictEqual(accent.layoutSizingVertical, 'FILL');
    paint(accent, 'fills', 'color/red-900');
    const content = component.children.find(
      node => node.name === 'mg-form-error-summary__content'
    );
    assert.strictEqual(content.paddingTop, 15);
    assert.strictEqual(content.paddingBottom, 15);
    assert.strictEqual(content.itemSpacing, 7.5);
    const title = component.findAll(
      node =>
        node.type === 'TEXT' && node.name === 'mg-form-error-summary__title'
    )[0];
    assert.strictEqual(title.fontName.family, 'Roboto');
    assert.strictEqual(title.fontName.style, 'Bold');
    assert.strictEqual(title.fontSize, 16);
    assert.deepStrictEqual(title.lineHeight, { unit: 'PERCENT', value: 110 });
    assert.strictEqual(title.textWrapStyle, 'BALANCE');
    assert.strictEqual(title.textDecoration, 'NONE');
    assert.strictEqual(
      title.textStyleId,
      nativeStyles.get('component.form-error-summary.title').id
    );
    paint(title, 'fills', 'color/red-900');
    const list = component.findAll(
      node => node.name === 'mg-form-error-summary__list'
    )[0];
    assert.strictEqual(list.itemSpacing, 5);
    assert.strictEqual(list.paddingLeft, 7);
    assert.strictEqual(list.paddingRight, 15);
    assert.strictEqual(
      list.children.length,
      spec.properties.Errors === 'One' ? 1 : 3
    );
    for (const row of list.children) {
      assert.strictEqual(row.layoutMode, 'HORIZONTAL');
      assert.strictEqual(row.counterAxisAlignItems, 'MIN');
      assert.strictEqual(row.itemSpacing, 11);
      const [marker, link] = row.children;
      assert.strictEqual(marker.width, 7);
      assert.strictEqual(marker.characters, '•');
      assert.strictEqual(marker.fontName.style, 'Regular');
      assert.strictEqual(marker.fontSize, 16);
      assert.deepStrictEqual(marker.lineHeight, { unit: 'PIXELS', value: 24 });
      assert.strictEqual(marker.textDecoration, 'NONE');
      paint(marker, 'fills', 'color/text');
      assert.strictEqual(link.fontName.style, 'Bold');
      assert.strictEqual(link.fontSize, 16);
      assert.deepStrictEqual(link.lineHeight, { unit: 'PIXELS', value: 24 });
      assert.strictEqual(link.textDecoration, 'UNDERLINE');
      assert.strictEqual(link.textWrapStyle, 'AUTO');
      assert.strictEqual(
        link.textStyleId,
        nativeStyles.get('component.form-error-summary.link').id
      );
      assert.strictEqual(link.layoutSizingHorizontal, 'FILL');
      assert.strictEqual(link.textAutoResize, 'HEIGHT');
      paint(link, 'fills', 'color/red-900');
      assert(
        !row.findAll(node => node.name.startsWith('mg-focus-ring /')).length,
        'Wrapped individual link focus is explicitly not fabricated'
      );
    }
    const rings = component.children.filter(
      node => node.name.startsWith('mg-focus-ring /') && node.visible
    );
    assert.strictEqual(rings.length, spec.properties.State === 'Focus' ? 2 : 0);
    if (rings.length) {
      assert.strictEqual(component.clipsContent, false);
      const separator = rings.find(node =>
        node.name.endsWith('neutral separator')
      );
      const coloured = rings.find(node =>
        node.name.endsWith('coloured outline')
      );
      paint(separator, 'strokes', 'color/neutral-0');
      paint(coloured, 'strokes', 'color/focus-ring');
      assert.strictEqual(separator.strokeWeight, 2);
      assert.strictEqual(coloured.strokeWeight, 2);
      assert.strictEqual(separator.cornerRadius, 0);
      assert.strictEqual(coloured.cornerRadius, 2);
    }
  }
  const linkStyle = doc.styles.text.find(
    style => style.id === 'component.form-error-summary.link'
  );
  assert.strictEqual(linkStyle.typography.requestedWeight, 600);
  assert.strictEqual(linkStyle.typography.bundledWeight, 700);
  console.log(
    'ok  six source panels, one-sided accent, independent marker/link colour and weight, underline, exact title/body line heights and root-only focus'
  );
  // This exercises the documented style inheritance operation, not the native
  // component-property reset: the base mock does not propagate property values
  // into descendant characters or reset styles when references are assigned.
  const inherited = env.figma.createText();
  const inheritedId = inherited.id;
  inherited.characters = 'Edited visible error text';
  inherited.textDecoration = 'NONE';
  inherited.textWrapStyle = 'PRETTY';
  const sharedLinkStyle = nativeStyles.get(linkStyle.id);
  await inherited.setTextStyleIdAsync(sharedLinkStyle.id);
  assert.strictEqual(inherited.id, inheritedId);
  assert.strictEqual(inherited.characters, 'Edited visible error text');
  assert.strictEqual(inherited.textDecoration, 'UNDERLINE');
  assert.strictEqual(inherited.textWrapStyle, 'AUTO');
  inherited.remove();
  console.log(
    'ok  all-brand exported decoration/wrapping, imported style bindings and explicit shared style inheritance on edited text'
  );
  const review = [...env.state.nodes.values()].find(
    node =>
      node.type === 'INSTANCE' &&
      identity(node).startsWith(
        'review/form-error-summary/specimen/long-narrow-default'
      )
  );
  assert(review);
  assert.strictEqual(review.width, 240);
  assert.strictEqual(
    review.componentProperties[property(review, 'Title')].value,
    family.review.specimens[0].properties.Title
  );
  for (const name of ['Name error', 'Email error', 'Interests error'])
    assert.strictEqual(
      review.componentProperties[property(review, name)].value,
      family.review.specimens[0].properties[name]
    );
  review.setProperties({
    [property(review, 'Title')]: 'Keep the designer title',
    [property(review, 'Email error')]: 'Keep the designer email error',
  });
  const ids = owned(env),
    definitions = copy(
      env.state.nodes.get(built.setId).componentPropertyDefinitions
    );
  const repeated = await env.call('buildMangroveComponents', doc, 'undrr', [
    'form-error-summary',
  ]);
  assert.strictEqual(repeated.errors.length, 0, repeated.errors.join('\n'));
  assert.strictEqual(repeated.createdNodeIds.length, 0);
  assert.deepStrictEqual(owned(env), ids);
  assert.deepStrictEqual(
    env.state.nodes.get(built.setId).componentPropertyDefinitions,
    definitions
  );
  assert.strictEqual(
    review.componentProperties[property(review, 'Title')].value,
    'Keep the designer title'
  );
  assert.strictEqual(
    review.componentProperties[property(review, 'Email error')].value,
    'Keep the designer email error'
  );
  console.log(
    'ok  fresh-only narrow text seeds, stable component/child/property identities and preserved designer overrides'
  );
  console.log(
    'unverified  native underline persistence after text component-property edits: this mock updates property values without changing descendant characters or styles'
  );
  const mcr = await build(doc, 'mcr');
  assert.strictEqual(mcr.result.families[0].variantIds.length, 6);
  const mcrMode = mcr.env.state.collections[0].modes[0].modeId;
  assert.strictEqual(
    mcr.env.state.nodes.get(mcr.result.families[0].setId).parent
      .explicitVariableModes[mcr.env.state.collections[0].id],
    mcrMode
  );
  const wrong = environment(doc);
  await importFoundation(wrong, doc);
  wrong.state.variables.find(
    variable => variable.name === 'component/form-error-summary/accent-width'
  ).resolvedType = 'COLOR';
  const before = {
    nodes: wrong.state.nodes.size,
    styles: wrong.state.styles.length,
  };
  const failure = await wrong.call('buildMangroveComponents', doc, 'undrr', [
    'form-error-summary',
  ]);
  assert(
    failure.errors.some(error => /FLOAT/.test(error)),
    failure.errors.join('\n')
  );
  assert.strictEqual(failure.families.length, 0);
  assert.strictEqual(wrong.state.nodes.size, before.nodes);
  assert.strictEqual(wrong.state.styles.length, before.styles);
  console.log(
    'ok  alternate brand mode and wrong-type geometry preflight without partial component writes'
  );
  for (const font of ['Roboto Regular', 'Roboto Bold']) {
    const unavailable = environment(doc);
    await importFoundation(unavailable, doc);
    unavailable.state.rejectedFonts.add(font);
    const old = {
      nodes: unavailable.state.nodes.size,
      styles: unavailable.state.styles.length,
    };
    const rejected = await unavailable.call(
      'buildMangroveComponents',
      doc,
      'undrr',
      ['form-error-summary']
    );
    assert(
      rejected.errors.some(error => error.includes(font)),
      rejected.errors.join('\n')
    );
    assert.strictEqual(rejected.families.length, 0);
    assert.strictEqual(unavailable.state.nodes.size, old.nodes);
    assert.strictEqual(unavailable.state.styles.length, old.styles);
  }
  for (const [field, value, error] of [
    ['textDecoration', 'WAVY', 'invalid text style decoration'],
    ['textDecoration', 'STRIKETHROUGH', 'invalid text style decoration'],
    ['textDecoration', null, 'invalid text style decoration'],
    ['textWrapStyle', 'WRAP', 'invalid text style wrapping'],
    ['textWrapStyle', 'TRUNCATE', 'invalid text style wrapping'],
    ['textWrapStyle', null, 'invalid text style wrapping'],
  ]) {
    const bad = copy(doc);
    bad.styles.text.find(style => style.id === linkStyle.id).values.undrr[
      field
    ] = value;
    const blocked = environment(bad);
    const nodeCount = blocked.state.nodes.size;
    await assert.rejects(
      blocked.call(
        'importVariables',
        bad,
        ['undrr'],
        false,
        [linkStyle.id],
        false
      ),
      failure => failure.message.includes(error)
    );
    assert.strictEqual(blocked.state.collections.length, 0);
    assert.strictEqual(blocked.state.variables.length, 0);
    assert.strictEqual(blocked.state.styles.length, 0);
    assert.strictEqual(blocked.state.loadedFonts.size, 0);
    assert.strictEqual(blocked.state.nodes.size, nodeCount);
  }
  console.log(
    'ok  invalid exported style decoration/wrapping enums reject before collection, variable, style, font or canvas writes'
  );
  for (const change of [
    node => {
      node.textDecoration = 'WAVY';
    },
    node => {
      node.textWrap = 'BREAK_WORD';
    },
    node => {
      node.textWrap = 'WRAP';
    },
    node => {
      node.textWrap = 'TRUNCATE';
    },
  ]) {
    const bad = copy(doc);
    let link;
    walk(recipe(bad).variants[0].tree, node => {
      if (node.name === 'mg-form-error-summary__link') link = node;
    });
    assert(link, 'Summary link wrapping fixture is missing');
    change(link);
    const blocked = environment(bad);
    await importFoundation(blocked, bad);
    const old = {
      nodes: blocked.state.nodes.size,
      styles: blocked.state.styles.length,
    };
    const rejected = await blocked.call(
      'buildMangroveComponents',
      bad,
      'undrr',
      ['form-error-summary']
    );
    assert(rejected.errors.length > 0);
    if (link.textWrap !== 'AUTO')
      assert(
        rejected.errors.some(error =>
          error.includes('Unsupported text wrapping style')
        ),
        rejected.errors.join('\n')
      );
    assert.strictEqual(rejected.families.length, 0);
    assert.strictEqual(blocked.state.nodes.size, old.nodes);
    assert.strictEqual(blocked.state.styles.length, old.styles);
  }
  console.log(
    'ok  exact Regular/Bold font failures and invalid underline/WRAP/TRUNCATE enum preflight prevent partial native builds'
  );
  for (const textWrap of ['AUTO', 'BALANCE', 'PRETTY']) {
    const valid = copy(doc);
    walk(recipe(valid).variants[0].tree, node => {
      if (node.name === 'mg-form-error-summary__link') node.textWrap = textWrap;
    });
    const accepted = await build(valid);
    const component = accepted.env.state.nodes.get(
      accepted.result.families[0].variantIds[0].nodeId
    );
    const link = component.findAll(
      node => node.name === 'mg-form-error-summary__link'
    )[0];
    assert.strictEqual(link.textWrapStyle, textWrap);
  }
  console.log(
    'ok  native AUTO/BALANCE/PRETTY wrapping contracts accepted on Summary link text'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
module.exports = { main };
