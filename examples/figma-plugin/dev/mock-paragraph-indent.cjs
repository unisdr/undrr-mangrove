#!/usr/bin/env node
/** Native style setter contract only. Actual browser line wrapping is separate. */
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path');
const { environment } = require('./mock-kit.cjs');
const {
  buildConnector,
} = require('../../../scripts/build-figma-connector.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
const base = () =>
  JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
const snapshot = env =>
  JSON.stringify({
    styles: env.state.styles,
    variables: env.state.variables,
    collections: env.state.collections,
    nodes: [...env.state.nodes.keys()],
  });
async function main() {
  for (const brand of ['undrr', 'delta', 'irp', 'mcr', 'preventionweb']) {
    const doc = base(),
      spec = doc.styles.text.find(s => s.id === 'component.body');
    assert(spec);
    for (const value of Object.values(spec.values)) value.paragraphIndent = 28;
    const env = environment(doc, { sharedOnly: true });
    const first = await env.call(
      'importVariables',
      doc,
      [brand],
      false,
      [spec.id],
      false
    );
    assert.deepStrictEqual(copy(first.errors), []);
    const style = env.state.styles.find(s => s.type === 'TEXT');
    assert.strictEqual(style.paragraphIndent, 28);
    const id = style.id;
    for (let i = 0; i < 2; i++) {
      const r = await env.call(
        'importVariables',
        doc,
        [brand],
        false,
        [spec.id],
        false
      );
      assert.deepStrictEqual(copy(r.errors), []);
      assert.strictEqual(style.id, id);
      assert.strictEqual(style.paragraphIndent, 28);
    }
    for (const value of Object.values(spec.values))
      delete value.paragraphIndent;
    const reset = await env.call(
      'importVariables',
      doc,
      [brand],
      false,
      [spec.id],
      false
    );
    assert.deepStrictEqual(copy(reset.errors), []);
    assert.strictEqual(style.paragraphIndent, 0);
    for (const invalid of [-1, NaN, Infinity, '28', null]) {
      const bad = copy(doc);
      bad.styles.text.find(s => s.id === spec.id).values[
        brand === 'delta' ? 'undrr' : 'delta'
      ].paragraphIndent = invalid;
      const before = snapshot(env);
      await assert.rejects(
        async () =>
          env.call('importVariables', bad, [brand], false, [spec.id], false),
        /paragraph indent/
      );
      assert.strictEqual(snapshot(env), before);
      await assert.rejects(
        async () =>
          env.call('importStyles', bad, new Map(), brand, [spec.id], false),
        /paragraph indent/
      );
      assert.strictEqual(snapshot(env), before);
      await assert.rejects(
        buildConnector({
          doc: bad,
          operation: 'import',
          brandId: brand,
          styleIds: [spec.id],
          variableIds: [],
        }),
        /paragraph indent/
      );
    }
    const declared = copy(doc);
    for (const v of Object.values(
      declared.styles.text.find(s => s.id === spec.id).values
    ))
      v.paragraphIndent = 28;
    const compiled = await buildConnector({
      doc: declared,
      operation: 'import',
      brandId: brand,
      styleIds: [spec.id],
      variableIds: [],
    });
    const compiledEnv = environment(declared, { sharedOnly: true });
    const imported = await compiledEnv.runCode(compiled.code);
    assert.deepStrictEqual(copy(imported.result.errors), []);
    assert.strictEqual(
      compiledEnv.state.styles.find(s => s.type === 'TEXT').paragraphIndent,
      28
    );
  }
  console.log(
    'Paragraph indent styles: five brands, retained IDs/two repeats, absent reset0, full-source nonselected-mode negatives and direct importer/compiler pre-write refusal pass. Native continuation wrapping remains open.'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
