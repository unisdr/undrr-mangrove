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
  'letterSpacing',
  'textWrapStyle',
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
    if (node.type === 'PAGE' && !omit.get(id)?.includes('childIds')) {
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
const heroKey =
  'family/hero-background/variant/hero-background.primary.1280.background.page.default';
const cardKey =
  'family/card-vertical/variant/card-vertical.primary.300.unlinked.buttononly.default';
function canonical(env, value) {
  const matches = [...env.state.nodes.values()].filter(
    node => node.type === 'COMPONENT' && key(node) === value
  );
  assert.strictEqual(matches.length, 1, `One canonical COMPONENT ${value}`);
  return matches[0];
}
async function installLinkedMains(env) {
  const built = await env.call('buildMangroveComponents', doc, 'undrr', [
    'hero-background',
    'card-vertical',
  ]);
  assert.deepStrictEqual(copy(built.errors), []);
}
function assertLinkedWelcome(env, receipt) {
  assert.strictEqual(receipt.presentation, 'linked-mangrove-v3');
  assert.strictEqual(receipt.linkedInstanceIds.length, 5);
  const hero = owned(env, 'welcome/content/hero/instance');
  assert.strictEqual(hero.type, 'INSTANCE');
  assert.strictEqual(hero.main.id, canonical(env, heroKey).id);
  assert.strictEqual(hero.width, 1280);
  assert.strictEqual(key(owned(env, 'welcome'), 'mgWelcomeVersion'), '3');
  const readProperty = (instance, name) => {
    const matches = Object.entries(instance.componentProperties).filter(
      ([property]) => property.replace(/#[^#]+$/, '') === name
    );
    assert.strictEqual(matches.length, 1, `One public ${name} property`);
    return matches[0][1].value;
  };
  assert.strictEqual(readProperty(hero, 'Title'), 'Welcome to Mangrove');
  assert.strictEqual(readProperty(hero, 'Show detail'), false);
  assert.strictEqual(readProperty(hero, 'Show actions'), false);
  const sourceHeading = canonical(env, heroKey).findAll(
    node => node.name === 'mg-hero__title h1'
  )[0];
  const actualHeading = hero.findAll(
    node => node.name === 'mg-hero__title h1'
  )[0];
  for (const field of [
    'fontName',
    'fontSize',
    'lineHeight',
    'letterSpacing',
    'textStyleId',
    'boundVariables',
  ])
    assert.deepStrictEqual(
      copy(actualHeading[field]),
      copy(sourceHeading[field]),
      `Linked Welcome Hero preserves canonical ${field}`
    );
  const row = owned(env, 'welcome/content/use');
  assert.strictEqual(row.layoutMode, 'HORIZONTAL');
  assert.strictEqual(row.width, 1280);
  assert.strictEqual(row.primaryAxisAlignItems, 'CENTER');
  const spacing = env.state.variables.find(
    variable => variable.name === 'spacing/200'
  );
  assert.strictEqual(row.itemSpacing, spacing.resolveForConsumer(row).value);
  assert.strictEqual(row.boundVariables.itemSpacing.id, spacing.id);
  const cardTitles = [
    'Make your first design',
    'Understand a component',
    'Know what is available',
    'Keep your work safe',
  ];
  const cardWrappers = ['use/0', 'use/1', 'maintain/0', 'maintain/1'];
  const ids = [hero.id];
  for (const [i, suffix] of cardWrappers.entries()) {
    const base = `welcome/content/${suffix}`;
    const wrapper = owned(env, base),
      instance = owned(env, `${base}/instance`);
    assert.strictEqual(wrapper.parent.id, row.id);
    assert.strictEqual(wrapper.width, 300);
    assert.strictEqual(instance.type, 'INSTANCE');
    assert.strictEqual(instance.main.id, canonical(env, cardKey).id);
    assert.strictEqual(readProperty(instance, 'Title'), cardTitles[i]);
    for (const name of ['Show image', 'Show labels', 'Show CTA'])
      assert.strictEqual(readProperty(instance, name), false);
    assert.strictEqual(owned(env, `${base}/title`).visible, false);
    assert.strictEqual(owned(env, `${base}/body`).visible, false);
    ids.push(instance.id);
  }
  assert.deepStrictEqual(
    row.children.map(node => key(node)),
    cardWrappers.map(suffix => `welcome/content/${suffix}`)
  );
  assert.deepStrictEqual(copy(receipt.linkedInstanceIds), ids);
  for (const suffix of ['label', 'title', 'body'])
    assert.strictEqual(
      owned(env, `welcome/content/hero/${suffix}`).visible,
      false
    );
  const footer = owned(env, 'welcome/content/maintain');
  assert.strictEqual(footer.parent.id, owned(env, 'welcome/content').id);
  assert.deepStrictEqual(
    footer.children.map(node => key(node)),
    ['welcome/content/maintain/title', 'welcome/content/maintain/body']
  );
  const footerCopy = owned(env, 'welcome/content/maintain/body').characters;
  for (const phrase of [
    'On Free',
    'view centre',
    'Published pilot example',
    'https://www.figma.com/design/wOTLILmiXUI3uzG2BdPUxB?node-id=7-16',
    'not accepted responsive templates or interactions',
    'CORE-KIT-STATUS.md',
  ])
    assert(footerCopy.includes(phrase), `Footer explains ${phrase}`);
  for (const node of env.state.nodes.values()) {
    if (!key(node).startsWith('welcome/')) continue;
    if (node.type === 'FRAME') {
      for (const field of [
        'paddingTop',
        'paddingBottom',
        'paddingLeft',
        'paddingRight',
        'itemSpacing',
      ]) {
        const alias = node.boundVariables[field];
        assert.strictEqual(alias?.type, 'VARIABLE_ALIAS');
        const variable = env.state.variables.find(item => item.id === alias.id);
        assert.strictEqual(variable?.resolvedType, 'FLOAT');
        assert.strictEqual(
          node[field],
          variable.resolveForConsumer(node).value,
          `Welcome ${field} literal matches bound source role ${key(node)}`
        );
      }
    }
    if (node.type !== 'TEXT') continue;
    const sourceId = key(node).endsWith('/title')
      ? 'component.card.title'
      : 'component.card.summary';
    const style = env.state.styles.find(
      value => key(value, 'mgStyleId') === sourceId
    );
    assert.strictEqual(node.textStyleId, style.id);
    assert.deepStrictEqual(copy(node.fontName), copy(style.fontName));
    assert.strictEqual(node.fontSize, style.fontSize);
    assert.deepStrictEqual(copy(node.lineHeight), copy(style.lineHeight));
  }
  assertWelcomePaints(env);
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
    owned(env, 'review').name = 'Mangrove / Review examples';
    const baseline = all(env),
      styles = copy(env.state.styles);
    const created = await env.call('createMangroveWelcome', doc, 'undrr');
    assert.deepStrictEqual(copy(created.errors || []), []);
    assert.strictEqual(created.presentation, 'token-only');
    assert.deepStrictEqual(copy(created.linkedInstanceIds), []);
    assert(
      ![...env.state.nodes.values()].some(
        node =>
          key(node).startsWith('family/hero-background') ||
          key(node).startsWith('family/card-vertical')
      ),
      'Fallback Welcome must not implicitly build canonical families'
    );
    const welcome = owned(env, 'welcome');
    assert.strictEqual(welcome.type, 'FRAME');
    assert.strictEqual(welcome.parent, env.figma.currentPage);
    assert.strictEqual(owned(env, 'welcome/content').parent, welcome);
    const contents = owned(env, 'welcome/content/index/body').characters;
    assert.deepStrictEqual(
      contents.split('\n').slice(1, 4),
      env.figma.currentPage.children
        .slice()
        .reverse()
        .filter(node => ['welcome', 'main', 'review'].includes(key(node)))
        .map(node => node.name),
      'Legacy contents follow the current Layers order'
    );
    for (const id of ['welcome', 'main', 'review'])
      assert(
        contents.includes(owned(env, id).name),
        'Contents use the current owned board name'
      );
    for (const absent of [
      '01 Foundations',
      '02 Components',
      '03 Compositions',
      '04 Page patterns',
      '90 Pending work',
      'Mangrove diagnostics / focus ring',
    ])
      assert(
        !contents.includes(absent),
        'Contents must not list an absent canvas destination'
      );
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
    const migratedContents = owned(
      env,
      'welcome/content/index/body'
    ).characters;
    for (const id of [
      'start',
      'foundations',
      'components',
      'compositions',
      'patterns',
      'pending',
    ])
      assert(
        migratedContents.includes(owned(env, `layout/${id}`).name),
        'Migrated contents match actual section names'
      );
    assert(
      !migratedContents.includes('Mangrove / Review examples'),
      'Section navigation replaces the legacy board index after migration'
    );
    assert(
      ![...env.state.nodes.values()].some(
        node => key(node) === 'layout/start/intro'
      ),
      'Full organisation must reuse Welcome instead of creating a duplicate Start introduction'
    );
    const canvasCopy = () =>
      owned(env, 'welcome/content/use/1/body').characters;
    assert(canvasCopy().includes('records pending page-pattern coverage'));
    const start = owned(env, 'layout/start');
    start.setSharedPluginData('orgundrrmangrove', 'mgLayoutVersion', '1');
    await env.call('createMangroveWelcome', doc, 'undrr');
    assert(canvasCopy().includes('earlier section layout'));
    assert(!canvasCopy().includes('sit beside'));
    start.setSharedPluginData('orgundrrmangrove', 'mgLayoutVersion', '2');
    await env.call('createMangroveWelcome', doc, 'undrr');
    assert(canvasCopy().includes('Source components and advanced parts'));
    console.log(
      'ok full organisation reuses Welcome/manual notes; orientation distinguishes pending templates and v1 upgrade from installed v2'
    );
  }
  {
    const env = await fixture();
    const fallback = await env.call('createMangroveWelcome', doc, 'undrr');
    assert.strictEqual(fallback.presentation, 'token-only');
    const oldWelcome = owned(env, 'welcome');
    const oldIds = [
      oldWelcome.id,
      ...oldWelcome.findAll().map(node => node.id),
    ];
    const oldWrappers = ['maintain/0', 'maintain/1'].map(suffix => ({
      id: owned(env, `welcome/content/${suffix}`).id,
      parentId: owned(env, `welcome/content/${suffix}`).parent.id,
    }));
    const note = env.figma.createFrame();
    oldWelcome.appendChild(note);
    note.name = 'My Welcome note';
    note.x = -38;
    note.y = 235;
    note.resize(211, 74);
    const noteBefore = record(note);
    await installLinkedMains(env);
    // Native Assets-created roots copy their canonical identity. They must
    // not be mistaken for an additional canonical dependency by the index.
    const personal = owned(env, cardKey).createInstance();
    assert.strictEqual(key(personal), cardKey);
    const baseline = new Map(
      [...all(env)].filter(([id]) => {
        const node = env.state.nodes.get(id);
        return key(node) !== 'welcome' && !key(node).startsWith('welcome/');
      })
    );
    const foundations = copy({
      variables: env.state.variables,
      styles: env.state.styles,
      collections: env.state.collections,
    });
    const linked = await env.call('createMangroveWelcome', doc, 'undrr');
    assert.deepStrictEqual(copy(linked.errors), []);
    assertLinkedWelcome(env, linked);
    assert.strictEqual(owned(env, 'welcome').id, oldWelcome.id);
    for (const id of oldIds) assert(env.state.nodes.has(id));
    for (const wrapper of oldWrappers) {
      const now = env.state.nodes.get(wrapper.id);
      assert.notStrictEqual(now.parent.id, wrapper.parentId);
      assert.strictEqual(now.parent.id, owned(env, 'welcome/content/use').id);
    }
    preserved(env, baseline);
    assert.deepStrictEqual(record(note), noteBefore);
    assert.deepStrictEqual(
      copy({
        variables: env.state.variables,
        styles: env.state.styles,
        collections: env.state.collections,
      }),
      foundations
    );
    const ids = [...env.state.nodes.keys()].sort();
    const linkedIds = copy(linked.linkedInstanceIds);
    for (const invoke of [env.call, restart(env)]) {
      const repeated = await invoke('createMangroveWelcome', doc, 'undrr');
      assert.deepStrictEqual(copy(repeated.errors), []);
      assert.strictEqual(repeated.createdNodeIds.length, 0);
      assert.deepStrictEqual([...env.state.nodes.keys()].sort(), ids);
      assert.deepStrictEqual(copy(repeated.linkedInstanceIds), linkedIds);
      assertLinkedWelcome(env, repeated);
      preserved(env, baseline);
      assert.deepStrictEqual(record(note), noteBefore);
      assert.deepStrictEqual(
        copy({
          variables: env.state.variables,
          styles: env.state.styles,
          collections: env.state.collections,
        }),
        foundations
      );
    }
    console.log(
      'ok linked Welcome reuses one Page Hero and four Cards with public properties/styles/bound spacing; fallback IDs and manual notes survive the narrow parent migration and zero-create repeat/restart'
    );
  }
  {
    const env = await fixture();
    await installLinkedMains(env);
    const baseline = all(env),
      foundations = copy({
        variables: env.state.variables,
        styles: env.state.styles,
        collections: env.state.collections,
      });
    const created = await env.call('createMangroveWelcome', doc, 'undrr');
    assert.deepStrictEqual(copy(created.errors), []);
    assertLinkedWelcome(env, created);
    preserved(env, baseline);
    assert.deepStrictEqual(
      copy({
        variables: env.state.variables,
        styles: env.state.styles,
        collections: env.state.collections,
      }),
      foundations
    );
    console.log(
      'ok a first linked Welcome creates only its owned presentation and instances, preserving every existing canonical/foundation record'
    );
  }
  for (const fault of [
    'missing-active-main',
    'wrong-main-type',
    'wrong-instance-main',
    'wrong-instance-type',
    'missing-main-property',
    'wrong-main-property-type',
    'missing-main-font',
    'missing-linked-style',
    'wrong-spacing-role',
    'wrong-maintain-parent',
  ]) {
    const env = await fixture();
    await installLinkedMains(env);
    const linked = await env.call('createMangroveWelcome', doc, 'undrr');
    assert.deepStrictEqual(copy(linked.errors), []);
    const main = owned(env, heroKey);
    if (fault === 'missing-active-main') main.remove();
    if (fault === 'wrong-main-type') main.type = 'FRAME';
    if (fault === 'wrong-instance-main')
      owned(env, 'welcome/content/hero/instance').main = owned(env, cardKey);
    if (fault === 'wrong-instance-type')
      owned(env, 'welcome/content/hero/instance').type = 'FRAME';
    if (['missing-main-property', 'wrong-main-property-type'].includes(fault)) {
      const definitions = main.parent.componentPropertyDefinitions;
      const property = Object.keys(definitions).find(
        name => name.replace(/#[^#]+$/, '') === 'Title'
      );
      assert(property);
      if (fault === 'missing-main-property') delete definitions[property];
      else definitions[property].type = 'BOOLEAN';
    }
    if (fault === 'missing-main-font') {
      env.state.rejectedFonts.add('Roboto Condensed Bold');
      env.state.loadedFonts.delete('Roboto Condensed Bold');
    }
    if (fault === 'missing-linked-style')
      env.state.styles.splice(
        env.state.styles.findIndex(
          style => key(style, 'mgStyleId') === 'component.card.title'
        ),
        1
      );
    if (fault === 'wrong-spacing-role')
      env.state.variables.find(
        variable => variable.name === 'spacing/200'
      ).resolvedType = 'COLOR';
    if (fault === 'wrong-maintain-parent')
      owned(env, 'welcome/content/index').appendChild(
        owned(env, 'welcome/content/maintain/0')
      );
    await refuse(env, `linked ${fault}`);
  }
  console.log(
    'ok active linked Welcome refuses missing/wrong mains, types, public properties, exact fonts, styles, spacing roles and unrelated parent moves before writes'
  );
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
    const manual = env.figma.createFrame();
    manual.name = 'Manual working frame';
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
    assert.strictEqual(env.figma.currentPage.children[0], root);
    assert.deepStrictEqual(
      env.figma.currentPage.children
        .filter(node => node !== root)
        .map(node => node.id),
      baseline
        .get(env.figma.currentPage.id)
        .childIds.filter(id => id !== root.id),
      'Moving diagnostics last in Layers preserves every other root order'
    );
    preserved(
      env,
      baseline,
      new Map([
        [root.id, ['x', 'y']],
        [env.figma.currentPage.id, ['childIds']],
      ])
    );
    assert.deepStrictEqual(subtree(root).slice(1), diagnosticChildren);
    const stable = complete(env);
    const repeated = await env.call('mgWelcomeLegacySpacing', main, review);
    assert.deepStrictEqual(copy(repeated.updatedNodeIds), []);
    assert.deepStrictEqual(complete(env), stable);
    env.figma.currentPage.appendChild(root);
    const label = root.findAll(node => node.type === 'TEXT')[0];
    label.fontName = { family: 'Roboto', style: 'Bold' };
    env.state.rejectedFonts.add('Roboto Bold');
    env.state.loadedFonts.delete('Roboto Bold');
    await refuse(env, 'missing diagnostic font before Welcome/reorder writes');
    env.state.rejectedFonts.delete('Roboto Bold');
    const beforeWelcomeDiagnosticChildren = subtree(root).slice(1);
    const welcomed = await env.call('createMangroveWelcome', doc, 'undrr');
    assert.deepStrictEqual(copy(welcomed.errors), []);
    const contents = owned(env, 'welcome/content/index/body').characters;
    assert.strictEqual(contents.split('\n').slice(1, 5).at(-1), root.name);
    assert(
      !contents.includes(manual.name),
      'Manual roots stay outside the generated kit index'
    );
    assert.deepStrictEqual(
      subtree(root).slice(1),
      beforeWelcomeDiagnosticChildren
    );
    console.log(
      'ok diagnostics stay last in Layers and clear rendered bounds, preserving other root order and anatomy; missing diagnostic fonts refuse before writes'
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
