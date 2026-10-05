#!/usr/bin/env node
/** Honest prerequisite source guards, not a native assembly mock. */
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path'),
  os = require('os');
const {
  inspectNewsDetailPrerequisites,
  buildNewsDetailRecipes,
} = require('../../../scripts/figma-news-detail-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const report = inspectNewsDetailPrerequisites({ root });
assert.strictEqual(report.assemblyReady, false);
assert.deepStrictEqual(report.families, []);
assert.strictEqual(report.sourceSceneCount, 50);
assert.strictEqual(report.dependencies.length, 12);
assert.throws(
  () => buildNewsDetailRecipes({ root }),
  /article-float-highlight.*embed-container/
);
report.dependencies[0].status = 'invented-pass';
assert.notStrictEqual(
  inspectNewsDetailPrerequisites({ root }).dependencies[0].status,
  'invented-pass'
);
const tmp = fs.mkdtempSync(
  path.join(os.tmpdir(), 'mangrove-news-prerequisites-')
);
try {
  const prov =
      'examples/figma-plugin/holistic/assets/news-detail/provenance.json',
    metadata = JSON.parse(fs.readFileSync(path.join(root, prov)));
  for (const file of [prov, ...Object.keys(metadata.sourceHashes)]) {
    const target = path.join(tmp, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, file), target);
  }
  for (const file of [
    'stories/Patterns/ArticleStory/ArticleStory.jsx',
    'stories/Components/HighlightBox/highlight-box.scss',
    'stories/Components/Buttons/ShareButtons/share-buttons.scss',
    'examples/figma-plugin/holistic/assets/news-detail/source-footprints.json',
    'examples/figma-plugin/holistic/assets/page-reading/source-fonts/Roboto-BoldItalic.woff2',
  ]) {
    const target = path.join(tmp, file),
      original = fs.readFileSync(target);
    fs.appendFileSync(target, '\nsource drift');
    assert.throws(
      () => inspectNewsDetailPrerequisites({ root: tmp }),
      /source contract changed/
    );
    fs.writeFileSync(target, original);
  }
  const target = path.join(tmp, prov);
  fs.appendFileSync(target, ' ');
  assert.throws(
    () => inspectNewsDetailPrerequisites({ root: tmp }),
    /provenance changed/
  );
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(
  'News detail50 source scenes/10 float diagnostics guarded; missing higher-order prerequisites refuse full assembly. No native build/zero-create claim.'
);
