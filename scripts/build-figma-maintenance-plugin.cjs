#!/usr/bin/env node
/** Bundle the independent variable/style maintenance entry. */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PLUGIN = path.join(ROOT, 'examples/figma-plugin');
const OUTPUT = path.join(PLUGIN, 'maintenance/build/main.js');
const SOURCES = [
  'kit-identity.js',
  'importer.js',
  'maintenance/inspection.js',
  'maintenance/code.js',
];
function renderMaintenancePlugin() {
  const {
    buildFigmaMaintenance,
  } = require('./build-figma-maintenance-tokens.cjs');
  return (
    'const MG_CONNECTOR_NATIVE_COLLECTIONS = false;\n' +
    `const MG_MAINTENANCE_SOURCE = ${JSON.stringify(buildFigmaMaintenance())};\n` +
    SOURCES.map(
      file =>
        `// Source: ${file}\n${fs.readFileSync(path.join(PLUGIN, file), 'utf8')}`
    ).join('\n;\n') +
    '\n'
  );
}
function main(argv = []) {
  if (argv.some(arg => arg !== '--check'))
    throw new Error('Use --check or no arguments.');
  const source = renderMaintenancePlugin();
  if (argv.includes('--check')) {
    if (!fs.existsSync(OUTPUT) || fs.readFileSync(OUTPUT, 'utf8') !== source)
      throw new Error(
        'Stale or missing maintenance runtime. Run yarn build:figma-maintenance.'
      );
    process.stdout.write(
      'build-figma-maintenance-plugin: runtime is current; no files changed\n'
    );
    return;
  }
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  if (!fs.existsSync(OUTPUT) || fs.readFileSync(OUTPUT, 'utf8') !== source)
    fs.writeFileSync(OUTPUT, source);
  process.stdout.write(
    `build-figma-maintenance-plugin: wrote ${path.relative(ROOT, OUTPUT)}\n`
  );
}
if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`build-figma-maintenance-plugin: ${error.message}\n`);
    process.exitCode = 1;
  }
}
module.exports = { renderMaintenancePlugin, main, OUTPUT };
