'use strict';

const assert = require('assert');
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const {
  guardExperimentSource,
  PROTECTED_FILES,
} = require('../../../scripts/figma-experiment-target.cjs');
const {
  buildConnector,
} = require('../../../scripts/build-figma-connector.cjs');
const { environment, importFoundation } = require('./mock-kit.cjs');
const KEY = 'GbVTvFbuWjoJr6Bf5t4fhg';

async function run() {
  const source =
    'evaluations.push("evaluated"); async function importVariables(){mutations.push("import");} await pause(); await importVariables();';
  const guarded = guardExperimentSource(source, KEY, ['importVariables']);
  for (const fileKey of [
    undefined,
    null,
    '',
    'OtherUnpublishedFileKey22',
    ...PROTECTED_FILES,
  ]) {
    const context = {
      figma: { fileKey },
      evaluations: [],
      mutations: [],
      pause: async () => {},
    };
    await assert.rejects(
      vm.runInNewContext(`(async()=>{${guarded}})()`, context),
      /target refused/
    );
    assert.deepStrictEqual(context.evaluations, []);
    assert.deepStrictEqual(context.mutations, []);
  }
  const context = { figma: { fileKey: KEY }, evaluations: [], mutations: [] };
  context.pause = async () => {
    context.figma.fileKey = PROTECTED_FILES[0];
  };
  await assert.rejects(
    vm.runInNewContext(`(async()=>{${guarded}})()`, context),
    /target refused/
  );
  assert.deepStrictEqual(context.evaluations, ['evaluated']);
  assert.deepStrictEqual(context.mutations, []);
  const afterAwait = {
    figma: { fileKey: KEY },
    mutations: [],
  };
  afterAwait.load = async () => {
    afterAwait.figma.fileKey = PROTECTED_FILES[1];
  };
  const probePreparation = guardExperimentSource(
    'async function importVariables(){ await load(); mgAssertExperimentOperationTarget(); mutations.push("probe"); } await importVariables();',
    KEY,
    ['importVariables']
  );
  await assert.rejects(
    vm.runInNewContext(`(async()=>{${probePreparation}})()`, afterAwait),
    /target refused/
  );
  assert.deepStrictEqual(afterAwait.mutations, []);
  for (const collision of [
    'const mgAssertExperimentOperationTarget = () => {};',
    'function f(mgAssertExperimentOperationTarget) {}',
    'const o = { f(mgAssertExperimentOperationTarget) {} };',
    'class C { f(mgAssertExperimentOperationTarget) {} }',
    'class C { #f(mgAssertExperimentOperationTarget) {} }',
    'const { x: mgAssertExperimentTarget } = {};',
    'try {} catch (mgAssertExperimentOperationTarget) {}',
  ])
    assert.throws(
      () =>
        guardExperimentSource(
          `${collision} async function importVariables(){}`,
          KEY,
          ['importVariables']
        ),
      /binding collision/
    );
  assert.throws(
    () =>
      guardExperimentSource(source, PROTECTED_FILES[0], ['importVariables']),
    /separate unpublished/
  );
  assert.throws(
    () =>
      guardExperimentSource(
        'async function importVariables(){} async function importVariables(){}',
        KEY,
        ['importVariables']
      ),
    /exactly one/
  );
  assert.throws(
    () => guardExperimentSource(source, KEY, ['unknown']),
    /bounded/
  );

  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  const opts = {
    operation: 'build',
    doc,
    brandId: 'undrr',
    familyIds: ['button'],
    variantIds: [
      doc.components.families.find(family => family.id === 'button').variants[0]
        .id,
    ],
  };
  const payload = await buildConnector({ ...opts, experimentFileKey: KEY });
  const env = environment(doc);
  await importFoundation(env, doc);
  env.figma.fileKey = PROTECTED_FILES[0];
  const before = env.state.nodes.size;
  await assert.rejects(env.runCode(payload.code), /target refused/);
  assert.strictEqual(env.state.nodes.size, before);
  env.figma.fileKey = KEY;
  const first = await env.runCode(payload.code);
  assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
  assert(first.createdNodeIds.length > 0);
  const second = await env.runCode(payload.code);
  assert.strictEqual(second.errors.length, 0, second.errors.join('\n'));
  assert.strictEqual(second.createdNodeIds.length, 0);
  process.stdout.write(
    'Experiment target guard: protected/missing/mismatched keys refuse before evaluation and entry; compiled bounded build repeats pass. Native acceptance remains open.\n'
  );
}

if (require.main === module)
  run().catch(error => {
    process.stderr.write(`${error.stack}\n`);
    process.exitCode = 1;
  });
module.exports = { run };
