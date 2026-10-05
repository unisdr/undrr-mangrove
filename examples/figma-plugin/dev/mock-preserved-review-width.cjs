#!/usr/bin/env node
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path');
const { environment } = require('./mock-kit.cjs');
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  doc.variables.push({
    id: 'component.review-width',
    name: 'component/review-width',
    type: 'FLOAT',
    scopes: ['ALL_SCOPES'],
    values: Object.fromEntries(doc.modes.map(m => [m.id, 600])),
  });
  doc.components.families = [
    {
      id: 'review-width-test',
      name: 'Review width test',
      kind: 'component-set',
      review: { preserveVariantSizing: true, genericLabels: false },
      variants: ['fixed', 'hug'].map(kind => ({
        id: 'review-width-test.' + kind,
        name: 'Size=' + kind,
        properties: { Size: kind },
        tree: {
          id: 'root',
          type: 'FRAME',
          layout: {
            mode: 'VERTICAL',
            width: kind === 'fixed' ? 'component/review-width' : 'HUG',
            height: 40,
          },
          children: [
            {
              id: 'title',
              type: 'TEXT',
              characters: 'Title',
              textProperty: 'Title',
              textStyle: 'component.body',
              fill: 'color/text',
              layout: { width: 100, height: 24 },
            },
          ],
        },
      })),
    },
  ];
  return doc;
}
const geometry = env =>
  JSON.stringify(
    [...env.state.nodes.values()].map(n => [
      n.id,
      n.x,
      n.y,
      n.width,
      n.height,
      n.layoutSizingHorizontal,
    ])
  );
async function main() {
  for (const mode of document().modes) {
    const doc = document(),
      env = environment(doc, { sharedOnly: true });
    await env.call('importVariables', doc, [mode.id], false, [], false);
    const build = () =>
      env.call('buildMangroveComponents', doc, mode.id, ['review-width-test']);
    const first = await build();
    assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
    for (const [kind, width] of [
      ['fixed', 616],
      ['hug', 344],
    ]) {
      const row = [...env.state.nodes.values()].find(
        n =>
          identity(n) ===
          'review/review-width-test/specimen/review-width-test.' + kind
      );
      assert(row);
      assert.strictEqual(row.width, width);
      const master = [...env.state.nodes.values()].find(
        n =>
          identity(n) ===
          'family/review-width-test/variant/review-width-test.' + kind
      );
      assert.strictEqual(
        master.layoutSizingHorizontal,
        kind === 'fixed' ? 'FIXED' : 'HUG'
      );
    }
    const before = geometry(env);
    for (let i = 0; i < 2; i++) {
      const repeat = await build();
      assert.strictEqual(repeat.errors.length, 0);
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      assert.strictEqual(geometry(env), before);
    }
  }
  console.log(
    'Preserved token FIXED600 review row616 and HUG344 unchanged: all five brands and two zero-create exact recorded geometry repeats pass. Native review rendering remains separate.'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
