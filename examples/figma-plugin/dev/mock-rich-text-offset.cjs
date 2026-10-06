#!/usr/bin/env node
/** Ranged underline source fields and ownership, no glyph or raster simulation. */
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path');
const {
  document,
  rangeEnvironment,
} = require('./mock-rich-text-integration.cjs');
const {
  buildConnector,
} = require('../../../scripts/build-figma-connector.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const key = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function fixture(offset = { unit: 'PIXELS', value: 2.4 }) {
  const d = document();
  for (const r of d.components.families[0].variants[0].tree.children[0]
    .textRuns)
    if (r.textDecoration === 'UNDERLINE') r.textDecorationOffset = copy(offset);
  return d;
}
const snapshot = env =>
  JSON.stringify({
    styles: env.state.styles,
    variables: env.state.variables,
    nodes: [...env.state.nodes.values()].map(n => ({
      id: n.id,
      parent: n.parent?.id,
      type: n.type,
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
      characters: n.type === 'TEXT' ? n.characters : undefined,
      ledger: n.getSharedPluginData('orgundrrmangrove', 'mgRichTextRunsV1'),
      segments:
        n.type === 'TEXT'
          ? n.getStyledTextSegments([
              'textStyleId',
              'fontName',
              'fills',
              'hyperlink',
              'textDecoration',
              'textDecorationOffset',
            ])
          : undefined,
    })),
  });
