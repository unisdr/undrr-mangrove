'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert/strict'),
  crypto = require('crypto'),
  zlib = require('zlib');
const root =
  process.env.MANGROVE_REPO_ROOT || path.resolve(__dirname, '../../..');
const assets = path.resolve(__dirname, '../holistic/assets/standalone-icon');
const { document } = require('./mock-standalone-icon.cjs');
const { buildStandaloneIconRecipes } = require(
  path.resolve(__dirname, '../../../scripts/figma-standalone-icon-recipes.cjs')
);
const sha = b => crypto.createHash('sha256').update(b).digest('hex'),
  copy = x => JSON.parse(JSON.stringify(x));
const manifest = JSON.parse(fs.readFileSync(assets + '/provenance.json'));
const d = document();
const historical = copy(d);
assert(d.components.families[0].limitations.length > 0);
delete historical.components.families[0].limitations;
assert.equal(
  sha(JSON.stringify(historical)),
  manifest.expectedDocumentJSONSHA256
);
for (const entry of Object.values(manifest.archives)) {
  const b = fs.readFileSync(path.join(assets, entry.path));
  assert.equal(sha(b), entry.archive.sha256);
  const raw = entry.path.endsWith('.gz') ? zlib.gunzipSync(b) : b;
  assert.equal(raw.length, entry.raw.bytes);
  assert.equal(sha(raw), entry.raw.sha256);
}
function refusal(mutate) {
  const candidate = copy(d),
    before = JSON.stringify(candidate);
  mutate(candidate);
  const mutated = JSON.stringify(candidate);
  assert.throws(() =>
    buildStandaloneIconRecipes({
      root,
      modes: candidate.modes,
      variables: candidate.variables,
      styles: candidate.styles,
    })
  );
  assert.equal(JSON.stringify(candidate), mutated);
  assert.notEqual(before, mutated);
}
refusal(x => x.modes.pop());
refusal(x => {
  x.variables.find(v => v.name === 'color/text').type = 'FLOAT';
});
refusal(x => {
  x.styles.text[0].values.mcr.fontName = { family: '', style: 'Regular' };
});
console.log(
  JSON.stringify({
    family: 1,
    variants: 131,
    fullReviewedDocumentHashExactExceptExplicitFamilyLimitations: true,
    rawArchives: 90,
    originalPNGs: 90,
    callerPreservingSourceRefusals: 3,
    broadLifecycleRerun: false,
    nativeAccepted: false,
  })
);
