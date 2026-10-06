'use strict';
// Read-only portable replay. No production/plugin source is executed.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const assert = require('assert');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const dir = __dirname;
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json')));
function restore(entry) {
  const packed = fs.readFileSync(path.join(dir, entry.archive));
  assert.equal(packed.length, entry.compressedBytes);
  assert.equal(sha(packed), entry.compressedSha256, entry.name);
  const raw = zlib.gunzipSync(packed);
  assert.equal(raw.length, entry.bytes);
  assert.equal(sha(raw), entry.sha256, entry.name);
  // Deterministic gzip byte parity is checked with Python's archive encoder;
  // Node uses a different gzip OS header while preserving the same raw bytes.
  return raw;
}
const raw = new Map(manifest.files.map(e => [e.name, restore(e)]));
const json = name => JSON.parse(raw.get(name).toString('utf8'));
const helper = fs.readFileSync(path.join(dir, manifest.replayHelper.path));
assert.equal(sha(helper), manifest.replayHelper.sha256);
const {
  sourceTextContract,
  validatePlainActual,
} = require('./source-text-contract.cjs');
const doc = json('source-document.json');
const build = json('actual-first-build-report.json');
const inspect = json('actual-native-full374-report.json');
assert.equal(sha(raw.get('source-document.json')), manifest.sourceSHA256);
assert.equal(build.sourceSHA256, manifest.sourceSHA256);
assert.equal(inspect.sourceSHA256, manifest.sourceSHA256);
assert.equal(inspect.productionReportSHA256, manifest.actualReportSHA256);
assert.deepStrictEqual(
  doc.components.families.map(f => [f.id, f.variants.length]),
  [
    ['horizontal-book-card', 8],
    ['editorial-cta', 23],
  ]
);
assert.deepStrictEqual(build.productionResult.errors, []);
assert.deepStrictEqual(build.boundary.errors, []);
assert.equal(inspect.snapshotComplete, true);
assert.equal(inspect.inventoryVerified, true);
assert.deepStrictEqual(inspect.errors, []);
assert.deepStrictEqual(inspect.fieldExceptions, []);
assert.deepStrictEqual(inspect.nodes, inspect.finalNodes);
assert.deepStrictEqual(inspect.foundationBefore, inspect.foundationAfter);
assert.deepStrictEqual(inspect.foundationBefore, inspect.foundationFinal);
assert.deepStrictEqual(inspect.createdNodeIds, []);
assert.deepStrictEqual(inspect.mutatedNodeIds, []);
assert.deepStrictEqual(inspect.fontLoads, []);
const byId = new Map(inspect.nodes.map(n => [n.id, n]));
assert.equal(byId.size, 374);
assert.deepStrictEqual(
  [...byId.keys()].sort(),
  [...build.boundary.inventoryAfter.nodes].sort()
);
for (const n of inspect.nodes) {
  if (n.parentId !== '0:1')
    assert(
      byId.get(n.parentId)?.children.includes(n.id),
      'Parent membership ' + n.id
    );
  for (const id of n.children ?? []) assert.equal(byId.get(id)?.parentId, n.id);
}
for (const [id, link] of Object.entries(inspect.mainLinks)) {
  assert.equal(byId.get(id)?.type, 'INSTANCE');
  const main = byId.get(link.mainId);
  assert.equal(main?.type, 'COMPONENT');
  assert.equal(main.parentId, link.mainParentId);
  assert.equal(main.sharedPluginData.mgKitId, link.mainManagedKey);
}
const anatomy = [];
for (const family of doc.components.families)
  for (const variant of family.variants) {
    function walk(node, key) {
      anatomy.push({
        key,
        family: family.id,
        variant: variant.id,
        source: node,
      });
      for (const child of node.children ?? [])
        walk(child, key + '/' + child.id);
    }
    walk(variant.tree, 'family/' + family.id + '/variant/' + variant.id);
  }
