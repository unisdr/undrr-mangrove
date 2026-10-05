#!/usr/bin/env node
/** Emit guarded ignored-runtime instrumentation without installing it. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { renderPlugin } = require('../../../scripts/build-figma-plugin.cjs');
const ROOT = path.resolve(__dirname, '../../..');
const output = path.resolve(process.argv[2] || '');
if (!process.argv[2] || fs.existsSync(output))
  throw new Error('Supply a new output directory.');
if (output === ROOT || output.startsWith(`${ROOT}${path.sep}`))
  throw new Error('Trace output must stay outside source.');
const baseline = renderPlugin();
const helper =
  "\nlet MG_RECOVERY_TRACE = null;\nasync function mgRecoveryTraceBegin(msg) {\n  const collections = await figma.variables.getLocalVariableCollectionsAsync();\n  if (collections.length !== 1 || collections[0].key !== 'a5e74aec4da308285010a5113c4648463a5cdf5f') throw new Error('Temporary recovery trace refuses every other collection.');\n  if (msg.brand !== 'undrr' || msg.families.length !== 1 || msg.families[0] !== 'button' || msg.refreshNarrowReview === true) throw new Error('Temporary trace requires UNDRR Button only and review refresh off.');\n  MG_RECOVERY_TRACE = { version: 'native-final-section-1', collectionKey: collections[0].key, stages: [] };\n  mgRecoveryTraceCapture('before-component-build');\n}\nfunction mgRecoveryTraceCapture(stage) {\n  if (!MG_RECOVERY_TRACE) return;\n  const catalogue = figma.currentPage.findOne(n => mgReadIdentity(n, 'mgKitId') === 'layout/compositions/catalogue');\n  const nodes = [...figma.currentPage.children.filter(n => n.type === 'SECTION')];\n  if (catalogue) nodes.push(catalogue, ...catalogue.findAll());\n  const records = nodes.map(n => {\n    const r = { id:n.id, type:n.type, name:n.name, parentId:n.parent.id, x:n.x, y:n.y, width:n.width, height:n.height, visible:n.visible, box:n.absoluteBoundingBox };\n    if(n.type !== 'SECTION') { r.paint=n.absoluteRenderBounds; r.footprint=mgLayoutFootprint(n); }\n    if(n.type === 'FRAME') { r.layoutMode=n.layoutMode; r.primaryAxisSizingMode=n.primaryAxisSizingMode; r.counterAxisSizingMode=n.counterAxisSizingMode; r.paddingTop=n.paddingTop; r.paddingBottom=n.paddingBottom; r.itemSpacing=n.itemSpacing; }\n    return r;\n  });\n  MG_RECOVERY_TRACE.stages.push(JSON.parse(JSON.stringify({stage,records})));\n}\n";
let traced = baseline;
function replace(before, after) {
  if (traced.split(before).length !== 2)
    throw new Error(
      'Runtime anchor changed; review instrumentation before continuing.'
    );
  traced = traced.replace(before, after);
}
replace(
  "    if (msg.type === 'build-components') {\n",
  "    if (msg.type === 'build-components') {\n      await mgRecoveryTraceBegin(msg);\n"
);
replace(
  '      mgLayoutBrowseFlow(catalogue, [title, body], rows, 3);',
  "      mgRecoveryTraceCapture('before-catalogue-browse-flow');\n      mgLayoutBrowseFlow(catalogue, [title, body], rows, 3);\n      mgRecoveryTraceCapture('after-catalogue-browse-flow');"
);
replace(
  '    for (const [id, section] of sections) {',
  "    mgRecoveryTraceCapture('before-section-resize');\n    for (const [id, section] of sections) {"
);
replace(
  '    // Reading order: introduction/foundations, components, examples/workspace,',
  "    mgRecoveryTraceCapture('after-section-resize');\n    // Reading order: introduction/foundations, components, examples/workspace,"
);
replace(
  "    mgWriteIdentity(sections.get('start'), 'mgLayoutPhase', 'complete');",
  "    mgRecoveryTraceCapture('after-final-section-placement');\n    mgWriteIdentity(sections.get('start'), 'mgLayoutPhase', 'complete');"
);
replace(
  "      operation: 'kit-layout',\n      version: MG_LAYOUT_VERSION,\n      flowVersion:",
  "      recoveryTrace: MG_RECOVERY_TRACE,\n      operation: 'kit-layout',\n      version: MG_LAYOUT_VERSION,\n      flowVersion:"
);
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'pristine-main.js'), baseline);
fs.writeFileSync(path.join(output, 'traced-main.js'), helper + traced);
fs.writeFileSync(
  path.join(output, 'trace-manifest.json'),
  `${JSON.stringify(
    {
      sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT })
        .toString()
        .trim(),
      workingSourceStatus: execFileSync(
        'git',
        [
          'status',
          '--porcelain',
          '--untracked-files=all',
          '--',
          'scripts',
          'examples/figma-plugin',
        ],
        { cwd: ROOT }
      ).toString(),
      collectionKey: 'a5e74aec4da308285010a5113c4648463a5cdf5f',
      status:
        'Prepared, not installed or run; geometry getters may influence lazy layout',
      sha256: Object.fromEntries(
        [
          ['pristine-main.js', baseline],
          ['traced-main.js', helper + traced],
        ].map(([name, bytes]) => [
          name,
          crypto.createHash('sha256').update(bytes).digest('hex'),
        ])
      ),
    },
    null,
    2
  )}\n`
);
console.log(`Trace prepared, not installed: ${output}`);
