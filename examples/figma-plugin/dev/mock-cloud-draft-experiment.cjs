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
  cloudDraftImportScope,
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
  const required = cloudDraftImportScope(doc);
  for (const name of ['font-family/text', 'font-size/300', 'color/neutral-900'])
    assert(
      required.variableIds.includes(doc.variables.find(v => v.name === name).id)
    );
  assert(required.styleIds.includes('component.tag.label'));
  const missingReview = JSON.parse(JSON.stringify(doc));
  missingReview.variables = missingReview.variables.filter(
    v => v.name !== 'font-family/text'
  );
  assert.throws(
    () => cloudDraftImportScope(missingReview),
    /Missing draft review dependency/
  );
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
  // Native resize resets both axis modes. The base mock intentionally does not
  // render layout, so model this API behavior for review-scaffold regression.
  const createFrame = env.figma.createFrame;
  env.figma.createFrame = (...args) => {
    const frame = createFrame(...args);
    const resize = frame.resize;
    frame.resize = (...sizes) => {
      resize.apply(frame, sizes);
      frame.primaryAxisSizingMode = 'FIXED';
      frame.counterAxisSizingMode = 'FIXED';
    };
    return frame;
  };
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
  const assertReviewHugs = () => {
    const review = env.state.nodes.get(first.reviewRootId);
    assert.strictEqual(review.primaryAxisSizingMode, 'AUTO');
    assert.strictEqual(review.counterAxisSizingMode, 'FIXED');
    const family = review.children.find(n => n.name === 'Mangrove/Tag');
    assert(family, 'Tag review family missing');
    assert.strictEqual(family.primaryAxisSizingMode, 'AUTO');
    assert.strictEqual(family.counterAxisSizingMode, 'FIXED');
  };
  assertReviewHugs();
  for (let i = 0; i < 2; i++) {
    const repeat = await env.runCode(payload.code);
    assert.strictEqual(repeat.errors.length, 0, repeat.errors.join('\n'));
    assert.strictEqual(repeat.createdNodeIds.length, 0);
    assertReviewHugs();
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
