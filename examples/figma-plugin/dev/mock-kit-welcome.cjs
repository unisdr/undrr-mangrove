#!/usr/bin/env node
'use strict';
// Actual Welcome/runtime identity tests. No native auto-layout or visual
// discoverability is simulated; the native presentation gate remains separate.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const doc = buildFigmaVariables();
const copy = value => JSON.parse(JSON.stringify(value));
const key = (node, field = 'mgKitId') =>
  node.getSharedPluginData('orgundrrmangrove', field);
const own = (node, value) =>
  node.setSharedPluginData('orgundrrmangrove', 'mgKitId', value);
const fields = [
  'id',
  'type',
  'name',
  'x',
  'y',
  'width',
  'height',
  'visible',
  'clipsContent',
  'layoutMode',
  'layoutSizingHorizontal',
  'layoutSizingVertical',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'itemSpacing',
  'fontName',
  'fontSize',
  'lineHeight',
  'textStyleId',
  'effectStyleId',
  'textAutoResize',
  'textAlignHorizontal',
  'characters',
  'textDecoration',
  'componentPropertyReferences',
  'overrides',
  'boundVariables',
  'fills',
  'strokes',
  'effects',
  'strokeWeight',
  'cornerRadius',
  'data',
  'sharedData',
  'explicitVariableModes',
];
function record(node, omit = []) {
  const value = Object.fromEntries(
    fields
      .filter(field => !omit.includes(field))
      .map(field => [field, node[field]])
  );
  value.parentId = node.parent?.id;
  value.childIds = node.children.map(child => child.id);
  if (node.type === 'COMPONENT_SET')
    value.properties = node.componentPropertyDefinitions;
  if (node.type === 'INSTANCE') {
    value.properties = node.componentProperties;
    value.mainId = node.main?.id;
  }
  if (node.type === 'TEXT' && node.characters.length)
    value.rangePaints = node.getRangeFills(0, node.characters.length);
  return copy(value);
}
const all = env =>
  new Map([...env.state.nodes.values()].map(node => [node.id, record(node)]));
const complete = env =>
  copy({
    nodes: [...all(env)],
    variables: env.state.variables,
    styles: env.state.styles,
    collections: env.state.collections,
  });
