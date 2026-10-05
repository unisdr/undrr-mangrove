#!/usr/bin/env node
/** Compare saved ordinary build receipts and scoped full native inspections. */
'use strict';
const fs = require('fs');
const assert = require('assert');
if (process.argv.length !== 6)
  throw new Error(
    'Use <build1.json> <build2.json> <inspection1.json> <inspection2.json>.'
  );
const read = file => {
  const doc = JSON.parse(fs.readFileSync(file));
  return doc.result || doc;
};
const [first, second, before, after] = process.argv.slice(2).map(read);
for (const build of [first, second]) {
  if (build.operation !== undefined)
    assert.strictEqual(build.operation, 'component-build');
  assert.deepStrictEqual(build.createdNodeIds, []);
  assert.deepStrictEqual(build.errors, []);
  assert.strictEqual(build.layout.phase, 'complete');
  assert.deepStrictEqual(build.layout.errors, []);
  assert(
    Array.isArray(build.layout.sections) && build.layout.sections.length === 7,
    'Seven compact-flow section receipts required'
  );
  for (const section of build.layout.sections)
    for (const field of ['x', 'y', 'width', 'height'])
      assert(Number.isFinite(section[field]), `Missing section ${field}`);
  assert(
    build.families.length === 1 && build.families[0].id === 'button',
    'Button-only receipt required'
  );
}
for (const inspection of [before, after]) {
  assert.strictEqual(inspection.schemaVersion, 1);
  assert.strictEqual(inspection.errors.length, 0);
  assert.strictEqual(inspection.document.editorType, 'figma');
  if (inspection.document.fileKey)
    assert.strictEqual(inspection.document.fileKey, 'JF29fJWi9LzUHeOObGL3nB');
  assert.strictEqual(inspection.currentPage.id, '0:1');
  assert.strictEqual(
    inspection.nodes.length,
    9480,
    'Frozen recovery inventory must match; review any inventory change'
  );
  assert.strictEqual(inspection.variables.length, 520);
  assert(
    Array.isArray(inspection.styles.text) &&
      Array.isArray(inspection.styles.effect)
  );
  assert.strictEqual(inspection.styles.text.length, 54);
  assert.strictEqual(inspection.styles.effect.length, 8);
  const ids = new Set(inspection.nodes.map(n => n.id));
  assert.strictEqual(ids.size, inspection.nodes.length, 'Duplicate scene IDs');
  for (const id of ['30:2704', '30:5336', '30:5339', '30:5348', '30:2706'])
    assert(ids.has(id), `Missing recovery diagnostic node ${id}`);
  assert.strictEqual(inspection.collections.length, 1);
  assert(
    inspection.collections.some(
      c => c.key === 'a5e74aec4da308285010a5113c4648463a5cdf5f'
    ),
    'Recovery collection required'
  );
}
assert.deepStrictEqual(before.document, after.document);
assert.deepStrictEqual(before.currentPage, after.currentPage);
function norm(value) {
  if (Array.isArray(value)) return value.map(norm);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .filter(k => !['key', 'absoluteRenderBounds'].includes(k))
        .sort()
        .map(k => [k, norm(value[k])])
    );
  return value;
}
function hash(value) {
  let h = 2166136261;
  const text = JSON.stringify(norm(value));
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const fields = inspection => {
  const values = {};
  for (const node of [...inspection.nodes].sort((a, b) =>
    a.id.localeCompare(b.id)
  ))
    for (const field of Object.keys(node))
      if (!['key', 'absoluteRenderBounds'].includes(field))
        (values[field] ||= []).push([node.id, node[field]]);
  return values;
};
const left = fields(before);
const right = fields(after);
const changedFields = [
  ...new Set([...Object.keys(left), ...Object.keys(right)]),
].filter(k => JSON.stringify(norm(left[k])) !== JSON.stringify(norm(right[k])));
const changedFoundations = ['collections', 'variables', 'styles'].filter(
  k => JSON.stringify(norm(before[k])) !== JSON.stringify(norm(after[k]))
);
const sectionEqual =
  JSON.stringify(norm(first.layout.sections)) ===
  JSON.stringify(norm(second.layout.sections));
const pass =
  !changedFields.length && !changedFoundations.length && sectionEqual;
console.log(
  JSON.stringify(
    {
      pass,
      scope:
        'Recorded owned scene fields and foundations; excludes keys and absolute render bounds; no raster claim',
      nodeCounts: [before.nodes.length, after.nodes.length],
      fieldCount: Object.keys(left).length,
      changedFields,
      changedFoundations,
      sectionEqual,
      fieldHashes: Object.fromEntries(
        Object.entries(left).map(([k, v]) => [k, hash(v)])
      ),
    },
    null,
    2
  )
);
process.exitCode = pass ? 0 : 1;