assert.equal(anatomy.length, 190);
assert.deepStrictEqual(anatomy, json('source-anatomy-contract.json').nodes);
for (const row of inspect.sourceAnatomyDiscovery) {
  assert(anatomy.some(n => n.key === row.key));
  for (const id of row.matchingActualNodeIds)
    assert.equal(byId.get(id)?.sharedPluginData.mgKitId, row.key);
}
const contracts = doc.modes.map(m => sourceTextContract(doc, m.id));
assert.deepStrictEqual(
  contracts,
  json('source-text-contract-all-modes.json').contracts
);
for (const contract of contracts) {
  assert.equal(contract.entries.length, 78);
  assert.equal(contract.entries.filter(e => e.kind === 'plain').length, 70);
}
const foundation = inspect.foundationFinal;
assert.equal(foundation.variables.length, 70);
assert.equal(foundation.textStyles.length, 8);
assert.equal(foundation.effectStyles.length, 1);
const styles = new Map(foundation.textStyles.map(s => [s[3], s[0]]));
const plain = contracts[0].entries
  .filter(e => e.kind === 'plain')
  .map(e => {
    const discovery = inspect.sourceAnatomyDiscovery.find(r => r.key === e.key);
    assert.equal(discovery?.matchingOutsideInstanceNodeIds.length, 1, e.key);
    const n = byId.get(discovery.matchingOutsideInstanceNodeIds[0]);
    return validatePlainActual(
      e,
      { id: n.id, key: n.sharedPluginData.mgKitId, ...n.text },
      styles
    );
  });
const richWidthFailures = [];
for (const e of contracts[0].entries.filter(e => e.kind === 'rich')) {
  const ids = inspect.sourceAnatomyDiscovery.find(
    r => r.key === e.key
  ).matchingActualNodeIds;
  assert.equal(ids.length, 2);
  for (const id of ids) {
    const n = byId.get(id),
      parent = byId.get(n.parentId);
    assert.equal(n.text.characters, e.characters);
    assert.equal(n.fields.width, 0);
    assert.equal(n.fields.height, 4536);
    assert.equal(n.fields.layoutSizingHorizontal, 'FILL');
    assert(parent.fields.width > 0);
    richWidthFailures.push({
      id,
      key: e.key,
      width: n.fields.width,
      height: n.fields.height,
      parentId: parent.id,
      parentWidth: parent.fields.width,
    });
  }
}
assert.equal(richWidthFailures.length, 16);
const requestedSpread = doc.styles.effect.find(s => s.id === 'shadow.raised')
  .values.undrr[0].effect.spread;
const actualSpread = foundation.effectStyles.find(
  s => s[3] === 'shadow.raised'
)[4][0].spread;
assert.equal(requestedSpread, 1);
assert.equal(actualSpread, 0);
const clippingFailures = doc.components.families[0].variants.map(v => {
  assert.equal(v.tree.layout.clipsContent, false);
  const key = 'family/horizontal-book-card/variant/' + v.id;
  const masterIds = inspect.sourceAnatomyDiscovery.find(
    r => r.key === key
  ).matchingOutsideInstanceNodeIds;
  assert.equal(masterIds.length, 1);
  const ids = [
    ...masterIds,
    ...Object.entries(inspect.mainLinks)
      .filter(([, link]) => link.mainId === masterIds[0])
      .map(([id]) => id),
  ];
  assert.equal(ids.length, 2);
  for (const id of ids) assert.equal(byId.get(id).fields.clipsContent, true);
  return { key, ids, source: false, actual: true };
});
const cloud = json('cloud-membership-native-result.json');
assert.equal(cloud.foundCount, 374);
assert.equal(cloud.allRecordedIdsAndParentsObserved, true);
assert.deepStrictEqual(cloud.missing, []);
assert.deepStrictEqual(cloud.mismatches, []);
assert.equal(cloud.summaries.length, 16);
for (const row of cloud.summaries) {
  const n = byId.get(row.id);
  assert.equal(row.width, n.fields.width);
  assert.equal(row.height, n.fields.height);
  assert.equal(row.parentId, n.parentId);
  assert.equal(row.characters, n.text.characters);
}
assert.deepStrictEqual(cloud.createdNodeIds, []);
assert.deepStrictEqual(cloud.mutatedNodeIds, []);
const result = {
  archiveIntegrity: true,
  rawFiles: raw.size,
  sourceAnatomyKeys: anatomy.length,
  allModeTextContracts: contracts.map(c => ({
    brand: c.brand,
    entries: c.entries.length,
  })),
  nativeNodeCount: byId.size,
  instanceMainLinks: Object.keys(inspect.mainLinks).length,
  plainSubgate: {
    checked: plain.length,
    passed: plain.filter(r => r.accepted).length,
    failures: plain.filter(r => !r.accepted),
  },
  richWidthFailures,
  effectSpreadMismatch: { source: requestedSpread, actual: actualSpread },
  clippingFailures,
  cloudMembershipVisible: true,
  nativeSourceAccepted: false,
  baselineAdoption: false,
  scope:
    'Exact raw first-run/readonly integrity and reproducible bounded source mismatch audit. No production execution, rich full-style/paint acceptance, live-mode/repeat/render/publication acceptance or current target authority.',
};
console.log(JSON.stringify(result, null, 2));
