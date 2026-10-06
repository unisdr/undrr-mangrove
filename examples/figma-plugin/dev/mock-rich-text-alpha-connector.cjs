#!/usr/bin/env node
/** Compiler boundary checks only; rich payloads remain above the transport ceiling. */
'use strict';
const assert = require('assert');
const fs = require('fs'),
  path = require('path'),
  vm = require('vm');
const { createRequire } = require('module');
function compilerFlags() {
  const filename = path.resolve(
    __dirname,
    '../../../scripts/build-figma-connector.cjs'
  );
  const localRequire = createRequire(filename),
    module = { exports: {} };
  let flags;
  const loader = name =>
    name === 'terser'
      ? {
          minify: async (code, options) => {
            flags = options.compress.global_defs;
            return localRequire('terser').minify(code, options);
          },
        }
      : localRequire(name);
  const load = vm.runInThisContext(
    '(function(require,module,exports,__filename,__dirname){' +
      fs.readFileSync(filename, 'utf8').replace(/^#![^\n]*\n/, '') +
      '\n})',
    { filename }
  );
  load(loader, module, module.exports, filename, path.dirname(filename));
  return { compile: module.exports.buildConnector, flags: () => flags };
}

const { document } = require('./mock-rich-text-integration.cjs');
const {
  buildConnector,
} = require('../../../scripts/build-figma-connector.cjs');
function fixture() {
  const doc = document();
  const color = {
    id: 'component.rich-alpha.ink',
    name: 'component/rich-alpha/ink',
    type: 'COLOR',
    scopes: ['TEXT_FILL'],
    values: Object.fromEntries(
      doc.modes.map(m => [m.id, { r: 1, g: 1, b: 1, a: 0.8 }])
    ),
  };
  doc.variables.push(color);
  const tree = doc.components.families[0].variants[0].tree;
  tree.children[0].textRuns
    .filter(r => !r.hyperlink)
    .forEach(r => {
      r.fill = color.name;
    });
  return doc;
}
async function main() {
  for (const brand of fixture().modes) {
    await assert.rejects(
      buildConnector({
        operation: 'build',
        brandId: brand.id,
        familyIds: ['rich-test'],
        doc: fixture(),
      }),
      /payload exceeds 50000/
    );
    const invalid = fixture();
    invalid.variables.find(
      v => v.id === 'component.rich-alpha.ink'
    ).values.mcr.a = 1.01;
    await assert.rejects(
      buildConnector({
        operation: 'build',
        brandId: brand.id,
        familyIds: ['rich-test'],
        doc: invalid,
      }),
      /invalid COLOR/
    );
  }
  const selectedOpaque = fixture();
  selectedOpaque.variables.find(
    v => v.id === 'component.rich-alpha.ink'
  ).values.undrr.a = 1;
  const observed = compilerFlags();
  await assert.rejects(
    observed.compile({
      operation: 'build',
      brandId: 'undrr',
      familyIds: ['rich-test'],
      doc: selectedOpaque,
    }),
    /payload exceeds 50000/
  );
  assert.strictEqual(
    observed.flags().MG_CONNECTOR_RICH_ALPHA,
    true,
    'Valid nonselected source alpha must retain native validation capability'
  );
  await assert.rejects(
    observed.compile({
      operation: 'build',
      brandId: 'undrr',
      familyIds: ['rich-test'],
      doc: document(),
    }),
    /payload exceeds 50000/
  );
  assert.strictEqual(
    observed.flags().MG_CONNECTOR_RICH_ALPHA,
    false,
    'Opaque source must prune alpha capability'
  );
  const alias = fixture();
  alias.variables.push({
    id: 'component.rich-alpha.alias',
    name: 'component/rich-alpha/alias',
    type: 'COLOR',
    scopes: ['TEXT_FILL'],
    values: Object.fromEntries(
      alias.modes.map(m => [m.id, { alias: 'component/rich-alpha/ink' }])
    ),
  });
  alias.components.families[0].variants[0].tree.children[0].textRuns
    .filter(r => !r.hyperlink)
    .forEach(r => {
      r.fill = 'component/rich-alpha/alias';
    });
  await assert.rejects(
    buildConnector({
      operation: 'build',
      brandId: 'undrr',
      familyIds: ['rich-test'],
      doc: alias,
    }),
    /payload exceeds 50000/
  );
  console.log(
    'Rich alpha compiler validates all source modes and alias closure before unchanged 50k transport refusal; no native compiled execution claim.'
  );
}
module.exports = { fixture, main };
if (require.main === module)
  main().catch(e => {
    console.error(e.stack || e);
    process.exitCode = 1;
  });
