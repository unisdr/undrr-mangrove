#!/usr/bin/env node
'use strict';
const assert = require('assert');
const {
  buildConnector,
} = require('../../../scripts/build-figma-connector.cjs');
const {
  document,
  setup,
  assets,
} = require('./mock-native-collections-text-import.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const TARGET = 'v2PlainTextFixtureNoNativeWrites';
async function main() {
  const doc = document(),
    options = {
      doc,
      experimentFileKey: TARGET,
      familyIds: ['label', 'wrapper'],
    };
  const sizes = [];
  for (const mode of doc.modes) {
    const compiled = await buildConnector({
      ...options,
      operation: 'import',
      brandId: mode.id,
    });
    assert(compiled.bytes <= 50000);
    assert.equal(compiled.characters, compiled.code.length);
    const env = setup(doc);
    env.figma.fileKey = TARGET;
    const result = await env.runCode(compiled.code);
    assert.deepStrictEqual(copy(result.errors), []);
    assert.equal(result.nativeCollections.version, 2);
    assert.equal(result.nativeCollections.profile, 'plain-text-instances-v1');
    assert.equal(result.counts.created, 8);
    const baseline = assets(env);
    for (let i = 0; i < 2; i++) {
      const repeat = await env.runCode(compiled.code);
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.equal(repeat.counts.created, 0);
      assert.equal(assets(env), baseline);
    }
    sizes.push({ brand: mode.id, bytes: compiled.bytes });
  }
  const compiled = await buildConnector({ ...options, operation: 'import' });
  const missing = setup(doc);
  missing.figma.fileKey = TARGET;
  missing.figma.loadFontAsync = async () => {
    throw Error('Required source font unavailable');
  };
  const before = assets(missing);
  await assert.rejects(
    () => missing.runCode(compiled.code),
    /source font unavailable/
  );
  assert.equal(assets(missing), before);
  const changed = setup(doc);
  changed.figma.fileKey = TARGET;
  changed.figma.loadFontAsync = async () => {
    changed.figma.fileKey = 'differentNativeFileKey000';
  };
  const original = assets(changed);
  await assert.rejects(() => changed.runCode(compiled.code), /target|file/i);
  assert.equal(assets(changed), original);
  const page = setup(doc);
  page.figma.fileKey = TARGET;
  page.figma.loadFontAsync = async () => {
    page.figma.currentPage = { id: 'different-page' };
  };
  const pageBefore = assets(page);
  await assert.rejects(() => page.runCode(compiled.code), /page changed/);
  assert.equal(assets(page), pageBefore);
  for (const extra of [
    { variantIds: ['label.default'] },
    { variableIds: ['base-family'] },
    { styleIds: ['plain-text'] },
    { experimentFileKey: undefined },
    { operation: 'inspect' },
  ])
    await assert.rejects(() =>
      buildConnector({ ...options, operation: 'import', ...extra })
    );
  const invalid = copy(doc);
  invalid.variables.find(v => v.id === 'text-size').values.mcr = {
    alias: 'fixture/base-width',
  };
  invalid.styles.text[0].values.mcr.fontSize = 130;
  await assert.rejects(
    () => buildConnector({ ...options, doc: invalid, operation: 'import' }),
    /alias|topology/i
  );
  // Keep the whole source shape and all guards. A transport refusal is not a build success.
  let buildBytes = null,
    buildRefusal = null;
  try {
    const build = await buildConnector({ ...options, operation: 'build' });
    buildBytes = build.bytes;
    assert(buildBytes <= 50000);
  } catch (e) {
    assert.match(e.message, /exceeds 50000/);
    buildRefusal = e.message;
  }
  console.log(
    JSON.stringify({
      status:
        'Compiled v2 imports all five modes and two exact asset repeats pass; build remains a separately measured transport gate',
      sizes,
      buildBytes,
      buildRefusal,
    })
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { TARGET };
