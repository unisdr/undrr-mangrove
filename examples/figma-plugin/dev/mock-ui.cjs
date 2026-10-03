#!/usr/bin/env node
/** Exercise real UI messages and downloads without rendering a browser. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { environment, importFoundation } = require('./mock-kit.cjs');
const DIR = path.resolve(__dirname, '..');

function mountUI() {
  const html = fs.readFileSync(path.join(DIR, 'ui.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert(script, 'Plugin UI script is missing');
  const elements = new Map();
  for (const match of html.matchAll(/<[a-z][^>]*\bid="([^"]+)"[^>]*>/g)) {
    elements.set(match[1], {
      disabled: /\bdisabled\b/.test(match[0]),
      hidden: /\bhidden\b/.test(match[0]),
      checked: /\bchecked\b/.test(match[0]),
      textContent: '',
      checkedInputs: [],
      querySelectorAll(selector) {
        assert.strictEqual(selector, 'input:checked');
        return this.checkedInputs;
      },
      addEventListener() {},
    });
  }
  const messages = [];
  const downloads = [];
  const blobs = new Map();
  const window = {};
  const context = vm.createContext({
    window,
    document: {
      getElementById(id) {
        assert(elements.has(id), `Unknown UI element ${id}`);
        return elements.get(id);
      },
      createElement(tag) {
        assert.strictEqual(tag, 'a', 'Only report download anchors are needed');
        return {
          click() {
            downloads.push({ name: this.download, blob: blobs.get(this.href) });
          },
        };
      },
    },
    parent: {
      postMessage(message) {
        messages.push(message.pluginMessage);
      },
    },
    Blob,
    URL: {
      createObjectURL(blob) {
        const id = `blob:mock-${blobs.size}`;
        blobs.set(id, blob);
        return id;
      },
      revokeObjectURL() {},
    },
    setTimeout() {},
    Uint8Array,
  });
  vm.runInContext(script, context);
  return {
    elements,
    messages,
    downloads,
    window,
    setDocument(doc) {
      context.fixtureDoc = doc;
      vm.runInContext('doc = fixtureDoc; refreshControls()', context);
    },
  };
}

async function main() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(DIR, 'mangrove-variables.json'), 'utf8')
  );
  const env = environment(doc);
  await importFoundation(env, doc);
  const built = await env.call('buildMangroveComponents', doc, 'undrr');
  assert.strictEqual(built.errors.length, 0, built.errors.join('\n'));
  const report = JSON.parse(
    JSON.stringify(await env.call('inspectMangroveKit'))
  );
  const text = report.nodes.find(node => node.type === 'TEXT');
  text.characters = 'fixture-only-large-text'.repeat(160000);
  const fullJSON = JSON.stringify(report, null, 2);
  assert(Buffer.byteLength(fullJSON) > 3_000_000);

  const ui = mountUI();
  const element = id => ui.elements.get(id);
  element('inspect').onclick();
  assert.strictEqual(ui.messages[0].type, 'inspect');
  assert.strictEqual(ui.messages[0].checkFonts, false);
  assert.strictEqual(element('inspect').disabled, true);
  assert.strictEqual(element('log').textContent, 'Working…');
  ui.window.onmessage({
    data: { pluginMessage: { type: 'inspection', result: report } },
  });
  assert.strictEqual(element('inspect').disabled, false);
  assert.strictEqual(element('save-report').disabled, false);
  const displayed = element('log').textContent;
  assert(displayed.startsWith('Inspection complete.'));
  assert(displayed.includes(`${report.variables.length} variables`));
  assert(displayed.includes(`${report.nodes.length} nodes`));
  assert(displayed.includes('UNDRR'));
  assert(displayed.includes('Fonts: not checked.'));
  assert(!displayed.includes('fixture-only-large-text'));
  assert(
    displayed.length < 4096,
    'Large report must have a bounded UI summary'
  );
  element('save-report').onclick();
  assert.strictEqual(ui.downloads[0].name, 'mangrove-kit-inspection.json');
  assert.strictEqual(ui.downloads[0].blob.type, 'application/json');
  const downloaded = await ui.downloads[0].blob.text();
  assert.strictEqual(
    downloaded,
    fullJSON,
    'Download must retain every report field'
  );
  assert.deepStrictEqual(JSON.parse(downloaded), report);
  console.log(
    'ok  multi-megabyte real inspection fixture displays a bounded summary, enables controls and downloads exact full data'
  );

  report.collections = Array.from({ length: 100 }, () => ({
    name: 'collection-name'.repeat(100),
    modes: Array.from({ length: 100 }, () => ({
      name: 'brand-name'.repeat(100),
    })),
  }));
  report.errors = Array(100).fill('inspection-error'.repeat(10000));
  report.fonts = {
    loads: Array.from({ length: 100 }, () => ({
      fontName: { family: 'Roboto Condensed', style: 'Bold' },
      loaded: false,
      error: 'font-failure'.repeat(10000),
    })),
    errors: Array(100).fill('font-service-error'.repeat(10000)),
  };
  element('check-fonts').checked = true;
  element('inspect').onclick();
  assert.strictEqual(ui.messages[1].checkFonts, true);
  ui.window.onmessage({
    data: { pluginMessage: { type: 'inspection', result: report } },
  });
  assert(element('log').textContent.length < 4096);
  assert(element('log').textContent.includes('100 failed'));
  assert.strictEqual(element('inspect').disabled, false);
  assert.strictEqual(element('save-report').disabled, false);
  element('save-report').onclick();
  assert.deepStrictEqual(JSON.parse(await ui.downloads[1].blob.text()), report);
  console.log(
    'ok  excessive mode names, font failures and inspection errors remain bounded without truncating saved reports'
  );

  const exportsUI = mountUI();
  const exportElement = id => exportsUI.elements.get(id);
  assert.strictEqual(exportElement('export-family').disabled, true);
  exportsUI.setDocument(doc);
  assert.strictEqual(exportElement('export-family').disabled, false);
  exportElement('export-family').onclick();
  assert.strictEqual(exportsUI.messages.length, 0);
  assert(exportElement('log').textContent.includes('exactly one'));
  exportElement('components').checkedInputs = [
    { value: 'button' },
    { value: 'text-input' },
  ];
  exportElement('export-family').onclick();
  assert.strictEqual(exportsUI.messages.length, 0);
  exportElement('components').checkedInputs = [{ value: 'button' }];
  exportElement('export-family').onclick();
  assert.deepStrictEqual(JSON.parse(JSON.stringify(exportsUI.messages[0])), {
    type: 'export-review',
    name: 'Mangrove / Review',
    familyId: 'button',
  });
  assert.strictEqual(exportElement('export-family').disabled, true);
  assert.strictEqual(exportElement('export-review').disabled, true);
  const pngBytes = [137, 80, 78, 71];
  exportsUI.window.onmessage({
    data: {
      pluginMessage: {
        type: 'export',
        result: {
          id: 'family-review-id',
          rootId: 'review-id',
          name: 'Mangrove/Button',
          width: 736,
          height: 1200,
          scope: 'family',
          familyId: 'button',
          bytes: pngBytes,
        },
      },
    },
  });
  assert.strictEqual(exportElement('export-family').disabled, false);
  assert.strictEqual(exportsUI.downloads[0].name, 'Mangrove-Button.png');
  assert.strictEqual(exportsUI.downloads[0].blob.type, 'image/png');
  assert.deepStrictEqual(
    [...new Uint8Array(await exportsUI.downloads[0].blob.arrayBuffer())],
    pngBytes
  );
  assert(exportElement('log').textContent.includes('Family: button.'));
  exportElement('export-review').onclick();
  assert.deepStrictEqual(JSON.parse(JSON.stringify(exportsUI.messages[1])), {
    type: 'export-review',
    name: 'Mangrove / Review',
  });
  exportsUI.window.onmessage({
    data: {
      pluginMessage: {
        type: 'export',
        result: {
          name: 'Mangrove / Review',
          width: 800,
          height: 31328,
          scope: 'review',
          bytes: pngBytes,
        },
      },
    },
  });
  assert.strictEqual(exportsUI.downloads[1].name, 'Mangrove - Review.png');
  assert.deepStrictEqual(
    [...new Uint8Array(await exportsUI.downloads[1].blob.arrayBuffer())],
    pngBytes
  );
  console.log(
    'ok  family PNG requires one selection, serialises export actions and preserves scoped/full download bytes'
  );
  const probesUI = mountUI();
  probesUI.setDocument(doc);
  const probeElement = name => probesUI.elements.get(name);
  probeElement('modes').checkedInputs = [{ value: 'undrr' }];
  probeElement('components').checkedInputs = [
    { value: 'combobox' },
    { value: 'radio' },
  ];
  const deliver = result =>
    probesUI.window.onmessage({
      data: { pluginMessage: { type: 'operation', result } },
    });
  probeElement('build').onclick();
  deliver(JSON.parse(JSON.stringify(built)));
  probeElement('probe-root').value = 'probe:before';
  probeElement('probe-root').oninput();
  assert.equal(probeElement('compare-probes').disabled, false);
  probeElement('prepare-probes').onclick();
  assert.equal(probesUI.messages.at(-1).type, 'prepare-override-probes');
  assert.equal(probeElement('remove-probes').disabled, true);
  const prepared = {
    operation: 'prepare-override-probes',
    rootId: 'probe:synthetic',
    createdNodeIds: ['probe:synthetic'],
    ledger: { evidence: 'synthetic-long-evidence'.repeat(20000) },
    errors: [],
  };
  deliver(prepared);
  assert.equal(probeElement('probe-root').value, prepared.rootId);
  assert.equal(
    probeElement('compare-probes').disabled,
    true,
    'Preparation must invalidate a cached pre-edit build'
  );
  assert(probeElement('log').textContent.length < 1500);
  probeElement('save-operation-report').onclick();
  assert.deepEqual(
    JSON.parse(await probesUI.downloads.at(-1).blob.text()),
    prepared
  );
  probeElement('build').onclick();
  assert.equal(probesUI.messages.at(-1).refreshNarrowReview, false);
  deliver(JSON.parse(JSON.stringify(built)));
  assert.equal(probeElement('compare-probes').disabled, false);
  probeElement('compare-probes').onclick();
  assert.equal(probesUI.messages.at(-1).rootId, prepared.rootId);
  assert.deepEqual(
    JSON.parse(JSON.stringify(probesUI.messages.at(-1).buildResult)),
    JSON.parse(JSON.stringify(built))
  );
  deliver({
    rootId: prepared.rootId,
    passed: true,
    assertions: [{ passed: true }],
    errors: [],
  });
  assert.match(probeElement('log').textContent, /Comparison: passed/);
  probeElement('remove-probes').onclick();
  assert.equal(probesUI.messages.at(-1).type, 'remove-override-probes');
  deliver({
    rootId: prepared.rootId,
    removedNodeIds: [prepared.rootId],
    retained: [],
    errors: [],
  });
  assert.equal(probeElement('probe-root').value, '');
  assert.equal(probeElement('compare-probes').disabled, true);
  console.log(
    'ok  override probes require a fresh post-edit build, persist full report bytes, serialise actions and clear removed root IDs'
  );
}

if (require.main === module)
  main().catch(error => {
    console.error(`FAIL ${error.stack || error}`);
    process.exitCode = 1;
  });
