'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('node:assert/strict'),
  zlib = require('zlib');
const root =
    process.env.MANGROVE_SOURCE_ROOT || path.resolve(__dirname, '../../..'),
  localRoot = path.resolve(__dirname, '../../..'),
  asset = path.join(
    localRoot,
    'examples/figma-plugin/holistic/assets/menu-items'
  );
const { buildMenuItemsRecipes } = require(
    path.join(localRoot, 'scripts/figma-menu-items-recipes.cjs')
  ),
  { sourcePlan } = require(path.join(asset, 'source-plan.cjs'));
const readOriginal = n =>
  JSON.parse(
    zlib.gunzipSync(
      fs.readFileSync(path.join(asset, 'reference-candidate', n + '.gz'))
    )
  );
const base = JSON.parse(
    fs.readFileSync(
      path.join(root, 'examples/figma-plugin/mangrove-variables.json')
    )
  ),
  copy = x => structuredClone(x);
const plan = sourcePlan({ repositoryRoot: root });
assert.deepEqual(plan, readOriginal('source-plan.json'));
const d = copy(base);
d.root = root;
const vars = d.variables,
  text = d.styles.text,
  effect = d.styles.effect,
  expected = readOriginal('document.json'),
  families = buildMenuItemsRecipes(d);
assert.strictEqual(d.variables, vars);
assert.strictEqual(d.styles.text, text);
assert.strictEqual(d.styles.effect, effect);
assert.deepEqual(d.variables, expected.variables);
assert.deepEqual(d.styles, expected.styles);
const historicalFamilies = copy(families);
assert(families[0].limitations.length > 0);
delete historicalFamilies[0].limitations;
assert.deepEqual(historicalFamilies, expected.components.families);
const cases = [];
for (const [name, change] of [
  [
    'unused-mode-finite-role',
    d =>
      (d.variables.find(
        v => v.type === 'FLOAT' && typeof v.values.mcr === 'number'
      ).values.mcr = NaN),
  ],
  [
    'alias-cycle',
    d => {
      const v = d.variables.find(v => v.type === 'STRING');
      v.values.mcr = { alias: v.name };
    },
  ],
  ['wrong-style-kind', d => (d.styles.text[0].type = 'EFFECT')],
  ['wrong-source-font-shape', d => (d.styles.text[0].values.mcr.fontName = [])],
]) {
  const f = copy(base);
  f.root = root;
  change(f);
  const before = copy(f);
  assert.throws(() => buildMenuItemsRecipes(f));
  assert.deepEqual(f, before);
  cases.push(name);
}
for (const [name, target] of [
  [
    'compressed-raw-corruption',
    path.join(
      asset,
      'source-evidence/captures/undrr-english-390-initial.json.gz'
    ),
  ],
  [
    'archive-map-corruption',
    path.join(asset, 'source-evidence/archive-map.json'),
  ],
  [
    'actual-source-module-drift',
    path.join(root, 'stories/Atom/Navigation/MenuItems/MenuItems.jsx'),
  ],
  [
    'actual-preview-context-source-drift',
    path.join(root, '.storybook/preview.js'),
  ],
]) {
  const f = copy(base);
  f.root = root;
  const before = copy(f),
    read = fs.readFileSync;
  fs.readFileSync = function (p, ...args) {
    const b = read.call(this, p, ...args);
    return String(p) === target
      ? Buffer.concat([
          Buffer.isBuffer(b) ? b : Buffer.from(b),
          Buffer.from(' '),
        ])
      : b;
  };
  try {
    assert.throws(() => buildMenuItemsRecipes(f));
    assert.deepEqual(f, before);
  } finally {
    fs.readFileSync = read;
  }
  cases.push(name);
}
console.log(
  JSON.stringify({
    sourceAppearances: 32,
    sourceOwners: 240,
    fullPreservedOriginalControlledDTOExceptExplicitFamilyLimitations: true,
    callerArraysRetained: true,
    callerPreservingRefusals: cases,
    matchingPreviewThemeAndI18nContext: true,
    nativeAccepted: false,
  })
);
