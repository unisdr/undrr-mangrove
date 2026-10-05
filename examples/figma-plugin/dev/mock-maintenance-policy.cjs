#!/usr/bin/env node
/** Actual builder policy checks. The mock does not establish native Figma behaviour. */
'use strict';
const assert = require('assert');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const NAMESPACE = 'orgundrrmangrove';
const POLICY = 'mgMaintenancePolicy';
const manual = reason => ({ version: 1, owner: 'manual', reason });
const source = { version: 1, owner: 'source', reason: '' };
const identity = node =>
  node.getSharedPluginData(NAMESPACE, 'mgKitId') ||
  node.getPluginData('mgKitId');

function find(env, key) {
  const matches = [...env.state.nodes.values()].filter(
    node => node.type !== 'INSTANCE' && identity(node) === key
  );
  assert.strictEqual(matches.length, 1, `Expected one owned ${key}`);
  return matches[0];
}

async function snapshot(env) {
  const report = copy(await env.call('inspectMangroveKit'));
  delete report.capturedAt;
  return JSON.stringify({
    report,
    policies: [...env.state.nodes.values()].map(node => ({
      id: node.id,
      privateData: node.data,
      sharedData: node.sharedData,
    })),
  });
}

async function refusesWithoutWrites(env, doc, ids, pattern) {
  const before = await snapshot(env);
  let fontLoads = 0;
  const load = env.figma.loadFontAsync;
  env.figma.loadFontAsync = (...args) => {
    fontLoads += 1;
    return load(...args);
  };
  try {
    await assert.rejects(
      env.call('buildMangroveComponents', doc, 'undrr', ids),
      pattern
    );
  } finally {
    env.figma.loadFontAsync = load;
  }
  assert.strictEqual(fontLoads, 0, 'Policy refuses before font preparation');
  assert.strictEqual(await snapshot(env), before, 'Refusal changes no assets');
}

async function fixture(doc, options) {
  const env = environment(doc, options);
  await importFoundation(env, doc);
  const built = await env.call('buildMangroveComponents', doc, 'undrr', [
    'button',
    'text-input',
    'table',
  ]);
  assert.deepStrictEqual(copy(built.errors), []);
  return env;
}

