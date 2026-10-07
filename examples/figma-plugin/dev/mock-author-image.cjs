'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('node:assert/strict');
const root =
  process.env.MANGROVE_SOURCE_ROOT || path.resolve(__dirname, '../../..');
const asset = path.resolve(__dirname, '../holistic/assets/author-image');
const { buildAuthorImageRecipes } = require(
  path.resolve(__dirname, '../../../scripts/figma-author-image-recipes.cjs')
);
const source = () =>
  JSON.parse(
    fs.readFileSync(
      path.join(root, 'examples/figma-plugin/mangrove-variables.json')
    )
  );
const copy = x => JSON.parse(JSON.stringify(x));
function project() {
  const doc = source();
  doc.root = root;
  doc.components.families = buildAuthorImageRecipes({ root, ...doc });
  return doc;
}
const doc = project();
assert.equal(doc.components.families.length, 1);
assert.equal(doc.components.families[0].variants.length, 216);
assert.equal(doc.variables.length, 687);
assert.equal(doc.styles.text.length, 123);
assert.equal(doc.styles.effect.length, 11);
require(
  path.join(root, 'scripts/build-figma-component-drafts.cjs')
).validateDrafts(
  doc.components.families,
  { modes: doc.modes, variables: doc.variables, styles: doc.styles },
  []
);
let refused = 0;
for (const mutate of [
  d => d.modes.pop(),
  d => (d.modes[0].name = 'Other'),
  d => (d.styles.text[0].id = ''),
  d => (d.styles.text[0].type = 'EFFECT'),
  d => (d.styles.effect[0].name = ''),
  d => (d.styles.effect[0].values = []),
  d => (d.variables.find(x => x.name === 'font-size/200').values.mcr = 99),
  d =>
    (d.variables.find(x => x.name === 'color/interactive').values.irp = {
      alias: 'color/interactive',
    }),
]) {
  const d = source();
  mutate(d);
  const before = copy(d),
    refs = [d.variables, d.styles.text, d.styles.effect];
  assert.throws(() => buildAuthorImageRecipes({ root, ...d }));
  assert.deepEqual(d, before);
  assert.equal(d.variables, refs[0]);
  assert.equal(d.styles.text, refs[1]);
  assert.equal(d.styles.effect, refs[2]);
  refused++;
}
for (const name of [
  'profiles.json.gz',
  'raw-source-captures.tar.gz',
  'source-audit.json',
  'source-font-input-pins.json',
]) {
  const d = source(),
    before = copy(d),
    refs = [d.variables, d.styles.text, d.styles.effect],
    original = fs.readFileSync,
    target = path.join(asset, name);
  try {
    fs.readFileSync = function (f, ...args) {
      const body = original(f, ...args);
      return String(f) === target
        ? Buffer.concat([Buffer.from(body), Buffer.from('corruption')])
        : body;
    };
    assert.throws(() => buildAuthorImageRecipes({ root, ...d }));
  } finally {
    fs.readFileSync = original;
  }
  assert.deepEqual(d, before);
  assert.equal(d.variables, refs[0]);
  assert.equal(d.styles.text, refs[1]);
  assert.equal(d.styles.effect, refs[2]);
  refused++;
}
console.log(
  'PASS portable1/216/687/123/11 actual exporter validation and ' +
    refused +
    ' caller-preserving source/typed/archive refusals; no builder/native/reflow/raster acceptance'
);
module.exports = { project };
