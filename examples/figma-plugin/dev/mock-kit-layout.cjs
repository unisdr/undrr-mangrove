#!/usr/bin/env node
'use strict';
// Actual reconciler and builder tests. This mock does not simulate native auto
// layout, render overflow, selection bounds or designer discoverability.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const doc = buildFigmaVariables();
const { buildKitGuidance } = require('../../../scripts/figma-kit-guidance.cjs');
doc.kitGuidance ||= buildKitGuidance(doc.components.families);
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
const canonical = node =>
  key(node).startsWith('family/') &&
  !(
    node.type === 'INSTANCE' &&
    /^family\/[^/]+\/variant\/[^/]+$/.test(key(node))
  ) &&
  !insideInstance(node);
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
  const result = Object.fromEntries(
    fields
      .filter(field => !omit.includes(field))
      .map(field => [field, node[field]])
  );
  result.parentId = node.parent?.id;
  result.childIds = node.children.map(child => child.id);
  if (node.type === 'COMPONENT_SET')
    result.properties = node.componentPropertyDefinitions;
  if (node.type === 'INSTANCE') {
    result.properties = node.componentProperties;
    result.mainId = node.main?.id;
  }
  return copy(result);
}
function complete(env) {
  return copy({
    nodes: [...env.state.nodes.values()].map(node => record(node)),
    variables: env.state.variables,
    collections: env.state.collections,
    styles: env.state.styles,
  });
}
const subtree = node => [
  record(node),
  ...node.findAll().map(child => record(child)),
];
function originals(env) {
  return new Map(
    [...env.state.nodes.values()].filter(canonical).map(node => {
      const omit =
        node.type === 'COMPONENT_SET'
          ? ['x', 'y', 'width', 'height']
          : node.type === 'COMPONENT'
            ? ['x', 'y']
            : [];
      const value = record(node, omit);
      // Only a set's presentation parent changes during migration.
      if (node.type === 'COMPONENT_SET') delete value.parentId;
      return [node.id, value];
    })
  );
}
function assertOriginals(env, before) {
  for (const [id, baseline] of before) {
    const node = env.state.nodes.get(id);
    assert(node, `Canonical ${id} must survive`);
    const omit =
      node.type === 'COMPONENT_SET'
        ? ['x', 'y', 'width', 'height']
        : node.type === 'COMPONENT'
          ? ['x', 'y']
          : [];
    const value = record(node, omit);
    if (node.type === 'COMPONENT_SET') delete value.parentId;
    assert.deepStrictEqual(
      value,
      baseline,
      `Canonical source fields changed at ${id}`
    );
  }
}
function owned(env, value) {
  const nodes = [...env.state.nodes.values()].filter(
    node =>
      key(node) === value && node.type !== 'INSTANCE' && !insideInstance(node)
  );
  assert.strictEqual(nodes.length, 1, `Exactly one owned node ${value}`);
  return nodes[0];
}
const selected = ['button', 'table', 'text-cta', 'tabs'];
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
  assert.strictEqual(
    [...env.state.nodes.values()].filter(node => node.type === 'SECTION')
      .length,
    0,
    'Ordinary builds must not silently migrate a legacy kit'
  );
  return env;
}
async function version1Fixture() {
  const env = await fixture();
  const sections = new Map();
  for (const id of [
    'start',
    'foundations',
    'components',
    'compositions',
    'patterns',
    'pending',
  ]) {
    const section = env.figma.createSection();
    own(section, `layout/${id}`);
    sections.set(id, section);
  }
  sections
    .get('start')
    .setSharedPluginData('orgundrrmangrove', 'mgLayoutVersion', '1');
  sections
    .get('start')
    .setSharedPluginData('orgundrrmangrove', 'mgLayoutPhase', 'complete');
  const areas = new Map();
  for (const area of ['components', 'compositions', 'pending']) {
    const main =
      area === 'components' ? owned(env, 'main') : env.figma.createFrame();
    const review =
      area === 'components' ? owned(env, 'review') : env.figma.createFrame();
    if (area !== 'components') {
      own(main, `layout/${area}/main`);
      own(review, `layout/${area}/review`);
    }
    sections.get(area).appendChild(main);
    sections.get(area).appendChild(review);
    areas.set(area, { main, review });
  }
  for (const family of doc.components.families) {
    const sets = [...env.state.nodes.values()].filter(
      node =>
        key(node) === `family/${family.id}` && node.type === 'COMPONENT_SET'
    );
    if (!sets.length) continue;
    const area = ['tabs', 'tabs-trigger', 'editorial-cta'].includes(family.id)
      ? 'pending'
      : [
            'combobox',
            'table',
            'text-cta',
            'table-of-contents',
            'segmented-control.full-width-below-medium',
          ].includes(family.id)
        ? 'compositions'
        : 'components';
    const wrapper = env.figma.createFrame();
    own(wrapper, `layout/family/${family.id}/main`);
    areas.get(area).main.appendChild(wrapper);
    wrapper.appendChild(sets[0]);
    const reviews = [...env.state.nodes.values()].filter(
      node => key(node) === `review/${family.id}`
    );
    if (reviews.length) areas.get(area).review.appendChild(reviews[0]);
  }
  return env;
}
async function refuse(
  env,
  document = doc,
  label = 'Invalid migration',
  brandId = 'undrr'
) {
  const baseline = complete(env);
  let result, error;
  try {
    result = await env.call('organizeMangroveKit', document, brandId);
  } catch (caught) {
    error = caught;
  }
  assert(error || result?.errors?.length, `${label} must refuse`);
  assert.deepStrictEqual(
    complete(env),
    baseline,
    'Refusal must happen before canvas/style/variable writes'
  );
}
function restart(env) {
  // Fresh plugin globals over the same saved document objects. This exercises
  // persisted identity/phase state, not closures retained from the first run.
  const context = vm.createContext({ figma: env.figma, __html__: '', console });
  for (const file of [
    'kit-identity.js',
    'code.js',
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
async function refuseBuild(env, call = env.call) {
  const baseline = complete(env);
  let error;
  try {
    await call('buildMangroveComponents', doc, 'undrr', selected);
  } catch (caught) {
    error = caught;
  }
  assert(error, 'Ordinary builder must refuse a partial migration');
  assert.match(String(error), /pending Organize/);
  assert.deepStrictEqual(
    complete(env),
    baseline,
    'Partial migration blocks ordinary writes'
  );
}
async function main() {
  // API support uses actual SECTION nodes, rather than a renamed FRAME fixture.
  {
    const env = environment(doc),
      section = env.figma.createSection();
    assert.strictEqual(section.type, 'SECTION');
    assert.strictEqual(section.parent, env.figma.currentPage);
    section.resizeWithoutConstraints(600, 300);
    const child = env.figma.createFrame();
    section.appendChild(child);
    assert.strictEqual(child.parent, section);
    assert.deepStrictEqual([section.width, section.height], [600, 300]);
    console.log('ok actual SECTION creation, resizing and parentage');
  }
  // Remaining tests deliberately use the actual source module, not a substitute
  // or compiled function slicing. Its absence is a test failure.
  const env = await fixture();
  assert.strictEqual(
    await env.runCode('return typeof organizeMangroveKit;'),
    'function'
  );
  {
    const sizes = [
      [40, 10],
      [90, 30],
      [30, 20],
      [200, 80],
      [50, 20],
      [70, 40],
      [20, 15],
      [110, 18],
    ];
    const variants = sizes.map(([width, height], index) => {
      const component = env.figma.createComponent();
      component.name = `Case=${index}`;
      component.resize(width, height);
      return component;
    });
    const grid = env.figma.combineAsVariants(variants, env.figma.currentPage);
    await env.call('mgLayoutGrid', grid);
    // Independent expected values: column maxima 200/110/70; row maxima
    // 30/80/18. A global largest-cell grid fails both axes of this fixture.
    assert.deepStrictEqual(
      variants.map(node => [node.x, node.y]),
      [
        [24, 24],
        [272, 24],
        [430, 24],
        [24, 102],
        [272, 102],
        [430, 102],
        [24, 230],
        [272, 230],
      ]
    );
    assert.deepStrictEqual([grid.width, grid.height], [524, 272]);
    assert.deepStrictEqual(
      variants.map(node => [node.width, node.height]),
      sizes
    );
    grid.remove();
    console.log(
      'ok independent per-row and per-column maxima, exact padding/gaps and bounds without canonical resizing'
    );
  }
  {
    const rendered = [0, 1, 2, 3, 4, 5].map(index => {
      const node = env.figma.createComponent();
      node.name = `Case=${index}`;
      node.resize(320, 36);
      const child = env.figma.createRectangle();
      node.appendChild(child);
      child.resize(20, 7);
      child.x = 8;
      child.y = 9;
      Object.defineProperties(node, {
        absoluteBoundingBox: {
          get: () => ({
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
          }),
        },
        absoluteRenderBounds: {
          get: () => ({
            x: node.x - 2,
            y: node.y - 32,
            width: node.width + 4,
            height: 100,
          }),
        },
      });
      return node;
    });
    const grid = env.figma.combineAsVariants(rendered, env.figma.currentPage);
    const internals = rendered.map(node => subtree(node).slice(1));
    for (let pass = 0; pass < 2; pass++) {
      await env.call('mgLayoutGrid', grid);
      assert.deepStrictEqual(
        rendered.map(node => [node.x, node.y]),
        [
          [26, 56],
          [398, 56],
          [770, 56],
          [26, 204],
          [398, 204],
          [770, 204],
        ]
      );
      assert.deepStrictEqual([grid.width, grid.height], [1116, 296]);
      assert.deepStrictEqual(
        rendered.map(node => [node.width, node.height]),
        rendered.map(() => [320, 36])
      );
      assert.deepStrictEqual(
        rendered.map(node => subtree(node).slice(1)),
        internals
      );
      for (const node of rendered) {
        const paint = node.absoluteRenderBounds;
        assert(
          paint.x >= 24 &&
            paint.y >= 24 &&
            paint.x + paint.width <= grid.width - 24 &&
            paint.y + paint.height <= grid.height - 24
        );
      }
    }
    grid.remove();
    console.log(
      'ok live relative rendered overhangs set grid row/column footprints and padding without changing component dimensions or descendants; rerun stable'
    );
  }
  {
    const section = env.figma.createSection();
    const named = [];
    for (const value of ['A', 'manual1', 'B', 'manual2', 'C']) {
      const node = env.figma.createFrame();
      section.appendChild(node);
      node.name = value;
      node.x = 23;
      node.y = 71;
      if (value.length === 1) {
        own(node, `layout/order/${value}`);
        named.push(node);
      }
    }
    const manual = section.children.filter(node =>
        node.name.startsWith('manual')
      ),
      baseline = manual.map(node => record(node));
    const inserted = [],
      insert = section.insertChild.bind(section);
    section.insertChild = (index, node) => {
      inserted.push(node.id);
      insert(index, node);
    };
    await env.call('mgLayoutLayerOrder', section, named);
    assert.deepStrictEqual(
      section.children.map(node => node.name),
      ['C', 'manual1', 'B', 'manual2', 'A']
    );
    assert.deepStrictEqual(
      manual.map(node => record(node)),
      baseline
    );
    assert(
      !inserted.some(id => manual.some(node => node.id === id)),
      'Only generated siblings are reordered'
    );
    const calls = inserted.length;
    await env.call('mgLayoutLayerOrder', section, named);
    assert.strictEqual(
      inserted.length,
      calls,
      'Stable Layers order does not move siblings again'
    );
    section.remove();
    console.log(
      'ok semantic Layers ordering reverses only generated siblings in their original slots, preserves manual local placement/fields and reruns without moves'
    );
  }
  {
    const forms = environment(doc);
    await importFoundation(forms, doc);
    const ids = doc.kitGuidance.groups.find(
      group => group.id === 'forms-selection'
    ).familyIds;
    const built = await forms.call(
      'buildMangroveComponents',
      doc,
      'undrr',
      ids
    );
    assert.deepStrictEqual(copy(built.errors), []);
    const canonicalBefore = originals(forms);
    const organized = await forms.call('organizeMangroveKit', doc, 'undrr');
    assert.deepStrictEqual(copy(organized.errors), []);
    const board = owned(forms, 'layout/group/forms-selection');
    const overviews = ids.map(id =>
      owned(forms, `layout/family/${id}/overview`)
    );
    assert.strictEqual(
      board.layoutMode,
      'NONE',
      'Reverse Layers ordering must not reverse an auto-layout visual flow'
    );
    assert.deepStrictEqual(
      [...board.children].reverse().map(node => key(node)),
      [
        'layout/group/forms-selection/title',
        ...ids.map(id => `layout/family/${id}/overview`),
      ]
    );
    for (let i = 0; i < overviews.length; i += 2) {
      const left = overviews[i],
        right = overviews[i + 1];
      assert.strictEqual(left.x, 24);
      if (right) {
        assert.strictEqual(left.y, right.y);
        assert(right.x - left.x - left.width >= 48);
      }
      if (overviews[i + 2])
        assert(
          overviews[i + 2].y >=
            left.y + Math.max(left.height, right?.height || 0) + 24
        );
    }
    const section = owned(forms, 'layout/components');
    assert.deepStrictEqual(
      [...section.children].reverse().map(node => key(node)),
      [
        'layout/components/intro',
        'layout/group/actions',
        'layout/group/forms-selection',
        'layout/group/content-data',
        'layout/group/navigation',
      ]
    );
    const input = owned(forms, 'layout/family/text-input/overview');
    assert.deepStrictEqual(
      [...input.children].reverse().map(node => key(node)),
      [
        'layout/family/text-input/overview/title',
        'layout/family/text-input/overview/body',
        'review/text-input',
        'layout/family/text-input/main',
      ]
    );
    for (const other of ['actions', 'content-data', 'navigation']) {
      const group = owned(forms, `layout/group/${other}`);
      const items = group.children.filter(node =>
        /\/overview$/.test(key(node))
      );
      assert(
        items.every(node => node.x === 24),
        'Only Forms gains two browsing columns'
      );
    }
    assertOriginals(forms, canonicalBefore);
    const layoutBefore = subtree(board),
      allIds = [...forms.state.nodes.keys()].sort();
    const rerun = await forms.call('organizeMangroveKit', doc, 'undrr');
    assert.deepStrictEqual(copy(rerun.errors), []);
    assert.strictEqual(rerun.createdNodeIds.length, 0);
    assert.deepStrictEqual(subtree(board), layoutBefore);
    assert.deepStrictEqual([...forms.state.nodes.keys()].sort(), allIds);
    assertOriginals(forms, canonicalBefore);
    console.log(
      'ok actual ten-family Forms use measured two-column rows and semantic Layers while other tasks remain single-column; all source identities/fields and zero-create rerun retained'
    );
  }
  const sourceBaseline = originals(env);
  const roots = new Map(
    ['main', 'review'].map(value => [value, owned(env, value).id])
  );
  const reviews = new Map(
    [...env.state.nodes.values()]
      .filter(node => /^review\/[^/]+$/.test(key(node)))
      .map(node => [key(node), node.id])
  );
  const consumer = owned(env, 'family/button').children[0].createInstance();
  env.figma.currentPage.appendChild(consumer);
  const labelKey = Object.keys(consumer.componentProperties).find(
    value => value.split('#')[0] === 'Label'
  );
  consumer.setProperties({ [labelKey]: 'Designer-owned linked action' });
  consumer.x = -390;
  consumer.y = 777;
  consumer.children.find(node => node.type === 'TEXT').textAlignHorizontal =
    'RIGHT';
  const manual = env.figma.createFrame();
  manual.name = 'Mangrove / Main components';
  manual.x = -700;
  manual.y = 111;
  manual.resize(317, 209);
  const consumerBaseline = subtree(consumer),
    manualBaseline = record(manual);
  const editedReview = [...env.state.nodes.values()].find(
    node =>
      node.type === 'INSTANCE' &&
      key(node).startsWith('review/button/specimen/')
  );
  const reviewLabelKey = Object.keys(editedReview.componentProperties).find(
    value => value.split('#')[0] === 'Label'
  );
  editedReview.setProperties({
    [reviewLabelKey]: 'Edited usage example retained',
  });
  const reviewBaseline = {
    id: editedReview.id,
    childIds: editedReview.findAll().map(node => node.id),
    mainId: editedReview.main.id,
    properties: copy(editedReview.componentProperties),
  };
  const result = await env.call('organizeMangroveKit', doc, 'undrr');
  assert.deepStrictEqual(copy(result?.errors || []), []);
  for (const section of [
    'start',
    'foundations',
    'components',
    'compositions',
    'patterns',
    'pending',
  ])
    assert.strictEqual(owned(env, `layout/${section}`).type, 'SECTION');
  assert(
    key(owned(env, 'layout/start'), 'mgLayoutVersion'),
    'Start section carries migration version'
  );
  for (const [value, id] of roots) {
    assert.strictEqual(owned(env, value).id, id);
    assert.strictEqual(key(owned(env, value).parent), 'layout/pending');
  }
  for (const [value, id] of reviews)
    assert.strictEqual(owned(env, value).id, id);
  for (const family of ['button', 'table', 'text-cta', 'tabs']) {
    const set = owned(env, `family/${family}`);
    assert.strictEqual(key(set.parent), `layout/family/${family}/main`);
  }
  assertOriginals(env, sourceBaseline);
  assert.deepStrictEqual(subtree(consumer), consumerBaseline);
  assert.deepStrictEqual(record(manual), manualBaseline);
  const sectionNote = env.figma.createFrame();
  sectionNote.name = 'Designer usage note';
  owned(env, 'layout/components').appendChild(sectionNote);
  sectionNote.x = -82;
  sectionNote.y = 397;
  sectionNote.resize(197, 63);
  sectionNote.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.3, b: 0.4 } }];
  const noteBaseline = record(sectionNote);
  const ids = [...env.state.nodes.keys()].sort();
  for (let pass = 0; pass < 2; pass++) {
    const repeated = await env.call(
      'buildMangroveComponents',
      doc,
      'undrr',
      selected
    );
    assert.deepStrictEqual(copy(repeated.errors), []);
    assert.strictEqual(repeated.layout.operation, 'kit-layout');
    assert.strictEqual(repeated.layout.migrated, false);
    assert.strictEqual(repeated.layout.createdNodeIds.length, 0);
    assert.strictEqual(repeated.createdNodeIds.length, 0);
    assert.deepStrictEqual(
      [...env.state.nodes.keys()].sort(),
      ids,
      'No duplicate presentation or canonical nodes'
    );
    assertOriginals(env, sourceBaseline);
    assert.deepStrictEqual(subtree(consumer), consumerBaseline);
    assert.deepStrictEqual(record(manual), manualBaseline);
    assert.deepStrictEqual(
      record(sectionNote),
      noteBaseline,
      'Section-local manual note must retain exact placement and fields'
    );
    assert.deepStrictEqual(
      {
        id: editedReview.id,
        childIds: editedReview.findAll().map(node => node.id),
        mainId: editedReview.main.id,
        properties: copy(editedReview.componentProperties),
      },
      reviewBaseline,
      'Generated review edits and main/property identities survive'
    );
    assert.strictEqual(owned(env, 'main').id, roots.get('main'));
    assert.strictEqual(owned(env, 'review').id, roots.get('review'));
  }
  console.log(
    'ok actual source migration and two ordinary repeats preserve canonical/property IDs, unadopted overrides, manual assets and section-local notes'
  );
  {
    const catalogueKey = 'layout/compositions/catalogue';
    const catalogue = owned(env, catalogueKey);
    assert.strictEqual(catalogue.type, 'FRAME');
    assert.strictEqual(key(catalogue.parent), 'layout/compositions');
    assert(
      catalogue.findAll().every(node => ['FRAME', 'TEXT'].includes(node.type)),
      'Planned documentation must not create fake Assets masters, variants or instances'
    );
    const rows = catalogue.children.filter(node =>
      key(node).startsWith(`${catalogueKey}/entry/`)
    );
    assert.strictEqual(rows.length, doc.plannedInventory.entries.length);
    assert.strictEqual(
      rows.length,
      doc.plannedInventory.counts.includedStoryFiles
    );
    assert.strictEqual(
      owned(env, `${catalogueKey}/body`).characters.startsWith(
        `${rows.length} source catalogue entries.`
      ),
      true
    );
    for (const entry of doc.plannedInventory.entries) {
      const rowKey = `${catalogueKey}/entry/${entry.id}`;
      const row = owned(env, rowKey);
      assert.strictEqual(row.type, 'FRAME');
      assert.strictEqual(key(row.parent), catalogueKey);
      assert.strictEqual(row.children.length, 2);
      assert(row.children.every(node => node.type === 'TEXT'));
      assert.strictEqual(
        row.name,
        `${entry.scaffoldFamilyIds.length ? 'Partial scaffold' : 'Not yet implemented'} / ${entry.label}`
      );
      const title = owned(env, `${rowKey}/title`).characters;
      assert(title.startsWith(`${entry.label} · `));
      const body = owned(env, `${rowKey}/body`).characters;
      assert(body.includes(entry.catalogueTitle));
      assert(body.includes(entry.source));
      assert(body.includes('Source examples still to map or verify:'));
      for (const example of entry.remainingExamples.slice(0, 6))
        assert(body.includes(example.label));
      if (entry.remainingExamples.length > 6)
        assert(
          body.includes(`plus ${entry.remainingExamples.length - 6} more`)
        );
      if (entry.scaffoldFamilyIds.length)
        assert(
          body.includes(
            `Related families: ${entry.scaffoldFamilyIds.join(', ')}.`
          )
        );
    }
    const before = subtree(catalogue);
    const savedIds = [...env.state.nodes.keys()].sort();
    const restarted = await restart(env)(
      'buildMangroveComponents',
      doc,
      'undrr',
      selected
    );
    assert.deepStrictEqual(copy(restarted.errors), []);
    assert.strictEqual(restarted.createdNodeIds.length, 0);
    assert.strictEqual(restarted.layout.createdNodeIds.length, 0);
    assert.deepStrictEqual(subtree(catalogue), before);
    assert.deepStrictEqual([...env.state.nodes.keys()].sort(), savedIds);
    console.log(
      'ok actual planned catalogue uses source-counted keyed FRAME/TEXT rows only, truthful source/example labels and exact zero-create ordinary restart identities'
    );
  }
  for (const owner of [
    'layout/compositions/catalogue',
    `layout/compositions/catalogue/entry/${doc.plannedInventory.entries[0].id}`,
  ]) {
    const invalid = await fixture();
    await invalid.call('organizeMangroveKit', doc, 'undrr');
    const note = invalid.figma.createText();
    note.characters = 'Designer-owned catalogue note';
    owned(invalid, owner).appendChild(note);
    note.x = 73;
    note.y = 41;
    await refuse(invalid, doc, `manual content inside ${owner}`);
  }
  console.log(
    'ok manual content in generated planned catalogue or source row causes mutation-free refusal rather than adoption/deletion'
  );
  {
    const scaffoldIds = [
      'card-vertical',
      'card-horizontal',
      'hero-background',
      'hero-split',
    ];
    const scaffold = environment(doc);
    await importFoundation(scaffold, doc);
    const built = await scaffold.call(
      'buildMangroveComponents',
      doc,
      'undrr',
      scaffoldIds
    );
    assert.deepStrictEqual(copy(built.errors), []);
    const canonicalBefore = originals(scaffold);
    const organized = await scaffold.call('organizeMangroveKit', doc, 'undrr');
    assert.deepStrictEqual(copy(organized.errors), []);
    assert.strictEqual(doc.kitGuidance.scope.coreFamilyCount, 25);
    assert.strictEqual(doc.kitGuidance.scope.scaffoldFamilyCount, 4);
    const browsing = doc.kitGuidance.groups.find(
      group => group.id === 'content-data'
    );
    for (const id of scaffoldIds) {
      const meta = doc.kitGuidance.families.find(item => item.id === id);
      assert.strictEqual(meta.status, 'source-scaffold');
      assert.strictEqual(meta.groupId, 'content-data');
      const overview = owned(scaffold, `layout/family/${id}/overview`);
      assert(
        owned(
          scaffold,
          `layout/family/${id}/overview/body`
        ).characters.startsWith('New source scaffold, acceptance pending\n')
      );
      if (meta.kind === 'primary') {
        assert(browsing.familyIds.includes(id));
        assert.strictEqual(key(overview.parent), 'layout/group/content-data');
      } else {
        assert(!browsing.familyIds.includes(id));
        assert.strictEqual(
          key(overview.parent),
          `layout/family/${meta.parentFamilyId}/advanced`
        );
      }
      assert.strictEqual(
        key(owned(scaffold, `family/${id}`).parent),
        `layout/family/${id}/main`
      );
    }
    assertOriginals(scaffold, canonicalBefore);
    const savedIds = [...scaffold.state.nodes.keys()].sort();
    const repeated = await scaffold.call(
      'buildMangroveComponents',
      doc,
      'undrr',
      scaffoldIds
    );
    assert.deepStrictEqual(copy(repeated.errors), []);
    assert.strictEqual(repeated.createdNodeIds.length, 0);
    assert.deepStrictEqual([...scaffold.state.nodes.keys()].sort(), savedIds);
    console.log(
      'ok four actual Card/Hero source scaffolds retain acceptance-pending status outside the25-family core and browse in Content and data with advanced orientation/layout alternatives'
    );
  }
  {
    // A bounded synthetic recipe delta uses an existing valid semantic role.
    // This checks dependency identities and explicit master paint application;
    // native nested-instance propagation remains a separate visual gate.
    const changed = copy(doc);
    const body = changed.components.families.find(
      family => family.id === 'table-body-cell'
    );
    for (const variant of body.variants)
      variant.tree.children[0].fill = 'color/interactive';
    const labels = [...env.state.nodes.values()].filter(
      node =>
        canonical(node) &&
        node.type === 'TEXT' &&
        key(node).startsWith('family/table-body-cell/')
    );
    assert.strictEqual(labels.length, 4);
    const invariants = originals(env);
    for (const label of labels) {
      const baseline = invariants.get(label.id);
      delete baseline.fills;
      delete baseline.boundVariables.textRangeFills;
    }
    const updated = await env.call(
      'buildMangroveComponents',
      changed,
      'undrr',
      ['table']
    );
    assert.deepStrictEqual(copy(updated.errors), []);
    assert.strictEqual(updated.createdNodeIds.length, 0);
    const interactive = env.state.variables.find(
      variable => variable.name === 'color/interactive'
    );
    for (const label of labels) {
      assert.strictEqual(
        label.fills[0].boundVariables.color.id,
        interactive.id
      );
      assert.strictEqual(
        label.getRangeFills(0, label.characters.length)[0].boundVariables.color
          .id,
        interactive.id
      );
    }
    const after = originals(env);
    for (const label of labels) {
      delete after.get(label.id).fills;
      delete after.get(label.id).boundVariables.textRangeFills;
    }
    assert.deepStrictEqual(
      after,
      invariants,
      'Only declared cell paints change; Row/Table main links, property IDs and all other canonical fields survive'
    );
    assert.deepStrictEqual([...env.state.nodes.keys()].sort(), ids);
    assert.deepStrictEqual(subtree(consumer), consumerBaseline);
    assert.deepStrictEqual(record(sectionNote), noteBaseline);
    console.log(
      'ok bounded recipe paint update reaches existing Cell masters and retains dependent Row/Table links and unrelated/manual identities'
    );
  }

  {
    const root = owned(env, 'layout/components');
    assert.strictEqual(
      key(owned(env, 'layout/group/actions').parent),
      'layout/components'
    );
    assert.strictEqual(
      key(owned(env, 'layout/family/button/overview').parent),
      'layout/group/actions'
    );
    assert.strictEqual(
      key(owned(env, 'layout/family/table/overview').parent),
      'layout/group/content-data'
    );
    assert.strictEqual(
      key(owned(env, 'review/table').parent),
      'layout/family/table/overview'
    );
    for (const support of [
      'table-header-cell',
      'table-body-cell',
      'table-row',
    ]) {
      assert.strictEqual(
        key(owned(env, `layout/family/${support}/overview`).parent),
        'layout/family/table/advanced'
      );
      const supportReviews = [...env.state.nodes.values()].filter(
        node => key(node) === `review/${support}`
      );
      if (supportReviews.length)
        assert.strictEqual(
          key(supportReviews[0].parent),
          `layout/family/${support}/overview`
        );
    }
    assert.strictEqual(
      key(owned(env, 'layout/family/tabs/overview').parent),
      'layout/pending/browse'
    );
    assert.strictEqual(
      key(owned(env, 'layout/family/tabs-trigger/overview').parent),
      'layout/family/tabs/advanced'
    );
    assert.strictEqual(root.name, '02 Components');
    assert.strictEqual(
      owned(env, 'layout/compositions').name,
      '03 Examples and templates'
    );
    assert.strictEqual(owned(env, 'layout/patterns').name, '04 Your workspace');
    assert.strictEqual(owned(env, 'layout/pending').name, '90 Maintenance');
    assert(owned(env, 'layout/components').y > owned(env, 'layout/start').y);
    assert.strictEqual(
      owned(env, 'layout/compositions').y,
      owned(env, 'layout/patterns').y
    );
    console.log(
      'ok v2 complete-family browsing, local usage/source pairing, nested advanced parts and two-dimensional section reading order'
    );
  }
  {
    const legacy = await version1Fixture();
    const before = originals(legacy),
      rootIds = ['main', 'review'].map(id => owned(legacy, id).id);
    const oldContainers = [
      'layout/compositions/main',
      'layout/compositions/review',
      'layout/pending/main',
      'layout/pending/review',
    ].map(id => owned(legacy, id));
    const note = legacy.figma.createFrame();
    note.x = 37;
    note.y = 95;
    note.resize(71, 29);
    oldContainers[0].appendChild(note);
    const manualBefore = record(note);
    const ids = [...legacy.state.nodes.keys()];
    const ordinaryBefore = complete(legacy);
    let ordinaryError;
    try {
      await legacy.call('buildMangroveComponents', doc, 'undrr', ['button']);
    } catch (error) {
      ordinaryError = error;
    }
    assert.match(String(ordinaryError), /Organize file explicitly/);
    assert.deepStrictEqual(
      complete(legacy),
      ordinaryBefore,
      'Version1 ordinary builds must not silently upgrade'
    );
    const migrated = await legacy.call('organizeMangroveKit', doc, 'undrr');
    assert.deepStrictEqual(copy(migrated.errors), []);
    assert.strictEqual(migrated.previousVersion, '1');
    assert.strictEqual(migrated.version, '2');
    for (const id of ids)
      assert(
        legacy.state.nodes.has(id),
        'Explicit v1 migration retains every old identity'
      );
    for (const container of oldContainers)
      assert.strictEqual(key(container.parent), 'layout/pending');
    assert.deepStrictEqual(
      record(note),
      manualBefore,
      'Mixed historical container contents remain exact'
    );
    assert.deepStrictEqual(
      ['main', 'review'].map(id => owned(legacy, id).id),
      rootIds
    );
    assertOriginals(legacy, before);
    const rerun = await restart(legacy)('organizeMangroveKit', doc, 'undrr');
    assert.deepStrictEqual(copy(rerun.errors), []);
    assert.strictEqual(rerun.createdNodeIds.length, 0);
    console.log(
      'ok explicit v1-to-v2 migration preserves old section/staging/wrapper/canonical identities and mixed manual historical containers; ordinary v1 build refuses'
    );
  }
  {
    const added = await fixture();
    await added.call('organizeMangroveKit', doc, 'undrr');
    const before = originals(added);
    const rootIds = ['main', 'review'].map(id => owned(added, id).id);
    const result = await added.call('buildMangroveComponents', doc, 'undrr', [
      'status-label',
    ]);
    assert.deepStrictEqual(copy(result.errors), []);
    assert.strictEqual(
      key(owned(added, 'family/status-label').parent),
      'layout/family/status-label/main'
    );
    assert.strictEqual(
      key(owned(added, 'review/status-label').parent),
      'layout/family/status-label/overview'
    );
    assert.deepStrictEqual(
      ['main', 'review'].map(id => owned(added, id).id),
      rootIds
    );
    assertOriginals(added, before);
    const rerun = await added.call('buildMangroveComponents', doc, 'undrr', [
      'status-label',
    ]);
    assert.deepStrictEqual(copy(rerun.errors), []);
    assert.strictEqual(rerun.createdNodeIds.length, 0);
    console.log(
      'ok new v2 families stage once then adopt task grouping while existing canonical parents and IDs survive'
    );
  }
  for (const fault of [
    'missing-guidance',
    'bad-support',
    'bad-group',
    'wrong-status',
  ]) {
    const invalid = await fixture(),
      document = copy(doc);
    if (fault === 'missing-guidance') delete document.kitGuidance;
    if (fault === 'bad-support')
      document.kitGuidance.families.find(
        meta => meta.id === 'table-row'
      ).parentFamilyId = 'button';
    if (fault === 'bad-group')
      document.kitGuidance.groups[0].familyIds.push('table-row');
    if (fault === 'wrong-status')
      document.kitGuidance.families[0].status = 'ready';
    await refuse(invalid, document, fault);
  }
  console.log(
    'ok incomplete or inconsistent guidance refuses before mutations without invented readiness'
  );
  {
    const invalid = await fixture();
    await invalid.call('organizeMangroveKit', doc, 'undrr');
    owned(invalid, 'layout/group/actions').appendChild(
      invalid.figma.createFrame()
    );
    await refuse(invalid, doc, 'manual content inside generated task group');
    console.log(
      'ok generated task boards refuse foreign content before updates rather than adopting or deleting it'
    );
  }

  {
    const invalid = await fixture();
    const variable = invalid.state.variables.find(
      value => value.name === 'color/text'
    );
    variable.resolvedType = 'FLOAT';
    await refuse(invalid, doc, 'wrong foundation colour type');
    const alias = await fixture();
    alias.state.variables.find(
      value => value.name === 'color/interactive'
    ).resolveForConsumer = () => ({ value: { r: NaN, g: 0, b: 0 } });
    await refuse(alias, doc, 'invalid resolved foundation alias value');
    console.log(
      'ok typed and resolved foundation roles refuse before writes rather than seeding invalid specimen paints'
    );
  }

  for (const fault of [
    'manual-main',
    'manual-review',
    'duplicate-main',
    'wrong-main',
    'unknown-family',
    'partial-document',
    'inherited-instance-main',
    'live-probe',
    'singular-capability',
    'acceptance-root',
  ]) {
    const invalid = await fixture();
    let document = doc;
    if (fault.startsWith('manual-'))
      owned(invalid, fault.slice(7)).appendChild(invalid.figma.createFrame());
    if (fault === 'duplicate-main') own(invalid.figma.createFrame(), 'main');
    if (fault === 'wrong-main') owned(invalid, 'main').type = 'SECTION';
    if (fault === 'unknown-family')
      own(invalid.figma.createComponent(), 'family/unmapped/variant/unknown');
    if (fault === 'inherited-instance-main')
      owned(invalid, 'main').appendChild(
        owned(invalid, 'family/button').children[0].createInstance()
      );
    if (fault === 'live-probe') {
      const probe = invalid.figma.createFrame();
      const nested = invalid.figma.createFrame();
      probe.appendChild(nested);
      nested.setSharedPluginData(
        'orgundrrmangrove',
        'mgCapabilityProbeId',
        'private-owned-check'
      );
    }
    if (fault === 'singular-capability')
      own(invalid.figma.createFrame(), 'capability/fixture');
    if (fault === 'acceptance-root')
      own(invalid.figma.createFrame(), 'acceptance/fixture');
    if (fault === 'partial-document') {
      document = copy(doc);
      document.components.families = document.components.families.filter(
        family => family.id === 'button'
      );
    }
    await refuse(invalid, document, fault);
  }
  console.log(
    'ok legacy manual content, conflicting ownership/types, unknown families and partial migration input refuse before writes'
  );
  for (const fault of [
    'duplicate-section',
    'wrong-section',
    'unknown-version',
  ]) {
    const invalid = await fixture();
    await invalid.call('organizeMangroveKit', doc, 'undrr');
    if (fault === 'duplicate-section')
      own(invalid.figma.createSection(), 'layout/components');
    if (fault === 'wrong-section')
      owned(invalid, 'layout/components').type = 'FRAME';
    if (fault === 'unknown-version')
      owned(invalid, 'layout/start').setSharedPluginData(
        'orgundrrmangrove',
        'mgLayoutVersion',
        '999'
      );
    await refuse(invalid, doc, fault);
  }
  console.log(
    'ok existing layout duplicate/type/version conflicts refuse before writes'
  );
  {
    const pending = await fixture();
    const faces = owned(pending, 'family/tabs-trigger')
      .findAll(node => node.type === 'TEXT')
      .map(node => `${node.fontName.family} ${node.fontName.style}`);
    assert(
      faces.includes('Roboto Condensed Bold'),
      'Actual pending canonical Tabs must exercise the unavailable source face'
    );
    assert(
      owned(pending, 'review/tabs')
        .findAll(node => node.type === 'TEXT')
        .some(
          node =>
            `${node.fontName.family} ${node.fontName.style}` ===
            'Roboto Condensed Bold'
        ),
      'Existing review instances retain the same exact pending face'
    );
    pending.state.rejectedFonts.add('Roboto Condensed Bold');
    pending.state.loadedFonts.delete('Roboto Condensed Bold');
    const button = await pending.call('buildMangroveComponents', doc, 'undrr', [
      'button',
    ]);
    assert.deepStrictEqual(copy(button.errors), []);
    assert.strictEqual(button.createdNodeIds.length, 0);
    await refuse(pending, doc, 'unavailable unselected pending subtree font');
    console.log(
      'ok unavailable existing pending canonical/review face blocks organisation before writes while selected Roboto updates remain usable'
    );
  }
  {
    const invalid = await fixture();
    await invalid.call(
      'importVariables',
      doc,
      ['undrr'],
      false,
      ['text.heading.400.regular'],
      false
    );
    const style = invalid.state.styles.find(
      item => key(item, 'mgStyleId') === 'text.heading.400.regular'
    );
    assert(
      style,
      'Selected foundation style must exist in the actual imported fixture'
    );
    invalid.state.rejectedFonts.add(
      `${style.fontName.family} ${style.fontName.style}`
    );
    await refuse(invalid, doc, 'unavailable selected foundation font');
    const modeFixture = await fixture();
    modeFixture.state.modeLimit = 2;
    modeFixture.state.collections[0].addMode(
      doc.modes.find(mode => mode.id === 'delta').name
    );
    await refuse(modeFixture, doc, 'presentation-only brand change', 'delta');
    console.log(
      'ok selected foundation font and brand change refuse before migration writes'
    );
  }
  for (const failurePoint of ['missing-sections', 'mixed-family-parents']) {
    const partial = await fixture();
    const canonicalBaseline = originals(partial);
    const oldIds = [...partial.state.nodes.keys()];
    const note = partial.figma.createFrame();
    note.x = -317;
    note.y = 529;
    note.resize(93, 57);
    const manualBaseline = record(note);
    const beforeFailureIds = new Set(partial.state.nodes.keys());
    let restore;
    if (failurePoint === 'missing-sections') {
      const create = partial.figma.createSection;
      let calls = 0;
      partial.figma.createSection = () => {
        if (++calls === 3) throw new Error('Injected section creation failure');
        return create();
      };
      restore = () => {
        partial.figma.createSection = create;
      };
    } else {
      const prototype = Object.getPrototypeOf(note),
        append = prototype.appendChild;
      prototype.appendChild = function (child) {
        if (
          key(this) === 'layout/family/table/main' &&
          key(child) === 'family/table'
        )
          throw new Error('Injected family reparenting failure');
        append.call(this, child);
      };
      restore = () => {
        prototype.appendChild = append;
      };
    }
    let failed;
    try {
      failed = await partial.call('organizeMangroveKit', doc, 'undrr');
    } finally {
      restore();
    }
    assert.strictEqual(failed.phase, 'migrating');
    assert.strictEqual(failed.errors.length, 1);
    assert.match(failed.errors[0], /Injected/);
    const start = owned(partial, 'layout/start');
    assert.strictEqual(key(start, 'mgLayoutVersion'), '2');
    assert.strictEqual(key(start, 'mgLayoutPhase'), 'migrating');
    assert(failed.createdNodeIds.includes(start.id));
    assert.deepStrictEqual(
      [...partial.state.nodes.keys()]
        .filter(id => !beforeFailureIds.has(id))
        .sort(),
      [...failed.createdNodeIds].sort(),
      'Partial report records every newly created node exactly'
    );
    for (const id of failed.updatedNodeIds)
      assert(
        beforeFailureIds.has(id),
        'Updated affected IDs existed before the operation'
      );
    for (const id of failed.createdNodeIds)
      assert(
        partial.state.nodes.has(id),
        'Partial affected IDs are recoverable'
      );
    assertOriginals(partial, canonicalBaseline);
    assert.deepStrictEqual(record(note), manualBaseline);
    if (failurePoint === 'missing-sections')
      assert.strictEqual(
        partial.figma.currentPage.findAll(node => node.type === 'SECTION')
          .length,
        2
      );
    else {
      assert.strictEqual(
        key(owned(partial, 'family/button').parent),
        'layout/family/button/main'
      );
      assert.strictEqual(key(owned(partial, 'family/table').parent), 'main');
    }
    await refuseBuild(partial);
    const persistedIds = [...partial.state.nodes.keys()];
    const resumed = restart(partial);
    await refuseBuild(partial, resumed);
    const recovered = await resumed('organizeMangroveKit', doc, 'undrr');
    assert.deepStrictEqual(copy(recovered.errors), []);
    assert.strictEqual(recovered.migrated, true);
    assert.strictEqual(key(start, 'mgLayoutPhase'), 'complete');
    for (const id of [...oldIds, ...persistedIds])
      assert(partial.state.nodes.has(id), 'Retry preserves all prior IDs');
    assertOriginals(partial, canonicalBaseline);
    assert.deepStrictEqual(record(note), manualBaseline);
    const completedIds = [...partial.state.nodes.keys()].sort();
    const repeated = await resumed('organizeMangroveKit', doc, 'undrr');
    assert.deepStrictEqual(copy(repeated.errors), []);
    assert.strictEqual(repeated.createdNodeIds.length, 0);
    assert.deepStrictEqual(
      [...partial.state.nodes.keys()].sort(),
      completedIds
    );
  }
  console.log(
    'ok early and mixed-parent failures persist affected IDs, block ordinary writes and retry after fresh plugin globals without duplication'
  );
  {
    const live = await fixture();
    await live.call('organizeMangroveKit', doc, 'undrr');
    const root = live.figma.createFrame();
    own(root, 'capability/live-layout-regression');
    root.setSharedPluginData(
      'orgundrrmangrove',
      'mgCapabilityProbeId',
      'live-root'
    );
    root.x = -590;
    root.y = 418;
    const master = owned(live, 'family/button').children[0];
    for (const label of [
      'Edited live capability action',
      'Fresh live capability action',
    ]) {
      const instance = master.createInstance();
      root.appendChild(instance);
      instance.setSharedPluginData(
        'orgundrrmangrove',
        'mgCapabilityProbeId',
        label
      );
      const property = Object.keys(instance.componentProperties).find(
        value => value.split('#')[0] === 'Label'
      );
      instance.setProperties({ [property]: label });
      instance.resize(240, instance.height);
      instance.children.find(node => node.type === 'TEXT').textAlignHorizontal =
        'RIGHT';
    }
    const baseline = subtree(root),
      ids = [...live.state.nodes.keys()].sort();
    const repeated = await live.call('buildMangroveComponents', doc, 'undrr', [
      'button',
    ]);
    assert.deepStrictEqual(copy(repeated.errors), []);
    assert.strictEqual(repeated.createdNodeIds.length, 0);
    assert.strictEqual(repeated.layout.migrated, false);
    assert.deepStrictEqual([...live.state.nodes.keys()].sort(), ids);
    assert.deepStrictEqual(
      subtree(root),
      baseline,
      'Ordinary reconciliation must not adopt or change live probe consumers'
    );
    for (const node of [root, ...root.findAll()])
      assert(
        !repeated.updatedNodeIds.includes(node.id),
        'Live probe IDs remain outside managed updates'
      );
    await refuse(
      live,
      doc,
      'explicit organisation with live capability consumers'
    );
    console.log(
      'ok ordinary organized build preserves live capability consumers while explicit organisation refuses before writes'
    );
  }
  {
    const legacy = await fixture();
    const main = owned(legacy, 'main'),
      review = owned(legacy, 'review');
    main.x = 160;
    const table = owned(legacy, 'family/table');
    table.x = 260;
    const directExtent = Math.max(
      ...main.children.map(child => child.x + child.width + main.paddingRight)
    );
    assert(
      directExtent > main.width,
      'Actual Table fixture must extend past nominal Main width'
    );
    main.absoluteRenderBounds = {
      x: main.x - 20,
      y: main.y,
      width: directExtent + 400,
      height: main.height,
    };
    const mainBefore = subtree(main),
      styleBefore = copy(legacy.state.styles);
    const localReview = subtree(review).slice(1);
    const first = await legacy.call('mgLayoutLegacySpacing', main, review);
    assert.deepStrictEqual(copy(first), {
      changed: true,
      mainExtent: directExtent + 380,
      gap: 80,
    });
    assert.strictEqual(review.x, main.x + directExtent + 380 + 80);
    assert.deepStrictEqual(
      subtree(main),
      mainBefore,
      'Spacing must not resize Main or its canonical children'
    );
    assert.deepStrictEqual(
      subtree(review).slice(1),
      localReview,
      'Review-local content and placement stay exact'
    );
    // A smaller render getter must still respect direct-child overflow.
    main.absoluteRenderBounds.width = 400;
    const second = await legacy.call('mgLayoutLegacySpacing', main, review);
    assert.strictEqual(second.mainExtent, directExtent);
    assert.strictEqual(review.x, main.x + directExtent + 80);
    const expectedReview = record(review);
    const ids = [...legacy.state.nodes.keys()].sort();
    for (let pass = 0; pass < 2; pass++) {
      const built = await legacy.call('buildMangroveComponents', doc, 'undrr', [
        'button',
      ]);
      assert.deepStrictEqual(copy(built.errors), []);
      assert.strictEqual(built.createdNodeIds.length, 0);
      assert.strictEqual(built.presentation.mainExtent, directExtent);
      assert.strictEqual(built.presentation.changed, false);
      assert.deepStrictEqual(subtree(main), mainBefore);
      assert.deepStrictEqual(record(review), expectedReview);
      assert.deepStrictEqual(subtree(review).slice(1), localReview);
      assert.deepStrictEqual(copy(legacy.state.styles), styleBefore);
      assert.deepStrictEqual([...legacy.state.nodes.keys()].sort(), ids);
    }
    console.log(
      'ok legacy Review clears divergent render/direct-child extents by80 without resizing Main, changing source fonts/styles or moving Review-local content; two ordinary repeats create zero nodes'
    );
  }
  {
    const organized = await fixture();
    await organized.call('organizeMangroveKit', doc, 'undrr');
    organized.state.rejectedFonts.add('Roboto Condensed Bold');
    organized.state.loadedFonts.delete('Roboto Condensed Bold');
    const baseline = complete(organized);
    let error;
    try {
      await organized.call('buildMangroveComponents', doc, 'undrr', ['button']);
    } catch (caught) {
      error = caught;
    }
    assert.match(String(error), /Unavailable font Roboto Condensed Bold/);
    assert.deepStrictEqual(
      complete(organized),
      baseline,
      'Organized update must load all managed fonts before any write'
    );
    organized.state.rejectedFonts.clear();
    const section = owned(organized, 'layout/foundations');
    const resize = section.resizeWithoutConstraints;
    section.resizeWithoutConstraints = () => {
      throw new Error('Injected organised section bounds failure');
    };
    let failed;
    try {
      failed = await organized.call('buildMangroveComponents', doc, 'undrr', [
        'button',
      ]);
    } finally {
      section.resizeWithoutConstraints = resize;
    }
    assert.strictEqual(failed.layout.phase, 'migrating');
    assert.strictEqual(failed.layout.errors.length, 1);
    assert.strictEqual(failed.errors.length, 1);
    assert.match(
      failed.errors[0],
      /Kit layout:.*Injected organised section bounds failure/
    );
    console.log(
      'ok organized updates reject unavailable managed fonts before writes and propagate actual partial layout errors'
    );
  }
  {
    const tables = await fixture();
    const set = owned(tables, 'family/table');
    const family = doc.components.families.find(item => item.id === 'table');
    const canonicalBefore = originals(tables);
    const shapes = set.children.map(node => [node.id, node.width, node.height]);
    // The mock intentionally does not calculate native HUG heights. Its eight
    // actual builder nodes are100px high, so the three rows total444px, rather
    // than the separately observed native1632.703125px.
    await tables.call('mgLayoutGrid', set, family);
    assert.deepStrictEqual(
      set.children.map(node => [node.x, node.y]),
      [
        [24, 24],
        [392, 24],
        [760, 24],
        [24, 172],
        [392, 172],
        [760, 172],
        [24, 320],
        [792, 320],
      ]
    );
    assert.deepStrictEqual([set.width, set.height], [1108.703125, 444]);
    for (const indices of [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7],
    ])
      for (let i = 1; i < indices.length; i++) {
        const left = set.children[indices[i - 1]],
          right = set.children[indices[i]];
        assert.strictEqual(right.x - left.x - left.width, 48);
      }
    const fallbackPositions = [
      [24, 24],
      [792, 24],
      [1160, 24],
      [24, 172],
      [792, 172],
      [1160, 172],
      [24, 320],
      [792, 320],
    ];
    for (const unsupported of [
      undefined,
      { ...family, id: 'unknown-source-family' },
      { ...family, variants: family.variants.slice(0, 7) },
    ]) {
      await tables.call('mgLayoutGrid', set, unsupported);
      assert.deepStrictEqual(
        set.children.map(node => [node.x, node.y]),
        fallbackPositions,
        'Missing/unknown recipe identity must use the stable column-max fallback, not parse display names'
      );
      assert.deepStrictEqual([set.width, set.height], [1504, 444]);
      assert.deepStrictEqual(
        set.children.map(node => [node.id, node.width, node.height]),
        shapes
      );
    }
    assertOriginals(tables, canonicalBefore);
    const focus = [];
    tables.figma.viewport.scrollAndZoomIntoView = nodes =>
      focus.push(copy(nodes.map(node => key(node))));
    const built = await tables.call('buildMangroveComponents', doc, 'undrr', [
      'table',
    ]);
    assert.deepStrictEqual(copy(built.errors), []);
    assert.strictEqual(built.createdNodeIds.length, 0);
    assert.deepStrictEqual(focus.at(-1), ['family/table']);
    await tables.call('organizeMangroveKit', doc, 'undrr');
    const repeated = await tables.call(
      'buildMangroveComponents',
      doc,
      'undrr',
      ['table']
    );
    assert.deepStrictEqual(copy(repeated.errors), []);
    assert.strictEqual(repeated.createdNodeIds.length, 0);
    assert.deepStrictEqual(focus.at(-1), ['layout/family/table/main']);
    console.log(
      'ok actual Table short and Story rows have48px horizontal gaps, stable unmatched-recipe fallback, unchanged source geometry and requested-family viewport focus'
    );
  }
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { main };