async function setup(doc, brand) {
  const env = await rangeEnvironment(doc, { richDecorationOffsets: true });
  const imported = await env.call(
    'importVariables',
    doc,
    [brand],
    false,
    [],
    false
  );
  assert.deepStrictEqual(copy(imported.errors), []);
  const run = d =>
    env.call('buildMangroveComponents', d || doc, brand, ['rich-test'], {
      refreshReview: false,
    });
  return { env, run };
}
async function main() {
  for (const brand of document().modes.map(m => m.id)) {
    const d = fixture(),
      { env, run } = await setup(d, brand),
      first = await run();
    assert.deepStrictEqual(copy(first.errors), []);
    const node = [...env.state.nodes.values()].find(
      n =>
        n.type === 'TEXT' &&
        key(n) === 'family/rich-test/variant/rich-test.default/body'
    );
    assert(node);
    const link =
      d.components.families[0].variants[0].tree.children[0].textRuns.find(
        r => r.hyperlink
      );
    assert.deepStrictEqual(
      copy(node.getRangeTextDecorationOffset(link.start, link.end)),
      { unit: 'PIXELS', value: Math.fround(2.4) }
    );
    // A nearby unquantized double is not accepted as a native FLOAT32 field.
    const getSegments = node.getStyledTextSegments;
    node.getStyledTextSegments = function (fields) {
      const observed = getSegments.call(this, fields);
      for (const segment of observed)
        if (segment.textDecoration === 'UNDERLINE')
          segment.textDecorationOffset = { unit: 'PIXELS', value: 2.4 };
      return observed;
    };
    const invalidPrecision = snapshot(env),
      badPrecision = await run();
    assert(badPrecision.errors.some(e => /offset precision/.test(e)));
    assert.equal(snapshot(env), invalidPrecision);
    node.getStyledTextSegments = getSegments;
    const baseline = snapshot(env);
    for (let i = 0; i < 2; i++) {
      const r = await run();
      assert.deepStrictEqual(copy(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      assert.equal(snapshot(env), baseline);
    }
    const loadFont = env.figma.loadFontAsync;
    let afterAwaitState;
    env.figma.loadFontAsync = async font => {
      await loadFont(font);
      if (!afterAwaitState) {
        node.setRangeTextDecorationOffset(link.start, link.end, {
          unit: 'PIXELS',
          value: 3,
        });
        afterAwaitState = snapshot(env);
      }
    };
    const changedDuringAwait = await run();
    assert(
      afterAwaitState &&
        changedDuringAwait.errors.some(e =>
          /target changed during preflight|ownership/.test(e)
        )
    );
    assert.equal(
      snapshot(env),
      afterAwaitState,
      'Late drift must not permit permanent builder writes'
    );
    env.figma.loadFontAsync = loadFont;
    node.setRangeTextDecorationOffset(link.start, link.end, {
      unit: 'PIXELS',
      value: 2.4,
    });
    assert.equal(snapshot(env), baseline);
    const main = node.parent,
      consumer = main.createInstance();
    env.figma.currentPage.appendChild(consumer);
    const linked = consumer.findAllWithCriteria({ types: ['TEXT'] })[0];
    env.attachRichText(linked, node);
    linked.editRich(0, 0, 'Edited ');
    const edited = snapshot(env);
    for (let i = 0; i < 2; i++) {
      const r = await run();
      assert.deepStrictEqual(copy(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      assert.equal(snapshot(env), edited);
    }
    assert(linked.characters.startsWith('Edited '));
    node.setRangeTextDecorationOffset(link.start, link.end, {
      unit: 'PIXELS',
      value: 3,
    });
    const drift = snapshot(env),
      refused = await run();
    assert(refused.errors.some(e => /ownership/.test(e)));
    assert.equal(snapshot(env), drift);
    node.setRangeTextDecorationOffset(link.start, link.end, {
      unit: 'PIXELS',
      value: 2.4,
    });
    const absent = document(),
      before = snapshot(env),
      removed = await run(absent);
    assert(removed.errors.some(e => /explicit source declaration/.test(e)));
    assert.equal(snapshot(env), before);
    const reset = fixture({ unit: 'AUTO' }),
      result = await run(reset);
    assert.deepStrictEqual(copy(result.errors), []);
    assert.deepStrictEqual(
      copy(node.getRangeTextDecorationOffset(link.start, link.end)),
      { unit: 'AUTO' }
    );
    const resetState = snapshot(env);
    for (let i = 0; i < 2; i++) {
      const r = await run(reset);
      assert.deepStrictEqual(copy(r.errors), []);
      assert.equal(r.createdNodeIds.length, 0);
      assert.equal(snapshot(env), resetState);
    }
    console.log(
      brand +
        ' actual ranged offset bindings/edits/two repeats/drift/reset/absent refusal pass; no raster claim'
    );
  }
  for (const value of [
    null,
    {},
    { unit: 'AUTO', value: 0 },
    { unit: 'PIXELS', value: '2.4' },
    { unit: 'PIXELS', value: 1e300 },
    { unit: 'EM', value: 0.15 },
  ]) {
    const d = fixture(),
      r = d.components.families[0].variants[0].tree.children[0].textRuns.find(
        r => r.hyperlink
      );
    r.textDecorationOffset = value;
    const { env, run } = await setup(d, 'undrr'),
      before = snapshot(env),
      result = await run();
    assert(result.errors.some(e => /offset/.test(e)));
    assert.equal(snapshot(env), before);
    await assert.rejects(
      () =>
        buildConnector({
          operation: 'build',
          doc: d,
          brandId: 'undrr',
          familyIds: ['rich-test'],
        }),
      /offset/
    );
  }
  for (const change of [
    runs => {
      runs[0].textDecorationOffset = { unit: 'AUTO' };
    },
    runs => {
      runs[0].textDecoration = 'UNDERLINE';
    },
  ]) {
    const d = fixture();
    change(d.components.families[0].variants[0].tree.children[0].textRuns);
    const { env, run } = await setup(d, 'undrr'),
      before = snapshot(env),
      result = await run();
    assert(result.errors.some(e => /explicit valid offset/.test(e)));
    assert.equal(snapshot(env), before);
  }
  for (const signature of ['{', '{}']) {
    const d = fixture(),
      { env, run } = await setup(d, 'undrr');
    assert.deepStrictEqual(copy((await run()).errors), []);
    const node = [...env.state.nodes.values()].find(
      n => n.type === 'TEXT' && key(n).endsWith('/body')
    );
    const ledger = JSON.parse(
      node.getSharedPluginData('orgundrrmangrove', 'mgRichTextRunsV1')
    );
    ledger.runs[0].signature = signature;
    node.setSharedPluginData(
      'orgundrrmangrove',
      'mgRichTextRunsV1',
      JSON.stringify(ledger)
    );
    const before = snapshot(env),
      result = await run(document());
    assert(result.errors.some(e => /invalid ownership signature/.test(e)));
    assert.equal(snapshot(env), before);
  }
  // Adjacent equal style/paint/URL ranges with differing offsets retain boundaries.
  const adjacent = fixture(),
    runs =
      adjacent.components.families[0].variants[0].tree.children[0].textRuns;
  const linkIndex = runs.findIndex(r => r.hyperlink),
    originalLink = runs[linkIndex],
    middle = originalLink.start + 4;
  runs.splice(
    linkIndex,
    1,
    { ...originalLink, id: 'link-a', end: middle },
    {
      ...originalLink,
      id: 'link-b',
      start: middle,
      textDecorationOffset: { unit: 'PERCENT', value: 15 },
    }
  );
  const adjacentContext = await setup(adjacent, 'undrr');
  assert.deepStrictEqual(copy((await adjacentContext.run()).errors), []);
  const adjacentNode = [...adjacentContext.env.state.nodes.values()].find(
    n => n.type === 'TEXT' && key(n).endsWith('/body')
  );
  assert.deepStrictEqual(
    copy(adjacentNode.getRangeTextDecorationOffset(originalLink.start, middle)),
    { unit: 'PIXELS', value: Math.fround(2.4) }
  );
  assert.deepStrictEqual(
    copy(adjacentNode.getRangeTextDecorationOffset(middle, originalLink.end)),
    { unit: 'PERCENT', value: 15 }
  );
  const adjacentSnapshot = snapshot(adjacentContext.env);
  for (let i = 0; i < 2; i++) {
    const result = await adjacentContext.run();
    assert.deepStrictEqual(copy(result.errors), []);
    assert.equal(result.createdNodeIds.length, 0);
    assert.equal(snapshot(adjacentContext.env), adjacentSnapshot);
  }
  const unsupported = fixture(),
    { env, run } = await setup(unsupported, 'undrr');
  const first = await run();
  assert.deepStrictEqual(copy(first.errors), []);
  const n = [...env.state.nodes.values()].find(
    n => n.type === 'TEXT' && key(n).endsWith('/body')
  );
  delete n.setRangeTextDecorationOffset;
  const before = snapshot(env),
    result = await run();
  assert(result.errors.some(e => /API is unavailable/.test(e)));
  assert.equal(snapshot(env), before);
  const valid = fixture();
  await assert.rejects(
    () =>
      buildConnector({
        operation: 'build',
        doc: valid,
        brandId: 'undrr',
        familyIds: ['rich-test'],
      }),
    /payload exceeds 50000/
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { fixture };