const subtree = node => [
  record(node),
  ...node.findAll().map(child => record(child)),
];
function assertWelcomePaints(env) {
  let count = 0;
  for (const node of env.state.nodes.values()) {
    if (key(node) !== 'welcome' && !key(node).startsWith('welcome/')) continue;
    for (const paint of node.fills) {
      assert.strictEqual(paint.type, 'SOLID');
      const alias = paint.boundVariables?.color;
      assert.strictEqual(alias?.type, 'VARIABLE_ALIAS');
      const variable = env.state.variables.find(item => item.id === alias.id);
      assert.strictEqual(variable?.resolvedType, 'COLOR');
      const value = variable.resolveForConsumer(node).value;
      assert.deepStrictEqual(
        copy(paint.color),
        { r: value.r, g: value.g, b: value.b },
        `Welcome RGB must match its live bound role: ${key(node)}`
      );
      assert.strictEqual(
        paint.opacity ?? 1,
        value.a ?? 1,
        `Welcome opacity must match its live bound role: ${key(node)}`
      );
      count += 1;
    }
  }
  assert(count > 0, 'Actual Welcome must contain bound paint specimens');
  return count;
}
function owned(env, value) {
  const matches = [...env.state.nodes.values()].filter(
    node => key(node) === value
  );
  assert.strictEqual(matches.length, 1, `Expected one owned ${value}`);
  return matches[0];
}
function preserved(env, baseline, omit = new Map()) {
  for (const [id, expected] of baseline) {
    const node = env.state.nodes.get(id);
    assert(node, 'Every prior source/manual asset must remain');
    const actual = record(node);
    const original = copy(expected);
    if (node.type === 'PAGE') {
      assert.deepStrictEqual(
        actual.childIds.filter(child => original.childIds.includes(child)),
        original.childIds,
        'Existing page assets retain relative order'
      );
      delete actual.childIds;
      delete original.childIds;
    }
    for (const field of omit.get(id) || []) {
      delete actual[field];
      delete original[field];
    }
    assert.deepStrictEqual(
      actual,
      original,
      `Unexpected prior asset mutation ${id}`
    );
  }
}
async function fixture() {
  const env = environment(doc);
  await importFoundation(env, doc);
  const built = await env.call('buildMangroveComponents', doc, 'undrr', [
    'button',
    'tabs',
  ]);
  assert.deepStrictEqual(copy(built.errors), []);
  return env;
}
function restart(env) {
  const context = vm.createContext({ figma: env.figma, __html__: '', console });
  for (const file of [
    'kit-identity.js',
    'code.js',
    'kit-inspection.js',
    'kit-builder.js',
    'kit-layout.js',
    'kit-welcome.js',
  ])
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, '..', file), 'utf8'),
      context
    );
  return (name, ...args) => {
    context.args = args;
    return vm.runInContext(`${name}(...args)`, context);
  };
}
async function refuse(
  env,
  label,
  document = doc,
  brand = 'undrr',
  options = {}
) {
  const before = complete(env);
  let result, error;
  try {
    result = await env.call('createMangroveWelcome', document, brand, options);
  } catch (caught) {
    error = caught;
  }
  assert(error || result?.errors?.length, `${label} must refuse`);
  assert.deepStrictEqual(
    complete(env),
    before,
    `${label} must refuse before canvas/style/variable writes`
  );
}
async function main() {
  {
    const env = await fixture();
    assert.strictEqual(
      await env.runCode('return typeof createMangroveWelcome;'),
      'function',
      'Load actual kit-welcome.js in the reusable mock environment'
    );
    env.state.rejectedFonts.add('Roboto Condensed Bold');
    env.state.loadedFonts.delete('Roboto Condensed Bold');
    const baseline = all(env),
      styles = copy(env.state.styles);
    const created = await env.call('createMangroveWelcome', doc, 'undrr');
    assert.deepStrictEqual(copy(created.errors || []), []);
    const welcome = owned(env, 'welcome');
    assert.strictEqual(welcome.type, 'FRAME');
    assert.strictEqual(welcome.parent, env.figma.currentPage);
    assert.strictEqual(owned(env, 'welcome/content').parent, welcome);
    const paintCount = assertWelcomePaints(env);
    const whiteLabel = owned(env, 'welcome/content/hero/label');
    const valid = copy(whiteLabel.fills);
    whiteLabel.fills = valid.map(paint => ({
      ...paint,
      color: { r: 0, g: 0, b: 0 },
    }));
    assert.throws(
      () => assertWelcomePaints(env),
      /Welcome RGB must match/,
      'The observed placeholder-black defect must fail even when its alias stays correct'
    );
    whiteLabel.fills = valid;
    assert(
      ![...env.state.nodes.values()].some(node => key(node) === 'layout/start'),
      'Welcome does not install the migration sentinel'
    );
    preserved(env, baseline);
    assert.deepStrictEqual(copy(env.state.styles), styles);
    assert(
      !env.state.loadedFonts.has('Roboto Condensed Bold'),
      'Welcome must not load missing pending fonts'
    );
    const note = env.figma.createFrame();
    welcome.appendChild(note);
    note.name = 'Designer guidance';
    note.x = -93;
    note.y = 219;
    note.resize(182, 63);
    note.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.4, b: 0.5 } }];
    const noteBefore = record(note),
      ids = [...env.state.nodes.keys()].sort();
    for (const invoke of [env.call, restart(env)]) {
      const repeated = await invoke('createMangroveWelcome', doc, 'undrr');
      assert.deepStrictEqual(copy(repeated.errors || []), []);
      assert.strictEqual(repeated.createdNodeIds.length, 0);
      assert.deepStrictEqual([...env.state.nodes.keys()].sort(), ids);
      assert.strictEqual(owned(env, 'welcome').id, welcome.id);
      assert.strictEqual(assertWelcomePaints(env), paintCount);
      assert.deepStrictEqual(
        record(note),
        noteBefore,
        'Direct manual Welcome notes preserve exact section-local fields'
      );
      preserved(env, baseline);
    }
    const navigated = await env.call('navigateMangroveKit', 'start');
    assert.deepStrictEqual(copy(navigated.errors || []), []);
    assert.deepStrictEqual(
      copy(env.figma.currentPage.selection.map(node => node.id)),
      [welcome.id]
    );
    console.log(
      'ok Welcome bound literal RGB/opacity match live roles on first/repeat/restart; existing canonical/styles and pending fonts stay untouched, manual notes persist, and no migration sentinel is created'
    );
    const welcomeIds = [welcome.id, ...welcome.findAll().map(node => node.id)];
    env.state.rejectedFonts.clear();
    const migrated = await env.call('organizeMangroveKit', doc, 'undrr');
    assert.deepStrictEqual(copy(migrated.errors), []);
    assert.strictEqual(owned(env, 'welcome').id, welcome.id);
    assert.strictEqual(key(welcome.parent), 'layout/start');
    assert.deepStrictEqual(
      [welcome.id, ...welcome.findAll().map(node => node.id)],
      welcomeIds
    );
    assert.deepStrictEqual(record(note), noteBefore);
    assert(
      ![...env.state.nodes.values()].some(
        node => key(node) === 'layout/start/intro'
      ),
      'Full organisation must reuse Welcome instead of creating a duplicate Start introduction'
    );
    console.log(
      'ok full organisation reuses the existing Welcome subtree and preserves its direct manual notes'
    );
  }
  for (const fault of [
    'duplicate-root',
    'wrong-root',
    'wrong-content',
    'duplicate-content',
    'manual-generated-content',
    'missing-font',
    'missing-source-font',
    'other-brand',
    'wrong-variable-type',
    'missing-variable',
  ]) {
    const env = await fixture();
    if (!['missing-font', 'missing-source-font', 'other-brand'].includes(fault))
      await env.call('createMangroveWelcome', doc, 'undrr');
    let document = doc,
      brand = 'undrr';
    if (fault === 'duplicate-root') own(env.figma.createFrame(), 'welcome');
    if (fault === 'wrong-root') owned(env, 'welcome').type = 'SECTION';
    if (fault === 'wrong-content')
      owned(env, 'welcome/content').type = 'SECTION';
    if (fault === 'duplicate-content') {
      const duplicate = env.figma.createFrame();
      own(duplicate, 'welcome/content');
      owned(env, 'welcome').appendChild(duplicate);
    }
    if (fault === 'manual-generated-content')
      owned(env, 'welcome/content').appendChild(env.figma.createFrame());
    if (fault === 'missing-font') {
      env.state.rejectedFonts.add('Roboto Regular');
      env.state.loadedFonts.delete('Roboto Regular');
    }
    if (fault === 'missing-source-font') {
      document = copy(doc);
      document.styles.text = document.styles.text.filter(
        style => style.id !== 'text.text.300.regular'
      );
    }
    if (fault === 'other-brand') brand = 'delta';
    if (fault === 'wrong-variable-type')
      env.state.variables.find(
        variable => variable.name === 'color/interactive'
      ).resolvedType = 'FLOAT';
    if (fault === 'missing-variable')
      env.state.variables.splice(
        env.state.variables.findIndex(
          variable => variable.name === 'color/interactive'
        ),
        1
      );
    await refuse(env, fault, document, brand);
  }
  console.log(
    'ok duplicate/type/generated-content conflicts, missing/wrong-type roles, missing native/source font and different imported brand refuse before writes'
  );
  {
    const env = await fixture();
    const diagnostic = await env.call(
      'createMangroveFocusDiagnostics',
      doc,
      'undrr'
    );
    assert.deepStrictEqual(copy(diagnostic.errors), []);
    const main = owned(env, 'main'),
      review = owned(env, 'review');
    main.absoluteRenderBounds = {
      x: main.x - 20,
      y: main.y,
      width: 1900,
      height: main.height,
    };
    review.absoluteRenderBounds = {
      x: review.x - 30,
      y: review.y,
      width: 1500,
      height: review.height,
    };
    const root = owned(env, 'diagnostics.focus-ring');
    root.x = 0;
    root.y = -80;
    const baseline = all(env),
      diagnosticChildren = subtree(root).slice(1);
    const updated = await env.call('mgWelcomeLegacySpacing', main, review);
    assert(updated.updatedNodeIds.includes(root.id));
    const right = Math.max(
      main.x + main.width,
      main.absoluteRenderBounds.x + main.absoluteRenderBounds.width,
      review.x + review.width,
      review.absoluteRenderBounds.x + review.absoluteRenderBounds.width
    );
    assert(
      root.x >= right + 160,
      'Diagnostics must clear both rendered roots by at least160'
    );
    preserved(env, baseline, new Map([[root.id, ['x', 'y']]]));
    assert.deepStrictEqual(subtree(root).slice(1), diagnosticChildren);
    const stable = complete(env);
    const repeated = await env.call('mgWelcomeLegacySpacing', main, review);
    assert.deepStrictEqual(copy(repeated.updatedNodeIds), []);
    assert.deepStrictEqual(complete(env), stable);
    console.log(
      'ok diagnostics move beyond nominal and rendered Main/Review extents by160 without source subtree changes and repeat idempotently'
    );
  }
  {
    const env = await fixture();
    const otherPage = new env.figma.currentPage.constructor('PAGE');
    env.figma.root.appendChild(otherPage);
    const section = env.figma.createSection();
    otherPage.appendChild(section);
    own(section, 'layout/start');
    await refuse(env, 'foreign Start section', doc, 'undrr', {
      parent: section,
    });
    console.log(
      'ok a foreign page section cannot redirect Welcome outside the current-page ownership scope'
    );
  }
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { main };
