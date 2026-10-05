'use strict';

const assert = require('assert');
const {
  buildDraftPacket,
} = require('../../../scripts/build-figma-component-drafts.cjs');
const {
  buildCloudDraftDocument,
  compileCloudDraftOperation,
  FILE_KEY,
  COLLECTION,
} = require('../../../scripts/figma-cloud-draft-experiment.cjs');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  PROTECTED_FILES,
} = require('../../../scripts/figma-experiment-target.cjs');

async function run() {
  const opts = { fileKey: FILE_KEY, familyIds: ['tag'] };
  for (const fileKey of [
    undefined,
    ...PROTECTED_FILES,
    'OtherUnpublishedFileKey22',
  ])
    assert.throws(
      () => buildCloudDraftDocument({ ...opts, fileKey }),
      /separate unpublished|recorded empty/
    );
  assert.throws(
    () => buildCloudDraftDocument({ ...opts, familyIds: ['button'] }),
    /Unknown draft/
  );
  assert.throws(
    () => buildCloudDraftDocument({ ...opts, familyIds: ['tag', 'tag'] }),
    /unique/
  );
  const packet = buildDraftPacket();
  const doc = buildCloudDraftDocument(opts);
  assert.strictEqual(doc.collection, COLLECTION);
  assert.deepStrictEqual(doc.experiment.baseContract, packet.baseContract);
  assert.deepStrictEqual(doc.experiment.source, packet.source);
  assert.deepStrictEqual(doc.variables, packet.foundationCatalogue.variables);
  assert.deepStrictEqual(doc.styles, packet.foundationCatalogue.styles);
  assert.deepStrictEqual(
    doc.components.families,
    packet.draftFamilies.filter(f => f.id === 'tag')
  );
  assert.strictEqual(doc.kitGuidance, undefined);
  assert.strictEqual(doc.plannedInventory, undefined);
  assert.strictEqual(packet.collection, undefined);
  const scopedImport = await compileCloudDraftOperation({
    ...opts,
    operation: 'import',
    brandId: 'undrr',
    variableIds: [doc.variables.find(v => v.name === 'spacing/200').id],
    styleIds: [],
  });
  const snapshot = testEnv =>
    JSON.stringify({
      nodes: [...testEnv.state.nodes.values()].map(n => [n.id, n.name, n.type]),
      collections: testEnv.state.collections,
      variables: testEnv.state.variables,
      styles: testEnv.state.styles,
      fonts: [...testEnv.state.loadedFonts],
    });
  for (const fileKey of [
    undefined,
    ...PROTECTED_FILES,
    'OtherUnpublishedFileKey22',
  ]) {
    const testEnv = environment(doc);
    testEnv.figma.fileKey = fileKey;
    const original = snapshot(testEnv);
    await assert.rejects(testEnv.runCode(scopedImport.code), /target refused/);
    assert.strictEqual(snapshot(testEnv), original);
  }
  const importEnv = environment(doc);
  importEnv.figma.fileKey = FILE_KEY;
  const imported = await importEnv.runCode(scopedImport.code);
  assert.strictEqual(imported.result.errors.length, 0);
  assert.strictEqual(imported.createdVariableIds.length, 1);
  assert.strictEqual(scopedImport.scope.prune, false);
  const env = environment(doc);
  await importFoundation(env, doc);
  const payload = await compileCloudDraftOperation({
    ...opts,
    operation: 'build',
    brandId: 'undrr',
  });
  const before = env.state.nodes.size;
  env.figma.fileKey = PROTECTED_FILES[0];
  await assert.rejects(env.runCode(payload.code), /target refused/);
  assert.strictEqual(env.state.nodes.size, before);
  env.figma.fileKey = FILE_KEY;
  const first = await env.runCode(payload.code);
  assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
  assert(first.createdNodeIds.length);
  for (let i = 0; i < 2; i++) {
    const repeat = await env.runCode(payload.code);
    assert.strictEqual(repeat.errors.length, 0, repeat.errors.join('\n'));
    assert.strictEqual(repeat.createdNodeIds.length, 0);
  }
  process.stdout.write(
    'Cloud draft adapter: exact target, preserved foundations/IDs, guarded compiled Tag construction and two zero-create mock repeats pass. No Figma writes or native acceptance.\n'
  );
}

if (require.main === module)
  run().catch(error => {
    process.stderr.write(`${error.stack}\n`);
    process.exitCode = 1;
  });
module.exports = { run };
