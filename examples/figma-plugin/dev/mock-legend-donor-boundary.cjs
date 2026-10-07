/**
 * Source regression: adding equal-colour component roles must not redirect
 * measured Legend gradient stops to unrelated components.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const {
  buildLegendRecipes,
} = require('../../../scripts/figma-legend-recipes.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const base = JSON.parse(
  fs.readFileSync(
    path.join(root, 'examples/figma-plugin/mangrove-variables.json')
  )
);
function run(extras = []) {
  const doc = copy(base);
  doc.variables.unshift(...copy(extras));
  const before = copy(doc.variables);
  const modes = doc.modes,
    variables = doc.variables,
    text = doc.styles.text,
    effect = doc.styles.effect;
  const families = buildLegendRecipes({ root, ...doc });
  assert.equal(doc.modes, modes);
  assert.equal(doc.variables, variables);
  assert.equal(doc.styles.text, text);
  assert.equal(doc.styles.effect, effect);
  assert.deepEqual(doc.variables.slice(0, before.length), before);
  return {
    families,
    variables: doc.variables.slice(before.length),
    text: text.slice(base.styles.text.length),
    effect: effect.slice(base.styles.effect.length),
  };
}
const clean = run();
const pureRed = {
  id: 'component/standalone-icon/inline-youtube',
  name: 'component/standalone-icon/inline-youtube',
  type: 'COLOR',
  scopes: ['ALL_SCOPES'],
  values: Object.fromEntries(
    base.modes.map(mode => [mode.id, { r: 1, g: 0, b: 0, a: 1 }])
  ),
};
assert.deepEqual(run([pureRed]), clean);
for (const name of [
  'component/legend/gradient/horizontal/4',
  'component/legend/gradient/vertical/0',
]) {
  const role = clean.variables.find(variable => variable.name === name);
  assert(role, name);
  for (const mode of base.modes)
    assert.deepEqual(role.values[mode.id], { r: 1, g: 0, b: 0, a: 1 });
}
const donors = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      'examples/figma-plugin/holistic/assets/legend/foundation-contract.json'
    )
  )
).filter(variable => variable.type === 'COLOR');
for (let index = 0; index < donors.length; index++) {
  const foreign = {
    ...copy(donors[index]),
    id: 'component/foreign/same-' + index,
    name: 'component/foreign/same-' + index,
  };
  assert.deepEqual(run([foreign]), clean);
}
assert.deepEqual(
  run([
    {
      ...pureRed,
      id: 'color/foreign-pure-red',
      name: 'color/foreign-pure-red',
    },
  ]),
  clean
);
for (const kind of [
  'changed-captured-foundation',
  'missing-captured-foundation',
]) {
  const doc = copy(base);
  const donor = doc.variables.find(
    variable => variable.name === 'color/neutral-800'
  );
  if (kind === 'changed-captured-foundation') donor.values.undrr.r += 0.1;
  else doc.variables = doc.variables.filter(variable => variable !== donor);
  const before = JSON.stringify(doc);
  assert.throws(
    () => buildLegendRecipes({ root, ...doc }),
    /Captured foundation changed/
  );
  assert.equal(JSON.stringify(doc), before);
}
console.log(
  'Legend source donor boundary passed: complete all-five DTO unchanged by seven foreign donors, two literal red stops retained, two foundation refusals preserve caller inputs. Native acceptance remains separate.'
);
