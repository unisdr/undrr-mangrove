#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const PLUGIN = path.resolve(__dirname, '../examples/figma-plugin');
const SOURCES = [
  'kit-identity.js',
  'code.js',
  'kit-inspection.js',
  'kit-builder.js',
];

function buildPlugin() {
  const output = path.join(PLUGIN, 'build/main.js');
  const source = SOURCES.map(
    file =>
      `// Source: ${file}\n${fs.readFileSync(path.join(PLUGIN, file), 'utf8')}`
  ).join('\n;\n');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${source}\n`);
  return output;
}

if (require.main === module) {
  process.stdout.write(`build-figma-plugin: wrote ${buildPlugin()}\n`);
}
module.exports = { buildPlugin };
