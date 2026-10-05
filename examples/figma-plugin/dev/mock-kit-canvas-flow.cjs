#!/usr/bin/env node
'use strict';
// Actual layout/builder flow tests. Synthetic sizing does not establish native
// auto-layout, rendering, image raster or designer discoverability acceptance.
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
const insideInstance = node => {
  for (let parent = node.parent; parent; parent = parent.parent)
    if (parent.type === 'INSTANCE') return true;
  return false;
};
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
  'layoutPositioning',
  'layoutSizingHorizontal',
  'layoutSizingVertical',
  'primaryAxisSizingMode',
  'counterAxisSizingMode',
  'primaryAxisAlignItems',
  'counterAxisAlignItems',
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
  'textDecorationOffset',
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
const foundation = env =>
  copy({
    variables: env.state.variables,
    styles: env.state.styles,
    collections: env.state.collections,
  });
const subtree = node => [
  record(node),
  ...node.findAll().map(child => record(child)),
];
function owned(env, value) {
  const matches = [...env.state.nodes.values()].filter(
    node =>
      key(node) === value &&
      !insideInstance(node) &&
      !(node.type === 'INSTANCE' && key(node).startsWith('family/'))
  );
  assert.strictEqual(matches.length, 1, `One owned ${value}`);
  return matches[0];
}
const selected = [
  'button',
  'text-input',
  'combobox',
  'table',
  'table-of-contents',
  'details',
  'tabs',
  'card-vertical',
  'hero-background',
];
async function fixture() {
  const env = environment(doc);
  await importFoundation(env, doc);
  const built = await env.call(
    'buildMangroveComponents',
    doc,
    'undrr',
    selected
  );
  assert.deepStrictEqual(copy(built.errors), []);
  const organized = await env.call('organizeMangroveKit', doc, 'undrr');
  assert.deepStrictEqual(copy(organized.errors), []);
  assert.strictEqual(
    key(owned(env, 'layout/start'), 'mgLayoutFlowVersion'),
    ''
  );
  assert(
    ![...env.state.nodes.values()].some(
      node => key(node) === 'layout/reference'
    )
  );
  return env;
}
function originals(env) {
  return new Map(
    [...env.state.nodes.values()]
      .filter(
        node => node.type === 'COMPONENT_SET' && key(node).startsWith('family/')
      )
      .flatMap(node =>
        [node, ...node.findAll()].map(child => [child.id, record(child)])
      )
  );
}
function exactRecords(env, baseline, label) {
  for (const [id, expected] of baseline)
    assert.deepStrictEqual(
      record(env.state.nodes.get(id)),
      expected,
      `${label}: ${id}`
    );
}
function restart(env) {
  const context = vm.createContext({
    figma: env.figma,
    __html__: '',
    console,
    MG_KIT_GUIDANCE: copy(doc.kitGuidance),
  });
  for (const file of [
    'kit-identity.js',
    'importer.js',
    'code.js',
    'kit-inspection.js',
    'kit-builder.js',
    'kit-layout.js',
    'kit-welcome.js',
    'kit-navigation.js',
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
async function refused(env, label, document = doc) {
  const before = complete(env);
  let response, error;
  try {
    response = await env.call('organizeMangroveKit', document, 'undrr', {
      compact: true,
    });
  } catch (caught) {
    error = caught;
  }
  assert(error || response?.errors?.length, `${label} must refuse`);
  assert.deepStrictEqual(
    complete(env),
    before,
    `${label} refuses before scene/foundation mutation`
  );
}
function guardSectionTextSizing(env) {
  const create = env.figma.createText;
  const created = [];
  let rejectedWrites = 0;
  env.figma.createText = () => {
    const node = create();
    created.push(node);
    for (const field of ['layoutSizingHorizontal', 'layoutSizingVertical']) {
      const descriptor = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(node),
        field
      );
      Object.defineProperty(node, field, {
        configurable: true,
        get: () => descriptor.get.call(node),
        set: value => {
          if (node.parent?.type === 'SECTION') {
            rejectedWrites++;
            throw new Error(
              `${field} must be on a text child of an auto-layout frame`
            );
          }
          descriptor.set.call(node, value);
        },
      });
    }
    return node;
  };
  return { created, rejected: () => rejectedWrites };
}
function primaryIds(env) {
  return doc.kitGuidance.families
    .filter(
      meta =>
        !meta.parentFamilyId &&
        meta.status !== 'outside-core' &&
        [...env.state.nodes.values()].some(
          node =>
            node.type === 'COMPONENT_SET' && key(node) === `family/${meta.id}`
        )
    )
    .map(meta => meta.id);
}
function assertFlow(env, sourceSamples) {
  const start = owned(env, 'layout/start');
  assert.strictEqual(key(start, 'mgLayoutFlowVersion'), '1');
  assert.strictEqual(key(start, 'mgLayoutFlowPhase'), 'complete');
  const reference = owned(env, 'layout/reference'),
    components = owned(env, 'layout/components');
  assert.strictEqual(reference.type, 'SECTION');
  assert.strictEqual(reference.x, components.x + components.width + 240);
  assert.strictEqual(reference.y, components.y);
  assert.deepStrictEqual(copy(components.fills), []);
  const groups = doc.kitGuidance.groups.map(group =>
    owned(env, `layout/group/${group.id}`)
  );
  assert.notStrictEqual(
    groups[0].width,
    groups[2].width,
    'Fixture must distinguish per-row widths from a global column maximum'
  );
  for (const index of [0, 2]) {
    const left = groups[index],
      right = groups[index + 1];
    assert.strictEqual(left.x, 32);
    assert.strictEqual(
      right.x,
      left.x + left.width + 80,
      'Each row uses its own measured left width'
    );
    assert.strictEqual(right.y, left.y);
  }
  const referenceGroups = doc.kitGuidance.groups.map(group =>
    owned(env, `layout/reference/group/${group.id}`)
  );
  for (const index of [0, 2]) {
    const left = referenceGroups[index],
      right = referenceGroups[index + 1];
    assert.strictEqual(left.x, 32);
    assert.strictEqual(right.x, left.x + left.width + 80);
    assert.strictEqual(right.y, left.y);
  }
  const workspace = owned(env, 'layout/patterns'),
    foundations = owned(env, 'layout/foundations');
  assert.strictEqual(workspace.y, start.y);
  assert.strictEqual(foundations.y, start.y);
  assert(
    workspace.x >= foundations.x + foundations.width,
    'Workspace joins the opening band'
  );
  for (const id of primaryIds(env)) {
    const meta = doc.kitGuidance.families.find(item => item.id === id),
      entry = owned(env, `layout/entry/${id}`),
      overview = owned(env, `layout/family/${id}/overview`),
      sample = owned(env, `layout/entry/${id}/instance`),
      source = sourceSamples.get(id);
    assert.strictEqual(entry.type, 'FRAME');
    assert.strictEqual(
      entry.parent.id,
      owned(env, `layout/group/${meta.groupId}`).id
    );
    assert.deepStrictEqual(
      entry.children.map(node => key(node)).sort(),
      ['title', 'body', 'label', 'instance']
        .map(suffix => `layout/entry/${id}/${suffix}`)
        .sort()
    );
    const heading = owned(env, `layout/entry/${id}/title`),
      body = owned(env, `layout/entry/${id}/body`),
      label = owned(env, `layout/entry/${id}/label`);
    assert(body.y >= heading.y + heading.height);
    assert(sample.y >= body.y + body.height);
    assert(label.y >= sample.y + sample.height);
    assert.strictEqual(
      overview.parent.id,
      owned(env, `layout/reference/group/${meta.groupId}`).id
    );
    assert.strictEqual(sample.type, 'INSTANCE');
    assert.strictEqual(sample.main.id, source.mainId);
    assert.deepStrictEqual(copy(sample.componentProperties), source.properties);
    assert.strictEqual(sample.width, source.width);
    assert.strictEqual(sample.height, source.height);
    assert(owned(env, `layout/entry/${id}/body`).characters.length > 0);
  }
  const outside = owned(env, 'layout/family/tabs/overview');
  assert.strictEqual(outside.parent.id, owned(env, 'layout/pending/browse').id);
  assert(
    ![...env.state.nodes.values()].some(
      node => key(node) === 'layout/entry/tabs'
    )
  );
}
async function main() {
  {
    const env = await fixture();
    const nativeSectionGuard = guardSectionTextSizing(env);
    const editedReview = owned(env, 'review/text-input').findAll(
      node => node.type === 'INSTANCE' && !insideInstance(node)
    )[0];
    // Native review roots can differ from their unchanged 320px main. Reusing
    // main.createInstance() alone loses the review's explicit root dimensions.
    const tableExemplar = owned(env, 'review/table').findAll(
      node => node.type === 'INSTANCE' && !insideInstance(node)
    )[0];
    for (const [exemplar, width] of [
      [editedReview, 328],
      [tableExemplar, 720],
    ]) {
      assert(exemplar);
      exemplar.resize(width, exemplar.height);
      assert.strictEqual(exemplar.main.width, 320);
      assert.strictEqual(exemplar.width, width);
      assert.notStrictEqual(
        exemplar.width,
        exemplar.main.width,
        'Fixture must exercise review root width independently of its main'
      );
    }
    const reviewLabel = Object.keys(editedReview.componentProperties).find(
      name => name.replace(/#[^#]+$/, '') === 'Label'
    );
    assert(reviewLabel);
    editedReview.setProperties({ [reviewLabel]: 'Edited reference label' });
    const workspace = owned(env, 'layout/patterns'),
      design = env.figma.createFrame();
    workspace.appendChild(design);
    design.name = 'My design';
    design.x = 173;
    design.y = 242;
    design.resize(512, 320);
    const set = owned(env, 'family/button'),
      manual = set.children[0].createInstance();
    design.appendChild(manual);
    manual.x = 43;
    manual.y = 69;
    const labelKey = Object.keys(manual.componentProperties).find(
      name => name.replace(/#[^#]+$/, '') === 'Label'
    );
    manual.setProperties({ [labelKey]: 'Designer-owned content' });
    const note = env.figma.createFrame();
    design.appendChild(note);
    note.name = 'My note';
    note.x = 12;
    note.y = 141;
    note.resize(183, 51);
    note.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.5, b: 0.7 } }];
    const manualBaseline = new Map([
      [design.id, record(design)],
      ...design.findAll().map(node => [node.id, record(node)]),
    ]);
    const source = originals(env),
      fonts = foundation(env),
      canonicalIds = [...source.keys()].sort();
    const reviewNodes = [...env.state.nodes.values()].filter(node =>
      /^review\/[^/]+$/.test(key(node))
    );
    const reviews = reviewNodes.map(node => [node.id, subtree(node)]);
    const sourceSamples = new Map(
      primaryIds(env).map(id => {
        const review = owned(env, `review/${id}`),
          instance = review.findAll(
            node => node.type === 'INSTANCE' && !insideInstance(node)
          )[0];
        assert(instance);
        return [
          id,
          {
            mainId: instance.main.id,
            properties: copy(instance.componentProperties),
            width: instance.width,
            height: instance.height,
          },
        ];
      })
    );
    const compact = await env.call('organizeMangroveKit', doc, 'undrr', {
      compact: true,
    });
    assert.deepStrictEqual(copy(compact.errors), []);
    assert.strictEqual(nativeSectionGuard.rejected(), 0);
    assert(
      nativeSectionGuard.created.some(
        node =>
          key(node) === 'layout/reference/title' &&
          node.parent.type === 'SECTION'
      ),
      'The native Section guard must exercise the actual reference title'
    );
    assert(compact.createdNodeIds.length > 0);
    assertFlow(env, sourceSamples);
    exactRecords(env, source, 'Canonical fields');
    exactRecords(env, manualBaseline, 'Manual design fields');
    assert.deepStrictEqual(foundation(env), fonts);
    assert.deepStrictEqual(
      [...originals(env).keys()].sort(),
      canonicalIds,
      'Entry creation cannot create implicit main families'
    );
    for (const [id, records] of reviews)
      assert.deepStrictEqual(
        subtree(env.state.nodes.get(id)),
        records,
        'Review anatomy and overrides remain exact'
      );
    const ids = [...env.state.nodes.keys()].sort();
    const stalePreview = owned(env, 'layout/entry/table/instance');
    stalePreview.resize(stalePreview.main.width, stalePreview.height);
    assert.strictEqual(stalePreview.width, 320);
    assert.strictEqual(sourceSamples.get('table').width, 720);
    for (const invoke of [env.call, restart(env)]) {
      const repeated = await invoke('organizeMangroveKit', doc, 'undrr');
      assert.deepStrictEqual(copy(repeated.errors), []);
      assert.strictEqual(repeated.createdNodeIds.length, 0);
      assert.deepStrictEqual([...env.state.nodes.keys()].sort(), ids);
      assertFlow(env, sourceSamples);
      exactRecords(env, source, 'Repeated canonical fields');
      exactRecords(env, manualBaseline, 'Repeated manual design fields');
      assert.deepStrictEqual(foundation(env), fonts);
      for (const [id, records] of reviews)
        assert.deepStrictEqual(subtree(env.state.nodes.get(id)), records);
      const rebuilt = await invoke(
        'buildMangroveComponents',
        doc,
        'undrr',
        selected
      );
      assert.deepStrictEqual(copy(rebuilt.errors), []);
      assert.strictEqual(rebuilt.createdNodeIds.length, 0);
      assert.deepStrictEqual([...env.state.nodes.keys()].sort(), ids);
      assertFlow(env, sourceSamples);
      exactRecords(env, source, 'Ordinary-build canonical fields');
      exactRecords(env, manualBaseline, 'Ordinary-build manual design fields');
      assert.deepStrictEqual(foundation(env), fonts);
      for (const [id, records] of reviews)
        assert.deepStrictEqual(subtree(env.state.nodes.get(id)), records);
    }
    const navigationBaseline = complete(env),
      loadFont = env.figma.loadFontAsync;
    env.figma.loadFontAsync = async () => {
      throw new Error('Navigation must not load fonts');
    };
    try {
      for (const [view, destination] of [
        ['example', 'layout/entry/hero-background'],
        ['reference', 'review/hero-background'],
        ['source', 'family/hero-background'],
      ]) {
        const navigated = await env.call(
          'navigateMangroveInstalled',
          `${view}:hero-background`
        );
        assert.deepStrictEqual(copy(navigated.errors), []);
        assert.strictEqual(navigated.nodeId, owned(env, destination).id);
        assert.deepStrictEqual(
          copy(env.figma.currentPage.selection.map(node => node.id)),
          [owned(env, destination).id]
        );
        assert.deepStrictEqual(
          complete(env),
          navigationBaseline,
          'Entry/reference/source navigation must not resize source or mutate assets'
        );
      }
    } finally {
      env.figma.loadFontAsync = loadFont;
    }
    console.log(
      'ok explicit compact migration preserves canonical/review/manual/foundation fields, copies distinct328/720px exemplar roots without resizing320px mains, repairs a stale preview, uses each row’s actual width and80px gap, and reuses IDs on ordinary/restart updates'
    );
    console.log(
      'ok example/reference/source navigation selects exact installed destinations without font loads, geometry changes or source mutations'
    );
  }
  for (const fault of [
    'entry-manual',
    'wrong-entry-main',
    'unknown-flow-key',
    'missing-flow-review',
    'missing-first-review',
    'wrong-reference-type',
  ]) {
    const env = await fixture();
    if (fault !== 'missing-first-review') {
      const compact = await env.call('organizeMangroveKit', doc, 'undrr', {
        compact: true,
      });
      assert.deepStrictEqual(copy(compact.errors), []);
    }
    if (fault === 'entry-manual')
      owned(env, 'layout/entry/button').appendChild(env.figma.createFrame());
    if (fault === 'wrong-entry-main')
      owned(env, 'layout/entry/button/instance').main = owned(
        env,
        'family/text-input'
      ).children[0];
    if (fault === 'unknown-flow-key') {
      const wrong = env.figma.createFrame();
      own(wrong, 'layout/entry/not-a-source-family');
      owned(env, 'layout/components').appendChild(wrong);
    }
    if (['missing-flow-review', 'missing-first-review'].includes(fault))
      owned(env, 'review/button').remove();
    if (fault === 'wrong-reference-type')
      owned(env, 'layout/reference').type = 'FRAME';
    await refused(env, fault);
  }
  console.log(
    'ok compact ownership/manual/type/main/dependency conflicts refuse before mutation'
  );
  {
    const env = await fixture();
    const guard = guardSectionTextSizing(env);
    const source = originals(env),
      fonts = foundation(env),
      originalIds = new Set(env.state.nodes.keys());
    const create = env.figma.createText;
    env.figma.createText = () => {
      if (
        [...env.state.nodes.values()].some(
          node => key(node) === 'layout/reference/title'
        )
      )
        throw new Error('Injected failure after the reference title');
      return create();
    };
    let partial;
    try {
      partial = await env.call('organizeMangroveKit', doc, 'undrr', {
        compact: true,
      });
    } finally {
      env.figma.createText = create;
    }
    assert.strictEqual(partial.phase, 'migrating');
    assert.strictEqual(partial.errors.length, 1);
    assert.match(
      partial.errors[0],
      /Injected failure after the reference title/
    );
    assert.strictEqual(
      key(owned(env, 'layout/start'), 'mgLayoutFlowPhase'),
      'migrating'
    );
    assert.strictEqual(guard.rejected(), 0);
    assert(owned(env, 'layout/reference/title'));
    const newIds = [...env.state.nodes.keys()].filter(
      id => !originalIds.has(id)
    );
    assert.deepStrictEqual(newIds.sort(), copy(partial.createdNodeIds).sort());
    assert.strictEqual(
      newIds.length,
      2,
      'Partial creation is exactly the reference and its title'
    );
    exactRecords(env, source, 'Partial source fields');
    assert.deepStrictEqual(foundation(env), fonts);
    const partialBaseline = complete(env);
    let blocked, blockedError;
    try {
      blocked = await env.call('buildMangroveComponents', doc, 'undrr', [
        'button',
      ]);
    } catch (error) {
      blockedError = error;
    }
    assert(
      blockedError || blocked?.errors?.length,
      'Ordinary builds refuse a partial compact migration'
    );
    assert.deepStrictEqual(complete(env), partialBaseline);
    const persistedIds = [...env.state.nodes.keys()];
    const invoke = restart(env);
    const recovered = await invoke('organizeMangroveKit', doc, 'undrr', {
      compact: true,
    });
    assert.deepStrictEqual(copy(recovered.errors), []);
    assert.strictEqual(
      key(owned(env, 'layout/start'), 'mgLayoutFlowPhase'),
      'complete'
    );
    for (const id of persistedIds)
      assert(
        env.state.nodes.has(id),
        'Fresh-global retry retains every original/partial ID'
      );
    exactRecords(env, source, 'Recovered source fields');
    assert.deepStrictEqual(foundation(env), fonts);
    const allIds = [...env.state.nodes.keys()].sort();
    const repeated = await invoke('organizeMangroveKit', doc, 'undrr');
    assert.deepStrictEqual(copy(repeated.errors), []);
    assert.strictEqual(repeated.createdNodeIds.length, 0);
    assert.deepStrictEqual([...env.state.nodes.keys()].sort(), allIds);
    assert.strictEqual(guard.rejected(), 0);
    console.log(
      'ok Section TEXT sizing follows native restrictions; an exact two-node partial failure blocks ordinary writes and explicit fresh-global retry retains IDs without duplicates'
    );
  }
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { main };
