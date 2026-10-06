'use strict';
const fs = require('fs'),
  path = require('path'),
  os = require('os'),
  zlib = require('zlib'),
  crypto = require('crypto'),
  assert = require('assert'),
  { spawnSync } = require('child_process');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const baseline = spawnSync(
  process.execPath,
  [path.join(__dirname, 'replay.cjs')],
  { encoding: 'utf8', maxBuffer: 4e6 }
);
assert.equal(baseline.status, 0, baseline.stderr);
const value = JSON.parse(baseline.stdout);
assert.equal(value.nativeSourceAccepted, false);
assert.equal(value.richWidthFailures.length, 16);
assert.equal(value.clippingFailures.length, 8);
assert.deepStrictEqual(value.effectSpreadMismatch, { source: 1, actual: 0 });
const names = [
  'compressed-byte-corruption',
  'managed-parent-membership',
  'wrong-instance-main',
  'source-range-copy',
];
for (const kind of names) {
  const dir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'mangrove-horizontal-archive-negative-')
  );
  try {
    fs.cpSync(__dirname, dir, { recursive: true });
    const manifestPath = path.join(dir, 'manifest.json');
    const m = JSON.parse(fs.readFileSync(manifestPath));
    const entry = m.files.find(
      f => f.name === 'actual-native-full374-report.json'
    );
    const packedPath = path.join(dir, entry.archive);
    if (kind === 'compressed-byte-corruption') {
      const packed = fs.readFileSync(packedPath);
      packed[20] ^= 1;
      fs.writeFileSync(packedPath, packed);
    } else {
      const j = JSON.parse(zlib.gunzipSync(fs.readFileSync(packedPath)));
      if (kind === 'managed-parent-membership') {
        j.nodes.find(n => n.id === '13:126').parentId = '13:111';
        j.finalNodes = j.nodes;
      }
      if (kind === 'wrong-instance-main') j.mainLinks['13:241'].mainId = '13:8';
      if (kind === 'source-range-copy') {
        j.nodes.find(n => n.id === '13:126').text.characters =
          'Different authored copy';
        j.finalNodes = j.nodes;
      }
      const raw = Buffer.from(JSON.stringify(j)),
        packed = zlib.gzipSync(raw, { level: 9, mtime: 0 });
      fs.writeFileSync(packedPath, packed);
      Object.assign(entry, {
        bytes: raw.length,
        sha256: sha(raw),
        compressedBytes: packed.length,
        compressedSha256: sha(packed),
      });
      fs.writeFileSync(manifestPath, JSON.stringify(m));
    }
    const run = spawnSync(process.execPath, [path.join(dir, 'replay.cjs')], {
      encoding: 'utf8',
      maxBuffer: 4e6,
    });
    assert.notEqual(run.status, 0, kind);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
console.log(
  JSON.stringify({
    passed: true,
    completeRawFiles: value.rawFiles,
    nativeNodes: value.nativeNodeCount,
    negatives: names,
    nativeSourceAccepted: false,
  })
);
