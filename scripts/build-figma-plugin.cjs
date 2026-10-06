#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const PLUGIN = path.resolve(__dirname, '../examples/figma-plugin');
const SOURCES = [
  'kit-identity.js',
  'kit-native-collections.js',
  'importer.js',
  'code.js',
  'kit-inspection.js',
  'kit-text-thickness.js',
  'kit-rich-text.js',
  'kit-font-defaults.js',
  'kit-svg-sizing.js',
  'kit-gradient-transform.js',
  'kit-alpha-mask.js',
  'kit-frozen-source-line.js',
  'kit-builder.js',
  'kit-layout.js',
  'kit-navigation.js',
  'kit-welcome.js',
  'kit-acceptance.js',
  'kit-editorial-acceptance.js',
  'font-diagnostics.js',
  'kit-segmented-capabilities.js',
  'kit-segmented-canonical-capabilities.js',
  'kit-segmented-focus-capabilities.js',
  'kit-segmented-leaves-capabilities.js',
  'kit-segmented-wrapper-capabilities.js',
  'kit-form-action-capabilities.js',
  'kit-form-action-optional-capabilities.js',
  'kit-core-content-capabilities.js',
  'kit-capabilities.js',
];

function renderPlugin() {
  const { buildDefaultKitGuidance } = require('./figma-kit-guidance.cjs');
  const guidance = `const MG_KIT_GUIDANCE = ${JSON.stringify(buildDefaultKitGuidance())};\n`;
  const source =
    guidance +
    SOURCES.map(
      file =>
        `// Source: ${file}\n${fs.readFileSync(path.join(PLUGIN, file), 'utf8')}`
    ).join('\n;\n');
  return `${source}\n`;
}

function buildPlugin() {
  const output = path.join(PLUGIN, 'build/main.js');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const source = renderPlugin();
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== source)
    fs.writeFileSync(output, source);
  return output;
}

if (require.main === module) {
  process.stdout.write(`build-figma-plugin: wrote ${buildPlugin()}\n`);
}
module.exports = { buildPlugin, renderPlugin };