async function main() {
  const doc = buildFigmaVariables();
  {
    const env = await fixture(doc);
    const before = await snapshot(env);
    const read = await env.call('readMangroveMaintenancePolicies', doc, [
      'button',
    ]);
    assert.strictEqual(read.phase, 'inspected');
    assert.deepStrictEqual(copy(read.families[0].policy), source);
    assert.strictEqual(read.families[0].explicitNodeIds.length, 0);
    assert.strictEqual(await snapshot(env), before);
    const repeated = await env.call('buildMangroveComponents', doc, 'undrr', [
      'button',
    ]);
    assert.deepStrictEqual(copy(repeated.errors), []);
    assert.strictEqual(repeated.createdNodeIds.length, 0);

    const set = find(env, 'family/button');
    set.opacity = 0.72;
    const written = await env.call(
      'setMangroveMaintenancePolicy',
      doc,
      ['button'],
      'manual',
      'Designer maintains the current Button geometry.'
    );
    assert.strictEqual(written.phase, 'complete');
    assert.strictEqual(written.updatedNodeIds.length, 17);
    assert.strictEqual(written.families[0].setId, set.id);
    assert.strictEqual(written.families[0].variantIds.length, 16);
    await refusesWithoutWrites(
      env,
      doc,
      ['button'],
      /Manual maintenance.*button/
    );
    await refusesWithoutWrites(
      env,
      doc,
      ['text-cta'],
      /Manual maintenance.*button/
    );
    const stableManual = JSON.stringify(
      copy(await env.call('mgInspectNode', set, new Map(), []))
    );
    const unrelated = await env.call('buildMangroveComponents', doc, 'undrr', [
      'text-input',
    ]);
    assert.deepStrictEqual(copy(unrelated.errors), []);
    assert.strictEqual(
      JSON.stringify(copy(await env.call('mgInspectNode', set, new Map(), []))),
      stableManual,
      'An unrelated selected family leaves the manual set alone'
    );
    const reverted = await env.call(
      'setMangroveMaintenancePolicy',
      doc,
      ['button'],
      'source',
      ''
    );
    assert.strictEqual(reverted.phase, 'complete');
    const restored = await env.call('buildMangroveComponents', doc, 'undrr', [
      'button',
    ]);
    assert.deepStrictEqual(copy(restored.errors), []);
    assert.strictEqual(restored.createdNodeIds.length, 0);
    console.log(
      'ok  source default, direct/dependent refusal, unrelated build and explicit source handback'
    );
  }
  {
    const env = await fixture(doc);
    const cell = find(env, 'family/table-header-cell');
    cell.setSharedPluginData(
      NAMESPACE,
      POLICY,
      JSON.stringify(manual('Manual table headings.'))
    );
    await refusesWithoutWrites(
      env,
      doc,
      ['table'],
      /Manual maintenance.*table-header-cell/
    );
    const read = await env.call('readMangroveMaintenancePolicies', doc, [
      'table-header-cell',
    ]);
    assert.strictEqual(read.families[0].explicitNodeIds.length, 1);
    const reversed = await env.call(
      'setMangroveMaintenancePolicy',
      doc,
      ['table-header-cell'],
      'source',
      ''
    );
    assert.strictEqual(reversed.phase, 'complete');
    const set = find(env, 'family/button');
    const variant = set.children[0];
    variant.setSharedPluginData(
      NAMESPACE,
      POLICY,
      JSON.stringify(manual('Manual variant.'))
    );
    await refusesWithoutWrites(
      env,
      doc,
      ['button'],
      /Manual maintenance.*button/
    );
    const variantRead = await env.call('readMangroveMaintenancePolicies', doc, [
      'button',
    ]);
    assert.strictEqual(variantRead.families[0].explicitNodeIds[0], variant.id);
    assert.strictEqual(
      (
        await env.call(
          'setMangroveMaintenancePolicy',
          doc,
          ['button'],
          'source',
          ''
        )
      ).phase,
      'complete'
    );
    console.log(
      'ok  transitive Table dependency, set-only and variant-only policies remain reportable/reversible'
    );
  }
  {
    const env = await fixture(doc);
    const set = find(env, 'family/button');
    const variant = set.children[0];
    variant.setSharedPluginData(NAMESPACE, POLICY, '{bad');
    await refusesWithoutWrites(
      env,
      doc,
      ['button'],
      /Invalid maintenance policy/
    );
    let before = await snapshot(env);
    assert.strictEqual(
      (
        await env.call(
          'setMangroveMaintenancePolicy',
          doc,
          ['button'],
          'source',
          ''
        )
      ).phase,
      'refused'
    );
    assert.strictEqual(await snapshot(env), before);
    variant.setSharedPluginData(NAMESPACE, POLICY, JSON.stringify(source));
    set.setSharedPluginData(
      NAMESPACE,
      POLICY,
      JSON.stringify(manual('Manual family.'))
    );
    await refusesWithoutWrites(
      env,
      doc,
      ['button'],
      /Conflicting maintenance policies/
    );
    before = await snapshot(env);
    assert.strictEqual(
      (
        await env.call(
          'setMangroveMaintenancePolicy',
          doc,
          ['button'],
          'source',
          ''
        )
      ).phase,
      'refused'
    );
    assert.strictEqual(await snapshot(env), before);
    set.setSharedPluginData(NAMESPACE, POLICY, JSON.stringify(source));
    set.setPluginData(
      POLICY,
      JSON.stringify(manual('Conflicting private marker.'))
    );
    await refusesWithoutWrites(
      env,
      doc,
      ['button'],
      /Conflicting Mangrove identities/
    );
    before = await snapshot(env);
    const conflicted = await env.call(
      'setMangroveMaintenancePolicy',
      doc,
      ['button'],
      'source',
      ''
    );
    assert.strictEqual(conflicted.phase, 'refused');
    assert.strictEqual(await snapshot(env), before);
    console.log(
      'ok  malformed policy, mixed ownership and conflicting shared/private metadata fail closed'
    );
  }
  {
    const env = await fixture(doc);
    const set = find(env, 'family/button');
    set.setPluginData(POLICY, JSON.stringify(manual('Legacy private owner.')));
    const promoted = await env.call(
      'setMangroveMaintenancePolicy',
      doc,
      ['button'],
      'manual',
      'Legacy private owner.'
    );
    assert.strictEqual(promoted.phase, 'complete');
    assert.strictEqual(
      set.getSharedPluginData(NAMESPACE, POLICY),
      set.getPluginData(POLICY),
      'An unchanged legacy policy is promoted for the shared-only connector'
    );
    const repeated = await env.call(
      'setMangroveMaintenancePolicy',
      doc,
      ['button'],
      'manual',
      'Legacy private owner.'
    );
    assert.strictEqual(repeated.updatedNodeIds.length, 0);
    await refusesWithoutWrites(
      env,
      doc,
      ['button'],
      /Manual maintenance.*button/
    );
    const restored = await env.call(
      'setMangroveMaintenancePolicy',
      doc,
      ['button'],
      'source',
      ''
    );
    assert.strictEqual(restored.phase, 'complete');
    assert.strictEqual(set.getPluginData(POLICY), JSON.stringify(source));
    assert.strictEqual(
      set.getSharedPluginData(NAMESPACE, POLICY),
      JSON.stringify(source)
    );
    const shared = await fixture(doc, { sharedOnly: true });
    assert.strictEqual(
      (
        await shared.call(
          'setMangroveMaintenancePolicy',
          doc,
          ['button'],
          'manual',
          'Connector-safe owner.'
        )
      ).phase,
      'complete'
    );
    await refusesWithoutWrites(shared, doc, ['button'], /Manual maintenance/);
    assert.strictEqual(
      (
        await shared.call(
          'setMangroveMaintenancePolicy',
          doc,
          ['button'],
          'source',
          ''
        )
      ).phase,
      'complete'
    );
    console.log(
      'ok  valid private legacy handback and shared-only runtime use the same identity conventions'
    );
  }
  {
    const env = await fixture(doc);
    const before = await snapshot(env);
    for (const [ids, owner, reason] of [
      [['button'], 'manual', '  '],
      [['button'], 'source', 'unexpected'],
      [['button', 'missing'], 'manual', 'Invalid family batch.'],
      [['button', 'chips'], 'manual', 'Known but uninstalled family batch.'],
      [['button', 'button'], 'manual', 'Duplicate family batch.'],
    ]) {
      const result = await env.call(
        'setMangroveMaintenancePolicy',
        doc,
        ids,
        owner,
        reason
      );
      assert.strictEqual(result.phase, 'refused');
      assert.strictEqual(result.updatedNodeIds.length, 0);
      assert.strictEqual(await snapshot(env), before);
    }
    const set = find(env, 'family/button');
    set.children[0].type = 'FRAME';
    await refusesWithoutWrites(env, doc, ['button'], /changed ownership/);
    console.log(
      'ok  whole-batch input validation and changed canonical type refuse without writes'
    );
  }
}

if (require.main === module)
  main().catch(error => {
    console.error(`FAIL ${error.stack || error}`);
    process.exitCode = 1;
  });
